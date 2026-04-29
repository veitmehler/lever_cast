import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Cleans a string by normalizing Unicode characters and
 * collapsing whitespace within paragraphs, while preserving paragraph breaks
 * and list/bullet point formatting.
 * This prevents weird Unicode whitespace characters (like U+202F, U+200B)
 * that could give away AI-generated content, while maintaining readability.
 * 
 * @param text The string to clean.
 * @returns The cleaned string with preserved paragraph and list structure.
 */
export function cleanText(text: string | undefined | null): string {
  if (!text) {
    return ""
  }

  // 1. Normalize the string
  // 'NFKC' normalizes Unicode, turning weird spaces (like U+202F)
  // into regular spaces and removing zero-width spaces (like U+200B).
  const normalizedText = text.normalize('NFKC')

  // 2. Split by paragraph breaks (double newlines or more)
  // This preserves paragraph structure
  const paragraphs = normalizedText.split(/\n\s*\n+/)

  // 3. Clean whitespace within each paragraph, preserving list formatting
  const cleanedParagraphs = paragraphs.map(paragraph => {
    // Check if this paragraph contains list items (bullet points)
    // Detect lines that start with bullet markers: ✅, •, -, *, numbers, etc.
    const lines = paragraph.split('\n')
    const hasListItems = lines.some(line => {
      const trimmed = line.trim()
      // Check for common bullet point patterns
      return /^[✅❌•\-\*\d]+[\s\.\)]/.test(trimmed) || // Bullet, dash, asterisk, numbered list (including ❌)
             /^[✅❌•\-\*]/.test(trimmed) || // Just bullet markers (including ❌)
             /^\d+[\.\)]\s/.test(trimmed) || // Numbered lists (1. or 1))
             /^[✅❌•\-\*]\s/.test(trimmed) // Bullet marker followed by space (including ❌)
    }) || paragraph.includes('✅') || paragraph.includes('❌') // Also check if paragraph contains checkmarks or cross marks (common in lists)

    if (hasListItems) {
      // This is a list/bullet point paragraph - preserve line breaks between items
      return lines.map(line => {
        // Check if line contains multiple bullet points (e.g., "❌ Item 1 ❌ Item 2")
        // Split on bullet markers if there are multiple on the same line
        const bulletPattern = /([✅❌•\-\*])\s+/g
        const matches = [...line.matchAll(bulletPattern)]
        
        if (matches.length > 1) {
          // Multiple bullets on same line - split them
          // Split on bullet markers, keeping the marker with each item
          const parts = line.split(/(?=[✅❌•\-\*]\s+)/).filter(part => part.trim().length > 0)
          return parts.map(part => {
            return part
              .replace(/[ \t]+/g, ' ') // Collapse spaces and tabs to single space
              .trim()
          }).join('\n') // Join split items with newlines
        } else {
          // Single bullet point on line - just clean whitespace
          return line
            .replace(/[ \t]+/g, ' ') // Collapse spaces and tabs to single space
            .trim()
        }
      }).filter(line => line.length > 0) // Remove empty lines
        .join('\n') // Preserve single newlines between list items
    } else {
      // Regular paragraph - collapse newlines to spaces
      return paragraph
        .replace(/[ \t]+/g, ' ') // Collapse spaces and tabs to single space
        .replace(/\n+/g, ' ') // Replace newlines within paragraph with space
        .trim()
    }
  }).filter(paragraph => paragraph.length > 0) // Remove empty paragraphs

  // 4. Join paragraphs with double newline (standard paragraph break)
  return cleanedParagraphs.join('\n\n')
}
