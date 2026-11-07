// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The capstone lesson hands off to the TLS Simulator. The Simulator starts
 * with its own bundled sample identity, so the lesson must not say it presents
 * the certificate made in the lesson, and the hand import it describes must
 * work with the files the lesson really writes.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { act, fireEvent, render, renderHook, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { OPENSSL_LESSONS } from './opensslLessons'
import { useOpenSSLStore } from '../store'
import { useTLSStore } from '@/store/tls-learning.store'
import { useSampleTrustDefaults } from '@/components/PKILearning/modules/TLSBasics/utils/useSampleTrustDefaults'
import { TLSServerPanel } from '@/components/PKILearning/modules/TLSBasics/TLSServerPanel'
import { DEFAULT_SERVER_CERT } from '@/components/PKILearning/modules/TLSBasics/utils/defaultCertificates'

const capstone = OPENSSL_LESSONS.find((l) => l.id === 'capstone-tls')!
const lessonText = [
  capstone.blurb,
  capstone.setup,
  capstone.whyItMatters,
  ...capstone.steps.map((s) => s.label),
  ...capstone.notes,
].join('\n')

/** The file a step writes: the target of its `-out` option. */
const outFile = (op: string): string => op.match(/-out (\S+)/)![1]
const certFile = outFile(capstone.steps.find((s) => s.op.startsWith('req -x509'))!.op)
const keyFile = outFile(capstone.steps.find((s) => s.op.startsWith('genpkey'))!.op)

const LESSON_CERT_PEM =
  '-----BEGIN CERTIFICATE-----\nlesson-certificate\n-----END CERTIFICATE-----\n'
const LESSON_KEY_PEM = '-----BEGIN PRIVATE KEY-----\nlesson-key\n-----END PRIVATE KEY-----\n'

beforeEach(() => {
  localStorage.clear()
  useTLSStore.getState().reset()
  useOpenSSLStore.setState({ files: [] })
  const now = Date.now()
  useOpenSSLStore.getState().addFile({
    name: certFile,
    type: 'cert',
    content: LESSON_CERT_PEM,
    size: LESSON_CERT_PEM.length,
    timestamp: now,
  })
  useOpenSSLStore.getState().addFile({
    name: keyFile,
    type: 'key',
    content: LESSON_KEY_PEM,
    size: LESSON_KEY_PEM.length,
    timestamp: now,
  })
})

describe('capstone hand-off to the TLS Simulator', () => {
  it('does not claim the Simulator presents the certificate made in the lesson', () => {
    expect(lessonText).not.toMatch(/will present/i)
    expect(lessonText).not.toMatch(/the artifact the TLS Simulator/i)
    expect(lessonText).not.toMatch(/this handshake will/i)
  })

  it('names the files the lesson really writes', () => {
    expect(certFile).toBe('learn-l11-mldsa.crt')
    expect(keyFile).toBe('learn-l11-mldsa.key')
    expect(capstone.notes.join('\n')).toContain(certFile)
    expect(capstone.notes.join('\n')).toContain(keyFile)
  })

  it('the Simulator server keeps its own bundled identity after the lesson wrote its files', () => {
    renderHook(useSampleTrustDefaults)
    render(
      <MemoryRouter>
        <TLSServerPanel />
      </MemoryRouter>
    )
    const { certPem, keyPem } = useTLSStore.getState().serverConfig.certificates
    expect(certPem).toBe(DEFAULT_SERVER_CERT)
    expect(certPem).not.toBe(LESSON_CERT_PEM)
    expect(keyPem).not.toBe(LESSON_KEY_PEM)
  })

  it('the hand import described in the notes puts the lesson files into the Simulator server', () => {
    renderHook(useSampleTrustDefaults)
    render(
      <MemoryRouter>
        <TLSServerPanel />
      </MemoryRouter>
    )
    expect(capstone.notes.join('\n')).toContain("'Custom from OpenSSL Studio'")
    fireEvent.click(screen.getByRole('button', { name: /Server Identity/ }))
    fireEvent.click(screen.getByRole('option', { name: /Custom from OpenSSL Studio/ }))

    const importButtons = screen.getAllByRole('button', { name: /Import/ })
    fireEvent.click(importButtons[0])
    const certDialog = screen.getByText('Import Server Certificate').closest('div')!.parentElement!
    fireEvent.click(within(certDialog).getByText(certFile))
    expect(useTLSStore.getState().serverConfig.certificates.certPem).toBe(LESSON_CERT_PEM)

    fireEvent.click(screen.getAllByRole('button', { name: /Import/ })[1])
    const keyDialog = screen.getByText('Import Server Private Key').closest('div')!.parentElement!
    fireEvent.click(within(keyDialog).getByText(keyFile))
    expect(useTLSStore.getState().serverConfig.certificates.keyPem).toBe(LESSON_KEY_PEM)
  })

  it('a custom certificate gets no trusted CA by itself, as the notes say', () => {
    renderHook(useSampleTrustDefaults)
    act(() =>
      useTLSStore.getState().setServerConfig({
        certificates: { certPem: LESSON_CERT_PEM, keyPem: LESSON_KEY_PEM },
      })
    )
    expect(useTLSStore.getState().clientConfig.certificates.caPem).toBe('')
    expect(capstone.notes.join('\n')).toMatch(/trusted CA/)
  })
})
