// SPDX-License-Identifier: AGPL-3.0-only
import { expect, it } from 'vitest'
import { SIGNATURE_OVERHEADS } from '@/components/PKILearning/modules/AutomotivePQC/data/otaOrchestrationData'
import { ALGORITHM_THROUGHPUT } from '@/components/PKILearning/modules/AutomotivePQC/data/sensorFusionData'
import { HSS_L1_SHA256_H10_W4 } from './rfc8554ObjectSizes'
import { FIPS_OBJECT_SIZES } from './fipsObjectSizes'
for (const [name, rows] of [
  ['OTA', SIGNATURE_OVERHEADS],
  ['sensor', ALGORITHM_THROUGHPUT],
] as const) {
  it(`${name} consistently encodes HSS L=1 objects`, () => {
    const entry = rows.find((row) => row.algorithm.includes('H10/W4'))
    expect(entry).toBeDefined()
    expect(entry?.publicKeyBytes).toBe(HSS_L1_SHA256_H10_W4.publicKeyBytes)
    expect(entry?.signatureBytes).toBe(HSS_L1_SHA256_H10_W4.signatureBytes)
  })
  it(`${name} uses FIPS raw ML-DSA sizes`, () => {
    for (const algorithm of ['ML-DSA-44', 'ML-DSA-65'] as const) {
      const row = rows.find((row) => row.algorithm === algorithm)
      expect(row).toBeDefined()
      expect(row?.publicKeyBytes).toBe(FIPS_OBJECT_SIZES[algorithm].publicKeyBytes)
      expect(row?.signatureBytes).toBe(FIPS_OBJECT_SIZES[algorithm].signatureOrCiphertextBytes)
    }
  })
}
