// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Pure-move extraction (IMPLEMENTATION-PLAN.md §5.4, E-2) — `StableTab` and
 * `STABLE_TABS` were module-private to ComplianceView.tsx. Moved verbatim so
 * the mobile Compliance screen reads the same 8 views the desktop page
 * reads, rather than a copy. ComplianceView.tsx re-imports both from here
 * under the same names.
 */
import {
  ShieldCheck,
  BookOpen,
  CalendarClock,
  PackageSearch,
  GlobeLock,
  Workflow,
  Sparkles,
  Layers,
} from 'lucide-react'

// ── Stable tab model ───────────────────────────────────────────────────────
// Four tabs, same order for every persona. Persona is a LENS (it tunes content
// in place via the shared control deck) — it never reorders the bar.

export type StableTab =
  | 'obligations'
  | 'requirements'
  | 'progress'
  | 'products'
  | 'landscape'
  | 'records'
  | 'foryou'
  | 'cswp39'

export type ComplianceTabGroup = 'Understand' | 'Explore evidence' | 'Apply the lesson'

export const STABLE_TABS: {
  id: StableTab
  label: string
  icon: typeof Layers
  group: ComplianceTabGroup
}[] = [
  // RENAMED 2026-08-11: 'Obligations' overclaimed. Most rows here are
  // standards and certification schemes that merely APPLY — the tier system
  // exists precisely to separate those from the ones that bind — and the page
  // calls itself a reference, not a workspace. The id stays 'obligations' so
  // every ?tab= and #hash link already in the wild keeps resolving.
  { id: 'obligations', label: 'Rules & Standards', icon: ShieldCheck, group: 'Understand' },
  { id: 'requirements', label: 'Sources & Practices', icon: BookOpen, group: 'Understand' },
  { id: 'progress', label: 'Progress', icon: CalendarClock, group: 'Understand' },
  { id: 'products', label: 'Products', icon: PackageSearch, group: 'Explore evidence' },
  { id: 'landscape', label: 'Landscape', icon: Layers, group: 'Explore evidence' },
  { id: 'records', label: 'Product Records', icon: GlobeLock, group: 'Explore evidence' },
  { id: 'foryou', label: 'For You', icon: Sparkles, group: 'Apply the lesson' },
  { id: 'cswp39', label: 'CSWP.39 Agility', icon: Workflow, group: 'Apply the lesson' },
]
