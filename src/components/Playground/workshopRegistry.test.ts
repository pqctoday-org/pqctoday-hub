// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  CATEGORIES,
  WORKSHOP_TOOLS,
  TOOL_COMPONENTS,
  SANDBOX_TOOL_PREFIX,
} from './workshopRegistry'
import { SANDBOX_SCENARIOS } from '@/data/sandboxScenarios'
import { PLAYGROUND_ROLE_JOURNEYS } from '@/data/playgroundRoleJourneys'

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

  it('states whether every browser tool produces output and specifies that output when it does', () => {
    for (const tool of WORKSHOP_TOOLS.filter((candidate) => !candidate.sandbox)) {
      expect(typeof tool.hasOutput, `${tool.id}: hasOutput`).toBe('boolean')
      if (tool.hasOutput) {
        expect(tool.outputSpec?.length, `${tool.id}: outputSpec`).toBeGreaterThan(40)
      }
    }
  })

  // NOTE: an over-claiming guard (does a tool advertise crypto it never runs?)
  // was attempted here and removed. Comparing `algorithms` against the tool's
  // own name/keywords only checks metadata against metadata — it flagged
  // openssl-studio, tls-simulator, hybrid-certs and hsm-capacity, all of which
  // genuinely implement what they advertise. A real guard has to resolve each
  // tool's import graph from TOOL_COMPONENTS and inspect the code. Tracked as
  // WS6 in playground-tools-remediation-plan-08112026.md.
})

describe('workshopRegistry — canonical role journeys', () => {
  const PERSONAS = Object.keys(PLAYGROUND_ROLE_JOURNEYS) as Array<
    keyof typeof PLAYGROUND_ROLE_JOURNEYS
  >

  it('uses only ready browser tools that recommend the selected role', () => {
    for (const persona of PERSONAS) {
      for (const id of PLAYGROUND_ROLE_JOURNEYS[persona].toolIds) {
        const tool = WORKSHOP_TOOLS.find((candidate) => candidate.id === id)
        expect(tool, `${persona}: missing ${id}`).toBeDefined()
        expect(tool?.sandbox, `${persona}: ${id} must run in the browser`).toBeFalsy()
        expect(tool?.wip, `${persona}: ${id} must be ready`).toBeFalsy()
        expect(tool?.recommendedPersonas, `${persona}: ${id} must recommend the role`).toContain(
          persona
        )
      }
    }
  })

  it('keeps executive and GRC short and every technical or curious path to three tools', () => {
    expect(PLAYGROUND_ROLE_JOURNEYS.executive.toolIds).toHaveLength(2)
    expect(PLAYGROUND_ROLE_JOURNEYS.grc.toolIds).toHaveLength(2)
    for (const persona of PERSONAS.filter((id) => id !== 'executive' && id !== 'grc')) {
      expect(PLAYGROUND_ROLE_JOURNEYS[persona].toolIds, persona).toHaveLength(3)
    }
  })

  it('covers at least 16 distinct tools, with no duplicate role journey', () => {
    const pools = Object.fromEntries(
      PERSONAS.map((persona) => [persona, [...PLAYGROUND_ROLE_JOURNEYS[persona].toolIds]])
    )
    const distinct = new Set(Object.values(pools).flat())
    expect(distinct.size, JSON.stringify(pools)).toBeGreaterThanOrEqual(16)
    for (const a of PERSONAS) {
      for (const b of PERSONAS) {
        if (a >= b) continue
        const same = pools[a].join() === pools[b].join()
        expect(same, `${a} and ${b} have the same journey: ${pools[a]}`).toBe(false)
      }
    }
  })
})

describe('workshopRegistry — Wave C intro strip (2026-09-18)', () => {
  const withIntro = WORKSHOP_TOOLS.filter((t) => t.intro)

  it('carries an intro for the eight Wave C tools and the 25 tracked tools of round 9 (2026-09-19)', () => {
    expect(withIntro.map((t) => t.id).sort()).toEqual(
      [
        'api-security-jwt',
        'bitcoin-flow',
        'cacp-kmip',
        'digital-id',
        'drbg-demo',
        'email-signing',
        'entropy-test',
        'envelope-encrypt',
        'firmware-signing',
        'hd-wallet',
        'hsm-capacity',
        'hybrid-certs',
        'hybrid-encrypt',
        'hybrid-sigs',
        'kdf-derivation',
        'lms-hss',
        'merkle-proof',
        'mls-group-messaging',
        'openssl-studio',
        'pki-enrollment',
        'pki-workshop',
        'pqc-ssh-sim',
        'qrng-demo',
        'rng-demo',
        'slh-dsa',
        'solana-flow',
        'source-combining',
        'suci-flow',
        'tee-channel',
        'tls-simulator',
        'token-migration',
        'tpm-playground',
        'vpn-sim',
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
