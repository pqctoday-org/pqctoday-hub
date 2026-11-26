// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The journey store: objectives, their steps, checkpoints and the completions the learner marked.
 * Device-local, key `pqc-journey`, keyed by canonical tag (`LM-008`), never by route.
 *
 * It is deliberately NOT in `WATCHED_STORES`, not in the Google Drive document `useSyncEffect`
 * collects, and not in the embed or backup snapshots `UnifiedStorageService` builds (owner decision
 * 25 Nov 2026: "Keep it out of Drive sync"). `journeyStoreIsolation.test.ts` pins that. Markdown
 * export, built with My work, is the only way learner work leaves the device, and the learner starts it.
 *
 * Every action is one logical change and is idempotent: saving the same objective twice, marking a
 * done step again or pausing a paused objective changes nothing (acceptance A04, J08). Nothing the
 * learner writes is sent anywhere; no action emits an analytics event.
 *
 * What this store holds is only what the design note assigns to the journey: objectives, steps,
 * progress and the role switch note. Comments, tracked outputs, saved answers and update receipts
 * belong to the My work and Updates stores, which are separate files.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { guardedJSONStorage } from './guardedStorage'
import { completeCheck, focusAfterPause } from '../services/journey/stepRules'
import {
  objectiveIdFor,
  stepsFromPreview,
  type ObjectivePreview,
} from '../services/journey/objectiveBuilder'
import { buildBuiltOn, snapshotLesson, takeFirstTags } from '../services/journey/curriculum'
import {
  NO_ROLE,
  type BuiltOn,
  type Checkpoint,
  type Completion,
  type Objective,
  type RoleSwitchNote,
  type Step,
} from '../services/journey/types'

export const JOURNEY_STORE_KEY = 'pqc-journey'
export const JOURNEY_STORE_VERSION = 2

/** The part of the state that is written to the device. */
export interface PersistedJourney {
  objectives: Record<string, Objective>
  /** Objective ids in the order they were created. */
  order: string[]
  /** The objective in focus for each role (`none` when no role is set). */
  focus: Record<string, string | null>
  /** Completions the learner marked, by canonical tag; shared by every objective holding the tag. */
  completions: Record<string, Completion>
}

interface JourneyState extends PersistedJourney {
  /** The role switch the learner just made, for the undo note. Not written to the device. */
  roleSwitch: RoleSwitchNote | null

  /**
   * Saves a previewed objective. Returns the id and whether it is new; the same role and goal again
   * returns the existing one. When the device refuses the write, nothing is kept: `failed` is true,
   * the state is as it was, and calling again with the same preview saves it once (A09, J08).
   */
  createObjective: (
    preview: ObjectivePreview,
    options?: { allowDuplicate?: boolean; now?: number }
  ) => { id: string; created: boolean; failed?: boolean }
  focusObjective: (id: string) => void
  pauseObjective: (id: string, now?: number) => void
  resumeObjective: (id: string, now?: number) => void
  /**
   * Marks the objective complete if the check allows it and `confirmed` is true. `isDone` adds the
   * Hub's own completion signal for a finished lesson to the tags marked here. Returns whether it changed.
   */
  completeObjective: (
    id: string,
    confirmed: boolean,
    isDone?: (tag: string) => boolean,
    now?: number
  ) => boolean
  reopenObjective: (id: string, now?: number) => void
  /** Marks a step's tag complete. Returns false when it was already complete or the objective is not active. */
  markStepComplete: (
    objectiveId: string,
    stepId: string,
    revision?: number,
    now?: number
  ) => boolean
  /** Takes back a mark the learner made (the phone's Undo). Hub completion signals cannot be undone here. */
  unmarkStep: (objectiveId: string, stepId: string) => void
  deferStep: (objectiveId: string, stepId: string) => void
  restoreStep: (objectiveId: string, stepId: string) => void
  /** Records what an objective is built on, once: an objective that already has the record keeps it. */
  recordBuiltOn: (objectiveId: string, builtOn: BuiltOn) => void
  /** The learner has seen or answered a curriculum change; it is not shown again. Idempotent. */
  acknowledgeChange: (objectiveId: string, changeId: string) => void
  /**
   * The learner adds a lesson the curriculum now requires to an objective, before the step that needs it. A
   * completed objective is also reopened when `reopen` is true. Returns false when nothing was added.
   */
  addRequiredStep: (
    objectiveId: string,
    lessonTag: string,
    beforeTag: string,
    options?: { reopen?: boolean; now?: number }
  ) => boolean
  /**
   * The learner swaps a retired step for the lesson that replaced it. The step keeps its place and its id; the
   * retired tag is kept on it, so comments and work filed under it stay filed under the objective. Returns false
   * when the objective already holds the replacement.
   */
  swapRetiredStep: (
    objectiveId: string,
    stepId: string,
    toTag: string,
    options?: { reopen?: boolean; now?: number }
  ) => boolean
  setCheckpoint: (objectiveId: string, patch: Partial<Checkpoint>, now?: number) => void
  /**
   * The learner chose a role after making objectives with none: those objectives become the role's
   * (they were made for no one else). Objectives that already belong to a role are not touched.
   */
  adoptRolelessObjectives: (role: string) => void
  noteRoleSwitch: (from: string | null, to: string | null, now?: number) => void
  clearRoleSwitch: () => void
}

