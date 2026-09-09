// SPDX-License-Identifier: GPL-3.0-only
/**
 * Drift guard for the generated Simulation trees. Every leaf must point at a
 * REAL hub resource; if hub coverage changes and a tree goes stale, this fails.
 */
import { describe, it, expect } from 'vitest'
import { SIM_TREES, flattenTree, achievedTreeLevel, isGatingStep, type TreeStep } from './index'
import { SANDBOX_SCENARIOS } from '@/data/sandboxScenarios'
import { MODULE_CATALOG } from '@/components/PKILearning/moduleData'
import { ARTIFACT_TYPE_TO_TOOL_ID } from '@/components/BusinessCenter/businessToolsRegistry'
import { isKnownMetric } from './runMetrics'
import { WORKSHOP_TOOL_COMPONENTS } from '@/components/Simulation/resourceContract'
import { PHASE_MATURITY } from '@/data/phaseMaturity'
import { FRAMEWORK_VERSION, PHASE_ORDER } from '@/data/frameworkPhases'
import { resolveDeepLink } from './deepLinks'
import { REFERENCE_PHASES } from '@/data/phaseResourceMap'
import { resLinks } from '@/components/Simulation/sections'
import { FRAMEWORK_PHASES, type PhaseId } from '@/data/frameworkPhases'
import { VERTICAL_BY_SECTOR } from '@/data/simRelevance'

