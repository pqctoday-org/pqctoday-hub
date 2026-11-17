// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import manifest from './manifest'

describe('secrets management description: distinguish service and application capabilities', () => {
  it('describes the separate executable application envelope', () => {
    expect(manifest.description).toContain(
      'compare Vault transit operations with an executable application-side ML-KEM envelope'
    )
    expect(manifest.description).not.toContain('simulate Vault transit with ML-KEM')
  })
})
