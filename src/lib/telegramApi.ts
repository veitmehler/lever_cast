/**
 * Telegram API Service
 * Handles posting content to Telegram channels using Bot API
 * Note: Telegram uses Bot API Token (stored in ApiKey model), not OAuth
 */

import { prisma } from './prisma'
import { decrypt } from './encryption'
import { downloadImageFromStorage } from './supabase'

const TELEGRAM_API_BASE = 'https://api.telegram.org/bot'

interface TelegramMessageResponse {
  ok: boolean
  result: {
    message_id: number
    chat: {
      id: number
      title?: string
      username?: string
    }
  }
}

interface TelegramErrorResponse {
  ok: false
  description: string
  error_code: number
}

/**
 * Get Telegram bot token for user
 * @param userId - User ID
 * @returns Bot token
 */
async function getTelegramBotToken(userId: string): Promise<string> {
  const apiKey = await prisma.apiKey.findFirst({
    where: {
      userId,
      provider: 'telegram',
    },
  })

  if (!apiKey) {
    throw new Error('Telegram bot token not found. Please add your Telegram bot token in Settings.')
  }

  return decrypt(apiKey.encryptedKey)
}

/**
 * Upload an image to Telegram
 * @param botToken - Telegram bot token
 * @param chatId - Telegram chat/channel ID
 * @param imageUrl - Supabase Storage URL of the image
 * @param caption - Post caption (max 1,024 characters for photo captions, but we limit to 2,000 for text posts)
 * @returns Message ID
 */
async function sendPhotoToTelegram(
  botToken: string,
  chatId: string,
  imageUrl: string,
  caption: string
): Promise<number> {
  try {
    console.log(`[Telegram API] Sending photo to chat ${chatId}`)
    
    // Download image from Supabase Storage
    const imageBuffer = await downloadImageFromStorage(imageUrl)
    
    // Create form data for multipart upload
    const formData = new FormData()
    const blob = new Blob([new Uint8Array(imageBuffer)])
    formData.append('photo', blob)
    formData.append('chat_id', chatId)
    formData.append('caption', caption.substring(0, 1024)) // Telegram photo captions max 1,024 chars

    // Send photo
    const response = await fetch(
      `${TELEGRAM_API_BASE}${botToken}/sendPhoto`,
      {
        method: 'POST',
        body: formData,
      }
    )

    if (!response.ok) {
      const error: TelegramErrorResponse = await response.json().catch(() => ({ ok: false, description: 'Unknown error', error_code: response.status }))
      console.error('[Telegram API] Photo send failed:', {
        status: response.status,
        error: error.description,
      })
      throw new Error(`Failed to send photo: ${error.description || 'Unknown error'}`)
    }

    const result: TelegramMessageResponse = await response.json()
    console.log('[Telegram API] Photo sent successfully:', result.result.message_id)
    return result.result.message_id
  } catch (error) {
    console.error('[Telegram API] Error sending photo:', error)
    throw error
  }
}

/**
 * Post content to Telegram channel
 * @param userId - User ID
 * @param content - Post content (max 2,000 characters)
 * @param chatId - Telegram chat/channel ID (e.g., "@channelname" or numeric ID)
 * @param imageUrl - Optional Supabase Storage URL of image
 * @returns Object with success status and message info
 */
export async function postToTelegram(
  userId: string,
  content: string,
  chatId: string,
  imageUrl?: string
): Promise<{ success: true; messageId: number; chatId: string } | { success: false; error: string }> {
  try {
    console.log(`[Telegram API] Posting to Telegram for user ${userId}, chat: ${chatId}`)
    
    // Validate content length
    if (content.length > 2000) {
      return {
        success: false,
        error: `Content exceeds Telegram's 2,000 character limit. Current length: ${content.length}`,
      }
    }

    // Validate chat ID
    if (!chatId) {
      return {
        success: false,
        error: 'Telegram chat/channel ID is required. Please specify the chat ID or channel username (e.g., "@channelname").',
      }
    }

    // Get bot token
    const botToken = await getTelegramBotToken(userId)

    // Send message with or without image
    if (imageUrl) {
      try {
        const messageId = await sendPhotoToTelegram(botToken, chatId, imageUrl, content)
        return {
          success: true,
          messageId,
          chatId,
        }
      } catch (error) {
        console.error('[Telegram API] Photo send failed, trying text-only:', error)
        // Fallback to text-only if image fails
      }
    }

    // Send text message
    const response = await fetch(
      `${TELEGRAM_API_BASE}${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: content,
          parse_mode: 'HTML', // Support basic HTML formatting
        }),
      }
    )

    if (!response.ok) {
      const error: TelegramErrorResponse = await response.json().catch(() => ({ ok: false, description: 'Unknown error', error_code: response.status }))
      
      console.error('[Telegram API] Message send failed:', {
        status: response.status,
        error: error.description,
      })

      // Handle specific error cases
      if (error.error_code === 401) {
        return {
          success: false,
          error: 'Telegram bot token is invalid. Please check your bot token in Settings.',
        }
      }

      if (error.error_code === 403) {
        return {
          success: false,
          error: 'Bot is not a member of the chat/channel or does not have permission to post. Please add the bot as an admin to the channel.',
        }
      }

      if (error.error_code === 400) {
        return {
          success: false,
          error: `Invalid chat ID or bot configuration: ${error.description}`,
        }
      }

      return {
        success: false,
        error: `Telegram API error: ${error.description || 'Unknown error'}`,
      }
    }

    const result: TelegramMessageResponse = await response.json()
    console.log(`[Telegram API] Message sent successfully: ${result.result.message_id}`)

    return {
      success: true,
      messageId: result.result.message_id,
      chatId: result.result.chat.id.toString(),
    }
  } catch (error) {
    console.error('[Telegram API] Error posting to Telegram:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