const isStringList = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === 'string')

function isBuiltOn(v: unknown): v is BuiltOn {
  if (!isRecord(v)) return false
  return (
    (v.origin === 'created' || v.origin === 'first-seen') &&
    typeof v.revision === 'string' &&
    typeof v.at === 'number' &&
    isRecord(v.prerequisites) &&
    Object.values(v.prerequisites).every(isStringList) &&
    isRecord(v.lessons) &&
    Object.values(v.lessons).every(
      (l) =>
        isRecord(l) &&
        typeof l.version === 'number' &&
        isStringList(l.sections) &&
        isRecord(l.tools) &&
        Object.values(l.tools).every((t) => t === null || typeof t === 'string')
    )
  )
}

/**
 * Keeps the parts of the curriculum record that are valid and drops the rest. An objective that has none is
 * left as it is: it was made before this was recorded and is baselined when the Hub first looks at it, never
 * wiped and never given a revision it did not have. Returns the same object when nothing needs to change.
 */
function cleanObjective(o: Objective): Objective {
  let out = o
  if (o.builtOn !== undefined && !isBuiltOn(o.builtOn)) {
    out = { ...out }
    delete out.builtOn
  }
  if (o.acknowledged !== undefined && !isStringList(o.acknowledged)) {
    out = {
      ...out,
      acknowledged: Array.isArray(o.acknowledged)
        ? (o.acknowledged as unknown[]).filter((x): x is string => typeof x === 'string')
        : [],
    }
  }
  if (o.steps.some((st) => st.formerTags !== undefined && !isStringList(st.formerTags))) {
    out = {
      ...out,
      steps: out.steps.map((st) => {
        if (st.formerTags === undefined || isStringList(st.formerTags)) return st
        const rest = { ...st }
        delete rest.formerTags
        return rest
      }),
    }
  }
  return out
}

const EMPTY: PersistedJourney = { objectives: {}, order: [], focus: {}, completions: {} }

const roleKey = (role: string | null | undefined) => role ?? NO_ROLE

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function isStep(s: unknown): boolean {
  return (
    isRecord(s) &&
    typeof s.id === 'string' &&
    typeof s.resourceTag === 'string' &&
    typeof s.position === 'number' &&
    typeof s.required === 'boolean'
  )
}

/** An objective with everything but its steps checked; the steps are checked one by one (see `migrateJourneyState`). */
function isObjectiveShell(v: unknown): v is Objective {
  if (!isRecord(v)) return false
  return (
    typeof v.id === 'string' &&
    typeof v.role === 'string' &&
    typeof v.goal === 'string' &&
    (v.state === 'active' || v.state === 'paused' || v.state === 'completed') &&
    Array.isArray(v.steps) &&
    isRecord(v.checkpoint)
  )
}

