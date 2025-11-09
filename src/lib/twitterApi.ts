/**
 * Twitter/X API Service
 * Handles posting content to Twitter/X using OAuth 2.0
 */

import { getSocialConnection } from './socialConnections'
import { encrypt } from './encryption'
import { prisma } from './prisma'

const TWITTER_API_BASE = 'https://api.twitter.com/2'

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

    // Check if token is expired and refresh if needed
    let accessToken = connection.accessToken
    
    if (connection.tokenExpiry && new Date(connection.tokenExpiry) <= new Date()) {
      if (connection.refreshToken) {
        const refreshResult = await refreshTwitterToken(userId, connection.refreshToken)
        if (refreshResult) {
          accessToken = refreshResult.accessToken
          const newExpiry = new Date(Date.now() + refreshResult.expiresIn * 1000)
          
          await prisma.socialConnection.update({
            where: {
              userId_platform: {
                userId,
                platform: 'twitter',
              },
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
 * Post a single tweet to Twitter/X
 */
export async function postToTwitter(
  userId: string,
  content: string,
  replyToTweetId?: string
): Promise<{ success: true; postUrl: string; tweetId: string } | { success: false; error: string }> {
  try {
    console.log(`[Twitter API] Posting tweet for user ${userId}, replyTo: ${replyToTweetId || 'none'}`)
    
    // Get Twitter connection
    const connection = await getSocialConnection(userId, 'twitter')
    if (!connection) {
      console.error(`[Twitter API] No connection found for user ${userId}`)
      return { success: false, error: 'Twitter/X account not connected' }
    }
    
    console.log(`[Twitter API] Found connection for user ${userId}, platformUsername: ${connection.platformUsername}`)
    console.log(`[Twitter API] Token expiry: ${connection.tokenExpiry ? connection.tokenExpiry.toISOString() : 'not set'}`)

    // Check if token is expired and try to refresh
    let accessToken = connection.accessToken
    let shouldRefresh = false
    
    if (connection.tokenExpiry && new Date(connection.tokenExpiry) <= new Date()) {
      console.log(`[Twitter API] Token expired, checking for refresh token...`)
      if (connection.refreshToken) {
        console.log(`[Twitter API] Attempting to refresh token...`)
        const refreshResult = await refreshTwitterToken(userId, connection.refreshToken)
        if (refreshResult) {
          accessToken = refreshResult.accessToken
          const newExpiry = new Date(Date.now() + refreshResult.expiresIn * 1000)
          
          // Update the connection in the database
          await prisma.socialConnection.update({
            where: {
              userId_platform: {
                userId,
                platform: 'twitter',
              },
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
    const tweetData: any = {
      text: content,
    }

    // If this is a reply, add the reply_to field
    if (replyToTweetId) {
      tweetData.reply = {
        in_reply_to_tweet_id: replyToTweetId,
      }
    }

    // Post to Twitter/X
    console.log(`[Twitter API] Making POST request to ${TWITTER_API_BASE}/tweets`)
    console.log(`[Twitter API] Request body:`, JSON.stringify(tweetData, null, 2))
    
    const postResponse = await fetch(`${TWITTER_API_BASE}/tweets`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tweetData),
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
        reset: rateLimitReset ? new Date(parseInt(rateLimitReset) * 1000).toISOString() : null,
      })
    }

    if (!postResponse.ok) {
      const errorText = await postResponse.text()
      let error: any
      try {
        error = JSON.parse(errorText)
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
      
      // Handle rate limiting separately
      if (postResponse.status === 429) {
        // Extract reset time from headers
        const rateLimitReset = postResponse.headers.get('x-rate-limit-reset')
        const resetTime = rateLimitReset ? new Date(parseInt(rateLimitReset) * 1000) : null
        const minutesUntilReset = resetTime ? Math.ceil((resetTime.getTime() - Date.now()) / 60000) : null
        
        if (minutesUntilReset !== null) {
          errorMessage = `Rate limit exceeded. Please wait ${minutesUntilReset} minute(s) before trying again. Rate limit resets at ${resetTime.toISOString()}.`
        } else {
          errorMessage = `Rate limit exceeded. Twitter allows 300 tweets per 3-hour window. Please wait before trying again.`
        }
      } else if (postResponse.status === 401) {
        // If we get 401, try refreshing token once more (in case token expired between check and request)
        if (connection.refreshToken) {
          console.log(`[Twitter API] Got 401, attempting token refresh...`)
          const refreshResult = await refreshTwitterToken(userId, connection.refreshToken)
          if (refreshResult) {
            // Update connection and retry with new token
            const newExpiry = new Date(Date.now() + refreshResult.expiresIn * 1000)
            await prisma.socialConnection.update({
              where: {
                userId_platform: {
                  userId,
                  platform: 'twitter',
                },
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
      
      return { 
        success: false, 
        error: errorMessage || `Twitter API error: ${postResponse.status} ${postResponse.statusText}` 
      }
    }

    const result: TwitterPostResponse = await postResponse.json()
    const tweetId = result.data.id
    
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
  tweets: string[]
): Promise<{ success: true; postUrls: string[]; tweetIds: string[] } | { success: false; error: string }> {
  if (tweets.length === 0) {
    return { success: false, error: 'No tweets provided' }
  }

  const postUrls: string[] = []
  const tweetIds: string[] = []
  let previousTweetId: string | undefined

  // Post the first tweet (summary)
  const firstResult = await postToTwitter(userId, tweets[0])
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
    
    return {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token || refreshToken, // Use new refresh token if provided, otherwise keep old one
      expiresIn: tokenData.expires_in || 7200, // Default to 2 hours if not provided
    }
  } catch (error) {
    console.error('[Twitter API] Error refreshing token:', error)
    return null
  }
}

