// SPDX-License-Identifier: GPL-3.0-only
/**
 * Data-preservation proof for the store v15 → v16 migration.
 *
 * Two Skills & Team workshop steps both saved `skills-team-structure::
 * skills-team-plan`, and `addExecutiveDocument` keys on `moduleId::type`, so
 * one step's draft silently replaced the other's. v16 gives each step its own
 * `ExecutiveDocumentType` — which means every draft a user already holds has
 * to be re-typed, and re-typing saved user work is exactly the operation the
 * repo's persistence conventions say must never lose anything.
 *
 * This spec is that proof. It drives the REAL migrate ladder out of
 * `persist.getOptions()` (not a re-implementation) over realistic
 * `pki-module-storage` payloads covering every shape that exists in the wild:
 *
 *   - bare, pre-scope drafts (written before the WS6 follow-up added `inputs`)
 *   - `__artifactScope`-stamped drafts (written after it)
 *   - the standalone Command Center tool's own `skills-team-plan` draft
 *   - a store holding two colliding drafts at once (import / hand-edited file)
 *   - a store with no artifacts at all
 *   - corrupted / partial payloads
 *
 * and asserts, per scenario, that the document count is unchanged, that every
 * draft ends up under its OWN tool's key, that no draft is dropped, merged, or
 * mis-typed, and that the payload (`data` / `inputs` / `title`) survives byte
 * for byte.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useModuleStore } from './useModuleStore'
import { TYPE_LABELS } from '@/data/artifactLabels'
import { PILLAR_FOR_TYPE, ZONE_FOR_TYPE } from '@/components/BusinessCenter/lib/cswp39StepMapping'
import type { ExecutiveDocument, ExecutiveDocumentType } from '@/services/storage/types'

vi.mock('../utils/analytics', () => ({
  logModuleStart: vi.fn(),
  logModuleComplete: vi.fn(),
  logStepComplete: vi.fn(),
  logArtifactGenerated: vi.fn(),
}))

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDoc = Record<string, any>

/** The real ladder, exactly as rehydrate and importProgress call it. */
function runMigrate(state: unknown, fromVersion: number): AnyDoc {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const migrate = (useModuleStore.persist.getOptions() as any).migrate
  expect(migrate, 'store must declare a migrate() — persistence convention').toBeTypeOf('function')
  return migrate(JSON.parse(JSON.stringify(state)), fromVersion)
}

const CHAMPION_MD = `# Crypto Champion Program Roster

Generated: 3/4/2026

| Platform | Champion | Foundations | Briefings | Sign-off | Upgrades |
|----------|----------|-------------|-----------|----------|----------|
| Payments | Dana Okafor | ✓ | ✓ | — | ✓ |
`

const SIZING_MD = `# PQC Team Sizing Plan

Generated: 3/4/2026

- **Cryptographic instances (CBOM):** 7,400
- **Phase:** First two years (discovery, CBOM, risk scoring, pilot)
- **Estimated total program FTEs:** 16
`

const TOOL_MD = `# Skills & Team Plan\n\nStandalone Command Center tool export.\n`

/** Pre-WS6 draft: no `inputs` at all — the shape that shipped in f8e3ac5f4. */
function bareChampionDraft(createdAt = 1_770_000_000_000): AnyDoc {
  return {
    id: `champions-${createdAt}`,
    moduleId: 'skills-team-structure',
    type: 'skills-team-plan',
    title: 'Crypto Champion Program Roster',
    data: CHAMPION_MD,
    createdAt,
  }
}

function bareSizingDraft(createdAt = 1_770_000_100_000): AnyDoc {
  return {
    id: `skills-team-${createdAt}`,
    moduleId: 'skills-team-structure',
    type: 'skills-team-plan',
    title: 'PQC Team Sizing Plan',
    data: SIZING_MD,
    createdAt,
  }
}

/** Post-WS6-follow-up draft: `inputs` carrying the `__artifactScope` stamp. */
function scopedChampionDraft(createdAt = 1_775_000_000_000): AnyDoc {
  return {
    id: `champions-${createdAt}`,
    moduleId: 'skills-team-structure',
    type: 'skills-team-plan',
    title: 'Crypto Champion Program Roster',
    data: CHAMPION_MD,
    createdAt,
    updatedAt: createdAt,
    revisions: [],
    approvalStatus: 'draft',
    inputs: {
      rows: {
        Payments: {
          name: 'Dana Okafor',
          trained: true,
          briefings: true,
          signOff: false,
          upgrades: true,
        },
      },
      __artifactScope: 'skills-team-crypto-champions',
    },
  }
}

