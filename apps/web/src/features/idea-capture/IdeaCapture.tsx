'use client'

import { useIdeaCapture } from './useIdeaCapture'
import type { IdeaCaptureProps } from './types'
import { InputArea } from './sections/InputArea'
import { PlatformSelection } from './sections/PlatformSelection'
import { PostTypeAssets } from './sections/PostTypeAssets'
import { ActionBar } from './sections/ActionBar'

export function IdeaCapture(props: IdeaCaptureProps) {
  const capture = useIdeaCapture(props)

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <InputArea capture={capture} />
      <PlatformSelection capture={capture} />
      <PostTypeAssets capture={capture} />
      <ActionBar capture={capture} />
    </div>
  )
}
