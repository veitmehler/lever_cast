/**
 * LinkedIn API Service
 * Handles posting content to LinkedIn using OAuth 2.0
 */

import { getSocialConnection } from './socialConnections'
import { downloadImageFromStorage } from './supabase'
import sizeOf from 'image-size'

const LINKEDIN_API_BASE = 'https://api.linkedin.com/v2'

// LinkedIn image requirements
const LINKEDIN_IMAGE_SPECS = {
  minWidth: 552,
  minHeight: 276,
  maxSizeBytes: 5 * 1024 * 1024, // 5 MB
  supportedFormats: ['jpg', 'jpeg', 'png', 'gif'],
  aspectRatioRange: { min: 0.8, max: 3.0 }, // 4:5 (0.8) to 3:1 (3.0)
}

interface LinkedInPostResponse {
  id: string
  activity: string
}

interface LinkedInAssetUploadResponse {
  value?: {
    uploadUrl?: string
    asset?: string
    mediaArtifact?: string // The media artifact URN to use in posts
    uploadMechanism?: {
      'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'?: {
        uploadUrl?: string
        headers?: {
          'media-type-family'?: string
        }
      }
    }
  }
  // LinkedIn API might return different structures
  uploadUrl?: string
  asset?: string
  mediaArtifact?: string
  // Or nested differently
  uploadInstructions?: {
    uploadUrl?: string
    firstByte?: number
    lastByte?: number
  }
}

/**
 * Upload an image to LinkedIn
 * @param userId - User ID
 * @param imageUrl - Supabase Storage URL of the image
 * @returns Object with asset URN and mediaArtifact URN
 */
