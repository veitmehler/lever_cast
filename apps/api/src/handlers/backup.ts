import PgBoss from 'pg-boss'
import { execSync } from 'child_process'

export interface DbBackupJobData {
  _cron?: true
}

/**
 * Weekly pg_dump → S3 backup.
 *
 * Requires on the droplet:
 *   - `postgresql-client` (for pg_dump)
 *   - AWS CLI configured with S3_BACKUP_BUCKET and appropriate IAM permissions
 *
 * Environment variables:
 *   DIRECT_URL          — postgres direct connection string (port 25060, bypasses PgBouncer)
 *   S3_BACKUP_BUCKET    — target bucket, e.g. socioply-backups
 */
export async function dbBackupHandler(jobs: PgBoss.Job<DbBackupJobData>[]) {
  console.log(`[db-backup] starting — ${jobs.length} job(s)`)

  const directUrl = process.env.DIRECT_URL
  const backupBucket = process.env.S3_BACKUP_BUCKET

  if (!directUrl || !backupBucket) {
    console.warn('[db-backup] DIRECT_URL or S3_BACKUP_BUCKET not configured — skipping backup')
    return
  }

  const date = new Date().toISOString().slice(0, 10)
  const key = `db-${date}.sql.gz`
  const s3Path = `s3://${backupBucket}/${key}`

  try {
    console.log(`[db-backup] dumping to ${s3Path}`)
    execSync(
      `pg_dump "${directUrl}" | gzip | aws s3 cp - "${s3Path}" --storage-class STANDARD_IA`,
      { stdio: 'pipe' },
    )
    console.log(`[db-backup] backup complete: ${s3Path}`)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[db-backup] backup failed:', msg)
    throw err
  }
}
