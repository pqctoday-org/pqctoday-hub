// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Step 7 component: labels and roles, provider and flow selection, the engine
 * controls, and the run result. The engine itself is covered by
 * services/cloudKmsExchange.local.test.ts; here the service is stubbed so the
 * test checks what the reader sees, not the cryptography.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'

const hsmStub = vi.hoisted(() => ({
  phase: 'session_open' as 'idle' | 'session_open',
  isReady: true,
  error: null as string | null,
  engine: 'rust' as 'cpp' | 'rust',
  setEngine: vi.fn(),
  moduleRef: { current: {} as object | null },
  slotRef: { current: 0 },
  hSessionRef: { current: 1 },
  keys: [] as unknown[],
  log: [] as unknown[],
  registerKey: vi.fn(),
  removeKey: vi.fn(),
  addStepLog: vi.fn(),
  clearKeys: vi.fn(),
  clearLog: vi.fn(),
  initialize: vi.fn(),
  finalize: vi.fn(),
}))
const support = vi.hoisted(() => ({ compKem: true }))

vi.mock('@/hooks/useHSM', () => ({ useHSM: () => hsmStub }))

const calls = vi.hoisted(() => ({ classical: 0, hpke: [] as unknown[] }))
vi.mock('../services/cloudKmsExchange', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/cloudKmsExchange')>()
  return {
    ...actual,
    v33Supported: vi.fn(() => support.compKem),
    runClassicalImport: vi.fn((_ctx: unknown, profile: { rsaBits: number }) => {
      calls.classical += 1
      return {
        profile: { ...profile, aesKeyBits: 256, oaepHash: 'sha256' },
        rsaKeyReused: false,
        rsaPartBytes: profile.rsaBits / 8,
        kwpPartBytes: 152,
        wrappedBytes: profile.rsaBits / 8 + 152,
        wrapped: new Uint8Array(1),
        sourceKey: new Uint8Array(32),
        importedKey: new Uint8Array(32),
        signatureVerified: true,
        matches: true,
        structureVerified: true,
      }
    }),
    runHpkeImport: vi.fn((_ctx: unknown, opts: unknown) => {
      calls.hpke.push(opts)
      const o = opts as {
        engine: 'v32' | 'v33' | 'candidate'
        senderEngine?: 'v32' | 'v33' | 'candidate'
        suite: (typeof actual.HPKE_IMPORT_SUITES)[number]
      }
      return {
        suite: o.suite,
        engine: o.engine,
        senderEngine: o.senderEngine ?? o.engine,
        publicKeyBytes: 1216,
        encBytes: 1120,
        ctBytes: 48,
        wireBytes: 1168,
        overheadBytes: 16,
        enc: new Uint8Array(1),
        ct: new Uint8Array(1),
        wire: new Uint8Array(1),
        sourceKcv: 'aabbcc',
        importedKcv: 'aabbcc',
        matches: true,
        keygenMechanisms: ['stub keygen'],
        sealMechanisms: ['stub seal'],
        openMechanisms: ['stub open'],
        note: actual.hpkeEngineNote(o.engine, o.suite),
      }
    }),
  }
})

import { CloudKmsKeyExchange } from './CloudKmsKeyExchange'

const renderStep = () =>
  render(
    <MemoryRouter>
      <CloudKmsKeyExchange />
    </MemoryRouter>
  )

