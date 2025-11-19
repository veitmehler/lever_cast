/**
 * Instagram Username Fetch Utility
 * Shared function to fetch Instagram username from Meta Graph API
 */

import { prisma } from './prisma'
import { decrypt } from './encryption'

const INSTAGRAM_API_BASE = 'https://graph.facebook.com/v24.0'

/**
 * Fetch Instagram username for a connection
 * @param connectionId - Social connection ID
 * @param accessToken - Access token (user token preferred, page token as fallback)
 * @param instagramAccountId - Instagram Business Account ID
 * @param tokenType - 'user' or 'page' - indicates which type of token we're using
 * @returns Username if found, null otherwise
 */
export async function fetchInstagramUsername(
  connectionId: string,
  accessToken: string,
  instagramAccountId: string,
  tokenType: 'user' | 'page' = 'page'
): Promise<string | null> {
  try {
    console.log('[Instagram Username Fetch] Starting fetch for connection:', connectionId, 'IG Account ID:', instagramAccountId, 'Token type:', tokenType)
    
    // Method 1: If we have user token, try querying via /me/accounts to find the page
    // Then use the page's access token to query the Instagram account
    if (tokenType === 'user') {
      const pagesResponse = await fetch(
        `${INSTAGRAM_API_BASE}/me/accounts?access_token=${accessToken}&fields=id,name,access_token,instagram_business_account{id,username}`
      )
      
      if (pagesResponse.ok) {
        const pagesData = await pagesResponse.json()
        const pages = pagesData.data || []
        console.log('[Instagram Username Fetch] Found pages:', pages.length)
        
        // First, try to find the page with the Instagram account in the initial response
        for (const page of pages) {
          console.log('[Instagram Username Fetch] Checking page:', page.id, 'has IG:', !!page.instagram_business_account)
          if (page.instagram_business_account && page.instagram_business_account.id === instagramAccountId) {
            const username = page.instagram_business_account.username
            if (username && username !== 'Instagram User') {
              console.log('[Instagram Username Fetch] Found username via pages:', username)
              return username
            }
          }
        }
        
        // Method 1b: Query each page individually with its Page access token
        // Page tokens have better access to Instagram account details
        for (const page of pages) {
          if (!page.access_token) continue
          
          try {
            // Query the page with its own access token to get Instagram account
            const pageDetailResponse = await fetch(
              `${INSTAGRAM_API_BASE}/${page.id}?access_token=${page.access_token}&fields=id,name,instagram_business_account{id,username}`
            )
            
            if (pageDetailResponse.ok) {
              const pageDetail = await pageDetailResponse.json()
              console.log('[Instagram Username Fetch] Page detail:', {
                pageId: pageDetail.id,
                hasIG: !!pageDetail.instagram_business_account,
                igId: pageDetail.instagram_business_account?.id,
                igUsername: pageDetail.instagram_business_account?.username
              })
              
              if (pageDetail.instagram_business_account && pageDetail.instagram_business_account.id === instagramAccountId) {
                const username = pageDetail.instagram_business_account.username
                if (username && username !== 'Instagram User') {
                  console.log('[Instagram Username Fetch] Found username via page detail with Page token:', username)
                  return username
                }
              }
            } else {
              const errorText = await pageDetailResponse.text()
              console.warn('[Instagram Username Fetch] Page detail query failed:', pageDetailResponse.status, errorText)
            }
          } catch (err) {
            console.warn('[Instagram Username Fetch] Error querying page detail:', err)
          }
        }
      } else {
        const errorText = await pagesResponse.text()
        console.error('[Instagram Username Fetch] Pages query failed:', pagesResponse.status, errorText)
      }
    }
    
    // Method 2: Try querying Instagram account directly with Page token
    // This might work if we're using a Page token (tokenType === 'page')
    // Page tokens have permissions to query linked Instagram accounts
    try {
      const igAccountResponse = await fetch(
        `${INSTAGRAM_API_BASE}/${instagramAccountId}?access_token=${accessToken}&fields=id,username,account_type`
      )
      
      if (igAccountResponse.ok) {
        const igAccount = await igAccountResponse.json()
        console.log('[Instagram Username Fetch] Direct query response:', igAccount)
        if (igAccount.username && igAccount.username !== 'Instagram User') {
          console.log('[Instagram Username Fetch] Found username via direct query:', igAccount.username)
          return igAccount.username
        }
      } else {
        const errorText = await igAccountResponse.text()
        console.error('[Instagram Username Fetch] Direct query failed:', igAccountResponse.status, errorText)
      }
    } catch (err) {
      console.warn('[Instagram Username Fetch] Error in direct query:', err)
    }
    
    console.log('[Instagram Username Fetch] Could not fetch username - all methods failed')
    return null
  } catch (error) {
    console.error('[Instagram Username Fetch] Error fetching username:', error)
    return null
  }
}

/**
 * Update Instagram connection username if it's still the default
 * @param connectionId - Social connection ID
 * @returns Updated username if successful, null otherwise
 */
export async function refreshInstagramUsername(connectionId: string): Promise<string | null> {
  try {
    // Get connection from database
    const connection = await prisma.socialConnection.findUnique({
      where: { id: connectionId },
    })

    if (!connection || connection.platform !== 'instagram') {
      throw new Error('Instagram connection not found')
    }

    const pageAccessToken = decrypt(connection.accessToken)
    const instagramAccountId = connection.platformUserId
    
    // Try to get user token from refreshToken field (we store it there for Instagram)
    let userToken: string | null = null
    if (connection.refreshToken) {
      try {
        userToken = decrypt(connection.refreshToken)
      } catch (err) {
        console.warn('[Instagram Username Refresh] Could not decrypt user token from refreshToken field')
      }
    }

    if (!instagramAccountId) {
      throw new Error('Instagram account ID not found')
    }

    // Fetch username - use user token if available, otherwise fall back to page token
    const username = await fetchInstagramUsername(
      connectionId, 
      userToken || pageAccessToken, 
      instagramAccountId,
      userToken ? 'user' : 'page' // Indicate which token type we're using
    )

    if (username) {
      // Update connection with new username
      await prisma.socialConnection.update({
        where: { id: connectionId },
        data: {
          platformUsername: username,
        },
      })

      console.log('[Instagram Username Refresh] Successfully updated username to:', username)
      return username
    }

    return null
  } catch (error) {
    console.error('[Instagram Username Refresh] Error refreshing username:', error)
    throw error
  }
}

