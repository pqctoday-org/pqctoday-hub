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
import {
  NO_ROLE,
  type Checkpoint,
  type Completion,
  type Objective,
  type RoleSwitchNote,
} from '../services/journey/types'

export const JOURNEY_STORE_KEY = 'pqc-journey'
export const JOURNEY_STORE_VERSION = 1

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

  /** Saves a previewed objective. Returns the id and whether it is new; the same role and goal again returns the existing one. */
  createObjective: (
    preview: ObjectivePreview,
    options?: { allowDuplicate?: boolean; now?: number }
  ) => { id: string; created: boolean }
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
  setCheckpoint: (objectiveId: string, patch: Partial<Checkpoint>, now?: number) => void
  /**
   * The learner chose a role after making objectives with none: those objectives become the role's
   * (they were made for no one else). Objectives that already belong to a role are not touched.
   */
  adoptRolelessObjectives: (role: string) => void
  noteRoleSwitch: (from: string | null, to: string | null, now?: number) => void
  clearRoleSwitch: () => void
}

const EMPTY: PersistedJourney = { objectives: {}, order: [], focus: {}, completions: {} }

const roleKey = (role: string | null | undefined) => role ?? NO_ROLE

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function isObjective(v: unknown): v is Objective {
  if (!isRecord(v)) return false
  return (
    typeof v.id === 'string' &&
    typeof v.role === 'string' &&
    typeof v.goal === 'string' &&
    (v.state === 'active' || v.state === 'paused' || v.state === 'completed') &&
    Array.isArray(v.steps) &&
    v.steps.every(
      (s) =>
        isRecord(s) &&
        typeof s.id === 'string' &&
        typeof s.resourceTag === 'string' &&
        typeof s.position === 'number' &&
        typeof s.required === 'boolean'
    ) &&
    isRecord(v.checkpoint)
  )
}

/**
 * Brings anything read from the device to the current shape: keeps what is valid, drops what is not,
 * never throws. Version 1 is the first version, so this also stands for "nothing stored yet" and for a
 * state that was damaged on disk. A later version adds its step here and keeps this one's.
 */
export function migrateJourneyState(persisted: unknown, fromVersion: number): PersistedJourney {
  void fromVersion
  if (!isRecord(persisted)) return { ...EMPTY }
  const objectives: Record<string, Objective> = {}
  if (isRecord(persisted.objectives)) {
    for (const [id, value] of Object.entries(persisted.objectives)) {
      if (isObjective(value) && value.id === id) objectives[id] = value // eslint-disable-line security/detect-object-injection
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
          if (s.objectives[base] && !options.allowDuplicate) return { id: base, created: false } // eslint-disable-line security/detect-object-injection
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
          }
          set((st) => ({
            objectives: { ...st.objectives, [id]: objective },
            order: [...st.order, id],
            focus: { ...st.focus, [roleKey(preview.role)]: id },
          }))
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
          if (step.resourceTag in s.completions) return false
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
      // A damaged value must never stop the app: a failed read leaves the empty state.
      onRehydrateStorage: () => (_state, error) => {
        if (error) console.error('The journey could not be read from this device.', error)
      },
    }
  )
)

/** The tags the learner has marked complete, for the "done" predicate of the step rules. */
export const selectIsMarkedDone = (s: PersistedJourney) => (tag: string) => tag in s.completions
