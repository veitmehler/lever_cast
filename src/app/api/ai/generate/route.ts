import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Helper function to get or create user
async function getOrCreateUser(clerkId: string) {
  let user = await prisma.user.findUnique({
    where: { clerkId },
  })

  if (!user) {
    const clerkUser = await currentUser()
    
    if (!clerkUser) {
      throw new Error('User not found in Clerk')
    }

    const email = clerkUser.emailAddresses.find(
      (e) => e.id === clerkUser.primaryEmailAddressId
    )?.emailAddress

    if (!email) {
      throw new Error('No email found')
    }

    const name = clerkUser.firstName
      ? `${clerkUser.firstName}${clerkUser.lastName ? ' ' + clerkUser.lastName : ''}`
      : email.split('@')[0]

    user = await prisma.user.create({
      data: {
        clerkId,
        name,
        email,
      },
    })
  }

  return user
}

// Get user's API keys, ordered by preference
async function getUserApiKeys(userId: string) {
  const apiKeys = await prisma.apiKey.findMany({
    where: { userId },
    select: {
      provider: true,
      encryptedKey: true,
    },
  })

  // Decrypt keys and return in preference order
  const decryptedKeys: Record<string, string> = {}
  apiKeys.forEach(key => {
    decryptedKeys[key.provider] = decrypt(key.encryptedKey)
  })

  return decryptedKeys
}

