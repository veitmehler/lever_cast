/**
 * Supabase Client
 * Used for Supabase Storage (image uploads)
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env file.'
  )
}

/**
 * Server-side Supabase client
 * Uses service role key if available (for API routes), otherwise uses anon key
 * Use this in API routes and server components
 */
export const supabase = createClient(
  supabaseUrl,
  supabaseServiceRoleKey || supabaseAnonKey, // Prefer service role key for server-side operations
  {
    auth: {
      persistSession: false, // Don't persist session on server
    },
  }
)

/**
 * Upload an image to Supabase Storage
 * @param file - File object or base64 data URL string
 * @param userId - User ID to organize files by user
 * @param fileName - Optional custom file name (defaults to timestamp)
 * @returns Public URL of the uploaded image
 */
export async function uploadImageToStorage(
  file: File | string,
  userId: string,
  fileName?: string
): Promise<{ url: string; path: string }> {
  // Generate unique file name
  const timestamp = Date.now()
  const randomId = Math.random().toString(36).substring(2, 9)
  const extension = fileName
    ? fileName.split('.').pop()
    : file instanceof File
    ? file.name.split('.').pop() || 'jpg'
    : 'jpg'

  const filePath = `${userId}/${timestamp}-${randomId}.${extension}`

  let fileBuffer: Buffer
  let contentType: string

  if (file instanceof File) {
    // Handle File object
    const arrayBuffer = await file.arrayBuffer()
    fileBuffer = Buffer.from(arrayBuffer)
    contentType = file.type || 'image/jpeg'
  } else {
    // Handle base64 data URL
    const base64Data = file.replace(/^data:image\/\w+;base64,/, '')
    fileBuffer = Buffer.from(base64Data, 'base64')
    
    // Extract content type from data URL
    const match = file.match(/^data:image\/(\w+);base64/)
    contentType = match ? `image/${match[1]}` : 'image/jpeg'
  }

  // Upload to Supabase Storage
  const { error } = await supabase.storage
    .from('post-images')
    .upload(filePath, fileBuffer, {
      contentType,
      upsert: false, // Don't overwrite existing files
    })

  if (error) {
    console.error('Supabase Storage upload error:', error)
    throw new Error(`Failed to upload image: ${error.message}`)
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from('post-images').getPublicUrl(filePath)

  return {
    url: publicUrl,
    path: filePath,
  }
}

/**
 * Delete an image from Supabase Storage
 * @param filePath - Path to the file in storage (e.g., "userId/timestamp-randomId.jpg")
 */
export async function deleteImageFromStorage(filePath: string): Promise<void> {
  const { error } = await supabase.storage.from('post-images').remove([filePath])

  if (error) {
    console.error('Supabase Storage delete error:', error)
    throw new Error(`Failed to delete image: ${error.message}`)
  }
}

/**
 * Extract file path from Supabase Storage URL
 * @param url - Full Supabase Storage URL
 * @returns File path relative to bucket
 */
export function extractFilePathFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url)
    // Supabase Storage URLs are: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
    const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/public\/post-images\/(.+)$/)
    return pathMatch ? pathMatch[1] : null
  } catch {
    return null
  }
}

/**
 * Download an image from Supabase Storage URL
 * @param imageUrl - Full Supabase Storage public URL
 * @returns Buffer containing the image binary data
 */
export async function downloadImageFromStorage(imageUrl: string): Promise<Buffer> {
  try {
    // Fetch the image from the public URL
    const response = await fetch(imageUrl)
    
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status} ${response.statusText}`)
    }
    
    // Convert response to buffer
    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch (error) {
    console.error('[Supabase] Error downloading image:', error)
    throw new Error(`Failed to download image from storage: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

