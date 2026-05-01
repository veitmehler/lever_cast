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
import { randomUUID } from 'node:crypto'

const MMDC_TIMEOUT_MS = 30_000
const PUPPETEER_CONFIG = '/app/puppeteer-config.json'

export class MermaidRenderError extends Error {
  constructor(message: string, public readonly stderr: string) {
    super(message)
    this.name = 'MermaidRenderError'
  }
}

export async function renderMermaidToSvg(mermaidSyntax: string): Promise<string> {
  const id = randomUUID()
  const inFile  = join(tmpdir(), `mermaid-in-${id}.mmd`)
  const outFile = join(tmpdir(), `mermaid-out-${id}.svg`)

  await writeFile(inFile, mermaidSyntax, 'utf8')

  try {
    await runMmdc(inFile, outFile)
    const svg = await readFile(outFile, 'utf8')
    return svg
  } finally {
    await Promise.all([
      unlink(inFile).catch(() => {}),
      unlink(outFile).catch(() => {}),
    ])
  }
}

function runMmdc(inFile: string, outFile: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = [
      '-i', inFile,
      '-o', outFile,
      '-t', 'default',
      '-b', 'white',
      '--width', '1200',
      '--puppeteerConfigFile', PUPPETEER_CONFIG,
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
