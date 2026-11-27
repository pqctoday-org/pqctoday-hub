// SPDX-License-Identifier: AGPL-3.0-only
// Reads the colour tokens out of src/styles/index.css and computes WCAG 2.x
// contrast ratios for them. Used by tokens.contrast.test.ts, which holds the
// Storybook Blue contrast rules as an automated check.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

export type Mode = 'light' | 'dark'

const CSS_PATH = resolve(__dirname, 'index.css')
// The UX grammar's chip-tone tokens live in their own generated file (grammarTokens.json).
const GRAMMAR_CSS_PATH = resolve(__dirname, 'grammar-tokens.css')

// Remove CSS comments so a colon or brace inside prose cannot confuse the parser.
function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '')
}

/** Body of the first top-level-ish rule whose selector is exactly `selector`
 *  and which sits outside any @media block (the print overrides are inside one). */
function ruleBody(css: string, selector: string): string {
  const re = new RegExp(`(^|\\n)\\s*${selector.replace('.', '\\.')}\\s*\\{`, 'g')
  const m = re.exec(css)
  if (!m) throw new Error(`rule ${selector} not found in index.css`)
  let i = m.index + m[0].length
  let depth = 1
  const start = i
  while (i < css.length && depth > 0) {
    if (css[i] === '{') depth++
    else if (css[i] === '}') depth--
    i++
  }
  return css.slice(start, i - 1)
}

function parseVars(body: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const m of body.matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+);/g)) out[m[1]] = m[2].trim()
  return out
}

let cache: Record<Mode, Record<string, string>> | undefined

/** Token name (without `--`) to raw value, for each mode. Dark inherits what
 *  `.dark` does not restate, exactly as the browser does. */
export function loadTokens(): Record<Mode, Record<string, string>> {
  if (cache) return cache
  const css = stripComments(readFileSync(CSS_PATH, 'utf8'))
  const grammar = stripComments(readFileSync(GRAMMAR_CSS_PATH, 'utf8'))
  const light = { ...parseVars(ruleBody(css, ':root')), ...parseVars(ruleBody(grammar, ':root')) }
  const dark = {
    ...light,
    ...parseVars(ruleBody(css, '.dark')),
    ...parseVars(ruleBody(grammar, '.dark')),
  }
  cache = { light, dark }
  return cache
}

export type Rgb = [number, number, number]

/** `H S% L%` (the Hub's channel format) to sRGB 0..255. */
export function hslChannelsToRgb(value: string): Rgb {
  const m = /^\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%\s*$/.exec(value)
  if (!m) throw new Error(`not an HSL channel triplet: "${value}"`)
  const h = Number(m[1]) / 360
  const s = Number(m[2]) / 100
  const l = Number(m[3]) / 100
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const f = (t: number) => {
    let x = t
    if (x < 0) x += 1
    if (x > 1) x -= 1
    if (x < 1 / 6) return p + (q - p) * 6 * x
    if (x < 1 / 2) return q
    if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6
    return p
  }
  return [f(h + 1 / 3), f(h), f(h - 1 / 3)].map((v) => Math.round(v * 255)) as Rgb
}

export function tokenRgb(mode: Mode, name: string): Rgb {
  const v = loadTokens()[mode][name]
  if (v === undefined) throw new Error(`token --${name} not defined (${mode})`)
  return hslChannelsToRgb(v)
}

export function luminance([r, g, b]: Rgb): number {
  const lin = (c: number) => {
    const x = c / 255
    return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

export function ratio(a: Rgb, b: Rgb): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

export function toHex([r, g, b]: Rgb): string {
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')
}

/** Contrast ratio of two named tokens in one mode. */
export function tokenRatio(mode: Mode, fg: string, bg: string): number {
  return ratio(tokenRgb(mode, fg), tokenRgb(mode, bg))
}
