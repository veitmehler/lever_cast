'use client'

import { ApiKeyRequiredModal } from '@/components/ApiKeyRequiredModal'
import { useDashboard } from '@/features/dashboard/useDashboard'
import { ModeToggle } from '@/features/dashboard/sections/ModeToggle'
import { DashboardInput } from '@/features/dashboard/sections/DashboardInput'
import { GeneratedPosts } from '@/features/dashboard/sections/GeneratedPosts'
import { FeatureOverview } from '@/features/dashboard/sections/FeatureOverview'

export default function DashboardPage() {
  const dashboard = useDashboard()

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Welcome to Socioply</h1>
        <p className="text-muted-foreground">
          Convert your spontaneous ideas into polished, multi-platform social posts.
        </p>
      </div>

      <ModeToggle dashboard={dashboard} />

      <DashboardInput dashboard={dashboard} />

      <GeneratedPosts dashboard={dashboard} />

      <FeatureOverview dashboard={dashboard} />

      {/* API Key Required Modal */}
      <ApiKeyRequiredModal
        isOpen={dashboard.showApiKeyModal}
        onClose={() => dashboard.setShowApiKeyModal(false)}
        reason={dashboard.apiKeyErrorReason}
      />
    </div>
  )
}
