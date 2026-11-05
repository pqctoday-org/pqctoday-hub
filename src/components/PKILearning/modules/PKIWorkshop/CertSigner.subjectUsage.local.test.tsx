// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { X509Attribute } from '../../common/types'
import samples from './subjectKeyUsage.local.fixtures.json'
import { CertSigner } from './CertSigner'
const state = vi.hoisted(() => ({
  csr: '',
  issuer: 'RSA',
  metadata: 'RSA',
  attributes: [] as X509Attribute[],
  execute: vi.fn(),
  addCertificate: vi.fn(),
  addFile: vi.fn(),
}))
vi.mock('@/store/useModuleStore', () => ({
  useModuleStore: () => ({
    artifacts: {
      csrs: [{ id: 'csr', name: 'sample.csr', pem: state.csr, keyPairId: 'subject' }],
      keys: [
        {
          id: 'ca',
          name: 'ca.key',
          algorithm: state.issuer,
          privateKey: 'sample',
          description: 'Root CA Private Key',
        },
        { id: 'subject', algorithm: state.metadata },
      ],
      certificates: [
        { id: 'cacert', name: 'ca.pem', pem: 'sample', tags: ['root', 'ca'], keyPairId: 'ca' },
      ],
    },
    addCertificate: state.addCertificate,
  }),
}))
vi.mock('@/components/OpenSSLStudio/store', () => ({
  useOpenSSLStore: () => ({ addFile: state.addFile }),
}))
vi.mock('@/services/crypto/OpenSSLService', () => ({
  openSSLService: { execute: (...args: unknown[]) => state.execute(...args) },
}))
vi.mock('@/hooks/useCertProfile', () => ({
  useCertProfile: () => ({
    selectedProfile: '',
    availableProfiles: [],
    attributes: state.attributes,
    setAttributes: vi.fn(),
    profileMetadata: null,
    handleProfileSelect: vi.fn(),
    handleAttributeChange: vi.fn(),
    log: '',
    setLog: vi.fn(),
  }),
}))
vi.mock('@/components/common/FilterDropdown', () => ({
  FilterDropdown: (props: {
    label?: string
    items: { id: string; label: string }[]
    selectedId: string
    onSelect: (id: string) => void
  }) => (
    // Test double isolates issuance logic; actual FilterDropdown is covered in browser checks.
    // eslint-disable-next-line no-restricted-syntax
    <select
      aria-label={props.label || 'Profile'}
      value={props.selectedId}
      onChange={(e) => props.onSelect(e.target.value)}
    >
      <option value="" />
      {props.items.map((item) => (
        <option key={item.id} value={item.id}>
          {item.label}
        </option>
      ))}
    </select>
  ),
}))
const keyUsage = (value: string): X509Attribute => ({
  id: '2.5.29.15',
  oid: '2.5.29.15',
  label: 'keyUsage',
  value,
  critical: value.startsWith('critical,'),
  enabled: true,
  status: 'optional',
  elementType: 'Extension',
  placeholder: '',
  description: '',
})
beforeEach(() => {
  vi.clearAllMocks()
  state.csr = samples.ec
  state.issuer = 'RSA'
  state.metadata = 'RSA'
  state.attributes = []
  state.execute.mockImplementation(async (cmd: string) => ({
    error: undefined,
    stderr: '',
    stdout: cmd.includes('-verify')
      ? 'Certificate request self-signature verify OK'
      : cmd.includes('-subject')
        ? 'subject=CN=sample.example'
        : cmd.includes('-serial')
          ? 'serial=01'
          : '',
    files: cmd.startsWith('openssl x509 -req')
      ? [{ name: 'pkiworkshopcert.pem', data: new TextEncoder().encode('sample certificate') }]
      : [],
  }))
})
async function sign() {
  const complete = vi.fn()
  render(<CertSigner onComplete={complete} />)
  fireEvent.change(screen.getByLabelText('Certificate Signing Request'), {
    target: { value: 'csr' },
  })
  expect(await screen.findByText(/CSR self-signature verified/)).toBeTruthy()
  fireEvent.change(screen.getByLabelText('Signing CA Key'), { target: { value: 'ca' } })
  fireEvent.click(screen.getByRole('button', { name: 'Sign Certificate' }))
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Sign Certificate' })).not.toBeDisabled()
  )
  return complete
}
function extensionConfig(): string {
  const call = state.execute.mock.calls.find(([cmd]) => cmd.startsWith('openssl x509 -req'))
  return new TextDecoder().decode(
    call?.[1].find((file: { name: string }) => file.name === 'ext.conf').data
  )
}
describe('certificate issuance subject usage gate', () => {
  it.each(['RSA', 'EC', 'ML-DSA-44'])(
    'keeps an EC subject signing-only with %s issuer and misleading RSA metadata',
    async (issuer) => {
      state.issuer = issuer
      const complete = await sign()
      expect(complete).toHaveBeenCalledOnce()
      expect(extensionConfig()).toContain('keyUsage = digitalSignature\n')
      expect(extensionConfig()).not.toContain('keyEncipherment')
      expect(screen.getByText(/CSR subject public key: EC \(P-256\)/)).toHaveTextContent(
        'Saved CSR display metadata: RSA'
      )
    }
  )
  it.each(['ec', 'rsa', 'mldsa44', 'slhdsa128f'] as const)(
    'writes the %s subject signing default',
    async (name) => {
      state.csr = samples[name]
      state.issuer = 'EC'
      const complete = await sign()
      expect(complete).toHaveBeenCalledOnce()
      expect(extensionConfig()).toContain('keyUsage = digitalSignature\n')
    }
  )
  it('preserves explicit RSA legacy transport and traces the actual value rather than a default', async () => {
    state.csr = samples.rsa
    state.issuer = 'EC'
    state.attributes = [keyUsage('critical,keyEncipherment')]
    expect(await sign()).toHaveBeenCalledOnce()
    expect(extensionConfig()).toContain('keyUsage = critical,keyEncipherment\n')
    expect(extensionConfig().match(/^keyUsage = /gm)).toHaveLength(1)
    expect(screen.getByText(/CSR subject public key:/)).toHaveTextContent(
      'Explicit RSA key-transport usage'
    )
  })
  it.each(['ec', 'mldsa44'] as const)(
    'blocks incompatible %s subject usage before issuance or completion',
    async (name) => {
      state.csr = samples[name]
      state.attributes = [keyUsage('digitalSignature,keyEncipherment')]
      expect(await sign()).not.toHaveBeenCalled()
      expect(state.addCertificate).not.toHaveBeenCalled()
      expect(state.execute.mock.calls.some(([cmd]) => cmd.startsWith('openssl x509 -req'))).toBe(
        false
      )
      expect(screen.getByText(/Error:.*subject key is incompatible/)).toBeTruthy()
    }
  )
  it('blocks unparseable subject bytes even if the mocked separate signature check says OK', async () => {
    state.csr = 'unparseable sample'
    expect(await sign()).not.toHaveBeenCalled()
    expect(state.addCertificate).not.toHaveBeenCalled()
    expect(screen.getByText(/Cannot inspect the CSR subject public key/)).toBeTruthy()
  })
  it('retains the separate failed CSR self-signature gate', async () => {
    state.execute.mockResolvedValue({
      error: 'invalid CSR signature',
      stdout: '',
      stderr: 'verify failure',
      files: [],
    })
    render(<CertSigner onComplete={vi.fn()} />)
    fireEvent.change(screen.getByLabelText('Certificate Signing Request'), {
      target: { value: 'csr' },
    })
    fireEvent.change(screen.getByLabelText('Signing CA Key'), { target: { value: 'ca' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign Certificate' }))
    expect(await screen.findByText(/CSR signature verification FAILED/)).toBeTruthy()
    expect(state.addCertificate).not.toHaveBeenCalled()
  })
})
