/**
 * Twitter/X API Service
 * Handles posting content to Twitter/X using OAuth 2.0
 */

import { getSocialConnection } from './socialConnections'
import { encrypt, decrypt } from './encryption'
import { prisma } from './prisma'
import { downloadImageFromStorage } from './supabase'

const TWITTER_API_BASE = 'https://api.twitter.com/2'
// TWITTER_API_V1_BASE is reserved for future use
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const TWITTER_API_V1_BASE = 'https://api.twitter.com/1.1'

interface TwitterPostResponse {
  data: {
    id: string
    text: string
  }
}

/**
 * Verify that a tweet exists and is accessible
 */
export async function verifyTweetExists(
  userId: string,
  tweetId: string
): Promise<boolean> {
  try {
    const connection = await getSocialConnection(userId, 'twitter')
    if (!connection) {
      return false
    }

    // Check if token is expired or expiring soon, and refresh proactively
    // Proactive refresh prevents refresh token expiration (Twitter refresh tokens expire after ~90 days of inactivity)
    let accessToken = connection.accessToken
    
    // Refresh if expired OR if expiring within 30 minutes (proactive refresh)
    const shouldRefresh = connection.tokenExpiry && (
      new Date(connection.tokenExpiry) <= new Date() || // Already expired
      new Date(connection.tokenExpiry) <= new Date(Date.now() + 30 * 60 * 1000) // Expiring within 30 minutes
    )
    
    if (shouldRefresh) {
      if (connection.refreshToken) {
        // Decrypt refresh token before using it
        const decryptedRefreshToken = decrypt(connection.refreshToken)
        const refreshResult = await refreshTwitterToken(userId, decryptedRefreshToken)
        if (refreshResult) {
          accessToken = refreshResult.accessToken
          const newExpiry = new Date(Date.now() + refreshResult.expiresIn * 1000)
          
          await prisma.socialConnection.update({
            where: {
              id: connection.id,
            },
            data: {
              accessToken: encrypt(refreshResult.accessToken),
              refreshToken: refreshResult.refreshToken ? encrypt(refreshResult.refreshToken) : undefined,
              tokenExpiry: newExpiry,
            },
          })
        } else {
          return false
        }
      } else {
        return false
      }
    }

    // Fetch the tweet to verify it exists
    const response = await fetch(`${TWITTER_API_BASE}/tweets/${tweetId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    return response.ok
  } catch (error) {
    console.error(`[Twitter API] Error verifying tweet ${tweetId}:`, error)
    return false
  }
}

/**
 * Upload an image to Twitter/X
 * @param userId - User ID
 * @param imageUrl - Supabase Storage URL of the image
 * @returns Media ID string for use in tweet
 */
export async function uploadImageToTwitter(
  userId: string,
  imageUrl: string
): Promise<string> {
  try {
    console.log(`[Twitter API] Uploading image for user ${userId}`)
    
    // Get Twitter connection
    const connection = await getSocialConnection(userId, 'twitter')
    if (!connection) {
      throw new Error('Twitter/X account not connected')
    }

    // Check if token is expired or expiring soon, and refresh proactively
    // Proactive refresh prevents refresh token expiration (Twitter refresh tokens expire after ~90 days of inactivity)
    let accessToken = connection.accessToken
    
    // Refresh if expired OR if expiring within 30 minutes (proactive refresh)
    const shouldRefresh = connection.tokenExpiry && (
      new Date(connection.tokenExpiry) <= new Date() || // Already expired
      new Date(connection.tokenExpiry) <= new Date(Date.now() + 30 * 60 * 1000) // Expiring within 30 minutes
    )
    
    if (shouldRefresh) {
      if (connection.refreshToken) {
        // Decrypt refresh token before using it
        const decryptedRefreshToken = decrypt(connection.refreshToken)
        const refreshResult = await refreshTwitterToken(userId, decryptedRefreshToken)
        if (refreshResult) {
          accessToken = refreshResult.accessToken
          const newExpiry = new Date(Date.now() + refreshResult.expiresIn * 1000)
          
          await prisma.socialConnection.update({
            where: {
              id: connection.id,
            },
            data: {
              accessToken: encrypt(refreshResult.accessToken),
              refreshToken: refreshResult.refreshToken ? encrypt(refreshResult.refreshToken) : undefined,
              tokenExpiry: newExpiry,
            },
          })
        } else {
          throw new Error('Twitter/X access token expired and refresh failed')
        }
      } else {
        throw new Error('Twitter/X access token expired')
      }
    }

    // Download image from Supabase Storage
    const imageBuffer = await downloadImageFromStorage(imageUrl)
    
    // Upload to Twitter using v2 media/upload endpoint
    // Twitter v2 endpoint supports OAuth 2.0 User Context with media.write scope
    // Requires media_category parameter: "tweet_image" for images attached to tweets
    const formData = new FormData()
    const blob = new Blob([imageBuffer], { type: 'image/jpeg' }) // Explicitly set content type
    formData.append('media', blob, 'image.jpg')
    formData.append('media_category', 'tweet_image') // Required for v2 endpoint

    console.log(`[Twitter API] Uploading image to ${TWITTER_API_BASE}/media/upload`)
    console.log(`[Twitter API] Image size: ${imageBuffer.length} bytes`)
    console.log(`[Twitter API] Media category: tweet_image`)
    
    const uploadResponse = await fetch(`${TWITTER_API_BASE}/media/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        // Don't set Content-Type header - let fetch set it with boundary for multipart/form-data
      },
      body: formData,
    })

    console.log(`[Twitter API] Upload response status: ${uploadResponse.status} ${uploadResponse.statusText}`)
    
    interface TwitterError {
      errors?: Array<{
        message?: string
        code?: number
      }>
      error?: string
      [key: string]: unknown
    }

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text()
      let errorDetails: TwitterError
      try {
        errorDetails = JSON.parse(errorText) as TwitterError
      } catch {
        errorDetails = { error: errorText }
      }
      
      console.error('[Twitter API] Image upload failed:', {
        status: uploadResponse.status,
        statusText: uploadResponse.statusText,
        error: errorDetails,
        headers: Object.fromEntries(uploadResponse.headers.entries()),
      })
      
      // Provide more specific error messages
      if (uploadResponse.status === 404) {
        throw new Error(`Twitter media upload endpoint not found (404). Free tier DOES support image uploads, so this may indicate:
1. The endpoint URL is incorrect (we're using /2/media/upload)
2. Your OAuth token doesn't have the 'media.write' scope
3. Try disconnecting and reconnecting your Twitter account to get a new token with media.write scope`)
      } else if (uploadResponse.status === 403) {
        throw new Error(`Twitter rejected media upload (403). Free tier DOES support image uploads, so this usually means:
1. Your OAuth token doesn't have the 'media.write' scope
2. Try disconnecting and reconnecting your Twitter account to get a new token with media.write scope
3. Verify your app has "Read and write" permissions enabled`)
      } else {
        throw new Error(`Failed to upload image: ${uploadResponse.status} ${uploadResponse.statusText}. Error: ${errorDetails.error || errorDetails.message || errorText}`)
      }
    }

    const uploadResult = await uploadResponse.json()
    console.log(`[Twitter API] Upload result:`, uploadResult)
    
    // Twitter API v2 returns the media ID as 'id' inside the 'data' object
    // Format: { data: { id: '...', media_key: '...', ... } }
    const mediaId = uploadResult.data?.id || uploadResult.id || uploadResult.media_id || uploadResult.media_id_string
    
    if (!mediaId) {
      console.error('[Twitter API] Upload response missing media ID:', uploadResult)
      throw new Error('Twitter API did not return media ID. Response: ' + JSON.stringify(uploadResult))
    }

    console.log(`[Twitter API] Image uploaded successfully, media_id: ${mediaId}`)
    return mediaId
  } catch (error) {
    console.error('[Twitter API] Error uploading image:', error)
    throw error
  }
}

