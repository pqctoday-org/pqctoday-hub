// SPDX-License-Identifier: GPL-3.0-only
import { describe, expect, it } from 'vitest'
import { generateConfig as sshConfig } from './SSHConfigGenerator'

describe('SSH config generator', () => {
  const all = ['sshd_config', 'ssh_config'].flatMap((configType) =>
    ['classical', 'hybrid', 'pure-pqc'].map((mode) => ({
      configType,
      mode,
      text: sshConfig({ configType, mode }),
    }))
  )

  it('never uses a vendor suffix on the ML-KEM key exchange name', () => {
    // OpenSSH names it mlkem768x25519-sha256 (release 9.9); the suffixed form
    // is rejected as "Bad SSH2 KexAlgorithms".
    for (const c of all) expect(c.text).not.toMatch(/mlkem768x25519-sha256@openssh\.com/)
  })

  it('puts ML-KEM first in the hybrid and PQC-only profiles and keeps a fallback only in hybrid', () => {
    for (const c of all) {
      const kex = /^\s*KexAlgorithms\s+(\S+)/m.exec(c.text)?.[1] ?? ''
      if (c.mode === 'classical') expect(kex).not.toMatch(/mlkem|sntrup/)
      if (c.mode === 'hybrid')
        expect(kex).toBe(
          'mlkem768x25519-sha256,sntrup761x25519-sha512@openssh.com,curve25519-sha256'
        )
      if (c.mode === 'pure-pqc')
        expect(kex).toBe('mlkem768x25519-sha256,sntrup761x25519-sha512@openssh.com')
    }
  })
})
