// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { SIM_PLAYBOOK } from './simPlaybook'
import { MODULE_CATALOG } from '@/components/PKILearning/moduleData'
import { ARTIFACT_TYPE_TO_TOOL_ID } from '@/components/BusinessCenter/businessToolsRegistry'

describe('simPlaybook', () => {
  it('every phase has well-formed steps pointing at real resources', () => {
    for (const [phase, steps] of Object.entries(SIM_PLAYBOOK)) {
      expect(steps!.length, `${phase}: no steps`).toBeGreaterThan(0)
      for (const s of steps!) {
        expect(s.to.startsWith('/'), `${phase}: bad link ${s.to}`).toBe(true)
        if (s.kind === 'learn') {
          expect(s.moduleId, `${phase}: learn step missing moduleId`).toBeTruthy()
          expect(
            MODULE_CATALOG[s.moduleId!],
            `${phase}: unknown module ${s.moduleId}`
          ).toBeDefined()
        }
        if (s.kind === 'activity') {
          expect(s.artifactType, `${phase}: activity missing artifactType`).toBeTruthy()
          expect(
            ARTIFACT_TYPE_TO_TOOL_ID[s.artifactType!],
            `${phase}: artifact ${s.artifactType} maps to no tool`
          ).toBeTruthy()
        }
        if (s.kind === 'reference')
          expect(s.refId, `${phase}: reference missing refId`).toBeTruthy()
      }
    }
  })

  it('covers all eight lifecycle phases', () => {
    expect(Object.keys(SIM_PLAYBOOK).sort()).toEqual([
      'p0',
      'p1',
      'p2',
      'p3',
      'p4',
      'p5',
      'p6',
      'p7',
    ])
  })
})
