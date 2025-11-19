/**
 * Instagram API Service
 * Handles posting content to Instagram Business Accounts using Graph API
 * Note: Instagram requires images - cannot post text-only content
 */

import { getSocialConnection } from './socialConnections'
import { downloadImageFromStorage } from './supabase'
import { prisma } from './prisma'
import { decrypt } from './encryption'
import { fetchInstagramUsername, refreshInstagramUsername } from './instagramUsername'

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

  // For Instagram, we store:
  // - Page access token in accessToken (needed for posting)
  // - User access token in refreshToken (needed for querying /me/accounts)
  // The /me/accounts endpoint requires a User token, not a Page token
  
  let userAccessToken: string | null = null
  let pageAccessToken: string
  
  try {
    // Get User token from refreshToken field (we store it there for Instagram)
    if (connection.refreshToken) {
      try {
        userAccessToken = decrypt(connection.refreshToken)
        if (!userAccessToken || userAccessToken.trim().length === 0) {
          userAccessToken = null
        }
      } catch (err) {
        console.warn('[Instagram API] Could not decrypt user token from refreshToken field')
        userAccessToken = null
      }
    }
    
    // Get Page token from accessToken field
    pageAccessToken = decrypt(connection.accessToken)
    
    // Validate Page token
    if (!pageAccessToken || pageAccessToken.trim().length === 0) {
      throw new Error('Instagram Page access token is empty or invalid. Please reconnect your Instagram account.')
    }
    
    if (pageAccessToken.length < 20) {
      throw new Error('Instagram Page access token appears to be corrupted. Please reconnect your Instagram account.')
    }
    
    console.log('[Instagram API] Using User token for /me/accounts:', userAccessToken ? 'Yes' : 'No (fallback to Page token)')
  } catch (decryptError) {
    console.error('[Instagram API] Failed to decrypt tokens:', decryptError)
    throw new Error('Instagram token decryption failed. Please reconnect your Instagram account.')
  }

  // Get user's Instagram Business Account
  // Use User token for /me/accounts (required), fallback to Page token if User token not available
  const tokenToUse = userAccessToken || pageAccessToken
  const pagesResponse = await fetch(
    `${INSTAGRAM_API_BASE}/me/accounts?access_token=${tokenToUse}&fields=id,name,access_token,instagram_business_account{id,username}`
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
  // Use the Page access token from the page object (or fallback to stored Page token)
  for (const page of pages) {
    if (page.instagram_business_account) {
      // Use the Page's own access_token if available, otherwise use stored Page token
      const pageToken = page.access_token || pageAccessToken
      
      const igAccountResponse = await fetch(
        `${INSTAGRAM_API_BASE}/${page.instagram_business_account.id}?access_token=${pageToken}&fields=id,username`
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

  // If no Instagram account found in pages, use the stored Instagram account ID directly
  // (This handles the case where we stored the ID from granular scopes during OAuth)
  // Meta's API doesn't always return instagram_business_account in /me/accounts, but we can still post using the stored ID
  if (connection.platformUserId) {
    console.log('[Instagram API] No Instagram account found in pages, using stored ID directly:', connection.platformUserId)
    console.log('[Instagram API] Note: Meta API may not return instagram_business_account field, but we can still post using the stored account ID')
    
    // Return the stored account info - we don't need to query it if we have the ID
    // The username will be fetched automatically on first successful post
    return {
      id: connection.platformUserId,
      username: connection.platformUsername || 'Instagram User',
      account_type: 'BUSINESS', // Assume BUSINESS since we require Business accounts
    }
  }

  throw new Error('No Instagram Business Account found. Please reconnect your Instagram account.')
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
  caption: string,
  userAccessToken?: string | null
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
    // Use User token if available (required for /me/accounts), otherwise try Page token
    const tokenToUse = userAccessToken || pageAccessToken
    const pagesResponse = await fetch(
      `${INSTAGRAM_API_BASE}/me/accounts?access_token=${tokenToUse}&fields=id,name,access_token,instagram_business_account{id}`
    )
    
    if (!pagesResponse.ok) {
      const errorText = await pagesResponse.text()
      console.error('[Instagram API] Failed to fetch pages for media container:', {
        status: pagesResponse.status,
        error: errorText,
      })
      throw new Error(`Failed to fetch Facebook Pages: ${pagesResponse.status}`)
    }
    
    const pagesData = await pagesResponse.json()
    const pages = pagesData.data || []
    
    // Find the page with the Instagram account
    // Meta's API doesn't always return instagram_business_account field, even with correct permissions
    let page = pages.find((p: any) => {
      const igAccount = p.instagram_business_account
      return igAccount && igAccount.id === igAccountId
    })

    // Fallback: If Meta's API doesn't return instagram_business_account field,
    // use the first page (Instagram accounts are typically linked to one page)
    // This works because:
    // 1. We have instagram_content_publish permission for the Instagram account (from granular scopes)
    // 2. The Page token is from the page linked to that Instagram account
    // 3. The Page token should work for posting even if Meta doesn't return the field
    if (!page || !page.id) {
      console.warn('[Instagram API] Meta API did not return instagram_business_account field, using first available page as fallback', {
        igAccountId,
        pagesFound: pages.length,
        pages: pages.map((p: any) => ({ id: p.id, name: p.name, hasIG: !!p.instagram_business_account })),
      })
      
      if (pages.length > 0) {
        page = pages[0]
        console.log(`[Instagram API] Using first page as fallback: ${page.id} (${page.name})`)
      } else {
        console.error('[Instagram API] No pages found', {
          igAccountId,
          pagesFound: 0,
        })
        throw new Error('No Facebook Pages found. Please ensure your Instagram account is linked to a Facebook Page.')
      }
    }
    
    const pageId = page.id
    console.log(`[Instagram API] Using Facebook Page ${pageId} (${page.name}) for Instagram account ${igAccountId}`)

    const uploadResponse = await fetch(
      `${INSTAGRAM_API_BASE}/${pageId}/photos?access_token=${pageAccessToken}`,
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
      let errorData: any
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { error: { message: errorText } }
      }
      
      console.error('[Instagram API] Media container creation failed:', {
        status: containerResponse.status,
        error: errorData,
      })
      
      // Handle specific error cases
      if (errorData.error?.code === 36003 || errorData.error?.error_subcode === 2207009) {
        // Aspect ratio error
        throw new Error(`Instagram image aspect ratio not supported. Instagram requires square (1:1), portrait (4:5), or landscape (1.91:1) images. Error: ${errorData.error?.error_user_msg || errorData.error?.message}`)
      }
      
      if (containerResponse.status === 403) {
        // Permission error
        throw new Error('Permission denied. Please ensure you have completed App Review for instagram_content_publish permission and that your Instagram account is linked to a Facebook Page.')
      }
      
      if (containerResponse.status === 400 && errorData.error?.message?.includes('permission')) {
        throw new Error(`Instagram API error: ${errorData.error?.message}. Please ensure you have completed App Review for instagram_content_publish permission.`)
      }
      
      throw new Error(`Failed to create media container: ${containerResponse.status} - ${errorData.error?.error_user_msg || errorData.error?.message || 'Unknown error'}`)
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

    // Get page access token and user token (needed for Instagram API)
    const connection = await getSocialConnection(userId, 'instagram')
    if (!connection) {
      throw new Error('Instagram account not connected')
    }
    const pageAccessToken = decrypt(connection.accessToken)
    
    // Get User token from refreshToken field (we store it there for Instagram)
    let userToken: string | null = null
    if (connection.refreshToken) {
      try {
        userToken = decrypt(connection.refreshToken)
      } catch (err) {
        console.warn('[Instagram API] Could not decrypt user token from refreshToken field')
      }
    }
    
    // Fallback: If username is still default, try to fetch it now
    if (!igAccount.username || igAccount.username === 'Instagram User') {
      console.log('[Instagram API] Username is still default, attempting to fetch...')
      try {
        const fetchedUsername = await fetchInstagramUsername(
          connection.id,
          userToken || pageAccessToken,
          igAccount.id,
          userToken ? 'user' : 'page'
        )
        if (fetchedUsername) {
          // Update connection with fetched username
          await prisma.socialConnection.update({
            where: { id: connection.id },
            data: {
              platformUsername: fetchedUsername,
            },
          })
          console.log('[Instagram API] Successfully fetched and updated username:', fetchedUsername)
          // Update igAccount for logging
          igAccount.username = fetchedUsername
        }
      } catch (error) {
        console.warn('[Instagram API] Failed to fetch username on post attempt:', error)
        // Continue with posting even if username fetch fails
      }
    }

    // Create media container (pass User token to find Page ID)
    const containerId = await createMediaContainer(igAccount.id, pageAccessToken, imageUrl, content, userToken)

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
          error: 'Permission denied. Please ensure the app has "instagram_content_publish", "pages_show_list", "pages_read_engagement", and "business_management" permissions. Note: The app must have the "Instagram Graph API" product added (not "Instagram Basic Display API").',
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

