import { HtmlTarget } from './html-target'
import { BundleTarget } from './bundle-target'
import { WordPressTarget } from './wordpress-target'
import { InternalTarget } from './internal-target'
import type { OutputTarget } from './types'

const registry: Record<string, OutputTarget> = {
  html:      new HtmlTarget(),
  bundle:    new BundleTarget(),
  wordpress: new WordPressTarget(),
  // AZAVEA VERTICAL ONLY (brand-consolidation Phase A): selected solely by
  // the vertical-gated branch in the publish/output routes. Clinic paths
  // (wordpress publish, html download, bundle) are untouched by design.
  internal:  new InternalTarget(),
}

export function getOutputTarget(name: string): OutputTarget {
  const target = registry[name]
  if (!target) {
    throw new Error(`Unknown output target: "${name}". Valid targets: ${Object.keys(registry).join(', ')}`)
  }
  return target
}

export const VALID_TARGETS = Object.keys(registry) as ReadonlyArray<string>
