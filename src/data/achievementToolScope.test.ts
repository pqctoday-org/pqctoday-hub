// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Scope guard: an achievement that waits for a Playground tool id nothing
 * records can never be earned. 'playground-hsm' sat in exactly that state
 * from v2.94.2 (PKCS#11 Walkthrough removed) until 2026-11-19, and every
 * existing ladder test stayed green because none of them asked whether the
 * tool still exists.
 */
import { describe, it, expect } from 'vitest'
import { ACHIEVEMENT_CATALOG, ACHIEVEMENT_MAP, HSM_PLAYGROUND_TOOL_ID } from './achievementCatalog'
import { WORKSHOP_TOOLS } from '@/components/Playground/workshopRegistry'
import type { ActivitySnapshot } from '@/types/AchievementTypes'

/** Ids recorded by dedicated routes outside WORKSHOP_TOOLS. */
const RECORDED_OUTSIDE_REGISTRY = new Set([HSM_PLAYGROUND_TOOL_ID])
/** Retired tool ids still accepted so badges earned before removal keep counting. */
const RETIRED_TOOL_IDS = new Set(['pkcs11-sim'])

const recordable = new Set([...WORKSHOP_TOOLS.map((t) => t.id), ...RECORDED_OUTSIDE_REGISTRY])

function toolIdsIn(condition: (s: ActivitySnapshot) => boolean): string[] {
  return [...condition.toString().matchAll(/playgroundToolsUsed\.includes\(\s*(["'])([^"']+)\1/g)]
    .map((m) => m[2])
    .concat(
      /playgroundToolsUsed\.includes\(\s*HSM_PLAYGROUND_TOOL_ID/.test(condition.toString())
        ? [HSM_PLAYGROUND_TOOL_ID]
        : []
    )
}

describe('achievement tool scope', () => {
  const toolGated = ACHIEVEMENT_CATALOG.filter((a) => toolIdsIn(a.condition).length > 0)

  it('finds the tool-gated achievements (guards the parser itself)', () => {
    expect(toolGated.map((a) => a.id)).toEqual(
      expect.arrayContaining(['playground-hsm', 'playground-hybrid'])
    )
  })

  it.each(toolGated.map((a) => [a.id, a] as const))(
    '%s waits only for tools that exist or are retired',
    (_id, a) => {
      for (const t of toolIdsIn(a.condition)) {
        expect(recordable.has(t) || RETIRED_TOOL_IDS.has(t), `${a.id} -> ${t}`).toBe(true)
      }
    }
  )

  it.each(toolGated.map((a) => [a.id, a] as const))(
    '%s can be earned with a tool that is recorded today',
    (_id, a) => {
      expect(toolIdsIn(a.condition).some((t) => recordable.has(t))).toBe(true)
    }
  )

  it('HSM Operator unlocks from the HSM Playground and still honours the retired id', () => {
    const base = { playgroundToolsUsed: [] as string[] } as unknown as ActivitySnapshot
    const hsm = ACHIEVEMENT_MAP['playground-hsm']
    expect(hsm.condition({ ...base, playgroundToolsUsed: [HSM_PLAYGROUND_TOOL_ID] })).toBe(true)
    expect(hsm.condition({ ...base, playgroundToolsUsed: ['pkcs11-sim'] })).toBe(true)
    expect(hsm.condition(base)).toBe(false)
  })
})
