// SPDX-License-Identifier: AGPL-3.0-only
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import '@testing-library/jest-dom'
import { AsnConvert } from '@peculiar/asn1-schema'
import { Certificate } from '@peculiar/asn1-x509'
import { useOpenSSLStore, type VirtualFile } from '@/components/OpenSSLStudio/store'
import { IETF_CERT_VECTORS, decodeDer, derToPem } from '../data/ietfTestVectors'
import * as verifier from '../services/compositeVerifier'
import { hybridCryptoService } from '../services/HybridCryptoService'
import { HybridCertInspector } from './HybridCertInspector'
import { inspectCertificatePem } from './certificateInspection'

const source = IETF_CERT_VECTORS.find((v) => v.certType === 'pure-pqc')!
const file = (
  name = 'hybrid-pure-pqc.pem',
  pem = derToPem(decodeDer(source.derBase64))
): VirtualFile => ({
  name,
  type: 'cert',
  content: new TextEncoder().encode(pem),
  size: pem.length,
  timestamp: 1234,
})
const passed: verifier.CompositeVerifyResult = {
  recognized: true,
  valid: true,
  oid: 'controlled',
  errors: [],
  profileLabel: 'Controlled scheduling result, not crypto evidence',
}
function compositeFile() {
  const composite = IETF_CERT_VECTORS.find((vector) => vector.certType === 'composite')!
  const cert = AsnConvert.parse(decodeDer(composite.derBase64), Certificate)
  cert.tbsCertificate.issuer = cert.tbsCertificate.subject
  return file('hybrid-composite.pem', derToPem(new Uint8Array(AsnConvert.serialize(cert))))
}

beforeEach(() => useOpenSSLStore.setState({ files: [] }))
afterEach(() => {
  vi.restoreAllMocks()
  act(() => useOpenSSLStore.setState({ files: [] }))
})

