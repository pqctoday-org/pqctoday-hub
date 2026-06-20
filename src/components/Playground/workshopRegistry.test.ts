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
