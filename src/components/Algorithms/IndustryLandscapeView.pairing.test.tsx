// SPDX-License-Identifier: GPL-3.0-only
//
// The per-kind classical → PQC pairing on the landscape tile and the
// Replaces / Replaced-by chips on the mechanism lens (2026-09-17, audit R1).
// Real data, not fixtures: the rows named here are the ones the audit found
// misleading, so if they are ever edited away the test should be revisited,
// not silently green.

import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { IndustryLandscapeView } from './IndustryLandscapeView'
import { loadIndustryLandscape } from '@/data/industryLandscapeData'

const { useCases } = loadIndustryLandscape()

function renderAt(search: string) {
  return render(
    <MemoryRouter initialEntries={[`/algorithms?tab=landscape${search}`]}>
      <IndustryLandscapeView />
    </MemoryRouter>
  )
}

describe('landscape tile — per-kind pairing', () => {
  it('a TLS row shows ML-KEM under Key exchange and an explicit gap under Signatures', () => {
    const uc = useCases.find((u) => u.useCaseId === 'cross-web-tls')!
    expect(uc.pqcMechanisms).toEqual(['ML-KEM'])
    renderAt(`&industry=${encodeURIComponent(uc.industry)}`)
    // Tiles carry data-use-case, not a role/label; the label text alone is
    // not unique across the page (the rollup repeats it), so scope by id.
    // eslint-disable-next-line testing-library/no-node-access
    const tile = document.querySelector(`[data-use-case="${uc.useCaseId}"]`) as HTMLElement
    expect(tile).not.toBeNull()
    const kex = within(tile).getByTestId('mechanism-pairing-key-exchange')
    expect(within(kex).getByText('ML-KEM')).toBeInTheDocument()
    expect(within(kex).getByText('ECDH')).toBeInTheDocument()
    const sig = within(tile).getByTestId('mechanism-pairing-signature')
    expect(within(sig).getByText('ECDSA')).toBeInTheDocument()
    expect(within(sig).getByText('RSA-sig')).toBeInTheDocument()
    expect(within(sig).queryByText('ML-KEM')).toBeNull()
    expect(within(sig).getByTestId('no-pqc-claim')).toBeInTheDocument()
  })

  it('a symmetric-only row shows the re-size note instead of an arrow', () => {
    const uc = useCases.find((u) => u.useCaseId === 'telco-air-interface')!
    renderAt(`&industry=${encodeURIComponent(uc.industry)}`)
    const row = screen.getAllByTestId('mechanism-pairing-symmetric')[0]
    expect(within(row).getByText('AES')).toBeInTheDocument()
    expect(within(row).getByText(/not replaced — re-sized/)).toBeInTheDocument()
    expect(within(row).queryByTestId('no-pqc-claim')).toBeNull()
  })

  it('every rendered row of every industry keeps KEMs out of the signature line', () => {
    for (const industry of new Set(useCases.map((u) => u.industry))) {
      const { unmount } = renderAt(`&industry=${encodeURIComponent(industry)}`)
      for (const sig of screen.queryAllByTestId('mechanism-pairing-signature')) {
        for (const kem of [
          'ML-KEM',
          'HQC',
          'FrodoKEM',
          'Classic-McEliece',
          'ECDH',
          'X25519',
          'RSA-kex',
        ]) {
          expect(within(sig).queryByText(kem), `${industry}: ${kem} on a signature line`).toBeNull()
        }
      }
      for (const kex of screen.queryAllByTestId('mechanism-pairing-key-exchange')) {
        for (const s of [
          'ML-DSA',
          'SLH-DSA',
          'FN-DSA',
          'LMS',
          'XMSS',
          'ECDSA',
          'RSA-sig',
          'EdDSA',
        ]) {
          expect(within(kex).queryByText(s), `${industry}: ${s} on a key-exchange line`).toBeNull()
        }
      }
      unmount()
    }
  })
})

describe('mechanism lens — replacement chips', () => {
  it('a classical signature family lists its PQC successors', () => {
    renderAt('&mechanism=ECDSA')
    const box = screen.getByTestId('lens-replacement')
    expect(within(box).getByText('Replaced by')).toBeInTheDocument()
    for (const f of ['ML-DSA', 'SLH-DSA', 'FN-DSA', 'LMS', 'XMSS']) {
      expect(within(box).getByText(f)).toBeInTheDocument()
    }
    expect(within(box).queryByText('ML-KEM')).toBeNull()
  })

  it('a PQC KEM lists the classical key-exchange families it replaces', () => {
    renderAt('&mechanism=ML-KEM')
    const box = screen.getByTestId('lens-replacement')
    expect(within(box).getByText('Replaces')).toBeInTheDocument()
    for (const f of ['ECDH', 'X25519', 'RSA-kex'])
      expect(within(box).getByText(f)).toBeInTheDocument()
    expect(within(box).queryByText('ECDSA')).toBeNull()
  })

  it('AES explains that it is re-sized, not replaced; BLS explains why nothing replaces it', () => {
    const view = renderAt('&mechanism=AES')
    expect(screen.getByTestId('lens-quantum-safe')).toHaveTextContent(/Grover/)
    view.unmount()
    renderAt('&mechanism=BLS')
    expect(screen.getByTestId('lens-no-replacement')).toHaveTextContent(
      /No standardised PQC successor/
    )
  })

  it('the pre-split ?mechanism=RSA deep link lands on RSA-sig', () => {
    renderAt('&mechanism=RSA')
    expect(screen.getByTestId('lens-replacement')).toBeInTheDocument()
    expect(screen.getAllByText('RSA-sig').length).toBeGreaterThan(0)
  })
})
