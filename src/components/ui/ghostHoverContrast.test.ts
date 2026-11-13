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

/**
 * Every `<Button …>` opening tag, read with a small scanner that balances
 * braces at any depth and skips quoted text, so a tag with a deeply nested
 * handler is still examined.
 */
export function buttonTags(source: string): string[] {
  const tags: string[] = []
  let i = source.indexOf('<Button')
  while (i !== -1) {
    if (!/\w/.test(source[i + 7] ?? '')) {
      let depth = 0
      let j = i + 7
      let quote = ''
      for (; j < source.length; j++) {
        const c = source[j]
        if (quote) {
          if (c === '\\') j++
          else if (c === quote) quote = ''
        } else if (c === '"' || c === "'" || c === '`') quote = c
        else if (c === '{') depth++
        else if (c === '}') depth--
        else if (c === '>' && depth === 0) break
      }
      tags.push(source.slice(i, j + 1))
    }
    i = source.indexOf('<Button', i + 7)
  }
  return tags
}

/**
 * The class strings of a tag: each quoted literal, with a template literal
 * split at every `${…}` so the branches of an interpolated condition are
 * checked on their own.
 */
export function classSegments(tag: string): string[] {
  const out: string[] = []
  for (const m of tag.matchAll(/"[^"\n]*"|'[^'\n]*'|`[^`]*`/g)) {
    const lit = m[0]
    if (!lit.startsWith('`')) {
      out.push(lit)
      continue
    }
    for (const piece of lit.slice(1, -1).split(/\$\{|\}/)) {
      const quoted = piece.match(/"[^"\n]*"|'[^'\n]*'/g)
      out.push(...(quoted ?? [piece]))
    }
  }
  return out
}

// Neutral surfaces: their -foreground is the page foreground or a dimmer
// tone of it, so the ghost hover rule keeps or raises contrast there.
const NEUTRAL = new Set(['muted', 'card', 'background', 'popover'])

/** One problem per offending class string: `missing:X` or `on-tint:X`. */
export function ghostHoverProblems(source: string): string[] {
  const problems: string[] = []
  for (const tag of buttonTags(source)) {
    if (!/variant=["']ghost["']/.test(tag)) continue
    for (const seg of classSegments(tag)) {
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

  it('reads tags with deeply nested handlers and template-literal branches', () => {
    const deep =
      '<Button variant="ghost" onClick={() => { if (a) { go({ k: 1 }) } }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">'
    expect(ghostHoverProblems(deep)).toEqual(['missing:destructive'])
    const tpl =
      "<Button variant=\"ghost\" className={`px-2 ${on ? 'bg-success text-success-foreground hover:bg-success/90 hover:text-success-foreground' : 'bg-success text-success-foreground'}`}>"
    expect(ghostHoverProblems(tpl)).toEqual([])
    const tplBad =
      "<Button variant=\"ghost\" className={`px-2 ${on ? 'bg-success/20 hover:bg-success/20' : 'bg-success text-success-foreground hover:text-success-foreground'}`}>"
    expect(ghostHoverProblems(tplBad)).toEqual(['on-tint:success'])
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

// ---- Theme tokens -------------------------------------------------------
// The class rule above is only safe if each coloured fill's own label clears
// WCAG AA (4.5:1) on that fill, solid and at the /90 hover, in both themes.
// Computed from src/styles/index.css.

type Hsl = [number, number, number]
const CSS = fs.readFileSync(path.join(SRC, 'styles/index.css'), 'utf8')

function block(selector: string): Record<string, Hsl> {
  const start = CSS.indexOf(`\n  ${selector} {`)
  if (start === -1) throw new Error(`no ${selector} block in index.css`)
  const end = CSS.indexOf('\n  }', start)
  const out: Record<string, Hsl> = {}
  for (const m of CSS.slice(start, end).matchAll(
    /--([\w-]+):\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%;/g
  ))
    out[m[1]] = [Number(m[2]), Number(m[3]), Number(m[4])]
  return out
}

const LIGHT = block(':root')
const THEMES: Record<string, Record<string, Hsl>> = {
  light: LIGHT,
  dark: { ...LIGHT, ...block('.dark') },
}

function rgb([h, s, l]: Hsl): [number, number, number] {
  const sat = s / 100
  const lig = l / 100
  const k = (n: number) => (n + h / 30) % 12
  const a = sat * Math.min(lig, 1 - lig)
  const f = (n: number) => lig - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return [f(0), f(8), f(4)]
}
function luminance(c: [number, number, number]): number {
  const [r, g, b] = c.map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
function ratio(a: [number, number, number], b: [number, number, number]): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}
function over(
  c: [number, number, number],
  base: [number, number, number],
  alpha: number
): [number, number, number] {
  return [0, 1, 2].map((i) => c[i] * alpha + base[i] * (1 - alpha)) as [number, number, number]
}

const FILLS = ['primary', 'secondary', 'success', 'accent', 'destructive']

describe('coloured fills keep their label at AA in both themes', () => {
  for (const [theme, t] of Object.entries(THEMES)) {
    for (const x of FILLS) {
      it(`${theme} ${x}-foreground on ${x}, solid and /90`, () => {
        const fill = rgb(t[x])
        const label = rgb(t[`${x}-foreground`])
        const page = rgb(t.background)
        expect(ratio(label, fill)).toBeGreaterThanOrEqual(4.5)
        expect(ratio(label, over(fill, page, 0.9))).toBeGreaterThanOrEqual(4.5)
      })
    }
  }

  // The -legible text tokens sit on their own fill's light tints in the light
  // theme; a darker fill darkens those tints too.
  const TINTS: Record<string, number[]> = {
    accent: [0.1, 0.15],
    destructive: [0.1, 0.15, 0.2, 0.3],
  }
  for (const [x, alphas] of Object.entries(TINTS)) {
    it(`light ${x}-legible on its ${alphas.map((a) => `/${a * 100}`).join(', ')} tints`, () => {
      const fill = rgb(LIGHT[x])
      const text = rgb(LIGHT[`${x}-legible`])
      for (const base of [rgb(LIGHT.background), [1, 1, 1] as [number, number, number]])
        for (const a of alphas) expect(ratio(text, over(fill, base, a))).toBeGreaterThanOrEqual(4.5)
    })
  }
})
