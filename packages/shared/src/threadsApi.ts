/**
 * Threads API Service
 * Handles posting content to Threads using Meta Graph API
 * Note: Threads uses Meta Graph API (similar to Instagram)
 */

import { getSocialConnection } from './socialConnections'
import { decrypt } from './encryption'

// Threads API uses its own domain: graph.threads.net (not graph.facebook.com)
const THREADS_API_BASE = 'https://graph.threads.net/v1.0'

interface ThreadsAccount {
  id: string
  username: string
}

interface ThreadsMediaResponse {
  id: string
}

interface ThreadsPublishResponse {
  id: string
}

/**
 * Get user's Threads account
 * @param userId - User ID
 * @returns Threads account
 */
async function getThreadsAccount(userId: string): Promise<ThreadsAccount> {
  const connection = await getSocialConnection(userId, 'threads')
  if (!connection) {
    throw new Error('Threads account not connected')
  }

  // Check if token needs refresh
  if (connection.tokenExpiry && new Date(connection.tokenExpiry) <= new Date()) {
    throw new Error('Threads access token expired. Please reconnect your account.')
  }

  // Threads API uses user access token directly (no Page token needed)
  const accessToken = decrypt(connection.accessToken)
  
  if (!accessToken || accessToken.trim().length === 0) {
    throw new Error('Threads access token is empty or invalid. Please reconnect your Threads account.')
  }
  
  if (accessToken.length < 20) {
    throw new Error('Threads access token appears to be corrupted. Please reconnect your Threads account.')
  }

  // Get Threads account using /me endpoint
  const accountResponse = await fetch(
    `${THREADS_API_BASE}/me?access_token=${accessToken}&fields=id,username`
  )

  if (!accountResponse.ok) {
    const errorText = await accountResponse.text()
    let errorDetails = ''
    try {
      const errorJson = JSON.parse(errorText)
      errorDetails = errorJson.error?.message || errorText
      console.error('[Threads API] Failed to fetch account:', {
        status: accountResponse.status,
        errorCode: errorJson.error?.code,
        errorMessage: errorJson.error?.message,
        errorType: errorJson.error?.type,
        fullError: errorJson,
      })
    } catch {
      errorDetails = errorText
      console.error('[Threads API] Failed to fetch account:', {
        status: accountResponse.status,
        error: errorText,
      })
    }
    throw new Error(`Failed to fetch Threads account: ${errorDetails || accountResponse.status}`)
  }

  const accountData = await accountResponse.json()
  
  // Use stored account info if API doesn't return it
  return {
    id: accountData.id || connection.platformUserId || '',
    username: accountData.username || connection.platformUsername || 'Threads User',
  }
}

/**
 * Create a Threads media container
 * Threads API uses a two-step process: Create container, then publish
 * @param userId - User ID
 * @param accessToken - Threads access token
 * @param imageUrl - Optional Supabase Storage URL of the image
 * @param text - Post text content
 * @returns Container creation_id
 */
