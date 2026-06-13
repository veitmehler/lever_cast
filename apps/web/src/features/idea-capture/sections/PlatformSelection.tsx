import type { IdeaCaptureView } from '../useIdeaCapture'

export function PlatformSelection({ capture }: { capture: IdeaCaptureView }) {
  const {
    selectedTemplate,
    setSelectedTemplate,
    isLoadingTemplates,
    templates,
    selectedPlatforms,
    setSelectedPlatforms,
    availablePlatforms,
    twitterFormat,
    setTwitterFormat,
  } = capture

  return (
    <>
      {/* Template & Platform Selection */}
      <div className="mt-4 flex gap-4">
        {/* Template Selection - 1/3 width */}
        <div className="w-1/3">
          <label className="text-sm font-medium text-card-foreground mb-2 block">
            Content Template
          </label>
          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            disabled={isLoadingTemplates}
            className="w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="none">
              {isLoadingTemplates ? 'Loading templates...' : 'None (Raw AI)'}
            </option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name} - {template.tone}
              </option>
            ))}
          </select>
          {!isLoadingTemplates && templates.length === 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              No templates available. You can create templates on the Templates page.
            </p>
          )}
        </div>

        {/* Platform Selection - 2/3 width */}
        <div className="w-2/3">
          <label className="text-sm font-medium text-card-foreground mb-2 block">
            Target Platform {selectedPlatforms.size > 0 && `(${selectedPlatforms.size} selected)`}
          </label>
          <div className="flex gap-2 flex-wrap">
            {availablePlatforms.has('linkedin') && (
              <button
                type="button"
                onClick={() => {
                  setSelectedPlatforms(prev => {
                    const next = new Set(prev)
                    if (next.has('linkedin')) {
                      next.delete('linkedin')
                    } else {
                      next.add('linkedin')
                    }
                    return next
                  })
                }}
                className={`flex-1 min-w-[100px] px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedPlatforms.has('linkedin')
                    ? 'bg-[#0A66C2] text-white'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                LinkedIn
              </button>
            )}
            {availablePlatforms.has('twitter') && (
              <button
                type="button"
                onClick={() => {
                  setSelectedPlatforms(prev => {
                    const next = new Set(prev)
                    if (next.has('twitter')) {
                      next.delete('twitter')
                    } else {
                      next.add('twitter')
                    }
                    return next
                  })
                }}
                className={`flex-1 min-w-[100px] px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedPlatforms.has('twitter')
                    ? 'bg-[#1DA1F2] text-white'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                Twitter
              </button>
            )}
            {availablePlatforms.has('facebook') && (
              <button
                type="button"
                onClick={() => {
                  setSelectedPlatforms(prev => {
                    const next = new Set(prev)
                    if (next.has('facebook')) {
                      next.delete('facebook')
                    } else {
                      next.add('facebook')
                    }
                    return next
                  })
                }}
                className={`flex-1 min-w-[100px] px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedPlatforms.has('facebook')
                    ? 'bg-[#1877F2] text-white'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                Facebook
              </button>
            )}
            {availablePlatforms.has('instagram') && (
              <button
                type="button"
                onClick={() => {
                  setSelectedPlatforms(prev => {
                    const next = new Set(prev)
                    if (next.has('instagram')) {
                      next.delete('instagram')
                    } else {
                      next.add('instagram')
                    }
                    return next
                  })
                }}
                className={`flex-1 min-w-[100px] px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedPlatforms.has('instagram')
                    ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                Instagram
              </button>
            )}
            {availablePlatforms.has('telegram') && (
              <button
                type="button"
                onClick={() => {
                  setSelectedPlatforms(prev => {
                    const next = new Set(prev)
                    if (next.has('telegram')) {
                      next.delete('telegram')
                    } else {
                      next.add('telegram')
                    }
                    return next
                  })
                }}
                className={`flex-1 min-w-[100px] px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedPlatforms.has('telegram')
                    ? 'bg-[#0088cc] text-white'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                Telegram
              </button>
            )}
            {availablePlatforms.has('threads') && (
              <button
                type="button"
                onClick={() => {
                  setSelectedPlatforms(prev => {
                    const next = new Set(prev)
                    if (next.has('threads')) {
                      next.delete('threads')
                    } else {
                      next.add('threads')
                    }
                    return next
                  })
                }}
                className={`flex-1 min-w-[100px] px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedPlatforms.has('threads')
                    ? 'bg-black text-white dark:bg-white dark:text-black'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                Threads
              </button>
            )}
            {availablePlatforms.has('all') && (
              <button
                type="button"
                onClick={() => {
                  // Get all available platforms (excluding 'all')
                  const allAvailable: ('linkedin' | 'twitter' | 'facebook' | 'instagram' | 'telegram' | 'threads')[] = []
                  if (availablePlatforms.has('linkedin')) allAvailable.push('linkedin')
                  if (availablePlatforms.has('twitter')) allAvailable.push('twitter')
                  if (availablePlatforms.has('facebook')) allAvailable.push('facebook')
                  if (availablePlatforms.has('instagram')) allAvailable.push('instagram')
                  if (availablePlatforms.has('telegram')) allAvailable.push('telegram')
                  if (availablePlatforms.has('threads')) allAvailable.push('threads')

                  // Check if all are selected
                  const allSelected = allAvailable.every(p => selectedPlatforms.has(p))

                  if (allSelected) {
                    // Deselect all
                    setSelectedPlatforms(new Set())
                  } else {
                    // Select all
                    setSelectedPlatforms(new Set(allAvailable))
                  }
                }}
                className={`flex-1 min-w-[100px] px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  (() => {
                    const allAvailable: ('linkedin' | 'twitter' | 'facebook' | 'instagram' | 'telegram' | 'threads')[] = []
                    if (availablePlatforms.has('linkedin')) allAvailable.push('linkedin')
                    if (availablePlatforms.has('twitter')) allAvailable.push('twitter')
                    if (availablePlatforms.has('facebook')) allAvailable.push('facebook')
                    if (availablePlatforms.has('instagram')) allAvailable.push('instagram')
                    if (availablePlatforms.has('telegram')) allAvailable.push('telegram')
                    if (availablePlatforms.has('threads')) allAvailable.push('threads')
                    return allAvailable.every(p => selectedPlatforms.has(p))
                  })()
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                Select All
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Twitter Format Selection */}
      {selectedPlatforms.has('twitter') && (
        <div className="mt-4">
          <label className="text-sm font-medium text-card-foreground mb-2 block">
            Twitter Format
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="twitterFormat"
                value="single"
                checked={twitterFormat === 'single'}
                onChange={(e) => setTwitterFormat(e.target.value as 'single' | 'thread')}
                className="w-4 h-4 text-primary focus:ring-primary"
              />
              <span className="text-sm text-card-foreground">Single Post</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="twitterFormat"
                value="thread"
                checked={twitterFormat === 'thread'}
                onChange={(e) => setTwitterFormat(e.target.value as 'single' | 'thread')}
                className="w-4 h-4 text-primary focus:ring-primary"
              />
              <span className="text-sm text-card-foreground">Thread</span>
            </label>
          </div>
          {twitterFormat === 'thread' && (
            <p className="text-xs text-muted-foreground mt-1">
              Create a thread with summary + key insights (templates not used for threads)
            </p>
          )}
        </div>
      )}

      {/* Template Preview */}
      {selectedTemplate !== 'none' && templates.find(t => t.id === selectedTemplate) && (
        <div className="mt-4 p-4 rounded-lg bg-secondary/30 border border-border">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                ✨ {templates.find(t => t.id === selectedTemplate)?.name} Template
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {templates.find(t => t.id === selectedTemplate)?.description}
              </p>
            </div>
            <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary font-medium">
              {templates.find(t => t.id === selectedTemplate)?.tone}
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {/* LinkedIn Preview */}
            {selectedPlatforms.has('linkedin') && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 rounded bg-[#0A66C2] flex items-center justify-center text-white text-[10px] font-bold">
                    in
                  </div>
                  <span className="text-xs font-medium text-foreground">LinkedIn Format</span>
                </div>
                <div className="rounded border border-border bg-background p-3 max-h-32 overflow-y-auto">
                  <pre className="text-[10px] text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">
                    {templates.find(t => t.id === selectedTemplate)?.linkedinTemplate}
                  </pre>
                </div>
              </div>
            )}

            {/* Twitter Preview */}
            {selectedPlatforms.has('twitter') && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 rounded bg-[#1DA1F2] flex items-center justify-center text-white text-[10px] font-bold">
                    𝕏
                  </div>
                  <span className="text-xs font-medium text-foreground">Twitter Format</span>
                </div>
                <div className="rounded border border-border bg-background p-3 max-h-32 overflow-y-auto">
                  <pre className="text-[10px] text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">
                    {templates.find(t => t.id === selectedTemplate)?.twitterTemplate}
                  </pre>
                </div>
              </div>
            )}

            {/* Facebook Preview */}
            {selectedPlatforms.has('facebook') && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 rounded bg-[#1877F2] flex items-center justify-center text-white text-[10px] font-bold">
                    f
                  </div>
                  <span className="text-xs font-medium text-foreground">Facebook Format</span>
                </div>
                <div className="rounded border border-border bg-background p-3 max-h-32 overflow-y-auto">
                  <pre className="text-[10px] text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">
                    {templates.find(t => t.id === selectedTemplate)?.facebookTemplate || 'No Facebook template available'}
                  </pre>
                </div>
              </div>
            )}

            {/* Instagram Preview */}
            {selectedPlatforms.has('instagram') && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 rounded bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center text-white text-[10px] font-bold">
                    📷
                  </div>
                  <span className="text-xs font-medium text-foreground">Instagram Format</span>
                </div>
                <div className="rounded border border-border bg-background p-3 max-h-32 overflow-y-auto">
                  <pre className="text-[10px] text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">
                    {templates.find(t => t.id === selectedTemplate)?.instagramTemplate || 'No Instagram template available'}
                  </pre>
                </div>
              </div>
            )}

            {/* Telegram Preview */}
            {selectedPlatforms.has('telegram') && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 rounded bg-[#0088cc] flex items-center justify-center text-white text-[10px] font-bold">
                    ✈
                  </div>
                  <span className="text-xs font-medium text-foreground">Telegram Format</span>
                </div>
                <div className="rounded border border-border bg-background p-3 max-h-32 overflow-y-auto">
                  <pre className="text-[10px] text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">
                    {templates.find(t => t.id === selectedTemplate)?.telegramTemplate || 'No Telegram template available'}
                  </pre>
                </div>
              </div>
            )}

            {/* Threads Preview */}
            {selectedPlatforms.has('threads') && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 rounded bg-black dark:bg-white flex items-center justify-center text-white dark:text-black text-[10px] font-bold">
                    @
                  </div>
                  <span className="text-xs font-medium text-foreground">Threads Format</span>
                </div>
                <div className="rounded border border-border bg-background p-3 max-h-32 overflow-y-auto">
                  <pre className="text-[10px] text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">
                    {templates.find(t => t.id === selectedTemplate)?.threadsTemplate || 'No Threads template available'}
                  </pre>
                </div>
              </div>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-[10px] text-muted-foreground">
              💡 <span className="font-medium">How it works:</span> Type your raw idea above, then click Generate. AI will automatically format it using this template structure.
            </p>
          </div>
        </div>
      )}
    </>
  )
}
