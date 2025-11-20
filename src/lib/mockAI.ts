// Mock AI generation for design mode

export interface GeneratedContent {
  linkedin?: string
  twitter?: string | string[]
  facebook?: string
  instagram?: string
  telegram?: string
  threads?: string
}

// Simulate AI processing delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Extract key points from the idea
function extractKeyPoints(idea: string): { point1: string; point2: string; point3: string } {
  const sentences = idea.split(/[.!?]+/).filter(s => s.trim().length > 0)
  
  if (sentences.length >= 3) {
    return {
      point1: sentences[0].trim(),
      point2: sentences[1].trim(),
      point3: sentences[2].trim(),
    }
  }
  
  // Fallback to generic points
  return {
    point1: 'Start with why, not what',
    point2: 'Listen more than you talk',
    point3: 'Execution beats perfection',
  }
}

// Apply template with variable substitution (reserved for future use)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function applyTemplate(template: string, idea: string): string {
  if (!template) {
    return idea // Fallback to raw idea if template is undefined
  }
  
  const points = extractKeyPoints(idea)
  
  return template
    .replace(/{idea}/g, idea)
    .replace(/{point1}/g, points.point1)
    .replace(/{point2}/g, points.point2)
    .replace(/{point3}/g, points.point3)
}

export async function generateContent(
  rawIdea: string,
  platform: 'linkedin' | 'twitter' | 'facebook' | 'instagram' | 'telegram' | 'threads' | 'all' | ('linkedin' | 'twitter' | 'facebook' | 'instagram' | 'telegram' | 'threads')[],
  templateId?: string,
  twitterFormat?: 'single' | 'thread'
): Promise<GeneratedContent> {
  // Try to use real AI API first
  const response = await fetch('/api/ai/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      rawIdea,
      platform,
      templateId,
      twitterFormat, // Pass format to API
    }),
  })

  if (response.ok) {
    const data = await response.json()
    if (data.content && (data.content.linkedin || data.content.twitter || data.content.facebook || data.content.instagram || data.content.telegram || data.content.threads)) {
      // Parse twitter content if it's a JSON string (thread)
      let twitterContent = data.content.twitter
      if (twitterContent && typeof twitterContent === 'string') {
        try {
          const parsed = JSON.parse(twitterContent)
          if (Array.isArray(parsed)) {
            twitterContent = parsed
          }
        } catch {
          // Keep as string if not valid JSON
        }
      }
      
      return {
        linkedin: data.content.linkedin,
        twitter: twitterContent,
        facebook: data.content.facebook,
        instagram: data.content.instagram,
        telegram: data.content.telegram,
        threads: data.content.threads,
      }
    }
  }

  // Handle error response
  const errorData = await response.json().catch(() => ({}))
  
  // Check if it's a "no API key" error
  if (errorData.requiresApiKey || errorData.provider === 'template') {
    throw new Error('NO_API_KEY')
  }
  
  // Other API errors
  throw new Error('API_ERROR')
}

// Real publish function using OAuth APIs
export async function publishToPlatform(
  platform: 'linkedin' | 'twitter',
  content: string,
  userId?: string,
  imageUrl?: string
): Promise<{ success: boolean; message: string; postUrl?: string; error?: string }> {
  // If no userId provided, fall back to mock (for backward compatibility)
  if (!userId) {
    await delay(1000)
    return {
      success: true,
      message: `Post successfully published to ${platform === 'linkedin' ? 'LinkedIn' : 'Twitter'}!`,
    }
  }

  try {
    if (platform === 'linkedin') {
      const { postToLinkedIn } = await import('./linkedinApi')
      const result = await postToLinkedIn(userId, content, imageUrl)
      
      if (result.success) {
        return {
          success: true,
          message: 'Post successfully published to LinkedIn!',
          postUrl: result.postUrl,
        }
      } else {
        return {
          success: false,
          message: result.error,
          error: result.error,
        }
      }
    } else if (platform === 'twitter') {
      const { postToTwitter } = await import('./twitterApi')
      const result = await postToTwitter(userId, content)
      
      if (result.success) {
        return {
          success: true,
          message: 'Post successfully published to Twitter/X!',
          postUrl: result.postUrl,
        }
      } else {
        return {
          success: false,
          message: result.error,
          error: result.error,
        }
      }
    } else {
      return {
        success: false,
        message: `Unsupported platform: ${platform}`,
        error: `Unsupported platform: ${platform}`,
      }
    }
  } catch (error) {
    console.error(`Error publishing to ${platform}:`, error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

