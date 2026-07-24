import { prisma } from '@omniply/shared'

/** Random integer in [6, 12] inclusive. */
export function randomSlideCount(): number {
  return 6 + Math.floor(Math.random() * 7)
}

/** Pick slide count once per run; reuse on per-slot retries. */
export async function ensureRunSlideCount(
  runId: string,
  opts?: { reset?: boolean },
): Promise<number> {
  const run = await prisma.socialAutomationRun.findUnique({
    where: { id: runId },
    select: { slideCount: true },
  })
  if (!run) throw new Error(`Automation run not found: ${runId}`)

  if (run.slideCount != null && !opts?.reset) {
    return run.slideCount
  }

  const slideCount = randomSlideCount()
  await prisma.socialAutomationRun.update({
    where: { id: runId },
    data: { slideCount },
  })
  return slideCount
}
