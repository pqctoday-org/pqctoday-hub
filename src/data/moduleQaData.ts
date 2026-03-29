// SPDX-License-Identifier: GPL-3.0-only

/**
 * Loader for module Q&A cross-reference data.
 * Aggregates per-module references to library, compliance, algorithm, threat,
 * timeline, leader, and software entities for the Knowledge Graph.
 */

import Papa from 'papaparse'

// ── Raw CSV row shape ───────────────────────────────────────────────────────

interface RawModuleQaRow {
  question_id: string
  module_id: string
  library_refs: string
  threat_refs: string
  timeline_refs: string
  leader_refs: string
  algorithm_refs: string
  migrate_refs: string
  compliance_refs: string
}

// ── Aggregated cross-references per module ──────────────────────────────────

export interface ModuleQaCrossRefs {
  moduleId: string
  libraryRefs: string[]
  threatRefs: string[]
  timelineRefs: string[]
  leaderRefs: string[]
  algorithmRefs: string[]
  migrateRefs: string[]
  complianceRefs: string[]
}

// ── Glob import ─────────────────────────────────────────────────────────────

const csvModules = import.meta.glob<string>('./module-qa/module_qa_combined_*.csv', {
  query: '?raw',
  import: 'default',
  eager: true,
})

// ── Helpers ─────────────────────────────────────────────────────────────────

function splitSemi(val: string | undefined): string[] {
  if (!val) return []
  return val
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
}

function addAll(target: Set<string>, values: string[]): void {
  for (const v of values) target.add(v)
}

// ── Load & aggregate ────────────────────────────────────────────────────────

function loadModuleQaCrossRefs(): ModuleQaCrossRefs[] {
  // Pick the latest combined CSV (sorted descending by filename date)
  const paths = Object.keys(csvModules).sort().reverse()
  if (paths.length === 0) return []

  const content = csvModules[paths[0]]
  const { data } = Papa.parse<RawModuleQaRow>(content.trim(), {
    header: true,
    skipEmptyLines: true,
  })

  // Aggregate unique refs per module
  const byModule = new Map<
    string,
    {
      library: Set<string>
      threat: Set<string>
      timeline: Set<string>
      leader: Set<string>
      algorithm: Set<string>
      migrate: Set<string>
      compliance: Set<string>
    }
  >()

  for (const row of data) {
    if (!row.module_id) continue

    let sets = byModule.get(row.module_id)
    if (!sets) {
      sets = {
        library: new Set(),
        threat: new Set(),
        timeline: new Set(),
        leader: new Set(),
        algorithm: new Set(),
        migrate: new Set(),
        compliance: new Set(),
      }
      byModule.set(row.module_id, sets)
    }

    addAll(sets.library, splitSemi(row.library_refs))
    addAll(sets.threat, splitSemi(row.threat_refs))
    addAll(sets.timeline, splitSemi(row.timeline_refs))
    addAll(sets.leader, splitSemi(row.leader_refs))
    addAll(sets.algorithm, splitSemi(row.algorithm_refs))
    addAll(sets.migrate, splitSemi(row.migrate_refs))
    addAll(sets.compliance, splitSemi(row.compliance_refs))
  }

  return Array.from(byModule.entries()).map(([moduleId, sets]) => ({
    moduleId,
    libraryRefs: Array.from(sets.library),
    threatRefs: Array.from(sets.threat),
    timelineRefs: Array.from(sets.timeline),
    leaderRefs: Array.from(sets.leader),
    algorithmRefs: Array.from(sets.algorithm),
    migrateRefs: Array.from(sets.migrate),
    complianceRefs: Array.from(sets.compliance),
  }))
}

export const moduleQaCrossRefs: ModuleQaCrossRefs[] = loadModuleQaCrossRefs()
