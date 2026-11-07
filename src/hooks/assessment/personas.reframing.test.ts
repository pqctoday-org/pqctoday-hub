// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { reframeActionsForPersona } from './personas'
import type { RecommendedAction } from '../assessmentTypes'

const action = (text: string): RecommendedAction => ({
  priority: 1,
  action: text,
  category: 'immediate',
  relatedModule: 'tls-basics',
})

const tls = action('Migrate TLS endpoints to hybrid PQC key exchange (ML-KEM + X25519).')
const atRest = action(
  'Evaluate post-quantum protection for data-at-rest in your highest-sensitivity stores. It cannot undo exposure of data that was already captured, so establish whether that has happened.'
)

const reframed = (a: RecommendedAction, persona: string) =>
  reframeActionsForPersona([a], persona)[0].action

describe('persona reframings of the TLS and data-at-rest actions', () => {
  it('asks the executive to evaluate and verify TLS migration, without promising protection or compliance', () => {
    const t = reframed(tls, 'executive')
    expect(t).not.toMatch(/protects data in transit immediately/i)
    expect(t).not.toMatch(/demonstrates compliance progress/i)
    expect(t).toMatch(/Evaluate moving TLS to hybrid quantum-safe key exchange/)
    expect(t).toMatch(/only for sessions that negotiate it/)
    expect(t).toMatch(/does not by itself show compliance/)
  })

  it('does not tell the executive that stored data is protected from harvest-now-decrypt-later immediately', () => {
    const t = reframed(atRest, 'executive')
    expect(t).not.toMatch(/mitigates the Harvest-Now-Decrypt-Later threat immediately/i)
    expect(t).toMatch(/cannot undo exposure of ciphertext or wrapped keys that were already copied/)
  })

  it('separates a KEM-plus-AEAD envelope from a classical/PQC hybrid key establishment for developers and architects', () => {
    for (const persona of ['developer', 'architect']) {
      const t = reframed(atRest, persona)
      expect(t, persona).not.toMatch(/hybrid PQC encryption/i)
      expect(t, persona).toMatch(/KEM-plus-AEAD envelope/)
      expect(t, persona).toMatch(/classical\/PQC hybrid key establishment/)
    }
    expect(reframed(atRest, 'developer')).toMatch(/verify it/)
    expect(reframed(atRest, 'architect')).toMatch(/already-captured ciphertext/)
  })

  it('reframes the data-at-rest action for compliance, curious and operations readers without hybrid or double-lock wording', () => {
    const grc = reframed(atRest, 'grc')
    expect(grc).toMatch(/record what was tested and what stays unprotected/)
    expect(grc).not.toMatch(/hybrid encryption coverage/i)
    const curious = reframed(atRest, 'curious')
    expect(curious).toMatch(/protection added now does not undo that/)
    expect(curious).not.toMatch(/double-locking/i)
    const ops = reframed(atRest, 'ops')
    expect(ops).toMatch(/testing it against your key-management system and rotation policy first/)
    expect(ops).not.toMatch(/hybrid key hierarch/i)
  })

  it('does not reframe the retired base wording', () => {
    const old = action(
      'Implement hybrid PQC encryption for data-at-rest to guard against HNDL attacks.'
    )
    expect(reframed(old, 'curious')).toBe(old.action)
  })

  it('leaves a persona with no reframing, and an unrelated action, unchanged', () => {
    expect(reframed(tls, 'unknown-persona')).toBe(tls.action)
    const other = action('Inventory all cryptographic assets.')
    expect(reframed(other, 'executive')).toBe(other.action)
  })
})
