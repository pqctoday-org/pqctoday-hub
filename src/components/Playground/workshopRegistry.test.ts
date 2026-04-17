// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  CATEGORIES,
  WORKSHOP_TOOLS,
  TOOL_COMPONENTS,
  SANDBOX_TOOL_PREFIX,
} from './workshopRegistry'
import { SANDBOX_SCENARIOS } from '@/data/sandboxScenarios'

describe('workshopRegistry — Sandbox category wiring', () => {
  it("includes 'Sandbox' in CATEGORIES", () => {
    expect(CATEGORIES).toContain('Sandbox')
  })

  it('registers a WorkshopTool for every sandbox scenario with the sbx- prefix', () => {
    for (const scenario of SANDBOX_SCENARIOS) {
      const toolId = `${SANDBOX_TOOL_PREFIX}${scenario.id}`
      const tool = WORKSHOP_TOOLS.find((t) => t.id === toolId)
      expect(tool, `missing WorkshopTool for ${toolId}`).toBeDefined()
      expect(tool?.category).toBe('Sandbox')
      expect(tool?.name).toBe(scenario.title)
    }
  })

  it('registers a lazy TOOL_COMPONENTS entry for every sandbox scenario', () => {
    for (const scenario of SANDBOX_SCENARIOS) {
      const toolId = `${SANDBOX_TOOL_PREFIX}${scenario.id}`
      expect(TOOL_COMPONENTS[toolId], `missing component for ${toolId}`).toBeDefined()
    }
  })

  it('does not collide sandbox ids with existing native tool ids', () => {
    const nativeIds = WORKSHOP_TOOLS.filter((t) => t.category !== 'Sandbox').map((t) => t.id)
    for (const scenario of SANDBOX_SCENARIOS) {
      // Raw scenario id ('tls', 'ssh', ...) may collide with a native tool; the
      // prefix is what protects us. This test asserts we actually applied it.
      const prefixed = `${SANDBOX_TOOL_PREFIX}${scenario.id}`
      expect(nativeIds).not.toContain(prefixed)
    }
  })
})
