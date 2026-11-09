// SPDX-License-Identifier: AGPL-3.0-only
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import concepts from '@/data/glossary/concepts.json'
import algorithms from '@/data/glossary/algorithms.json'

const provider = concepts.find((entry) => entry.term === 'OpenSSL Provider')!
const hybrid = algorithms.find((entry) => entry.term === 'X25519MLKEM768')!

describe('documented native combined-group TLS example', () => {
  it('selects one combined named group and distinguishes the documented alternatives', () => {
    const command = provider.technicalNote!.match(/openssl s_server .*?-key sample-key\.pem/)?.[0]
    expect(command).toBe(
      'openssl s_server -tls1_3 -groups X25519MLKEM768 -cert sample-cert.pem -key sample-key.pem'
    )
    expect(provider.technicalNote).toContain('one combined key-establishment group')
    expect(provider.technicalNote).toContain(
      'X25519:P-256 offers alternatives rather than combining them'
    )
    const output = process.env.PQC_GLOSSARY_TLS_OUTPUT_DIR
    if (output) {
      mkdirSync(output, { recursive: true })
      writeFileSync(
        join(output, 'documented-example.json'),
        JSON.stringify({ provider, hybrid, command }, null, 2)
      )
    }
  })

  it('assigns the hash to the negotiated cipher suite rather than the hybrid group name', () => {
    expect(hybrid.technicalNote).toContain('concatenated shared secrets to the TLS key schedule')
    expect(hybrid.technicalNote).toContain('TLS_AES_128_GCM_SHA256 uses SHA-256')
    expect(hybrid.technicalNote).toContain('TLS_AES_256_GCM_SHA384 uses SHA-384')
    expect(hybrid.technicalNote).toContain('The group name does not force SHA-256')
  })

  it('requires actual application/peer negotiation and keeps certificate and WASM claims separate', () => {
    expect(provider.technicalNote).toContain(
      'library support alone does not establish that an application and its peer can negotiate a hybrid connection'
    )
    expect(provider.technicalNote).toContain(
      'Hybrid key establishment does not make the certificate PQC-signed'
    )
    expect(provider.technicalNote).toContain('does not establish browser WASM command support')
    expect(hybrid.technicalNote).toContain(
      'Check support and actual negotiation for the application and peer in use'
    )
  })
})