async function createThreadsContainer(
  userId: string,
  accessToken: string,
  imageUrl: string | undefined,
  text: string
): Promise<string> {
  try {
    console.log(`[Threads API] Creating Threads container`)
    
    // Prepare container data
    const containerData: Record<string, string> = {
      text: text.substring(0, 500), // Threads limit: 500 characters
    }
    
    // If image provided, download and upload it
    if (imageUrl) {
      console.log('[Threads API] Using image URL from storage')
      // Threads API accepts image_url parameter directly
      // We use the Supabase Storage URL directly
      containerData.media_type = 'IMAGE'
      containerData.image_url = imageUrl // Threads API accepts direct image URLs
    } else {
      containerData.media_type = 'TEXT'
    }
    
    // Create container using Threads API endpoint
    const containerResponse = await fetch(
      `${THREADS_API_BASE}/me/threads?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(containerData),
      }
    )

    interface ThreadsError {
      error?: {
        message?: string
        code?: number
      }
      message?: string
      [key: string]: unknown
    }

    if (!containerResponse.ok) {
      const errorText = await containerResponse.text()
      let error: ThreadsError
      try {
        error = JSON.parse(errorText) as ThreadsError
      } catch {
        error = { message: errorText || 'Unknown error' }
      }
      console.error('[Threads API] Container creation failed:', {
        status: containerResponse.status,
        error: error,
      })
      throw new Error(`Failed to create container: ${containerResponse.status} ${error.error?.message || error.message || 'Unknown error'}`)
    }

    const containerResult: ThreadsMediaResponse = await containerResponse.json()
    console.log('[Threads API] Container created:', containerResult.id)
    return containerResult.id
  } catch (error) {
    console.error('[Threads API] Error creating container:', error)
    throw error
  }
}

/**
 * Post content to Threads
 * @param userId - User ID
 * @param content - Post content (max 500 characters)
 * @param imageUrl - Optional Supabase Storage URL of image
 * @returns Object with success status and post URL
 */
export async function postToThreads(
  userId: string,
  content: string,
  imageUrl?: string
): Promise<{ success: true; postUrl: string; postId: string } | { success: false; error: string }> {
  try {
    console.log(`[Threads API] Posting to Threads for user ${userId}`)
    
    // Validate content length
    if (content.length > 500) {
      return {
        success: false,
        error: `Content exceeds Threads' 500 character limit. Current length: ${content.length}`,
      }
    }

    // Get Threads account
    const threadsAccount = await getThreadsAccount(userId)
    console.log(`[Threads API] Using account: @${threadsAccount.username} (${threadsAccount.id})`)

    // Get Threads access token (user token, not Page token)
    const connection = await getSocialConnection(userId, 'threads')
    if (!connection) {
      throw new Error('Threads account not connected')
    }
    const accessToken = decrypt(connection.accessToken)

    // Step 1: Create media container using Threads API
    console.log('[Threads API] Creating Threads container')
    let containerId: string
    try {
      containerId = await createThreadsContainer(userId, accessToken, imageUrl, content)
    } catch (error) {
      console.error('[Threads API] Container creation failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create Threads container',
      }
    }

    // Step 2: Publish the container using Threads API
    console.log('[Threads API] Publishing container:', containerId)
    const postResponse = await fetch(
      `${THREADS_API_BASE}/me/threads_publish?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creation_id: containerId,
        }),
      }
    )

    interface ThreadsPublishError {
      error?: {
        message?: string
        code?: number
      }
      message?: string
      [key: string]: unknown
    }

    if (!postResponse.ok) {
      const errorText = await postResponse.text()
      let error: ThreadsPublishError
      try {
        error = JSON.parse(errorText) as ThreadsPublishError
      } catch {
        error = { message: errorText || 'Unknown error' }
      }
      
      console.error('[Threads API] Post failed:', {
        status: postResponse.status,
        error: error,
      })

      if (postResponse.status === 401) {
        return {
          success: false,
          error: 'Threads access token expired or invalid. Please reconnect your Threads account.',
        }
      }

      if (postResponse.status === 403) {
        return {
          success: false,
          error: 'Permission denied. Please ensure the app has Threads posting permissions.',
        }
      }

      return {
        success: false,
        error: `Threads API error: ${postResponse.status} ${error.error?.message || error.message || 'Unknown error'}`,
      }
    }

    const postResult: ThreadsPublishResponse = await postResponse.json()
    const postId = postResult.id
    
    // Log full response for debugging
    console.log('[Threads API] Publish response:', JSON.stringify(postResult, null, 2))
    
    // Construct Threads post URL
    // Threads post URLs use the format: https://www.threads.net/@username/post/{postId}
    const postUrl = `https://www.threads.net/@${threadsAccount.username}/post/${postId}`

    console.log(`[Threads API] Post published successfully: ${postUrl}`)

    return {
      success: true,
      postUrl,
      postId,
    }
  } catch (error) {
    console.error('[Threads API] Error posting to Threads:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}


