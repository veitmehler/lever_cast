// Template storage using localStorage for Design Mode

export interface Template {
  id: string
  name: string
  tone: 'professional' | 'casual' | 'inspirational' | 'question-based' | 'storytelling'
  description: string
  linkedinTemplate: string
  twitterTemplate: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

const STORAGE_KEY = 'levercast_templates'

// Default templates
const DEFAULT_TEMPLATES: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Professional',
    tone: 'professional',
    description: 'Business-focused, clear, and authoritative',
    isDefault: true,
    linkedinTemplate: `🚀 {idea}

Here are my key takeaways:
• {point1}
• {point2}
• {point3}

What's your experience with this? Let me know in the comments!

#Business #Professional #Leadership`,
    twitterTemplate: `{idea}

Key insights:
• {point1}
• {point2}
• {point3}

What do you think?`,
  },
  {
    name: 'Casual',
    tone: 'casual',
    description: 'Friendly, conversational, and relatable',
    isDefault: false,
    linkedinTemplate: `Hey everyone! 👋

{idea}

Here's what I've learned:
→ {point1}
→ {point2}
→ {point3}

Anyone else experience this? Drop a comment!

#CasualChat #RealTalk`,
    twitterTemplate: `{idea}

Quick thoughts:
- {point1}
- {point2}
- {point3}

Your take? 🤔`,
  },
  {
    name: 'Inspirational',
    tone: 'inspirational',
    description: 'Motivational and uplifting',
    isDefault: false,
    linkedinTemplate: `✨ {idea}

Remember:
💡 {point1}
💪 {point2}
🎯 {point3}

Keep pushing forward. You've got this!

#Motivation #Inspiration #Growth`,
    twitterTemplate: `{idea} ✨

Remember:
→ {point1}
→ {point2}
→ {point3}

You've got this! 💪`,
  },
  {
    name: 'Question-Based',
    tone: 'question-based',
    description: 'Drives engagement through questions',
    isDefault: false,
    linkedinTemplate: `{idea}

Here's what I'm curious about:
❓ {point1}
❓ {point2}
❓ {point3}

What's your perspective? I'd love to hear your thoughts in the comments!

#Discussion #Community #YourThoughts`,
    twitterTemplate: `{idea}

Questions:
• {point1}?
• {point2}?
• {point3}?

Share your thoughts! 👇`,
  },
  {
    name: 'Storytelling',
    tone: 'storytelling',
    description: 'Narrative-driven and engaging',
    isDefault: false,
    linkedinTemplate: `Let me tell you about {idea}

The journey taught me:
📖 {point1}
📖 {point2}
📖 {point3}

Have you experienced something similar? I'd love to hear your story!

#Story #Journey #Experience`,
    twitterTemplate: `Story time: {idea}

What I learned:
1. {point1}
2. {point2}
3. {point3}

What's your story? 📖`,
  },
]

// Initialize templates on first load
function initializeTemplates(): void {
  if (typeof window === 'undefined') return
  
  const existing = localStorage.getItem(STORAGE_KEY)
  if (!existing) {
    const templates = DEFAULT_TEMPLATES.map((template, index) => ({
      ...template,
      id: `template_${Date.now()}_${index}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates))
  }
}

// Get all templates
export function getTemplates(): Template[] {
  if (typeof window === 'undefined') return []
  
  initializeTemplates()
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Error loading templates:', error)
    return []
  }
}

// Get single template by ID
export function getTemplate(id: string): Template | null {
  const templates = getTemplates()
  return templates.find(t => t.id === id) || null
}

// Get default template
export function getDefaultTemplate(): Template | null {
  const templates = getTemplates()
  return templates.find(t => t.isDefault) || templates[0] || null
}

// Save new template
export function saveTemplate(template: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>): Template {
  const templates = getTemplates()
  
  const newTemplate: Template = {
    ...template,
    id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  
  templates.push(newTemplate)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates))
  
  return newTemplate
}

// Update existing template
export function updateTemplate(id: string, updates: Partial<Omit<Template, 'id' | 'createdAt'>>): Template | null {
  const templates = getTemplates()
  const index = templates.findIndex(t => t.id === id)
  
  if (index === -1) return null
  
  templates[index] = {
    ...templates[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates))
  return templates[index]
}

// Delete template
export function deleteTemplate(id: string): boolean {
  const templates = getTemplates()
  const filtered = templates.filter(t => t.id !== id)
  
  if (filtered.length === templates.length) return false
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  return true
}

// Set default template
export function setDefaultTemplate(id: string): boolean {
  const templates = getTemplates()
  
  // Remove default from all templates
  templates.forEach(t => {
    t.isDefault = false
  })
  
  // Set new default
  const template = templates.find(t => t.id === id)
  if (!template) return false
  
  template.isDefault = true
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates))
  return true
}

