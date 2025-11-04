// Draft storage using localStorage for Design Mode

export interface Draft {
  id: string
  title: string
  rawIdea: string
  linkedinContent?: string
  twitterContent?: string
  platform: 'linkedin' | 'twitter' | 'both'
  status: 'draft' | 'published'
  createdAt: string
  updatedAt: string
}

const STORAGE_KEY = 'levercast_drafts'

// Get all drafts
export function getDrafts(): Draft[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Error loading drafts:', error)
    return []
  }
}

// Get single draft by ID
export function getDraft(id: string): Draft | null {
  const drafts = getDrafts()
  return drafts.find(d => d.id === id) || null
}

// Save new draft
export function saveDraft(draft: Omit<Draft, 'id' | 'createdAt' | 'updatedAt'>): Draft {
  const drafts = getDrafts()
  
  const newDraft: Draft = {
    ...draft,
    id: `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  
  drafts.unshift(newDraft)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts))
  
  return newDraft
}

// Update existing draft
export function updateDraft(id: string, updates: Partial<Omit<Draft, 'id' | 'createdAt'>>): Draft | null {
  const drafts = getDrafts()
  const index = drafts.findIndex(d => d.id === id)
  
  if (index === -1) return null
  
  drafts[index] = {
    ...drafts[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts))
  return drafts[index]
}

// Delete draft
export function deleteDraft(id: string): boolean {
  const drafts = getDrafts()
  const filtered = drafts.filter(d => d.id !== id)
  
  if (filtered.length === drafts.length) return false
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  return true
}

// Get drafts by status
export function getDraftsByStatus(status: 'draft' | 'published'): Draft[] {
  return getDrafts().filter(d => d.status === status)
}

// Mark draft as published
export function markAsPublished(id: string): Draft | null {
  return updateDraft(id, { status: 'published' })
}