function scopedSizingDraft(createdAt = 1_775_000_100_000): AnyDoc {
  return {
    id: `skills-team-${createdAt}`,
    moduleId: 'skills-team-structure',
    type: 'skills-team-plan',
    title: 'PQC Team Sizing Plan',
    data: SIZING_MD,
    createdAt,
    updatedAt: createdAt,
    revisions: [],
    approvalStatus: 'draft',
    inputs: {
      instances: 7400,
      phase: 'firstTwoYears',
      otInScope: true,
      seedCleared: true,
      __artifactScope: 'skills-team-sizing',
    },
  }
}

/** The THIRD writer of the type — the standalone Command Center tool. It has a
 *  different moduleId, so it never collided, and the migration must not touch it. */
function standaloneToolDraft(createdAt = 1_776_000_000_000): AnyDoc {
  return {
    id: `skills-team-plan-${createdAt}`,
    moduleId: 'pqc-governance',
    type: 'skills-team-plan',
    title: 'Skills & Team Plan — 3/4/2026',
    data: TOOL_MD,
    createdAt,
    inputs: { estateInstances: 2000, sizingPhase: 'firstTwoYears', sourcing: {} },
  }
}

function v15Store(docs: unknown[]): AnyDoc {
  return {
    version: '15.0.0',
    timestamp: 1_776_100_000_000,
    modules: {
      'skills-team-structure': {
        status: 'in-progress',
        lastVisited: 1_776_000_000_000,
        timeSpent: 12,
        completedSteps: ['workshop'],
        quizScores: {},
        learnSectionChecks: {},
      },
    },
    artifacts: { keys: [], certificates: [], csrs: [], executiveDocuments: docs },
    ejbcaConnections: {},
    preferences: { theme: 'dark', defaultKeyType: 'RSA', autoSave: true },
    notes: {},
    quizMastery: { correctQuestionIds: [] },
    kpiHistory: { riskScore: [] },
    checkpointScoringNoticeSeen: true,
  }
}

function docsOf(migrated: AnyDoc): AnyDoc[] {
  return migrated.artifacts.executiveDocuments as AnyDoc[]
}

function byId(migrated: AnyDoc, id: string): AnyDoc | undefined {
  return docsOf(migrated).find((d) => d.id === id)
}

/** The store's own save key. Two drafts sharing it is the bug under repair. */
function slotKey(d: AnyDoc): string {
  return `${d.moduleId}::${d.type}`
}

/**
 * "Resolves to its own tool" — the type is a live one the Command Center can
 * actually render: it has a label, a pillar, and exactly one zone bucket.
 */
function assertRenderable(d: AnyDoc) {
  const type = d.type as ExecutiveDocumentType
  // eslint-disable-next-line security/detect-object-injection
  expect(TYPE_LABELS[type], `no TYPE_LABELS entry for "${type}"`).toBeTruthy()
  // eslint-disable-next-line security/detect-object-injection
  expect(PILLAR_FOR_TYPE[type], `no PILLAR_FOR_TYPE entry for "${type}"`).toBeTruthy()
  // eslint-disable-next-line security/detect-object-injection
  expect(ZONE_FOR_TYPE[type], `no ZONE_FOR_TYPE entry for "${type}"`).toBeTruthy()
}

/** Restore path: `useSavedArtifactInputs(type)` with no scope only matches
 *  documents whose `inputs` carry no `__artifactScope` marker. */
function restoredInputsFor(migrated: AnyDoc, type: string): AnyDoc | undefined {
  return docsOf(migrated)
    .filter(
      (d) =>
        d.type === type &&
        d.inputs !== undefined &&
        (d.inputs === null || typeof d.inputs !== 'object' || !('__artifactScope' in d.inputs))
    )
    .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))[0]?.inputs
}