describe('CloudKmsKeyExchange', () => {
  beforeEach(() => {
    hsmStub.phase = 'session_open'
    hsmStub.isReady = true
    hsmStub.engine = 'rust'
    support.compKem = true
    calls.classical = 0
    calls.hpke = []
    hsmStub.addStepLog.mockClear()
  })

  it('says plainly, up front and as a note, that it is a simulation with no cloud call', () => {
    renderStep()
    const note = screen.getByRole('note', { name: 'Simulation notice' })
    expect(note).toHaveTextContent(/Simulation\./)
    expect(note).toHaveTextContent(/No cloud account, no network call/)
    expect(
      screen.getByRole('heading', { name: 'Exchanging keys with a cloud KMS' })
    ).toBeInTheDocument()
  })

  it('offers the three providers as a labelled radio group, AWS first', () => {
    renderStep()
    const group = screen.getByRole('group', { name: 'Provider' })
    const radios = within(group).getAllByRole('radio')
    expect(radios.map((r) => r.getAttribute('value'))).toEqual(['aws', 'gcp', 'azure'])
    expect(screen.getByRole('radio', { name: /AWS KMS/ })).toBeChecked()
  })

  it('shows the AWS flows and the AWS statements, each with its source id', () => {
    renderStep()
    const flows = within(screen.getByRole('group', { name: 'Flow' })).getAllByRole('radio')
    expect(flows.map((r) => r.closest('label')?.textContent?.trim())).toEqual([
      'Classical import',
      'HPKE (candidate)',
      'ML-KEM key establishment',
      'Hybrid in the application',
    ])
    expect(
      screen.getByText(/AWS KMS imports key material under an RSA wrapping key/)
    ).toBeInTheDocument()
    expect(screen.queryByText(/Google Cloud KMS quantum-safe key import/)).not.toBeInTheDocument()
    expect(screen.getAllByText(/Source:/).length).toBeGreaterThan(0)
  })

  it('switching provider swaps the flows and the statements', async () => {
    const user = userEvent.setup()
    renderStep()
    await user.click(screen.getByRole('radio', { name: /Google Cloud KMS/ }))
    const flows = within(screen.getByRole('group', { name: 'Flow' })).getAllByRole('radio')
    expect(flows).toHaveLength(2)
    expect(screen.getByText(/Google Cloud KMS quantum-safe key import/)).toBeInTheDocument()
    expect(screen.queryByText(/AWS KMS imports key material only/)).not.toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /Google Cloud KMS: import with an RSA import job/ })
    ).toBeInTheDocument()
  })

  it('the HPKE controls (suite, engine) appear only for an HPKE flow', async () => {
    const user = userEvent.setup()
    renderStep()
    expect(screen.queryByRole('group', { name: /PKCS#11 engine/ })).not.toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: 'HPKE (candidate)' }))
    expect(screen.getByRole('group', { name: /HPKE suite/ })).toBeInTheDocument()
    const engines = within(screen.getByRole('group', { name: 'PKCS#11 engine' })).getAllByRole(
      'radio'
    )
    expect(engines.map((r) => r.getAttribute('value'))).toEqual(['v32', 'v33', 'candidate'])
    // The candidate label is honest about what it is.
    expect(screen.getAllByText(/Not offered by this provider/).length).toBeGreaterThan(0)
  })

  it('labels the candidate mechanism as not allocated by OASIS and v3.3 as a draft', async () => {
    const user = userEvent.setup()
    renderStep()
    await user.click(screen.getByRole('radio', { name: 'HPKE (candidate)' }))
    await user.click(screen.getByRole('radio', { name: /PQCToday candidate CKM_HPKE/ }))
    expect(
      screen.getByText(/not allocated by OASIS and is in neither PKCS#11 v3\.2 nor the v3\.3 draft/)
    ).toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: /v3\.3 draft/ }))
    expect(
      screen.getByText(/defines CKM_COMP_KEM, a composite KEM, and no HPKE mechanism/)
    ).toBeInTheDocument()
    expect(screen.getByText(/It is a draft and can still change/)).toBeInTheDocument()
  })

  it('says that pure ML-KEM is the same mechanism under v3.3', async () => {
    const user = userEvent.setup()
    renderStep()
    await user.click(screen.getByRole('radio', { name: 'HPKE (candidate)' }))
    await user.click(screen.getByRole('radio', { name: /^ML-KEM-768/ }))
    await user.click(screen.getByRole('radio', { name: /v3\.3 draft/ }))
    expect(screen.getByText(/identical to the v3\.2 run/)).toBeInTheDocument()
  })

  it('every step names the actor, the call, and where the key sits', () => {
    renderStep()
    const steps = Array.from(screen.getByRole('list', { name: /steps/ }).children)
    expect(steps).toHaveLength(4)
    for (const li of steps) {
      expect(li).toHaveTextContent(/Step \d of 4/)
      expect(li).toHaveTextContent(/Where the key sits/)
      expect(li).toHaveTextContent(/Quantum-safe:/)
    }
    expect(steps[2]).toHaveTextContent('CKM_RSA_AES_KEY_WRAP')
    expect(steps[2]).toHaveTextContent('Quantum-safe: no')
  })

  it('runs the classical flow and shows the measured sizes and the result', async () => {
    const user = userEvent.setup()
    renderStep()
    await user.click(screen.getByRole('button', { name: /Run simulation/ }))
    await waitFor(() => expect(calls.classical).toBe(1))
    expect(
      await screen.findByText(/Wrapped blob: 536 bytes = 384 bytes RSA-OAEP \+ 152 bytes AES-KWP/)
    ).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(/the imported key matches the original/)
    expect(hsmStub.addStepLog).toHaveBeenCalled()
  })

  it('runs an HPKE flow on the chosen engine and records the measured wire size', async () => {
    const user = userEvent.setup()
    renderStep()
    await user.click(screen.getByRole('radio', { name: 'HPKE (candidate)' }))
    await user.click(screen.getByRole('radio', { name: /PQCToday candidate CKM_HPKE/ }))
    await user.click(screen.getByRole('button', { name: /Run simulation/ }))
    await waitFor(() => expect(calls.hpke).toHaveLength(1))
    expect(calls.hpke[0]).toMatchObject({ engine: 'candidate', suite: { id: 'xwing' } })
    expect(await screen.findByText(/Sent: 1168 bytes/)).toBeInTheDocument()
    expect(screen.getByText(/1168 bytes sent \(enc/)).toBeInTheDocument()
  })

  it('offers the v3.2 interoperability check only when the engine is not already v3.2', async () => {
    const user = userEvent.setup()
    renderStep()
    await user.click(screen.getByRole('radio', { name: 'HPKE (candidate)' }))
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: /v3\.3 draft/ }))
    const box = screen.getByRole('checkbox', { name: /Interoperability check/ })
    await user.click(box)
    await user.click(screen.getByRole('button', { name: /Run simulation/ }))
    await waitFor(() => expect(calls.hpke).toHaveLength(1))
    expect(calls.hpke[0]).toMatchObject({ engine: 'v33', senderEngine: 'v32' })
  })

  it('refuses the v3.3 sequence, with the reason shown, when the engine lacks CKM_COMP_KEM', async () => {
    support.compKem = false
    const user = userEvent.setup()
    renderStep()
    await user.click(screen.getByRole('radio', { name: 'HPKE (candidate)' }))
    await user.click(screen.getByRole('radio', { name: /v3\.3 draft/ }))
    await user.click(screen.getByRole('button', { name: /Run simulation/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/Not in this engine yet/)
    expect(calls.hpke).toHaveLength(0)
    expect(screen.getByRole('button', { name: /Run simulation/ })).toBeDisabled()
  })

  it('disables Run, and says why in text, when the HSM is not enabled', () => {
    hsmStub.phase = 'idle'
    hsmStub.isReady = false
    renderStep()
    expect(screen.getByRole('button', { name: /Run simulation/ })).toBeDisabled()
    expect(screen.getByTestId('gate-reason')).toHaveTextContent(/Enable the HSM above/)
  })

  it('all controls can be reached and changed from the keyboard (native radios)', async () => {
    const user = userEvent.setup()
    renderStep()
    const aws = screen.getByRole('radio', { name: /AWS KMS/ })
    aws.focus()
    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('radio', { name: /Google Cloud KMS/ })).toBeChecked()
  })
})
