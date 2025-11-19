/**
 * Encryption utility for API keys
 * 
 * NOTE: This is a basic implementation using base64 encoding.
 * For production, this should be upgraded to proper encryption (e.g., AES-256-GCM)
 * using Node.js crypto module with a secure key management system.
 */

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production'

/**
 * Encrypts a string value (basic base64 encoding)
 * TODO: Upgrade to proper encryption (AES-256-GCM) in production
 */
export function encrypt(value: string): string {
  if (!value) return ''
  
  // Simple base64 encoding for now
  // In production, use: crypto.createCipheriv('aes-256-gcm', key, iv)
  const encoded = Buffer.from(value).toString('base64')
  return encoded
}

/**
 * Decrypts a string value (basic base64 decoding)
 * TODO: Upgrade to proper decryption (AES-256-GCM) in production
 */
export function decrypt(encryptedValue: string): string {
  if (!encryptedValue) {
    console.warn('[Encryption] Attempted to decrypt empty value')
    return ''
  }
  
  try {
    // Check if value is already a plain string (not base64 encoded)
    // This can happen if tokens were stored before encryption was implemented
    if (typeof encryptedValue !== 'string') {
      console.error('[Encryption] Value is not a string:', typeof encryptedValue)
      return ''
    }
    
    // Try to decode as base64
    // If it fails, assume it's already plain text (backward compatibility)
    try {
      const decoded = Buffer.from(encryptedValue, 'base64').toString('utf-8')
      
      // Validate that decoded value looks like a token (not binary garbage)
      // Tokens are typically alphanumeric strings, not binary data
      if (decoded && decoded.length > 0 && /^[\x20-\x7E]+$/.test(decoded)) {
        return decoded
      } else {
        // Decoded value looks like binary data, might be double-encoded or corrupted
        console.warn('[Encryption] Decoded value appears to be binary data, trying as plain text')
        // Return original value if it looks like a valid token
        if (/^[\x20-\x7E]+$/.test(encryptedValue)) {
          return encryptedValue
        }
        throw new Error('Decoded value is not valid UTF-8 text')
      }
    } catch (base64Error) {
      // If base64 decoding fails, check if it's already plain text
      if (/^[\x20-\x7E]+$/.test(encryptedValue)) {
        console.warn('[Encryption] Value is not base64 encoded, returning as plain text')
        return encryptedValue
      }
      throw base64Error
    }
  } catch (error) {
    console.error('[Encryption] Error decrypting value:', {
      error: error instanceof Error ? error.message : String(error),
      valueLength: encryptedValue.length,
      valuePreview: encryptedValue.substring(0, 50),
    })
    return ''
  }
}

/**
 * Masks an API key for display (shows last 4 characters)
 */
export function maskApiKey(key: string): string {
  if (!key || key.length <= 4) {
    return '••••••••'
  }
  return '•'.repeat(key.length - 4) + key.slice(-4)
}

