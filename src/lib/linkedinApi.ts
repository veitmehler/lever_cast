/**
 * LinkedIn API Service
 * Handles posting content to LinkedIn using OAuth 2.0
 */

import { getSocialConnection } from './socialConnections'

const LINKEDIN_API_BASE = 'https://api.linkedin.com/v2'

interface LinkedInPostResponse {
  id: string
  activity: string
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

    // Prepare the post content
    const postData: {
      author: string
      lifecycleState: string
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: string }
          shareMediaCategory: string
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
          shareMediaCategory: 'NONE',
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    }

    // If image is provided, add it to the post
    if (imageUrl) {
      // First, register the image as an asset
      // LinkedIn requires uploading image first, then referencing it
      // For now, we'll support text-only posts
      // TODO: Implement image upload to LinkedIn
    }

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
      const error = await postResponse.json().catch(() => ({ message: 'Unknown error' }))
      console.error('LinkedIn API error:', error)
      return { 
        success: false, 
        error: error.message || `LinkedIn API error: ${postResponse.status}` 
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

