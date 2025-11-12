import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'
import {
  generateImagePromptWithLLM,
  generateSimpleImagePrompt,
  generateWithFalAI,
  generateWithOpenAIDALLE,
  generateWithReplicate,
} from '@/lib/imageGeneration'
import { uploadImageToStorage } from '@/lib/supabase'

// Helper function to get or create user
async function getOrCreateUser(clerkId: string) {
  let user = await prisma.user.findUnique({
    where: { clerkId },
  })

  if (!user) {
    const { currentUser } = await import('@clerk/nextjs/server')
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

// Get user's API keys
async function getUserApiKeys(userId: string) {
  const apiKeys = await prisma.apiKey.findMany({
    where: { userId },
    select: {
      provider: true,
      encryptedKey: true,
    },
  })

  const decryptedKeys: Record<string, string> = {}
  apiKeys.forEach(key => {
    decryptedKeys[key.provider] = decrypt(key.encryptedKey)
  })

  return decryptedKeys
}

/**
 * POST /api/images/generate - Generate an image using AI
 * 
 * Body:
 * - postContent: string - The post content to generate prompt from
 * - styleInstructions?: string - Optional style instructions
 * - provider: string - Image generation provider (fal, openai-dalle, replicate)
 * - model?: string - Model identifier (optional, uses default if not provided)
 * - aspectRatio?: string - Image aspect ratio (1:1, 16:9, 9:16, 4:3, 3:4)
 * - draftId?: string - Optional draft ID to associate with
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await auth()
    const clerkId = authResult.userId

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { postContent, styleInstructions, provider, model, aspectRatio, draftId } = body

    // Validation
    if (!postContent || typeof postContent !== 'string') {
      return NextResponse.json(
        { error: 'Missing required field: postContent' },
        { status: 400 }
      )
    }

    if (!provider || !['fal', 'openai-dalle', 'replicate'].includes(provider)) {
      return NextResponse.json(
        { error: 'Invalid provider. Must be one of: fal, openai-dalle, replicate' },
        { status: 400 }
      )
    }

    const user = await getOrCreateUser(clerkId)
    const apiKeys = await getUserApiKeys(user.id)

    // Get API key for the image provider
    const imageApiKey = apiKeys[provider]
    if (!imageApiKey) {
      return NextResponse.json(
        { error: `No API key found for ${provider}. Please add your API key in settings.` },
        { status: 400 }
      )
    }

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
    // Try user's default provider first, then fallback order
    const userDefaultProvider = settings.defaultProvider || null
    const llmProviderOrder = [userDefaultProvider, 'openai', 'anthropic', 'gemini', 'openrouter'].filter(Boolean)
    
    let selectedLLMProvider: string | null = null
    let llmApiKey: string | null = null
    let selectedLLMModel: string | null = null

    for (const prov of llmProviderOrder) {
      if (apiKeys[prov]) {
        selectedLLMProvider = prov
        llmApiKey = apiKeys[prov]
        selectedLLMModel = defaultModels[prov] || null
        break
      }
    }

    // Determine image model to use
    let selectedModel = model
    if (!selectedModel) {
      // Get default model from settings
      if (settings?.defaultImageModel) {
        try {
          const defaultImageModels = JSON.parse(settings.defaultImageModel)
          selectedModel = defaultImageModels[provider] || getDefaultModel(provider)
        } catch {
          selectedModel = getDefaultModel(provider)
        }
      } else {
        selectedModel = getDefaultModel(provider)
      }
    }

    // Generate prompt from post content using LLM if available, otherwise use simple prompt
    let prompt: string
    if (selectedLLMProvider && llmApiKey && selectedLLMModel) {
      try {
        console.log(`[Image Generation] Generating prompt with LLM: ${selectedLLMProvider}, model: ${selectedLLMModel}`)
        prompt = await generateImagePromptWithLLM(
          postContent,
          styleInstructions,
          provider,
          selectedModel,
          selectedLLMProvider,
          selectedLLMModel,
          llmApiKey
        )
        console.log(`[Image Generation] Generated prompt: ${prompt.substring(0, 100)}...`)
      } catch (error) {
        console.error('[Image Generation] Error generating prompt with LLM, falling back to simple prompt:', error)
        prompt = generateSimpleImagePrompt(postContent, styleInstructions)
      }
    } else {
      console.log('[Image Generation] No LLM API key found, using simple prompt generation')
      prompt = generateSimpleImagePrompt(postContent, styleInstructions)
    }

    // Generate image based on provider
    let imageBuffer: Buffer

    try {
      console.log(`[Image Generation] Generating with ${provider}, model: ${selectedModel}`)
      
      switch (provider) {
        case 'fal':
          imageBuffer = await generateWithFalAI(imageApiKey, prompt, selectedModel)
          break
        case 'openai-dalle':
          const size = getSizeFromAspectRatio(aspectRatio)
          imageBuffer = await generateWithOpenAIDALLE(imageApiKey, prompt, selectedModel, size)
          break
        case 'replicate':
          imageBuffer = await generateWithReplicate(imageApiKey, prompt, selectedModel)
          break
        default:
          throw new Error(`Unsupported provider: ${provider}`)
      }
      
      console.log(`[Image Generation] Successfully generated image, size: ${imageBuffer.length} bytes`)
    } catch (error) {
      console.error(`[Image Generation] Error generating image with ${provider}:`, error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      return NextResponse.json(
        {
          error: 'Failed to generate image',
          details: errorMessage,
        },
        { status: 500 }
      )
    }

    // Upload to Supabase Storage
    // Convert buffer to base64 data URL for upload
    const base64Image = imageBuffer.toString('base64')
    const dataUrl = `data:image/png;base64,${base64Image}`
    const { url, path } = await uploadImageToStorage(dataUrl, user.id)

    // Optionally update draft with image generation metadata
    if (draftId) {
      try {
        await prisma.draft.update({
          where: { id: draftId },
          data: {
            imageGenerationPrompt: prompt,
            imageGenerationProvider: provider,
          },
        })
      } catch (error) {
        // Log but don't fail - image is already uploaded
        console.warn('Failed to update draft with image generation metadata:', error)
      }
    }

    return NextResponse.json({
      success: true,
      url,
      path,
      prompt,
    })
  } catch (error) {
    console.error('Error in image generation:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate image',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

/**
 * Get default model for a provider
 */
function getDefaultModel(provider: string): string {
  const defaults: Record<string, string> = {
    'fal': 'fal-ai/flux/schnell',
    'openai-dalle': 'dall-e-3',
    'replicate': 'stability-ai/stable-diffusion:db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf',
  }
  return defaults[provider] || ''
}

/**
 * Convert aspect ratio to DALL-E size format
 */
function getSizeFromAspectRatio(aspectRatio?: string): string {
  const sizeMap: Record<string, string> = {
    '1:1': '1024x1024',
    '16:9': '1792x1024',
    '9:16': '1024x1792',
    '4:3': '1024x768',
    '3:4': '768x1024',
  }
  return sizeMap[aspectRatio || '1:1'] || '1024x1024'
}

