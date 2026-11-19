// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import curiousSummary from '../curious-summary.md?raw'
import ragSummary from '../rag-summary.md?raw'
import apiData from './apiData.ts?raw'
import introduction from '../components/CryptoDevAPIsIntroduction.tsx?raw'
import { content } from '../content'
import { getRuntimeSupport, PQC_SUPPORT_MATRIX } from './pqcSupportData'
import { getStandard } from '@/data/standardsRegistry'

describe('Crypto Developer APIs support labels reflect platform API scope', () => {
  it('.NET 10 ML-DSA is marked experimental while ML-KEM maturity stays separate', () => {
    expect(getRuntimeSupport('dotnet', 'ML-DSA').status).toBe('experimental')
    expect(getRuntimeSupport('dotnet', 'ML-DSA').evidenceUrl).toContain('/dotnet-10/libraries')
    expect(getRuntimeSupport('dotnet', 'ML-KEM').status).toBe('stable')
    expect(ragSummary).toContain(
      'Microsoft marks `MLDsa`, `SlhDsa`, and `CompositeMLDsa` `[Experimental]`'
    )
  })

  it('Windows BCRYPT primitive notes do not promise key storage, certificate, TLS, or FIPS support', () => {
    for (const algorithm of ['ML-KEM', 'ML-DSA'] as const) {
      const row = getRuntimeSupport('windows-cng', algorithm)
      expect(row.minVersion).toContain('Windows 11 24H2')
      expect(row.minVersion).toContain('desktop apps')
      expect(row.backend).toContain('does not establish NCrypt/KSP persisted-key support')
    }
    expect(apiData).toContain(
      'does not establish NCrypt/KSP persisted-key, certificate, or Schannel TLS support'
    )
    expect(introduction).toContain('Do not infer FIPS validation from an algorithm identifier')
    expect(curiousSummary).not.toContain('generally available since November 2025')
    expect(curiousSummary).toContain(
      'primitive, key-storage, certificate, and TLS support separate'
    )
  })

  it('current Java and Bouncy Castle release claims have direct primary references', () => {
    expect(content.standards.slice(0, 3).map((s) => s.id)).toEqual([
      'Oracle-JDK-21-Consolidated-Release-Notes',
      'Oracle-Java-SE-Latest-Releases',
      'BouncyCastle-Java-1-87-Release',
    ])
    expect(getStandard('BouncyCastle-Java-1-87-Release').deepLink).toContain('/library?ref=')
    expect(
      PQC_SUPPORT_MATRIX.find((x) => x.apiId === 'bouncy-castle' && x.algorithmId === 'mceliece')
    ).toMatchObject({ status: 'deprecated' })
    expect(ragSummary).toContain('1.87 (11 November 2026)')
    expect(ragSummary).toContain('no longer believed safe to use')
    expect(ragSummary).not.toContain('best production choice for JVM/CLR')
  })
})
