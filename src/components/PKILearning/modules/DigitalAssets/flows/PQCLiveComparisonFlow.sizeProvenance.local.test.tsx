// SPDX-License-Identifier: AGPL-3.0-only
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Button } from '@/components/ui/button'
import type { Step } from '../components/StepWizard'
import { PQCLiveComparisonFlow } from './PQCLiveComparisonFlow'

const mocks = vi.hoisted(() => ({
  execute: vi.fn(),
  hsm: {
    isReady: false,
    moduleRef: { current: null as object | null },
    hSessionRef: { current: 0 },
    keys: [],
    registerKey: vi.fn(),
    log: [],
    clearLog: vi.fn(),
    removeKey: vi.fn(),
  },
  generateEC: vi.fn(),
  generateML: vi.fn(),
  ecPoint: vi.fn(),
  mlPublic: vi.fn(),
  ecSign: vi.fn(),
  mlSign: vi.fn(),
  ecVerify: vi.fn(),
  mlVerify: vi.fn(),
}))
vi.mock('@/services/crypto/OpenSSLService', () => ({ openSSLService: { execute: mocks.execute } }))
vi.mock('@/hooks/useHSM', () => ({ useHSM: () => mocks.hsm }))
vi.mock('@/components/shared/LiveHSMToggle', () => ({ LiveHSMToggle: () => null }))
vi.mock('@/components/shared/Pkcs11LogPanel', () => ({ Pkcs11LogPanel: () => null }))
vi.mock('@/components/shared/HsmKeyInspector', () => ({ HsmKeyInspector: () => null }))
vi.mock('@/wasm/softhsm', () => ({
  hsm_generateECKeyPair: mocks.generateEC,
  hsm_generateMLDSAKeyPair: mocks.generateML,
  hsm_extractECPoint: mocks.ecPoint,
  hsm_extractKeyValue: mocks.mlPublic,
  hsm_ecdsaSign: mocks.ecSign,
  hsm_sign: mocks.mlSign,
  hsm_ecdsaVerify: mocks.ecVerify,
  hsm_verify: mocks.mlVerify,
}))
// Keep the real wizard hook and action/outcome gates; only simplify its presentational shell.
vi.mock('../components/StepWizard', () => ({
  StepWizard: (p: {
    steps: Step[]
    currentStepIndex: number
    onExecute: () => Promise<void>
    onNext: () => void
    onBack: () => void
    isExecuting: boolean
    isStepComplete: boolean
    output: string | null
    error: string | null
  }) => (
    <div>
      <h2>{p.steps[p.currentStepIndex].title}</h2>
      {p.steps[p.currentStepIndex].customControls}
      <Button disabled={p.isExecuting} onClick={p.onExecute}>
        Execute
      </Button>
      <Button disabled={!p.isStepComplete || p.isExecuting} onClick={p.onNext}>
        Next
      </Button>
      <Button onClick={p.onBack}>Back</Button>
      {p.error && <p role="alert">{p.error}</p>}
      <pre data-testid="trace">{p.output}</pre>
    </div>
  ),
}))

const softwareResult = (cmd: string) => {
  const name = /-out\s+(\S+)/.exec(cmd)?.[1]
  return {
    stdout: cmd.includes('-verify') ? 'Signature Verified Successfully' : '',
    error: undefined,
    files: name
      ? [
          {
            name,
            data: new Uint8Array(name.includes('sig_') ? 17 : name.includes('_pub_') ? 31 : 53),
          },
        ]
      : [],
  }
}
const readyHsm = () => {
  mocks.hsm.isReady = true
  mocks.hsm.moduleRef.current = {}
  mocks.hsm.hSessionRef.current = 7
}
const execute = async () => {
  fireEvent.click(screen.getByRole('button', { name: 'Execute' }))
  await waitFor(() => expect(screen.getByRole('button', { name: 'Execute' })).toBeEnabled())
}
const next = () => fireEvent.click(screen.getByRole('button', { name: 'Next' }))
const region = (name = 'Classical sample output') => within(screen.getByRole('region', { name }))

