// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  CATEGORIES,
  WORKSHOP_TOOLS,
  TOOL_COMPONENTS,
  SANDBOX_TOOL_PREFIX,
} from './workshopRegistry'
import { SANDBOX_SCENARIOS } from '@/data/sandboxScenarios'

describe('workshopRegistry — Sandbox facet wiring', () => {
  it("no longer exposes 'Sandbox' as a category (it is a cross-cutting facet)", () => {
    expect(CATEGORIES).not.toContain('Sandbox')
  })

  it('registers a sandbox-facet WorkshopTool, re-homed to a real domain, for every scenario', () => {
    for (const scenario of SANDBOX_SCENARIOS) {
      const toolId = `${SANDBOX_TOOL_PREFIX}${scenario.id}`
      const tool = WORKSHOP_TOOLS.find((t) => t.id === toolId)
      expect(tool, `missing WorkshopTool for ${toolId}`).toBeDefined()
      expect(tool?.name).toBe(scenario.title)
      // Marked as a sandbox scenario…
      expect(tool?.sandbox, `${toolId} must carry sandbox: true`).toBe(true)
      // …but homed in a real domain category, never the removed 'Sandbox' one.
      expect(tool?.category).not.toBe('Sandbox')
      expect(CATEGORIES).toContain(tool?.category)
    }
  })

  it('marks sandbox tools (and only sandbox tools) with the sandbox facet', () => {
    const sandboxIds = new Set(SANDBOX_SCENARIOS.map((s) => `${SANDBOX_TOOL_PREFIX}${s.id}`))
    for (const tool of WORKSHOP_TOOLS) {
      expect(Boolean(tool.sandbox)).toBe(sandboxIds.has(tool.id))
    }
  })

  it('registers a lazy TOOL_COMPONENTS entry for every sandbox scenario', () => {
    for (const scenario of SANDBOX_SCENARIOS) {
      const toolId = `${SANDBOX_TOOL_PREFIX}${scenario.id}`
      expect(TOOL_COMPONENTS[toolId], `missing component for ${toolId}`).toBeDefined()
    }
  })

  it('does not collide sandbox ids with existing native tool ids', () => {
    const nativeIds = WORKSHOP_TOOLS.filter((t) => !t.sandbox).map((t) => t.id)
    for (const scenario of SANDBOX_SCENARIOS) {
      // Raw scenario id ('tls', 'ssh', ...) may collide with a native tool; the
      // prefix is what protects us. This test asserts we actually applied it.
      const prefixed = `${SANDBOX_TOOL_PREFIX}${scenario.id}`
      expect(nativeIds).not.toContain(prefixed)
    }
  })
})

describe('workshopRegistry — visitor-facing honesty invariants', () => {
  // A pre-1.0 tool that renders identically to a finished one tells the visitor
  // nothing about its maturity. PT-029 and PT-030 both shipped at 0.1.0 with no
  // `wip` flag, so the banner in PlaygroundToolRoute never fired for them.
  it('flags every pre-1.0 tool as work-in-progress', () => {
    const unflagged = WORKSHOP_TOOLS.filter((t) => t.version.startsWith('0.') && !t.wip).map(
      (t) => `${t.pt_id} (${t.id}) v${t.version}`
    )
    expect(unflagged, 'pre-1.0 tools must set `wip: true`').toEqual([])
  })

  // NOTE: an over-claiming guard (does a tool advertise crypto it never runs?)
  // was attempted here and removed. Comparing `algorithms` against the tool's
  // own name/keywords only checks metadata against metadata — it flagged
  // openssl-studio, tls-simulator, hybrid-certs and hsm-capacity, all of which
  // genuinely implement what they advertise. A real guard has to resolve each
  // tool's import graph from TOOL_COMPONENTS and inspect the code. Tracked as
  // WS6 in playground-tools-remediation-plan-08112026.md.
})

// B+ round 8, Wave B (2026-09-18) — WS17 tasks 4 and 7c: the "Start here"
// allocation is curated data, so it gets the same drift guards as the rest of
// the registry. Executive and grc are the documented exception to distinctness:
// each has exactly two eligible tools in the registry and they are the same two.
describe('workshopRegistry — Start-here allocation (WS17)', () => {
  const PERSONAS = [
    'executive',
    'grc',
    'developer',
    'architect',
    'researcher',
    'ops',
    'curious',
  ] as const
  const poolFor = (role: (typeof PERSONAS)[number]) => {
    const base = WORKSHOP_TOOLS.filter((t) => !t.sandbox && t.recommendedPersonas.includes(role))
    const curated = base.filter((t) => t.startHere?.includes(role))
    return [...curated, ...base.filter((t) => !curated.includes(t))].slice(0, 3).map((t) => t.id)
  }

  it('startHere only names personas the tool already recommends itself to', () => {
    for (const t of WORKSHOP_TOOLS) {
      for (const p of t.startHere ?? []) {
        expect(
          t.recommendedPersonas,
          `${t.id}: startHere '${p}' not in recommendedPersonas`
        ).toContain(p)
      }
    }
  })

  it('no role has more than three curated picks (the pool shows exactly three)', () => {
    for (const p of PERSONAS) {
      const n = WORKSHOP_TOOLS.filter((t) => t.startHere?.includes(p)).length
      expect(n, `${p} has ${n} startHere picks`).toBeLessThanOrEqual(3)
    }
  })

  it('the seven pools cover at least 16 distinct tools, and only executive/grc share a pool', () => {
    const pools = Object.fromEntries(PERSONAS.map((p) => [p, poolFor(p)]))
    const distinct = new Set(Object.values(pools).flat())
    expect(distinct.size, JSON.stringify(pools)).toBeGreaterThanOrEqual(16)
    for (const a of PERSONAS) {
      for (const b of PERSONAS) {
        if (a >= b) continue
        const same = pools[a].join() === pools[b].join()
        const allowed = new Set([a, b]).has('executive') && new Set([a, b]).has('grc')
        expect(
          same && !allowed,
          `${a} and ${b} open on the same Start-here pool: ${pools[a]}`
        ).toBe(false)
      }
    }
  })
})

describe('workshopRegistry — Wave C intro strip (2026-09-18)', () => {
  const withIntro = WORKSHOP_TOOLS.filter((t) => t.intro)

  it('carries an intro for the eight Wave C tools', () => {
    expect(withIntro.map((t) => t.id).sort()).toEqual(
      [
        'email-signing',
        'kdf-derivation',
        'mls-group-messaging',
        'qrng-demo',
        'rng-demo',
        'solana-flow',
        'source-combining',
        'tee-channel',
      ].sort()
    )
  })

  it('every intro has both lines, each a full sentence', () => {
    for (const t of withIntro) {
      expect(t.intro!.whatYouWillDo.length, t.id).toBeGreaterThan(40)
      expect(t.intro!.workedExample.length, t.id).toBeGreaterThan(40)
      expect(t.intro!.whatYouWillDo.trim().endsWith('.'), `${t.id} whatYouWillDo`).toBe(true)
      expect(t.intro!.workedExample.trim().endsWith('.'), `${t.id} workedExample`).toBe(true)
    }
  })
})
