// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import manifest from './manifest'

describe('secrets management description: Vault transit is a proposed design', () => {
  it('says Vault documents no ML-KEM transit key type', () => {
    expect(manifest.description).toContain(
      'simulate a proposed Vault transit design with ML-KEM (Vault documents no ML-KEM transit key type)'
    )
    expect(manifest.description).not.toContain('simulate Vault transit with ML-KEM')
  })
})
