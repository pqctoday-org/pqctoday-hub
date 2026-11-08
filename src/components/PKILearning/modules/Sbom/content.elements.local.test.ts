// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { content } from './content'

describe('SBOM minimum-elements narrative', () => {
  it('says the 2026 elements replace or rename several of the original seven', () => {
    const text = content.narratives?.elements ?? ''
    expect(text).toContain('replaces or renames several of those seven')
    expect(text).toContain('adding ten new required elements')
    expect(text).not.toContain('preserves those seven')
  })
})