describe('store v15 → v16 — Skills & Team save-slot split preserves every draft', () => {
  it('the ladder actually advances the data version', () => {
    const migrated = runMigrate(v15Store([]), 15)
    expect(migrated.version).toBe('16.0.0')
  })

  // ── Scenario 1–2: bare, pre-scope drafts, one per colliding component ──────
  it('S1 bare pre-scope Crypto Champion draft → crypto-champion-roster, payload intact', () => {
    const before = bareChampionDraft()
    const migrated = runMigrate(v15Store([before]), 15)
    const docs = docsOf(migrated)
    expect(docs).toHaveLength(1)
    expect(docs[0].type).toBe('crypto-champion-roster')
    expect(docs[0].moduleId).toBe('skills-team-structure')
    expect(docs[0].id).toBe(before.id)
    expect(docs[0].title).toBe(before.title)
    expect(docs[0].data).toBe(before.data)
    expect(docs[0].createdAt).toBe(before.createdAt)
    assertRenderable(docs[0])
  })

  it('S2 bare pre-scope Team Sizing draft → team-sizing-plan, payload intact', () => {
    const before = bareSizingDraft()
    const migrated = runMigrate(v15Store([before]), 15)
    const docs = docsOf(migrated)
    expect(docs).toHaveLength(1)
    expect(docs[0].type).toBe('team-sizing-plan')
    expect(docs[0].data).toBe(before.data)
    expect(docs[0].id).toBe(before.id)
    assertRenderable(docs[0])
  })

  // ── Scenario 3–4: `__artifactScope`-stamped drafts ────────────────────────
  it('S3 scoped Crypto Champion draft → crypto-champion-roster, inputs kept, marker dropped', () => {
    const before = scopedChampionDraft()
    const migrated = runMigrate(v15Store([before]), 15)
    const doc = byId(migrated, before.id)!
    expect(doc.type).toBe('crypto-champion-roster')
    expect(doc.inputs.rows).toEqual(before.inputs.rows)
    expect(doc.inputs.__artifactScope).toBeUndefined()
    // Audit-trail fields from earlier ladder steps survive untouched.
    expect(doc.approvalStatus).toBe('draft')
    expect(doc.revisions).toEqual([])
    // …and the component's unscoped restore now finds it.
    expect(restoredInputsFor(migrated, 'crypto-champion-roster')).toEqual({
      rows: before.inputs.rows,
    })
    assertRenderable(doc)
  })

  it('S4 scoped Team Sizing draft → team-sizing-plan, inputs kept, marker dropped', () => {
    const before = scopedSizingDraft()
    const migrated = runMigrate(v15Store([before]), 15)
    const doc = byId(migrated, before.id)!
    expect(doc.type).toBe('team-sizing-plan')
    expect(doc.inputs).toEqual({
      instances: 7400,
      phase: 'firstTwoYears',
      otInScope: true,
      seedCleared: true,
    })
    expect(restoredInputsFor(migrated, 'team-sizing-plan')).toEqual(doc.inputs)
    assertRenderable(doc)
  })

  // ── Scenario 5: the third writer of the type must NOT move ────────────────
  it('S5 the standalone Command Center tool draft is left exactly as it was', () => {
    const before = standaloneToolDraft()
    const migrated = runMigrate(v15Store([before]), 15)
    const doc = byId(migrated, before.id)!
    expect(doc.type).toBe('skills-team-plan')
    expect(doc.moduleId).toBe('pqc-governance')
    expect(doc).toEqual(before)
    // And its own unscoped restore still resolves to it.
    expect(restoredInputsFor(migrated, 'skills-team-plan')).toEqual(before.inputs)
  })

  // ── Scenario 6–7: two colliding drafts held at once ───────────────────────
  it('S6 two colliding BARE drafts both survive, in separate slots', () => {
    const champ = bareChampionDraft()
    const sizing = bareSizingDraft()
    expect(slotKey(champ)).toBe(slotKey(sizing)) // the bug, restated

    const migrated = runMigrate(v15Store([champ, sizing]), 15)
    const docs = docsOf(migrated)
    expect(docs).toHaveLength(2)
    expect(byId(migrated, champ.id)!.type).toBe('crypto-champion-roster')
    expect(byId(migrated, sizing.id)!.type).toBe('team-sizing-plan')
    expect(new Set(docs.map(slotKey)).size).toBe(2)
    expect(byId(migrated, champ.id)!.data).toBe(CHAMPION_MD)
    expect(byId(migrated, sizing.id)!.data).toBe(SIZING_MD)
    docs.forEach(assertRenderable)
  })

  it('S7 two colliding SCOPED drafts plus the standalone tool: three slots, nothing lost', () => {
    const champ = scopedChampionDraft()
    const sizing = scopedSizingDraft()
    const tool = standaloneToolDraft()
    const migrated = runMigrate(v15Store([champ, sizing, tool]), 15)
    const docs = docsOf(migrated)
    expect(docs).toHaveLength(3)
    expect(new Set(docs.map(slotKey)).size).toBe(3)
    expect(byId(migrated, champ.id)!.type).toBe('crypto-champion-roster')
    expect(byId(migrated, sizing.id)!.type).toBe('team-sizing-plan')
    expect(byId(migrated, tool.id)!.type).toBe('skills-team-plan')
    // Each tool's own restore reads back its own blob — no cross-contamination.
    expect(restoredInputsFor(migrated, 'crypto-champion-roster')).toEqual({
      rows: champ.inputs.rows,
    })
    expect(restoredInputsFor(migrated, 'team-sizing-plan')).toEqual({
      instances: 7400,
      phase: 'firstTwoYears',
      otInScope: true,
      seedCleared: true,
    })
    expect(restoredInputsFor(migrated, 'skills-team-plan')).toEqual(tool.inputs)
    docs.forEach(assertRenderable)
  })

  it('S8 a mixed bare + scoped pair of the SAME step keeps both documents', () => {
    // A user who exported before the WS6 follow-up and again after it. The old
    // store could only hold one; an imported/merged file can hold both. Neither
    // may be dropped by the migration.
    const older = bareChampionDraft(1_770_000_000_000)
    const newer = scopedChampionDraft(1_775_000_000_000)
    const migrated = runMigrate(v15Store([older, newer]), 15)
    const docs = docsOf(migrated)
    expect(docs).toHaveLength(2)
    expect(docs.map((d) => d.type)).toEqual(['crypto-champion-roster', 'crypto-champion-roster'])
    expect(byId(migrated, older.id)!.data).toBe(CHAMPION_MD)
    expect(byId(migrated, newer.id)!.inputs.rows).toEqual(newer.inputs.rows)
    // Newest-first restore wins, which is the pre-existing rule.
    expect(restoredInputsFor(migrated, 'crypto-champion-roster')).toEqual({
      rows: newer.inputs.rows,
    })
  })

  // ── Scenario 9: nothing to migrate ────────────────────────────────────────
  it('S9 a store with no executive documents migrates cleanly', () => {
    const migrated = runMigrate(v15Store([]), 15)
    expect(docsOf(migrated)).toEqual([])
    expect(migrated.version).toBe('16.0.0')
    expect(migrated.modules['skills-team-structure']).toBeDefined()
  })

  it('S9b unrelated artifact types are byte-identical after the migration', () => {
    const unrelated = [
      {
        id: 'roi-1',
        moduleId: 'pqc-business-case',
        type: 'roi-model',
        title: 'ROI Model',
        data: '# ROI',
        createdAt: 1,
        inputs: { a: 1 },
      },
      {
        id: 'kri-1',
        moduleId: 'pqc-grc',
        type: 'kpi-dashboard',
        title: 'KRI Cascade',
        data: '# KRI',
        createdAt: 2,
        // still-scoped, still shares its type with a standalone tool — v16 must
        // NOT strip this marker, only the Skills & Team ones.
        inputs: { levelOf: {}, __artifactScope: 'pqc-grc-kri-cascade' },
      },
    ]
    const migrated = runMigrate(v15Store(unrelated), 15)
    expect(docsOf(migrated)).toEqual(unrelated)
  })

  // ── Scenario 10: corrupted / partial payloads ─────────────────────────────
  it('S10 corrupted and partial documents are preserved, never dropped or crashed on', () => {
    const junk: unknown[] = [
      null,
      undefined,
      'not-a-document',
      42,
      {},
      { moduleId: 'skills-team-structure' },
      { moduleId: 'skills-team-structure', type: 'skills-team-plan' }, // no signal at all
      {
        // signal-free but real: renamed title, no inputs, empty data
        id: 'x-999',
        moduleId: 'skills-team-structure',
        type: 'skills-team-plan',
        title: 'My staffing notes',
        data: '',
        createdAt: 5,
      },
      {
        // inputs present but not an object
        id: 'champions-7',
        moduleId: 'skills-team-structure',
        type: 'skills-team-plan',
        title: 'Crypto Champion Program Roster',
        data: CHAMPION_MD,
        createdAt: 7,
        inputs: 'corrupt',
      },
    ]
    const migrated = runMigrate(v15Store(junk), 15)
    const docs = docsOf(migrated)
    // JSON round-trip turns a bare `undefined` array slot into null; count is
    // what matters — nothing is filtered out.
    expect(docs).toHaveLength(junk.length)
    // The no-signal documents keep a LIVE type rather than being guessed at.
    const noSignal = docs.find((d) => d && d.id === 'x-999')!
    expect(noSignal.type).toBe('skills-team-plan')
    expect(noSignal.title).toBe('My staffing notes')
    assertRenderable(noSignal)
    // Non-object inputs don't stop the id/title signal from working.
    const corruptInputs = docs.find((d) => d && d.id === 'champions-7')!
    expect(corruptInputs.type).toBe('crypto-champion-roster')
    expect(corruptInputs.inputs).toBe('corrupt')
  })

  it('S10b a store with no artifacts object at all survives the ladder', () => {
    const broken = { version: '15.0.0', modules: {} }
    const migrated = runMigrate(broken, 15)
    expect(migrated.version).toBe('16.0.0')
  })

  // ── Scenario 11: the full ladder from an ancient store ────────────────────
  it('S11 a v11 store carrying both drafts reaches v16 with both intact', () => {
    const champ = bareChampionDraft()
    const sizing = bareSizingDraft()
    const ancient = {
      version: '11.0.0',
      modules: { 'skills-team-structure': { status: 'in-progress', timeSpent: 5 } },
      artifacts: { keys: [], certificates: [], csrs: [], executiveDocuments: [champ, sizing] },
    }
    const migrated = runMigrate(ancient, 11)
    expect(migrated.version).toBe('16.0.0')
    const docs = docsOf(migrated)
    expect(docs).toHaveLength(2)
    expect(new Set(docs.map(slotKey)).size).toBe(2)
    // v12→13 / v13→14 defaults applied on top of the re-typing.
    for (const d of docs) {
      expect(d.updatedAt).toBe(d.createdAt)
      expect(d.revisions).toEqual([])
      expect(d.approvalStatus).toBe('draft')
      assertRenderable(d)
    }
  })

  // ── Scenario 12: end-to-end through localStorage + rehydrate ──────────────
  describe('through the real localStorage rehydrate path', () => {
    beforeEach(() => {
      localStorage.clear()
    })
    afterEach(() => {
      localStorage.clear()
    })

    it('S12 a persisted v15 payload rehydrates with both drafts in separate slots', async () => {
      const champ = scopedChampionDraft()
      const sizing = scopedSizingDraft()
      localStorage.setItem(
        'pki-module-storage',
        JSON.stringify({ state: v15Store([champ, sizing]), version: 15 })
      )

      await useModuleStore.persist.rehydrate()

      const docs = (useModuleStore.getState().artifacts.executiveDocuments ??
        []) as ExecutiveDocument[]
      expect(docs).toHaveLength(2)
      const types = docs.map((d) => d.type).sort()
      expect(types).toEqual(['crypto-champion-roster', 'team-sizing-plan'])
      expect(new Set(docs.map((d) => `${d.moduleId}::${d.type}`)).size).toBe(2)
      expect(useModuleStore.getState().version).toBe('16.0.0')
    })

    it('S12b re-saving one step after the migration no longer evicts the other', async () => {
      localStorage.setItem(
        'pki-module-storage',
        JSON.stringify({
          state: v15Store([scopedChampionDraft(), scopedSizingDraft()]),
          version: 15,
        })
      )
      await useModuleStore.persist.rehydrate()

      useModuleStore.getState().addExecutiveDocument({
        id: 'skills-team-9999',
        moduleId: 'skills-team-structure',
        type: 'team-sizing-plan',
        title: 'PQC Team Sizing Plan',
        data: SIZING_MD,
        createdAt: 1_780_000_000_000,
        inputs: {
          instances: 9999,
          phase: 'productionRollout',
          otInScope: false,
          seedCleared: true,
        },
      })

      const docs = useModuleStore.getState().artifacts.executiveDocuments ?? []
      expect(docs).toHaveLength(2)
      expect(docs.some((d) => d.type === 'crypto-champion-roster')).toBe(true)
      const sizing = docs.find((d) => d.type === 'team-sizing-plan')!
      expect((sizing.inputs as { instances: number }).instances).toBe(9999)
    })
  })
})