/**
 * Brings anything read from the device to the current shape: keeps what is valid, drops what is not,
 * never throws. Version 1 is the first version, so this also stands for "nothing stored yet" and for a
 * state that was damaged on disk. It runs on every read from the device, not only when the version changes
 * (see `merge` in the store's options). Version 2 added each objective's record of what it was built on, the ids of
 * the curriculum changes the learner answered, and the former tags of a swapped step: all optional, so a
 * version 1 objective is kept exactly as it was and is recorded when the Hub first looks at it.
 */
export function migrateJourneyState(persisted: unknown, fromVersion: number): PersistedJourney {
  void fromVersion
  if (!isRecord(persisted)) return { ...EMPTY }
  const objectives: Record<string, Objective> = {}
  if (isRecord(persisted.objectives)) {
    for (const [id, value] of Object.entries(persisted.objectives)) {
      if (!isObjectiveShell(value) || value.id !== id) continue
      // A step that is not well formed is dropped, not the objective it is in; an objective left with no step is dropped.
      const steps = (value.steps as unknown[]).filter(isStep) as Step[]
      if (steps.length > 0) objectives[id] = cleanObjective({ ...value, steps }) // eslint-disable-line security/detect-object-injection
    }
  }
  const order = Array.isArray(persisted.order)
    ? persisted.order.filter((id): id is string => typeof id === 'string' && id in objectives)
    : []
  for (const id of Object.keys(objectives)) if (!order.includes(id)) order.push(id)
  const focus: Record<string, string | null> = {}
  if (isRecord(persisted.focus)) {
    for (const [role, id] of Object.entries(persisted.focus)) {
      if (typeof id === 'string' && id in objectives)
        focus[role] = id // eslint-disable-line security/detect-object-injection
      else if (id === null) focus[role] = null // eslint-disable-line security/detect-object-injection
    }
  }
  const completions: Record<string, Completion> = {}
  if (isRecord(persisted.completions)) {
    for (const [tag, c] of Object.entries(persisted.completions)) {
      if (isRecord(c) && typeof c.at === 'number' && c.tag === tag) {
        completions[tag] = c as unknown as Completion // eslint-disable-line security/detect-object-injection
      }
    }
  }
  return { objectives, order, focus, completions }
}

const touch = (o: Objective, now: number): Objective => ({ ...o, updatedAt: now })

/** True when the device holds this objective now: what was written, read back. */
function isStored(id: string): boolean {
  try {
    const raw = localStorage.getItem(JOURNEY_STORE_KEY)
    if (!raw) return false
    const stored = JSON.parse(raw) as { state?: { objectives?: Record<string, unknown> } }
    return Boolean(stored.state?.objectives && id in stored.state.objectives)
  } catch {
    return false
  }
}

