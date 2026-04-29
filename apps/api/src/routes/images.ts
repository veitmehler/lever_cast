import type { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma'
import { decrypt } from '../lib/encryption'
import {
  generateImagePromptWithLLM,
  generateSimpleImagePrompt,
  generateWithFalAI,
  generateWithOpenAIDALLE,
  generateWithReplicate,
} from '../lib/imageGeneration'
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { requireAuth } from '../middleware/auth'

// ─── S3 helpers ──────────────────────────────────────────────────────────────

function getS3Client(): S3Client {
  const accessKeyId = process.env.ACCESS_KEY_ID
  const secretAccessKey = process.env.SECRET_ACCESS_KEY
  const region = process.env.S3_REGION ?? 'us-east-1'
  if (!accessKeyId || !secretAccessKey) {
    throw new Error('Missing AWS credentials: ACCESS_KEY_ID and SECRET_ACCESS_KEY must be set')
  }
  return new S3Client({ region, credentials: { accessKeyId, secretAccessKey } })
}

function getBucket(): string {
  const bucket = process.env.S3_BUCKET
  if (!bucket) throw new Error('S3_BUCKET env var is not set')
  return bucket
}

function getCdnBase(): string {
  const cdnBase = process.env.CDN_BASE
  if (!cdnBase) throw new Error('CDN_BASE env var is not set')
  return cdnBase.replace(/\/$/, '')
}

/**
 * Upload a Buffer to S3 and return the CDN URL.
 */
async function uploadBufferToS3(
  buffer: Buffer,
  userId: string,
  contentType: string,
  extension: string,
): Promise<{ url: string; path: string }> {
  const timestamp = Date.now()
  const randomId = Math.random().toString(36).substring(2, 9)
  const filePath = `${userId}/${timestamp}-${randomId}.${extension}`

  await getS3Client().send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: filePath,
      Body: buffer,
      ContentType: contentType,
    }),
  )

  return { url: `${getCdnBase()}/${filePath}`, path: filePath }
}

/**
 * Delete a file from S3 by its storage path.
 */
async function deleteFromS3(filePath: string): Promise<void> {
  await getS3Client().send(new DeleteObjectCommand({ Bucket: getBucket(), Key: filePath }))
}

// ─── Shared helpers ──────────────────────────────────────────────────────────

async function getOrCreateUser(clerkId: string) {
  const user = await prisma.user.findUnique({ where: { clerkId } })
  if (user) return user
  return prisma.user.create({
    data: { clerkId, name: clerkId, email: `${clerkId}@placeholder.local` },
  })
}

async function getUserApiKeys(userId: string): Promise<Record<string, string>> {
  const apiKeys = await prisma.apiKey.findMany({ where: { userId } })
  const decrypted: Record<string, string> = {}
  apiKeys.forEach((k) => { decrypted[k.provider] = decrypt(k.encryptedKey) })
  return decrypted
}

function getDefaultModel(provider: string): string {
  const defaults: Record<string, string> = {
    fal: 'fal-ai/flux/schnell',
    'openai-dalle': 'dall-e-3',
    replicate: 'stability-ai/stable-diffusion:db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf',
  }
  return defaults[provider] || ''
}

function getSizeFromAspectRatio(aspectRatio?: string): string {
  const sizeMap: Record<string, string> = {
    '1:1': '1024x1024', '16:9': '1792x1024', '9:16': '1024x1792',
    '4:3': '1024x768', '3:4': '768x1024',
  }
  return sizeMap[aspectRatio || '1:1'] || '1024x1024'
}

function extractFilePathFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url)
    if (url.includes('supabase.co/storage')) {
      const match = urlObj.pathname.match(/\/storage\/v1\/object\/public\/post-images\/(.+)$/)
      return match ? match[1] : null
    }
    const path = urlObj.pathname.replace(/^\//, '')
    return path || null
  } catch {
    return null
  }
}

// ─── Route plugin ─────────────────────────────────────────────────────────────

