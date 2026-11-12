// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import {
  ARCHITECTURES,
  edgeKey,
  edgeState,
  type Architecture,
  type PqcStatus,
  type ProtocolEdge,
} from './simArchitecture'
import {
  SCENARIO_OPERATION_CASES,
  connectionOperationCase,
  connectionOperationsReady,
  endpointOperationsReady,
  type EndpointOperationCase,
} from './simOperationCapabilities'
import { planningForArchitecture } from '@/simulation/edgePlanningProgress'

const kem: EndpointOperationCase = {
  nodeId: 'sample',
  required: ['session-key-establishment'],
  capabilities: { 'session-key-establishment': 'available' },
}
describe('Fictional operation-specific connection eligibility', () => {
  it('covers exactly the23 available-path connections, matching actual endpoint IDs', () => {
    let count = 0
    for (const arch of Object.values(ARCHITECTURES)) {
      const actual = arch.edges.filter(
        (e) => e.pqcPath === 'available' && !e.monitorOnly && e.vulnerable
      )
      expect(
        Object.keys(
          Object.entries(SCENARIO_OPERATION_CASES).find(([size]) => size === arch.size)![1]
        ).sort()
      ).toEqual(actual.map(edgeKey).sort())
      for (const e of actual) {
        const c = connectionOperationCase(arch, e)!
        expect(c.from.nodeId).toBe(e.from)
        expect(c.to.nodeId).toBe(e.to)
        expect(c.from.required.length).toBeGreaterThan(0)
        expect(c.to.required.length).toBeGreaterThan(0)
        count++
      }
      for (const e of arch.edges.filter((e) => e.pqcPath !== 'available' || e.monitorOnly))
        expect(edgeState(arch, e)).not.toBe('migratable')
    }
    expect(count).toBe(23)
  })
  it('signing-only availability does not satisfy key establishment; the matching operation does', () => {
    expect(endpointOperationsReady(kem)).toBe(true)
    expect(
      endpointOperationsReady({
        ...kem,
        capabilities: { 'produce-signature-through-provider-api': 'available' },
      })
    ).toBe(false)
    expect(
      endpointOperationsReady({
        ...kem,
        required: ['produce-signature-through-provider-api'],
        capabilities: { 'produce-signature-through-provider-api': 'available' },
      })
    ).toBe(true)
  })
  it.each(['conditional', 'planned', 'unknown', 'none'] as const)(
    'does not credit %s operation support as available',
    (status) => {
      expect(
        endpointOperationsReady({ ...kem, capabilities: { 'session-key-establishment': status } })
      ).toBe(false)
    }
  )
  it('requires every role and refuses empty, duplicate, sparse or unknown declarations', () => {
    expect(
      endpointOperationsReady({
        ...kem,
        required: ['session-key-establishment', 'peer-authentication'],
      })
    ).toBe(false)
    for (const required of [
      [],
      ['session-key-establishment', 'session-key-establishment'],
      Array(1),
      ['invented-operation'],
    ])
      expect(endpointOperationsReady({ ...kem, required } as EndpointOperationCase)).toBe(false)
  })
  it.each(['none', 'unverified', 'roadmap', 'partial', 'psk'] as PqcStatus[])(
    'general endpoint %s cannot enable even an explicitly available operation case',
    (status) => {
      for (const id of ['user', 'cdn']) {
        const arch = {
          ...ARCHITECTURES.small,
          nodes: ARCHITECTURES.small.nodes.map((n) =>
            n.id === id ? { ...n, pqcStatus: status } : n
          ),
        }
        expect(edgeState(arch, arch.edges[0])).toBe('blocked')
        expect(
          planningForArchitecture(arch, 1, { 'user-cdn-TLS 1.3': 'hybrid' }).creditedKeys
        ).toEqual([])
      }
    }
  )
  it('requires an explicitly available protocol path even with otherwise matching operations', () => {
    const arch = ARCHITECTURES.small
    for (const path of [undefined, '', 'future']) {
      expect(edgeState(arch, { ...arch.edges[0], pqcPath: path } as ProtocolEdge)).toBe('blocked')
    }
  })
  it('missing, duplicate, renamed or unassociated endpoints cannot supply a capability', () => {
    const a = ARCHITECTURES.small,
      e = a.edges[0]
    for (const nodes of [a.nodes.filter((n) => n.id !== 'cdn'), [...a.nodes, a.nodes[0]]])
      expect(connectionOperationsReady({ ...a, nodes }, e)).toBe(false)
    const unrelated: Architecture = {
      ...a,
      nodes: [...a.nodes, { id: 'other', label: 'Other', layer: 'Actor', pqcStatus: 'available' }],
    }
    expect(edgeState(unrelated, { ...e, from: 'other' })).toBe('blocked')
  })
  it('retains real supported positives and excludes the two conditional APAC cases', () => {
    const expected = {
      small: ['admin-vpn-IKEv2', 'cdn-app-TLS', 'user-cdn-TLS 1.3'],
      mid: ['admin-app1-SSH', 'app1-hsm-PKCS#11', 'app1-oracle-TLS (DB)', 'lb-app1-mTLS'],
      large: ['app-hsm-PKCS#11', 'app-oracle-TLS (DB)', 'edge-app-mTLS', 'user-edge-TLS 1.3'],
      global: ['amer-emea-WAN IPsec', 'gpki-amer-X.509', 'gpki-emea-X.509'],
    }
    for (const arch of Object.values(ARCHITECTURES)) {
      const size = arch.size,
        raw = Object.fromEntries(arch.edges.map((e) => [edgeKey(e), 'hybrid']))
      const p = planningForArchitecture(arch, 1, raw)
      expect(p.eligibleKeys, size).toEqual(Object.entries(expected).find(([s]) => s === size)![1])
      expect(p.creditedKeys, size).toEqual(Object.entries(expected).find(([s]) => s === size)![1])
      expect(p.criticalDone, size).toBe(false)
    }
    expect(
      edgeState(
        ARCHITECTURES.global,
        ARCHITECTURES.global.edges.find((e) => edgeKey(e) === 'gpki-apac-X.509')!
      )
    ).toBe('blocked')
  })
})
