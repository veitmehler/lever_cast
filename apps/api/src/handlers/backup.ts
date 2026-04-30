import PgBoss from 'pg-boss'
import { spawn } from 'node:child_process'
import { Readable } from 'node:stream'
import { Upload } from '@aws-sdk/lib-storage'
import { S3Client } from '@aws-sdk/client-s3'
import { logger } from '../lib/logger'

export interface DbBackupJobData {
  _cron?: true
}

/**
 * Weekly pg_dump → S3 backup.
 *
 * Requires in the Docker image: postgresql-client (pg_dump binary).
 *
 * Environment variables:
 *   DIRECT_URL          — postgres direct connection (port 25060, bypasses PgBouncer)
 *   S3_BACKUP_BUCKET    — target bucket, e.g. socioply-backups
 *   S3_REGION           — AWS region
 *   ACCESS_KEY_ID       — AWS access key
 *   SECRET_ACCESS_KEY   — AWS secret key
 */
export async function dbBackupHandler(jobs: PgBoss.Job<DbBackupJobData>[]) {
  logger.info({ jobs: jobs.length }, '[db-backup] starting')

  const directUrl = process.env.DIRECT_URL
  const backupBucket = process.env.S3_BACKUP_BUCKET

  if (!directUrl || !backupBucket) {
    logger.warn('[db-backup] DIRECT_URL or S3_BACKUP_BUCKET not set — skipping')
    return
  }

  const s3 = new S3Client({
    region: process.env.S3_REGION ?? 'us-east-1',
    credentials: {
      accessKeyId: process.env.ACCESS_KEY_ID!,
      secretAccessKey: process.env.SECRET_ACCESS_KEY!,
    },
  })

  const date = new Date().toISOString().slice(0, 10)
  const key = `db/socioply-${date}.sql.gz`
  logger.info({ key, bucket: backupBucket }, '[db-backup] streaming pg_dump to S3')

  // pg_dump | gzip — piped directly into the S3 upload stream (no tmp file needed)
  const dump = spawn('pg_dump', ['--no-owner', '--no-acl', '--format=plain', directUrl])
  const gzip = spawn('gzip', ['-9'])
  dump.stdout.pipe(gzip.stdin)
  dump.stderr.on('data', (d: Buffer) => logger.warn({ stderr: d.toString() }, '[db-backup] pg_dump stderr'))

  const upload = new Upload({
    client: s3,
    params: {
      Bucket: backupBucket,
      Key: key,
      Body: gzip.stdout as unknown as Readable,
      StorageClass: 'STANDARD',  // Lifecycle rule moves to GLACIER_IR after 30 days
    },
  })

  await upload.done()
  logger.info({ key }, '[db-backup] complete')
}
