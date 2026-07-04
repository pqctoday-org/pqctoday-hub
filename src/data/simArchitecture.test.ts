// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { ARCHITECTURES, edgeKey, edgeState, mermaidFromArchitecture } from './simArchitecture'

// Readiness/scoring math is exercised end-to-end (with the two-gate rules)
// in src/simulation/readiness.test.ts — this file only tests the topology
// data and the Mermaid rendering built on top of it.

describe('simArchitecture', () => {
  it('every size has a mix of PQC and non-PQC products (never trivially 100%)', () => {
    for (const arch of Object.values(ARCHITECTURES)) {
      const statuses = new Set(arch.nodes.map((n) => n.pqcStatus))
      expect(statuses.has('none'), `${arch.size}: no non-PQC products`).toBe(true)
      expect(statuses.has('available'), `${arch.size}: no PQC products`).toBe(true)
    }
  })

  it('nodes backed by a real product resolve a catalog status other than "unverified"', () => {
    // Guards against a `productRef` typo silently falling back to 'unverified'
    // for every catalog-backed node across all sizes.
    for (const arch of Object.values(ARCHITECTURES)) {
      for (const n of arch.nodes) {
        if (n.productRef) {
          expect(n.pqcStatus, `${arch.size}/${n.label} (${n.productRef})`).not.toBe('unverified')
        }
      }
    }
  })

  it('generates Mermaid source with a flowchart, nodes, edges and classes', () => {
    const src = mermaidFromArchitecture(ARCHITECTURES.small)
    expect(src.startsWith('flowchart TB')).toBe(true)
    expect(src).toMatch(/cdn\["Caddy Web\/LB"\]:::available/)
    expect(src).toMatch(/db\["MongoDB"\]:::none/)
    expect(src).toContain('classDef none')
    expect(src).toContain('classDef unverified')
    // monitor-only edges are dashed; others solid
    const mid = mermaidFromArchitecture(ARCHITECTURES.mid)
    expect(mid).toMatch(/app1 -\.->\|"Kerberos ⚠"\| ad/)
  })

  it('renders the dark palette when asked, light by default', () => {
    const light = mermaidFromArchitecture(ARCHITECTURES.small)
    const dark = mermaidFromArchitecture(ARCHITECTURES.small, {}, 'dark')
    expect(light).toContain('classDef available fill:#d1fae5')
    expect(dark).toContain('classDef available fill:#064e3b')
  })

  it('a decided edge renders as migrated regardless of view, with a linkStyle', () => {
    const a = ARCHITECTURES.small
    const ikev2 = a.edges.find((e) => e.protocol === 'IKEv2')!
    const src = mermaidFromArchitecture(a, { [edgeKey(ikev2)]: 'hybrid' })
    expect(src).toMatch(/admin -->\|"IKEv2 ✓ migrated"\| vpn/)
    expect(src).toContain('linkStyle')
  })

  it('ignores a decision recorded against a non-migratable edge instead of misrendering it', () => {
    // TLS (wire) is 'blocked' (MongoDB has no PQC path) — it can never receive a
    // real decision through the UI, but the renderer must not trust the data
    // blindly if one ever appears there some other way.
    const a = ARCHITECTURES.small
    const blocked = a.edges.find((e) => e.protocol === 'TLS (wire)')!
    expect(edgeState(a, blocked)).toBe('blocked')
    const src = mermaidFromArchitecture(a, { [edgeKey(blocked)]: 'hybrid' })
    expect(src).not.toContain('✓ migrated')
    expect(src).toMatch(/app -->\|"TLS \(wire\) ⚡"\| db/)
  })

  it('classifies edges: product-blocked, vendor, monitor-only, migratable', () => {
    const a = ARCHITECTURES.small
    const find = (proto: string) => a.edges.find((e) => e.protocol === proto)!
    expect(edgeState(a, find('TLS (wire)'))).toBe('blocked') // → MongoDB (none)
    expect(edgeState(a, find('OIDC'))).toBe('vendor')
    expect(edgeState(a, find('IKEv2'))).toBe('migratable')
    expect(
      edgeState(ARCHITECTURES.mid, ARCHITECTURES.mid.edges.find((e) => e.protocol === 'Kerberos')!)
    ).toBe('monitor')
  })

  it('large: every vulnerable edge classifies into exactly one state (topology sanity)', () => {
    const a = ARCHITECTURES.large
    const vuln = a.edges.filter((e) => e.vulnerable)
    const byState = { migratable: 0, blocked: 0, vendor: 0, monitor: 0, safe: 0 }
    for (const e of vuln) byState[edgeState(a, e)]++
    expect(byState.migratable + byState.blocked + byState.vendor + byState.monitor).toBe(
      vuln.length
    )
    expect(byState.migratable).toBeGreaterThan(0)
    expect(byState.monitor).toBeGreaterThan(0) // large has irreducible OT/mainframe/DNSSEC links
  })
})
