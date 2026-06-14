// SPDX-License-Identifier: GPL-3.0-only
/**
 * Drift guard for the generated Simulation trees. Every leaf must point at a
 * REAL hub resource; if hub coverage changes and a tree goes stale, this fails.
 */
import { describe, it, expect } from 'vitest'
import { SIM_TREES, flattenTree, achievedTreeLevel } from './index'
import { MODULE_CATALOG } from '@/components/PKILearning/moduleData'
import { ARTIFACT_TYPE_TO_TOOL_ID } from '@/components/BusinessCenter/businessToolsRegistry'
import { PHASE_MATURITY } from '@/data/phaseMaturity'

const PHASES = ['p0', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'] as const

describe('SIM_TREES — coverage & shape', () => {
  it('loads a dated tree for all eight lifecycle phases', () => {
    expect(Object.keys(SIM_TREES).sort()).toEqual([...PHASES])
  })

  it('every leaf points at a real hub resource', () => {
    for (const phase of PHASES) {
      const tree = SIM_TREES[phase]!
      for (const band of tree.levels) {
        for (const act of band.activities) {
          expect(act.steps.length, `${phase}/${act.id}: no steps`).toBeGreaterThan(0)
          for (const s of act.steps) {
            expect(s.to.startsWith('/'), `${phase}/${act.id}: bad link ${s.to}`).toBe(true)
            if (s.kind === 'learn') {
              expect(
                MODULE_CATALOG[s.moduleId!],
                `${phase}/${act.id}: unknown module ${s.moduleId}`
              ).toBeDefined()
            } else if (s.kind === 'activity') {
              expect(
                ARTIFACT_TYPE_TO_TOOL_ID[s.artifactType!],
                `${phase}/${act.id}: artifact ${s.artifactType} maps to no tool`
              ).toBeTruthy()
            } else {
              expect(s.refId, `${phase}/${act.id}: reference missing refId`).toBeTruthy()
            }
          }
        }
      }
    }
  })

  it('level bands are ascending, non-empty, and gate/provenance are present', () => {
    for (const phase of PHASES) {
      const tree = SIM_TREES[phase]!
      expect(tree.gate.id, `${phase}: gate id`).toMatch(/^G[0-7]$/)
      expect(tree.gate.criterion, `${phase}: gate criterion`).toBeTruthy()
      expect(tree.generated, `${phase}: generated date`).toMatch(/^\d{8}$/)
      expect(tree.source, `${phase}: source`).toBeTruthy()
      expect(tree.levels.length, `${phase}: no level bands`).toBeGreaterThan(0)
      const levels = tree.levels.map((b) => b.level)
      expect(levels, `${phase}: bands not ascending`).toEqual([...levels].sort((a, b) => a - b))
      expect(new Set(levels).size, `${phase}: duplicate level bands`).toBe(levels.length)
      for (const band of tree.levels) {
        expect(band.activities.length, `${phase}/L${band.level}: empty band`).toBeGreaterThan(0)
        // band indicator matches the framework's maturity indicator for that level
        const fromFramework = PHASE_MATURITY[phase]?.find((l) => l.level === band.level)?.indicator
        expect(band.indicator, `${phase}/L${band.level}: missing indicator`).toBeTruthy()
        if (fromFramework) {
          expect(
            band.indicator.slice(0, 24),
            `${phase}/L${band.level}: indicator drifted from framework`
          ).toBe(fromFramework.slice(0, 24))
        }
        // activity ids belong to this phase number
        for (const act of band.activities)
          expect(
            act.id.startsWith(phase.replace('p', '')),
            `${phase}: stray activity ${act.id}`
          ).toBe(true)
      }
    }
  })

  it('activity ids are unique within a phase', () => {
    for (const phase of PHASES) {
      const ids = flattenTreeIds(phase)
      expect(new Set(ids).size, `${phase}: duplicate activity ids`).toBe(ids.length)
    }
  })

  it('STRICT GATING (all phases 0–7): a band is earned only when every lower band is complete', () => {
    for (const phase of PHASES) {
      const tree = SIM_TREES[phase]!
      const bands = tree.levels
      const stepsOfBands = (n: number) =>
        new Set(bands.slice(0, n).flatMap((b) => b.activities.flatMap((a) => a.steps)))
      for (let j = 0; j < bands.length; j++) {
        // completing bands 0..j fully earns exactly band j's level
        const done = stepsOfBands(j + 1)
        expect(
          achievedTreeLevel(tree, (s) => done.has(s)),
          `${phase}: completing through band ${j} should earn L${bands[j].level}`
        ).toBe(bands[j].level)
        // re-opening ANY single step in the lowest band fails the gate → level 0,
        // even if every higher band is complete (no skipping the gate)
        const firstStep = bands[0].activities[0].steps[0]
        const allButFirst = new Set(stepsOfBands(bands.length))
        allButFirst.delete(firstStep)
        expect(
          achievedTreeLevel(tree, (s) => allButFirst.has(s)),
          `${phase}: an open L${bands[0].level} step must block all higher levels`
        ).toBe(0)
      }
    }
  })

  it('achievedTreeLevel climbs as steps complete (none → all)', () => {
    for (const phase of PHASES) {
      const tree = SIM_TREES[phase]!
      const all = flattenTree(tree)
      expect(
        achievedTreeLevel(tree, () => false),
        `${phase}: empty should be 0`
      ).toBe(0)
      const top = tree.levels[tree.levels.length - 1].level
      expect(
        achievedTreeLevel(tree, () => true),
        `${phase}: full should reach top band`
      ).toBe(top)
      // partial: completing only the first band's steps earns exactly that band
      const firstBandSteps = new Set(tree.levels[0].activities.flatMap((a) => a.steps))
      expect(
        achievedTreeLevel(tree, (s) => firstBandSteps.has(s)),
        `${phase}: first band only`
      ).toBe(tree.levels[0].level)
      expect(all.length).toBeGreaterThan(0)
    }
  })
})

function flattenTreeIds(phase: (typeof PHASES)[number]): string[] {
  const tree = SIM_TREES[phase]!
  return tree.levels.flatMap((b) => b.activities.map((a) => a.id))
}
