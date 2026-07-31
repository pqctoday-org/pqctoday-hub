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

  /** ISO date (YYYY-MM-DD) when module factual content was last reviewed */
  lastReviewed: string

  /** Standards referenced in this module — each resolved from standardsRegistry */
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
