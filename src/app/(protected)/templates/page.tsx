'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Star, StarOff, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TemplateEditor } from '@/components/TemplateEditor'
import { toast } from 'sonner'

// Template type matching database schema
export type Template = {
  id: string
  userId: string
  name: string
  tone: 'professional' | 'casual' | 'inspirational' | 'question-based' | 'storytelling'
  description: string
  linkedinTemplate: string
  twitterTemplate: string
  facebookTemplate?: string | null
  instagramTemplate?: string | null
  telegramTemplate?: string | null
  threadsTemplate?: string | null
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [isViewing, setIsViewing] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch templates from API
  const fetchTemplates = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/templates')
      
      if (response.ok) {
        const data = await response.json()
        setTemplates(data)
        
        // If no templates exist, seed default ones
        if (data.length === 0) {
          await seedTemplates()
        }
      } else {
        toast.error('Failed to fetch templates')
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
      toast.error('Failed to fetch templates')
    } finally {
      setIsLoading(false)
    }
  }

  // Refresh a single template
  const refreshTemplate = async (templateId: string): Promise<Template | null> => {
    try {
      const response = await fetch(`/api/templates/${templateId}`)
      if (response.ok) {
        return await response.json()
      }
    } catch (error) {
      console.error('Error refreshing template:', error)
    }
    return null
  }

  // Seed default templates
  const seedTemplates = async () => {
    try {
      const response = await fetch('/api/templates/seed', {
        method: 'POST',
      })
      
      if (response.ok) {
        await fetchTemplates()
        toast.success('Default templates loaded')
      }
    } catch (error) {
      console.error('Error seeding templates:', error)
    }
  }

  // Update existing templates with new platform fields
  const updateTemplatesWithPlatforms = async () => {
    try {
      const response = await fetch('/api/templates/update-platforms', {
        method: 'POST',
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.updated > 0) {
          await fetchTemplates()
          toast.success(`Updated ${data.updated} template(s) with new platform fields`)
        }
      }
    } catch (error) {
      console.error('Error updating templates:', error)
    }
  }

  useEffect(() => {
    fetchTemplates()
    // Update existing templates with new platform fields on mount
    updateTemplatesWithPlatforms()
  }, [])

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      try {
        const response = await fetch(`/api/templates/${id}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          await fetchTemplates()
          toast.success('Template deleted successfully')
        } else {
          const error = await response.json()
          toast.error(error.error || 'Failed to delete template')
        }
      } catch (error) {
        console.error('Error deleting template:', error)
        toast.error('Failed to delete template')
      }
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      const response = await fetch(`/api/templates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      })

      if (response.ok) {
        await fetchTemplates()
        toast.success('Default template updated')
      } else {
        toast.error('Failed to update default template')
      }
    } catch (error) {
      console.error('Error setting default template:', error)
      toast.error('Failed to update default template')
    }
  }

  const handleView = async (template: Template) => {
    setIsViewing(true)
    // Fetch fresh template data to ensure we have all platform fields
    try {
      const freshTemplate = await refreshTemplate(template.id)
      if (freshTemplate) {
        setSelectedTemplate(freshTemplate)
      } else {
        // Fallback to template from state if fetch fails
        setSelectedTemplate(template)
      }
    } catch (error) {
      console.error('Error fetching template:', error)
      // Fallback to template from state if fetch fails
      setSelectedTemplate(template)
    }
  }

  const handleEdit = (template: Template) => {
    setEditingTemplate(template)
    setIsEditing(true)
  }

  const handleCreateNew = () => {
    setEditingTemplate(null)
    setIsEditing(true)
  }

  const handleSaveTemplate = async (templateData: Omit<Template, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingTemplate) {
        // Update existing template
        const response = await fetch(`/api/templates/${editingTemplate.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(templateData),
        })

        if (response.ok) {
          await fetchTemplates()
          toast.success('Template updated successfully')
        } else {
          toast.error('Failed to update template')
        }
      } else {
        // Create new template
        const response = await fetch('/api/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(templateData),
        })

        if (response.ok) {
          await fetchTemplates()
          toast.success('Template created successfully')
        } else {
          toast.error('Failed to create template')
        }
      }
      setIsEditing(false)
      setEditingTemplate(null)
    } catch (error) {
      console.error('Error saving template:', error)
      toast.error('Failed to save template')
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditingTemplate(null)
  }

  const getToneColor = (tone: Template['tone']) => {
    const colors = {
      professional: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      casual: 'bg-green-500/10 text-green-500 border-green-500/20',
      inspirational: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      'question-based': 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      storytelling: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
    }
    return colors[tone]
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Content Templates</h1>
          <p className="text-muted-foreground">
            Manage your AI content generation templates and tones
          </p>
        </div>
        <Button 
          onClick={handleCreateNew}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Template
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading templates...</p>
        </div>
      )}

      {/* Template Grid */}
      {!isLoading && templates.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {templates.map((template) => (
          <div
            key={template.id}
            className="rounded-lg border border-border bg-card p-6 hover:border-primary/50 transition-all group relative"
          >
            {/* Default Badge */}
            {template.isDefault && (
              <div className="absolute top-3 right-3">
                <Star className="w-5 h-5 text-primary fill-primary" />
              </div>
            )}

            {/* Tone Badge */}
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border mb-4 ${getToneColor(template.tone)}`}>
              {template.tone}
            </div>

            <h3 className="text-xl font-semibold text-card-foreground mb-2">
              {template.name}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {template.description}
            </p>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleView(template)}
                className="flex-1"
              >
                View
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleEdit(template)}
              >
                <Edit className="w-4 h-4" />
              </Button>
              {!template.isDefault && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSetDefault(template.id)}
                  title="Set as default"
                >
                  <StarOff className="w-4 h-4" />
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDelete(template.id)}
                className="text-destructive hover:text-destructive"
                disabled={template.isDefault}
                title={template.isDefault ? 'Cannot delete default template' : 'Delete template'}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
          ))}
        </div>
      )}

      {/* Template Preview Modal */}
      {isViewing && selectedTemplate && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border mb-2 ${getToneColor(selectedTemplate.tone)}`}>
                  {selectedTemplate.tone}
                </div>
                <h2 className="text-2xl font-bold text-card-foreground">
                  {selectedTemplate.name}
                </h2>
                <p className="text-muted-foreground mt-1">
                  {selectedTemplate.description}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setIsViewing(false)}
              >
                Close
              </Button>
            </div>

            {/* Template Content */}
            <div className="space-y-6">
              {/* LinkedIn Template */}
              {selectedTemplate.linkedinTemplate && selectedTemplate.linkedinTemplate.trim() && (
                <div>
                  <h3 className="text-sm font-semibold text-card-foreground mb-2 flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-[#0A66C2] flex items-center justify-center text-white text-xs font-bold">
                      in
                    </div>
                    LinkedIn Template
                  </h3>
                  <div className="rounded-lg border border-border bg-secondary/30 p-4">
                    <pre className="whitespace-pre-wrap text-sm text-foreground font-sans">
                      {selectedTemplate.linkedinTemplate}
                    </pre>
                  </div>
                </div>
              )}

              {/* Twitter Template */}
              {selectedTemplate.twitterTemplate && selectedTemplate.twitterTemplate.trim() && (
                <div>
                  <h3 className="text-sm font-semibold text-card-foreground mb-2 flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-[#1DA1F2] flex items-center justify-center text-white text-xs font-bold">
                      𝕏
                    </div>
                    Twitter Template
                  </h3>
                  <div className="rounded-lg border border-border bg-secondary/30 p-4">
                    <pre className="whitespace-pre-wrap text-sm text-foreground font-sans">
                      {selectedTemplate.twitterTemplate}
                    </pre>
                  </div>
                </div>
              )}

              {/* Facebook Template */}
              {selectedTemplate.facebookTemplate && selectedTemplate.facebookTemplate.trim() && (
                <div>
                  <h3 className="text-sm font-semibold text-card-foreground mb-2 flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-[#1877F2] flex items-center justify-center text-white text-xs font-bold">
                      f
                    </div>
                    Facebook Template
                  </h3>
                  <div className="rounded-lg border border-border bg-secondary/30 p-4">
                    <pre className="whitespace-pre-wrap text-sm text-foreground font-sans">
                      {selectedTemplate.facebookTemplate}
                    </pre>
                  </div>
                </div>
              )}

              {/* Instagram Template */}
              {selectedTemplate.instagramTemplate && selectedTemplate.instagramTemplate.trim() && (
                <div>
                  <h3 className="text-sm font-semibold text-card-foreground mb-2 flex items-center gap-2">
                    <div className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold"
                      style={{ background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)' }}>
                      📷
                    </div>
                    Instagram Template
                  </h3>
                  <div className="rounded-lg border border-border bg-secondary/30 p-4">
                    <pre className="whitespace-pre-wrap text-sm text-foreground font-sans">
                      {selectedTemplate.instagramTemplate}
                    </pre>
                  </div>
                </div>
              )}

              {/* Telegram Template */}
              {selectedTemplate.telegramTemplate && selectedTemplate.telegramTemplate.trim() && (
                <div>
                  <h3 className="text-sm font-semibold text-card-foreground mb-2 flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-[#0088cc] flex items-center justify-center text-white text-xs font-bold">
                      📱
                    </div>
                    Telegram Template
                  </h3>
                  <div className="rounded-lg border border-border bg-secondary/30 p-4">
                    <pre className="whitespace-pre-wrap text-sm text-foreground font-sans">
                      {selectedTemplate.telegramTemplate}
                    </pre>
                  </div>
                </div>
              )}

              {/* Threads Template */}
              {selectedTemplate.threadsTemplate && selectedTemplate.threadsTemplate.trim() && (
                <div>
                  <h3 className="text-sm font-semibold text-card-foreground mb-2 flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-black dark:bg-white flex items-center justify-center text-white dark:text-black text-xs font-bold">
                      🧵
                    </div>
                    Threads Template
                  </h3>
                  <div className="rounded-lg border border-border bg-secondary/30 p-4">
                    <pre className="whitespace-pre-wrap text-sm text-foreground font-sans">
                      {selectedTemplate.threadsTemplate}
                    </pre>
                  </div>
                </div>
              )}

              {/* Template Variables Info */}
              <div className="rounded-lg border border-border bg-primary/10 p-4">
                <h4 className="text-sm font-semibold text-foreground mb-2">Template Variables</h4>
                <p className="text-xs text-muted-foreground">
                  Templates use placeholders that are replaced with AI-generated content:
                </p>
                <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                  <li><code className="text-primary">{'{idea}'}</code> - Main idea/topic</li>
                  <li><code className="text-primary">{'{point1}'}</code>, <code className="text-primary">{'{point2}'}</code>, <code className="text-primary">{'{point3}'}</code> - Key points</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Template Editor Modal */}
      {isEditing && (
        <TemplateEditor
          template={editingTemplate}
          onSave={handleSaveTemplate}
          onCancel={handleCancelEdit}
        />
      )}

      {!isLoading && templates.length === 0 && (
        <div className="text-center py-12">
          <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No templates found</h3>
          <p className="text-muted-foreground mb-4">
            Create your first template to get started
          </p>
          <Button 
            onClick={handleCreateNew}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Template
          </Button>
        </div>
      )}
    </div>
  )
}

