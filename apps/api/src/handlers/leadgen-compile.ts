/** Thin pg-boss wrapper around the lead-gen compiler (leadgen plan Phase 4). */
import type PgBoss from 'pg-boss'
import { compileLeadGenDocument } from '../leadgen/compile'

export interface LeadgenCompileJobData {
  documentId: string
  /** Optional client feedback from a regenerate — folded into the rewrite prompt. */
  note?: string
}

export async function leadgenCompileHandler(jobs: PgBoss.Job<LeadgenCompileJobData>[]): Promise<void> {
  for (const job of jobs) {
    await compileLeadGenDocument(job.data.documentId, job.data.note)
  }
}
