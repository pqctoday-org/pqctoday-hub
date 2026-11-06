// SPDX-License-Identifier: AGPL-3.0-only
import { useState } from 'react'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Key } from '@/types'
import { KemOpsTab } from './KemOpsTab'
const fixture = await vi.hoisted(async () => {
  const { createContext } = await import('react')
  return {
    KeyContext: createContext<Record<string, unknown>>({}),
    OperationsContext: createContext<Record<string, unknown>>({}),
    run: vi.fn(),
    mode: 'wasm',
    loaded: true,
  }
})
vi.mock('../contexts/SettingsContext', () => ({
  useSettingsContext: () => ({
    loading: false,
    executionMode: fixture.mode,
    wasmLoaded: fixture.loaded,
  }),
}))
vi.mock('../contexts/KeyStoreContext', async () => {
  const { useContext } = await import('react')
  return { useKeyStoreContext: () => useContext(fixture.KeyContext) }
})
vi.mock('../contexts/OperationsContext', async () => {
  const { useContext } = await import('react')
  return { useOperationsContext: () => useContext(fixture.OperationsContext) }
})
vi.mock('../hsm/HsmContext', () => ({ useHsmContext: () => ({}) }))
vi.mock('../../../utils/analytics', () => ({ logEvent: vi.fn() }))
vi.mock('../../../wasm/softhsm', () => ({
  hsm_generateMLKEMKeyPair: vi.fn(),
  hsm_encapsulate: vi.fn(),
  hsm_decapsulate: vi.fn(),
  hsm_extractKeyValue: vi.fn(),
  hsm_importMLKEMPublicKey: vi.fn(),
}))
class SampleCryptoKey {
  algorithm: KeyAlgorithm
  type: 'public' | 'private'
  usages: KeyUsage[]
  constructor(
    algorithm: KeyAlgorithm,
    type: 'public' | 'private',
    usages: KeyUsage[] = type === 'private' ? ['deriveBits'] : []
  ) {
    this.algorithm = algorithm
    this.type = type
    this.usages = usages
  }
}
const record = (algorithm: string, type: 'public' | 'private'): Key => ({
  id: `${algorithm}-${type}`,
  name: `${algorithm} ${type} sample`,
  algorithm,
  type,
  value: 'sample',
  timestamp: 1,
  data: algorithm.startsWith('ML-KEM')
    ? new Uint8Array([1, 2])
    : (new SampleCryptoKey(
        algorithm === 'X25519'
          ? { name: algorithm }
          : ({ name: 'ECDH', namedCurve: algorithm } as EcKeyAlgorithm),
        type
      ) as unknown as CryptoKey),
})
const records = ['X25519', 'X448', 'P-256', 'P-384', 'P-521', 'DH-2048', 'ML-KEM-768'].flatMap(
  (algorithm) => (['public', 'private'] as const).map((type) => record(algorithm, type))
)
function Harness({
  enc = '',
  dec = '',
  hybrid = false,
  secondaryEnc = '',
  secondaryDec = '',
  keyStore = records,
}: {
  enc?: string
  dec?: string
  hybrid?: boolean
  secondaryEnc?: string
  secondaryDec?: string
  keyStore?: Key[]
}) {
  const [selectedEncKeyId, setSelectedEncKeyId] = useState(enc)
  const [selectedDecKeyId, setSelectedDecKeyId] = useState(dec)
  const [isHybridMode, setIsHybridMode] = useState(hybrid)
  const [secondaryEncKeyId, setSecondaryEncKeyId] = useState(secondaryEnc)
  const [secondaryDecKeyId, setSecondaryDecKeyId] = useState(secondaryDec)
  const keys = {
    keyStore,
    selectedEncKeyId,
    setSelectedEncKeyId,
    selectedDecKeyId,
    setSelectedDecKeyId,
  }
  const operations = {
    runOperation: fixture.run,
    sharedSecret: '',
    setSharedSecret: vi.fn(),
    ciphertext: '',
    setCiphertext: vi.fn(),
    encryptedData: '',
    setEncryptedData: vi.fn(),
    decryptedData: '',
    dataToEncrypt: '',
    setDataToEncrypt: vi.fn(),
    kemDecapsulationResult: null,
    decapsulatedSecret: '',
    isHybridMode,
    setIsHybridMode,
    secondaryEncKeyId,
    setSecondaryEncKeyId,
    secondaryDecKeyId,
    setSecondaryDecKeyId,
    hybridMethod: 'concat-hkdf',
    setHybridMethod: vi.fn(),
    pqcSharedSecret: '',
    classicalSharedSecret: '',
    pqcRecoveredSecret: '',
    classicalRecoveredSecret: '',
  }
  return (
    <fixture.KeyContext.Provider value={keys}>
      <fixture.OperationsContext.Provider value={operations}>
        <output aria-label="Selected primary IDs">
          {selectedEncKeyId}|{selectedDecKeyId}
        </output>
        <output aria-label="Selected secondary private ID">{secondaryDecKeyId}</output>
        <KemOpsTab />
      </fixture.OperationsContext.Provider>
    </fixture.KeyContext.Provider>
  )
}
beforeEach(() => {
  fixture.run.mockReset()
  fixture.mode = 'wasm'
  fixture.loaded = true
  vi.stubGlobal('CryptoKey', SampleCryptoKey)
})
afterEach(() => vi.unstubAllGlobals())
const choose = async (name: string, option: string) => {
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name }))
  await user.click(
    screen.getByRole('option', {
      name: (accessibleName) =>
        accessibleName === option || accessibleName === `${option}Unavailable here`,
    })
  )
}
describe('KEM actual selectors retain unsupported choices while gating only their operation', () => {
  it.each(['X448', 'P-384', 'P-521', 'DH-2048'])(
    'keeps %s inspectable and explains both unavailable Run actions',
    async (algorithm) => {
      render(<Harness />)
      await choose('Encapsulation public key', `${algorithm} public sample`)
      await choose('Decapsulation private key', `${algorithm} private sample`)
      expect(screen.getByRole('button', { name: 'Encapsulation public key' })).toHaveTextContent(
        `${algorithm} public sample`
      )
      expect(screen.getByRole('button', { name: 'Decapsulation private key' })).toHaveTextContent(
        `${algorithm} private sample`
      )
      expect(screen.getByRole('button', { name: 'Run Encapsulate' })).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Run Decapsulate' })).toBeDisabled()
      expect(
        screen.getAllByText((content) =>
          content.startsWith(`${algorithm} is not implemented by this KEM sample's`)
        )
      ).toHaveLength(2)
      expect(fixture.run).not.toHaveBeenCalled()
    }
  )
  it('marks unsupported options without disabling their inspection and runs an explicitly selected compatible key', async () => {
    render(<Harness />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Encapsulation public key' }))
    const unavailable = screen.getByRole('option', { name: /P-384 public sample/ })
    expect(unavailable).toHaveTextContent('Unavailable here')
    expect(unavailable).toBeEnabled()
    await user.click(unavailable)
    await choose('Encapsulation public key', 'X25519 public sample')
    expect(screen.getByRole('button', { name: 'Run Encapsulate' })).toBeEnabled()
    await user.click(screen.getByRole('button', { name: 'Run Encapsulate' }))
    expect(fixture.run).toHaveBeenCalledExactlyOnceWith('encapsulate')
  })
  it('blocks a retained classical primary when hybrid is enabled rather than replacing its ID', async () => {
    render(<Harness enc="X25519-public" dec="P-256-private" />)
    await userEvent.setup().click(screen.getAllByRole('checkbox', { name: 'Hybrid Mode' })[0])
    expect(screen.getByLabelText('Selected primary IDs')).toHaveTextContent(
      'X25519-public|P-256-private'
    )
    expect(screen.getByRole('button', { name: 'Run Encapsulate' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Run Decapsulate' })).toBeDisabled()
    expect(screen.getAllByText(/a classical-only operation will not be substituted/)).toHaveLength(
      2
    )
    expect(fixture.run).not.toHaveBeenCalled()
  })
  it('gates all four hybrid selections independently and preserves the decapsulation readiness nuance', async () => {
    render(
      <Harness
        hybrid
        enc="ML-KEM-768-public"
        dec="ML-KEM-768-private"
        secondaryEnc="P-384-public"
        secondaryDec="P-256-private"
      />
    )
    expect(screen.getByRole('button', { name: 'Run Encapsulate' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Run Decapsulate' })).toBeEnabled()
    await choose('Hybrid secondary public key', 'X25519 public sample')
    expect(screen.getByRole('button', { name: 'Run Encapsulate' })).toBeEnabled()
    await choose('Hybrid secondary private key', 'X448 private sample')
    expect(screen.getByRole('button', { name: 'Run Decapsulate' })).toBeDisabled()
    expect(screen.getByLabelText('Selected secondary private ID')).toHaveTextContent('X448-private')
  })
  it('does not conflate classical availability with the PQC load gate or mock byte requirements', () => {
    fixture.mode = 'mock'
    fixture.loaded = false
    const view = render(<Harness enc="X25519-public" dec="P-256-private" />)
    expect(screen.getByRole('button', { name: 'Run Encapsulate' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Run Decapsulate' })).toBeEnabled()
    view.unmount()
    render(
      <Harness
        hybrid
        enc="ML-KEM-768-public"
        dec="ML-KEM-768-private"
        secondaryEnc="X25519-public"
        secondaryDec="P-256-private"
      />
    )
    expect(screen.getByRole('button', { name: 'Run Encapsulate' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Run Decapsulate' })).toBeEnabled()
  })
  it('does not auto-select a replacement for a deleted record', () => {
    render(<Harness enc="deleted" />)
    expect(screen.getByLabelText('Selected primary IDs')).toHaveTextContent('deleted|')
    expect(screen.getByRole('button', { name: 'Run Encapsulate' })).toBeDisabled()
    expect(screen.getByText(/selected public key is no longer available/)).toBeVisible()
  })
})
