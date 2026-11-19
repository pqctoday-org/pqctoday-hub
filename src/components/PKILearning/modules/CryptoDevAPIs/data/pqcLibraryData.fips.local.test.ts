// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { PQC_LIBRARIES } from './pqcLibraryData'

describe('Bouncy Castle FIPS status claims', () => {
  it('separates the active certificate scope from roadmap algorithms', () => {
    const library = PQC_LIBRARIES.find((entry) => entry.id === 'bouncy-castle-pqc')

    expect(library).toBeDefined()
    expect(library?.fipsDetails).toContain('active, interim FIPS 140-3 Level 1 validation')
    expect(library?.fipsDetails).toContain('2.1.1 module')
    expect(library?.fipsDetails).toContain('LMS signature verification only')
    expect(library?.fipsDetails).toContain('2.1.3 as a patch release going into submission')
    expect(library?.fipsDetails).toContain('2.2.0 Java FIPS stream')
    expect(library?.fipsDetails).toContain('Roadmap status does not mean FIPS validation')
    expect(library?.fipsEvidenceUrl).toBe(
      'https://csrc.nist.gov/projects/cryptographic-module-validation-program/certificate/4943'
    )
    expect(library?.fipsRoadmapUrl).toBe(
      'https://www.bouncycastle.org/download/bouncy-castle-java-fips/roadmap/'
    )
  })
})
