/**
 * Prompt-row drift guard (throughput plan Phase 3).
 *
 * Prompt rows are seeded create-only, so staging admin edits / targeted reseeds
 * silently diverge from prod (3 drift incidents in the week of 2026-07-06:
 * rows 202, 218, and the 201 both-stale case). Run this before every prod
 * deploy — see the release checklist in .documentation/levercast-project-management.md.
 *
 * READ-ONLY: never writes to any database.
 *
 * Modes:
 *   1. Fingerprint the DB that DATABASE_URL points at (staging locally):
 *        pnpm --filter @omniply/db exec tsx scripts/diff-prompt-rows.ts --out staging.json
 *   2. Fingerprint prod from inside the api container (no tsx there — the
 *      inline equivalent, kept in sync with fingerprintRow below):
 *        docker compose exec -T api node -e '<see FINGERPRINT_SNIPPET at bottom>' > prod.json
 *   3. Diff two fingerprint files:
 *        pnpm --filter @omniply/db exec tsx scripts/diff-prompt-rows.ts --diff staging.json prod.json --labels staging,prod
 */

import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'

interface Fingerprint {
  id: string // "step:<n>" or "key:<k>" — stable identity across envs
  stepNumber: number
  key: string | null
  stepName: string
  provider: string
  model: string
  isActive: boolean
  maxTokens: number | null
  textHash: string // md5(systemPrompt + "\x00" + userPrompt)
  sysLen: number
  userLen: number
}

function rowId(r: { stepNumber: number; key: string | null }): string {
  return r.key ? `key:${r.key}` : `step:${r.stepNumber}`
}

async function fingerprint(outFile?: string) {
  const { PrismaClient } = await import('@prisma/client')
  const prisma = new PrismaClient()
  try {
    const rows = await prisma.promptTemplate.findMany({
      orderBy: { stepNumber: 'asc' },
      select: {
        stepNumber: true, key: true, stepName: true, defaultProvider: true,
        defaultModel: true, isActive: true, maxTokens: true,
        systemPrompt: true, userPrompt: true,
      },
    })
    const fps: Fingerprint[] = rows.map((r) => ({
      id: rowId(r),
      stepNumber: r.stepNumber,
      key: r.key,
      stepName: r.stepName,
      provider: r.defaultProvider,
      model: r.defaultModel,
      isActive: r.isActive,
      maxTokens: r.maxTokens,
      textHash: createHash('md5').update((r.systemPrompt ?? '') + '\x00' + r.userPrompt).digest('hex'),
      sysLen: (r.systemPrompt ?? '').length,
      userLen: r.userPrompt.length,
    }))
    const json = JSON.stringify(fps, null, 1)
    if (outFile) {
      writeFileSync(outFile, json)
      console.error(`Wrote ${fps.length} fingerprints to ${outFile}`)
    } else {
      console.log(json)
    }
  } finally {
    await prisma.$disconnect()
  }
}

const COMPARED_FIELDS = ['stepName', 'provider', 'model', 'isActive', 'maxTokens', 'textHash'] as const

function diff(fileA: string, fileB: string, labelA: string, labelB: string) {
  const a: Fingerprint[] = JSON.parse(readFileSync(fileA, 'utf8'))
  const b: Fingerprint[] = JSON.parse(readFileSync(fileB, 'utf8'))
  const mapA = new Map(a.map((r) => [r.id, r]))
  const mapB = new Map(b.map((r) => [r.id, r]))

  const onlyA = a.filter((r) => !mapB.has(r.id))
  const onlyB = b.filter((r) => !mapA.has(r.id))
  const differing: string[] = []

  for (const rA of a) {
    const rB = mapB.get(rA.id)
    if (!rB) continue
    const fields = COMPARED_FIELDS.filter((f) => rA[f] !== rB[f])
    if (fields.length === 0) continue
    const parts = fields.map((f) => {
      if (f === 'textHash') return `text differs (${labelA} sys ${rA.sysLen}/user ${rA.userLen} chars vs ${labelB} sys ${rB.sysLen}/user ${rB.userLen})`
      return `${f}: ${labelA}=${JSON.stringify(rA[f])} ${labelB}=${JSON.stringify(rB[f])}`
    })
    differing.push(`  ${rA.id} (${rA.stepName})\n    ${parts.join('\n    ')}`)
  }

  const section = (title: string, rows: Fingerprint[]) => {
    console.log(`\n${title}: ${rows.length}`)
    for (const r of rows) console.log(`  ${r.id} (${r.stepName}) provider=${r.provider} model=${r.model} active=${r.isActive}`)
  }
  section(`Only in ${labelA}`, onlyA)
  section(`Only in ${labelB}`, onlyB)
  console.log(`\nDiffering: ${differing.length}`)
  for (const d of differing) console.log(d)
  console.log(`\nIn sync: ${a.length - onlyA.length - differing.length} of ${labelA}=${a.length} / ${labelB}=${b.length}`)

  if (onlyA.length + onlyB.length + differing.length > 0) process.exitCode = 1
}

const args = process.argv.slice(2)
if (args[0] === '--diff') {
  const [fileA, fileB] = [args[1], args[2]]
  if (!fileA || !fileB) {
    console.error('Usage: diff-prompt-rows.ts --diff <a.json> <b.json> [--labels a,b]')
    process.exit(2)
  }
  const labelsIdx = args.indexOf('--labels')
  const [labelA, labelB] = labelsIdx >= 0 ? args[labelsIdx + 1].split(',') : ['A', 'B']
  diff(fileA, fileB, labelA, labelB)
} else {
  const outIdx = args.indexOf('--out')
  fingerprint(outIdx >= 0 ? args[outIdx + 1] : undefined).catch((e) => {
    console.error(e)
    process.exit(1)
  })
}

/* FINGERPRINT_SNIPPET — inline equivalent for containers without tsx (keep in
 * sync with fingerprintRow/Fingerprint above):

const {prisma}=require("@omniply/shared");const {createHash}=require("crypto");
(async()=>{const rows=await prisma.promptTemplate.findMany({orderBy:{stepNumber:"asc"},select:{stepNumber:true,key:true,stepName:true,defaultProvider:true,defaultModel:true,isActive:true,maxTokens:true,systemPrompt:true,userPrompt:true}});
console.log(JSON.stringify(rows.map(r=>({id:r.key?"key:"+r.key:"step:"+r.stepNumber,stepNumber:r.stepNumber,key:r.key,stepName:r.stepName,provider:r.defaultProvider,model:r.defaultModel,isActive:r.isActive,maxTokens:r.maxTokens,textHash:createHash("md5").update((r.systemPrompt||"")+"\x00"+r.userPrompt).digest("hex"),sysLen:(r.systemPrompt||"").length,userLen:r.userPrompt.length})),null,1));
process.exit(0)})().catch(e=>{console.error(e);process.exit(1)})

*/