export const useJourneyStore = create<JourneyState>()(
  persist(
    (set, get) => {
      const patchObjective = (id: string, fn: (o: Objective) => Objective) =>
        set((s) => {
          const o = s.objectives[id] // eslint-disable-line security/detect-object-injection
          if (!o) return s
          const next = fn(o)
          return next === o ? s : { objectives: { ...s.objectives, [id]: next } }
        })

      return {
        ...EMPTY,
        roleSwitch: null,

        createObjective: (preview, options = {}) => {
          const now = options.now ?? Date.now()
          const s = get()
          const base = objectiveIdFor(preview.role, preview.goal)
          // An open objective with the same id is a repeat. A completed one is not (the preview says "ready" for it
          // and Create makes a new objective; reopening is its own action), so the new one takes the next free id.
          const held = s.objectives[base] // eslint-disable-line security/detect-object-injection
          if (held && held.state !== 'completed' && !options.allowDuplicate)
            return { id: base, created: false }
          let id = base
          for (let n = 2; s.objectives[id]; n++) id = `${base}-${n}` // eslint-disable-line security/detect-object-injection
          const steps = stepsFromPreview(id, preview)
          const firstStep =
            steps.find((x) => x.required && x.resourceTag === preview.firstStepTag) ??
            steps.find((x) => x.required && x.kind === 'self-assessed') ??
            steps[0]
          const objective: Objective = {
            id,
            role: preview.role,
            goal: preview.goal,
            state: 'active',
            steps,
            checkpoint: { path: ['journey', 'objectives'], stepId: firstStep?.id ?? null },
            createdAt: now,
            updatedAt: now,
            builtOn: buildBuiltOn(steps, 'created', now),
          }
          set((st) => ({
            objectives: { ...st.objectives, [id]: objective },
            order: [...st.order, id],
            focus: { ...st.focus, [roleKey(preview.role)]: id },
          }))
          // The write is checked, not assumed: an objective shown as saved that the device did not
          // keep would be lost on the next visit. A refused write puts the state back.
          if (!isStored(id)) {
            set({ objectives: s.objectives, order: s.order, focus: s.focus })
            return { id, created: false, failed: true }
          }
          return { id, created: true }
        },

        focusObjective: (id) =>
          set((s) => {
            const o = s.objectives[id] // eslint-disable-line security/detect-object-injection
            if (!o || s.focus[roleKey(o.role)] === id) return s
            return { focus: { ...s.focus, [roleKey(o.role)]: id } }
          }),

        pauseObjective: (id, now = Date.now()) => {
          const s = get()
          const o = s.objectives[id] // eslint-disable-line security/detect-object-injection
          if (!o || o.state !== 'active') return
          const all = s.order.map((k) => s.objectives[k]).filter(Boolean) // eslint-disable-line security/detect-object-injection
          // Focus moves to the next active objective of the role; with none left, the paused one stays in focus.
          const next = focusAfterPause(all, id)
          set((st) => ({
            objectives: { ...st.objectives, [id]: { ...touch(o, now), state: 'paused' } },
            focus: { ...st.focus, [roleKey(o.role)]: next ?? id },
          }))
        },

        resumeObjective: (id, now = Date.now()) =>
          set((s) => {
            const o = s.objectives[id] // eslint-disable-line security/detect-object-injection
            if (!o || o.state !== 'paused') return s
            return {
              objectives: { ...s.objectives, [id]: { ...touch(o, now), state: 'active' } },
              focus: { ...s.focus, [roleKey(o.role)]: id },
            }
          }),

        completeObjective: (id, confirmed, hubDone, now = Date.now()) => {
          const s = get()
          const o = s.objectives[id] // eslint-disable-line security/detect-object-injection
          if (!o || o.state !== 'active' || !confirmed) return false
          const isDone = (tag: string) => tag in s.completions || (hubDone?.(tag) ?? false)
          const check = completeCheck(o, isDone)
          if (check.state !== 'allowed') return false
          const last = check.confirmStep
          set((st) => ({
            objectives: {
              ...st.objectives,
              [id]: { ...touch(o, now), state: 'completed', completedAt: now },
            },
            // The learner's own confirmation completes the self-assessed last step, and only that one.
            completions: last
              ? {
                  ...st.completions,
                  [last.resourceTag]: {
                    tag: last.resourceTag,
                    kind: 'completed',
                    source: 'objective',
                    at: now,
                  },
                }
              : st.completions,
          }))
          return true
        },

        reopenObjective: (id, now = Date.now()) =>
          set((s) => {
            const o = s.objectives[id] // eslint-disable-line security/detect-object-injection
            if (!o || o.state !== 'completed') return s
            // Shared evidence stays credited; only the objective's own self-assessed step is open again.
            const own = new Set(
              o.steps.filter((x) => x.kind === 'self-assessed').map((x) => x.resourceTag)
            )
            const completions = Object.fromEntries(
              Object.entries(s.completions).filter(([tag]) => !own.has(tag))
            )
            const reopened: Objective = { ...touch(o, now), state: 'active' }
            delete reopened.completedAt
            return {
              objectives: { ...s.objectives, [id]: reopened },
              completions,
              focus: { ...s.focus, [roleKey(o.role)]: id },
            }
          }),

        markStepComplete: (objectiveId, stepId, revision, now = Date.now()) => {
          const s = get()
          const o = s.objectives[objectiveId] // eslint-disable-line security/detect-object-injection
          const step = o?.steps.find((x) => x.id === stepId)
          if (!o || !step || o.state !== 'active') return false
          // A self-assessed step is confirmed in the complete panel, never by a mark.
          if (step.kind === 'self-assessed') return false
          // Already done: its own lesson, or one it replaced.
          if ([step.resourceTag, ...(step.formerTags ?? [])].some((t) => t in s.completions))
            return false
          set((st) => ({
            completions: {
              ...st.completions,
              [step.resourceTag]: {
                tag: step.resourceTag,
                kind: 'completed',
                source: 'self',
                at: now,
                ...(revision !== undefined ? { revision } : {}),
              },
            },
            objectives: { ...st.objectives, [objectiveId]: touch(o, now) },
          }))
          return true
        },

        unmarkStep: (objectiveId, stepId) =>
          set((s) => {
            const o = s.objectives[objectiveId] // eslint-disable-line security/detect-object-injection
            const step = o?.steps.find((x) => x.id === stepId)
            const done = step ? s.completions[step.resourceTag] : undefined
            if (!o || !step || !done || done.source !== 'self' || o.state !== 'active') return s
            return {
              completions: Object.fromEntries(
                Object.entries(s.completions).filter(([tag]) => tag !== step.resourceTag)
              ),
            }
          }),

        deferStep: (objectiveId, stepId) =>
          patchObjective(objectiveId, (o) => {
            const step = o.steps.find((x) => x.id === stepId)
            // The last, self-assessed step is the finish line and cannot be put off.
            if (!step || step.deferred || step.kind === 'self-assessed') return o
            return {
              ...o,
              steps: o.steps.map((x) => (x.id === stepId ? { ...x, deferred: true } : x)),
            }
          }),

        restoreStep: (objectiveId, stepId) =>
          patchObjective(objectiveId, (o) => {
            const step = o.steps.find((x) => x.id === stepId)
            if (!step?.deferred) return o
            return {
              ...o,
              steps: o.steps.map((x) => {
                if (x.id !== stepId) return x
                const rest = { ...x }
                delete rest.deferred
                return rest
              }),
            }
          }),

        recordBuiltOn: (objectiveId, builtOn) =>
          patchObjective(objectiveId, (o) => (o.builtOn ? o : { ...o, builtOn })),

        acknowledgeChange: (objectiveId, changeId) =>
          patchObjective(objectiveId, (o) =>
            o.acknowledged?.includes(changeId)
              ? o
              : { ...o, acknowledged: [...(o.acknowledged ?? []), changeId] }
          ),

        addRequiredStep: (objectiveId, lessonTag, beforeTag, options = {}) => {
          const now = options.now ?? Date.now()
          const o = get().objectives[objectiveId] // eslint-disable-line security/detect-object-injection
          const before = o?.steps.find((x) => x.resourceTag === beforeTag)
          const snap = snapshotLesson(lessonTag)
          if (!o || !before || !snap || o.steps.some((x) => x.resourceTag === lessonTag))
            return false
          const used = o.steps.map((x) => Number(/-s(\d+)$/.exec(x.id)?.[1] ?? 0))
          const id = `${o.id}-s${Math.max(o.steps.length, ...used) + 1}`
          const at = before.position
          const added: Step = {
            id,
            position: at,
            kind: 'module',
            resourceTag: lessonTag,
            required: true,
            origin: { type: 'take-first', for: beforeTag },
          }
          patchObjective(objectiveId, (cur) => ({
            ...touch(cur, now),
            steps: [
              ...cur.steps.map((x) => (x.position >= at ? { ...x, position: x.position + 1 } : x)),
              added,
            ].sort((a, b) => a.position - b.position),
            builtOn: cur.builtOn && {
              ...cur.builtOn,
              prerequisites: {
                ...cur.builtOn.prerequisites,
                [beforeTag]: takeFirstTags(beforeTag),
                [lessonTag]: takeFirstTags(lessonTag),
              },
              lessons: { ...cur.builtOn.lessons, [lessonTag]: snap },
            },
          }))
          if (options.reopen && o.state === 'completed') get().reopenObjective(objectiveId, now)
          return true
        },

        swapRetiredStep: (objectiveId, stepId, toTag, options = {}) => {
          const now = options.now ?? Date.now()
          const o = get().objectives[objectiveId] // eslint-disable-line security/detect-object-injection
          const step = o?.steps.find((x) => x.id === stepId)
          const snap = snapshotLesson(toTag)
          if (!o || !step || !snap || o.steps.some((x) => x.resourceTag === toTag)) return false
          const former = step.resourceTag
          patchObjective(objectiveId, (cur) => ({
            ...touch(cur, now),
            steps: cur.steps.map((x) =>
              x.id === stepId
                ? { ...x, resourceTag: toTag, formerTags: [...(x.formerTags ?? []), former] }
                : x
            ),
            builtOn: cur.builtOn && {
              ...cur.builtOn,
              prerequisites: { ...cur.builtOn.prerequisites, [toTag]: takeFirstTags(toTag) },
              lessons: { ...cur.builtOn.lessons, [toTag]: snap },
            },
          }))
          if (options.reopen && o.state === 'completed') get().reopenObjective(objectiveId, now)
          return true
        },

        setCheckpoint: (objectiveId, patch, now = Date.now()) =>
          patchObjective(objectiveId, (o) => {
            const next = { ...o.checkpoint, ...patch }
            if (JSON.stringify(next) === JSON.stringify(o.checkpoint)) return o
            return { ...touch(o, now), checkpoint: next }
          }),

        adoptRolelessObjectives: (role) =>
          set((s) => {
            if (role === NO_ROLE) return s
            const loose = Object.values(s.objectives).filter((o) => o.role === NO_ROLE)
            if (loose.length === 0) return s
            const objectives = { ...s.objectives }
            for (const o of loose) objectives[o.id] = { ...o, role } // eslint-disable-line security/detect-object-injection
            const looseFocus = s.focus[NO_ROLE]
            const { [NO_ROLE]: _gone, ...rest } = s.focus // eslint-disable-line @typescript-eslint/no-unused-vars
            return {
              objectives,
              focus: looseFocus && !rest[role] ? { ...rest, [role]: looseFocus } : rest,
            }
          }),

        noteRoleSwitch: (from, to, now = Date.now()) => set({ roleSwitch: { from, to, at: now } }),
        clearRoleSwitch: () => set({ roleSwitch: null }),
      }
    },
    {
      name: JOURNEY_STORE_KEY,
      version: JOURNEY_STORE_VERSION,
      storage: guardedJSONStorage(),
      // The role switch note is a session note, not learner work.
      partialize: (s): PersistedJourney => ({
        objectives: s.objectives,
        order: s.order,
        focus: s.focus,
        completions: s.completions,
      }),
      migrate: (persisted, version) => migrateJourneyState(persisted, version),
      // Every read is cleaned, not only a read across a version change: a stored value of this version that was
      // damaged on the device must not stop the app (a null list of objectives would fail every screen).
      merge: (persisted, current) => ({
        ...current,
        ...migrateJourneyState(persisted, JOURNEY_STORE_VERSION),
      }),
      // A damaged value must never stop the app: a failed read leaves the empty state.
      onRehydrateStorage: () => (_state, error) => {
        if (error) console.error('The journey could not be read from this device.', error)
      },
    }
  )
)

/** The tags the learner has marked complete, for the "done" predicate of the step rules. */
export const selectIsMarkedDone = (s: PersistedJourney) => (tag: string) => tag in s.completions

// Another tab saved: read its copy, so two tabs never overwrite each other's objectives with a stale copy.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === JOURNEY_STORE_KEY) void useJourneyStore.persist.rehydrate()
  })
}
