// SPDX-License-Identifier: GPL-3.0-only
//
// lessonTypes.ts — protocol-agnostic shapes for a Learn tab's guided
// curriculum, generalized from the KMIP playground's kmip3/learnLessons.ts.
// A concrete curriculum (KMIP's `Lesson`, PKCS#11's `Lesson`) instantiates
// `LessonBase`/`LessonSideBase` with its own step-result type — the
// executable-step contract (one request per step, an expected outcome that
// treats an honest refusal as success) is what's shared, not any one
// protocol's request/response shapes.

export type LessonTone = 'ok' | 'primary' | 'spec' | 'warn' | 'info'

/** The outcome a lesson step is SUPPOSED to have. 'refusal': the honest
 * rejection IS the lesson (e.g. a below-threshold split-key join, reading a
 * sensitive attribute, using a mechanism a key isn't pinned to). 'pending':
 * an accepted-but-not-yet-complete outcome (e.g. an async job accept).
 * Default: 'success'. */
export type LessonStepExpect = 'success' | 'refusal' | 'pending'

export interface CompareRow {
  label: string
  a: string
  b: string
  same: boolean
}

export interface CompareRow3 {
  label: string
  a: string
  b: string
  c: string
}

export interface LessonSideBase<TStep> {
  /** `null` when this side has no runnable predecessor (e.g. a PQC-only
   * primitive with no classical analogue). */
  algorithm: string | null
  algoLabel: string
  steps: TStep[]
  /** Extra framing prose shown alongside (or instead of) the step list. */
  prose?: string
  /** Modernize CTA button label (only set on the second/PQC side). */
  cta?: string
  /** Set when this side makes no new calls — the point IS that nothing
   * changes, so the UI replays the other side's own results. */
  skipReplay?: boolean
}

export interface LessonBase<TSide> {
  id: string
  n: number
  tag: string
  tone: LessonTone
  title: string
  blurb: string
  setup: string
  /** Card headers for the two sides — defaults to ['Classical', 'Post-quantum']. */
  sideHeaders?: [string, string]
  classical: TSide
  modernize: TSide
  compare?: CompareRow[]
  compareHeaders?: [string, string, string]
  compare3?: CompareRow3[]
  notes: string[]
  whyItMatters: string
  /** Op/operation names for "Try it yourself in Reference/Workbench" backlink chips. */
  tryRef: string[]
}

/** A single linear walkthrough — one step sequence, no classical/PQC pairing.
 * Fits protocol-fundamentals lessons (e.g. PKCS#11 "Foundations" track) where
 * there's nothing to compare against, unlike `LessonBase`'s always-paired
 * classical/modernize shape (KMIP's classical→PQC lessons, PKCS#11's
 * "v3.2 & the PQC transformation" track). */
export interface LinearLessonBase<TStep> {
  id: string
  n: number
  tag: string
  tone: LessonTone
  title: string
  blurb: string
  setup: string
  steps: TStep[]
  notes: string[]
  whyItMatters: string
  /** Op/operation names for "Try it yourself in Workbench" backlink chips. */
  tryRef: string[]
}