function cleanSingleTweet(tweet: string): string {
  // Remove headers, "=>", etc. from individual tweet
  let cleaned = tweet.replace(/^=>\s*/, '').replace(/^#\s*.*?:\s*/i, '').trim()
  
  // Remove JSON code fences
  cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/g, '').replace(/```\s*$/g, '')
  
  // Remove numbered prefixes like "1/10", "2/10", etc. (but keep the content)
  cleaned = cleaned.replace(/^\d+\/\d+\s*/, '').trim()
  
  // Remove standalone numbering patterns like "2/", "3/", etc. anywhere in the text
  // This handles cases where AI generates "2/7 2/ Text" or "Text 2/ more text"
  // Match patterns like "2/", "3/", "10/" with optional spaces around them
  cleaned = cleaned.replace(/\s*\d+\/\s*/g, ' ').trim()
  
  // Remove any remaining patterns like "2/7 2/" at the start
  cleaned = cleaned.replace(/^\d+\/\d+\s+\d+\/\s*/, '').trim()
  
  // Clean up multiple spaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim()
  
  return cleaned.trim()
}

// Clean generated content - remove headers, analysis sections, and metadata
function cleanGeneratedContent(content: string): string {
  if (!content) return ''
  
  let cleaned = content.trim()
  
  // Remove common headers and analysis sections
  const patternsToRemove = [
    /^#\s*TARGET\s*AUDIENCE\s*ANALYSIS:.*?---/is,
    /^#\s*TARGET\s*AUDIENCE\s*ANALYSIS:.*?(?=\n#|\n\n|$)/is,
    /^#\s*LINKEDIN\s*POST:?\s*/i,
    /^#\s*TWITTER\s*POST:?\s*/i,
    /^#\s*X\s*POST:?\s*/i,
    /^LINKEDIN\s*POST:?\s*/i,
    /^TWITTER\s*POST:?\s*/i,
    /^X\s*POST:?\s*/i,
    /^---.*?---/s,
    /^#\s*PRIMARY\s*AUDIENCE:.*?---/is,
    /^#\s*SECONDARY\s*AUDIENCE:.*?---/is,
  ]
  
  for (const pattern of patternsToRemove) {
    cleaned = cleaned.replace(pattern, '').trim()
  }
  
  // Remove markdown headers at the start
  cleaned = cleaned.replace(/^#{1,6}\s+.*?\n/gm, '')
  
  // Remove "=>" markers
  cleaned = cleaned.replace(/^=>\s*/gm, '')
  
  // Remove horizontal rules
  cleaned = cleaned.replace(/^---+\s*$/gm, '')
  
  // Remove empty lines at the start and end
  cleaned = cleaned.replace(/^\s+|\s+$/g, '')
  
  // If content still has multiple sections separated by "---", take only the last one (usually the actual post)
  const sections = cleaned.split(/---+/)
  if (sections.length > 1) {
    // Find the section that looks most like a post (not analysis)
    const postSection = sections.find(section => {
      const trimmed = section.trim()
      return trimmed.length > 20 && 
             !trimmed.match(/^(PRIMARY|SECONDARY|TARGET)\s*AUDIENCE/i) &&
             !trimmed.match(/^#\s*(ANALYSIS|AUDIENCE|POST)/i)
    })
    if (postSection) {
      cleaned = postSection.trim()
    } else {
      // Fallback: use the last section
      cleaned = sections[sections.length - 1].trim()
    }
  }
  
  return cleaned.trim()
}

// Extract key points from the idea
function extractKeyPoints(idea: string): { point1: string; point2: string; point3: string } {
  const sentences = idea.split(/[.!?]+/).filter(s => s.trim().length > 0)
  
  if (sentences.length >= 3) {
    return {
      point1: sentences[0].trim(),
      point2: sentences[1].trim(),
      point3: sentences[2].trim(),
    }
  }
  
  // Fallback to generic points
  return {
    point1: 'Start with why, not what',
    point2: 'Listen more than you talk',
    point3: 'Execution beats perfection',
  }
}

// Apply template with variable substitution
function applyTemplate(template: string, idea: string): string {
  if (!template) {
    return idea
  }
  
  const points = extractKeyPoints(idea)
  
  return template
    .replace(/{idea}/g, idea)
    .replace(/{point1}/g, points.point1)
    .replace(/{point2}/g, points.point2)
    .replace(/{point3}/g, points.point3)
}

// Generate content using OpenAI
async function generateWithOpenAI(apiKey: string, prompt: string, maxTokens: number, model: string = 'gpt-4o-mini'): Promise<string> {
  const openai = new OpenAI({ apiKey })
  
  const systemMessage = `# ROLE:

You are a world-class social media content creator. You create highly engaging, authentic posts that have the greatest chance of going viral.

You analyze the topic and write them in a way that resonates with the perfect target audience for the topic.

You are the world's best at what you do.

First you will receive your context, then you will receive your task.`
  
  const response = await openai.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content: systemMessage,
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    max_tokens: maxTokens,
    temperature: 0.7,
  })

  return response.choices[0]?.message?.content || ''
}

// Generate content using Anthropic Claude
async function generateWithAnthropic(apiKey: string, prompt: string, maxTokens: number, model: string = 'claude-3-5-sonnet-20241022'): Promise<string> {
  const anthropic = new Anthropic({ apiKey })
  
  const systemMessage = `# ROLE:

You are a world-class social media content creator. You create highly engaging, authentic posts that have the greatest chance of going viral.

You analyze the topic and write them in a way that resonates with the perfect target audience for the topic.

You are the world's best at what you do.

First you will receive your context, then you will receive your task.`
  
  const response = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    system: systemMessage,
  })

  const textContent = response.content.find((block: { type: string; text?: string }) => block.type === 'text')
  return (textContent as { text: string } | undefined)?.text || ''
}

// Generate content using Google Gemini
async function generateWithGemini(apiKey: string, prompt: string, maxTokens: number, model: string = 'gemini-pro'): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey)
  
  const systemMessage = `# ROLE:

You are a world-class social media content creator. You create highly engaging, authentic posts that have the greatest chance of going viral.

You analyze the topic and write them in a way that resonates with the perfect target audience for the topic.

You are the world's best at what you do.

First you will receive your context, then you will receive your task.`
  
  const genModel = genAI.getGenerativeModel({ 
    model,
    systemInstruction: systemMessage,
  })
  
  const fullPrompt = `${systemMessage}\n\n${prompt}`
  
  const result = await genModel.generateContent(fullPrompt, {
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature: 0.7,
    },
  })

  const response = await result.response
  return response.text()
}

// Generate content using OpenRouter (supports multiple models)
async function generateWithOpenRouter(apiKey: string, prompt: string, maxTokens: number, model: string = 'openai/gpt-4o-mini'): Promise<string> {
  const systemMessage = `# ROLE:

You are a world-class social media content creator. You create highly engaging, authentic posts that have the greatest chance of going viral.

You analyze the topic and write them in a way that resonates with the perfect target audience for the topic.

You are the world's best at what you do.

First you will receive your context, then you will receive your task.`
  
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'Levercast',
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: systemMessage,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error?.message || 'OpenRouter API error')
  }

  const data = await response.json()
  return data.choices[0]?.message?.content || ''
}

// POST /api/ai/generate - Generate content using real AI
export async function POST(request: NextRequest) {
  try {
    const authResult = await auth()
    const clerkId = authResult.userId

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { rawIdea, platform, templateId, provider, twitterFormat } = body

    if (!rawIdea || !platform) {
      return NextResponse.json(
        { error: 'Missing required fields: rawIdea, platform' },
        { status: 400 }
      )
    }

    const user = await getOrCreateUser(clerkId)
    const apiKeys = await getUserApiKeys(user.id)

    // Get user's settings for default provider and model
    let settings = await prisma.settings.findUnique({
      where: { userId: user.id },
    })

    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          userId: user.id,
          theme: 'light',
          sidebarState: 'open',
          defaultProvider: null,
          defaultModel: null,
        },
      })
    }

    // Parse default models from settings
    let defaultModels: Record<string, string> = {}
    if (settings.defaultModel) {
      try {
        defaultModels = JSON.parse(settings.defaultModel)
      } catch {
        // Ignore parse errors
      }
    }

    // Get template if provided
    let template: { linkedinTemplate: string | null; twitterTemplate: string | null } | null = null
    if (templateId) {
      template = await prisma.template.findFirst({
        where: {
          id: templateId,
          userId: user.id,
        },
      })
    } else {
      // Get default template
      const templates = await prisma.template.findMany({
        where: { userId: user.id },
        orderBy: { isDefault: 'desc' },
      })
      template = templates.find(t => t.isDefault) || templates[0] || null
    }

    // Determine which platform content to generate
    const platformsToGenerate: ('linkedin' | 'twitter')[] = 
      platform === 'both' ? ['linkedin', 'twitter'] : [platform]

    const result: Record<string, string> = {}

    // Try providers in order of preference
    // If provider is specified in request, use it first
    // Otherwise, use user's default provider, then fallback to preference order
    const userDefaultProvider = settings.defaultProvider || null
    const providerOrder = provider 
      ? [provider, userDefaultProvider, 'openai', 'anthropic', 'gemini', 'openrouter'].filter(Boolean)
      : [userDefaultProvider, 'openai', 'anthropic', 'gemini', 'openrouter'].filter(Boolean)

    let selectedProvider: string | null = null
    let apiKey: string | null = null
    let selectedModel: string | null = null

    for (const prov of providerOrder) {
      if (apiKeys[prov]) {
        selectedProvider = prov
        apiKey = apiKeys[prov]
        // Get model for this provider from settings or use default
        selectedModel = defaultModels[prov] || null
        break
      }
    }

    // If no API key found, fall back to template-based generation
    if (!selectedProvider || !apiKey) {
      return NextResponse.json(
        {
          error: 'No API key found',
          provider: 'template',
          message: 'No API key found. Using template-based generation.',
          requiresApiKey: true,
        },
        { status: 400 }
      )
    }

    // Generate content for each platform
    for (const plat of platformsToGenerate) {
      const isTwitterThread = plat === 'twitter' && twitterFormat === 'thread'
      
      // For threads, skip templates; for single posts, use templates
      const templateText = isTwitterThread 
        ? null 
        : (plat === 'linkedin' ? template?.linkedinTemplate : template?.twitterTemplate)
      
      const maxTokens = plat === 'linkedin' 
        ? 1000 
        : (isTwitterThread ? 2000 : 200) // More tokens for threads
      
      // Build prompt using the new structure
      let prompt = `# CONTEXT:\n\n## RAW IDEA:\n\n${rawIdea}\n\n`
      
      if (isTwitterThread) {
        // THREAD MODE: Skip template, generate thread
        prompt += `## TEMPLATE STRUCTURE:\n\nNo template structure. Create a thread with multiple posts.\n\n`
      } else if (templateText) {
        const formattedTemplate = applyTemplate(templateText, rawIdea)
        prompt += `## TEMPLATE STRUCTURE:\n\n${formattedTemplate}\n\n`
      } else {
        prompt += `## TEMPLATE STRUCTURE:\n\nNo specific template provided. Use your expertise to create an engaging post.\n\n`
      }
      
      prompt += `# TASK:\n\n`
      prompt += `1. Carefully review your CONTEXT.\n\n`
      prompt += `2. Identify the exact target audience for the RAW IDEA (do this mentally, do not include it in your response).\n\n`
      
      if (isTwitterThread) {
        // THREAD MODE PROMPT
        prompt += `3. Your task now is to create a Twitter/X thread with multiple posts based on the RAW IDEA.\n\n`
        prompt += `STRUCTURE:\n`
        prompt += `1. Post 1 (Summary): Create an engaging summary/hook post (under 280 characters) that introduces the topic and encourages readers to continue. This will be the main tweet.\n\n`
        prompt += `2. Posts 2-N (Replies): Extract 1-8 key insights from the RAW IDEA. Each insight should be its own reply post (under 280 characters each).\n\n`
        prompt += `3. Randomly decide how many insights (between 1-8) based on the depth and complexity of the RAW IDEA.\n\n`
        prompt += `FORMAT: Return the thread as a JSON array where:\n`
        prompt += `- First element: The summary post (no numbering, just the post text)\n`
        prompt += `- Remaining elements: Key insights as plain text WITHOUT any numbering prefixes (no "2/", "3/", etc.)\n`
        prompt += `Example: ["Summary tweet here", "Key insight 1 text", "Key insight 2 text", "Key insight 3 text"]\n\n`
        prompt += `CRITICAL: Do NOT include numbering like "2/", "3/", "4/" in the reply posts. Just write the insight text directly. We will add numbering programmatically.\n\n`
        prompt += `CRITICAL: Return ONLY a valid JSON array. Do NOT include any markdown code fences (\`\`\`), headers, explanations, or other text. Return ONLY the JSON array.`
      } else {
        // SINGLE POST MODE PROMPT
        prompt += `3. Your task now is to create a ${plat === 'linkedin' ? 'LinkedIn' : 'Twitter/X'} post based on the RAW IDEA.\n\n`
        
        if (templateText) {
          prompt += `4. You will create the post following the TEMPLATE STRUCTURE.\n\n`
          prompt += `5. MAKE SURE the post follows the TEMPLATE STRUCTURE but feels natural, engaging, and resonates with your selected target audience.\n\n`
        } else {
          prompt += `4. Create a post that feels natural, engaging, and resonates with your selected target audience.\n\n`
        }
        
        if (plat === 'twitter') {
          prompt += `IMPORTANT: Keep the post under 280 characters.\n\n`
        } else {
          prompt += `Keep it professional and engaging, suitable for LinkedIn.\n\n`
        }
        
        prompt += `CRITICAL: Return ONLY the post content. Do NOT include any analysis, headers, explanations, or metadata. Do NOT include "# TARGET AUDIENCE ANALYSIS", "# LINKEDIN POST:", "# TWITTER POST:", or any other headers. Return ONLY the actual post text that would be published on ${plat === 'linkedin' ? 'LinkedIn' : 'Twitter/X'}.`
      }

      try {
        let generatedContent = ''

        switch (selectedProvider) {
          case 'openai':
            generatedContent = await generateWithOpenAI(apiKey, prompt, maxTokens, selectedModel || 'gpt-4o-mini')
            break
          case 'anthropic':
            generatedContent = await generateWithAnthropic(apiKey, prompt, maxTokens, selectedModel || 'claude-3-5-sonnet-20241022')
            break
          case 'gemini':
            generatedContent = await generateWithGemini(apiKey, prompt, maxTokens, selectedModel || 'gemini-pro')
            break
          case 'openrouter':
            generatedContent = await generateWithOpenRouter(apiKey, prompt, maxTokens, selectedModel || 'openai/gpt-4o-mini')
            break
          default:
            throw new Error(`Unsupported provider: ${selectedProvider}`)
        }

        if (isTwitterThread) {
          // THREAD MODE: Parse as JSON array
          // First, clean up any code fences or extra formatting
          let cleanedContent = generatedContent.trim()
          
          // Remove JSON code fences (```json, ```)
          cleanedContent = cleanedContent.replace(/^```json\s*/i, '').replace(/^```\s*/g, '').replace(/```\s*$/g, '')
          
          // Try to find JSON array in the content (handle cases where there's extra text)
          const jsonMatch = cleanedContent.match(/\[[\s\S]*\]/)
          if (jsonMatch) {
            cleanedContent = jsonMatch[0]
          } else {
            // If no JSON array found, try to construct one from lines
            const lines = cleanedContent.split('\n').filter(line => {
              const trimmed = line.trim()
              return trimmed.length > 0 && 
                     !trimmed.match(/^```/) && 
                     !trimmed.match(/^json$/i) &&
                     trimmed !== '[' &&
                     trimmed !== ']'
            })
            
            if (lines.length > 0) {
              // Try to parse each line as a JSON string
              const parsedLines = lines.map(line => {
                let cleaned = line.trim()
                // Remove quotes and commas
                cleaned = cleaned.replace(/^["']|["'],?\s*$/g, '')
                // Remove JSON array brackets if present
                cleaned = cleaned.replace(/^\[/, '').replace(/\]$/, '')
                return cleaned.trim()
              }).filter(line => line.length > 0)
              
              if (parsedLines.length > 0) {
                cleanedContent = JSON.stringify(parsedLines)
              }
            }
          }
          
          try {
            const parsed = JSON.parse(cleanedContent.trim())
            if (Array.isArray(parsed) && parsed.length > 0) {
              // Validate and clean each tweet
              const validTweets = parsed
                .map((tweet, index) => {
                  // Clean the tweet first to remove ALL numbering patterns
                  let cleaned = cleanSingleTweet(String(tweet))
                  
                  // For replies (index > 0), add correct numbering like "2/7", "3/7", etc.
                  if (index > 0) {
                    const totalCount = parsed.length
                    cleaned = `${index + 1}/${totalCount} ${cleaned}`
                  }
                  // Summary (index 0) should have no numbering
                  
                  return cleaned
                })
                .filter(tweet => tweet.length > 0 && tweet.length <= 280)
              
              if (validTweets.length === 0) {
                throw new Error('No valid tweets in thread')
              }
              
              // Store as JSON string
              result[plat] = JSON.stringify(validTweets)
            } else {
              throw new Error('Invalid thread format')
            }
          } catch {
            // If parsing fails, try to extract tweets from text
            const lines = generatedContent.split('\n').filter(line => {
              const trimmed = line.trim()
              return trimmed.length > 0 && 
                     !trimmed.match(/^```/) && 
                     !trimmed.match(/^json$/i) &&
                     trimmed !== '[' &&
                     trimmed !== ']'
            })
            
            if (lines.length > 1) {
              const tweets = lines
                .map(line => {
                  // Remove code fences
                  let cleaned = line.replace(/^```json\s*/i, '').replace(/^```\s*/g, '').replace(/```\s*$/g, '')
                  // Remove JSON array brackets
                  cleaned = cleaned.replace(/^\[/, '').replace(/\]$/, '')
                  // Remove quotes and commas
                  cleaned = cleaned.replace(/^["']|["'],?\s*$/g, '')
                  return cleaned.trim()
                })
                .filter(line => line.length > 0)
                .map((line, index) => {
                  // Remove existing numbering (both "2/7" and standalone "2/")
                  let cleaned = line.replace(/^\d+\/\d+\s*/, '').replace(/^\d+\/\s*/, '').trim()
                  // Also remove any standalone numbering patterns in the middle
                  cleaned = cleaned.replace(/\s+\d+\/\s*/g, ' ').trim()
                  
                  // Add numbering for replies only
                  if (index > 0) {
                    cleaned = `${index + 1}/${lines.length} ${cleaned}`
                  }
                  
                  return cleanSingleTweet(cleaned)
                })
                .filter(tweet => tweet.length > 0 && tweet.length <= 280)
              
              if (tweets.length > 0) {
                result[plat] = JSON.stringify(tweets)
              } else {
                throw new Error('Failed to parse thread')
              }
            } else {
              throw new Error('Failed to generate thread')
            }
          }
        } else {
          // SINGLE POST MODE: Store as plain string
          generatedContent = cleanGeneratedContent(generatedContent)
          
          // For Twitter, ensure it's under 280 characters
          if (plat === 'twitter' && generatedContent.length > 280) {
            generatedContent = generatedContent.substring(0, 277) + '...'
          }

          result[plat] = generatedContent || rawIdea
        }
      } catch (error) {
        console.error(`Error generating ${plat} content with ${selectedProvider}:`, error)
        
        // Fallback to template if AI generation fails (only for single posts)
        if (!isTwitterThread && templateText) {
          result[plat] = applyTemplate(templateText, rawIdea)
        } else {
          result[plat] = rawIdea
        }
      }
    }

    return NextResponse.json({
      content: result,
      provider: selectedProvider,
    })
  } catch (error) {
    console.error('Error in AI generation:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate content',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

