// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  mapRealEventsToResult,
  mapPkcs11Event,
  buildSshConfigArtifacts,
  isRealCombo,
  REAL_CLASSICAL,
  REAL_PQC,
  type SshRealEvent,
} from './openssh-real'

const pqcEvents: SshRealEvent[] = [
  { evType: 'host_key_sign', payload: '{"sig_len":3309}' },
  {
    evType: 'kex_start',
    payload: '{"kex":"mlkem768x25519-sha256","hostkey":"ssh-mldsa-65","sign":"C_Sign"}',
  },
  { evType: 'newkeys', payload: '{"server":1,"client":1,"hostsign":"C_Sign"}' },
  { evType: 'user_key_sign', payload: '{"user_sig_len":3329}' },
  { evType: 'userauth_success', payload: '{"user":"pqcuser","usersign":"C_Sign"}' },
]

const classicalEvents: SshRealEvent[] = [
  { evType: 'host_key_sign', payload: '{"sig_len":64}' },
  {
    evType: 'kex_start',
    payload: '{"kex":"curve25519-sha256","hostkey":"ecdsa-sha2-nistp256","sign":"C_Sign"}',
  },
  { evType: 'newkeys', payload: '{"server":1,"client":1,"hostsign":"C_Sign"}' },
  { evType: 'user_key_sign', payload: '{"user_sig_len":100}' },
  { evType: 'userauth_success', payload: '{"user":"pqcuser","usersign":"C_Sign"}' },
]

// SLH-DSA-SHA2-128s: FIPS 205 s11 Table 2 sizes (pk=32, sig=7856).
const slhdsaEvents: SshRealEvent[] = [
  { evType: 'host_key_sign', payload: '{"sig_len":7856}' },
  {
    evType: 'kex_start',
    payload: '{"kex":"mlkem768x25519-sha256","hostkey":"ssh-slh-dsa-sha2-128s","sign":"C_Sign"}',
  },
  { evType: 'newkeys', payload: '{"server":1,"client":1,"hostsign":"C_Sign"}' },
  { evType: 'user_key_sign', payload: '{"user_sig_len":7856}' },
  { evType: 'userauth_success', payload: '{"user":"pqcuser","usersign":"C_Sign"}' },
]

