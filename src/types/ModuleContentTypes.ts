// SPDX-License-Identifier: GPL-3.0-only
/**
 * Type definitions for structured learn module content.
 *
 * Every learn module has a content.ts file that conforms to this interface.
 * Verifiable facts come from central registries (algorithmProperties,
 * standardsRegistry, regulatoryTimelines). Narrative text is explicitly
 * labeled and separated from machine-verifiable claims.
 */
import type React from 'react'
import type { AlgorithmProps } from '@/data/algorithmProperties'
import type { StandardRef } from '@/data/standardsRegistry'

/** A single tab in a module's tab-based layout */
export interface ModuleTab {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string; size?: number }>
  content: React.ComponentType
}

/** Definition of a learn module with tabbed UI layout */
export interface ModuleDefinition {
  id: string
  title: string
  description: string
  path: string
  readTime: string
  difficulty: string
  roleContext: string[]
  tags: string[]
  capabilitiesRequired: string[]
  tabs: ModuleTab[]
}

/** A regulatory deadline referenced in a module */
export interface DeadlineRef {
  /** Human-readable label (e.g., 'CNSA 2.0 software signing exclusive') */
  label: string
  /** The year of the deadline */
  year: number
  /** Source of the deadline (e.g., 'CNSA 2.0', 'NIST IR 8547') */
  source: string
  /**
   * `event_id` of the timeline row this deadline comes from.
   *
   * The timeline CSV is the project's single source of truth for PQC
   * deadlines, but until 2026-07-31 this type had NO field capable of
   * expressing that link — so every module retyped its years by hand and they
   * could drift from the timeline silently. Optional while the 41 modules that
   * declare deadlines are migrated; once a deadline carries this, the year and
   * label should be read as a cache of the timeline row, not an independent
   * claim.
   */
  timelineEventId?: string
}

/** Structured content for a learn module */
export interface ModuleContent {
  /** Module ID matching moduleData.ts key (e.g., 'stateful-signatures') */
  moduleId: string

  /** Semantic version of this module's content (major.minor.bug) */
  version?: string

  /**
   * ISO date (YYYY-MM-DD) when a human last CHECKED this module's factual claims
   * against evidence. Written by exactly one thing — `record_module_review.py`,
   * which refuses bulk stamping and writes a paired `revisions.jsonl` entry — so
   * the date is always backed by a record naming who checked what.
   *
   * IT IS NOT "WHEN THIS FILE LAST CHANGED", and it used to be. Until 2026-08-23
   * `apply_approved.bump_module_review` set this field on every applied edit, so
   * editing a module marked it reviewed. The damage was not theoretical: three
   * modules the proposals queue had flagged as 122-132 days past the review window
   * were edited, silently re-stamped to today, and their staleness disappeared
   * while their claims stayed unverified. Measured across all 64 modules, only 3
   * lastReviewed dates matched a real review record and 53 overstated it, most of
   * them by 148 days. The React app shows this value to readers as "Content last
   * reviewed {date}" (ModuleReferencesTab), so those were reader-facing claims.
   *
   * Use `lastEdited` for "when did this file change". They answer different
   * questions and a value that answers both answers neither.
   *
   * OPTIONAL, so that "nobody has checked this yet" is representable. Three modules
   * (sbom, soc-implementation-pqc, verification-closure) were added after the
   * 2026-03-28 baseline and have never been through a review, so they carry no value.
   * ModuleReferencesTab already renders nothing when it is absent, which is the right
   * outcome: no claim is better than a false one.
   */
  lastReviewed?: string

  /**
   * ISO date (YYYY-MM-DD) when this module's files last changed, for any reason.
   * Bumped automatically by `apply_approved.bump_module_review` alongside
   * `contentVersion`. Optional: a module that has never been edited since the split
   * simply has no value, which is honest — do not backfill it from git mtimes.
   */
  lastEdited?: string

  /**
   * Standards referenced in this module — each resolved from standardsRegistry.
   *
   * **ORDER MATTERS. Put the documents this module's own claims come from first.**
   *
   * This list does double duty. It is the citation list a learner sees in the
   * References tab, and it is the evidence pool the accuracy spot-check grades the
   * module against. That second job is order-sensitive: `accuracy_spotcheck.py`
   * samples by deterministic even stride and reads only the first four documents it
   * selects, so a 6-entry list is sampled at indices 0, 1, 3, 4 and an 8-entry list
   * at 0, 2, 4, 6. Whatever falls outside that is never opened, and the module's
   * claims about it are never checked.
   *
   * A governance module that leads with four FIPS algorithm specifications gets
   * graded against ML-KEM's internals instead of OMB M-23-02 — which is what was
   * happening until 2026-08-21. Reordering `pqc-governance` and `pqc-risk-management`
   * by relevance took the seven Essentials from 20 of 35 claims graded to 33.
   *
   * **Adding more documents does not help — this was measured, not assumed.** Over
   * the same seven modules: 4 documents at a 16k evidence budget graded 33 of 35
   * claims; 6 at 16k graded 32; 6 at 24k graded 28. Volume is not a lever. Order is
   * the only one.
   *
   * The trade this forces is real and worth understanding before you reorder.
   * `quantum-threats` leads with the four resource-estimate papers its qubit figures
   * come from, so all five of its claims grade — and its FIPS 203 and NIST IR 8547
   * entries are now never sampled. That is deliberate: the qubit numbers are this
   * module's distinctive and most volatile content, while the ML-KEM and deadline
   * statements are stable boilerplate that other modules cite and do check. Order by
   * what would be most damaging to get wrong *here*.
   */
  standards: StandardRef[]

  /** Algorithms used/discussed in this module — each from algorithmProperties */
  algorithms: AlgorithmProps[]

  /** Regulatory deadlines used in this module — from regulatoryTimelines.ts */
  deadlines: DeadlineRef[]

  /**
   * Module-specific narrative text — editorial content that is NOT
   * machine-verifiable against CSVs. Explanations, analogies, educational
   * framing. Keyed by a descriptive slug.
   */
  narratives: Record<string, string>
}
