// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The ghost button variant (button-variants.ts) sets `hover:text-foreground`.
 * A ghost button that paints its own coloured background with the matching
 * light-on-colour text (`bg-X` + `text-X-foreground`) keeps that hover rule
 * unless it overrides it, so on hover its label turns to the page foreground
 * and drops under the 4.5:1 contrast floor (the HPKE workshop "Completed"
 * button measured 3.7:1). Every such button must also set
 * `hover:text-X-foreground`.
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const SRC = path.resolve(__dirname, '../..')

function tsxFiles(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) tsxFiles(p, out)
    else if (e.name.endsWith('.tsx') && !e.name.includes('.test.')) out.push(p)
  }
  return out
}

const BUTTON = /<Button\b(?:[^>"'`{}]|"[^"]*"|'[^']*'|`[^`]*`|\{(?:[^{}]|\{[^{}]*\})*\})*>/g
const PAIR =
  /\bbg-([a-z]+(?:-[a-z]+)*?)\s+(?:[^'"`]*?\s)?text-\1-foreground\b|\btext-([a-z]+(?:-[a-z]+)*?)-foreground\s+(?:[^'"`]*?\s)?bg-\2\b/g

// Neutral surfaces: their -foreground is the page foreground or a dimmer
// tone of it, so the ghost hover rule keeps or raises contrast there.
const NEUTRAL = new Set(['muted', 'card', 'background', 'popover', 'accent'])

export function ghostHoverLeaks(source: string): string[] {
  const leaks: string[] = []
  for (const m of source.matchAll(BUTTON)) {
    const tag = m[0]
    if (!/variant=["']ghost["']/.test(tag)) continue
    for (const p of tag.matchAll(PAIR)) {
      const token = p[1] ?? p[2]
      if (NEUTRAL.has(token)) continue
      if (!tag.includes(`hover:text-${token}-foreground`)) leaks.push(token)
    }
  }
  return leaks
}

describe('coloured ghost buttons keep their light label on hover', () => {
  it('detects the leak and accepts the fix', () => {
    expect(
      ghostHoverLeaks('<Button variant="ghost" className="bg-secondary text-secondary-foreground">')
    ).toEqual(['secondary'])
    expect(
      ghostHoverLeaks(
        '<Button variant="ghost" className="bg-secondary text-secondary-foreground hover:text-secondary-foreground">'
      )
    ).toEqual([])
    expect(
      ghostHoverLeaks(
        '<Button variant="outline" className="bg-secondary text-secondary-foreground">'
      )
    ).toEqual([])
  })

  it('no ghost button in src leaks the dark hover label onto its own background', () => {
    const leaks: string[] = []
    for (const f of tsxFiles(SRC)) {
      const src = fs.readFileSync(f, 'utf8')
      for (const token of ghostHoverLeaks(src)) leaks.push(`${path.relative(SRC, f)}: ${token}`)
    }
    expect(leaks).toEqual([])
  })
})
