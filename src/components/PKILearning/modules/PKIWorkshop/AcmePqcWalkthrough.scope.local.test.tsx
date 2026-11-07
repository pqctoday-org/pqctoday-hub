// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { AcmePqcWalkthrough } from './AcmePqcWalkthrough'
import { ACME_STEPS } from '@/data/acmeFixtures'
const blobs: Blob[] = []
const downloads: string[] = []
beforeEach(() => {
  blobs.length = 0
  downloads.length = 0
  vi.spyOn(Math, 'random').mockReturnValue(0.5)
  vi.stubGlobal('URL', {
    createObjectURL: vi.fn((blob: Blob) => {
      blobs.push(blob)
      return `blob:sample-${blobs.length}`
    }),
    revokeObjectURL: vi.fn(),
  })
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement
  ) {
    downloads.push(this.download)
  })
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})
async function finalize() {
  for (let i = 1; i < ACME_STEPS.length; i++)
    fireEvent.click(screen.getByRole('button', { name: 'Next step' }))
  await screen.findByText('Illustrative CSR text — not a valid PKCS#10 request')
}
const read = (blob: Blob) =>
  new Promise<string>((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.readAsText(blob)
  })
describe('ACME illustration downloads', () => {
  it('keeps displayed placeholder bytes in explicitly named text downloads', async () => {
    render(<AcmePqcWalkthrough />)
    await finalize()
    expect(
      screen.queryByText(/generated live|Generating ML-DSA|Verify with:|openssl req/)
    ).not.toBeInTheDocument()
    const displayed = screen.getByText(/-----BEGIN CERTIFICATE REQUEST-----/).textContent
    fireEvent.click(screen.getByRole('button', { name: 'Download CSR illustration (.txt)' }))
    fireEvent.click(screen.getByRole('button', { name: 'Download public-key illustration (.txt)' }))
    expect(downloads).toEqual([
      'ml-dsa-65-csr-illustration.txt',
      'ml-dsa-65-public-key-illustration.txt',
    ])
    expect(await read(blobs[0])).toBe(displayed)
    expect(await read(blobs[0])).toContain('[truncated for display]')
    expect(await read(blobs[1])).toBe(
      '-----BEGIN PUBLIC KEY-----\nMIIFIjANBgkrBgEEAoE4AgEFAA... (ML-DSA-65 public key, 1952 B, truncated for display)\n-----END PUBLIC KEY-----'
    )
    expect(blobs.every((b) => b.type === 'text/plain')).toBe(true)
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2)
    expect(screen.getByRole('button', { name: 'Complete' })).toBeDisabled()
  })
  it('labels a preparation error as illustration fallback, without pretending an engine ran', async () => {
    vi.mocked(Math.random).mockImplementationOnce(() => {
      throw new Error('sample preparation failure')
    })
    render(<AcmePqcWalkthrough />)
    await finalize()
    expect(screen.getByText(/Illustration preparation failed/)).toBeInTheDocument()
    expect(screen.queryByText(/Crypto engine unavailable/)).not.toBeInTheDocument()
  })
})
