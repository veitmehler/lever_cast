#!/usr/bin/env node
/**
 * Verify the GoHighLevel email-marketing API against a real location.
 *
 * Read-only by default: confirms connectivity, key scopes, the tags shape, and
 * the email-campaign *read* shape (which reveals the field names used by the
 * create/schedule endpoints). Does NOT create or send anything unless you pass
 * --create, which makes a DRAFT campaign against --tag (still never sends).
 *
 * Usage:
 *   GHL_API_KEY=pit-xxxx GHL_LOCATION_ID=ve9EPM... node scripts/verify-ghl-email-api.mjs
 *   ... node scripts/verify-ghl-email-api.mjs --create --tag <tagId>   (optional, makes a draft)
 *
 * The API key is a GHL Private Integration token with email + locations scopes.
 */

const BASE = 'https://services.leadconnectorhq.com'
const VERSION = '2021-07-28'

const apiKey = process.env.GHL_API_KEY
const locationId = process.env.GHL_LOCATION_ID
const args = process.argv.slice(2)
const doCreate = args.includes('--create')
const tagId = args[args.indexOf('--tag') + 1]

if (!apiKey || !locationId) {
  console.error('Set GHL_API_KEY and GHL_LOCATION_ID env vars.')
  process.exit(1)
}

const headers = {
  Authorization: `Bearer ${apiKey}`,
  Accept: 'application/json',
  'Content-Type': 'application/json',
  Version: VERSION,
}

async function call(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let data
  try { data = JSON.parse(text) } catch { data = text }
  return { status: res.status, ok: res.ok, data }
}

function summarizeKeys(obj, label) {
  if (Array.isArray(obj)) {
    console.log(`  ${label}: array(${obj.length})`, obj[0] ? `first item keys: ${Object.keys(obj[0]).join(', ')}` : '(empty)')
  } else if (obj && typeof obj === 'object') {
    console.log(`  ${label}: keys = ${Object.keys(obj).join(', ')}`)
  } else {
    console.log(`  ${label}:`, obj)
  }
}

async function main() {
  console.log(`\n=== GHL email API verification (location ${locationId}) ===\n`)

  // 1) Tags — confirms the smart-list picker source + locations scope.
  console.log('1) GET /locations/{id}/tags')
  const tags = await call('GET', `/locations/${locationId}/tags`)
  console.log(`   status ${tags.status}`)
  if (tags.ok) {
    const list = Array.isArray(tags.data) ? tags.data : tags.data.tags
    summarizeKeys(list, 'tags')
    console.log('   sample:', JSON.stringify((list ?? [])[0] ?? null))
  } else {
    console.log('   error:', JSON.stringify(tags.data))
  }

  // 2) List campaigns — confirms the campaign object shape (subject/html/status/etc).
  console.log('\n2) GET /emails/schedule?locationId={id}  (Get Campaigns)')
  const camps = await call('GET', `/emails/schedule?locationId=${locationId}&limit=3`)
  console.log(`   status ${camps.status}`)
  if (camps.ok) {
    summarizeKeys(camps.data, 'response')
    const arr = camps.data?.schedules ?? camps.data?.campaigns ?? camps.data?.data ?? camps.data
    if (Array.isArray(arr) && arr[0]) {
      console.log('   first campaign keys:', Object.keys(arr[0]).join(', '))
      console.log('   first campaign sample:', JSON.stringify(arr[0]).slice(0, 800))
    }
  } else {
    console.log('   error:', JSON.stringify(camps.data))
  }

  // 3) Optional: create a DRAFT campaign to confirm the write field names + scopes.
  if (doCreate) {
    if (!tagId) {
      console.error('\n--create requires --tag <tagId>')
      process.exit(1)
    }
    console.log('\n3) POST /emails/public/v2/locations/{id}/campaigns  (create DRAFT — not sent)')
    const body = {
      locationId,
      name: `API verify draft ${new Date().toISOString()}`,
      subject: '[verify] please ignore',
      html: '<p>verification draft — safe to delete</p>',
      tagIds: [tagId],
    }
    const created = await call('POST', `/emails/public/v2/locations/${locationId}/campaigns`, body)
    console.log(`   status ${created.status}`)
    console.log('   response:', JSON.stringify(created.data).slice(0, 800))
    console.log('\n   NOTE: delete this draft in GHL if it was created.')
  } else {
    console.log('\n3) (skipped create — pass --create --tag <tagId> to confirm write fields)')
  }

  console.log('\n=== done ===\n')
}

main().catch((e) => { console.error(e); process.exit(1) })
