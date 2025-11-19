/**
 * Facebook API Service
 * Handles posting content to Facebook Pages using Graph API
 */

import { getSocialConnection } from './socialConnections'
import { downloadImageFromStorage } from './supabase'
import { decrypt } from './encryption'

const FACEBOOK_API_BASE = 'https://graph.facebook.com/v24.0'

interface FacebookPage {
  id: string
  name: string
  access_token: string
}

interface FacebookPostResponse {
  id: string
  post_id?: string
}

/**
 * Get user's Facebook Pages
 * @param userId - User ID
 * @returns Array of Facebook Pages
 */
async function getFacebookPages(userId: string): Promise<FacebookPage[]> {
  const connection = await getSocialConnection(userId, 'facebook')
  if (!connection) {
    throw new Error('Facebook account not connected')
  }

  // Check if token needs refresh
  if (connection.tokenExpiry && new Date(connection.tokenExpiry) <= new Date()) {
    throw new Error('Facebook access token expired. Please reconnect your account.')
  }

  let accessToken: string
  try {
    accessToken = decrypt(connection.accessToken)
    
    // Validate decrypted token
    if (!accessToken || accessToken.trim().length === 0) {
      throw new Error('Facebook access token is empty or invalid. Please reconnect your Facebook account.')
    }
    
    // Check if token looks valid (Facebook tokens typically start with certain patterns)
    if (accessToken.length < 20) {
      throw new Error('Facebook access token appears to be corrupted. Please reconnect your Facebook account.')
    }
    
    console.log('[Facebook API] Decrypted token preview:', accessToken.substring(0, 20) + '...')
  } catch (decryptError) {
    console.error('[Facebook API] Failed to decrypt access token:', decryptError)
    throw new Error('Facebook access token decryption failed. Please reconnect your Facebook account.')
  }

  // Debug token first to verify it's valid (optional check)
  // Note: We can use the user token itself for debugging, or skip if it fails
  try {
    const debugResponse = await fetch(
      `${FACEBOOK_API_BASE}/debug_token?input_token=${accessToken}&access_token=${accessToken}`
    )
    
    if (debugResponse.ok) {
      const debugData = await debugResponse.json()
      console.log('[Facebook API] Token debug info:', {
        isValid: debugData.data?.is_valid,
        appId: debugData.data?.app_id,
        userId: debugData.data?.user_id,
        expiresAt: debugData.data?.expires_at,
        scopes: debugData.data?.scopes,
      })
      
      if (!debugData.data?.is_valid) {
        throw new Error('Facebook access token is invalid. Please reconnect your Facebook account.')
      }
    }
  } catch (debugError) {
    // Continue even if debug fails - the actual API call will reveal the real issue
    console.warn('[Facebook API] Token debug check failed, continuing:', debugError)
  }

  // Get user's pages with specific fields
  // Note: We need to request 'access_token' field to get Page access tokens
  const pagesResponse = await fetch(
    `${FACEBOOK_API_BASE}/me/accounts?access_token=${accessToken}&fields=id,name,access_token`
  )

  interface FacebookError {
    error?: {
      message?: string
      code?: number
    }
    message?: string
    [key: string]: unknown
  }

  if (!pagesResponse.ok) {
    const errorText = await pagesResponse.text()
    let errorData: FacebookError
    try {
      errorData = JSON.parse(errorText) as FacebookError
    } catch {
      errorData = { error: { message: errorText } }
    }
    
    console.error('[Facebook API] Failed to fetch pages:', {
      status: pagesResponse.status,
      error: errorData,
      accessTokenLength: accessToken.length,
      accessTokenPreview: accessToken.substring(0, 20) + '...',
      tokenStartsWithEA: accessToken.startsWith('EA'), // Facebook tokens typically start with 'EA'
    })
    
    // Handle specific OAuth errors
    if (pagesResponse.status === 401 || errorData.error?.code === 190) {
      throw new Error('Facebook access token expired or invalid. Please reconnect your Facebook account.')
    }
    
    throw new Error(`Failed to fetch Facebook pages: ${pagesResponse.status} - ${errorData.error?.message || 'Unknown error'}`)
  }

  const pagesData = await pagesResponse.json()
  return pagesData.data || []
}

/**
 * Upload an image to Facebook
 * @param pageId - Facebook Page ID
 * @param pageAccessToken - Page access token
 * @param imageUrl - Supabase Storage URL of the image
 * @returns Photo ID
 */
async function uploadImageToFacebook(
  pageId: string,
  pageAccessToken: string,
  imageUrl: string
): Promise<string> {
  try {
    console.log(`[Facebook API] Uploading image to page ${pageId}`)
    
    // Download image from Supabase Storage
    const imageBuffer = await downloadImageFromStorage(imageUrl)
    
    // Create form data for multipart upload
    const formData = new FormData()
    const blob = new Blob([new Uint8Array(imageBuffer)])
    formData.append('source', blob)
    formData.append('published', 'false') // Don't publish immediately, we'll attach to post

    // Upload photo to Facebook
    const uploadResponse = await fetch(
      `${FACEBOOK_API_BASE}/${pageId}/photos?access_token=${pageAccessToken}`,
      {
        method: 'POST',
        body: formData,
      }
    )

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text()
      console.error('[Facebook API] Image upload failed:', {
        status: uploadResponse.status,
        error: errorText,
      })
      throw new Error(`Failed to upload image: ${uploadResponse.status}`)
    }

    const uploadResult: { id: string } = await uploadResponse.json()
    console.log('[Facebook API] Image uploaded successfully:', uploadResult.id)
    return uploadResult.id
  } catch (error) {
    console.error('[Facebook API] Error uploading image:', error)
    throw error
  }
}

