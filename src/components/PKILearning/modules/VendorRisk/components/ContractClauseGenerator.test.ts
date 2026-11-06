// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  CONTRACT_DEMO_FILL,
  CONTRACT_SECTIONS,
  renderContractPreview as buildPreview,
} from './ContractClauseGenerator'

describe('Contract clauses: a CBOM is a supplier inventory, not independent verification', () => {
  it('the CBOM clause no longer calls a CBOM the only way to verify without self-attestation', () => {
    const cbom = CONTRACT_SECTIONS.find((s) => s.id === 'cbom-delivery')!
    expect(cbom.description).not.toMatch(/only way to verify/)
    expect(cbom.description).toMatch(/supports component visibility/)
    expect(cbom.description).toMatch(/still self-attestation/)
    expect(cbom.description).toMatch(/independent testing, validation records and change evidence/)
  })

  it('preview and export keep supplier inventory apart from testing, validation and delivery evidence', () => {
    const md = buildPreview(CONTRACT_DEMO_FILL)
    expect(md).toMatch(/\*\*3\.3 Verification:\*\* The CBOM is the Vendor's own inventory/)
    expect(md).toMatch(/not, by itself, independent verification/)
    expect(md).toMatch(/CMVP certificates and CAVP algorithm validations/)
    expect(md).toMatch(/change and delivery evidence for the same release/)
  })
})
