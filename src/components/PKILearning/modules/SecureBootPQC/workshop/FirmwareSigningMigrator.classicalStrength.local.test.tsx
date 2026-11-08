// SPDX-License-Identifier: AGPL-3.0-only
import type { ComponentProps } from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { FirmwareSigningMigrator } from './FirmwareSigningMigrator'
import type { StepWizard } from '../../DigitalAssets/components/StepWizard'

const boundary = vi.hoisted(() => ({
  observe: false,
  forbidden: vi.fn(() => {
    throw new Error('Crypto, KAT and ACVP execution is outside this rendered-strength test')
  }),
}))

// Only presentation is observed: these are the controller's actual authored React nodes,
// selected through its real FilterDropdown. No crypto result or comparison row is mocked.
vi.mock('../../DigitalAssets/components/StepWizard', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../DigitalAssets/components/StepWizard')>()
  return {
    ...actual,
    StepWizard: (props: ComponentProps<typeof StepWizard>) =>
      boundary.observe ? (
        <>
          {props.steps[0].customControls}
          {props.steps[3].customControls}
        </>
      ) : (
        <actual.StepWizard {...props} />
      ),
  }
})
vi.mock('@/hooks/useHSM', () => ({
  useHSM: () => ({
    isReady: false,
    isLoading: false,
    moduleRef: { current: null },
    hSessionRef: { current: 0 },
    keys: [],
    log: [],
    clearLog: boundary.forbidden,
    clearKeys: boundary.forbidden,
    initialize: boundary.forbidden,
    removeKey: boundary.forbidden,
  }),
}))
vi.mock('@/components/shared/LiveHSMToggle', () => ({ LiveHSMToggle: () => null }))
vi.mock('@/components/shared/KatValidationPanel', () => ({ KatValidationPanel: () => null }))
vi.mock('@/components/shared/WasmModeIndicator', () => ({ WasmModeIndicator: () => null }))
vi.mock('@/wasm/softhsm', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/wasm/softhsm')>()
  return {
    ...actual,
    hsm_generateMLDSAKeyPair: boundary.forbidden,
    hsm_extractKeyValue: boundary.forbidden,
    hsm_digest: boundary.forbidden,
    hsm_sign: boundary.forbidden,
    hsm_verify: boundary.forbidden,
    hsm_generateRSAKeyPair: boundary.forbidden,
    hsm_rsaSign: boundary.forbidden,
    hsm_rsaVerify: boundary.forbidden,
    hsm_generateECKeyPair: boundary.forbidden,
    hsm_ecdsaSign: boundary.forbidden,
    hsm_ecdsaVerify: boundary.forbidden,
    hsm_generateSLHDSAKeyPair: boundary.forbidden,
    hsm_slhdsaSign: boundary.forbidden,
    hsm_slhdsaVerify: boundary.forbidden,
  }
})

beforeEach(() => {
  boundary.observe = false
  boundary.forbidden.mockClear()
  vi.stubGlobal('fetch', boundary.forbidden)
})
afterEach(() => {
  try {
    expect(boundary.forbidden).not.toHaveBeenCalled()
  } finally {
    vi.unstubAllGlobals()
  }
})
function comparison(bits: number) {
  const row = screen.getByRole('row', { name: /^Classical key estimate \/ PQC category/ })
  const cells = within(row).getAllByRole('cell')
  expect(cells[1]).toHaveTextContent(`~${bits}-bit key estimate`)
  expect(cells[2]).toHaveTextContent('NIST Level 3')
  expect(cells[3]).toHaveTextContent('Different measures')
  expect(screen.getByText(/The complete signature scheme also depends/)).toHaveTextContent(
    'selected hash and implementation'
  )
  expect(screen.getByText(/PQC categories are a different comparison measure/)).toHaveTextContent(
    'not bit-for-bit equivalents'
  )
  expect(
    screen.getByRole('link', { name: 'NIST SP 800-57 Part 1 Rev. 5, Table 2' })
  ).toHaveAttribute('href', 'https://doi.org/10.6028/NIST.SP.800-57pt1r5')
}

it('renders the ordinary initialStep3 comparison in the real wizard without performing crypto or KAT checks', () => {
  render(
    <MemoryRouter>
      <FirmwareSigningMigrator initialStep={3} />
    </MemoryRouter>
  )
  comparison(112)
})

it('renders each actual selector choice through the controller presentation boundary, not a universal112-bit row', () => {
  boundary.observe = true
  render(
    <MemoryRouter>
      <FirmwareSigningMigrator />
    </MemoryRouter>
  )
  let current = 'RSA-2048'
  for (const [profile, bits] of [
    ['RSA-2048', 112],
    ['RSA-3072', 128],
    ['ECDSA-P256', 128],
    ['ECDSA-P384', 192],
    ['RSA-2048', 112],
  ] as const) {
    fireEvent.click(screen.getByRole('button', { name: `${current}:` }))
    fireEvent.click(screen.getByRole('option', { name: profile }))
    current = profile
    expect(screen.getByText(`Migration Comparison: ${profile} → ML-DSA-65`)).toBeInTheDocument()
    comparison(bits)
  }
})