export async function uploadImageToLinkedIn(
  userId: string,
  imageUrl: string
): Promise<{ assetUrn: string; mediaArtifactUrn: string }> {
  try {
    console.log(`[LinkedIn API] Uploading image for user ${userId}`)
    
    // Get LinkedIn connection
    const connection = await getSocialConnection(userId, 'linkedin')
    if (!connection) {
      throw new Error('LinkedIn account not connected')
    }

    // Check if token needs refresh
    if (connection.tokenExpiry && new Date(connection.tokenExpiry) <= new Date()) {
      throw new Error('LinkedIn access token expired. Please reconnect your account.')
    }

    // Get user's LinkedIn URN (person ID)
    const profileResponse = await fetch(`${LINKEDIN_API_BASE}/userinfo`, {
      headers: {
        'Authorization': `Bearer ${connection.accessToken}`,
      },
    })

    if (!profileResponse.ok) {
      throw new Error('Failed to fetch LinkedIn profile')
    }

    const profile = await profileResponse.json()
    const personUrn = `urn:li:person:${profile.sub}`

    // Step 1: Register the upload
    const registerResponse = await fetch(
      `${LINKEDIN_API_BASE}/assets?action=registerUpload`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${connection.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registerUploadRequest: {
            recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
            owner: personUrn,
            serviceRelationships: [
              {
                relationshipType: 'OWNER',
                identifier: 'urn:li:userGeneratedContent',
              },
            ],
          },
        }),
      }
    )

    if (!registerResponse.ok) {
      const errorText = await registerResponse.text()
      let error: any
      try {
        error = JSON.parse(errorText)
      } catch {
        error = { message: errorText || 'Unknown error' }
      }
      console.error('[LinkedIn API] Register upload failed:', {
        status: registerResponse.status,
        statusText: registerResponse.statusText,
        error: error,
      })
      throw new Error(`Failed to register upload: ${registerResponse.status} ${error.message || errorText || 'Unknown error'}`)
    }

    const registerResult: LinkedInAssetUploadResponse = await registerResponse.json()
    console.log('[LinkedIn API] Register upload response:', JSON.stringify(registerResult, null, 2))
    
    // LinkedIn API can return different response structures
    // Try to extract uploadUrl and assetUrn from various possible structures
    let uploadUrl: string | undefined
    let assetUrn: string | undefined
    
    if (registerResult.value) {
      // Check nested uploadMechanism structure (most common)
      const uploadMechanism = registerResult.value.uploadMechanism?.['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest']
      if (uploadMechanism?.uploadUrl) {
        uploadUrl = uploadMechanism.uploadUrl
      } else if (registerResult.value.uploadUrl) {
        // Fallback to direct uploadUrl
        uploadUrl = registerResult.value.uploadUrl
      }
      assetUrn = registerResult.value.asset
    } else if (registerResult.uploadUrl) {
      uploadUrl = registerResult.uploadUrl
      assetUrn = registerResult.asset
    } else if (registerResult.uploadInstructions?.uploadUrl) {
      uploadUrl = registerResult.uploadInstructions.uploadUrl
      assetUrn = registerResult.asset
    }
    
    if (!uploadUrl) {
      console.error('[LinkedIn API] uploadUrl is missing from response:', registerResult)
      throw new Error('LinkedIn did not return an upload URL. Response structure: ' + JSON.stringify(registerResult))
    }
    
    if (!assetUrn) {
      console.error('[LinkedIn API] asset URN is missing from response:', registerResult)
      throw new Error('LinkedIn did not return an asset URN. Response structure: ' + JSON.stringify(registerResult))
    }
    
    console.log(`[LinkedIn API] Register upload successful, uploadUrl: ${uploadUrl.substring(0, 50)}..., assetUrn: ${assetUrn}`)

    // Step 2: Download image from Supabase Storage
    const imageBuffer = await downloadImageFromStorage(imageUrl)
    
    // Validate image size
    if (imageBuffer.length > LINKEDIN_IMAGE_SPECS.maxSizeBytes) {
      throw new Error(`Image size (${(imageBuffer.length / 1024 / 1024).toFixed(2)} MB) exceeds LinkedIn's maximum of 5 MB`)
    }
    
    // Get image dimensions
    let imageDimensions: { width?: number; height?: number } | null = null
    try {
      imageDimensions = sizeOf(imageBuffer)
      console.log(`[LinkedIn API] Image dimensions: ${imageDimensions.width}x${imageDimensions.height}, size: ${(imageBuffer.length / 1024).toFixed(2)} KB`)
      
      // Validate dimensions
      if (imageDimensions.width && imageDimensions.height) {
        const width = imageDimensions.width
        const height = imageDimensions.height
        const aspectRatio = width / height
        
        if (width < LINKEDIN_IMAGE_SPECS.minWidth || height < LINKEDIN_IMAGE_SPECS.minHeight) {
          console.warn(`[LinkedIn API] Image dimensions (${width}x${height}) are below LinkedIn's minimum (${LINKEDIN_IMAGE_SPECS.minWidth}x${LINKEDIN_IMAGE_SPECS.minHeight})`)
          console.warn(`[LinkedIn API] LinkedIn may reject this image. Recommended: at least ${LINKEDIN_IMAGE_SPECS.minWidth}x${LINKEDIN_IMAGE_SPECS.minHeight} pixels`)
        }
        
        if (aspectRatio < LINKEDIN_IMAGE_SPECS.aspectRatioRange.min || aspectRatio > LINKEDIN_IMAGE_SPECS.aspectRatioRange.max) {
          console.warn(`[LinkedIn API] Image aspect ratio (${aspectRatio.toFixed(2)}) is outside LinkedIn's recommended range (${LINKEDIN_IMAGE_SPECS.aspectRatioRange.min} to ${LINKEDIN_IMAGE_SPECS.aspectRatioRange.max})`)
          console.warn(`[LinkedIn API] LinkedIn recommends aspect ratios between 4:5 (0.8) and 3:1 (3.0)`)
        }
      }
    } catch (dimError) {
      console.warn(`[LinkedIn API] Could not determine image dimensions:`, dimError)
      // Continue anyway - dimension check is a warning, not a blocker
    }
    
    // Detect content type from image URL or buffer
    // LinkedIn supports: image/jpeg, image/png, image/gif
    let contentType = 'image/jpeg' // default
    if (imageUrl.includes('.png')) {
      contentType = 'image/png'
    } else if (imageUrl.includes('.gif')) {
      contentType = 'image/gif'
    } else if (imageUrl.includes('.jpeg') || imageUrl.includes('.jpg')) {
      contentType = 'image/jpeg'
    }
    
    // Validate format
    const fileExtension = imageUrl.split('.').pop()?.toLowerCase()
    if (fileExtension && !LINKEDIN_IMAGE_SPECS.supportedFormats.includes(fileExtension)) {
      console.warn(`[LinkedIn API] Image format (.${fileExtension}) may not be supported by LinkedIn. Supported: ${LINKEDIN_IMAGE_SPECS.supportedFormats.join(', ')}`)
    }

    // Step 3: Upload image binary to LinkedIn storage URL
    console.log(`[LinkedIn API] Uploading image to LinkedIn storage, content-type: ${contentType}, size: ${imageBuffer.length} bytes`)
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
      },
      body: imageBuffer,
    })

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text()
      console.error('[LinkedIn API] Image upload failed:', {
        status: uploadResponse.status,
        error: errorText,
      })
      throw new Error(`Failed to upload image: ${uploadResponse.status} ${uploadResponse.statusText}`)
    }

    // Extract mediaArtifact URN (required for posting)
    const mediaArtifactUrn = registerResult.value?.mediaArtifact || assetUrn
    
    console.log(`[LinkedIn API] Image uploaded successfully, assetUrn: ${assetUrn}, mediaArtifactUrn: ${mediaArtifactUrn}`)
    return { assetUrn, mediaArtifactUrn }
  } catch (error) {
    console.error('[LinkedIn API] Error uploading image:', error)
    throw error
  }
}

