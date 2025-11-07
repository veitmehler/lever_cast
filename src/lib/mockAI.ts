// Mock AI generation for design mode

export interface GeneratedContent {
  linkedin?: string
  twitter?: string
}

// Template interface matching database schema
interface Template {
  id: string
  userId: string
  name: string
  tone: string
  description: string
  linkedinTemplate: string
  twitterTemplate: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

// Fetch template from API
async function getTemplate(id: string): Promise<Template | null> {
  try {
    const response = await fetch(`/api/templates/${id}`)
    if (!response.ok) return null
    return await response.json()
  } catch (error) {
    console.error('Error fetching template:', error)
    return null
  }
}

// Fetch default template from API
async function getDefaultTemplate(): Promise<Template | null> {
  try {
    const response = await fetch('/api/templates')
    if (!response.ok) return null
    const templates: Template[] = await response.json()
    return templates.find(t => t.isDefault) || templates[0] || null
  } catch (error) {
    console.error('Error fetching templates:', error)
    return null
  }
}

// Mock templates for different content types
const linkedInTemplates = [
  (idea: string) => `🚀 ${idea}

Here are my key takeaways:
• Focus on solving real problems
• Build in public and gather feedback early
• Iterate quickly based on user input

What's your experience with this? Let me know in the comments!

#Entrepreneurship #ProductDevelopment #StartupLife`,
  
  (idea: string) => `I've been thinking about ${idea.toLowerCase()}

After years in the industry, here's what I've learned:

1️⃣ Start with why, not what
2️⃣ Listen more than you talk
3️⃣ Execution beats perfection

Drop a 💡 if this resonates with you!

#Leadership #Innovation #GrowthMindset`,
  
  (idea: string) => `${idea}

This reminded me of an important principle:

→ Quality over quantity
→ People over process
→ Impact over activity

What principles guide your work? Share below! 👇

#Business #Productivity #Success`,
]

const twitterTemplates = [
  (idea: string) => `${idea}

Here's what I've learned:

• Keep it simple
• Ship early, iterate fast
• Listen to your users
• Stay consistent

What would you add to this list?`,
  
  (idea: string) => `Quick thought: ${idea}

The key is to:
1. Start small
2. Test quickly
3. Learn fast
4. Repeat

What's your approach? 🤔`,
  
  (idea: string) => `${idea}

Three things I wish I knew earlier:
→ Done is better than perfect
→ Feedback is gold
→ Momentum matters

What lessons have shaped your journey?`,
]

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

// Apply template with variable substitution
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
  platform: 'linkedin' | 'twitter' | 'both',
  templateId?: string
): Promise<GeneratedContent> {
  // Simulate API delay
  await delay(1500)

  const result: GeneratedContent = {}

  // Get the template to use (these are now async functions)
  const selectedTemplate = templateId 
    ? await getTemplate(templateId) 
    : await getDefaultTemplate()

  if (selectedTemplate && selectedTemplate.linkedinTemplate && selectedTemplate.twitterTemplate) {
    // Use custom template
    if (platform === 'linkedin' || platform === 'both') {
      result.linkedin = applyTemplate(selectedTemplate.linkedinTemplate, rawIdea)
    }

    if (platform === 'twitter' || platform === 'both') {
      result.twitter = applyTemplate(selectedTemplate.twitterTemplate, rawIdea)
    }
  } else {
    // Fallback to old random templates
    if (platform === 'linkedin' || platform === 'both') {
      const template = linkedInTemplates[Math.floor(Math.random() * linkedInTemplates.length)]
      result.linkedin = template(rawIdea)
    }

    if (platform === 'twitter' || platform === 'both') {
      const template = twitterTemplates[Math.floor(Math.random() * twitterTemplates.length)]
      result.twitter = template(rawIdea)
    }
  }

  return result
}

// Mock publish function
export async function publishToPlatform(
  platform: 'linkedin' | 'twitter',
  content: string
): Promise<{ success: boolean; message: string }> {
  // Simulate API delay
  await delay(1000)

  // In design mode, always succeed
  return {
    success: true,
    message: `Post successfully published to ${platform === 'linkedin' ? 'LinkedIn' : 'Twitter'}!`,
  }
}

