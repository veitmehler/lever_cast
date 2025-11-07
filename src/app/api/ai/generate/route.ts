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

// Clean generated content - remove headers, analysis sections, and metadata
function cleanGeneratedContent(content: string, platform: 'linkedin' | 'twitter'): string {
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

  const textContent = response.content.find((block: any) => block.type === 'text')
  return textContent?.text || ''
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
    const { rawIdea, platform, templateId, provider } = body

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
      } catch (e) {
        // Ignore parse errors
      }
    }

    // Get template if provided
    let template: any = null
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
      const templateText = plat === 'linkedin' ? template?.linkedinTemplate : template?.twitterTemplate
      const maxTokens = plat === 'linkedin' ? 1000 : 200 // LinkedIn allows more, Twitter is 280 chars
      
      // Build prompt using the new structure
      let prompt = `# CONTEXT:\n\n## RAW IDEA:\n\n${rawIdea}\n\n`
      
      if (templateText) {
        const formattedTemplate = applyTemplate(templateText, rawIdea)
        prompt += `## TEMPLATE STRUCTURE:\n\n${formattedTemplate}\n\n`
      } else {
        prompt += `## TEMPLATE STRUCTURE:\n\nNo specific template provided. Use your expertise to create an engaging post.\n\n`
      }
      
      prompt += `# TASK:\n\n`
      prompt += `1. Carefully review your CONTEXT.\n\n`
      prompt += `2. Identify the exact target audience for the RAW IDEA (do this mentally, do not include it in your response).\n\n`
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

        // Clean up the response - remove any headers, analysis sections, etc.
        generatedContent = cleanGeneratedContent(generatedContent, plat)
        
        // For Twitter, ensure it's under 280 characters
        if (plat === 'twitter' && generatedContent.length > 280) {
          generatedContent = generatedContent.substring(0, 277) + '...'
        }

        result[plat] = generatedContent || rawIdea
      } catch (error) {
        console.error(`Error generating ${plat} content with ${selectedProvider}:`, error)
        
        // Fallback to template if AI generation fails
        if (templateText) {
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

