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

// POST /api/ai/analyze-writing-style - Analyze sample text and generate writing style description
export async function POST(request: NextRequest) {
  try {
    const authResult = await auth()
    const clerkId = authResult.userId

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { sampleText } = body

    if (!sampleText || typeof sampleText !== 'string' || sampleText.trim().split(/\s+/).length < 500) {
      return NextResponse.json(
        { error: 'Sample text must be at least 500 words' },
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

    // Try providers in order of preference
    const userDefaultProvider = settings.defaultProvider || null
    const providerOrder = [userDefaultProvider, 'openai', 'anthropic', 'gemini', 'openrouter'].filter(Boolean)

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

    if (!apiKey || !selectedProvider) {
      return NextResponse.json(
        { error: 'No API key found. Please add an API key in Settings.' },
        { status: 400 }
      )
    }

    // Generate writing style description using AI
    const systemMessage = `# ROLE: 

You are an expert writing analyst and AI prompt engineer. Your mission is to meticulously analyze the writing style of the provided text and then generate a high-fidelity, reusable prompt that can replicate this style for any new content and topic.

You will complete this mission in two distinct tasks.

# TASK 1: DETAILED STYLE ANALYSIS

First, you will analyze the provided article. Do not write the final prompt yet. Simply perform and present a deep analysis of the following components of the text.

* **Tone & Mood:** (e.g., Formal, informal, academic, witty, sarcastic, empathetic, professional, objective, urgent, pessimistic, optimistic?)

* **Diction & Vocabulary:** (e.g., Simple, complex, technical, jargon-heavy, conversational, poetic, business-casual, formal, archaic? Provide examples.)

* **Sentence Structure (Syntax):** (e.g., Are sentences long and flowing, or short and punchy? Is there variation? Is it heavy on simple, compound, or complex sentences? Use of active vs. passive voice.)

* **Punctuation & Formatting:** (e.g., Does it use em dashes for effect? Many semicolons? Short paragraphs? Bullet points? Bolding?)

* **Rhetorical Devices & Techniques:** (e.g., Use of metaphors, analogies, rhetorical questions, anaphora (repetition), storytelling, data-driven arguments, humor?)

* **Perspective (Point of View):** (e.g., First person (I/we), second person (you), or third person (he/she/they)?)

* **Target Audience & Assumed Knowledge:** (e.g., Who is this written for? Experts, beginners, general public? What does the author assume the reader already knows?)

* **Core Purpose:** (e.g., Is the primary goal to inform, persuade, entertain, instruct, or inspire?)

# TASK 2: REUSABLE STYLE PROMPT

Based *only* on your detailed analysis from TASK 1, you will now generate a comprehensive, reusable prompt. This prompt must be a set of direct instructions for an AI, designed to perfectly capture and replicate the original author's voice and style on a completely new topic.

The prompt must:

1.  Be structured as a complete "Persona" or "Style Guide" prompt.

2.  Synthesize all the key findings from your analysis into actionable rules (e.g., "Use a professional yet witty tone," "Employ short, declarative sentences mixed with occasional complex ones for rhythm," "Avoid jargon," "Address the reader directly using 'you'").

# OUTPUT INSTRUCTIONS:

Return ONLY a clear, concise description (2 paragraphs) that can be used as writing style instructions for AI content generation. Do not include any analysis, explanations, or meta-commentary. Just the style description.`

    const userPrompt = `# ARTICLE TO ANALYZE:

${sampleText.trim()}`

    let writingStyleDescription = ''

    try {
      switch (selectedProvider) {
        case 'openai': {
          const openai = new OpenAI({ apiKey })
          const model = selectedModel || 'gpt-4o-mini'
          const response = await openai.chat.completions.create({
            model,
            messages: [
              { role: 'system', content: systemMessage },
              { role: 'user', content: userPrompt },
            ],
            max_tokens: 300,
            temperature: 0.7,
          })
          writingStyleDescription = response.choices[0]?.message?.content || ''
          break
        }
        case 'anthropic': {
          const anthropic = new Anthropic({ apiKey })
          const model = selectedModel || 'claude-3-5-sonnet-20241022'
          const response = await anthropic.messages.create({
            model,
            max_tokens: 300,
            system: systemMessage,
            messages: [
              { role: 'user', content: userPrompt },
            ],
          })
          writingStyleDescription = response.content[0].type === 'text' ? response.content[0].text : ''
          break
        }
        case 'gemini': {
          const genAI = new GoogleGenerativeAI(apiKey)
          const model = genAI.getGenerativeModel({ model: selectedModel || 'gemini-pro' })
          const result = await model.generateContent(`${systemMessage}\n\n${userPrompt}`)
          const response = await result.response
          writingStyleDescription = response.text()
          break
        }
        case 'openrouter': {
          const model = selectedModel || 'openai/gpt-4o-mini'
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
                { role: 'system', content: systemMessage },
                { role: 'user', content: userPrompt },
              ],
              max_tokens: 300,
              temperature: 0.7,
            }),
          })
          
          if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Unknown error' }))
            throw new Error(error.error?.message || 'OpenRouter API error')
          }
          
          const data = await response.json()
          writingStyleDescription = data.choices?.[0]?.message?.content || ''
          break
        }
        default:
          throw new Error(`Unsupported provider: ${selectedProvider}`)
      }

      // Clean the description
      writingStyleDescription = writingStyleDescription.trim()
      
      // Remove any markdown formatting if present
      writingStyleDescription = writingStyleDescription.replace(/^```[\w]*\n?/gm, '').replace(/```$/gm, '').trim()
      
      // Remove any leading/trailing quotes
      writingStyleDescription = writingStyleDescription.replace(/^["']|["']$/g, '').trim()

      if (!writingStyleDescription) {
        throw new Error('Failed to generate writing style description')
      }

      return NextResponse.json({
        writingStyle: writingStyleDescription,
      })
    } catch (error) {
      console.error('Error analyzing writing style:', error)
      return NextResponse.json(
        { 
          error: 'Failed to analyze writing style',
          details: error instanceof Error ? error.message : String(error)
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error in analyze-writing-style route:', error)
    return NextResponse.json(
      { 
        error: 'Failed to analyze writing style',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

