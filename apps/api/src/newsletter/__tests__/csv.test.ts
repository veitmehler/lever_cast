import { describe, it, expect } from 'vitest'
import { parseNewsletterCsv } from '../csv'

const HEADER = 'date,topic,bullet1,bullet2,bullet3,secondary_article,recipe,recipe_2,video_url'

describe('parseNewsletterCsv', () => {
  it('parses a valid row with optional columns', () => {
    const csv = `${HEADER}
2026-07-01,Back pain basics,b1,b2,b3,Posture tips,Quinoa salad,Energy bites,https://youtu.be/abc`
    const { rows, errors, headerError } = parseNewsletterCsv(csv)
    expect(headerError).toBeUndefined()
    expect(errors).toHaveLength(0)
    expect(rows).toHaveLength(1)
    const r = rows[0]
    expect(r.topic).toBe('Back pain basics')
    expect(r.secondaryTopic).toBe('Posture tips')
    expect(r.recipe).toBe('Quinoa salad')
    expect(r.recipe2).toBe('Energy bites')
    expect(r.videoUrl).toBe('https://youtu.be/abc')
    expect(r.date.toISOString().slice(0, 10)).toBe('2026-07-01')
  })

  it('accepts header aliases (spaces / underscores) and trims', () => {
    const csv = `Date, Topic , Bullet 1,Bullet 2,Bullet 3,Recipe 2
2026-07-02, Neck care , one, two, three, Nut-free trail mix`
    const { rows, errors, headerError } = parseNewsletterCsv(csv)
    expect(headerError).toBeUndefined()
    expect(errors).toHaveLength(0)
    expect(rows[0].topic).toBe('Neck care')
    expect(rows[0].bullet1).toBe('one')
    expect(rows[0].recipe2).toBe('Nut-free trail mix')
  })

  it('reports a fatal header error when a required column is missing', () => {
    const csv = `date,topic,bullet1,bullet2
2026-07-01,t,b1,b2`
    const { headerError, rows } = parseNewsletterCsv(csv)
    expect(headerError).toMatch(/bullet3/)
    expect(rows).toHaveLength(0)
  })

  it('flags rows with missing required fields and keeps the good ones', () => {
    const csv = `${HEADER}
2026-07-01,Has topic,b1,b2,b3,,,,,
2026-07-02,,b1,b2,b3,,,,,`
    const { rows, errors } = parseNewsletterCsv(csv)
    expect(rows).toHaveLength(1)
    expect(rows[0].rowNumber).toBe(1)
    expect(errors).toHaveLength(1)
    expect(errors[0].rowNumber).toBe(2)
    expect(errors[0].error).toMatch(/topic/)
  })

  it('flags invalid dates', () => {
    const csv = `${HEADER}
not-a-date,Topic,b1,b2,b3,,,,,`
    const { rows, errors } = parseNewsletterCsv(csv)
    expect(rows).toHaveLength(0)
    expect(errors[0].error).toMatch(/Invalid date/)
  })

  it('detects duplicate dates within the file', () => {
    const csv = `${HEADER}
2026-07-01,First,b1,b2,b3,,,,,
2026-07-01,Second,b1,b2,b3,,,,,`
    const { rows, errors } = parseNewsletterCsv(csv)
    expect(rows).toHaveLength(1)
    expect(errors).toHaveLength(1)
    expect(errors[0].error).toMatch(/Duplicate date 2026-07-01/)
  })

  it('returns a header error for an empty file', () => {
    const { headerError } = parseNewsletterCsv('')
    expect(headerError).toBeTruthy()
  })
})