describe('openssh-real mapping', () => {
  it('maps a real PQC run, flags quantum-safe, and is HSM-backed', () => {
    const r = mapRealEventsToResult(pqcEvents, 0, 200)
    expect(r.connection_ok).toBe(true)
    expect(r.quantum_safe).toBe(true)
    expect(r.kex_algorithm).toBe('mlkem768x25519-sha256')
    expect(r.host_key_algorithm).toBe('ssh-mldsa-65')
    expect(r.host_sig_bytes).toBe(3309)
    expect(r.client_sig_bytes).toBe(3329)
    expect(r.pkcs11_host_backed).toBe(true)
    expect(r.pkcs11_client_backed).toBe(true)
  })

  it('maps a real classical run as NOT quantum-safe', () => {
    const r = mapRealEventsToResult(classicalEvents, 0, 200)
    expect(r.connection_ok).toBe(true)
    expect(r.quantum_safe).toBe(false)
    expect(r.kex_algorithm).toBe('curve25519-sha256')
    expect(r.host_key_algorithm).toBe('ecdsa-sha2-nistp256')
    expect(r.host_sig_bytes).toBe(64)
  })

  // 2026-08-31: SLH-DSA UI wiring. Before this, quantum_safe was computed as
  // `hostalg.includes('mldsa')`, which silently returned false for any
  // SLH-DSA host key even though the KEX was genuinely post-quantum ML-KEM —
  // a real bug this test guards against regressing.
  it('maps a real SLH-DSA run, flags quantum-safe, and reports the real FIPS 205 sizes', () => {
    const r = mapRealEventsToResult(slhdsaEvents, 0, 200)
    expect(r.connection_ok).toBe(true)
    expect(r.quantum_safe).toBe(true)
    expect(r.kex_algorithm).toBe('mlkem768x25519-sha256')
    expect(r.host_key_algorithm).toBe('ssh-slh-dsa-sha2-128s')
    expect(r.host_sig_bytes).toBe(7856)
    expect(r.host_pubkey_bytes).toBe(32) // FIPS 205 s11 Table 2, 128-bit raw public key
    expect(r.pkcs11_host_backed).toBe(true)
    expect(r.pkcs11_client_backed).toBe(true)
  })

  it('builds the RFC 4253/4252 wire-packet ladder from real sizes', () => {
    const r = mapRealEventsToResult(pqcEvents, 0, 200)
    expect(r.wire_packets).toHaveLength(8)
    const types = r.wire_packets.map((p) => p.msgType)
    expect(types).toContain('SSH_MSG_KEXINIT')
    expect(types).toContain('SSH_MSG_KEX_ECDH_REPLY')
    expect(types).toContain('SSH_MSG_USERAUTH_SUCCESS')
    // The reply packet carries the genuine host signature size.
    const reply = r.wire_packets.find((p) => p.msgType === 'SSH_MSG_KEX_ECDH_REPLY')!
    expect(reply.sizeBytes).toBeGreaterThan(3309)
    expect(reply.direction).toBe('S→C')
  })

  it('produces no wire packets for a failed run', () => {
    const r = mapRealEventsToResult([], 1, 0)
    expect(r.connection_ok).toBe(false)
    expect(r.wire_packets).toHaveLength(0)
  })

  it('maps a pkcs11 trace event to a log entry', () => {
    const e = mapPkcs11Event('{"op":"C_Sign","dataLen":32,"sigLen":3309,"rv":0}', 0)
    expect(e).not.toBeNull()
    expect(e!.fn).toBe('C_Sign')
    expect(e!.rvName).toBe('CKR_OK')
    expect(e!.ok).toBe(true)
    expect(e!.args).toContain('sigLen=3309')
  })

  it('builds sshd_config/ssh_config/authorized_keys reflecting the run', () => {
    const r = mapRealEventsToResult(pqcEvents, 0, 200)
    const a = buildSshConfigArtifacts(r)
    expect(a.sshdConfig).toContain('KexAlgorithms mlkem768x25519-sha256')
    expect(a.sshdConfig).toContain('HostKeyAlgorithms ssh-mldsa-65')
    expect(a.sshdConfig).toContain('PKCS11Provider')
    expect(a.sshConfig).toContain('KexAlgorithms mlkem768x25519-sha256')
    expect(a.authorizedKeys).toContain('ssh-mldsa-65')
  })

  it('knows the real combos', () => {
    expect(
      isRealCombo(
        REAL_PQC.kex === 'mlkem768x25519-sha256' ? 'mlkem768-curve25519-sha256' : '',
        'ssh-mldsa-65'
      )
    ).toBe(true)
    expect(isRealCombo('mlkem512-curve25519-sha256', 'ssh-mldsa-65')).toBe(false)
    expect(REAL_CLASSICAL.hostalg).toBe('ecdsa-sha2-nistp256')
  })

  // 2026-08-31: the rebuilt OpenSSH WASM binary generalized ssh-mldsa.c to a
  // per-parameter-set dispatch table (all 3 FIPS 204 ML-DSA sets), so every
  // ML-DSA host key the panel offers now drives the real binary, not just
  // ssh-mldsa-65.
  it('treats ssh-mldsa-44 and ssh-mldsa-87 as real combos too', () => {
    expect(isRealCombo('mlkem768-curve25519-sha256', 'ssh-mldsa-44')).toBe(true)
    expect(isRealCombo('mlkem768-curve25519-sha256', 'ssh-mldsa-87')).toBe(true)
    // Still gated on the real KEX — an unsupported KEX stays modeled even
    // with a real-capable host key.
    expect(isRealCombo('mlkem512-curve25519-sha256', 'ssh-mldsa-44')).toBe(false)
  })

  // 2026-08-31: SLH-DSA UI wiring. All 8 real SLH-DSA parameter sets
  // openssh-pkcs11/patches/ssh-slhdsa.c implements now drive the real binary
  // too, exactly like the 3 ML-DSA sets above — same HOSTKEY_VARIANTS[]
  // dispatch table, same set_handshake_config() selection path.
  it('treats all 8 real SLH-DSA host keys as real combos', () => {
    expect(isRealCombo('mlkem768-curve25519-sha256', 'ssh-slh-dsa-sha2-128s')).toBe(true)
    expect(isRealCombo('mlkem768-curve25519-sha256', 'ssh-slh-dsa-sha2-128f')).toBe(true)
    expect(isRealCombo('mlkem768-curve25519-sha256', 'ssh-slh-dsa-shake-128s')).toBe(true)
    expect(isRealCombo('mlkem768-curve25519-sha256', 'ssh-slh-dsa-shake-128f')).toBe(true)
    expect(isRealCombo('mlkem768-curve25519-sha256', 'ssh-slh-dsa-sha2-256s')).toBe(true)
    expect(isRealCombo('mlkem768-curve25519-sha256', 'ssh-slh-dsa-sha2-256f')).toBe(true)
    expect(isRealCombo('mlkem768-curve25519-sha256', 'ssh-slh-dsa-shake-256s')).toBe(true)
    expect(isRealCombo('mlkem768-curve25519-sha256', 'ssh-slh-dsa-shake-256f')).toBe(true)
    // Still gated on the real KEX, same as ML-DSA.
    expect(isRealCombo('mlkem512-curve25519-sha256', 'ssh-slh-dsa-sha2-128s')).toBe(false)
    // 192-bit SLH-DSA has no standalone SSH wire name (draft-josefsson-ssh-sphincs-02)
    // and isn't a member of SshHostKeyAlg at all, so there's nothing to assert here —
    // TypeScript itself refuses a call with an invalid id.
  })
})
