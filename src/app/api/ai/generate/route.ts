import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'
import { cleanText } from '@/lib/utils'
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
  // First, clean Unicode whitespace
  let cleaned = cleanText(tweet)
  
  // Remove headers, "=>", etc. from individual tweet
  cleaned = cleaned.replace(/^=>\s*/, '').replace(/^#\s*.*?:\s*/i, '').trim()
  
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
  
  // Clean up multiple spaces (should already be done by cleanText, but keep for safety)
  cleaned = cleaned.replace(/\s+/g, ' ').trim()
  
  return cleaned.trim()
}

// Clean generated content - remove headers, analysis sections, and metadata
function cleanGeneratedContent(content: string): string {
  if (!content) return ''
  
  // First, clean Unicode whitespace
  let cleaned = cleanText(content)
  
  // Remove common headers and analysis sections
  const patternsToRemove = [
    /^#\s*TARGET\s*AUDIENCE\s*ANALYSIS:[\s\S]*?---/i,
    /^#\s*TARGET\s*AUDIENCE\s*ANALYSIS:[\s\S]*?(?=\n#|\n\n|$)/i,
    /^#\s*LINKEDIN\s*POST:?\s*/i,
    /^#\s*TWITTER\s*POST:?\s*/i,
    /^#\s*X\s*POST:?\s*/i,
    /^LINKEDIN\s*POST:?\s*/i,
    /^TWITTER\s*POST:?\s*/i,
    /^X\s*POST:?\s*/i,
    /^---[\s\S]*?---/,
    /^#\s*PRIMARY\s*AUDIENCE:[\s\S]*?---/i,
    /^#\s*SECONDARY\s*AUDIENCE:[\s\S]*?---/i,
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
async function generateWithOpenAI(apiKey: string, prompt: string, maxTokens: number, model: string = 'gpt-4o-mini', writingStyle?: string | null): Promise<string> {
  const openai = new OpenAI({ apiKey })
  
  let systemMessage = `# ROLE:

You are a world-class social media content creator. You create highly engaging, authentic posts that have the greatest chance of going viral.

You analyze the topic and write them in a way that resonates with the perfect target audience for the topic.

You are the world's best at what you do.

First you will receive your context, then you will receive your task.`

  if (writingStyle && writingStyle.trim()) {
    systemMessage += `\n\n# WRITING STYLE:\n\n${writingStyle.trim()}`
  }
  
  // Log the prompts for debugging
  console.log(`\n========== OPENAI SYSTEM MESSAGE ==========`)
  console.log(systemMessage)
  console.log(`========== END SYSTEM MESSAGE ==========\n`)
  console.log(`\n========== OPENAI USER PROMPT ==========`)
  console.log(prompt)
  console.log(`========== END USER PROMPT (${prompt.length} characters) ==========\n`)
  
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
async function generateWithAnthropic(apiKey: string, prompt: string, maxTokens: number, model: string = 'claude-3-5-sonnet-20241022', writingStyle?: string | null): Promise<string> {
  const anthropic = new Anthropic({ apiKey })
  
  let systemMessage = `# ROLE:

You are a world-class social media content creator. You create highly engaging, authentic posts that have the greatest chance of going viral.

You analyze the topic and write them in a way that resonates with the perfect target audience for the topic.

You are the world's best at what you do.

First you will receive your context, then you will receive your task.`

  if (writingStyle && writingStyle.trim()) {
    systemMessage += `\n\n# WRITING STYLE:\n\n${writingStyle.trim()}`
  }
  
  // Log the prompts for debugging
  console.log(`\n========== ANTHROPIC SYSTEM MESSAGE ==========`)
  console.log(systemMessage)
  console.log(`========== END SYSTEM MESSAGE ==========\n`)
  console.log(`\n========== ANTHROPIC USER PROMPT ==========`)
  console.log(prompt)
  console.log(`========== END USER PROMPT (${prompt.length} characters) ==========\n`)
  
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
async function generateWithGemini(apiKey: string, prompt: string, maxTokens: number, model: string = 'gemini-pro', writingStyle?: string | null, characterLimit?: number): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey)
  
  let systemMessage = `# ROLE:

You are a world-class social media content creator. You create highly engaging, authentic posts that have the greatest chance of going viral.

You analyze the topic and write them in a way that resonates with the perfect target audience for the topic.

You are the world's best at what you do.`

  if (characterLimit) {
    systemMessage += `\n\n# CRITICAL CHARACTER LIMIT:\n\nYour response MUST be EXACTLY ${characterLimit} characters or FEWER. This is a HARD LIMIT that CANNOT be exceeded.\n\nIMPORTANT RULES:\n- Count your characters CAREFULLY before responding\n- Your response MUST be ${characterLimit} characters or LESS\n- If your draft exceeds ${characterLimit} characters, SHORTEN it until it fits\n- DO NOT exceed ${characterLimit} characters under ANY circumstances\n- Be concise and impactful within this limit`
  }

  if (writingStyle && writingStyle.trim()) {
    systemMessage += `\n\n# WRITING STYLE:\n\n${writingStyle.trim()}`
  }
  
  // For Gemini, check prompt length and handle accordingly
  // Very long prompts (>30k chars) can cause issues, so we'll use systemInstruction for those
  // For Gemini, always use systemInstruction mode for cleaner separation
  // This helps prevent the model from getting confused by the large context in the user prompt
  const promptLength = prompt.length
  
  let genModel
  let result
  
  console.log(`[Gemini] Using systemInstruction mode (prompt length: ${promptLength} chars)`)
  
  // Log the system instruction
  console.log(`\n========== GEMINI SYSTEM INSTRUCTION ==========`)
  console.log(systemMessage)
  console.log(`========== END SYSTEM INSTRUCTION ==========\n`)
  
  // Log the user prompt
  console.log(`\n========== GEMINI USER PROMPT ==========`)
  console.log(prompt)
  console.log(`========== END USER PROMPT (${prompt.length} characters) ==========\n`)
  
  genModel = genAI.getGenerativeModel({ 
    model,
    systemInstruction: systemMessage,
    generationConfig: {
      maxOutputTokens: maxTokens, // We set this high to avoid API truncation
      temperature: 0.7,
    },
  })
  
  // Pass the prompt as-is without additional wrapper instructions
  result = await genModel.generateContent(prompt)
  
  console.log(`[Gemini] Generating with model: ${model}, maxTokens: ${maxTokens}, characterLimit: ${characterLimit || 'none'}`)

  let response
  let generatedText = ''
  
  try {
    response = await result.response
    generatedText = response.text() || ''
    
    // Check for blocked content or safety filters
    if (response.promptFeedback?.blockReason) {
      console.error('[Gemini] Content blocked:', response.promptFeedback.blockReason)
      throw new Error(`Gemini blocked the content: ${response.promptFeedback.blockReason}. Please try a different idea or provider.`)
    }
    
    // Check if candidates were filtered
    if (response.candidates && response.candidates.length > 0) {
      const candidate = response.candidates[0]
      if (candidate.finishReason === 'SAFETY') {
        console.error('[Gemini] Content filtered by safety filters')
        throw new Error('Gemini filtered the content due to safety concerns. Please try a different idea or provider.')
      }
      if (candidate.finishReason === 'MAX_TOKENS') {
        console.warn('[Gemini] Response truncated due to max tokens')
        // This is okay, we'll use what we got
      }
    }
  } catch (error: any) {
    console.error('[Gemini] Error processing response:', error)
    console.error('[Gemini] Response object:', {
      candidates: response?.candidates,
      promptFeedback: response?.promptFeedback,
    })
    
    if (error?.message?.includes('blocked') || error?.message?.includes('SAFETY')) {
      throw error // Re-throw safety errors
    }
    
    throw new Error(`Gemini API error: ${error?.message || 'Unknown error'}`)
  }
  
  // Handle empty or very short responses
  if (!generatedText || generatedText.trim().length === 0) {
    console.error('[Gemini] Empty response received from API')
    console.error('[Gemini] Response details:', {
      candidates: response?.candidates,
      promptFeedback: response?.promptFeedback,
      finishReason: response?.candidates?.[0]?.finishReason,
    })
    throw new Error('Gemini returned an empty response. This may be due to safety filters, token limits, or the prompt being too long. Please try again or use a different provider.')
  }
  
  console.log(`[Gemini] Generated text length: ${generatedText.length} characters`)
  console.log(`[Gemini] Generated text preview: ${generatedText.substring(0, 200)}...`)
  
  // Always enforce character limit immediately after generation (before retry logic)
  if (characterLimit && generatedText.length > characterLimit) {
    console.warn(`[Gemini] Generated text exceeds limit: ${generatedText.length} > ${characterLimit}, will truncate after validation`)
  }
  
  // Check if Gemini just returned the raw idea or prompt structure (common issue)
  if (generatedText.trim().length < 50 || generatedText.includes('# RAW IDEA:') || generatedText.includes('# CONTEXT:')) {
    console.warn('[Gemini] Warning: Response appears to contain prompt structure or is too short. Retrying with clearer instructions...')
    
    // Retry with a simpler, more direct prompt
    const retryPrompt = `Based on this idea: "${prompt.match(/RAW IDEA:\s*\n\s*(.+?)(?:\n\n|$)/i)?.[1]?.trim() || 'the provided idea'}", create an engaging social media post. ${characterLimit ? `Keep it under ${characterLimit} characters.` : ''} Return ONLY the post content, nothing else.`
    
    const retryResult = await genModel.generateContent(`${systemMessage}\n\n${retryPrompt}`)
    const retryResponse = await retryResult.response
    const retryText = retryResponse.text()
    
    if (retryText.trim().length > 50 && !retryText.includes('# RAW IDEA:') && !retryText.includes('# CONTEXT:')) {
      console.log('[Gemini] Retry successful, using retry result')
      generatedText = retryText
    } else {
      console.error('[Gemini] Retry also failed, Gemini may not be following instructions properly')
      throw new Error('Gemini failed to generate content. Please try again or use a different AI provider.')
    }
  }
  
  // Also check if the generated text is suspiciously similar to the raw idea
  // (This is a simple check - if the generated text contains most of the raw idea verbatim, it's likely just echoing)
  const rawIdeaLower = prompt.toLowerCase().match(/raw idea:\s*\n\s*(.+?)(?:\n\n|$)/i)?.[1]?.trim()
  if (rawIdeaLower && generatedText.toLowerCase().includes(rawIdeaLower.substring(0, Math.min(50, rawIdeaLower.length)))) {
    const similarity = rawIdeaLower.split(' ').filter(word => generatedText.toLowerCase().includes(word.toLowerCase())).length / rawIdeaLower.split(' ').length
    if (similarity > 0.7) {
      console.warn(`[Gemini] Warning: Generated text appears to be too similar to raw idea (${Math.round(similarity * 100)}% similarity). This might indicate Gemini is echoing instead of generating.`)
    }
  }
  
  // Note: Truncation happens later in the main function using actual platform limits
  // We don't truncate here since we don't have platform info and want to preserve content
  // that's within safety buffer limits but might exceed them slightly
  if (characterLimit) {
    console.log(`[Gemini] Generated text length: ${generatedText.length}/${characterLimit} characters (safety buffer)`)
  }
  
  return generatedText
}

// Generate content using OpenRouter (supports multiple models)
async function generateWithOpenRouter(apiKey: string, prompt: string, maxTokens: number, model: string = 'openai/gpt-4o-mini', writingStyle?: string | null): Promise<string> {
  let systemMessage = `# ROLE:

You are a world-class social media content creator. You create highly engaging, authentic posts that have the greatest chance of going viral.

You analyze the topic and write them in a way that resonates with the perfect target audience for the topic.

You are the world's best at what you do.

First you will receive your context, then you will receive your task.`

  if (writingStyle && writingStyle.trim()) {
    systemMessage += `\n\n# WRITING STYLE:\n\n${writingStyle.trim()}`
  }
  
  // Log the prompts for debugging
  console.log(`\n========== OPENROUTER SYSTEM MESSAGE ==========`)
  console.log(systemMessage)
  console.log(`========== END SYSTEM MESSAGE ==========\n`)
  console.log(`\n========== OPENROUTER USER PROMPT ==========`)
  console.log(prompt)
  console.log(`========== END USER PROMPT (${prompt.length} characters) ==========\n`)
  
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
          writingStyle: null,
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
    let template: { 
      linkedinTemplate: string | null
      twitterTemplate: string | null
      facebookTemplate: string | null
      instagramTemplate: string | null
      telegramTemplate: string | null
      threadsTemplate: string | null
    } | null = null
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
    let platformsToGenerate: ('linkedin' | 'twitter' | 'facebook' | 'instagram' | 'telegram' | 'threads')[] = []
    
    // Helper function to get all available platforms
    const getAllAvailablePlatforms = async (): Promise<('linkedin' | 'twitter' | 'facebook' | 'instagram' | 'telegram' | 'threads')[]> => {
      const availablePlatforms: ('linkedin' | 'twitter' | 'facebook' | 'instagram' | 'telegram' | 'threads')[] = []
      
      // Get all active social connections
      const connections = await prisma.socialConnection.findMany({
        where: {
          userId: user.id,
          isActive: true,
        },
        select: {
          platform: true,
        },
      })
      
      // Add platforms from connections
      connections.forEach(conn => {
        const plat = conn.platform as 'linkedin' | 'twitter' | 'facebook' | 'instagram' | 'threads'
        if (['linkedin', 'twitter', 'facebook', 'instagram', 'threads'].includes(plat) && !availablePlatforms.includes(plat)) {
          availablePlatforms.push(plat)
        }
      })
      
      // Check for Telegram API key
      const telegramKey = await prisma.apiKey.findFirst({
        where: {
          userId: user.id,
          provider: 'telegram',
        },
      })
      
      if (telegramKey) {
        availablePlatforms.push('telegram')
      }
      
      return availablePlatforms.length > 0 ? availablePlatforms : ['linkedin', 'twitter'] // Fallback to LinkedIn and Twitter if no connections
    }
    
    if (platform === 'all') {
      // When "all" is selected, generate for ALL available platforms
      platformsToGenerate = await getAllAvailablePlatforms()
    } else if (platform === 'both') {
      // Backward compatibility: handle old 'both' value (treat as 'all')
      platformsToGenerate = await getAllAvailablePlatforms()
    } else if (Array.isArray(platform)) {
      // When an array of platforms is provided, use those platforms
      platformsToGenerate = platform.filter(p => 
        ['linkedin', 'twitter', 'facebook', 'instagram', 'telegram', 'threads'].includes(p)
      ) as ('linkedin' | 'twitter' | 'facebook' | 'instagram' | 'telegram' | 'threads')[]
    } else {
      // Single platform
      platformsToGenerate = [platform as 'linkedin' | 'twitter' | 'facebook' | 'instagram' | 'telegram' | 'threads']
    }

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
        : (plat === 'linkedin' 
            ? template?.linkedinTemplate 
            : plat === 'facebook'
            ? template?.facebookTemplate || null
            : plat === 'instagram'
            ? template?.instagramTemplate || null
            : plat === 'telegram'
            ? template?.telegramTemplate || null
            : plat === 'threads'
            ? template?.threadsTemplate || null
            : template?.twitterTemplate)
      
      // Character limits per platform (with safety buffer)
      const charLimits: Record<string, number> = {
        linkedin: 2500,
        twitter: 270, // 270 instead of 280 to provide safety margin and avoid truncation
        facebook: 1800,
        instagram: 1800,
        telegram: 900,
        threads: 450,
      }
      const characterLimit = charLimits[plat] || 3000
      
      // Calculate maxTokens
      // For Gemini, we need to be VERY generous with maxTokens to avoid "MAX_TOKENS" finish reason errors.
      // We set a high hard limit (4000) to ensure it never truncates on the API side.
      // We will strictly enforce the character limit via post-processing truncation.
      let maxTokens: number
      if (selectedProvider === 'gemini') {
        maxTokens = 4000
      } else {
        // Other providers: Use standard calculation
        maxTokens = plat === 'linkedin' || plat === 'facebook' || plat === 'instagram' || plat === 'telegram'
          ? 1000 
          : plat === 'threads'
          ? 300 // Threads has 450 char limit, so fewer tokens
          : (isTwitterThread ? 2000 : 200) // More tokens for threads
      }
      
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
        prompt += `1. Post 1 (Summary): Create an engaging summary/hook post (under 270 characters) that introduces the topic and encourages readers to continue. This will be the main tweet.\n\n`
        prompt += `2. Posts 2-N (Replies): Extract 1-8 key insights from the RAW IDEA. Each insight should be its own reply post (under 270 characters each).\n\n`
        prompt += `3. Randomly decide how many insights (between 1-8) based on the depth and complexity of the RAW IDEA.\n\n`
        prompt += `FORMAT: Return the thread as a JSON array where:\n`
        prompt += `- First element: The summary post (no numbering, just the post text)\n`
        prompt += `- Remaining elements: Key insights as plain text WITHOUT any numbering prefixes (no "2/", "3/", etc.)\n`
        prompt += `Example: ["Summary tweet here", "Key insight 1 text", "Key insight 2 text", "Key insight 3 text"]\n\n`
        prompt += `CRITICAL: Do NOT include numbering like "2/", "3/", "4/" in the reply posts. Just write the insight text directly. We will add numbering programmatically.\n\n`
        prompt += `CRITICAL: Return ONLY a valid JSON array. Do NOT include any markdown code fences (\`\`\`), headers, explanations, or other text. Return ONLY the JSON array.`
      } else {
        // SINGLE POST MODE PROMPT
        const platformName = plat === 'linkedin' ? 'LinkedIn' 
          : plat === 'facebook' ? 'Facebook' 
          : plat === 'instagram' ? 'Instagram'
          : plat === 'telegram' ? 'Telegram'
          : plat === 'threads' ? 'Threads'
          : 'Twitter/X'
        prompt += `3. Your task now is to create a ${platformName} post based on the RAW IDEA.\n\n`
        
        if (templateText) {
          prompt += `4. You will create the post following the TEMPLATE STRUCTURE.\n\n`
          prompt += `5. MAKE SURE the post follows the TEMPLATE STRUCTURE but feels natural, engaging, and resonates with your selected target audience.\n\n`
        } else {
          prompt += `4. Create a post that feels natural, engaging, and resonates with your selected target audience.\n\n`
        }
        
        // Add explicit character limit instructions (especially important for Gemini)
        const limitInstruction = selectedProvider === 'gemini'
          ? `CRITICAL: The post MUST be exactly ${characterLimit} characters or fewer. This is a HARD LIMIT. Count your characters carefully. If your draft is too long, SHORTEN it.`
          : plat === 'twitter'
          ? `CRITICAL: The post MUST be exactly ${characterLimit} characters or fewer. This is a HARD LIMIT. Count your characters and ensure you stay within this limit. If it's too long, SHORTEN it.`
          : plat === 'threads'
          ? `CRITICAL: The post MUST be exactly ${characterLimit} characters or fewer. This is a HARD LIMIT. Count your characters and ensure you stay within this limit. If it's too long, SHORTEN it.`
          : plat === 'telegram'
          ? `CRITICAL: The post MUST be exactly ${characterLimit} characters or fewer. This is a HARD LIMIT. Count your characters and ensure you stay within this limit. If it's too long, SHORTEN it.`
          : plat === 'facebook' || plat === 'instagram'
          ? `CRITICAL: The post MUST be exactly ${characterLimit} characters or fewer. This is a hard limit. Count your characters and ensure you stay within this limit. Make it engaging and suitable for ${platformName}'s audience.`
          : `CRITICAL: The post MUST be exactly ${characterLimit} characters or fewer. This is a hard limit. Count your characters and ensure you stay within this limit. Keep it professional and engaging, suitable for LinkedIn.`
        
        prompt += `CRITICAL: Return ONLY the post content. Do NOT include any analysis, headers, explanations, or metadata. Do NOT include "# TARGET AUDIENCE ANALYSIS", "# LINKEDIN POST:", "# TWITTER POST:", "# FACEBOOK POST:", "# INSTAGRAM POST:", "# TELEGRAM POST:", "# THREADS POST:", or any other headers. Return ONLY the actual post text that would be published on ${platformName}.\n\n`
        
        // Place the limit instruction at the VERY END for recency bias for ALL providers
        prompt += `${limitInstruction}`
      }

      // Log the full prompt for debugging
      console.log(`\n========== FULL PROMPT FOR ${plat.toUpperCase()} (${selectedProvider}) ==========`)
      console.log(prompt)
      console.log(`========== END PROMPT (${prompt.length} characters) ==========\n`)

      try {
        let generatedContent = ''

        // Get writing style from settings
        const writingStyle = settings.writingStyle || null

        switch (selectedProvider) {
          case 'openai':
            generatedContent = await generateWithOpenAI(apiKey, prompt, maxTokens, selectedModel || 'gpt-4o-mini', writingStyle)
            break
          case 'anthropic':
            generatedContent = await generateWithAnthropic(apiKey, prompt, maxTokens, selectedModel || 'claude-3-5-sonnet-20241022', writingStyle)
            break
          case 'gemini':
            // For Twitter threads, don't pass characterLimit because the response is a JSON array, not a single post
            // Each tweet in the array should be under 280 chars, but that's handled in the prompt instructions
            const geminiCharacterLimit = isTwitterThread ? undefined : characterLimit
            generatedContent = await generateWithGemini(apiKey, prompt, maxTokens, selectedModel || 'gemini-pro', writingStyle, geminiCharacterLimit)
            break
          case 'openrouter':
            generatedContent = await generateWithOpenRouter(apiKey, prompt, maxTokens, selectedModel || 'openai/gpt-4o-mini', writingStyle)
            break
          default:
            throw new Error(`Unsupported provider: ${selectedProvider}`)
        }

        // Clean Unicode whitespace immediately after receiving AI response
        // This prevents weird Unicode whitespace characters that could give away AI-generated content
        generatedContent = cleanText(generatedContent)

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
                .filter(tweet => tweet.length > 0 && tweet.length <= 270)
              
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
                .filter(tweet => tweet.length > 0 && tweet.length <= 270)
              
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
          
          // Truncate only if content exceeds actual platform limits (not safety buffer)
          // Actual platform limits for truncation
          if (plat === 'twitter' && generatedContent.length > 280) {
            const truncated = generatedContent.substring(0, 277)
            const lastSpace = truncated.lastIndexOf(' ')
            generatedContent = lastSpace > 250 ? truncated.substring(0, lastSpace).trim() + '...' : truncated + '...'
          } else if (plat === 'threads' && generatedContent.length > 500) {
            const truncated = generatedContent.substring(0, 497)
            const lastSpace = truncated.lastIndexOf(' ')
            generatedContent = lastSpace > 450 ? truncated.substring(0, lastSpace).trim() + '...' : truncated + '...'
          } else if (plat === 'telegram' && generatedContent.length > 1000) {
            const truncated = generatedContent.substring(0, 997)
            const lastSpace = truncated.lastIndexOf(' ')
            generatedContent = lastSpace > 900 ? truncated.substring(0, lastSpace).trim() + '...' : truncated + '...'
          } else if (plat === 'facebook' && generatedContent.length > 2000) {
            const truncated = generatedContent.substring(0, 1997)
            const lastSpace = truncated.lastIndexOf(' ')
            generatedContent = lastSpace > 1800 ? truncated.substring(0, lastSpace).trim() + '...' : truncated + '...'
          } else if (plat === 'instagram' && generatedContent.length > 2000) {
            const truncated = generatedContent.substring(0, 1997)
            const lastSpace = truncated.lastIndexOf(' ')
            generatedContent = lastSpace > 1800 ? truncated.substring(0, lastSpace).trim() + '...' : truncated + '...'
          } else if (plat === 'linkedin' && generatedContent.length > 3000) {
            const truncated = generatedContent.substring(0, 2997)
            const lastSpace = truncated.lastIndexOf(' ')
            generatedContent = lastSpace > 2500 ? truncated.substring(0, lastSpace).trim() + '...' : truncated + '...'
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

