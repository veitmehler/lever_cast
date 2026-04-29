'use client'

import { useState } from 'react'
import { X, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Template } from '@/app/(protected)/templates/page'

interface TemplateEditorProps {
  template?: Template | null
  onSave: (template: Omit<Template, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => void
  onCancel: () => void
}

const toneOptions: Array<{ value: Template['tone']; label: string; description: string }> = [
  { value: 'professional', label: 'Professional', description: 'Business-focused, clear, and authoritative' },
  { value: 'casual', label: 'Casual', description: 'Friendly, conversational, and relatable' },
  { value: 'inspirational', label: 'Inspirational', description: 'Motivational and uplifting' },
  { value: 'question-based', label: 'Question-Based', description: 'Drives engagement through questions' },
  { value: 'storytelling', label: 'Storytelling', description: 'Narrative-driven and engaging' },
]

export function TemplateEditor({ template, onSave, onCancel }: TemplateEditorProps) {
  const [name, setName] = useState(template?.name || '')
  const [tone, setTone] = useState<Template['tone']>(template?.tone || 'professional')
  const [description, setDescription] = useState(template?.description || '')
  const [linkedinTemplate, setLinkedinTemplate] = useState(
    template?.linkedinTemplate || `🚀 {idea}

Here are my key takeaways:
• {point1}
• {point2}
• {point3}

What's your experience with this? Let me know in the comments!

#Business #Professional #Leadership`
  )
  const [twitterTemplate, setTwitterTemplate] = useState(
    template?.twitterTemplate || `{idea}

Key insights:
• {point1}
• {point2}
• {point3}

What do you think?`
  )
  const [facebookTemplate, setFacebookTemplate] = useState(
    template?.facebookTemplate || `🚀 {idea}

Here are my key takeaways:
• {point1}
• {point2}
• {point3}

What's your experience with this? I'd love to hear your thoughts in the comments below!

#Business #Professional #Leadership`
  )
  const [instagramTemplate, setInstagramTemplate] = useState(
    template?.instagramTemplate || `🚀 {idea}

Here are my key takeaways:
• {point1}
• {point2}
• {point3}

What's your experience with this? Share your thoughts below! 👇

#Business #Professional #Leadership #Motivation`
  )
  const [telegramTemplate, setTelegramTemplate] = useState(
    template?.telegramTemplate || `🚀 {idea}

Here are my key takeaways:
• {point1}
• {point2}
• {point3}

What's your experience with this? Share your thoughts below!

#Business #Professional #Leadership`
  )
  const [threadsTemplate, setThreadsTemplate] = useState(
    template?.threadsTemplate || `🚀 {idea}

Key takeaways:
• {point1}
• {point2}
• {point3}

What's your experience?`
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim() || !description.trim() || !linkedinTemplate.trim() || !twitterTemplate.trim()) {
      alert('Please fill in all required fields (Name, Description, LinkedIn, Twitter)')
      return
    }

    onSave({
      name: name.trim(),
      tone,
      description: description.trim(),
      linkedinTemplate: linkedinTemplate.trim(),
      twitterTemplate: twitterTemplate.trim(),
      facebookTemplate: facebookTemplate.trim() || null,
      instagramTemplate: instagramTemplate.trim() || null,
      telegramTemplate: telegramTemplate.trim() || null,
      threadsTemplate: threadsTemplate.trim() || null,
      isDefault: template?.isDefault || false,
    })
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-2xl font-bold text-card-foreground">
              {template ? 'Edit Template' : 'Create New Template'}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Customize how AI generates content for different tones
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="name" className="text-sm font-medium text-card-foreground mb-2 block">
                  Template Name *
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Professional"
                  className="w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>

              <div>
                <label htmlFor="tone" className="text-sm font-medium text-card-foreground mb-2 block">
                  Tone *
                </label>
                <select
                  id="tone"
                  value={tone}
                  onChange={(e) => setTone(e.target.value as Template['tone'])}
                  className="w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                >
                  {toneOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="description" className="text-sm font-medium text-card-foreground mb-2 block">
                Description *
              </label>
              <input
                id="description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this template's style"
                className="w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>

            {/* LinkedIn Template */}
            <div>
              <label htmlFor="linkedin" className="text-sm font-medium text-card-foreground mb-2 block flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-[#0A66C2] flex items-center justify-center text-white text-xs font-bold">
                  in
                </div>
                LinkedIn Template *
              </label>
              <textarea
                id="linkedin"
                value={linkedinTemplate}
                onChange={(e) => setLinkedinTemplate(e.target.value)}
                placeholder="Use {idea}, {point1}, {point2}, {point3} as placeholders"
                className="w-full min-h-[200px] rounded-lg border border-input bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none font-mono text-sm"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Character count: {linkedinTemplate.length} / 3,000
              </p>
            </div>

            {/* Twitter Template */}
            <div>
              <label htmlFor="twitter" className="text-sm font-medium text-card-foreground mb-2 block flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-[#1DA1F2] flex items-center justify-center text-white text-xs font-bold">
                  𝕏
                </div>
                Twitter Template *
              </label>
              <textarea
                id="twitter"
                value={twitterTemplate}
                onChange={(e) => setTwitterTemplate(e.target.value)}
                placeholder="Use {idea}, {point1}, {point2}, {point3} as placeholders"
                className="w-full min-h-[150px] rounded-lg border border-input bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none font-mono text-sm"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Character count: {twitterTemplate.length} / 280 (base template)
              </p>
            </div>

            {/* Facebook Template */}
            <div>
              <label htmlFor="facebook" className="text-sm font-medium text-card-foreground mb-2 block flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-[#1877F2] flex items-center justify-center text-white text-xs font-bold">
                  f
                </div>
                Facebook Template (Optional)
              </label>
              <textarea
                id="facebook"
                value={facebookTemplate}
                onChange={(e) => setFacebookTemplate(e.target.value)}
                placeholder="Use {idea}, {point1}, {point2}, {point3} as placeholders"
                className="w-full min-h-[150px] rounded-lg border border-input bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Character count: {facebookTemplate.length} / 2,000
              </p>
            </div>

            {/* Instagram Template */}
            <div>
              <label htmlFor="instagram" className="text-sm font-medium text-card-foreground mb-2 block flex items-center gap-2">
                <div className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)' }}>
                  📷
                </div>
                Instagram Template (Optional)
              </label>
              <textarea
                id="instagram"
                value={instagramTemplate}
                onChange={(e) => setInstagramTemplate(e.target.value)}
                placeholder="Use {idea}, {point1}, {point2}, {point3} as placeholders"
                className="w-full min-h-[150px] rounded-lg border border-input bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Character count: {instagramTemplate.length} / 2,000
              </p>
            </div>

            {/* Telegram Template */}
            <div>
              <label htmlFor="telegram" className="text-sm font-medium text-card-foreground mb-2 block flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-[#0088cc] flex items-center justify-center text-white text-xs font-bold">
                  📱
                </div>
                Telegram Template (Optional)
              </label>
              <textarea
                id="telegram"
                value={telegramTemplate}
                onChange={(e) => setTelegramTemplate(e.target.value)}
                placeholder="Use {idea}, {point1}, {point2}, {point3} as placeholders"
                className="w-full min-h-[150px] rounded-lg border border-input bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Character count: {telegramTemplate.length} / 2,000
              </p>
            </div>

            {/* Threads Template */}
            <div>
              <label htmlFor="threads" className="text-sm font-medium text-card-foreground mb-2 block flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-black dark:bg-white flex items-center justify-center text-white dark:text-black text-xs font-bold">
                  🧵
                </div>
                Threads Template (Optional)
              </label>
              <textarea
                id="threads"
                value={threadsTemplate}
                onChange={(e) => setThreadsTemplate(e.target.value)}
                placeholder="Use {idea}, {point1}, {point2}, {point3} as placeholders"
                className="w-full min-h-[150px] rounded-lg border border-input bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Character count: {threadsTemplate.length} / 450
              </p>
            </div>

            {/* Template Variables Info */}
            <div className="rounded-lg border border-border bg-primary/10 p-4">
              <h4 className="text-sm font-semibold text-foreground mb-2">Template Variables</h4>
              <p className="text-xs text-muted-foreground mb-2">
                Use these placeholders in your templates - they&apos;ll be replaced with AI-generated content:
              </p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li><code className="text-primary bg-primary/20 px-1.5 py-0.5 rounded">{'{idea}'}</code> - The user&apos;s main idea/topic</li>
                <li><code className="text-primary bg-primary/20 px-1.5 py-0.5 rounded">{'{point1}'}</code> - First key point extracted from the idea</li>
                <li><code className="text-primary bg-primary/20 px-1.5 py-0.5 rounded">{'{point2}'}</code> - Second key point extracted from the idea</li>
                <li><code className="text-primary bg-primary/20 px-1.5 py-0.5 rounded">{'{point3}'}</code> - Third key point extracted from the idea</li>
              </ul>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-border flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Save className="w-4 h-4 mr-2" />
            {template ? 'Save Changes' : 'Create Template'}
          </Button>
        </div>
      </div>
    </div>
  )
}

