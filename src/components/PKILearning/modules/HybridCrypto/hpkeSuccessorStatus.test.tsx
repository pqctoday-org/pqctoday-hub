// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Pins the reader-facing HPKE status text: the RFC 9180 successor sentence and
 * its Library citation, the "RFC 9180 only" labels on the Auth and AuthPSK
 * modes, and that no text dates the successor to its RFC Editor queue entry.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import '@testing-library/jest-dom'

vi.mock('@/wasm/softhsm', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/wasm/softhsm')>()),
  getSoftHSMRustModule: vi.fn().mockRejectedValue(new Error('no engine in tests')),
}))

import { content } from './content'
import { HpkeWorkshop } from './workshop/HpkeWorkshop'

const SENTENCE =
  'The successor of RFC 9180, draft-ietf-hpke-hpke-06, removes the Auth and AuthPSK modes.'
const here = (f: string) => readFileSync(join(__dirname, f), 'utf8')
const flat = (s: string) => s.replace(/\s+/g, ' ')

describe('HybridCrypto: RFC 9180 successor and the Auth / AuthPSK modes', () => {
  it('cites the successor Library row and states the sentence verbatim in the module data', () => {
    const ids = content.standards.map((s) => s.id)
    expect(ids).toContain('draft-ietf-hpke-hpke-06')
    expect(ids).toContain('AWS-PQ-Readiness-Confidentiality')
    expect(JSON.stringify(content)).toContain(SENTENCE)
    expect(here('rag-summary.md')).toContain(SENTENCE)
  })

  it('dates the successor to 29 October 2026, never to a 3 November posting', () => {
    const files = [
      here('content.ts'),
      here('rag-summary.md'),
      here('components/HybridCryptoIntroduction.tsx'),
    ]
    for (const text of files) expect(flat(text)).not.toMatch(/posted on\s+3 November/)
    expect(flat(here('rag-summary.md'))).toContain('dated 29 October 2026')
  })

  it('labels exactly Auth and AuthPSK as RFC 9180 only in the workshop mode list', () => {
    // The mode list is not reachable in the unit tier (the default KEM is post-quantum and the
    // classical KEMs need an engine), so the option table is checked in the source.
    const src = here('workshop/HpkeWorkshop.tsx')
    expect(src).toContain("label: 'Auth (RFC 9180 only)'")
    expect(src).toContain("label: 'AuthPSK (RFC 9180 only)'")
    expect(src).toContain("label: 'Base' }")
    expect(src).toContain("label: 'PSK' }")
    expect(src).not.toMatch(/label: '(Base|PSK) \(RFC 9180 only\)'/)
  })

  it('renders the workshop with the post-quantum default, where the Auth modes are hidden', () => {
    render(<HpkeWorkshop />)
    expect(flat(document.body.textContent ?? '')).toContain('Auth/AuthPSK are hidden for this KEM')
  })
})
