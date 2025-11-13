/**
 * Threads API Service
 * Handles posting content to Threads using Meta Graph API
 * Note: Threads uses Meta Graph API (similar to Instagram)
 */

import { getSocialConnection } from './socialConnections'
import { downloadImageFromStorage } from './supabase'
import { prisma } from './prisma'
import { decrypt } from './encryption'

const THREADS_API_BASE = 'https://graph.facebook.com/v24.0'

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

  const accessToken = decrypt(connection.accessToken)

  // Get user's Threads account
  // Threads accounts are linked to Instagram Business Accounts
  const pagesResponse = await fetch(
    `${THREADS_API_BASE}/me/accounts?access_token=${accessToken}&fields=instagram_business_account`
  )

  if (!pagesResponse.ok) {
    const errorText = await pagesResponse.text()
    console.error('[Threads API] Failed to fetch pages:', {
      status: pagesResponse.status,
      error: errorText,
    })
    throw new Error(`Failed to fetch Threads account: ${pagesResponse.status}`)
  }

  const pagesData = await pagesResponse.json()
  const pages = pagesData.data || []
  
  // Find page with Instagram Business Account (Threads uses Instagram account)
  for (const page of pages) {
    if (page.instagram_business_account) {
      const igAccountResponse = await fetch(
        `${THREADS_API_BASE}/${page.instagram_business_account.id}?access_token=${accessToken}&fields=id,username`
      )
      
      if (igAccountResponse.ok) {
        const igAccount = await igAccountResponse.json()
        return {
          id: igAccount.id,
          username: igAccount.username,
        }
      }
    }
  }

  throw new Error('No Threads account found. Please connect a Threads account linked to an Instagram Business Account.')
}

/**
 * Upload an image for Threads post
 * @param igAccountId - Instagram Business Account ID (Threads uses Instagram)
 * @param pageAccessToken - Page access token
 * @param imageUrl - Supabase Storage URL of the image
 * @returns Media Container ID
 */
async function createThreadsMediaContainer(
  igAccountId: string,
  pageAccessToken: string,
  imageUrl: string,
  caption: string
): Promise<string> {
  try {
    console.log(`[Threads API] Creating media container for account ${igAccountId}`)
    
    // Download image from Supabase Storage
    const imageBuffer = await downloadImageFromStorage(imageUrl)
    
    // Upload to Facebook Page (similar to Instagram)
    const formData = new FormData()
    const blob = new Blob([new Uint8Array(imageBuffer)])
    formData.append('source', blob)
    formData.append('published', 'false')

    const pagesResponse = await fetch(
      `${THREADS_API_BASE}/me/accounts?access_token=${pageAccessToken}&fields=id,instagram_business_account`
    )
    const pagesData = await pagesResponse.json()
    const page = pagesData.data?.find((p: any) => p.instagram_business_account?.id === igAccountId)?.id

    if (!page) {
      throw new Error('Could not find Facebook Page linked to Threads account')
    }

    const uploadResponse = await fetch(
      `${THREADS_API_BASE}/${page}/photos?access_token=${pageAccessToken}`,
      {
        method: 'POST',
        body: formData,
      }
    )

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text()
      throw new Error(`Failed to upload image: ${uploadResponse.status}`)
    }

    const uploadResult: { id: string } = await uploadResponse.json()
    const imageId = uploadResult.id

    // Create media container (Threads uses Instagram media API)
    const containerResponse = await fetch(
      `${THREADS_API_BASE}/${igAccountId}/media?access_token=${pageAccessToken}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_url: `https://graph.facebook.com/v24.0/${imageId}/picture?access_token=${pageAccessToken}`,
          caption: caption.substring(0, 500), // Threads limit: 500 characters
        }),
      }
    )

    if (!containerResponse.ok) {
      const errorText = await containerResponse.text()
      throw new Error(`Failed to create media container: ${containerResponse.status}`)
    }

    const containerResult: ThreadsMediaResponse = await containerResponse.json()
    return containerResult.id
  } catch (error) {
    console.error('[Threads API] Error creating media container:', error)
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

    // Get page access token
    const connection = await getSocialConnection(userId, 'threads')
    if (!connection) {
      throw new Error('Threads account not connected')
    }
    const pageAccessToken = decrypt(connection.accessToken)

    let containerId: string | undefined

    // Create media container if image provided
    if (imageUrl) {
      try {
        containerId = await createThreadsMediaContainer(threadsAccount.id, pageAccessToken, imageUrl, content)
      } catch (error) {
        console.error('[Threads API] Media container creation failed, continuing with text-only:', error)
        // Continue with text-only post if image fails
      }
    }

    // Post to Threads
    // Note: Threads API endpoint may vary - using Instagram API as base
    // For text-only posts, Threads may require different endpoint
    const postData: Record<string, string> = {
      text: content.substring(0, 500),
    }

    if (containerId) {
      postData.media_id = containerId
    }

    // Threads posting endpoint (may need adjustment based on actual API)
    const postResponse = await fetch(
      `${THREADS_API_BASE}/${threadsAccount.id}/threads?access_token=${pageAccessToken}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      }
    )

    if (!postResponse.ok) {
      const errorText = await postResponse.text()
      let error: any
      try {
        error = JSON.parse(errorText)
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
    
    // Construct post URL (Threads URL format)
    const postUrl = `https://www.threads.net/@${threadsAccount.username}/post/${postId}`

    console.log(`[Threads API] Post successful: ${postUrl}`)

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

