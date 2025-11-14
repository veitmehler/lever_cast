/**
 * Instagram API Service
 * Handles posting content to Instagram Business Accounts using Graph API
 * Note: Instagram requires images - cannot post text-only content
 */

import { getSocialConnection } from './socialConnections'
import { downloadImageFromStorage } from './supabase'
import { prisma } from './prisma'
import { decrypt } from './encryption'

const INSTAGRAM_API_BASE = 'https://graph.facebook.com/v24.0'

interface InstagramAccount {
  id: string
  username: string
  account_type: string
}

interface InstagramMediaResponse {
  id: string
}

interface InstagramPublishResponse {
  id: string
}

/**
 * Get user's Instagram Business Account
 * @param userId - User ID
 * @returns Instagram Business Account
 */
async function getInstagramAccount(userId: string): Promise<InstagramAccount> {
  const connection = await getSocialConnection(userId, 'instagram')
  if (!connection) {
    throw new Error('Instagram account not connected')
  }

  // Check if token needs refresh
  if (connection.tokenExpiry && new Date(connection.tokenExpiry) <= new Date()) {
    throw new Error('Instagram access token expired. Please reconnect your account.')
  }

  const accessToken = decrypt(connection.accessToken)

  // Get user's Instagram Business Account
  // First, get pages (Instagram Business Accounts are linked to Facebook Pages)
  const pagesResponse = await fetch(
    `${INSTAGRAM_API_BASE}/me/accounts?access_token=${accessToken}&fields=instagram_business_account`
  )

  if (!pagesResponse.ok) {
    const errorText = await pagesResponse.text()
    console.error('[Instagram API] Failed to fetch pages:', {
      status: pagesResponse.status,
      error: errorText,
    })
    throw new Error(`Failed to fetch Instagram account: ${pagesResponse.status}`)
  }

  const pagesData = await pagesResponse.json()
  const pages = pagesData.data || []
  
  // Find page with Instagram Business Account
  for (const page of pages) {
    if (page.instagram_business_account) {
      const igAccountResponse = await fetch(
        `${INSTAGRAM_API_BASE}/${page.instagram_business_account.id}?access_token=${accessToken}&fields=id,username,account_type`
      )
      
      if (igAccountResponse.ok) {
        const igAccount = await igAccountResponse.json()
        return {
          id: igAccount.id,
          username: igAccount.username,
          account_type: igAccount.account_type,
        }
      }
    }
  }

  throw new Error('No Instagram Business Account found. Please connect an Instagram Business Account linked to a Facebook Page.')
}

/**
 * Upload an image to Instagram
 * @param igAccountId - Instagram Business Account ID
 * @param pageAccessToken - Page access token (from Facebook Page)
 * @param imageUrl - Supabase Storage URL of the image
 * @param caption - Post caption (max 2,200 characters, but we limit to 2,000)
 * @returns Media Container ID (used for publishing)
 */
async function createMediaContainer(
  igAccountId: string,
  pageAccessToken: string,
  imageUrl: string,
  caption: string
): Promise<string> {
  try {
    console.log(`[Instagram API] Creating media container for account ${igAccountId}`)
    
    // Download image from Supabase Storage
    const imageBuffer = await downloadImageFromStorage(imageUrl)
    
    // Step 1: Upload image to Facebook (Instagram uses Facebook's image hosting)
    const formData = new FormData()
    const blob = new Blob([new Uint8Array(imageBuffer)])
    formData.append('source', blob)
    formData.append('published', 'false')

    // Upload to Facebook Page (Instagram requires image to be uploaded via Page)
    // We need to get the page ID first
    const pagesResponse = await fetch(
      `${INSTAGRAM_API_BASE}/me/accounts?access_token=${pageAccessToken}&fields=id,instagram_business_account`
    )
    const pagesData = await pagesResponse.json()
    const page = pagesData.data?.find((p: any) => p.instagram_business_account?.id === igAccountId)?.id

    if (!page) {
      throw new Error('Could not find Facebook Page linked to Instagram account')
    }

    const uploadResponse = await fetch(
      `${INSTAGRAM_API_BASE}/${page}/photos?access_token=${pageAccessToken}`,
      {
        method: 'POST',
        body: formData,
      }
    )

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text()
      console.error('[Instagram API] Image upload failed:', {
        status: uploadResponse.status,
        error: errorText,
      })
      throw new Error(`Failed to upload image: ${uploadResponse.status}`)
    }

    const uploadResult: { id: string } = await uploadResponse.json()
    const imageId = uploadResult.id

    // Step 2: Create media container on Instagram
    const containerResponse = await fetch(
      `${INSTAGRAM_API_BASE}/${igAccountId}/media?access_token=${pageAccessToken}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_url: `https://graph.facebook.com/v24.0/${imageId}/picture?access_token=${pageAccessToken}`,
          caption: caption.substring(0, 2000), // Instagram allows 2,200 but we limit to 2,000
        }),
      }
    )

    if (!containerResponse.ok) {
      const errorText = await containerResponse.text()
      console.error('[Instagram API] Media container creation failed:', {
        status: containerResponse.status,
        error: errorText,
      })
      throw new Error(`Failed to create media container: ${containerResponse.status}`)
    }

    const containerResult: InstagramMediaResponse = await containerResponse.json()
    console.log('[Instagram API] Media container created:', containerResult.id)
    return containerResult.id
  } catch (error) {
    console.error('[Instagram API] Error creating media container:', error)
    throw error
  }
}

