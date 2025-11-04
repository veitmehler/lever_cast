// Mock AI generation for design mode

export interface GeneratedContent {
  linkedin?: string
  twitter?: string
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

export async function generateContent(
  rawIdea: string,
  platform: 'linkedin' | 'twitter' | 'both'
): Promise<GeneratedContent> {
  // Simulate API delay
  await delay(1500)

  const result: GeneratedContent = {}

  if (platform === 'linkedin' || platform === 'both') {
    const template = linkedInTemplates[Math.floor(Math.random() * linkedInTemplates.length)]
    result.linkedin = template(rawIdea)
  }

  if (platform === 'twitter' || platform === 'both') {
    const template = twitterTemplates[Math.floor(Math.random() * twitterTemplates.length)]
    result.twitter = template(rawIdea)
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

