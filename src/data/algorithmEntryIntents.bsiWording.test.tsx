// SPDX-License-Identifier: AGPL-3.0-only
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { EU_EXECUTIVE_INTENTS } from './algorithmEntryIntents'
import { NATIONAL_GUIDANCE_SOURCES } from '@/components/PKILearning/modules/CryptoMgmtModernization/components/MTINegotiator'

describe('BSI TR-02102-1 wording on signatures', () => {
  it('the EU card says hash-based signatures can in principle also be used alone, not that BSI allows them alone', () => {
    const bsi = EU_EXECUTIVE_INTENTS.find((i) => i.label === 'BSI (Germany)')
    expect(bsi?.description).toContain(
      'which it says can in principle also be used alone if implementation security is carefully considered'
    )
    expect(bsi?.description).not.toContain('which it allows alone')
  })

  it('the MTI negotiator cites section 5.3.4 and says ML-DSA goes with a classical signature', () => {
    expect(NATIONAL_GUIDANCE_SOURCES.bsi).toContain('section 5.3.4')
    expect(NATIONAL_GUIDANCE_SOURCES.bsi).not.toContain('5.7')
    expect(NATIONAL_GUIDANCE_SOURCES.bsi).toContain('only together with a classical signature')
    const source = fs.readFileSync(
      path.resolve(
        process.cwd(),
        'src/components/PKILearning/modules/CryptoMgmtModernization/components/MTINegotiator.tsx'
      ),
      'utf8'
    )
    expect(source).not.toMatch(/Standalone\. So the BSI half was correct/)
  })

  it('the hybrid lesson summary gives the hash-based exception for BSI too', () => {
    const rag = fs
      .readFileSync(
        path.resolve(
          process.cwd(),
          'src/components/PKILearning/modules/HybridCrypto/rag-summary.md'
        ),
        'utf8'
      )
      .replace(/\s+/g, ' ')
    expect(rag).toContain(
      'except hash-based signatures (SLH-DSA, XMSS, LMS), which it says can in principle also be used alone'
    )
  })
})
