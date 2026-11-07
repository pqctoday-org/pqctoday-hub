// SPDX-License-Identifier: AGPL-3.0-only
import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import { useTLSStore } from '@/store/tls-learning.store'
import { useSampleTrustDefaults } from './useSampleTrustDefaults'
import {
  sampleCaForCertificate,
  initialSampleCertificateSelection,
  requireSampleTrustInputs,
} from './sampleTrust'
import { TLSClientPanel } from '../TLSClientPanel'
import { TLSServerPanel } from '../TLSServerPanel'
import { SampleTrustControls } from '../components/SampleTrustControls'
import {
  DEFAULT_SERVER_CERT,
  DEFAULT_MLDSA_SERVER_CERT,
  DEFAULT_MLDSA_ROOT_CA,
  DEFAULT_ROOT_CA,
} from './defaultCertificates'

beforeEach(() => {
  localStorage.clear()
  useTLSStore.getState().reset()
})
describe('sample trust selection', () => {
  it('only maps exact bundled certificates to roots', () => {
    expect(sampleCaForCertificate(DEFAULT_SERVER_CERT)).toBe(DEFAULT_ROOT_CA)
    expect(sampleCaForCertificate(DEFAULT_MLDSA_SERVER_CERT)).toBe(DEFAULT_MLDSA_ROOT_CA)
    expect(sampleCaForCertificate('unknown sample certificate')).toBeUndefined()
    expect(sampleCaForCertificate()).toBeUndefined()
  })
  it('initialises truly fresh examples and tracks known presets only in default mode', () => {
    renderHook(useSampleTrustDefaults)
    expect(useTLSStore.getState().serverConfig.certificates.certPem).toBe(DEFAULT_SERVER_CERT)
    act(() =>
      useTLSStore
        .getState()
        .setServerConfig({ certificates: { certPem: DEFAULT_MLDSA_SERVER_CERT } })
    )
    expect(useTLSStore.getState().clientConfig.certificates.caPem).toBe(DEFAULT_MLDSA_ROOT_CA)
    act(() =>
      useTLSStore
        .getState()
        .setServerConfig({ certificates: { certPem: 'unknown sample certificate' } })
    )
    expect(useTLSStore.getState().clientConfig.certificates.caPem).toBe('')
  })
  it('preserves legacy custom inputs and deliberately empty CA fields on mount', () => {
    const store = useTLSStore.getState()
    store.setClientConfig({
      trustSelection: undefined,
      certificates: { certPem: 'custom client', keyPem: 'custom key', caPem: 'custom root' },
    })
    store.setServerConfig({
      trustSelection: undefined,
      certificates: { certPem: 'custom server', keyPem: 'server key', caPem: '' },
    })
    const before = structuredClone({
      client: useTLSStore.getState().clientConfig,
      server: useTLSStore.getState().serverConfig,
    })
    renderHook(useSampleTrustDefaults)
    expect(useTLSStore.getState().clientConfig).toEqual(before.client)
    expect(useTLSStore.getState().serverConfig).toEqual(before.server)
    expect(initialSampleCertificateSelection(before.client, 'client')).toBe('custom')
  })
  it('preserves an explicitly selected wrong CA across peer changes and restores defaults only on request', async () => {
    const store = useTLSStore.getState()
    renderHook(useSampleTrustDefaults)
    act(() =>
      store.setClientConfig({
        trustSelection: 'learner-selected',
        certificates: {
          ...useTLSStore.getState().clientConfig.certificates,
          caPem: 'deliberately wrong sample root',
        },
      })
    )
    act(() => store.setServerConfig({ certificates: { certPem: DEFAULT_MLDSA_SERVER_CERT } }))
    expect(useTLSStore.getState().clientConfig.certificates.caPem).toBe(
      'deliberately wrong sample root'
    )
    const view = render(<SampleTrustControls side="client" />)
    fireEvent.click(screen.getByRole('button', { name: 'Use matching sample CA' }))
    await waitFor(() =>
      expect(useTLSStore.getState().clientConfig.certificates.caPem).toBe(DEFAULT_MLDSA_ROOT_CA)
    )
    expect(useTLSStore.getState().clientConfig.trustSelection).toBe('sample-default')
    view.unmount()
  })
  it.each(['client', 'server'] as const)(
    'CA editing and clearing in the %s panel remains learner-selected',
    async (side) => {
      renderHook(useSampleTrustDefaults)
      if (side === 'server')
        act(() => useTLSStore.getState().setServerConfig({ verifyClient: true }))
      const panel = side === 'client' ? <TLSClientPanel /> : <TLSServerPanel />
      const { unmount } = render(<MemoryRouter>{panel}</MemoryRouter>)
      const label = `${side === 'client' ? 'Client' : 'Server'} trusted sample CA`
      const input = screen.getByLabelText(label)
      fireEvent.change(input, { target: { value: 'learner sample root' } })
      fireEvent.change(input, { target: { value: '' } })
      const config = () =>
        side === 'client'
          ? useTLSStore.getState().clientConfig
          : useTLSStore.getState().serverConfig
      expect(config().trustSelection).toBe('learner-selected')
      expect(config().certificates.caPem).toBe('')
      unmount()
      await act(async () => useTLSStore.persist.rehydrate())
      render(<MemoryRouter>{panel}</MemoryRouter>)
      expect(screen.getByLabelText(label)).toHaveValue('')
      expect(config().certificates.caPem).toBe('')
    }
  )
  it('does not replace an empty explicit trust store with the peer leaf certificate', () => {
    const { clientConfig, serverConfig } = useTLSStore.getState()
    expect(() => requireSampleTrustInputs(clientConfig, serverConfig)).toThrow(
      /trusted sample CA for the client/
    )
    const client = { ...clientConfig, certificates: { caPem: DEFAULT_ROOT_CA } }
    expect(() => requireSampleTrustInputs(client, { ...serverConfig, verifyClient: true })).toThrow(
      /mutual TLS/
    )
    expect(() =>
      requireSampleTrustInputs(client, { ...serverConfig, verifyClient: false })
    ).not.toThrow()
  })
})
