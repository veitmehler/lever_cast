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
  if (!encryptedValue) return ''
  
  try {
    // Simple base64 decoding for now
    // In production, use: crypto.createDecipheriv('aes-256-gcm', key, iv)
    const decoded = Buffer.from(encryptedValue, 'base64').toString('utf-8')
    return decoded
  } catch (error) {
    console.error('Error decrypting value:', error)
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

