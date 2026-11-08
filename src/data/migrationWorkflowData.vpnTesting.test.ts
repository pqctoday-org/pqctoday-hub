// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi } from 'vitest'

vi.mock('./migrateData', () => ({ softwareData: [] }))

import { MIGRATION_STEPS } from './migrationWorkflowData'

const testingTasks = MIGRATION_STEPS.find((s) => s.id === 'test')?.tasks ?? []
const ipsec = testingTasks.find((t) => /IPsec/i.test(t.title))
const wireguard = testingTasks.find((t) => /WireGuard/i.test(t.title))

describe('migration testing step: VPN tasks', () => {
  it('keeps the strongSwan and vendor IKEv2 examples in the IPsec task, without WireGuard', () => {
    expect(ipsec).toBeDefined()
    expect(ipsec!.description).toMatch(/IKEv2/)
    expect(ipsec!.description).toMatch(/strongSwan/)
    expect(ipsec!.description).toMatch(/RFC 9370/)
    expect(ipsec!.description).not.toMatch(/WireGuard/i)
  })

  it('states the draft status of ML-KEM in IKEv2 and asks for per-pair interoperability testing', () => {
    expect(ipsec!.description).toMatch(/still an IETF draft/)
    expect(ipsec!.description).toMatch(/draft-ietf-ipsecme-ikev2-mlkem-09/)
    expect(ipsec!.description).toMatch(/pair by pair/)
  })

  it('treats WireGuard as its own task: not IKEv2, optional pre-shared key, and an add-on for post-quantum key derivation', () => {
    expect(wireguard).toBeDefined()
    const d = wireguard!.description
    expect(d).toMatch(/handshake is not IKEv2/)
    expect(d).toMatch(/optional pre-shared key/)
    expect(d).toMatch(/Rosenpass/)
    expect(d).toMatch(/Classic McEliece and Kyber/)
    expect(d).toMatch(/rather than part of the WireGuard protocol itself/)
    expect(d).toMatch(/distributed and rotated/)
  })

  it('no task groups WireGuard under an IKEv2 validation', () => {
    for (const t of testingTasks) {
      expect(`${t.title} ${t.description}`).not.toMatch(/IKEv2[^.]*WireGuard/i)
    }
  })
  it('does not tell every estate to migrate external TLS/VPN first', () => {
    const allTasks = MIGRATION_STEPS.flatMap((s) => s.tasks ?? [])
    const ranking = allTasks.find((t) => /Rank systems by risk/.test(t.description))
    expect(ranking).toBeDefined()
    expect(ranking!.description).not.toMatch(/TLS\/VPN first/i)
    expect(ranking!.description).toMatch(/can come first/)
  })
})
