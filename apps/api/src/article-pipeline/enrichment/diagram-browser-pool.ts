/**
 * Singleton Chromium browser for diagram PNG rasterization (Puppeteer).
 * Re-used across sections in one enrichment run to avoid startup cost.
 */

import puppeteer, { type Browser } from 'puppeteer-core'

function chromiumPath(): string {
  return (
    process.env.PUPPETEER_EXECUTABLE_PATH ??
    process.env.CHROME_BIN ??
    '/usr/bin/chromium-browser'
  )
}

let pooled: Browser | null = null

export async function getDiagramRasterBrowser(): Promise<Browser> {
  if (!pooled?.connected) {
    pooled = await puppeteer.launch({
      executablePath: chromiumPath(),
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    })
  }
  return pooled
}

export async function closeDiagramRasterBrowser(): Promise<void> {
  if (pooled) {
    await pooled.close().catch(() => {})
    pooled = null
  }
}
