import { describe, it, expect } from 'vitest'
import { cleanTextOutput, cleanAndParseJSON } from '../output-cleaner'

describe('cleanTextOutput', () => {
  it('trims, strips a BOM, code fences, and wrapping quotes', () => {
    expect(cleanTextOutput('  ```json\n{"a":1}\n```  ')).toBe('{"a":1}')
    expect(cleanTextOutput('﻿hello')).toBe('hello')
    expect(cleanTextOutput('"quoted"')).toBe('quoted')
    expect(cleanTextOutput("'single'")).toBe('single')
  })

  it('strips a fence with a language tag (```mermaid)', () => {
    expect(cleanTextOutput('```mermaid\ngraph TD\n```')).toBe('graph TD')
  })

  it('leaves clean text untouched', () => {
    expect(cleanTextOutput('just text')).toBe('just text')
  })
})

describe('cleanAndParseJSON', () => {
  it('parses clean JSON directly with no fixes logged', () => {
    const { data, log } = cleanAndParseJSON('{"a":1}')
    expect(data).toEqual({ a: 1 })
    expect(log.fixes).toEqual([])
  })

  it('strips a BOM before parsing', () => {
    const { data, log } = cleanAndParseJSON('﻿{"a":1}')
    expect(data).toEqual({ a: 1 })
    expect(log.fixes).toContain('stripped BOM')
  })

  it('unescapes backslash-escaped quotes that broke a direct parse', () => {
    // Raw chars: {\"a\":1}  — invalid until the \" sequences are unescaped.
    const { data, log } = cleanAndParseJSON('{\\"a\\":1}')
    expect(data).toEqual({ a: 1 })
    expect(log.fixes).toContain('unescaped common sequences')
  })

  it('extracts JSON from a ```json code fence with surrounding prose', () => {
    const raw = 'Here you go:\n```json\n{"a":1}\n```\nThanks!'
    const { data, log } = cleanAndParseJSON(raw)
    expect(data).toEqual({ a: 1 })
    expect(log.fixes).toContain('extracted from code fence')
  })

  it('regex-extracts the first object when wrapped in prose', () => {
    const { data, log } = cleanAndParseJSON('blah blah {"a":1} trailing')
    expect(data).toEqual({ a: 1 })
    expect(log.fixes).toContain('regex-extracted first object/array')
  })

  it('wraps a brace-less fragment in braces', () => {
    // No bracketed sub-string, so the regex-extract step can't fire — only the
    // brace-wrapping fix recovers this.
    const { data, log } = cleanAndParseJSON('"a": 1, "b": 2')
    expect(data).toEqual({ a: 1, b: 2 })
    expect(log.fixes).toContain('wrapped in braces')
  })

  it('removes trailing commas before } or ]', () => {
    const { data, log } = cleanAndParseJSON('{"a":[1,2,],}')
    expect(data).toEqual({ a: [1, 2] })
    expect(log.fixes).toContain('removed trailing commas')
  })

  it('throws immediately on bad JSON when withFixes is false', () => {
    expect(() => cleanAndParseJSON('not json', false)).toThrow(SyntaxError)
  })

  it('throws after exhausting all fixes on unrecoverable input', () => {
    expect(() => cleanAndParseJSON('this is { not ] valid at all')).toThrow(/JSON parse failed/)
  })
})