beforeEach(() => {
  vi.clearAllMocks()
  mocks.hsm.isReady = false
  mocks.hsm.moduleRef.current = null
  mocks.hsm.hSessionRef.current = 0
  mocks.execute.mockImplementation(async (cmd: string) => softwareResult(cmd))
  mocks.generateEC.mockReturnValue({ pubHandle: 11, privHandle: 12 })
  mocks.generateML.mockReturnValue({ pubHandle: 21, privHandle: 22 })
  mocks.ecPoint.mockReturnValue(new Uint8Array([0, 255, 2]))
  mocks.mlPublic.mockReturnValue(new Uint8Array([3, 4, 5, 6]))
  mocks.ecSign.mockReturnValue(new Uint8Array([0, 255]))
  mocks.mlSign.mockReturnValue(new Uint8Array([2, 3, 4]))
  mocks.ecVerify.mockReturnValue(true)
  mocks.mlVerify.mockReturnValue(true)
})

describe('sample comparison output origin and outcome gates', () => {
  it('measures returned PEM files and retains their recorded origin after provider changes', async () => {
    const view = render(<PQCLiveComparisonFlow onBack={vi.fn()} />)
    await execute()
    expect(region().getByText('Private PEM-file bytes')).toBeVisible()
    expect(region().getByText('53 B')).toBeVisible()
    expect(region().getByText('31 B')).toBeVisible()
    readyHsm()
    view.rerender(<PQCLiveComparisonFlow onBack={vi.fn()} />)
    expect(region().getByText('secp256k1')).toBeVisible()
    expect(region().getByText(/OpenSSL PEM-file output/)).toBeVisible()
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
  })

  it('records HSM P-256 attribute output, unmeasured resident private keys and separate stage inputs', async () => {
    readyHsm()
    render(<PQCLiveComparisonFlow onBack={vi.fn()} />)
    await execute()
    expect(mocks.generateEC).toHaveBeenCalledWith(
      mocks.hsm.moduleRef.current,
      7,
      'P-256',
      false,
      'sign'
    )
    expect(region().getByText('ECDSA P-256')).toBeVisible()
    expect(region().getByText('Resident; not measured here')).toBeVisible()
    expect(region().getByText('Public attribute-output bytes')).toBeVisible()
    expect(region().getByText('3 B')).toBeVisible()
    next()
    await execute()
    expect(region().getByText(/Recorded signing input: private handle 12/)).toBeVisible()
    next()
    await execute()
    expect(
      region().getByText(/Recorded check input: public handle 11; signature buffer 2 B/)
    ).toBeVisible()
    expect(region().getByText(/HSM sample check: Verified/)).toBeVisible()
    expect(screen.getByText(/No Bitcoin transaction or witness is serialized/)).toBeVisible()
    expect(mocks.execute).not.toHaveBeenCalled()
  })

  it.each(['missing-key', 'operation-error'])(
    'blocks %s without fabricated measurements and permits valid retry',
    async (failure) => {
      mocks.execute.mockResolvedValueOnce(
        failure === 'missing-key'
          ? { files: [], stdout: '' }
          : { files: [], stdout: '', error: 'sample failure' }
      )
      render(<PQCLiveComparisonFlow onBack={vi.fn()} />)
      await execute()
      expect(screen.getByRole('alert')).toBeVisible()
      expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
      expect(mocks.execute).toHaveBeenCalledTimes(1)
      expect(region().queryByText('53 B')).not.toBeInTheDocument()
      await execute()
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled()
    }
  )

  it('requires actual signature output and never falls back to a reference size', async () => {
    render(<PQCLiveComparisonFlow onBack={vi.fn()} />)
    await execute()
    next()
    mocks.execute.mockResolvedValueOnce({ files: [], stdout: '' })
    await execute()
    expect(screen.getByRole('alert')).toHaveTextContent('Required sample file')
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
    expect(region().queryByText('Returned signature-output bytes')).not.toBeInTheDocument()
    await execute()
    expect(region().getByText('17 B')).toBeVisible()
    expect(region().getByText(/OpenSSL signature file/)).toBeVisible()
  })

  it.each(['false', 'error'])(
    'does not complete an HSM verification with %s outcome',
    async (failure) => {
      readyHsm()
      render(<PQCLiveComparisonFlow onBack={vi.fn()} />)
      await execute()
      next()
      await execute()
      next()
      if (failure === 'false') mocks.mlVerify.mockReturnValueOnce(false)
      else
        mocks.mlVerify.mockImplementationOnce(() => {
          throw new Error('sample verifier error')
        })
      await execute()
      expect(screen.getByRole('alert')).toBeVisible()
      expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
      if (failure === 'false')
        expect(
          region('Post-quantum sample output').getByText(/HSM sample check: Failed/)
        ).toBeVisible()
      await execute()
      expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled()
    }
  )

  it.each(['false', 'error'])(
    'does not complete an OpenSSL verification with %s outcome',
    async (failure) => {
      render(<PQCLiveComparisonFlow onBack={vi.fn()} />)
      await execute()
      next()
      await execute()
      next()
      mocks.execute.mockResolvedValueOnce(
        failure === 'false'
          ? { files: [], stdout: 'Signature Verification Failure' }
          : { files: [], stdout: '', error: 'sample verifier error' }
      )
      await execute()
      expect(screen.getByRole('alert')).toBeVisible()
      expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
      await execute()
      expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled()
    }
  )

  it.each(['resolve', 'reject'])(
    'holds busy until an obsolete request %s, then permits current retry',
    async (outcome) => {
      let resolve!: (value: ReturnType<typeof softwareResult>) => void
      let reject!: (error: Error) => void
      mocks.execute.mockImplementationOnce(
        () =>
          new Promise((res, rej) => {
            resolve = res
            reject = rej
          })
      )
      const view = render(<PQCLiveComparisonFlow onBack={vi.fn()} />)
      fireEvent.click(screen.getByRole('button', { name: 'Execute' }))
      expect(screen.getByRole('button', { name: 'Execute' })).toBeDisabled()
      readyHsm()
      view.rerender(<PQCLiveComparisonFlow onBack={vi.fn()} />)
      expect(screen.getByRole('button', { name: 'Execute' })).toBeDisabled()
      fireEvent.click(screen.getByRole('button', { name: 'Execute' }))
      expect(mocks.generateEC).not.toHaveBeenCalled()
      const cmd = mocks.execute.mock.calls[0][0] as string
      await act(async () => {
        if (outcome === 'resolve') resolve(softwareResult(cmd))
        else reject(new Error('obsolete error'))
      })
      expect(screen.getByRole('alert')).toHaveTextContent('Inputs changed—run again')
      expect(screen.getByRole('alert')).not.toHaveTextContent('obsolete error')
      expect(region().queryByText('53 B')).not.toBeInTheDocument()
      expect(mocks.execute).toHaveBeenCalledTimes(1)
      await execute()
      expect(region().getByText('ECDSA P-256')).toBeVisible()
      expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled()
    }
  )

  it('blocks a settled continuation when the live session changes before a render/effect', async () => {
    let resolve!: (value: ReturnType<typeof softwareResult>) => void
    mocks.execute.mockImplementationOnce(
      () =>
        new Promise((res) => {
          resolve = res
        })
    )
    render(<PQCLiveComparisonFlow onBack={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Execute' }))
    const cmd = mocks.execute.mock.calls[0][0] as string
    // A live provider ref can change before React has delivered a new hook result.
    mocks.hsm.hSessionRef.current = 9
    await act(async () => {
      resolve(softwareResult(cmd))
    })
    expect(mocks.execute).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('alert')).toHaveTextContent('Inputs changed—run again')
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
    expect(region().queryByText('53 B')).not.toBeInTheDocument()
  })

  it('invalidates a provider change and immediate settlement in the same act turn', async () => {
    let resolve!: (value: ReturnType<typeof softwareResult>) => void
    mocks.execute.mockImplementationOnce(
      () =>
        new Promise((res) => {
          resolve = res
        })
    )
    const view = render(<PQCLiveComparisonFlow onBack={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Execute' }))
    const cmd = mocks.execute.mock.calls[0][0] as string
    // Deliberately batch the provider render and promise settlement to test their ordering.
    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(async () => {
      readyHsm()
      view.rerender(<PQCLiveComparisonFlow onBack={vi.fn()} />)
      resolve(softwareResult(cmd))
    })
    expect(mocks.execute).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('alert')).toHaveTextContent('Inputs changed—run again')
    expect(region().queryByText('53 B')).not.toBeInTheDocument()
    await execute()
    expect(region().getByText('ECDSA P-256')).toBeVisible()
  })

  it('does not reuse old HSM handles after the session changes', async () => {
    readyHsm()
    const view = render(<PQCLiveComparisonFlow onBack={vi.fn()} />)
    await execute()
    next()
    mocks.hsm.hSessionRef.current = 8
    view.rerender(<PQCLiveComparisonFlow onBack={vi.fn()} />)
    await execute()
    expect(screen.getByRole('alert')).toHaveTextContent('HSM key context changed')
    expect(mocks.ecSign).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
  })
})
