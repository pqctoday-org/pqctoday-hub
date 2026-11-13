// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The ghost button variant (button-variants.ts) adds `hover:bg-muted/20
 * hover:text-foreground`. Through tailwind-merge (cn), a className's own
 * `hover:bg-X` replaces the muted hover tint, but a plain `bg-X` does not: on
 * hover the muted tint is painted over it.
 *
 * So, for each class string of a ghost button that pairs a coloured `bg-X`
 * with light-on-colour `text-X-foreground`:
 *  - with its own `hover:bg-X…`, the hover background stays coloured, so the
 *    label must stay `X-foreground` too: it needs `hover:text-X-foreground`
 *    (the HPKE workshop "Completed" button measured 3.7:1 without it);
 *  - without one, the hover background is the near-transparent muted tint, so
 *    the label must stay the page foreground: `hover:text-X-foreground` there
 *    would put light text on a light tint (about 1:1).
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
const SEGMENT = /"[^"\n]*"|'[^'\n]*'|`[^`]*`/g

// Neutral surfaces: their -foreground is the page foreground or a dimmer
// tone of it, so the ghost hover rule keeps or raises contrast there.
const NEUTRAL = new Set(['muted', 'card', 'background', 'popover'])

/** One problem per offending class string: `missing:X` or `on-tint:X`. */
export function ghostHoverProblems(source: string): string[] {
  const problems: string[] = []
  for (const m of source.matchAll(BUTTON)) {
    const tag = m[0]
    if (!/variant=["']ghost["']/.test(tag)) continue
    for (const seg of tag.match(SEGMENT) ?? []) {
      for (const t of seg.matchAll(/(?<![\w:/-])text-([a-z]+(?:-[a-z]+)*?)-foreground\b/g)) {
        const x = t[1]
        if (NEUTRAL.has(x)) continue
        if (!new RegExp(`(?<![\\w:-])bg-${x}(?![\\w-])`).test(seg)) continue
        const ownHoverBg = new RegExp(`hover:bg-${x}(?![\\w-])`).test(seg)
        const keepsLabel = seg.includes(`hover:text-${x}-foreground`)
        if (ownHoverBg && !keepsLabel) problems.push(`missing:${x}`)
        if (!ownHoverBg && keepsLabel) problems.push(`on-tint:${x}`)
      }
    }
  }
  return problems
}

describe('coloured ghost buttons keep a readable label on hover', () => {
  it('flags both directions and accepts the two correct forms', () => {
    const g = (cls: string) => ghostHoverProblems(`<Button variant="ghost" className="${cls}">`)
    expect(g('bg-secondary text-secondary-foreground hover:bg-secondary/90')).toEqual([
      'missing:secondary',
    ])
    expect(
      g(
        'bg-secondary text-secondary-foreground hover:bg-secondary/90 hover:text-secondary-foreground'
      )
    ).toEqual([])
    expect(g('bg-primary text-primary-foreground hover:text-primary-foreground')).toEqual([
      'on-tint:primary',
    ])
    expect(g('border-primary bg-primary text-primary-foreground')).toEqual([])
    expect(
      ghostHoverProblems(
        '<Button variant="outline" className="bg-secondary text-secondary-foreground hover:bg-secondary/90">'
      )
    ).toEqual([])
  })

  it('checks each branch of a conditional class on its own', () => {
    expect(
      ghostHoverProblems(
        "<Button variant=\"ghost\" className={on ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-primary/10 text-primary hover:text-primary-foreground'}>"
      )
    ).toEqual(['missing:primary'])
  })

  it('no ghost button in src has an unreadable hover label', () => {
    const problems: string[] = []
    for (const f of tsxFiles(SRC)) {
      for (const p of ghostHoverProblems(fs.readFileSync(f, 'utf8')))
        problems.push(`${path.relative(SRC, f)}: ${p}`)
    }
    expect(problems).toEqual([])
  })
})
