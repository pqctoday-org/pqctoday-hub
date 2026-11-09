// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The SEV-SNP overhead is a workload-dependent range from a measurement study, not a fixed "~2-5%".
 * Source: Misono et al., "Confidential VMs Explained", SIGMETRICS 2025 (PACMMCS 8(3), Dec 2024):
 * Phoronix memory suite 7.29% (SEV-SNP) / 4.06% (TDX); TensorFlow BERT, large VM, 16% / 18%.
 */
import { describe, it, expect } from 'vitest'
import { TEE_ARCHITECTURES } from './teeArchitectureData'

describe('SEV-SNP performance overhead', () => {
  const snp = TEE_ARCHITECTURES.find((t) => t.id === 'amd-sev-snp')
  const line = snp?.limitations.find((l) => /overhead/i.test(l)) ?? ''

  it('no longer states the unsourced fixed "~2-5%" figure', () => {
    expect(snp).toBeDefined()
    expect(line).not.toMatch(/2-5%/)
  })

  it('states the overhead depends on the workload and cites the study figures', () => {
    expect(line).toMatch(/depends on the workload/i)
    expect(line).toMatch(/7\.29%/)
    expect(line).toMatch(/16%/)
    expect(line).toMatch(/Two data points/)
    expect(line).toMatch(/slower still/)
    expect(line).toMatch(/41% longer on SEV-SNP \(73% on TDX\)/)
    expect(line).toMatch(/Misono/)
    expect(line).toMatch(/SIGMETRICS 2025/)
  })
})
