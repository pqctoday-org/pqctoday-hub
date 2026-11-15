// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Every artifact type with no Command Center builder must name the page that
 * makes it, and that page must be a real route. The route set is read from
 * App.tsx, the same way the other route checks in this repo read it.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ORPHAN_ARTIFACT_TYPES, ZONE_ARTIFACT_TYPES } from './cswp39StepMapping'
import {
  ARTIFACT_PRODUCERS,
  artifactProducerFor,
  producerHref,
  producerNote,
} from './artifactProducers'
import { MANIFESTS } from '@/components/PKILearning/manifest/registry'
import { RUN_TOOLS } from '@/data/runTools'
import { WORKSHOP_TOOLS } from '@/components/Playground/workshopRegistry'

const APP_SOURCE = readFileSync(join(process.cwd(), 'src/App.tsx'), 'utf8')
/** Every `path="…"` segment declared in App.tsx, top-level and nested. */
const APP_ROUTE_SEGMENTS = new Set(
  [...APP_SOURCE.matchAll(/path="\/?([a-z0-9-]+)(?:\/\*)?"/g)].map((m) => m[1])
)
const LEARN_MODULE_IDS = new Set(MANIFESTS.map((m) => m.id))
const PLAYGROUND_TOOL_IDS = new Set(WORKSHOP_TOOLS.map((t) => t.id))

/** True when `to` names a route the router declares. */
function resolvesToRealRoute(to: string): boolean {
  const [head, second, ...rest] = to.split('/').filter(Boolean)
  if (!head || !APP_ROUTE_SEGMENTS.has(head)) return false
  if (head === 'learn') return !!second && rest.length === 0 && LEARN_MODULE_IDS.has(second)
  if (head === 'playground') {
    if (!second) return rest.length === 0
    return rest.length === 0 && (PLAYGROUND_TOOL_IDS.has(second) || APP_ROUTE_SEGMENTS.has(second))
  }
  return !second && rest.length === 0
}

describe('artifact producers', () => {
  it('every orphan type has a producer entry, and no other type does', () => {
    expect(Object.keys(ARTIFACT_PRODUCERS).sort()).toEqual([...ORPHAN_ARTIFACT_TYPES].sort())
    for (const type of ORPHAN_ARTIFACT_TYPES) {
      expect(artifactProducerFor(type), type).not.toBeNull()
    }
  })

  it('orphan types stay in their zone bucket, so the zone map still lists them', () => {
    const bucketed = new Set(Object.values(ZONE_ARTIFACT_TYPES).flat())
    for (const type of ORPHAN_ARTIFACT_TYPES) {
      expect(bucketed.has(type), type).toBe(true)
    }
  })

  it('every producer route resolves to a real route', () => {
    for (const [type, producer] of Object.entries(ARTIFACT_PRODUCERS)) {
      expect(resolvesToRealRoute(producer.to), `${type} → ${producer.to}`).toBe(true)
    }
  })

  it('every producer panel anchor names an id the page renders', () => {
    const panelSources: Record<string, string> = {
      '#architecture-pack': 'src/components/BusinessCenter/ArchitecturePackPanel.tsx',
      '#operations-pack': 'src/components/BusinessCenter/OperationsPackPanel.tsx',
      '#research-workspace': 'src/components/shared/research/ResearchWorkspacePanel.tsx',
    }
    for (const producer of Object.values(ARTIFACT_PRODUCERS)) {
      if (!producer.hash) continue
      const file = panelSources[producer.hash]
      expect(file, `no panel source for ${producer.hash}`).toBeTruthy()
      const src = readFileSync(join(process.cwd(), file), 'utf8')
      const id = producer.hash.slice(1)
      // Either a literal `id="…"`, or a named constant holding the id (research panel).
      const rendered = src.includes(`id="${id}"`) || src.includes(`'${id}'`)
      expect(rendered, `${file} renders ${producer.hash}`).toBe(true)
    }
  })

  it('pack producers link only for their own persona, and the link goes to the panel', () => {
    const architecture = ARTIFACT_PRODUCERS['architecture-scope']
    expect(producerHref(architecture, 'architect')).toBe('/business#architecture-pack')
    expect(producerHref(architecture, 'executive')).toBeNull()
    expect(producerHref(architecture, null)).toBeNull()
    expect(producerHref(ARTIFACT_PRODUCERS['ops-scope'], 'ops')).toBe('/business#operations-pack')
    expect(producerHref(ARTIFACT_PRODUCERS['claim-matrix'], 'researcher')).toBe(
      '/business#research-workspace'
    )
  })

  it('pack producers say which role the panel is shown for', () => {
    expect(producerNote(ARTIFACT_PRODUCERS['architecture-decision-record'])).toBe(
      'Made in the Architecture pack, shown on this page for the Architect role'
    )
  })

  it('other producers link to their page whatever the persona', () => {
    expect(producerHref(ARTIFACT_PRODUCERS['hsm-capacity-plan'], 'executive')).toBe(
      '/playground/hsm-capacity'
    )
    expect(producerHref(ARTIFACT_PRODUCERS['kmip-quick-run'], null)).toBe(
      '/playground/cacp?tab=migration'
    )
    expect(producerNote(ARTIFACT_PRODUCERS['hsm-capacity-plan'])).toBe(
      'Made in the HSM capacity calculator'
    )
  })

  it('run manifests name every kind of tool that saves them, and link to one of those tools', () => {
    const run = ARTIFACT_PRODUCERS['run-manifest']
    // Saved by the Playground tools, the Entropy evidence lab and OpenSSL Studio.
    expect(run.label).toMatch(/Playground/)
    expect(run.label).toMatch(/OpenSSL Studio/)
    expect(RUN_TOOLS.map((t) => t.path)).toContain(run.to)
  })
})