export async function imageRoutes(app: FastifyInstance) {
  // POST /api/images/generate
  app.post('/generate', async (request, reply) => {
    const clerkId = await requireAuth(request, reply)
    if (!clerkId) return

    const { postContent, styleInstructions, provider, model, aspectRatio, draftId } =
      request.body as {
        postContent?: string
        styleInstructions?: string
        provider?: string
        model?: string
        aspectRatio?: string
        draftId?: string
      }

    if (!postContent || typeof postContent !== 'string') {
      return reply.status(400).send({ error: 'Missing required field: postContent' })
    }
    if (!provider || !['fal', 'openai-dalle', 'replicate'].includes(provider)) {
      return reply.status(400).send({
        error: 'Invalid provider. Must be one of: fal, openai-dalle, replicate',
      })
    }

    try {
      const user = await getOrCreateUser(clerkId)
      const apiKeys = await getUserApiKeys(user.id)

      const imageApiKey = apiKeys[provider]
      if (!imageApiKey) {
        return reply.status(400).send({
          error: `No API key found for ${provider}. Please add your API key in settings.`,
        })
      }

      let settings = await prisma.settings.findUnique({ where: { userId: user.id } })
      if (!settings) {
        settings = await prisma.settings.create({
          data: { userId: user.id, theme: 'light', sidebarState: 'open' },
        })
      }

      let defaultModels: Record<string, string> = {}
      if (settings.defaultModel) {
        try { defaultModels = JSON.parse(settings.defaultModel) } catch { /* ignore */ }
      }

      // Pick an LLM for prompt generation
      const userDefault = settings.defaultProvider || null
      const llmProviderOrder = [userDefault, 'openai', 'anthropic', 'gemini', 'openrouter'].filter(Boolean)

      let selectedLLMProvider: string | null = null
      let llmApiKey: string | null = null
      let selectedLLMModel: string | null = null

      for (const prov of llmProviderOrder) {
        if (prov && apiKeys[prov]) {
          selectedLLMProvider = prov
          llmApiKey = apiKeys[prov]
          selectedLLMModel = defaultModels[prov] || null
          break
        }
      }

      // Resolve image model
      let selectedModel = model
      if (!selectedModel) {
        if (settings.defaultImageModel) {
          try {
            const defaults = JSON.parse(settings.defaultImageModel)
            selectedModel = defaults[provider] || getDefaultModel(provider)
          } catch {
            selectedModel = getDefaultModel(provider)
          }
        } else {
          selectedModel = getDefaultModel(provider)
        }
      }

      // Generate image prompt via LLM
      let prompt: string
      if (selectedLLMProvider && llmApiKey && selectedLLMModel) {
        try {
          prompt = await generateImagePromptWithLLM(
            postContent, styleInstructions, provider, selectedModel,
            selectedLLMProvider, selectedLLMModel, llmApiKey,
          )
        } catch {
          prompt = generateSimpleImagePrompt(postContent, styleInstructions)
        }
      } else {
        prompt = generateSimpleImagePrompt(postContent, styleInstructions)
      }

      // Generate the image
      let imageBuffer: Buffer
      switch (provider) {
        case 'fal':
          imageBuffer = await generateWithFalAI(imageApiKey, prompt, selectedModel)
          break
        case 'openai-dalle':
          imageBuffer = await generateWithOpenAIDALLE(
            imageApiKey, prompt, selectedModel, getSizeFromAspectRatio(aspectRatio),
          )
          break
        case 'replicate':
          imageBuffer = await generateWithReplicate(imageApiKey, prompt, selectedModel)
          break
        default:
          return reply.status(400).send({ error: `Unsupported provider: ${provider}` })
      }

      // Upload to S3
      const { url, path } = await uploadBufferToS3(imageBuffer, user.id, 'image/png', 'png')

      // Optionally update draft
      if (draftId) {
        try {
          await prisma.draft.update({
            where: { id: draftId },
            data: { imageGenerationPrompt: prompt, imageGenerationProvider: provider },
          })
        } catch { /* non-fatal */ }
      }

      return reply.send({ success: true, url, path, prompt })
    } catch (err) {
      request.log.error({ err }, 'Error in /images/generate')
      return reply.status(500).send({
        error: 'Failed to generate image',
        details: err instanceof Error ? err.message : String(err),
      })
    }
  })

  // POST /api/images/generate-prompt
  app.post('/generate-prompt', async (request, reply) => {
    const clerkId = await requireAuth(request, reply)
    if (!clerkId) return

    const { postContent, styleInstructions, imageProvider, imageModel, llmProvider, llmModel } =
      request.body as {
        postContent?: string
        styleInstructions?: string
        imageProvider?: string
        imageModel?: string
        llmProvider?: string
        llmModel?: string
      }

    if (!postContent || typeof postContent !== 'string') {
      return reply.status(400).send({ error: 'Missing required field: postContent' })
    }
    if (!imageProvider || !['fal', 'openai-dalle', 'replicate'].includes(imageProvider)) {
      return reply.status(400).send({
        error: 'Invalid imageProvider. Must be one of: fal, openai-dalle, replicate',
      })
    }

    try {
      const user = await getOrCreateUser(clerkId)
      const apiKeys = await getUserApiKeys(user.id)

      let settings = await prisma.settings.findUnique({ where: { userId: user.id } })
      if (!settings) {
        settings = await prisma.settings.create({
          data: { userId: user.id, theme: 'light', sidebarState: 'open' },
        })
      }

      let defaultModels: Record<string, string> = {}
      if (settings.defaultModel) {
        try { defaultModels = JSON.parse(settings.defaultModel) } catch { /* ignore */ }
      }

      let selectedLLMProvider: string | null = null
      let llmApiKey: string | null = null
      let selectedLLMModel: string | null = null

      if (llmProvider && llmModel) {
        if (!apiKeys[llmProvider]) {
          return reply.status(400).send({ error: `No API key found for LLM provider: ${llmProvider}` })
        }
        selectedLLMProvider = llmProvider
        llmApiKey = apiKeys[llmProvider]
        selectedLLMModel = llmModel
      } else {
        const userDefault = settings.defaultProvider || null
        const order = [userDefault, 'openai', 'anthropic', 'gemini', 'openrouter'].filter(Boolean)
        for (const prov of order) {
          if (prov && apiKeys[prov]) {
            selectedLLMProvider = prov
            llmApiKey = apiKeys[prov]
            selectedLLMModel = defaultModels[prov] || null
            break
          }
        }
      }

      const selectedImageModel = imageModel || getDefaultModel(imageProvider)

      let prompt: string
      if (selectedLLMProvider && llmApiKey && selectedLLMModel) {
        try {
          prompt = await generateImagePromptWithLLM(
            postContent, styleInstructions, imageProvider, selectedImageModel,
            selectedLLMProvider, selectedLLMModel, llmApiKey,
          )
        } catch (err) {
          let msg = 'Failed to generate prompt'
          if (err instanceof Error) {
            if (err.message.includes('overloaded')) msg = 'The model is overloaded. Please try again later.'
            else if (err.message.includes('rate limit')) msg = 'Rate limit exceeded. Please try again later.'
            else if (err.message.includes('invalid')) msg = 'Invalid API key or model. Please check your settings.'
            else if (err.message.includes('503')) msg = 'Service temporarily unavailable. Please try again later.'
            else msg = err.message
          }
          return reply.status(500).send({ error: msg, details: String(err) })
        }
      } else {
        prompt = generateSimpleImagePrompt(postContent, styleInstructions)
      }

      return reply.send({ success: true, prompt })
    } catch (err) {
      request.log.error({ err }, 'Error in /images/generate-prompt')
      return reply.status(500).send({
        error: 'Failed to generate prompt',
        details: err instanceof Error ? err.message : String(err),
      })
    }
  })

  // POST /api/images/upload  (accepts JSON with base64 data URL)
  app.post('/upload', async (request, reply) => {
    const clerkId = await requireAuth(request, reply)
    if (!clerkId) return

    const { imageDataUrl, fileName } = request.body as {
      imageDataUrl?: string
      fileName?: string
    }

    if (!imageDataUrl || typeof imageDataUrl !== 'string') {
      return reply.status(400).send({ error: 'No imageDataUrl provided' })
    }
    if (!imageDataUrl.startsWith('data:image/')) {
      return reply.status(400).send({ error: 'Invalid image data URL format' })
    }
    if (imageDataUrl.length > 13 * 1024 * 1024) {
      return reply.status(400).send({ error: 'Image size must be less than 10MB' })
    }

    try {
      const user = await prisma.user.findUnique({ where: { clerkId } })
      if (!user) return reply.status(404).send({ error: 'User not found' })

      const match = imageDataUrl.match(/^data:image\/(\w+);base64,/)
      const extension = fileName?.split('.').pop() || match?.[1] || 'jpg'
      const contentType = match ? `image/${match[1]}` : 'image/jpeg'
      const base64Data = imageDataUrl.replace(/^data:image\/\w+;base64,/, '')
      const buffer = Buffer.from(base64Data, 'base64')

      const { url, path } = await uploadBufferToS3(buffer, user.id, contentType, extension)
      return reply.send({ success: true, url, path })
    } catch (err) {
      request.log.error({ err }, 'Error in /images/upload')
      return reply.status(500).send({
        error: 'Failed to upload image',
        details: err instanceof Error ? err.message : String(err),
      })
    }
  })

  // DELETE /api/images/upload
  app.delete('/upload', async (request, reply) => {
    const clerkId = await requireAuth(request, reply)
    if (!clerkId) return

    const { url, path: filePath } = request.body as { url?: string; path?: string }
    if (!url && !filePath) {
      return reply.status(400).send({ error: 'Either url or path must be provided' })
    }

    try {
      const user = await prisma.user.findUnique({ where: { clerkId } })
      if (!user) return reply.status(404).send({ error: 'User not found' })

      const finalPath = filePath || (url ? extractFilePathFromUrl(url) : null)
      if (!finalPath) {
        return reply.status(400).send({ error: 'Could not extract file path from URL' })
      }
      if (!finalPath.startsWith(`${user.id}/`)) {
        return reply.status(403).send({ error: 'Unauthorized: You can only delete your own images' })
      }

      await deleteFromS3(finalPath)
      return reply.send({ success: true, message: 'Image deleted successfully' })
    } catch (err) {
      request.log.error({ err }, 'Error in DELETE /images/upload')
      return reply.status(500).send({
        error: 'Failed to delete image',
        details: err instanceof Error ? err.message : String(err),
      })
    }
  })
}
