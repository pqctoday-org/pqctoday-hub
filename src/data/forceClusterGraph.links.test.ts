// SPDX-License-Identifier: AGPL-3.0-only
import { beforeAll, describe, expect, it } from 'vitest'
import {
  buildForceClusterGraph,
  standardIdsInFipsText,
  type ForceClusterGraph,
  type ForceClusterNode,
} from './forceClusterGraph'
import { loadIndustryLandscape } from './industryLandscapeData'
import { algoProductXrefs } from './algoProductXrefData'
import { softwareData } from './migrateData'
import { sectorKeysFor } from './industryMatch'
import { roadmapByVendorId } from './vendorRoadmapData'
import { enrichmentByVendorId } from './vendorRoadmapEnrichmentData'

let graph: ForceClusterGraph
let byId: Map<string, ForceClusterNode>
const slug = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

beforeAll(async () => {
  graph = await buildForceClusterGraph()
  byId = new Map(graph.nodes.map((n) => [n.id, n]))
}, 60_000)

const neighbours = (id: string) =>
  graph.edges.flatMap((e) => (e.from === id ? [e] : e.to === id ? [e] : []))

describe('Explore graph: links come from the fields that name them', () => {
  it('joins each pair of records once, so connection counts are not doubled', () => {
    const pairs = new Set<string>()
    for (const e of graph.edges) {
      const key = e.from < e.to ? `${e.from}|${e.to}` : `${e.to}|${e.from}`
      expect(pairs.has(key), key).toBe(false)
      pairs.add(key)
    }
  })

  it('links a use case to the mechanisms its families name, marked as a family match', () => {
    const { useCases } = loadIndustryLandscape()
    let checked = 0
    for (const uc of useCases) {
      if (uc.pqcMechanisms.length === 0) continue
      const id = `uc-${slug(uc.industry)}-${slug(uc.useCaseId)}`
      if (!byId.has(id)) continue
      const uses = neighbours(id).filter((e) => e.rel === 'uses')
      expect(uses.length, id).toBeGreaterThan(0)
      checked += 1
    }
    expect(checked).toBeGreaterThan(50)
    const mlKem = graph.edges.find(
      (e) => e.rel === 'uses' && e.to === 'mech-ml-kem-768' && e.from.startsWith('uc-')
    )
    expect(mlKem?.basis).toBe('family-match')
  })

  it('links a use case to the protocols in its protocolsCurrent and protocolsTarget', () => {
    const { useCases } = loadIndustryLandscape()
    let checked = 0
    for (const uc of useCases) {
      const protos = [...uc.protocolsCurrent, ...uc.protocolsTarget]
      if (protos.length === 0) continue
      const id = `uc-${slug(uc.industry)}-${slug(uc.useCaseId)}`
      if (!byId.has(id)) continue
      const protoEdges = neighbours(id).filter(
        (e) => e.rel === 'uses' && (e.to.startsWith('proto-') || e.from.startsWith('proto-'))
      )
      expect(protoEdges.length, id).toBeGreaterThan(0)
      checked += 1
    }
    expect(checked).toBeGreaterThan(50)
  })

  it('adds Industry Landscape and Construction deep links on mechanism, industry, and use-case nodes', () => {
    const mlKem768 = byId.get('mech-ml-kem-768')
    expect(
      mlKem768?.extraLinks?.some((l) => l.href === '/algorithms?tab=landscape&mechanism=ML-KEM')
    ).toBe(true)
    expect(
      mlKem768?.extraLinks?.some((l) =>
        l.href.startsWith('/algorithms?tab=landscape&construction=')
      )
    ).toBe(true)

    const financeSector = byId.get('ind-52')
    expect(
      financeSector?.extraLinks?.some((l) =>
        l.href.startsWith('/algorithms?tab=landscape&industry=')
      )
    ).toBe(true)

    const ucWithConstructions = loadIndustryLandscape().useCases.find(
      (u) => u.classicalConstructions.length > 0 || u.pqcConstructions.length > 0
    )
    expect(ucWithConstructions).toBeDefined()
    const ucNode = byId.get(
      `uc-${slug(ucWithConstructions!.industry)}-${slug(ucWithConstructions!.useCaseId)}`
    )
    expect(
      ucNode?.extraLinks?.some((l) => l.href.startsWith('/algorithms?tab=landscape&construction='))
    ).toBe(true)
  })

  it('links a use case to the Library documents in its mechanism_refs, which are document ids, not algorithm names', () => {
    const uc = loadIndustryLandscape().useCases.find((u) => u.mechanismRefs.includes('FIPS 204'))
    expect(uc).toBeDefined()
    const id = `uc-${slug(uc!.industry)}-${slug(uc!.useCaseId)}`
    expect(neighbours(id).some((e) => e.rel === 'cites' && e.to === 'std-fips-204')).toBe(true)
  })

  it('links stateful hash and classical mechanisms to the standard their own row names', () => {
    const specified = (mechId: string) =>
      graph.edges.some((e) => e.rel === 'specifies' && e.from === mechId)
    for (const id of [
      'mech-xmss-sha2-20',
      'mech-lms-sha256-h20-w8',
      'mech-ecdsa-p-256',
      'mech-ed25519',
    ]) {
      expect(byId.has(id), id).toBe(true)
      expect(specified(id), id).toBe(true)
    }
  })

  it('draws "replaces" from the newer protocol to the one it replaces', () => {
    expect(
      graph.edges.some(
        (e) => e.rel === 'supersedes' && e.from === 'proto-tls-1-3' && e.to === 'proto-tls-1-2'
      )
    ).toBe(true)
  })

  it('keeps the specific relation when a pair is also joined as "related"', () => {
    // A framework enforced by its trusted source is also "governed" from the source side; one
    // edge is kept and it is never the generic one.
    const enforces = graph.edges.filter((e) => e.rel === 'enforces')
    expect(enforces.length).toBeGreaterThan(50)
  })

  it('marks glossary links as name matches', () => {
    const glossary = graph.edges.filter((e) => e.from.startsWith('gl-'))
    expect(glossary.length).toBeGreaterThan(0)
    for (const e of glossary) expect(e.basis).toBe('name-match')
  })
})

