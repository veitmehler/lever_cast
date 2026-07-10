/**
 * Chromium for review-mining's external Google Maps navigation — deliberately
 * NOT the shared diagram-rasterization pool (diagram-browser-pool.ts). A hung
 * external navigation must never be able to wedge trusted local-file rendering.
 * One fresh browser per spider run (not a long-lived singleton): bounds resource
 * use across the cron's sequential per-account runs and lets the residential
 * proxy's session rotate naturally per account. See
 * .plans/client-story-review-mining.implementation-plan.md Phase 2.
 */
import puppeteer, { type Browser } from 'puppeteer-core'
import { getOxylabsProxyAuth, resolveProxyHost } from '../../lib/oxylabs-auth'

function chromiumPath(): string {
  return process.env.PUPPETEER_EXECUTABLE_PATH ?? process.env.CHROME_BIN ?? '/usr/bin/chromium-browser'
}

/** Launch a fresh, proxy-routed browser + authenticated page for one spider run. */
export async function launchReviewCaptureBrowser(): Promise<{
  browser: Browser
  authenticate: (page: import('puppeteer-core').Page) => Promise<void>
}> {
  const proxyAuth = await getOxylabsProxyAuth()
  if (!proxyAuth) throw new Error('Oxylabs residential proxy not configured')

  const browser = await puppeteer.launch({
    executablePath: chromiumPath(),
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      `--proxy-server=http://${resolveProxyHost()}`,
    ],
  })

  return {
    browser,
    authenticate: (page) => page.authenticate({ username: proxyAuth.username, password: proxyAuth.password }),
  }
}
