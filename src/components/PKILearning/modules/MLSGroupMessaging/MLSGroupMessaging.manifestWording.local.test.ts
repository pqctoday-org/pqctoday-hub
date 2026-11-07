// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import manifest from './manifest'

describe('MLS catalogue text: post-compromise security and key custody', () => {
  const text = [manifest.description, manifest.whyThisMatters].join(' ')

  it('makes post-compromise security conditional on a committed fresh leaf key', () => {
    expect(
      text.match(/once a committed fresh leaf key replaces the compromised one/g)
    ).toHaveLength(2)
    expect(manifest.description).toContain('and, conditionally, post-compromise security')
    expect(manifest.whyThisMatters).toContain('and, conditionally, post-compromise security')
  })

  it('describes the signature keys as token objects of a software token, not an HSM', () => {
    expect(manifest.description).toContain(
      'holds signature keys as token objects of a PKCS#11 module (a software token in this sample)'
    )
    expect(text).not.toMatch(/keeps signature keys in the HSM/)
  })
})
