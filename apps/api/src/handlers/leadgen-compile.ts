/** Thin pg-boss wrapper around the lead-gen compilers (leadgen plan Phases 4+6). */
import type PgBoss from 'pg-boss'
import { compileLeadGenDocument, compileCustomDocument } from '../leadgen/compile'

export interface LeadgenCompileJobData {
  documentId: string
  /** Optional client feedback from a regenerate — folded into the rewrite prompt. */
  note?: string
  /** Custom-upload path (Model A): process the uploaded PDF instead of a template. */
  custom?: boolean
  addCover?: boolean
}

export async function leadgenCompileHandler(jobs: PgBoss.Job<LeadgenCompileJobData>[]): Promise<void> {
  for (const job of jobs) {
    if (job.data.custom) {
      await compileCustomDocument(job.data.documentId, job.data.addCover ?? false)
    } else {
      await compileLeadGenDocument(job.data.documentId, job.data.note)
    }
  }
}
