// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { LESSONS } from './learnLessons'
import { POLICY_PRESETS } from '@/wasm/kmip/kmipMeta'

const lesson = (id: string) => {
  const l = LESSONS.find((x) => x.id === id)
  if (!l) throw new Error(`lesson ${id} not found`)
  return l
}
const text = (id: string) => JSON.stringify(lesson(id))

describe('KMIP agility lessons say what a policy change does and does not do', () => {
  it('the provisioning lesson limits the no-code-change claim to object creation for an opaque-handle caller', () => {
    const t = text('provision')
    expect(t).toContain(
      'this flip changes object creation without a code change for such a caller; public keys, certificates and verifier support still have to be rolled out'
    )
    expect(t).not.toContain('this flip IS the entire migration')
    expect(t).not.toContain('just a policy/config change')
  })

  it('the symmetric lesson states the Grover halving as an idealized model, with its real cost', () => {
    const t = text('symmetric')
    expect(t).toContain(
      'In the idealized query-count model it roughly halves the key size to search'
    )
    expect(t).toContain('a very long serial quantum computation (NIST PQC FAQ)')
    expect(t).not.toContain("effectively halves a symmetric key's bit strength")
    expect(t).not.toContain('down to ~128-bit effective security')
  })

  it('the hybrid lesson says TLS 1.3 runs its key schedule over the raw hybrid secret', () => {
    expect(text('hybrid')).toContain(
      'In TLS 1.3 the key schedule (HKDF) derives keys from this raw secret (RFC 10024 s5-s6).'
    )
  })

  it('the auto-migrate preset does not call the rekey transparent', () => {
    const preset = POLICY_PRESETS.find((p) => p.name === 'auto-migrate-on-use')!
    expect(preset.blurb).toBe(
      'Lazy migration: each legacy key rekeys to its PQC equivalent the first time it is used; certificates and verifiers still need the new public keys.'
    )
    expect(preset.blurb).not.toContain('transparent')
  })
})
