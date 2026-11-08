// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  CONTRACT_DEMO_FILL,
  CONTRACT_SECTIONS,
  renderContractPreview as buildPreview,
} from './ContractClauseGenerator'
import {
  CNSA_ACQUISITION_LABEL,
  CNSA_MANDATE_LABEL,
  CNSA_PHASE_OUT_LABEL,
} from '../../PQCRiskManagement/data/cnsaLabels'

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

describe('Contract clauses: deadline options use the shared CNSA 2.0 dates', () => {
  const options = () => {
    const field = CONTRACT_SECTIONS.find((s) => s.id === 'pqc-timeline')!.fields.find(
      (f) => f.id === 'deadline-year'
    )!
    return Object.fromEntries((field.options ?? []).map((o) => [o.value, o.label]))
  }

  it('words 2027, 2030 and 2031 with the same labels as the risk-management module', () => {
    const o = options()
    expect(o['2027']).toBe(`2027 — ${CNSA_ACQUISITION_LABEL}`)
    expect(o['2030']).toBe(`2030 — ${CNSA_PHASE_OUT_LABEL}`)
    expect(o['2031']).toBe(`2031 — ${CNSA_MANDATE_LABEL}`)
  })

  it('marks the 2025 option as the older NSA category guidance', () => {
    expect(options()['2025']).toBe(
      '2025 — NSA 2022 category guidance (older schedule): prefer CNSA 2.0 for new software and firmware signing'
    )
  })

  it('no longer carries the earlier deadline wording', () => {
    const labels = Object.values(options()).join('\n')
    expect(labels).not.toContain('CNSA 2.0 software/firmware preferred (NSS)')
    expect(labels).not.toContain('signing & traditional networking exclusive')
    expect(labels).not.toContain('(FAQ version 2.2)')
  })
})
