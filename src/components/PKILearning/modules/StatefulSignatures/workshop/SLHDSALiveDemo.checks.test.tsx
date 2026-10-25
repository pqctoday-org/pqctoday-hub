// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The live demo is shared by the Stateful Hash Signatures module (workshop step 4),
 * the SLH-DSA module (steps 1-3) and the standalone Playground tool. Each host
 * gets its own intro and heading, the checks area keeps known-answer checks apart
 * from functional round trips, and the comparison table prints named parameter
 * sets with sizes from the RFC 8554 layouts and the CNSA 2.0 FAQ position.
 */
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom'
import { SLHDSALiveDemo } from './SLHDSALiveDemo'

vi.mock('@/hooks/useHSM', () => ({
  useHSM: () => ({
    isReady: true,
    initialize: vi.fn(),
    moduleRef: { current: {} },
    hSessionRef: { current: 1 },
    keys: [],
    log: [],
    registerKey: vi.fn(),
    clearLog: vi.fn(),
  }),
}))
vi.mock('@/components/shared/LiveHSMToggle', () => ({ LiveHSMToggle: () => null }))
vi.mock('@/components/shared/Pkcs11LogPanel', () => ({ Pkcs11LogPanel: () => null }))
vi.mock('@/components/shared/KatValidationPanel', () => ({
  KatValidationPanel: ({
    label,
    specs,
  }: {
    label: string
    specs: { id: string; kind: { type: string } }[]
  }) => (
    <div data-testid="kat-panel" data-specs={specs.map((s) => `${s.id}:${s.kind.type}`).join(',')}>
      {label}
    </div>
  ),
}))

const renderDemo = (context?: 'stateful' | 'slh-dsa' | 'standalone') =>
  render(
    <MemoryRouter>
      <SLHDSALiveDemo context={context} />
    </MemoryRouter>
  )

const panels = () =>
  screen.getAllByTestId('kat-panel').map((p) => [p.textContent, p.getAttribute('data-specs')])

describe('SLHDSALiveDemo: which page it is on', () => {
  it('in the Stateful module it points at Steps 1-3 of that module and adds the LMS checks', () => {
    renderDemo('stateful')
    expect(
      screen.getByText(/stateful LMS\/XMSS schemes from Steps 1–3 of this module/)
    ).toBeVisible()
    expect(
      screen.getByRole('heading', { name: 'Algorithm checks: LMS and SLH-DSA' })
    ).toBeInTheDocument()
    expect(panels()).toEqual([
      [
        'Known-answer checks: LMS (RFC 8554) and SHA-256',
        'stateful-lms-rfc8554-tc1:lms-sigver,stateful-lms-rfc8554-tc2:lms-sigver,stateful-hash-base:sha256-hash',
      ],
      [
        'Functional round trips (not known-answer tests)',
        'stateful-slhdsa-128s:slhdsa-functional,stateful-slhdsa-256s:slhdsa-functional',
      ],
    ])
    expect(screen.getByTestId('lms-acvp-sigver')).toBeInTheDocument()
    expect(screen.getByTestId('slhdsa-acvp-sigver')).toBeInTheDocument()
    expect(document.body.textContent).not.toContain('Known Answer Tests')
  })

  it.each(['slh-dsa', 'standalone'] as const)(
    'in %s it never mentions the Stateful module’s steps or its Known Answer Tests heading, and has no LMS panel',
    (context) => {
      renderDemo(context)
      expect(screen.getByRole('heading', { name: 'Algorithm checks: SLH-DSA' })).toBeInTheDocument()
      const text = document.body.textContent ?? ''
      expect(text).not.toMatch(/Steps\s*1–3/)
      expect(text).not.toContain('Stateful Signatures Known Answer Tests')
      expect(text).not.toContain('Known Answer Tests')
      expect(text).toContain('there is no leaf counter to protect')
      expect(panels()).toEqual([
        ['Known-answer check: SHA-256', 'stateful-hash-base:sha256-hash'],
        [
          'Functional round trips (not known-answer tests)',
          'stateful-slhdsa-128s:slhdsa-functional,stateful-slhdsa-256s:slhdsa-functional',
        ],
      ])
      expect(screen.queryByTestId('lms-acvp-sigver')).not.toBeInTheDocument()
      expect(screen.getByTestId('slhdsa-acvp-sigver')).toBeInTheDocument()
    }
  )

  it('the SLH-DSA module points at its own Step 4 for the comparison; the standalone tool does not', () => {
    const { unmount } = renderDemo('slh-dsa')
    expect(screen.getByText(/Step 4 of this module compares the three schemes/)).toBeVisible()
    unmount()
    renderDemo()
    expect(document.body.textContent).not.toContain('Step 4 of this module')
  })
})

describe('SLHDSALiveDemo: the size and CNSA comparison table', () => {
  const rowOf = (label: string) => {
    const cell = screen.getByRole('cell', { name: label })
    return within(cell.closest('tr') as HTMLElement)
      .getAllByRole('cell')
      .map((c) => c.textContent)
  }

  it('names the parameter sets and prints sizes from the RFC 8554 layouts', () => {
    renderDemo('stateful')
    expect(rowOf('Parameter set shown in the size rows')).toEqual([
      'Parameter set shown in the size rows',
      'LMS_SHA256_M24_H10 / LMOTS_SHA256_N24_W4',
      'SLH-DSA-SHA2-192s (category 3)',
      'ML-DSA-65 (category 3) and ML-DSA-87 (category 5)',
    ])
    // 4+4+16+24 and 12 + 24*(51+1) + 24*10; FIPS 205 Table 2 and FIPS 204 Table 2
    expect(rowOf('Public key')).toEqual([
      'Public key',
      '48 B',
      '48 B',
      '1,952 B (-65); 2,592 B (-87)',
    ])
    expect(rowOf('Signature')).toEqual([
      'Signature',
      '1,500 B',
      '16,224 B',
      '3,309 B (-65); 4,627 B (-87)',
    ])
    const text = document.body.textContent ?? ''
    // the old unsourced cells and the meaningless "Level 3" label for LMS are gone
    expect(text).not.toContain('Pub key (L3)')
    expect(text).not.toContain('Signature (L3)')
    expect(text).not.toMatch(/\b60 B\b/)
    expect(text).not.toContain('2,644 B')
    expect(text).toContain('assigns no NIST security category to LMS')
  })

  it('says ML-DSA-87 only for CNSA 2.0, not "Required", and SLH-DSA not approved', () => {
    renderDemo('stateful')
    const cnsa = rowOf('CNSA 2.0')
    expect(cnsa[1]).toMatch(/Single-tree LMS approved for firmware and software signing/)
    expect(cnsa[1]).toMatch(/SHA-256\/192 recommended/)
    // NSA CNSA 2.0 FAQ v2.2, p. 11: "The multi-tree algorithms HSS and XMSSMT are not allowed."
    expect(cnsa[1]).toMatch(/multi-tree HSS and XMSSMT not allowed/)
    expect(cnsa[2]).toBe('Not approved for any use in NSS')
    expect(cnsa[3]).toMatch(/^ML-DSA-87 only/)
    expect(cnsa.join(' ')).not.toMatch(/Required/)
  })
})