/**
 * Post content to Instagram Business Account
 * @param userId - User ID
 * @param content - Post caption (max 2,000 characters)
 * @param imageUrl - REQUIRED Supabase Storage URL of image (Instagram requires images)
 * @returns Object with success status and post URL
 */
export async function postToInstagram(
  userId: string,
  content: string,
  imageUrl: string // Required for Instagram
): Promise<{ success: true; postUrl: string; postId: string } | { success: false; error: string }> {
  try {
    console.log(`[Instagram API] Posting to Instagram for user ${userId}`)
    
    // Validate content length
    if (content.length > 2000) {
      return {
        success: false,
        error: `Content exceeds Instagram's 2,000 character limit. Current length: ${content.length}`,
      }
    }

    // Instagram requires an image
    if (!imageUrl) {
      return {
        success: false,
        error: 'Instagram requires an image. Please attach an image to your post.',
      }
    }

    // Get Instagram Business Account
    const igAccount = await getInstagramAccount(userId)
    console.log(`[Instagram API] Using account: @${igAccount.username} (${igAccount.id})`)

    // Get page access token (needed for Instagram API)
    const connection = await getSocialConnection(userId, 'instagram')
    if (!connection) {
      throw new Error('Instagram account not connected')
    }
    const pageAccessToken = decrypt(connection.accessToken)

    // Create media container
    const containerId = await createMediaContainer(igAccount.id, pageAccessToken, imageUrl, content)

    // Publish the media container
    const publishResponse = await fetch(
      `${INSTAGRAM_API_BASE}/${igAccount.id}/media_publish?access_token=${pageAccessToken}`,
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

    if (!publishResponse.ok) {
      const errorText = await publishResponse.text()
      let error: any
      try {
        error = JSON.parse(errorText)
      } catch {
        error = { message: errorText || 'Unknown error' }
      }
      
      console.error('[Instagram API] Publish failed:', {
        status: publishResponse.status,
        error: error,
      })

      // Handle specific error cases
      if (publishResponse.status === 401) {
        return {
          success: false,
          error: 'Instagram access token expired or invalid. Please reconnect your Instagram account.',
        }
      }

      if (publishResponse.status === 403) {
        return {
          success: false,
          error: 'Permission denied. Please ensure the app has "instagram_basic", "instagram_content_publish", "pages_show_list", "pages_read_engagement", and "business_management" permissions. Note: instagram_basic is required as a dependency for instagram_content_publish.',
        }
      }

      return {
        success: false,
        error: `Instagram API error: ${publishResponse.status} ${error.error?.message || error.message || 'Unknown error'}`,
      }
    }

    const publishResult: InstagramPublishResponse = await publishResponse.json()
    const postId = publishResult.id
    
    // Construct post URL (Instagram posts don't have direct URLs, but we can link to the account)
    const postUrl = `https://www.instagram.com/p/${postId}/` // Note: This format may not work, Instagram uses shortcodes
    // Alternative: Link to account profile
    const accountUrl = `https://www.instagram.com/${igAccount.username}/`

    console.log(`[Instagram API] Post successful: ${accountUrl}`)

    return {
      success: true,
      postUrl: accountUrl, // Link to account since we can't construct direct post URL
      postId,
    }
  } catch (error) {
    console.error('[Instagram API] Error posting to Instagram:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

