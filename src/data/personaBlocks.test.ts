// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { PERSONA_BLOCKS } from './personaBlocks'
import { claimedPersonasFor } from './claimedPersonas'
import { splitLinkedText } from '@/utils/linkedText'
import { PERSONA_IDS } from '@/data/personaIds'
import { MANIFESTS } from '@/components/PKILearning/manifest/registry'
import { WORKSHOP_TOOLS } from '@/components/Playground/workshopRegistry'
import { BUSINESS_TOOLS } from '@/components/BusinessCenter/businessToolsRegistry'

const known = new Set([
  ...MANIFESTS.map((m) => `/learn/${m.id}`),
  ...WORKSHOP_TOOLS.filter((t) => !t.sandbox).map((t) => `/playground/${t.id}`),
  ...BUSINESS_TOOLS.map((t) => `/business/tools/${t.id}`),
])

describe('PERSONA_BLOCKS (round 9, wave 2)', () => {
  it('every route resolves and every persona listed is one the item claims', () => {
    for (const [route, blocks] of Object.entries(PERSONA_BLOCKS)) {
      expect(known.has(route), route).toBe(true)
      const claimed = new Set(claimedPersonasFor(route))
      for (const p of PERSONA_IDS) {
        if (blocks[p] === undefined) continue
        expect(claimed.has(p), `${route} lists ${p}, which it does not claim`).toBe(true)
        expect(blocks[p]!.length, `${route}/${p}`).toBeGreaterThanOrEqual(60)
        expect(blocks[p], `${route}/${p}`).toMatch(/[.!?]$/)
      }
    }
  })
  it('an item present here covers every persona it claims', () => {
    for (const [route, blocks] of Object.entries(PERSONA_BLOCKS)) {
      const missing = claimedPersonasFor(route).filter((p) => !blocks[p])
      expect(missing, route).toEqual([])
    }
  })
  it('claimedPersonasFor reads the registries', () => {
    expect(claimedPersonasFor('/playground/tee-channel')).toEqual(['architect', 'researcher'])
    expect(claimedPersonasFor('/business/tools/roi-calculator')).toEqual(['executive', 'grc'])
    expect(claimedPersonasFor('/learn/pqc-101').length).toBeGreaterThanOrEqual(5)
    expect(claimedPersonasFor('/nope')).toEqual([])
  })
})

describe('PERSONA_BLOCKS - certification engineer lab-test pointers', () => {
  it('Secure Boot opens with the pointer to "What the lab tests" and the SP 800-193 box', () => {
    const text = PERSONA_BLOCKS['/learn/secure-boot-pqc']!['cert-engineer']!
    expect(
      text.startsWith(
        "Start with 'What the lab tests', inside 'ML-DSA-65 for Firmware Signature Migration' on the Learn tab: it separates the verifier on the device (algorithm tests) from the signer that holds the private key (module rules), and the SP 800-193 box after it covers the integrity checks around the signature. "
      )
    ).toBe(true)
    // the earlier text follows the new first sentence
    expect(text).toContain('The UEFI PK, KEK and db hierarchy')
  })
  it('Stateful Hash Signatures opens with the pointer to the four kinds of check', () => {
    const text = PERSONA_BLOCKS['/learn/stateful-signatures']!['cert-engineer']!
    expect(
      text.startsWith(
        "Start with 'What the lab tests' on the Learn tab: a FIPS 140-3 certificate for a module that signs with LMS or XMSS rests on four kinds of check, and the algorithm tests are only the first. "
      )
    ).toBe(true)
    expect(text).toContain("Step 4 replays NIST's published LMS verification samples.")
  })
})

describe('PERSONA_BLOCKS - certification engineer pointers that name a place', () => {
  it('OpenSSL Studio says the Validation tab is on the Algorithms page, and links to it', () => {
    expect(PERSONA_BLOCKS['/playground/openssl-studio']!['cert-engineer']).toBe(
      "Lesson L5, An honest LMS, and the Explore tab's Query this build show what this OpenSSL build supports; it is educational and not FIPS-validated, so do not use it as evidence. For NIST known-answer samples use the [Validation tab on the Algorithms page](/algorithms?tab=validation)."
    )
  })
  it('every link written in a paragraph points inside the app', () => {
    for (const [route, blocks] of Object.entries(PERSONA_BLOCKS)) {
      for (const [persona, text] of Object.entries(blocks)) {
        // Whatever is left once the link syntax is parsed out must hold no half-written link.
        const plain = splitLinkedText(text as string)
          .map((part) => part.text)
          .join('')
        expect(plain, `${route}/${persona}`).not.toMatch(/\]\(|\[[^\]]*\]\(/)
        for (const part of splitLinkedText(text as string)) {
          if (part.to) expect(part.to, `${route}/${persona}`).toMatch(/^\/[a-z]/)
        }
      }
    }
  })
  it('SLH-DSA names the workshop step and the link that reaches Algorithm checks', () => {
    const text = PERSONA_BLOCKS['/learn/slh-dsa']!['cert-engineer']!
    expect(text).toContain(
      'run the NIST sigVer sample under Algorithm checks (in Workshop Step 1, use Go to Algorithm checks)'
    )
  })
})
