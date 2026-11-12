// SPDX-License-Identifier: AGPL-3.0-only
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { ComplianceDetailPopover } from './ComplianceDetailPopover'
import { fetchStaticComplianceData } from './complianceDataLoader'
import { MobileComplianceView } from '../Mobile/screens/MobileComplianceView'
import type { ComplianceRecord } from './types'
vi.mock('../ui/AskAssistantButton', () => ({ AskAssistantButton: () => null }))
vi.mock('../ui/EndorseButton', () => ({ EndorseButton: () => null }))
vi.mock('../ui/FlagButton', () => ({ FlagButton: () => null }))
const published = JSON.parse(
  readFileSync(resolve('public/data/compliance-data.json'), 'utf8')
) as ComplianceRecord[]
// Independent expected operation bounds from each named ST table, not standards identifiers.
const cases = [
  [
    'anssi-cc-2024-28',
    'RSA (key generation 1024–3072 bits in 32-bit steps; operation-specific ST limits), ECDSA (P-256, P-384, P-521), ECDH',
  ],
  [
    'anssi-cc-2024-33',
    'RSA (key generation 1024–3072 bits in 32-bit steps; ST configuration minimum 2048 bits through 2030), ECDSA, ECDH',
  ],
  [
    'anssi-cc-2025-20',
    'RSA (1024/2048-bit named operations; ST configuration minimum 2048 bits through 2030), ECDSA, ECDH',
  ],
  [
    'anssi-cc-2024-38',
    'RSA (2048, 3072, 4096), ECDSA (P-256, P-384, P-521), EdDSA (448), X448, ECDH',
  ],
  [
    'anssi-cc-2025-26',
    'RSA (public modulus 829–4096 bits, private modulus 829–4096 bits), EdDSA (448, 25519), X25519, X448, ECDSA, ECDH',
  ],
  [
    'enisa-eucc-eucc-eucc-3087-2026-0000000001-00000',
    'RSA (key generation, encryption and signature up to 4224 bits; optional Crypto Suite), EdDSA (448, 25519), X25519, X448, ECDSA, ECDH',
  ],
  [
    'cc-information-security-corporation-certagent-dhuma-v8-0-patch-level-0-2-f5faacf1',
    'RSA (key-generation SFR 2048-bit or greater; 3072-bit evaluated profile; 4096-bit and larger supported but not tested in evaluated configuration), ECDSA (P-256, P-384, P-521), ECDH (P-256, P-384, P-521)',
  ],
  ['anssi-cc-2019-62', 'RSA (up to 4096 bits), ECDSA, ECDH'],
  [
    'anssi-cc-2022-42',
    'RSA (public modulus 829–4096 bits, private modulus 829–4096 bits), EdDSA (25519), X25519, ECDSA, ECDH',
  ],
  [
    'anssi-cc-2022-50',
    'RSA (public modulus 829–4096 bits, private modulus 829–4096 bits), EdDSA (25519), X25519, ECDSA, ECDH',
  ],
] as const
const affectedIds = [
  'enisa-eucc-eucc-eucc-3087-2026-0000000001-00000',
  'anssi-cc-2025-26',
  'anssi-cc-2025-27',
  'cc-cryptographic-library-neslib-pqml-2-1-on-st33k1m5a-and-st33k1m5m-b04---b01--eucc-3090-2026-67--d48727ec',
  'cc-cryptographic-library-neslib-pqml-2-1-on-st33k1m5c-and-st33k1m5t-c03---a01--eucc-3090-2026-66--1d4a9254',
  'cc-cryptographic-library-neslib-6-11-3-on-st31r480--a02---eucc-3090-2026-56--669b6589',
  'cc-cryptographic-library-neslib-6-11-3-on-st31r480--b02---eucc-3090-2026-57--ae66da31',
  'cc-cryptographic-library-neslib-6-11-3-on-st31n600-a04-version-6-11-3--eucc-3090-2026-25--4f72d576',
  'cc-cryptographic-library-neslib-6-11-6-and-neslib-pqml-1-0-3-on-st33k1m5a-and-st33k1m5m-b04version---6-11-6---1-0-3---b04--eucc-3090-2026-19--af664fa0',
  'cc-cryptographic-library-neslib-6-11-6-and-neslib-pqml-1-0-3-on-st33k1m5c-and-st33k1m5t-c03-version---6-11-6---1-0-3---c03--eucc-3090-2026-18--ef5bc46c',
  'cc-cryptographic-library-neslib-6-11-6-on-st33k1m5a-and-st33k1m5m-b04-version---6-11-6---b04--eucc-3090-2026-17--b3958173',
  'cc-cryptographic-library-neslib-6-11-6-on-st33k1m5c-and-st33k1m5t-c03-version---6-11-6---c03--eucc-3090-2026-16--0be153ac',
  'cc-ifx-cci-00007ah-8fh-a11--r11--m11-with-optional-crypto-suite-4873ba58',
  'cc-cryptographic-library-neslib-6-11-3-on-st31r480-a01--version-6-11-3--anssi-cc-2025-26--c230def0',
  'cc-cryptographic-library-neslib-6-11-3-on-st31r480-b01--version-6-11-3---anssi-cc-2025-27--d933eb9c',
  'cc-information-security-corporation-certagent-dhuma-v8-0-patch-level-0-2-f5faacf1',
  'enisa-eucc-eucc-eucc-3110-2026-2500076-01-00000',
  'enisa-eucc-eucc-eucc-3110-2026-2500077-01-00000',
  'anssi-cc-2024-38',
  'anssi-cc-2024-28',
  'anssi-cc-2024-33',
  'anssi-cc-2025-19',
  'anssi-cc-2025-20',
  'cc-cryptographic-library-neslib-6-7-4-on-st31p450-a07--version-6-7-4---anssi-cc-2022-50-r02--1bf2669f',
  'cc-cryptographic-library-neslib-6-7-4-on-st31n600-a03--version-6-7-4---anssi-cc-2022-42-r02--1ab8f8c8',
  'anssi-cc-2019-62',
  'anssi-cc-2022-42',
  'anssi-cc-2022-50',
] as const
async function load() {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: true, json: async () => structuredClone(published) })
  )
  return fetchStaticComplianceData()
}
afterEach(() => {
  vi.unstubAllGlobals()
})
describe('Own-ST classical parameters through the published loader and real consumers', () => {
  it('repairs every original affected location without standards numbers or malformed curve grouping', async () => {
    const records = await load()
    expect(affectedIds).toHaveLength(28)
    for (const id of affectedIds) {
      const matches = records.filter((r) => r.id === id)
      expect(matches, id).toHaveLength(1)
      const claim = matches[0].classicalAlgorithms!
      expect(claim, id).not.toMatch(
        /RSA \(9796|RSA \(158|RSA \(120|RSA \(4015|X25519 \(448|X25519 \(25519/
      )
      expect(claim.match(/\(/g)?.length ?? 0, id).toBe(claim.match(/\)/g)?.length ?? 0)
    }
    const initial = records.find((r) => r.id === 'anssi-cc-2019-62')!
    expect(initial.date).toBe('2019-12-24')
    expect(initial.status).toBe('Archived')
    expect(initial.link).toBe(
      'https://messervices.cyber.gouv.fr/visas/ANSSI-CC-2019-62-rapport.pdf'
    )
    for (const id of ['anssi-cc-2022-42', 'anssi-cc-2022-50']) {
      expect(records.find((r) => r.id === id)?.date).toBe('2022-12-23')
      expect(records.find((r) => r.id === id)?.status).toBe('Active')
    }
  })
  it('phone current filter excludes the archived initial certificate and historical filter recovers it', async () => {
    const record = (await load()).find((r) => r.id === 'anssi-cc-2019-62')!
    render(
      <MemoryRouter initialEntries={['/compliance?tab=records']}>
        <MobileComplianceView records={[record]} recordsLoaded />
      </MemoryRouter>
    )
    expect(screen.getByText('No records match.')).toBeVisible()
    expect(screen.queryByText(record.productName!)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Include historical' }))
    expect(await screen.findByText(record.productName!)).toBeVisible()
  })
  it.each(cases)(
    '%s preserves positive operation and configuration scope through the loader',
    async (id, value) => {
      const record = (await load()).find((r) => r.id === id)!
      expect(record.classicalAlgorithms).toBe(value)
      expect(value).not.toMatch(
        /RSA \(9796|RSA \(158|RSA \(120|RSA \(4015|X25519 \(448|X25519 \(25519/
      )
    }
  )
  for (const viewport of ['desktop', 'phone'] as const) {
    it.each(cases)(
      `${viewport}: %s renders the full supported claim without dropping its limits`,
      async (id, value) => {
        const record = (await load()).find((r) => r.id === id)!
        render(
          <MemoryRouter initialEntries={[`/compliance?tab=records&rstatus=all&cert=${id}`]}>
            {viewport === 'desktop' ? (
              <ComplianceDetailPopover isOpen onClose={() => {}} record={record} />
            ) : (
              <MobileComplianceView records={[record]} recordsLoaded />
            )}
          </MemoryRouter>
        )
        const detail =
          viewport === 'desktop'
            ? screen.getByRole('dialog')
            : screen.getByTestId('compliance-record-detail-sheet')
        expect(within(detail).getByText(value, { exact: true })).toBeVisible()
        expect(
          within(detail)
            .getAllByRole('link')
            .some((a) => (a as HTMLAnchorElement).href === record.link)
        ).toBe(true)
      }
    )
  }
})
