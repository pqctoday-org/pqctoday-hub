// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { content } from './content'

describe('SBOM minimum-elements narrative', () => {
  it('distinguishes 2021 component fields from SBOM-level metadata', () => {
    const text = content.narratives?.elements ?? ''
    expect(text).toContain('replaces or renames several of the 2021 elements')
    expect(text).toContain('the first five as component fields')
    expect(text).toContain('Author of SBOM Data and Timestamp describe the SBOM itself')
    expect(text).not.toContain('seven required fields per component')
  })

  it('states procurement and EU CRA scope without a blanket US vendor mandate', () => {
    const regulation = content.narratives?.regulation ?? ''
    expect(regulation).toContain('may require an SBOM in solicitations')
    expect(regulation).toContain('not a blanket rule')
    expect(regulation).toContain('at least top-level dependencies')
  })

  it('does not claim VEX proves exploitability', () => {
    const vex = content.narratives?.vex ?? ''
    expect(vex).toContain('not proof by itself')
    expect(vex).toContain('known affected, known not affected, fixed, or under investigation')
  })
})
