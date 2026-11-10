// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import {
  RETIREMENT_PACKETS,
  interpretRetirementPacket,
  retirementPacketMarkdown,
} from './retirementEvidenceSample'

const followUp = () => structuredClone(RETIREMENT_PACKETS[2])
describe('fictional retirement packet interpretation', () => {
  it('identifies both old paths before cutover and the surviving fallback after gateway removal', () => {
    const before = interpretRetirementPacket(RETIREMENT_PACKETS[0])
    expect(before.status).toBe('incomplete')
    expect(before.remaining).toContain('Inventory: legacy-gateway')
    expect(before.remaining).toContain('Inventory: direct-legacy')
    const partial = interpretRetirementPacket(RETIREMENT_PACKETS[1])
    expect(partial.status).toBe('incomplete')
    expect(partial.remaining).not.toContain('Inventory: legacy-gateway')
    expect(partial.remaining).toContain('Inventory: direct-legacy')
    expect(partial.remaining).toContain('Trust reference: legacy-connection-trust')
    expect(partial.remaining).toContain('Dependency: batch-reader -> direct-legacy')
  })
  it('requires separately supplied rejecting observations and a working replacement', () => {
    expect(interpretRetirementPacket(followUp())).toEqual({
      status: 'consistent',
      remaining: [],
      issues: [],
    })
    const packet = followUp()
    packet.observations[0].outcome = 'accept'
    expect(interpretRetirementPacket(packet).issues).toContain(
      'Old path still accepts: legacy-gateway'
    )
    packet.observations = packet.observations.filter((row) => row.target !== 'legacy-gateway')
    expect(interpretRetirementPacket(packet).issues).toContain(
      'Observation missing: legacy-gateway'
    )
    const failedControl = followUp()
    failedControl.observations[2].outcome = 'reject'
    expect(interpretRetirementPacket(failedControl).issues).toContain(
      'Replacement control rejected'
    )
  })
  it.each(['inventory', 'routes', 'trustReferences', 'dependencyReferences'] as const)(
    'rejects a restored %s reference even with rejecting observations',
    (field) => {
      const packet = followUp()
      if (field === 'inventory') packet.inventory.push('direct-legacy')
      if (field === 'routes') packet.routes.push({ target: 'direct-legacy', enabled: false })
      if (field === 'trustReferences') packet.trustReferences.push('legacy-connection-trust')
      if (field === 'dependencyReferences')
        packet.dependencyReferences.push('batch-reader -> direct-legacy')
      expect(interpretRetirementPacket(packet).status).toBe('incomplete')
      expect(interpretRetirementPacket(packet).remaining).not.toEqual([])
    }
  )
  it.each([
    null,
    {},
    { label: 'Missing evidence' },
    { ...followUp(), observations: [] },
    { ...followUp(), routes: null },
    { ...followUp(), inventory: [7] },
    { ...followUp(), observations: [{ target: 'legacy-gateway', outcome: 'unknown' }] },
  ])('keeps malformed or missing evidence incomplete: %j', (packet) => {
    expect(interpretRetirementPacket(packet).status).toBe('incomplete')
    expect(interpretRetirementPacket(packet).issues.length).toBeGreaterThan(0)
  })
  it('rejects duplicate, conflicting and undeclared target records', () => {
    const packet = followUp()
    packet.observations.push({ target: 'legacy-gateway', outcome: 'accept' })
    expect(interpretRetirementPacket(packet).issues).toContain('observations has duplicate targets')
    const unexpected = followUp()
    unexpected.inventory.push('other-path')
    expect(interpretRetirementPacket(unexpected).issues).toContain(
      'Inventory contains an undeclared target'
    )
  })
  it('exports the same chosen evidence without checklist completion tokens', () => {
    const markdown = retirementPacketMarkdown(RETIREMENT_PACKETS[1])
    expect(markdown).toContain('Snapshot: Gateway removed, fallback remains')
    expect(markdown).toContain('Old path still accepts: direct-legacy')
    expect(markdown).toContain('Authored fictional observations, not executed')
    expect(markdown).toContain('historical signature-verification material')
    expect(markdown).not.toMatch(/- \[x\]/)
  })
})
