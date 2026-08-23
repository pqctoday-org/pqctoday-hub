// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { decodeJsxEntities } from './jsxEntities'

describe('decodeJsxEntities', () => {
  it('still decodes what the 14-entry allowlist covered', () => {
    expect(decodeJsxEntities('a&nbsp;b&mdash;c&hellip;')).toBe('a b—c…')
    expect(decodeJsxEntities('&lt;tag&gt; &amp; &quot;q&quot; &apos;a&apos;')).toBe(
      '<tag> & "q" \'a\''
    )
    expect(decodeJsxEntities('&rarr;&larr;&times;&ndash;')).toBe('→←×–')
  })

  // The ones it did NOT — 553 instances across 46 of 65 modules on 2026-08-22.
  it.each([
    ['&ldquo;quoted&rdquo;', '“quoted”'],
    ['&bull; item', '• item'],
    ['it&rsquo;s', 'it’s'],
    ['&darr; down', '↓ down'],
    ['a &middot; b', 'a · b'],
    ['&minus;20', '−20'],
    ['&sect;4', '§4'],
    ['&alpha;|0&rang; + &beta;|1&rang;', 'α|0⟩ + β|1⟩'],
    ['&#123;x&#125;', '{x}'],
    ['&#10003; done', '✓ done'],
    ['&#8227; bullet', '‣ bullet'],
    ['&ensp;x', ' x'],
  ])('decodes %s', (raw, want) => {
    expect(decodeJsxEntities(raw)).toBe(want)
  })

  it('decodes once, so an escaped entity stays escaped', () => {
    // A page that literally shows the reader "&lt;" writes it as "&amp;lt;".
    expect(decodeJsxEntities('&amp;lt;')).toBe('&lt;')
  })

  it('leaves a bare ampersand run alone', () => {
    // Strict mode requires the semicolon. Without it, HTML5 legacy rules turn
    // "&notanentity" into "¬anentity" — corrupting more prose than it fixes.
    expect(decodeJsxEntities('AT&T and R&D')).toBe('AT&T and R&D')
    expect(decodeJsxEntities('&notanentity')).toBe('&notanentity')
  })

  it('is a no-op on text with no references', () => {
    expect(decodeJsxEntities('ML-KEM-768 is a KEM.')).toBe('ML-KEM-768 is a KEM.')
  })

  it('folds decoded space separators to a plain space', () => {
    // The exporter collapses whitespace before decoding, so a U+00A0 produced
    // here would reach the snapshot intact and split words the wrong way.
    for (const raw of ['a&nbsp;b', 'a&ensp;b', 'a&emsp;b', 'a&thinsp;b', 'a&#8239;b']) {
      expect(decodeJsxEntities(raw), raw).toBe('a b')
    }
    expect(/[\u00a0\u2000-\u200a]/.test(decodeJsxEntities('x&nbsp;y'))).toBe(false)
  })
})
