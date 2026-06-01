/** Correlation fields threaded through social automation for structured logging. */
export interface AutomationLogContext {
  runId: string
  userId: string
  jobId?: string
  slotKey?: string
  platform?: string
  postId?: string
  ghlPostId?: string
}

export function withSlotKey(ctx: AutomationLogContext, slotKey: string): AutomationLogContext {
  return { ...ctx, slotKey }
}

export function withPlatform(ctx: AutomationLogContext, platform: string): AutomationLogContext {
  return { ...ctx, platform }
}

export function withPost(
  ctx: AutomationLogContext,
  postId: string,
  ghlPostId?: string,
): AutomationLogContext {
  return { ...ctx, postId, ghlPostId }
}