describe('Inspector consumes the actual saved public artifact', () => {
  it('does not generate unrelated certificates for an empty workspace', () => {
    const generate = vi.spyOn(hybridCryptoService, 'generateKey')
    render(<HybridCertInspector />)
    expect(screen.getByText(/No saved public workshop certificates/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Generate All/ })).not.toBeInTheDocument()
    expect(generate).not.toHaveBeenCalled()
  })

  it('renders saved bytes, source identity and DER partitions without a second generation', () => {
    const actual = file()
    useOpenSSLStore.setState({ files: [actual] })
    const generate = vi.spyOn(hybridCryptoService, 'generateKey')
    render(<HybridCertInspector />)
    fireEvent.click(screen.getByRole('button', { name: 'Raw Output' }))
    expect(screen.getByText(/Saved file:/)).toHaveTextContent(actual.name)
    expect(screen.getByText(/Saved file:/)).toHaveTextContent('1970-01-01T00:00:01.234Z')
    expect(screen.getByText(/Saved public workspace files/)).toHaveTextContent(
      'do not establish their origin, the latest generation attempt'
    )
    const pem = new TextDecoder().decode(actual.content as Uint8Array)
    expect(screen.getByLabelText('Encoded certificate PEM').textContent).toBe(pem.trim())
    fireEvent.click(screen.getByRole('button', { name: 'Size Breakdown' }))
    expect(screen.getByText('Total DER')).toBeInTheDocument()
    expect(screen.getByText(/PEM UTF8 transport:/)).toHaveTextContent(
      String(new TextEncoder().encode(pem).length)
    )
    expect(generate).not.toHaveBeenCalled()
  })

  it('ignores private keys, reports malformed public input, and recovers on actual replacement', () => {
    useOpenSSLStore.setState({ files: [{ ...file(), type: 'key' }] })
    render(<HybridCertInspector />)
    expect(screen.getByText(/No saved public workshop certificates/)).toBeInTheDocument()
    act(() =>
      useOpenSSLStore.setState({
        files: [
          file(
            'hybrid-pure-pqc.pem',
            '-----BEGIN PRIVATE KEY-----\nAA==\n-----END PRIVATE KEY-----'
          ),
        ],
      })
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Expected one public CERTIFICATE')
    expect(screen.getByRole('button', { name: 'Export PEM' })).toBeDisabled()
    expect(screen.queryByText(/BEGIN PRIVATE KEY/)).not.toBeInTheDocument()
    act(() => useOpenSSLStore.setState({ files: [file()] }))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Export PEM' })).toBeEnabled()
  })

  it('exports the exact selected saved PEM bytes and filename', async () => {
    const actual = file()
    useOpenSSLStore.setState({ files: [actual] })
    let blob!: Blob
    let filename = ''
    vi.spyOn(URL, 'createObjectURL').mockImplementation((value) => {
      blob = value as Blob
      return 'blob:public-cert'
    })
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement
    ) {
      filename = this.download
    })
    render(<HybridCertInspector />)
    fireEvent.click(screen.getByRole('button', { name: 'Export PEM' }))
    const text = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = reject
      reader.readAsText(blob)
    })
    expect(text).toBe(new TextDecoder().decode(actual.content as Uint8Array))
    expect(filename).toBe(actual.name)
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:public-cert')
  })

  it('preserves a BOM in actual public PEM transport and exported bytes without changing DER partitions', async () => {
    const pem = derToPem(decodeDer(source.derBase64))
    const bytes = new Uint8Array([0xef, 0xbb, 0xbf, ...new TextEncoder().encode(pem)])
    const ascii = inspectCertificatePem(pem)
    const prefixed = inspectCertificatePem(bytes)
    expect(prefixed.der).toEqual(ascii.der)
    expect(prefixed.sizes).toEqual({ ...ascii.sizes, pemSize: ascii.sizes.pemSize + 3 })
    useOpenSSLStore.setState({ files: [{ ...file(), content: bytes, size: bytes.length }] })
    let blob!: Blob
    vi.spyOn(URL, 'createObjectURL').mockImplementation((value) => {
      blob = value as Blob
      return 'blob:public-bom'
    })
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    render(<HybridCertInspector />)
    fireEvent.click(screen.getByRole('button', { name: 'Size Breakdown' }))
    expect(screen.getByText(/PEM UTF8 transport:/)).toHaveTextContent(`${bytes.length} B`)
    fireEvent.click(screen.getByRole('button', { name: 'Export PEM' }))
    const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as ArrayBuffer)
      reader.onerror = reject
      reader.readAsArrayBuffer(blob)
    })
    expect(new Uint8Array(buffer)).toEqual(bytes)
  })

  it('does not turn an incomplete saved group into a zero-byte complete comparison', () => {
    useOpenSSLStore.setState({ files: [file(), file('hybrid-alt-sig.pem', 'not a certificate')] })
    render(<HybridCertInspector />)
    fireEvent.click(screen.getByRole('button', { name: 'Size Breakdown' }))
    expect(screen.getByText('Saved group PEM UTF8 totals (all listed files)')).toBeInTheDocument()
    expect(screen.getByText('Not assessed (incomplete certificate)')).toBeInTheDocument()
    expect(screen.getByText(/Groups can contain different numbers and roles/)).toBeInTheDocument()
    expect(screen.queryByText(/These certificates are self-signed/)).not.toBeInTheDocument()
  })

  it('keeps the two actual Pure PQC algorithms distinct in the comparison labels', () => {
    const slh = IETF_CERT_VECTORS.find((vector) => vector.id.includes('slhdsa'))!
    useOpenSSLStore.setState({
      files: [file(), file('hybrid-pure-pqc-slh.pem', derToPem(decodeDer(slh.derBase64)))],
    })
    render(<HybridCertInspector />)
    fireEvent.click(screen.getByRole('button', { name: 'Size Breakdown' }))
    // Each name appears in the source list and in its actual transport-total row.
    expect(screen.getAllByText('Pure PQC (ML-DSA-65)', { exact: true })).toHaveLength(2)
    expect(screen.getAllByText('Pure PQC (SLH-DSA-128s)', { exact: true })).toHaveLength(2)
    expect(screen.queryByText('Pure PQC', { exact: true })).not.toBeInTheDocument()
  })

  it('parses actual reference names instead of provider/label metadata', async () => {
    const vector = IETF_CERT_VECTORS[0]
    const before = { label: vector.label, provider: vector.provider }
    vector.label = 'NOT THE ENCODED SUBJECT'
    vector.provider = 'NOT THE ENCODED ISSUER'
    try {
      render(<HybridCertInspector />)
      fireEvent.click(screen.getByRole('button', { name: 'IETF Reference Certs' }))
      fireEvent.click(screen.getByRole('button', { name: 'Raw Output' }))
      const dump = screen.getByLabelText('Reference structural certificate fields')
      await waitFor(() => expect(dump).toHaveTextContent('Serial Number (encoded hex)'))
      expect(dump).not.toHaveTextContent(vector.label)
      expect(dump).not.toHaveTextContent(vector.provider)
      expect(screen.queryByText('OpenSSL X.509 Parse Output')).not.toBeInTheDocument()
    } finally {
      Object.assign(vector, before)
    }
  })

  it.each(['replace', 'source', 'unmount'] as const)(
    'suppresses a deferred old verification after %s',
    async (change) => {
      // Controlled verifier result tests promise ownership only; actual parsing still runs.
      const selfIssued = compositeFile()
      let settle!: (value: verifier.CompositeVerifyResult) => void
      vi.spyOn(verifier, 'verifyCompositeCert').mockReturnValueOnce(
        new Promise((resolve) => {
          settle = resolve
        })
      )
      useOpenSSLStore.setState({ files: [selfIssued] })
      const view = render(<HybridCertInspector />)
      await waitFor(() => expect(settle).toBeTypeOf('function'))
      if (change === 'replace') act(() => useOpenSSLStore.setState({ files: [file()] }))
      if (change === 'source')
        fireEvent.click(screen.getByRole('button', { name: 'IETF Reference Certs' }))
      if (change === 'unmount') view.unmount()
      await act(async () => {
        settle(passed)
      })
      expect(
        screen.queryByText('Selected composite self-signature checks passed')
      ).not.toBeInTheDocument()
      expect(screen.queryByText(passed.profileLabel!)).not.toBeInTheDocument()
    }
  )

  it('clears a recorded verdict immediately when its actual saved file is removed', async () => {
    vi.spyOn(verifier, 'verifyCompositeCert').mockResolvedValue(passed)
    useOpenSSLStore.setState({ files: [compositeFile()] })
    render(<HybridCertInspector />)
    await screen.findByText('Selected composite self-signature checks passed')
    act(() => useOpenSSLStore.setState({ files: [] }))
    expect(
      screen.queryByText('Selected composite self-signature checks passed')
    ).not.toBeInTheDocument()
    expect(screen.getByText(/No saved public workshop certificates/)).toBeInTheDocument()
  })

  it('invalidates a verdict when addFile reuses the same file object with changed bytes', async () => {
    const actual = compositeFile()
    let settle!: (value: verifier.CompositeVerifyResult) => void
    vi.spyOn(verifier, 'verifyCompositeCert')
      .mockResolvedValueOnce(passed)
      .mockImplementation(
        () =>
          new Promise((resolve) => {
            settle = resolve
          })
      )
    useOpenSSLStore.setState({ files: [actual] })
    render(<HybridCertInspector />)
    await screen.findByText('Selected composite self-signature checks passed')
    const changed = AsnConvert.parse(
      decodeDer(
        new TextDecoder()
          .decode(actual.content as Uint8Array)
          .replace(/-----[^-]+-----/g, '')
          .replace(/\s/g, '')
      ),
      Certificate
    )
    changed.tbsCertificate.serialNumber = new Uint8Array([1, 2, 3]).buffer
    actual.content = new TextEncoder().encode(
      derToPem(new Uint8Array(AsnConvert.serialize(changed)))
    )
    act(() => useOpenSSLStore.getState().addFile(actual))
    expect(
      screen.queryByText('Selected composite self-signature checks passed')
    ).not.toBeInTheDocument()
    await act(async () => {
      settle({ ...passed, valid: false })
    })
    expect(screen.getByText('Selected composite self-signature check failed')).toBeInTheDocument()
  })

  it('shows an incomplete verifier error and recovers only for the replacement input', async () => {
    vi.spyOn(verifier, 'verifyCompositeCert')
      .mockRejectedValueOnce(new Error('controlled check unavailable'))
      .mockResolvedValue(passed)
    useOpenSSLStore.setState({ files: [compositeFile()] })
    render(<HybridCertInspector />)
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Incomplete selected self-signature check: controlled check unavailable'
    )
    act(() => useOpenSSLStore.setState({ files: [compositeFile()] }))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    await screen.findByText('Selected composite self-signature checks passed')
  })
})
