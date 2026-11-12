// SPDX-License-Identifier: AGPL-3.0-only
import fs from 'node:fs'
import path from 'node:path'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TLSConfigGenerator } from '../TLSBasics/components/TLSConfigGenerator'

vi.mock('@/components/PKILearning/common/OpsConfigGenerator', () => ({
  OpsConfigGenerator: ({
    generateConfig,
  }: {
    generateConfig: (values: Record<string, string>) => string
  }) => (
    <pre data-testid="maintained-tls-config">
      {generateConfig({ serverType: 'nginx', tlsMode: 'hybrid' })}
    </pre>
  ),
}))
vi.mock('@/components/PKILearning/common/KatValidationPanel', () => ({
  KatValidationPanel: () => null,
}))

// Fixed module source beside this test; not a learner-controlled filename.
// eslint-disable-next-line security/detect-non-literal-fs-filename
const summary = fs.readFileSync(path.resolve(__dirname, 'rag-summary.md'), 'utf8')
const concept = (title: string) =>
  summary.split('\n').find((line) => line.startsWith(`- **${title}**`))!

describe('Ops source-backed operational controls', () => {
  it('keeps the maintained nginx hybrid group/fallback and configures TLS 1.3 suites separately', () => {
    render(<TLSConfigGenerator />)
    const maintained = screen.getByTestId('maintained-tls-config').textContent!
    const passage = concept('Config Management PQC Defaults')
    const groups = 'ssl_conf_command Groups X25519MLKEM768:X25519:P-256;'
    expect(maintained).toContain(groups)
    expect(passage).toContain(groups)
    expect(passage).toContain(
      'ssl_conf_command Ciphersuites TLS_AES_256_GCM_SHA384:TLS_AES_128_GCM_SHA256;'
    )
    expect(passage).not.toContain('ssl_ciphers TLS_AES_')
    expect(passage).toContain('explicit classical fallback')
    expect(passage).toContain('Certificate signatures are configured separately')
    expect(summary).toContain('-ciphersuites TLS_AES_256_GCM_SHA384 -groups X25519MLKEM768')
    expect(summary).toContain('Repeat with `-groups X25519`')
    expect(summary).toContain('a TLS group is not a cipher suite')
    expect(summary).toContain('does not run nginx')
    expect(screen.getByText('ssl_conf_command Ciphersuites')).toBeInTheDocument()
    expect(screen.queryByText('ssl_ciphersuites')).not.toBeInTheDocument()
  })

  it('distinguishes unchanged cipher suites from group fallback and counts complete hybrid shares', () => {
    const incident = concept('PQC Incident Response Runbooks')
    const monitoring = concept('Monitoring Threshold Recalibration')
    expect(incident).toContain('monitor the negotiated key-exchange group')
    expect(incident).toContain(
      'TLS_AES_256_GCM_SHA384 can remain the cipher suite with either X25519MLKEM768 or X25519'
    )
    expect(incident).not.toContain('classical-only cipher suites')
    // RFC group encoding includes the X25519 contribution at both peers.
    expect(32 + 1184).toBe(1216)
    expect(32 + 1088).toBe(1120)
    expect(1216 + 1120).toBe(2336)
    expect(2336 - 64).toBe(2272)
    expect(monitoring).toContain('1,216 bytes (32-byte X25519 public value + 1,184-byte')
    expect(monitoring).toContain('1,120 bytes (32-byte X25519 public value + 1,088-byte')
    expect(monitoring).toContain('2,336 bytes together, excluding KeyShareEntry/extension framing')
    expect(monitoring).toContain('hybrid shares add 2,272 bytes')
    expect(monitoring).not.toContain('approximately 3.5–4.5 KB')
  })

  it('teaches a measured compression improvement without passing an oversized decompressed message', () => {
    const incident = concept('PQC Incident Response Runbooks')
    expect(incident).toContain('11,100 bytes as a Certificate handshake')
    expect(incident).toContain('10,913 bytes as a zlib-level-6 CompressedCertificate handshake')
    expect(incident).toContain('original 11,096-byte Certificate body')
    // RFC 8879 framing: original header=4; compressed header+algorithm+length+vector=12.
    const originalBody = 11100 - 4
    const compressedBody = 10913 - 4
    const illustrativeUncompressedCap = 11000
    expect(10913).toBeLessThan(11100)
    expect(compressedBody).toBeLessThan(illustrativeUncompressedCap)
    expect(originalBody).toBeGreaterThan(illustrativeUncompressedCap)
    expect(incident).toContain(
      'serialization measurements, not device or compression-negotiation results'
    )
    expect(incident).toContain(
      'OCSP must-staple requires certificate-status evidence; it does not shrink the chain'
    )
    expect(incident).not.toContain('mitigation: OCSP must-staple + compressed cert delivery')
    expect(summary).toContain('https://www.rfc-editor.org/rfc/rfc8879.html#section-4')
    expect(summary).toContain('https://www.rfc-editor.org/rfc/rfc7633.html#section-4')
  })
})
