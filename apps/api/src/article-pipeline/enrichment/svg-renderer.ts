/**
 * Mermaid → SVG renderer using the `mmdc` (Mermaid CLI) binary.
 *
 * mmdc is installed globally in the Docker image via `npm install -g @mermaid-js/mermaid-cli`
 * and uses headless Chromium for rendering.  The puppeteer config disables the
 * sandbox so it works as a non-root user in Alpine.
 */

import { spawn } from 'node:child_process'
import { writeFile, readFile, unlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Semaphore } from '../../lib/concurrency'
import { randomUUID } from 'node:crypto'

const MMDC_TIMEOUT_MS = 30_000
const PUPPETEER_CONFIG = '/app/puppeteer-config.json'
// Belt-and-braces: keep the config file for mmdc versions that honour it.
const MERMAID_CONFIG = '/app/mermaid-config.json'

/**
 * Default init when no brand theme is injected (backwards compatible).
 * Prefer `buildDiagramInitDirective()` from `diagram-theme.ts` for production.
 */
export const DEFAULT_MERMAID_INIT_DIRECTIVE =
  `%%{init: {"theme": "default", ` +
  `"themeVariables": {"fontFamily": "Arial, Helvetica, sans-serif"}, ` +
  `"flowchart": {"htmlLabels": false}, ` +
  `"sequence": {"htmlLabels": false}, ` +
  `"class": {"htmlLabels": false}, ` +
  `"state": {"htmlLabels": false}` +
  `}}%%`

export class MermaidRenderError extends Error {
  constructor(message: string, public readonly stderr: string) {
    super(message)
    this.name = 'MermaidRenderError'
  }
}

export async function renderMermaidToSvg(
  mermaidSyntax: string,
  initDirective: string = DEFAULT_MERMAID_INIT_DIRECTIVE,
  background: string = 'white',
): Promise<string> {
  const id = randomUUID()
  const inFile = join(tmpdir(), `mermaid-in-${id}.mmd`)
  const outFile = join(tmpdir(), `mermaid-out-${id}.svg`)

  const withInit = mermaidSyntax.trimStart().startsWith('%%{init')
    ? mermaidSyntax
    : initDirective + '\n' + mermaidSyntax

  await writeFile(inFile, withInit, 'utf8')

  try {
    await runMmdc(inFile, outFile, background)
    const svg = await readFile(outFile, 'utf8')
    return svg
  } finally {
    await Promise.all([
      unlink(inFile).catch(() => {}),
      unlink(outFile).catch(() => {}),
    ])
  }
}

// Each mmdc invocation launches its OWN full Chromium (~300-500MB). Under the
// Phase-1 parallel diagram tail this must stay bounded — max 2 concurrent
// renders (they're short-lived, a few seconds each).
const mmdcSemaphore = new Semaphore(Number(process.env.MMDC_MAX_CONCURRENT) > 0 ? Number(process.env.MMDC_MAX_CONCURRENT) : 2)

function runMmdc(inFile: string, outFile: string, background: string): Promise<void> {
  return mmdcSemaphore.run(() => runMmdcUnbounded(inFile, outFile, background))
}

function runMmdcUnbounded(inFile: string, outFile: string, background: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = [
      '-i', inFile,
      '-o', outFile,
      '-t', 'default',
      '-b', background,
      '--width', '1200',
      '--puppeteerConfigFile', PUPPETEER_CONFIG,
      '--configFile', MERMAID_CONFIG,
    ]

    const proc = spawn('mmdc', args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: MMDC_TIMEOUT_MS,
    })

    let stdout = ''
    let stderr = ''
    proc.stdout.on('data', (d: Buffer) => { stdout += d.toString() })
    proc.stderr.on('data', (d: Buffer) => { stderr += d.toString() })

    proc.on('error', (err) => {
      reject(new MermaidRenderError(`mmdc process error: ${err.message}`, stderr))
    })

    proc.on('exit', (code, signal) => {
      if (code === 0) {
        resolve()
      } else {
        reject(
          new MermaidRenderError(
            `mmdc exited with code ${code ?? signal}: ${stderr.slice(0, 500)}`,
            stderr,
          ),
        )
      }
    })
  })
}
