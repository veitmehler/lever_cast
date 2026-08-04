#!/usr/bin/env node
/**
 * Renders the X-Ray Debrief PDF from xray-debrief-print.html.
 *
 * Usage:  node .documentation/marketing/render-debrief.js [path-to-qr-b64.txt]
 * Output: apps/web/public/x-ray/X-Ray-Debrief.pdf
 *
 * The QR (lime, links to omniply.io/walkthrough) is injected at the
 * __QR_B64__ token. Regenerate it with:
 *   npx qrcode -o qr.png -w 480 -m 1 --dark 0E0E0F --light C3F43B \
 *     "https://www.omniply.io/walkthrough"
 *   base64 -i qr.png | tr -d '\n' > qr-b64.txt
 *
 * Playwright is resolved via normal Node resolution (any install on the path).
 */
const { readFileSync, writeFileSync, mkdtempSync } = require('node:fs')
const { join, resolve } = require('node:path')
const { tmpdir } = require('node:os')

const repoRoot = resolve(__dirname, '../..')
const { chromium } = require('playwright')

async function main() {
  const qrPath = process.argv[2]
  if (!qrPath) throw new Error('pass the path to qr-b64.txt as the first argument')
  const qr = readFileSync(qrPath, 'utf8').trim()
  const html = readFileSync(join(__dirname, 'xray-debrief-print.html'), 'utf8').replaceAll('__QR_B64__', qr)

  const tmp = mkdtempSync(join(tmpdir(), 'debrief-'))
  const tmpHtml = join(tmp, 'debrief.html')
  writeFileSync(tmpHtml, html)

  const out = join(repoRoot, 'apps/web/public/x-ray/X-Ray-Debrief.pdf')
  const browser = await chromium.launch()
  const page = await browser.newPage()
  await page.goto('file://' + tmpHtml, { waitUntil: 'networkidle' })
  await page.pdf({ path: out, printBackground: true, preferCSSPageSize: true })
  await browser.close()
  console.log('rendered:', out)
}

main().catch((e) => { console.error(e); process.exit(1) })