const PHASES = ['p0', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'] as const
// Foundations (spanning band) and verify-close (terminal Verification & Closure
// band) are real, playable trees — they get the resource-validity, framework-
// version and deep-link guards via ALL_TREE_PHASES — but are exempt from the
// numbered-gate / activity-id-prefix / strict-gating invariants below (by design
// foundations has gate 'GF'/'F.x' ids and verify-close has gate 'G8'/'VC.x' ids).
const ALL_TREE_PHASES = [...PHASES, 'foundations', 'verify-close'] as const

describe('SIM_TREES — coverage & shape', () => {
  it('loads a dated tree for all eight phases + Foundations + Verification & Closure', () => {
    expect(Object.keys(SIM_TREES).sort()).toEqual([...ALL_TREE_PHASES].sort())
  })

  // GUARD (PR5): every framework phase is tree-backed, which is what makes the
  // removed `checks` fallback in levelOf safe. If a phase ever loses its tree,
  // the engine would fall through to evidenceLevel — this fails loudly first.
  it('covers every PHASE_ORDER phase so progression has one representation', () => {
    for (const p of PHASE_ORDER) {
      expect(SIM_TREES[p], `phase ${p} must be tree-backed`).toBeDefined()
    }
  })

  it('every leaf points at a real hub resource', () => {
    for (const phase of ALL_TREE_PHASES) {
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
            } else if (s.kind === 'workshop') {
              expect(
                WORKSHOP_TOOL_COMPONENTS[s.workshopId!],
                `${phase}/${act.id}: workshop ${s.workshopId} maps to no Playground tool`
              ).toBeTruthy()
              expect(
                s.to.startsWith('/playground/'),
                `${phase}/${act.id}: workshop link ${s.to} is not a /playground/ page`
              ).toBe(true)
            } else if (s.kind === 'catalog') {
              // C7: catalog steps embed the Migrate view (valid /migrate link) and
              // carry a stable catalogId so completion is earned per-task.
              expect(
                s.to === '/migrate',
                `${phase}/${act.id}: catalog step to must be '/migrate', got '${s.to}'`
              ).toBe(true)
              expect(
                s.catalogId,
                `${phase}/${act.id}: catalog step missing a catalogId (needed for per-task completion)`
              ).toBeTruthy()
            } else if (s.kind === 'scenario') {
              // C3: live sandbox lab — scenarioId must be a real sandbox scenario and
              // the link the standalone /playground/sbx-<id> fallback page.
              expect(
                SANDBOX_SCENARIOS.some((sc) => sc.id === s.scenarioId),
                `${phase}/${act.id}: scenario ${s.scenarioId} is not in SANDBOX_SCENARIOS`
              ).toBe(true)
              expect(
                s.to === `/playground/sbx-${s.scenarioId}`,
                `${phase}/${act.id}: scenario link ${s.to} should be /playground/sbx-${s.scenarioId}`
              ).toBe(true)
            } else if (s.kind === 'architecture') {
              // WS-04: ArchitecturePanel embeds in-place — no external resource id,
              // just a positive cumulative-decision threshold.
              expect(
                s.minDecisions && s.minDecisions > 0,
                `${phase}/${act.id}: architecture step needs a positive minDecisions`
              ).toBeTruthy()
              expect(
                s.to === '/simulation',
                `${phase}/${act.id}: architecture link ${s.to} should be '/simulation'`
              ).toBe(true)
            } else if (s.kind === 'measure') {
              // W2.5: a measure step names a KNOWN metric and a threshold. An
              // unknown metric would fail closed at runtime, but it should fail
              // loudly here instead of shipping an uncompletable band.
              expect(
                s.metricId && isKnownMetric(s.metricId),
                `${phase}/${act.id}: measure step needs a known metricId (got ${s.metricId})`
              ).toBeTruthy()
              expect(
                typeof s.minValue === 'number' && s.minValue > 0,
                `${phase}/${act.id}: measure step needs a positive minValue`
              ).toBe(true)
            } else if (s.kind === 'recurrence') {
              // W2.4: a recurrence step names the artifact it re-operates and
              // how many later reporting periods must pass. It is NOT an
              // activity step and must not carry artifactType, or it would
              // satisfy an activity gate it never earned.
              expect(
                s.recurrenceOf && ARTIFACT_TYPE_TO_TOOL_ID[s.recurrenceOf],
                `${phase}/${act.id}: recurrence step needs a real recurrenceOf artifact`
              ).toBeTruthy()
              expect(
                (s.recurrenceQuarters ?? 0) > 0,
                `${phase}/${act.id}: recurrence step needs a positive recurrenceQuarters`
              ).toBe(true)
              expect(
                s.artifactType,
                `${phase}/${act.id}: recurrence step must not carry artifactType`
              ).toBeUndefined()
            } else {
              expect(s.refId, `${phase}/${act.id}: reference missing refId`).toBeTruthy()
            }
          }
        }
      }
    }
  })

  it('WS2: the four sandbox-lab (scenario) steps are present (p5 & p6)', () => {
    const ids = ALL_TREE_PHASES.flatMap((p) => flattenTree(SIM_TREES[p]!))
      .filter((s) => s.kind === 'scenario')
      .map((s) => s.scenarioId)
      .sort()
    expect(ids).toEqual(['ab-handshake-bench', 'cloud-kms', 'migration-impact', 'pki'])
  })

  it('WS2: scenario (lab) steps are BONUS — they never gate a band', () => {
    // A band whose only incomplete step is a scenario still earns: isGatingStep
    // excludes scenarios, so an unavailable sandbox can never block a maturity level.
    const tree = {
      phase: 'p5',
      generated: '0',
      source: 'x',
      pitfalls: [],
      levels: [
        {
          level: 2,
          indicator: 'i',
          activities: [
            {
              id: '5.3',
              title: 't',
              steps: [
                {
                  kind: 'activity',
                  label: 'a',
                  to: '/business/tools/deployment-playbook',
                  artifactType: 'deployment-playbook',
                },
                { kind: 'scenario', label: 'lab', to: '/playground/sbx-pki', scenarioId: 'pki' },
              ],
            },
          ],
        },
      ],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any
    // only the non-scenario step is "done" — the band still earns L2.
    expect(achievedTreeLevel(tree, (s) => s.kind !== 'scenario')).toBe(2)
    expect(isGatingStep({ kind: 'scenario', label: '', to: '', scenarioId: 'pki' })).toBe(false)
    expect(isGatingStep({ kind: 'activity', label: '', to: '' })).toBe(true)
  })

  it('P6-DD: deepDive steps are optional — never gate a band (07052026)', () => {
    // achievedTreeLevel/isGatingStep only ever read `a.steps` — `a.deepDive` is a
    // second, parallel array that must never enter the gating calculation. A band
    // whose `steps` are all done, but whose `deepDive` steps are left untouched
    // (isDone always false below), must still earn its level.
    const tree = {
      phase: 'p6',
      generated: '0',
      source: 'x',
      pitfalls: [],
      levels: [
        {
          level: 2,
          indicator: 'i',
          activities: [
            {
              id: '6.1',
              title: 't',
              steps: [
                { kind: 'learn', label: 'required', to: '/learn/pki-workshop', moduleId: 'x' },
              ],
              deepDive: [
                { kind: 'workshop', label: 'bonus', to: '/playground/x', workshopId: 'x' },
              ],
            },
          ],
        },
      ],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any
    expect(achievedTreeLevel(tree, () => false)).toBe(0) // required step not done → not earned
    expect(achievedTreeLevel(tree, (s) => s.kind === 'learn')).toBe(2) // deepDive ignored → earned
  })

  it('P6-DD: the shipped P6 tree carries deep-dive content that never gates', () => {
    const p6 = SIM_TREES.p6!
    const withDeepDive = p6.levels.flatMap((b) => b.activities).filter((a) => a.deepDive?.length)
    // The 5 ORIGINAL P6 activities (6.1-6.5) each carry deep-dive content. The
    // two W2.4 adaptations deliberately do not: deep-dive is optional extra
    // reading, and these bands are about operating an activity again, not
    // about more material to read.
    expect(
      withDeepDive.length,
      'expected every original P6 activity to carry deep-dive content'
    ).toBe(5)
    // No deepDive step duplicates a required step already in `steps` for that
    // activity — keyed by (kind, id), NOT bare id. A learn moduleId and a
    // workshop workshopId can legitimately share the same string (e.g.
    // 'pki-workshop' names both the Learn module and the separate Playground
    // tool) without being the same real resource: completion is tracked in
    // entirely different state (moduleProgress vs visitedWorkshops), so doing
    // one is never redundant with doing the other. Only a genuine same-kind
    // repeat (e.g. two workshop steps both 'pki-enrollment') should be caught.
    const stepKey = (s: TreeStep) => `${s.kind}:${s.moduleId ?? s.workshopId ?? s.refId}`
    for (const a of withDeepDive) {
      const requiredKeys = new Set(a.steps.map(stepKey))
      for (const s of a.deepDive!) {
        expect(
          requiredKeys.has(stepKey(s)),
          `${a.id}: deepDive ${stepKey(s)} duplicates a required step`
        ).toBe(false)
      }
    }
    // deepDive never widens what's needed to reach L2/L3 — achievedTreeLevel with
    // only the required steps satisfied still reaches the top band P6 ships.
    const requiredOnlyDone = (s: TreeStep) =>
      p6.levels.some((b) => b.activities.some((a) => a.steps.includes(s)))
    // W2.4: P6 gained an L1 awareness band and an L4 capacity/monitoring band,
    // so completing every REQUIRED step now reaches the framework's top band.
    // Before W2.4 this read 3 because the tree simply had no L4 to earn.
    expect(achievedTreeLevel(p6, requiredOnlyDone)).toBe(4)
  })

  it('P6-DD: flattenTree stamps deepDive steps `optional` so isGatingStep excludes them', () => {
    // Regression: flattenTree merges `deepDive` into the flat list (so drift-guard
    // tests validate the ids), but several REAL consumers do
    // `flattenTree(tree).filter(isGatingStep)` expecting only the required path
    // (simAutoRun's gatingStepsForPhase for the "PLAY ALL 9" walkthrough; the
    // board's stepsTotal/stepsDone progress counter). Before this fix, P6 showed
    // "0/23" instead of the correct "0/14" — deep-dive steps were leaking in as
    // if gating. This asserts the flattened, gating-filtered count matches the
    // required-only count, using the real shipped P6 tree.
    const p6 = SIM_TREES.p6!
    const flattenedGating = flattenTree(p6).filter(isGatingStep)
    const requiredOnly = p6.levels.flatMap((b) =>
      b.activities.flatMap((a) => a.steps.filter(isGatingStep))
    )
    expect(flattenedGating.length).toBe(requiredOnly.length)
    // every deepDive-sourced step, once flattened, is excluded by isGatingStep
    const deepDiveSteps = p6.levels.flatMap((b) => b.activities.flatMap((a) => a.deepDive ?? []))
    expect(deepDiveSteps.length).toBeGreaterThan(0)
    for (const s of flattenTree(p6)) {
      const isDeepDiveId =
        deepDiveSteps.some((d) => d.to === s.to) && !requiredOnly.some((r) => r.to === s.to)
      if (isDeepDiveId) expect(isGatingStep(s), `${s.to} should not be a gating step`).toBe(false)
    }
  })

  it('WS-11: every tree is pinned to the current framework version', () => {
    for (const phase of ALL_TREE_PHASES) {
      const tree = SIM_TREES[phase]!
      expect(
        tree.source.includes(FRAMEWORK_VERSION),
        `${phase}: tree source "${tree.source}" is not pinned to framework ${FRAMEWORK_VERSION} — ` +
          `the framework version moved ahead of the snapshots. Regenerate the sim trees ` +
          `(node scripts/gen-sim-trees.mjs) so each PhaseTree.source carries ${FRAMEWORK_VERSION}.`
      ).toBe(true)
    }
  })

  it('WS-06: every tree leaf deep-link resolves to a real route + valid params', () => {
    for (const phase of ALL_TREE_PHASES) {
      for (const s of flattenTree(SIM_TREES[phase]!)) {
        const res = resolveDeepLink(s.to)
        expect(res.ok, `${phase}: ${s.to} — ${res.reason ?? ''}`).toBe(true)
      }
    }
  })

  it('WS-06: every REFERENCE_PHASES deepUrl resolves (params + path)', () => {
    for (const [id, ref] of Object.entries(REFERENCE_PHASES)) {
      const res = resolveDeepLink(ref.deepUrl)
      expect(res.ok, `ref ${id}: ${ref.deepUrl} — ${res.reason ?? ''}`).toBe(true)
    }
  })

  it('WS-06: every resLinks-generated target resolves (catches link-template drift)', () => {
    // Run across phases + legs and a spread of scenarios so all generated links
    // (learn / business / playground / reference) get validated.
    const scenarios: [string, string][] = [
      ['healthcare', 'executive'],
      ['financial', 'architect'],
      ['telecom', 'ops'],
    ]
    for (const phase of PHASES) {
      for (const leg of ['learn', 'activities', 'reference'] as const) {
        for (const [sector, seat] of scenarios) {
          for (const item of resLinks(leg, phase, sector, seat)) {
            const res = resolveDeepLink(item.to)
            expect(res.ok, `${phase}/${leg}: ${item.to} — ${res.reason ?? ''}`).toBe(true)
          }
        }
      }
    }
  })

  it('level bands are ascending, non-empty, and gate/provenance are present', () => {
    for (const phase of PHASES) {
      const tree = SIM_TREES[phase]!
      // p7 (Vendor & Supply Chain) is CONTINUOUS in the framework (no one-time
      // gate); every other lifecycle phase has a numbered gate G0–G6.
      if (tree.gate) {
        expect(tree.gate.id, `${phase}: gate id`).toMatch(/^G[0-6]$/)
        expect(tree.gate.criterion, `${phase}: gate criterion`).toBeTruthy()
      } else {
        expect(phase, `${phase}: only the continuous p7 may be gateless`).toBe('p7')
      }
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

  // 07082026 audit finding: frameworkPhases.ts's `produce` lists had drifted
  // from what the shipped trees actually gate on — P0 was missing 3 tools, P6
  // had a stale ref name. This is the general guard: every 'activity' step a
  // phase's tree actually gates on must have a matching produce entry for that
  // phase. Tree-grounded (not registry-tag-grounded — see the note in
  // frameworkPhaseTags.test.ts for why the tag-based version false-positived).
  //
  // Some tools are legitimately gated on by MORE THAN ONE phase's tree (e.g. the
  // board KPI pack is touched at P0 0.4, Foundations F.2, P4 4.4 and P7 7.5) —
  // frameworkPhaseTags.test.ts's spine-consistency check means a produce ref can
  // only be "owned" by one phase, so the others gate on it without listing it.
  // Each entry here is a verified, intentional instance of that — a NEW,
  // undocumented gap for any other tool still fails the guard.
  const SHARED_TOOL_OWNER: Record<string, PhaseId> = {
    'kpi-dashboard': 'foundations', // also gated by p0 (0.4), p4 (4.4), p7 (7.5)
    'raci-builder': 'p0', // also gated by p4 (4.4)
    'crypto-vulnerability-watch': 'p1', // also gated by p2 (2.3)
    'deployment-playbook': 'p5', // also gated by p7 (7.4)
    'risk-register': 'p3', // also gated by p7 (7.4)
    'stakeholder-comms': 'p4', // also gated by p7 (7.6)
    'cost-model-explorer': 'p0', // also gated by p4 (4.2, Wave 3 — re-cost against the firm roadmap)
    'data-at-rest-strategy': 'p5', // also gated by verify-close (VC.2, Wave 3 — confirm the re-encrypt-first sequencing at closure)
    'initial-scoping': 'p0', // also gated by p1 (1.0, 07192026 — refine the scoping doc with risk-driven prioritization)
    'kpi-tracker': 'foundations', // also gated by p4 (4.5-4.6, 07192026 — track the roadmap on a quarterly cadence)
  }
  it("every tree artifact-step has a matching produce entry in that phase's frameworkPhases.ts", () => {
    const missing: string[] = []
    for (const phase of PHASES) {
      const toolIds = new Set(
        flattenTree(SIM_TREES[phase]!)
          .filter((s) => s.kind === 'activity' && s.artifactType)
          .map((s) => ARTIFACT_TYPE_TO_TOOL_ID[s.artifactType!])
          .filter((id): id is string => !!id)
      )
      const produceRefs = new Set((FRAMEWORK_PHASES[phase].produce ?? []).map((s) => s.ref))
      for (const id of toolIds) {
        if (produceRefs.has(id)) continue
        if (SHARED_TOOL_OWNER[id] && SHARED_TOOL_OWNER[id] !== phase) continue // known shared tool
        missing.push(`${phase}: tree gates on '${id}', not in produce`)
      }
    }
    expect(missing, `tree → produce drift:\n${missing.join('\n')}`).toEqual([])
  })
  it('SHARED_TOOL_OWNER only lists tools genuinely gated on by more than one phase', () => {
    // Guards the exceptions list itself: an entry that stops being shared (or
    // was never accurate) should be caught, not silently keep masking phases.
    for (const [toolId, owner] of Object.entries(SHARED_TOOL_OWNER)) {
      const gatingPhases = ALL_TREE_PHASES.filter((phase) =>
        flattenTree(SIM_TREES[phase]!).some(
          (s) => s.kind === 'activity' && ARTIFACT_TYPE_TO_TOOL_ID[s.artifactType!] === toolId
        )
      )
      expect(
        gatingPhases.length,
        `'${toolId}': expected >1 gating phase, got [${gatingPhases}]`
      ).toBeGreaterThan(1)
      expect(gatingPhases, `'${toolId}': owner '${owner}' does not actually gate on it`).toContain(
        owner
      )
    }
  })

  // 07082026 audit finding (fixed in this same change — P5's automotive-pqc
  // deep-dive removed): any tree step whose id is a VERTICAL_BY_SECTOR key with
  // an empty sector list can never be shown to a player (relevantToScenario
  // always returns false), so it must never be tree content — the deep-dive
  // render path doesn't apply the relevance filter the main resource columns do.
  it('no tree step references a module permanently excluded by simRelevance (empty sector list)', () => {
    const neverRelevant = new Set(
      Object.entries(VERTICAL_BY_SECTOR)
        .filter(([, sectors]) => sectors.length === 0)
        .map(([id]) => id)
    )
    const bad: string[] = []
    for (const phase of ALL_TREE_PHASES) {
      for (const s of flattenTree(SIM_TREES[phase]!)) {
        const id = s.moduleId ?? s.workshopId
        if (id && neverRelevant.has(id)) bad.push(`${phase}: step "${s.label}" uses "${id}"`)
      }
    }
    expect(
      bad,
      `tree steps referencing permanently-irrelevant modules:\n${bad.join('\n')}`
    ).toEqual([])
  })

  // 07082026 audit finding (fixed in this same change — Foundations F.5 and
  // its two closure-duplicate pitfalls replaced with genuine cross-cutting
  // content): Foundations is meant to be distinct material, not a pointer back
  // into a phase that already exists. Guards the specific failure mode (a
  // whole pitfall duplicated verbatim), not incidental short-phrase overlap.
  it('foundations does not duplicate verify-close pitfall content', () => {
    const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim()
    const vcWhy = new Set((SIM_TREES['verify-close']?.pitfalls ?? []).map((p) => normalize(p.why)))
    const dupes = (SIM_TREES.foundations?.pitfalls ?? [])
      .filter((p) => vcWhy.has(normalize(p.why)))
      .map((p) => p.title)
    expect(
      dupes,
      `foundations pitfalls duplicate verify-close verbatim:\n${dupes.join('\n')}`
    ).toEqual([])
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