describe('Explore graph: every "Open in hub" link lands on a page that shows the record', () => {
  it('opens a standard in the Library itself', () => {
    for (const n of graph.nodes.filter((x) => x.type === 'standard')) {
      expect(n.href, n.id).toMatch(/^\/library\?ref=/)
    }
  })

  it('opens an industry on the Compliance page filtered to that sector', () => {
    for (const n of graph.nodes.filter((x) => x.type === 'industry')) {
      const label = decodeURIComponent((n.href ?? '').replace('/compliance?ind=', ''))
      expect(n.href, n.id).toMatch(/^\/compliance\?ind=/)
      const keys = sectorKeysFor(label)
      // A cross-sector grouping ("Critical Infrastructure") resolves to its member sectors.
      if (n.sub === 'Cross-sector') expect(keys?.length, n.id).toBeGreaterThan(0)
      else expect(keys, `${n.id} -> ${label}`).toContain(n.id.replace(/^ind-/, ''))
    }
  })

  it('sends a reference implementation outside the catalog to its repository, never to a /migrate miss', () => {
    const catalogNames = new Set(softwareData.map((s) => s.softwareName.trim().toLowerCase()))
    const seen = new Set<string>()
    for (const xref of algoProductXrefs) {
      // Several xref rows can share one product id; the node is built from the first.
      const id = `prod-x-${slug(xref.productId)}`
      if (seen.has(id)) continue
      seen.add(id)
      const node = byId.get(id)
      if (!node) continue
      const inCatalog = catalogNames.has(xref.softwareName.trim().toLowerCase())
      if (inCatalog) expect(node.href, node.id).toMatch(/^\/migrate\?product=/)
      else if (xref.implementationUrl) expect(node.href, node.id).toBe(xref.implementationUrl)
    }
  })

  it('links a vendor to its Roadmaps card only when it has one', () => {
    for (const n of graph.nodes.filter((x) => x.type === 'vendor')) {
      if (!n.href?.startsWith('/migrate')) continue
      const vendorId = decodeURIComponent(n.href.replace('/migrate?vendor=', ''))
      expect(roadmapByVendorId.has(vendorId) || enrichmentByVendorId.has(vendorId), n.id).toBe(true)
    }
  })
})

describe('standardIdsInFipsText', () => {
  it('reads the standards an algorithm row names', () => {
    expect(standardIdsInFipsText('FIPS 204')).toEqual(['FIPS 204'])
    expect(standardIdsInFipsText('NIST SP 800-208')).toEqual(['NIST SP 800-208'])
    expect(standardIdsInFipsText('SP 800-56A Rev. 3 (P-curve key agreement)')).toEqual([
      'SP 800-56A Rev. 3',
    ])
    expect(standardIdsInFipsText('FIPS 206 (in development)')).toEqual(['FIPS 206'])
  })

  it('ignores a clause that says the algorithm is not in a standard', () => {
    expect(standardIdsInFipsText('RFC 7748; not a FIPS 186-5 key-agreement approval')).toEqual([
      'RFC 7748',
    ])
    expect(standardIdsInFipsText('Not in ISO parameter list; not in NIST FIPS')).toEqual([])
  })
})