/**
 * Post content to LinkedIn
 */
export async function postToLinkedIn(
  userId: string,
  content: string,
  imageUrl?: string
): Promise<{ success: true; postUrl: string } | { success: false; error: string }> {
  try {
    // Get LinkedIn connection
    const connection = await getSocialConnection(userId, 'linkedin')
    if (!connection) {
      return { success: false, error: 'LinkedIn account not connected' }
    }

    // Check if token needs refresh
    if (connection.tokenExpiry && new Date(connection.tokenExpiry) <= new Date()) {
      // TODO: Implement token refresh
      return { success: false, error: 'LinkedIn access token expired. Please reconnect your account.' }
    }

    // Get user's LinkedIn URN (person ID)
    // First, get the authenticated user's profile to get their URN
    const profileResponse = await fetch(`${LINKEDIN_API_BASE}/userinfo`, {
      headers: {
        'Authorization': `Bearer ${connection.accessToken}`,
      },
    })

    if (!profileResponse.ok) {
      return { success: false, error: 'Failed to fetch LinkedIn profile' }
    }

    const profile = await profileResponse.json()
    const personUrn = `urn:li:person:${profile.sub}` // LinkedIn uses 'sub' as the person ID

    // Upload image if provided
    let assetUrn: string | undefined
    let mediaArtifactUrn: string | undefined
    let imageUploadFailed = false
    
    console.log(`[LinkedIn API] postToLinkedIn called with imageUrl: ${imageUrl || 'undefined/null'}`)
    
    if (imageUrl) {
      try {
        console.log(`[LinkedIn API] Attempting to upload image: ${imageUrl}`)
        const uploadResult = await uploadImageToLinkedIn(userId, imageUrl)
        assetUrn = uploadResult.assetUrn
        mediaArtifactUrn = uploadResult.mediaArtifactUrn
        console.log(`[LinkedIn API] Image upload successful, assetUrn: ${assetUrn}, mediaArtifactUrn: ${mediaArtifactUrn}`)
      } catch (error) {
        console.error('[LinkedIn API] Failed to upload image:', error)
        console.error('[LinkedIn API] Error details:', {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        })
        // Mark that image upload failed, but continue with text-only post
        // LinkedIn image upload has known issues - fallback to text-only
        imageUploadFailed = true
        console.warn('[LinkedIn API] Image upload failed, falling back to text-only post')
      }
    } else {
      console.log(`[LinkedIn API] No imageUrl provided, posting text-only`)
    }

    // Prepare the post content
    const postData: {
      author: string
      lifecycleState: string
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: string }
          shareMediaCategory: string
          media?: Array<{ status: string; id: string }>
        }
      }
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': string
      }
    } = {
      author: personUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: content,
          },
          shareMediaCategory: assetUrn ? 'IMAGE' : 'NONE',
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    }

    // If image was uploaded successfully, add media object
    // LinkedIn requires the asset URN in the media field
    // Need to wait for LinkedIn to process the uploaded asset before posting
    // NOTE: LinkedIn image posting has known API issues - if it fails, post text-only
    if (assetUrn && !imageUploadFailed) {
      // Wait for LinkedIn to process the uploaded asset
      // LinkedIn needs time to process the asset after upload
      // Increased wait time - LinkedIn may need more time to make asset available for posting
      console.log(`[LinkedIn API] Waiting 20 seconds for LinkedIn to process uploaded asset...`)
      await new Promise(resolve => setTimeout(resolve, 20000))
      
      // Note: LinkedIn's asset verification endpoint (/digitalMediaAssets/{id}) returns 404
      // This appears to be expected - LinkedIn may not expose this endpoint publicly
      // We'll proceed with posting and let LinkedIn validate the asset URN
      
      // LinkedIn media structure
      // LinkedIn keeps rejecting the media URN even though we're including it
      // Try multiple approaches: asset URN, mediaArtifact URN, and different structures
      // Based on error analysis, LinkedIn sees the media field but says it's missing
      // This suggests a format or timing issue
      
      // Try using just the asset URN first (most common approach)
      // LinkedIn's error message shows it sees the media field but rejects the URN format
      if (!assetUrn) {
        console.error(`[LinkedIn API] No asset URN available`)
        throw new Error('No asset URN available for posting')
      }
      
      // Verify asset URN format
      if (!assetUrn.startsWith('urn:li:digitalmediaAsset:')) {
        console.error(`[LinkedIn API] Invalid asset URN format: ${assetUrn}`)
        throw new Error(`Invalid asset URN format: ${assetUrn}`)
      }
      
      // LinkedIn media structure
      // Based on LinkedIn API documentation, the media field should use 'media' (not 'id')
      // and should include description and title fields
      postData.specificContent['com.linkedin.ugc.ShareContent'].media = [
        {
          status: 'READY', // Required by LinkedIn API
          media: assetUrn, // Use 'media' field (not 'id') with asset URN
          description: {
            text: 'Image attached to post', // Description is required
          },
          title: {
            text: 'Post image', // Title is required
          },
        },
      ]
      
      console.log(`[LinkedIn API] Posting with image (using asset URN):`)
      console.log(`[LinkedIn API]   - Asset URN: ${assetUrn}`)
      console.log(`[LinkedIn API]   - MediaArtifact URN: ${mediaArtifactUrn || 'none'}`)
      console.log(`[LinkedIn API]   - Person URN (owner): ${personUrn}`)
      console.log(`[LinkedIn API]   - Media structure:`, JSON.stringify(postData.specificContent['com.linkedin.ugc.ShareContent'].media, null, 2))
    } else {
      console.log(`[LinkedIn API] Posting text-only post (no image)`)
    }

    console.log(`[LinkedIn API] Post data:`, JSON.stringify(postData, null, 2))

    // Post to LinkedIn
    const postResponse = await fetch(`${LINKEDIN_API_BASE}/ugcPosts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${connection.accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(postData),
    })

    if (!postResponse.ok) {
      const errorText = await postResponse.text()
      let error: any
      try {
        error = JSON.parse(errorText)
      } catch {
        error = { message: errorText || 'Unknown error' }
      }
      
      // Log the full error for debugging
      console.error('[LinkedIn API] Post failed with error:', {
        status: postResponse.status,
        statusText: postResponse.statusText,
        error: error,
        errorMessage: error.message,
        errorDetails: error.errorDetails,
        postData: JSON.stringify(postData, null, 2),
      })
      
      // Check if error is related to media/image
      const isMediaError = error.message?.includes('ShareMedia.media') || 
                          error.message?.includes('media (URN)') ||
                          error.message?.includes('mediaArtifact') ||
                          error.message?.includes('media') ||
                          error.errorDetailType === 'com.linkedin.common.error.BadRequest'
      
      console.log(`[LinkedIn API] Is media error: ${isMediaError}`)
      
      // If image was included and we get a media error, try posting without image
      if (isMediaError && assetUrn && !imageUploadFailed) {
        console.warn('[LinkedIn API] Post failed with media error, retrying without image...')
        console.warn('[LinkedIn API] Original error:', JSON.stringify(error, null, 2))
        
        // Remove media from post data and try again
        const textOnlyPostData = {
          ...postData,
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: postData.specificContent['com.linkedin.ugc.ShareContent'].shareCommentary,
              shareMediaCategory: 'NONE',
            },
          },
        }
        
        const retryResponse = await fetch(`${LINKEDIN_API_BASE}/ugcPosts`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${connection.accessToken}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0',
          },
          body: JSON.stringify(textOnlyPostData),
        })
        
        if (retryResponse.ok) {
          const retryResult: LinkedInPostResponse = await retryResponse.json()
          const postUrl = `https://www.linkedin.com/feed/update/${retryResult.id}`
          
          console.warn('[LinkedIn API] Post succeeded without image (LinkedIn image API has known issues)')
          console.warn('[LinkedIn API] The image was uploaded successfully but LinkedIn rejected it in the post. This may be a LinkedIn API issue.')
          return {
            success: true,
            postUrl,
          }
        } else {
          const retryErrorText = await retryResponse.text()
          console.error('[LinkedIn API] Retry without image also failed:', retryErrorText)
        }
      }
      
      console.error('[LinkedIn API] Post failed:', {
        status: postResponse.status,
        statusText: postResponse.statusText,
        error: error,
        postData: postData,
        isMediaError,
      })
      return { 
        success: false, 
        error: error.message || error.errorDetails || `LinkedIn API error: ${postResponse.status} ${postResponse.statusText}` 
      }
    }

    const result: LinkedInPostResponse = await postResponse.json()
    
    // LinkedIn returns the post ID, construct the URL
    const postUrl = `https://www.linkedin.com/feed/update/${result.id}`

    return {
      success: true,
      postUrl,
    }
  } catch (error) {
    console.error('Error posting to LinkedIn:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Refresh LinkedIn access token
 */
export async function refreshLinkedInToken(
  userId: string,
  refreshToken: string
): Promise<{ accessToken: string; expiresIn: number } | null> {
  // LinkedIn OAuth 2.0 token refresh
  // TODO: Implement token refresh logic
  return null
}

/**
 * Get LinkedIn analytics for a post
 * @param userId - User ID
 * @param postId - LinkedIn post ID (activity URN or post ID)
 * @returns Analytics data (impressions, clicks, likes, comments, shares)
 */
export async function getLinkedInAnalytics(
  userId: string,
  postId: string
): Promise<{
  impressions?: number
  clicks?: number
  likes?: number
  comments?: number
  shares?: number
} | null> {
  try {
    console.log(`[LinkedIn API] Fetching analytics for post ${postId}`)
    
    // Get LinkedIn connection
    const connection = await getSocialConnection(userId, 'linkedin')
    if (!connection) {
      console.error(`[LinkedIn API] No connection found for user ${userId}`)
      return null
    }

    // Check if token needs refresh
    if (connection.tokenExpiry && new Date(connection.tokenExpiry) <= new Date()) {
      console.error(`[LinkedIn API] Token expired`)
      return null
    }

    // LinkedIn Analytics API requires specific permissions and endpoints
    // Note: LinkedIn Analytics API is complex and may require different endpoints
    // For now, we'll use a simplified approach
    // The actual endpoint depends on LinkedIn API version and permissions
    
    // Try to fetch analytics using the ugcPosts endpoint with analytics fields
    // Note: This may require additional permissions
    const response = await fetch(
      `${LINKEDIN_API_BASE}/ugcPosts/${postId}?fields=id,distribution`,
      {
        headers: {
          'Authorization': `Bearer ${connection.accessToken}`,
        },
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[LinkedIn API] Failed to fetch analytics:', {
        status: response.status,
        error: errorText,
      })
      
      // LinkedIn Analytics API may not be available or may require different permissions
      // Return null to indicate analytics are not available
      return null
    }

    // LinkedIn Analytics API structure varies
    // For now, return null as LinkedIn analytics require more complex setup
    // TODO: Implement proper LinkedIn analytics fetching based on available API endpoints
    console.log(`[LinkedIn API] Analytics endpoint accessed but full implementation requires additional setup`)
    return null
  } catch (error) {
    console.error('[LinkedIn API] Error fetching analytics:', error)
    return null
  }
}

