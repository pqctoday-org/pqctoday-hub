// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { SshHandshakeResult } from '@/wasm/openssh'
import { SshComparisonPanel } from './SshComparisonPanel'
const sample = (token_module: string): SshHandshakeResult => ({
  connection_ok: true,
  quantum_safe: true,
  host_key_algorithm: 'ssh-mldsa-65',
  client_auth_algorithm: 'ssh-mldsa-65',
  kex_algorithm: 'mlkem768-sha256',
  host_pubkey_bytes: 1952,
  client_pubkey_bytes: 1952,
  kex_share_bytes: 1184,
  kex_reply_share_bytes: 1088,
  host_sig_bytes: 3309,
  client_sig_bytes: 3309,
  auth_ms: 10,
  keygen_ms: 2,
  kex_ms: 2,
  host_sig_ms: 3,
  client_sig_ms: 3,
  pkcs11_host_backed: true,
  pkcs11_client_backed: true,
  token_module,
  wire_packets: [
    {
      direction: 'S→C',
      msgType: 'SSH_MSG_USERAUTH_SUCCESS',
      msgNum: 52,
      sizeBytes: 1,
      hexPreview: '34',
    },
  ],
})
describe('retained SSH result scope', () => {
  it.each(['softhsmv3 (WASM)', 'unrecognized future source'])(
    'does not convert %s success flags into protocol acceptance',
    (origin) => {
      const result = sample(origin),
        before = JSON.stringify(result)
      const view = render(<SshComparisonPanel pqc={result} />)
      expect(screen.getByText(/connection\/authentication not assessed/)).toBeInTheDocument()
      expect(screen.queryByText('connected')).not.toBeInTheDocument()
      expect(screen.queryByText('quantum-safe')).not.toBeInTheDocument()
      expect(screen.getByText('Sample operation wall-time')).toBeInTheDocument()
      view.rerender(
        <SshComparisonPanel pqc={{ ...result, kex_algorithm: 'different displayed algorithm' }} />
      )
      expect(screen.queryByText('connected')).not.toBeInTheDocument()
      expect(JSON.stringify(result)).toBe(before)
    }
  )
  it('retains connection and authentication telemetry for the known genuine result origin', () => {
    render(<SshComparisonPanel pqc={sample('softhsmv3 (WASM, embedded — real OpenSSH)')} />)
    expect(screen.getByText('connected')).toBeInTheDocument()
    expect(screen.getByText('quantum-safe')).toBeInTheDocument()
    expect(screen.getByText('Auth wall-time')).toBeInTheDocument()
  })
  it('preserves the real-origin negative connection status', () => {
    render(
      <SshComparisonPanel
        pqc={{ ...sample('softhsmv3 (WASM, embedded — real OpenSSH)'), connection_ok: false }}
      />
    )
    expect(screen.getByText('connected')).toHaveClass('text-status-error')
    expect(screen.queryByText(/connection\/authentication not assessed/)).not.toBeInTheDocument()
  })
  it('retains the existing failed-result message without a success pill', () => {
    render(
      <SshComparisonPanel
        pqc={{
          ...sample('softhsmv3 (WASM)'),
          connection_ok: false,
          error: 'sample operation failed',
        }}
      />
    )
    expect(screen.getByText('sample operation failed')).toBeInTheDocument()
    expect(screen.queryByText('connected')).not.toBeInTheDocument()
  })
})