/**
 * Post content to Facebook Page
 * @param userId - User ID
 * @param content - Post content (max 2,000 characters)
 * @param imageUrl - Optional Supabase Storage URL of image
 * @returns Object with success status and post URL
 */
export async function postToFacebook(
  userId: string,
  content: string,
  imageUrl?: string
): Promise<{ success: true; postUrl: string; postId: string } | { success: false; error: string }> {
  try {
    console.log(`[Facebook API] Posting to Facebook for user ${userId}`)
    
    // Validate content length
    if (content.length > 2000) {
      return {
        success: false,
        error: `Content exceeds Facebook's 2,000 character limit. Current length: ${content.length}`,
      }
    }

    // Get connection to check postTargetType
    const connection = await getSocialConnection(userId, 'facebook')
    if (!connection) {
      return {
        success: false,
        error: 'Facebook account not connected',
      }
    }

    let page: FacebookPage | null = null

    if (connection.postTargetType === 'page' && connection.selectedPageId) {
      // Post to selected page
      const pages = await getFacebookPages(userId)
      page = pages.find(p => p.id === connection.selectedPageId) || null
      
      if (!page) {
        return {
          success: false,
          error: `Selected Facebook Page (${connection.selectedPageId}) not found. Please select a different page.`,
        }
      }
      console.log(`[Facebook API] Posting to selected page: ${page.name} (${page.id})`)
    } else {
      // Post to personal profile (default)
      // Note: Facebook Graph API v24.0+ requires posting to Pages, not personal profiles
      // For personal profiles, we'll use the first available page or return an error
      const pages = await getFacebookPages(userId)
      
      if (pages.length === 0) {
        return {
          success: false,
          error: 'No Facebook Pages found. Please create a Facebook Page and grant access to this app, or select a page in settings.',
        }
      }

      // Use the first page as fallback
      page = pages[0]
      console.log(`[Facebook API] Posting to personal profile (using first page as fallback): ${page.name} (${page.id})`)
    }

    let photoId: string | undefined

    // Upload image if provided
    if (imageUrl) {
      try {
        photoId = await uploadImageToFacebook(page.id, page.access_token, imageUrl)
      } catch (error) {
        console.error('[Facebook API] Image upload failed, continuing with text-only post:', error)
        // Continue with text-only post if image upload fails
      }
    }

    // Prepare post data
    const postData: Record<string, string> = {
      message: content,
    }

    // Attach photo if uploaded
    if (photoId) {
      postData.attached_media = JSON.stringify([{ media_fbid: photoId }])
    }

    // Post to Facebook Page
    const postResponse = await fetch(
      `${FACEBOOK_API_BASE}/${page.id}/feed?access_token=${page.access_token}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      }
    )

    interface FacebookPostError {
      error?: {
        message?: string
        code?: number
      }
      message?: string
      [key: string]: unknown
    }

    if (!postResponse.ok) {
      const errorText = await postResponse.text()
      let error: FacebookPostError
      try {
        error = JSON.parse(errorText) as FacebookPostError
      } catch {
        error = { message: errorText || 'Unknown error' }
      }
      
      console.error('[Facebook API] Post failed:', {
        status: postResponse.status,
        error: error,
      })

      // Handle specific error cases
      if (postResponse.status === 401) {
        return {
          success: false,
          error: 'Facebook access token expired or invalid. Please reconnect your Facebook account.',
        }
      }

      if (postResponse.status === 403) {
        return {
          success: false,
          error: 'Permission denied. Please ensure the app has "pages_manage_posts" permission.',
        }
      }

      return {
        success: false,
        error: `Facebook API error: ${postResponse.status} ${error.error?.message || error.message || 'Unknown error'}`,
      }
    }

    const postResult: FacebookPostResponse = await postResponse.json()
    const postId = postResult.id || postResult.post_id || ''
    
    // Construct post URL
    // Facebook post IDs are usually in format "{pageId}_{postId}"
    // URL format: https://www.facebook.com/{pageId}/posts/{postId}
    let postUrl: string
    if (postId.includes('_')) {
      const [pageIdPart, postIdPart] = postId.split('_')
      postUrl = `https://www.facebook.com/${pageIdPart}/posts/${postIdPart}`
    } else {
      postUrl = `https://www.facebook.com/${page.id}/posts/${postId}`
    }

    console.log(`[Facebook API] Post successful: ${postUrl}`)

    return {
      success: true,
      postUrl,
      postId,
    }
  } catch (error) {
    console.error('[Facebook API] Error posting to Facebook:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

