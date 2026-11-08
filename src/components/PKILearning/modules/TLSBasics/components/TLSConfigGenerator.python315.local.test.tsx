// SPDX-License-Identifier: AGPL-3.0-only
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TLSConfigGenerator } from './TLSConfigGenerator'

vi.mock('@/components/shared/KatValidationPanel', () => ({ KatValidationPanel: () => null }))

function clientExamples() {
  render(<TLSConfigGenerator />)
  fireEvent.click(screen.getByText('Debugging — SSLKEYLOGFILE & Client Examples'))
  const block = screen
    .getAllByLabelText('Code block')
    .find((pre) => pre.textContent?.includes('# Python 3.15+ ssl module'))
  expect(block).toBeDefined()
  return block!.textContent!
}

describe('copied Python TLS 1.3 client contract', () => {
  it('renders documented setters, strict server authentication and the existing hybrid/fallback choices', () => {
    const copied = clientExamples()
    expect(copied).toContain(
      "ctx.set_ciphersuites('TLS_AES_256_GCM_SHA384:TLS_AES_128_GCM_SHA256')"
    )
    expect(copied).toContain("ctx.set_groups('X25519MLKEM768:X25519')")
    expect(copied).toContain('ctx.minimum_version = ssl.TLSVersion.TLSv1_3')
    expect(copied).toContain('ctx.check_hostname = True')
    expect(copied).toContain('ctx.verify_mode = ssl.CERT_REQUIRED')
    expect(copied).toContain("ctx.load_verify_locations('/path/to/ca.crt')")
    expect(copied).toContain("ctx.wrap_socket(sock, server_hostname='example.com')")
    expect(copied).toContain("print(f'Group: {tls.group()}')")
    expect(copied).not.toContain('ctx.set_ciphers(')
    expect(screen.getByText(/OpenSSL 3.5\+ provides native ML-KEM support/)).toHaveTextContent(
      'an OQS provider is not required'
    )
    expect(screen.getByText(/The offered/)).toHaveTextContent('fallback is classical key exchange')
  })

  it('exposes literal Python CRLF escapes rather than double-escaped HTTP bytes', () => {
    const copied = clientExamples()
    const python = copied.slice(copied.indexOf('# Python 3.15+'))
    expect(python).toContain("tls.sendall(b'GET / HTTP/1.1\\r\\nHost: example.com\\r\\n\\r\\n')")
    expect(python).not.toContain('\\\\r')
    expect(python).not.toContain('\\\\n')
    // Optional private execution uses this exact rendered CodeBlock text. The
    // separate real TLS harness substitutes only endpoint and CA placeholders.
    const output = process.env.PQC_TLS_SAMPLE_OUTPUT_DIR
    if (output) {
      mkdirSync(output, { recursive: true })
      writeFileSync(join(output, 'client-examples.txt'), copied)
      writeFileSync(join(output, 'python-client.py'), python)
    }
  })
})