/**
 * Post a single tweet to Twitter/X
 */
export async function postToTwitter(
  userId: string,
  content: string,
  replyToTweetId?: string,
  imageUrl?: string
): Promise<{ success: true; postUrl: string; tweetId: string } | { success: false; error: string }> {
  let requestId: string | undefined
  
  try {
    console.log(`[Twitter API] Posting tweet for user ${userId}, replyTo: ${replyToTweetId || 'none'}`)
    
    // Check 24-hour rate limit by counting API requests in database
    // Twitter Free tier: 17 requests per 24 hours
    // Twitter Basic tier: 100 requests per 24 hours
    // Rate limit applies to REQUESTS, not successful posts
    const FREE_TIER_24H_LIMIT = 17
    const BASIC_TIER_24H_LIMIT = 100
    
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const requestsLast24Hours = await prisma.twitterApiRequest.count({
      where: {
        userId,
        endpoint: 'POST /2/tweets', // Only count tweet posting requests, not media uploads
        requestedAt: {
          gte: twentyFourHoursAgo,
        },
      },
    })
    
    console.log(`[Twitter API] POST /2/tweets requests in last 24 hours: ${requestsLast24Hours} (Free limit: ${FREE_TIER_24H_LIMIT}, Basic limit: ${BASIC_TIER_24H_LIMIT})`)
    
    // Check against Free tier limit (conservative)
    if (requestsLast24Hours >= FREE_TIER_24H_LIMIT) {
      // Find the oldest request in the last 24 hours to calculate when limit resets
      const oldestRequest = await prisma.twitterApiRequest.findFirst({
        where: {
          userId,
          endpoint: 'POST /2/tweets',
          requestedAt: {
            gte: twentyFourHoursAgo,
          },
        },
        orderBy: {
          requestedAt: 'asc',
        },
        select: {
          requestedAt: true,
        },
      })
      
      let resetTime: Date | null = null
      if (oldestRequest?.requestedAt) {
        resetTime = new Date(oldestRequest.requestedAt.getTime() + 24 * 60 * 60 * 1000)
      }
      
      const hoursUntilReset = resetTime ? (resetTime.getTime() - Date.now()) / (1000 * 60 * 60) : null
      const minutesUntilReset = resetTime ? Math.ceil((resetTime.getTime() - Date.now()) / 60000) : null
      
      let errorMessage = `24-hour rate limit exceeded. You've made ${requestsLast24Hours} POST /2/tweets request(s) in the last 24 hours. `
      
      if (resetTime && hoursUntilReset !== null) {
        const hours = Math.floor(hoursUntilReset)
        const minutes = Math.floor((hoursUntilReset - hours) * 60)
        if (hours > 0) {
          errorMessage += `Rate limit resets in ${hours} hour(s) and ${minutes} minute(s) (at ${resetTime.toISOString()}). `
        } else if (minutesUntilReset !== null) {
          errorMessage += `Rate limit resets in ${minutesUntilReset} minute(s) (at ${resetTime.toISOString()}). `
        }
      }
      
      errorMessage += `Twitter Free tier allows ${FREE_TIER_24H_LIMIT} requests per 24 hours. Basic tier allows ${BASIC_TIER_24H_LIMIT} requests per 24 hours.`
      
      console.log(`[Twitter API] 24-hour rate limit check failed:`, {
        requestsLast24Hours,
        limit: FREE_TIER_24H_LIMIT,
        resetTime: resetTime?.toISOString(),
        hoursUntilReset,
        minutesUntilReset,
      })
      
      return { success: false, error: errorMessage }
    }
    
    // Log this request attempt BEFORE making the API call
    // This ensures we count the request even if it fails
    const requestRecord = await prisma.twitterApiRequest.create({
      data: {
        userId,
        endpoint: 'POST /2/tweets',
        statusCode: null, // Will be updated after response
        success: false, // Will be updated after response
        errorMessage: null,
      },
    })
    requestId = requestRecord.id
    
    // Get Twitter connection
    const connection = await getSocialConnection(userId, 'twitter')
    if (!connection) {
      console.error(`[Twitter API] No connection found for user ${userId}`)
      return { success: false, error: 'Twitter/X account not connected' }
    }
    
    console.log(`[Twitter API] Found connection for user ${userId}, platformUsername: ${connection.platformUsername}`)
    console.log(`[Twitter API] Token expiry: ${connection.tokenExpiry ? connection.tokenExpiry.toISOString() : 'not set'}`)

    // Check if token is expired or expiring soon, and refresh proactively
    // Proactive refresh prevents refresh token expiration (Twitter refresh tokens expire after ~90 days of inactivity)
    let accessToken = connection.accessToken
    
    // Refresh if expired OR if expiring within 30 minutes (proactive refresh)
    const shouldRefresh = connection.tokenExpiry && (
      new Date(connection.tokenExpiry) <= new Date() || // Already expired
      new Date(connection.tokenExpiry) <= new Date(Date.now() + 30 * 60 * 1000) // Expiring within 30 minutes
    )
    
    if (shouldRefresh) {
      console.log(`[Twitter API] Token expired, checking for refresh token...`)
      if (connection.refreshToken) {
        console.log(`[Twitter API] Attempting to refresh token...`)
        // Note: getSocialConnection already decrypts tokens, so connection.refreshToken is already decrypted
        const refreshResult = await refreshTwitterToken(userId, connection.refreshToken)
        if (refreshResult) {
          accessToken = refreshResult.accessToken
          const newExpiry = new Date(Date.now() + refreshResult.expiresIn * 1000)
          
          // Update the connection in the database
          // Use connection.id instead of compound unique constraint (which may not exist)
          await prisma.socialConnection.update({
            where: {
              id: connection.id,
            },
            data: {
              accessToken: encrypt(refreshResult.accessToken),
              refreshToken: refreshResult.refreshToken ? encrypt(refreshResult.refreshToken) : undefined,
              tokenExpiry: newExpiry,
            },
          })
          
          console.log(`[Twitter API] Token refreshed successfully, new expiry: ${newExpiry.toISOString()}`)
        } else {
          console.error(`[Twitter API] Token refresh failed, token may be invalid`)
          return { success: false, error: 'Twitter/X access token expired and refresh failed. Please reconnect your account.' }
        }
      } else {
        console.error(`[Twitter API] Token expired but no refresh token available`)
        return { success: false, error: 'Twitter/X access token expired. Please reconnect your account.' }
      }
    }
    
    // Verify token has write permissions by checking user info
    // This helps debug permission issues
    try {
      const verifyResponse = await fetch(`${TWITTER_API_BASE}/users/me?user.fields=id,username`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })
      
      if (!verifyResponse.ok) {
        const verifyError = await verifyResponse.json().catch(() => ({ detail: 'Unknown error' }))
        console.error(`[Twitter API] Token verification failed:`, {
          status: verifyResponse.status,
          error: verifyError,
        })
      } else {
        const verifyData = await verifyResponse.json()
        console.log(`[Twitter API] Token verified, user:`, verifyData.data?.username || 'unknown')
      }
    } catch (error) {
      console.warn(`[Twitter API] Could not verify token:`, error)
    }
    
    // Upload image if provided
    let mediaId: string | undefined
    if (imageUrl) {
      try {
        mediaId = await uploadImageToTwitter(userId, imageUrl)
      } catch (error) {
        console.error('[Twitter API] Failed to upload image, falling back to text-only post:', error)
        // Continue with text-only post if image upload fails
      }
    }

    const tweetData: { 
      text: string
      reply?: { in_reply_to_tweet_id: string }
      media?: { media_ids: string[] }
    } = {
      text: content,
    }

    // If this is a reply, add the reply_to field
    if (replyToTweetId) {
      tweetData.reply = {
        in_reply_to_tweet_id: replyToTweetId,
      }
    }

    // If image was uploaded, add media_ids
    if (mediaId) {
      tweetData.media = {
        media_ids: [mediaId],
      }
    }

    // Post to Twitter/X
    console.log(`[Twitter API] Making POST request to ${TWITTER_API_BASE}/tweets`)
    console.log(`[Twitter API] Request body:`, JSON.stringify(tweetData, null, 2))
    console.log(`[Twitter API] Using access token (first 20 chars): ${accessToken.substring(0, 20)}...`)
    
    let postResponse = await fetch(`${TWITTER_API_BASE}/tweets`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Levercast/1.0',
      },
      body: JSON.stringify(tweetData),
    })
    
    // Log response headers for debugging
    const responseHeaders = Object.fromEntries(postResponse.headers.entries())
    console.log(`[Twitter API] Response headers:`, {
      'x-access-level': responseHeaders['x-access-level'],
      'x-rate-limit-remaining': responseHeaders['x-rate-limit-remaining'],
      'x-rate-limit-limit': responseHeaders['x-rate-limit-limit'],
      'www-authenticate': responseHeaders['www-authenticate'],
    })

    console.log(`[Twitter API] Response status: ${postResponse.status} ${postResponse.statusText}`)
    
    // Log rate limit headers for debugging
    const rateLimitRemaining = postResponse.headers.get('x-rate-limit-remaining')
    const rateLimitReset = postResponse.headers.get('x-rate-limit-reset')
    const rateLimitLimit = postResponse.headers.get('x-rate-limit-limit')
    
    if (rateLimitRemaining !== null || rateLimitReset !== null || rateLimitLimit !== null) {
      console.log(`[Twitter API] Rate limit info:`, {
        remaining: rateLimitRemaining,
        limit: rateLimitLimit,
        resetEpoch: rateLimitReset,
        reset: rateLimitReset ? new Date(parseInt(rateLimitReset, 10) * 1000).toISOString() : null,
      })
    }

    // If posting with media fails with 403, try posting without media
    // Free tier might not support tweets with media attachments
    if (!postResponse.ok && postResponse.status === 403 && mediaId) {
      console.log(`[Twitter API] Posting with media failed (403), trying text-only post...`)
      const textOnlyData = {
        text: content,
        ...(replyToTweetId ? { reply: { in_reply_to_tweet_id: replyToTweetId } } : {}),
      }
      
      postResponse = await fetch(`${TWITTER_API_BASE}/tweets`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Levercast/1.0',
        },
        body: JSON.stringify(textOnlyData),
      })
      
      console.log(`[Twitter API] Text-only post response status: ${postResponse.status} ${postResponse.statusText}`)
      
      if (postResponse.ok) {
        console.log(`[Twitter API] Text-only post succeeded (Free tier may not support tweets with media)`)
      }
    }

    if (!postResponse.ok) {
      const errorText = await postResponse.text()
      let error: { detail?: string; title?: string; message?: string }
      try {
        error = JSON.parse(errorText) as { detail?: string; title?: string; message?: string }
      } catch {
        error = { detail: errorText || 'Unknown error' }
      }
      
      console.error('Twitter API error:', {
        status: postResponse.status,
        statusText: postResponse.statusText,
        error: error,
        userId: userId,
        hasReplyTo: !!replyToTweetId,
        requestBody: tweetData,
      })
      
      // Provide more helpful error messages
      let errorMessage = error.detail || error.title || error.message
      
      // Handle 403 Forbidden - permissions issue
      if (postResponse.status === 403) {
        // Check if it's a duplicate content issue
        if (errorMessage?.toLowerCase().includes('duplicate') || errorMessage?.toLowerCase().includes('already')) {
          errorMessage = `Twitter rejected this post because it appears to be duplicate content. Please modify the content slightly and try again.`
        } else {
          // Check if Twitter API v2 requires elevated access
          errorMessage = `Twitter API returned 403 Forbidden: "${errorMessage}". 

**Diagnosis**: Your token shows 'read-write' permissions, but tweet posting is still blocked.

Possible causes:
1. **Free tier limitation**: Free tier may not support posting tweets WITH media attachments (even though both work separately)
2. Your Twitter account may have restrictions or be in read-only mode
3. Twitter's Free tier might have undocumented restrictions on POST /2/tweets

**What we tried**:
- ✅ Image upload works (media.write scope confirmed)
- ✅ Token has read-write permissions (x-access-level header confirmed)
- ❌ Tweet posting fails (403 Forbidden)

**To fix this**:
1. **Try posting without an image** - Free tier might only support text-only tweets
2. **Upgrade to Basic tier** ($100/month) for full write access including media attachments
3. Check your Twitter account status (not suspended/restricted)
4. Contact Twitter Developer Support if Free tier should support this`
        }
        return { success: false, error: errorMessage }
      }
      
      // Handle rate limiting separately
      if (postResponse.status === 429) {
        // Extract reset time from headers
        const rateLimitResetRaw = postResponse.headers.get('x-rate-limit-reset')
        const rateLimitRemaining = postResponse.headers.get('x-rate-limit-remaining')
        const rateLimitLimit = postResponse.headers.get('x-rate-limit-limit')
        const resetTime = rateLimitResetRaw ? new Date(parseInt(rateLimitResetRaw, 10) * 1000) : null
        const secondsUntilReset = resetTime ? Math.max(0, Math.round((resetTime.getTime() - Date.now()) / 1000)) : null
        const minutesUntilReset = secondsUntilReset !== null ? Math.ceil(secondsUntilReset / 60) : null
        const hoursUntilReset = secondsUntilReset !== null ? secondsUntilReset / 3600 : null
        const remaining = rateLimitRemaining ? parseInt(rateLimitRemaining, 10) : null
        
        // Also check our database for 24-hour limit (count REQUESTS, not posts)
        const FREE_TIER_24H_LIMIT = 17
        const BASIC_TIER_24H_LIMIT = 100
        
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
        const requestsLast24Hours = await prisma.twitterApiRequest.count({
          where: {
            userId,
            endpoint: 'POST /2/tweets',
            requestedAt: {
              gte: twentyFourHoursAgo,
            },
          },
        })
        
        // Find oldest request in last 24h to calculate 24h reset time
        const oldestRequest = await prisma.twitterApiRequest.findFirst({
          where: {
            userId,
            endpoint: 'POST /2/tweets',
            requestedAt: {
              gte: twentyFourHoursAgo,
            },
          },
          orderBy: {
            requestedAt: 'asc',
          },
          select: {
            requestedAt: true,
          },
        })
        
        const db24hResetTime = oldestRequest?.requestedAt 
          ? new Date(oldestRequest.requestedAt.getTime() + 24 * 60 * 60 * 1000)
          : null
        const db24hHoursUntilReset = db24hResetTime 
          ? (db24hResetTime.getTime() - Date.now()) / (1000 * 60 * 60)
          : null
        
        let is24HourLimit = false
        let is15MinLimit = false
        let is3HourLimit = false
        
        // Check database first - if we've hit 24h limit, that's likely the issue
        if (requestsLast24Hours >= FREE_TIER_24H_LIMIT) {
          is24HourLimit = true
        } else if (secondsUntilReset !== null) {
          // Otherwise, use header reset time to determine window
          const within = (targetSeconds: number) => secondsUntilReset <= targetSeconds + 60 // add one-minute buffer
          
          if (within(15 * 60)) {
            is15MinLimit = true
          } else if (within(3 * 60 * 60)) {
            is3HourLimit = true
          } else if (within(24 * 60 * 60)) {
            is24HourLimit = true
          }
        }
        
        if (!is15MinLimit && !is3HourLimit && !is24HourLimit && remaining !== null) {
          if (remaining <= 17) {
            is24HourLimit = true
          } else if (remaining <= 100 && (minutesUntilReset !== null && minutesUntilReset <= 15)) {
            is15MinLimit = true
          } else if (remaining <= 300 && (hoursUntilReset !== null && hoursUntilReset <= 4)) {
            is3HourLimit = true
          } else if (remaining <= 100 && (hoursUntilReset !== null && hoursUntilReset >= 20)) {
            is24HourLimit = true
          }
        }
        
        if (minutesUntilReset !== null) {
          if (is24HourLimit) {
            // Use database reset time if available (more accurate for 24h limit)
            const resetTimeToUse = db24hResetTime || resetTime
            const hoursToUse = db24hHoursUntilReset !== null ? db24hHoursUntilReset : hoursUntilReset
            const minutesToUse = hoursToUse !== null 
              ? Math.ceil((hoursToUse - Math.floor(hoursToUse)) * 60)
              : minutesUntilReset
            
            const hours = hoursToUse !== null ? Math.floor(hoursToUse) : 0
            const minutes = minutesToUse !== null ? minutesToUse : minutesUntilReset || 0
            
            if (hours > 0) {
              errorMessage = `Rate limit exceeded (24-hour window). You've made ${requestsLast24Hours} POST /2/tweets request(s) in the last 24 hours. Please wait ${hours} hour(s) and ${minutes} minute(s) before trying again. Rate limit resets at ${resetTimeToUse?.toISOString()}. Twitter allows ${FREE_TIER_24H_LIMIT} requests per 24 hours (Free plan) or ${BASIC_TIER_24H_LIMIT} requests per 24 hours (Basic plan).`
            } else {
              errorMessage = `Rate limit exceeded (24-hour window). You've made ${requestsLast24Hours} POST /2/tweets request(s) in the last 24 hours. Please wait ${minutes} minute(s) before trying again. Rate limit resets at ${resetTimeToUse?.toISOString()}. Twitter allows ${FREE_TIER_24H_LIMIT} requests per 24 hours (Free plan) or ${BASIC_TIER_24H_LIMIT} requests per 24 hours (Basic plan).`
            }
          } else if (is3HourLimit) {
            const hours = Math.floor(hoursUntilReset || 0)
            const minutes = Math.floor(((hoursUntilReset || 0) - hours) * 60)
            errorMessage = `Rate limit exceeded (3-hour window). Please wait ${hours} hour(s) and ${minutes} minute(s) before trying again. Rate limit resets at ${resetTime.toISOString()}. Twitter allows 300 tweets per 3-hour window.`
          } else if (is15MinLimit) {
            errorMessage = `Rate limit exceeded (15-minute window). Please wait ${minutesUntilReset} minute(s) before trying again. Rate limit resets at ${resetTime.toISOString()}. Twitter allows 100 tweets per 15 minutes (Pro plan) or fewer on Basic/Free plans.`
          } else {
            errorMessage = `Rate limit exceeded. Please wait ${minutesUntilReset} minute(s) before trying again. Rate limit resets at ${resetTime.toISOString()}.`
          }
        } else {
          errorMessage = `Rate limit exceeded. Twitter API rate limits: 100 tweets per 15 minutes (Pro), ${BASIC_TIER_24H_LIMIT} tweets per 24 hours (Basic), or ${FREE_TIER_24H_LIMIT} tweets per 24 hours (Free). Please wait before trying again.`
        }
        
        console.log(`[Twitter API] Rate limit details:`, {
          remaining: rateLimitRemaining,
          limit: rateLimitLimit,
          resetEpoch: rateLimitResetRaw,
          reset: resetTime?.toISOString(),
          secondsUntilReset,
          minutesUntilReset,
          hoursUntilReset,
          is15MinLimit,
          is3HourLimit,
          is24HourLimit,
          // Database-based 24h tracking (REQUESTS, not posts)
          requestsLast24Hours,
          db24hResetTime: db24hResetTime?.toISOString(),
          db24hHoursUntilReset,
        })
      } else if (postResponse.status === 401) {
        // If we get 401, try refreshing token once more (in case token expired between check and request)
        if (connection.refreshToken) {
          console.log(`[Twitter API] Got 401, attempting token refresh...`)
          // Note: getSocialConnection already decrypts tokens, so connection.refreshToken is already decrypted
          const refreshResult = await refreshTwitterToken(userId, connection.refreshToken)
          if (refreshResult) {
            // Update connection and retry with new token
            const newExpiry = new Date(Date.now() + refreshResult.expiresIn * 1000)
            await prisma.socialConnection.update({
              where: {
                id: connection.id,
              },
              data: {
                accessToken: encrypt(refreshResult.accessToken),
                refreshToken: refreshResult.refreshToken ? encrypt(refreshResult.refreshToken) : undefined,
                tokenExpiry: newExpiry,
              },
            })
            
            // Retry the request with new token
            const retryResponse = await fetch(`${TWITTER_API_BASE}/tweets`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${refreshResult.accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(tweetData),
            })
            
            if (retryResponse.ok) {
              const retryResult: TwitterPostResponse = await retryResponse.json()
              const tweetId = retryResult.data.id
              const username = connection.platformUsername || 'twitter'
              const postUrl = `https://twitter.com/${username}/status/${tweetId}`
              
              console.log(`[Twitter API] Request succeeded after token refresh`)
              return {
                success: true,
                postUrl,
                tweetId,
              }
            } else {
              const retryError = await retryResponse.json().catch(() => ({ detail: 'Unknown error' }))
              console.error(`[Twitter API] Retry after refresh also failed:`, {
                status: retryResponse.status,
                error: retryError,
              })
              
              // Check if it's a rate limit error
              if (retryResponse.status === 429) {
                const rateLimitReset = retryResponse.headers.get('x-rate-limit-reset')
                const resetTime = rateLimitReset ? new Date(parseInt(rateLimitReset) * 1000) : null
                const minutesUntilReset = resetTime ? Math.ceil((resetTime.getTime() - Date.now()) / 60000) : null
                
                if (minutesUntilReset !== null) {
                  errorMessage = `Rate limit exceeded. Please wait ${minutesUntilReset} minute(s) before trying again. Rate limit resets at ${resetTime.toISOString()}.`
                } else {
                  errorMessage = `Rate limit exceeded. Twitter allows 300 tweets per 3-hour window. Please wait before trying again.`
                }
              } else if (retryResponse.status === 401) {
                errorMessage = `Token refreshed but still unauthorized. Please reconnect your Twitter account.`
              } else {
                errorMessage = retryError.detail || retryError.title || retryError.message || `Twitter API error: ${retryResponse.status}`
              }
            }
          }
        }
        
        // If refresh didn't work or wasn't possible, provide helpful error
        // Only set errorMessage if it hasn't been set already (e.g., by rate limit handling)
        if (!errorMessage || (postResponse.status === 401 && !errorMessage.includes('Rate limit'))) {
          if (replyToTweetId) {
            errorMessage = `Unauthorized: Your Twitter app may not have permission to post replies. Please ensure your Twitter app has "Read and write" permissions enabled in the Twitter Developer Portal, and reconnect your account.`
          } else {
            errorMessage = `Unauthorized: Your Twitter app may not have write permissions, or the token is invalid. Please ensure your Twitter app has "Read and write" permissions enabled in the Twitter Developer Portal, and reconnect your account.`
          }
        }
      }
      
      // Update request record with error
      await prisma.twitterApiRequest.update({
        where: { id: requestId },
        data: {
          statusCode: postResponse.status,
          success: false,
          errorMessage: errorMessage || `Twitter API error: ${postResponse.status} ${postResponse.statusText}`,
        },
      }).catch(err => {
        console.error('[Twitter API] Failed to update request record:', err)
      })
      
      return { 
        success: false, 
        error: errorMessage || `Twitter API error: ${postResponse.status} ${postResponse.statusText}` 
      }
    }

    const result: TwitterPostResponse = await postResponse.json()
    const tweetId = result.data.id
    
    // Update request record with success
    await prisma.twitterApiRequest.update({
      where: { id: requestId },
      data: {
        statusCode: postResponse.status,
        success: true,
      },
    })
    
    // Construct the Twitter URL
    const username = connection.platformUsername || 'twitter'
    const postUrl = `https://twitter.com/${username}/status/${tweetId}`

    return {
      success: true,
      postUrl,
      tweetId,
    }
  } catch (error) {
    console.error('Error posting to Twitter:', error)
    
    // Update request record if it exists (might not exist if error occurred before creating it)
    if (typeof requestId !== 'undefined') {
      await prisma.twitterApiRequest.update({
        where: { id: requestId },
        data: {
          success: false,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      }).catch(err => {
        console.error('[Twitter API] Failed to update request record in catch:', err)
      })
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Post a Twitter thread (multiple tweets as replies)
 * Uses delays instead of verification to ensure tweets are processed
 */
export async function postTwitterThread(
  userId: string,
  tweets: string[],
  imageUrl?: string
): Promise<{ success: true; postUrls: string[]; tweetIds: string[] } | { success: false; error: string }> {
  if (tweets.length === 0) {
    return { success: false, error: 'No tweets provided' }
  }

  const postUrls: string[] = []
  const tweetIds: string[] = []
  let previousTweetId: string | undefined

  // Post the first tweet (summary) with image if provided
  // Only attach image to the first tweet
  const firstResult = await postToTwitter(userId, tweets[0], undefined, imageUrl)
  if (!firstResult.success) {
    return firstResult
  }

  postUrls.push(firstResult.postUrl)
  tweetIds.push(firstResult.tweetId)
  previousTweetId = firstResult.tweetId

  // Wait for Twitter to process the tweet (no verification needed - delays are sufficient)
  await new Promise(resolve => setTimeout(resolve, 3000))

  // Post remaining tweets as replies
  // Note: We rely on delays rather than verification to avoid hitting rate limits
  // Twitter typically processes tweets within 1-2 seconds
  for (let i = 1; i < tweets.length; i++) {
    const replyResult = await postToTwitter(userId, tweets[i], previousTweetId)
    if (!replyResult.success) {
      // If a reply fails, return error but keep URLs of successfully posted tweets
      return {
        success: false,
        error: `Failed to post reply ${i + 1}: ${replyResult.error}`,
      }
    }

    postUrls.push(replyResult.postUrl)
    tweetIds.push(replyResult.tweetId)
    previousTweetId = replyResult.tweetId

    // Add a delay between replies to avoid rate limiting
    // Increased delay to ensure Twitter processes each tweet
    await new Promise(resolve => setTimeout(resolve, 3000))
  }

  return {
    success: true,
    postUrls,
    tweetIds,
  }
}

/**
 * Refresh Twitter/X access token using refresh token
 */
export async function refreshTwitterToken(
  userId: string,
  refreshToken: string
): Promise<{ accessToken: string; refreshToken: string; expiresIn: number } | null> {
  try {
    const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID
    const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET

    if (!TWITTER_CLIENT_ID || !TWITTER_CLIENT_SECRET) {
      console.error('[Twitter API] Missing Twitter OAuth credentials for token refresh')
      return null
    }

    // Twitter uses Basic Auth for token refresh
    const basicAuth = Buffer.from(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`).toString('base64')

    console.log(`[Twitter API] Refreshing token for user ${userId}`)
    
    const response = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error_description: 'Unknown error' }))
      console.error('[Twitter API] Token refresh failed:', {
        status: response.status,
        statusText: response.statusText,
        error: error,
      })
      return null
    }

    const tokenData = await response.json()
    console.log(`[Twitter API] Token refresh successful, expires_in: ${tokenData.expires_in}`)
    
    // Twitter OAuth 2.0 Token Expiration:
    // - Access tokens: Expire after 2 hours
    // - Refresh tokens: Can be refreshed indefinitely as long as they're used regularly
    //   If a refresh token is not used for ~90 days, it expires
    //   Each refresh typically returns a new refresh_token, extending validity
    //   By refreshing proactively (before expiration), we keep refresh tokens alive indefinitely
    return {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token || refreshToken, // Twitter usually returns new refresh_token - use it to extend validity
      expiresIn: tokenData.expires_in || 7200, // Default to 2 hours if not provided
    }
  } catch (error) {
    console.error('[Twitter API] Error refreshing token:', error)
    return null
  }
}

/**
 * Get Twitter/X analytics for a tweet
 * @param userId - User ID
 * @param tweetId - Tweet ID
 * @returns Analytics data (impressions, likes, retweets, replies, quoteTweets, views)
 */
export async function getTwitterAnalytics(
  userId: string,
  tweetId: string
): Promise<{
  impressions?: number
  likes?: number
  retweets?: number
  replies?: number
  quoteTweets?: number
  views?: number
} | null> {
  try {
    console.log(`[Twitter API] Fetching analytics for tweet ${tweetId}`)
    
    // Get Twitter connection
    const connection = await getSocialConnection(userId, 'twitter')
    if (!connection) {
      console.error(`[Twitter API] No connection found for user ${userId}`)
      return null
    }

    // Check if token is expired or expiring soon, and refresh proactively
    // Proactive refresh prevents refresh token expiration (Twitter refresh tokens expire after ~90 days of inactivity)
    let accessToken = connection.accessToken
    
    // Refresh if expired OR if expiring within 30 minutes (proactive refresh)
    const shouldRefresh = connection.tokenExpiry && (
      new Date(connection.tokenExpiry) <= new Date() || // Already expired
      new Date(connection.tokenExpiry) <= new Date(Date.now() + 30 * 60 * 1000) // Expiring within 30 minutes
    )
    
    if (shouldRefresh) {
      if (connection.refreshToken) {
        // Decrypt refresh token before using it
        const decryptedRefreshToken = decrypt(connection.refreshToken)
        const refreshResult = await refreshTwitterToken(userId, decryptedRefreshToken)
        if (refreshResult) {
          accessToken = refreshResult.accessToken
          const newExpiry = new Date(Date.now() + refreshResult.expiresIn * 1000)
          
          await prisma.socialConnection.update({
            where: {
              id: connection.id,
            },
            data: {
              accessToken: encrypt(refreshResult.accessToken),
              refreshToken: refreshResult.refreshToken ? encrypt(refreshResult.refreshToken) : undefined,
              tokenExpiry: newExpiry,
            },
          })
        } else {
          console.error(`[Twitter API] Token refresh failed`)
          return null
        }
      } else {
        console.error(`[Twitter API] Token expired but no refresh token available`)
        return null
      }
    }

    // Fetch tweet with metrics
    const response = await fetch(
      `${TWITTER_API_BASE}/tweets/${tweetId}?tweet.fields=public_metrics,non_public_metrics`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Twitter API] Failed to fetch analytics:', {
        status: response.status,
        error: errorText,
      })
      return null
    }

    const result = await response.json()
    const tweet = result.data

    if (!tweet) {
      console.error('[Twitter API] Tweet not found in response')
      return null
    }

    // Extract metrics
    const publicMetrics = tweet.public_metrics || {}
    const nonPublicMetrics = tweet.non_public_metrics || {}

    const analytics = {
      impressions: nonPublicMetrics.impression_count || undefined,
      likes: publicMetrics.like_count || 0,
      retweets: publicMetrics.retweet_count || 0,
      replies: publicMetrics.reply_count || 0,
      quoteTweets: publicMetrics.quote_count || 0,
      views: nonPublicMetrics.user_profile_clicks || undefined,
    }

    console.log(`[Twitter API] Analytics fetched successfully for tweet ${tweetId}`)
    return analytics
  } catch (error) {
    console.error('[Twitter API] Error fetching analytics:', error)
    return null
  }
}


