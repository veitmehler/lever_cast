import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { generateImagePromptWithLLM, generateSimpleImagePrompt } from '@/lib/imageGeneration'
import { decrypt } from '@/lib/encryption'

async function getOrCreateUser(clerkId: string) {
  let user = await prisma.user.findUnique({
    where: { clerkId },
  })

  if (!user) {
    user = await prisma.user.create({
      data: {
        clerkId,
        name: '',
        email: '',
      },
    })
  }

  return user
}

async function getUserApiKeys(userId: string) {
  const apiKeys = await prisma.apiKey.findMany({
    where: { userId },
  })

  const decryptedKeys: Record<string, string> = {}
  apiKeys.forEach((key) => {
    try {
      decryptedKeys[key.provider] = decrypt(key.encryptedKey)
    } catch (error) {
      console.error(`Error decrypting key for ${key.provider}:`, error)
    }
  })

  return decryptedKeys
}

function getDefaultModel(provider: string): string {
  const defaults: Record<string, string> = {
    'fal': 'fal-ai/flux/schnell',
    'openai-dalle': 'dall-e-3',
    'replicate': 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
  }
  return defaults[provider] || 'fal-ai/flux/schnell'
}

/**
 * POST /api/images/generate-prompt - Generate an image prompt using LLM
 * 
 * Body:
 * - postContent: string - The post content to generate prompt from
 * - styleInstructions?: string - Optional style instructions
 * - imageProvider: string - Image generation provider (fal, openai-dalle, replicate)
 * - imageModel?: string - Image model identifier (optional)
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await auth()
    const clerkId = authResult.userId

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { postContent, styleInstructions, imageProvider, imageModel, llmProvider, llmModel } = body

    // Validation
    if (!postContent || typeof postContent !== 'string') {
      return NextResponse.json(
        { error: 'Missing required field: postContent' },
        { status: 400 }
      )
    }

    if (!imageProvider || !['fal', 'openai-dalle', 'replicate'].includes(imageProvider)) {
      return NextResponse.json(
        { error: 'Invalid imageProvider. Must be one of: fal, openai-dalle, replicate' },
        { status: 400 }
      )
    }

    const user = await getOrCreateUser(clerkId)
    const apiKeys = await getUserApiKeys(user.id)

    // Get user's settings for LLM provider and model
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
          defaultImageProvider: null,
          defaultImageModel: null,
          defaultImageStyle: null,
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

    // Determine LLM provider and model for prompt generation
    // Use provided llmProvider and llmModel if available, otherwise fallback to user defaults
    let selectedLLMProvider: string | null = null
    let llmApiKey: string | null = null
    let selectedLLMModel: string | null = null

    if (llmProvider && llmModel) {
      // Use explicitly provided provider and model
      if (apiKeys[llmProvider]) {
        selectedLLMProvider = llmProvider
        llmApiKey = apiKeys[llmProvider]
        selectedLLMModel = llmModel
      } else {
        return NextResponse.json(
          { error: `No API key found for LLM provider: ${llmProvider}` },
          { status: 400 }
        )
      }
    } else {
      // Fallback to user defaults or auto-select
      const userDefaultProvider = settings.defaultProvider || null
      const llmProviderOrder = [userDefaultProvider, 'openai', 'anthropic', 'gemini', 'openrouter'].filter(Boolean)
      
      for (const prov of llmProviderOrder) {
        if (prov && apiKeys[prov]) {
          selectedLLMProvider = prov
          llmApiKey = apiKeys[prov]
          selectedLLMModel = defaultModels[prov] || null
          break
        }
      }
    }

    // Determine image model to use
    const selectedImageModel = imageModel || getDefaultModel(imageProvider)

    // Generate prompt from post content using LLM if available, otherwise use simple prompt
    let prompt: string
    if (selectedLLMProvider && llmApiKey && selectedLLMModel) {
      try {
        console.log(`[Image Prompt] Generating prompt with LLM: ${selectedLLMProvider}, model: ${selectedLLMModel}`)
        prompt = await generateImagePromptWithLLM(
          postContent,
          styleInstructions,
          imageProvider,
          selectedImageModel,
          selectedLLMProvider,
          selectedLLMModel,
          llmApiKey
        )
        console.log(`[Image Prompt] Generated prompt: ${prompt.substring(0, 100)}...`)
      } catch (error) {
        console.error('[Image Prompt] Error generating prompt with LLM:', error)
        
        // Extract user-friendly error message
        let errorMessage = 'Failed to generate prompt'
        if (error instanceof Error) {
          errorMessage = error.message
          // Check for specific error patterns
          if (error.message.includes('overloaded')) {
            errorMessage = 'The model is overloaded. Please try again later.'
          } else if (error.message.includes('rate limit')) {
            errorMessage = 'Rate limit exceeded. Please try again later.'
          } else if (error.message.includes('invalid')) {
            errorMessage = 'Invalid API key or model. Please check your settings.'
          } else if (error.message.includes('503')) {
            errorMessage = 'Service temporarily unavailable. Please try again later.'
          }
        }
        
        return NextResponse.json(
          {
            error: errorMessage,
            details: error instanceof Error ? error.message : String(error),
          },
          { status: 500 }
        )
      }
    } else {
      console.log('[Image Prompt] No LLM API key found, using simple prompt generation')
      prompt = generateSimpleImagePrompt(postContent, styleInstructions)
    }

    return NextResponse.json({
      success: true,
      prompt,
    })
  } catch (error) {
    console.error('[Image Prompt] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate prompt',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

