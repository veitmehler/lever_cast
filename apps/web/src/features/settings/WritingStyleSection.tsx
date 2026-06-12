'use client'

import { Save, Loader2, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { SettingsData } from './useSettingsData'

// Renders the Writing Style card plus its sample-text analysis modal (a
// sibling fixed-position overlay in the original layout, kept together here).
export function WritingStyleSection({ settings }: { settings: SettingsData }) {
  const {
    writingStyle, setWritingStyle,
    isSavingWritingStyle,
    isAnalyzingStyle,
    showStyleAnalysisModal, setShowStyleAnalysisModal,
    sampleText, setSampleText,
    handleSaveWritingStyle,
    handleAnalyzeWritingStyle,
  } = settings

  return (
    <>
      {/* Writing Style Settings */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-xl font-semibold text-card-foreground mb-4">Writing Style</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Define your writing voice and style. This will be used to guide AI-generated posts to match your preferred tone and style.
        </p>

        <div className="space-y-4 mb-6">
          <div>
            <label className="text-sm font-medium text-card-foreground mb-2 block">
              Writing Style Description
            </label>
            <textarea
              value={writingStyle}
              onChange={(e) => setWritingStyle(e.target.value)}
              placeholder="e.g., Professional yet conversational, uses short sentences, includes data-driven insights, friendly and approachable tone..."
              className="w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[120px]"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Describe your writing style, tone, and voice preferences. This will be included in AI prompts to ensure generated content matches your style.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => setShowStyleAnalysisModal(true)}
              variant="outline"
              className="flex-1"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Analyze Sample Text
            </Button>
            <Button
              onClick={handleSaveWritingStyle}
              disabled={isSavingWritingStyle}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSavingWritingStyle ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Writing Style
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Writing Style Analysis Modal */}
      {showStyleAnalysisModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-card-foreground">Analyze Writing Style</h3>
              <button
                onClick={() => {
                  setShowStyleAnalysisModal(false)
                  setSampleText('')
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              Paste at least 500 words of your existing writing (blog posts, articles, social media posts, etc.).
              Our AI will analyze the text and generate a writing style description for you.
            </p>

            <div className="mb-4">
              <label className="text-sm font-medium text-card-foreground mb-2 block">
                Sample Text (Minimum 500 words)
              </label>
              <textarea
                value={sampleText}
                onChange={(e) => setSampleText(e.target.value)}
                placeholder="Paste your writing sample here..."
                className="w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[300px]"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Word count: {sampleText.trim().split(/\s+/).filter(w => w.length > 0).length} / 500 minimum
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setShowStyleAnalysisModal(false)
                  setSampleText('')
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAnalyzeWritingStyle}
                disabled={isAnalyzingStyle || sampleText.trim().split(/\s+/).filter(w => w.length > 0).length < 500}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isAnalyzingStyle ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Analyze & Apply
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
