/* eslint-disable */
import fs from 'fs'
import path from 'path'
import {
  MODULE_CATALOG,
  MODULE_TRACKS,
  LEARN_SECTIONS,
  WORKSHOP_STEPS,
  MODULE_STEP_COUNTS,
  TRACK_COLORS,
} from '../src/components/PKILearning/moduleData'

// 1. Build TRACK_ORDER array based on how they currently appear in MODULE_TRACKS
const TRACK_ORDER = MODULE_TRACKS.map((t) => t.track)

// 2. We need to assign each module ID to a track
const moduleToTrack: Record<string, string> = {}
for (const group of MODULE_TRACKS) {
  for (const m of group.modules) {
    if (m && m.id) {
      moduleToTrack[m.id] = group.track
    }
  }
}

// 3. Assemble unified objects
const allIds = new Set([...Object.keys(MODULE_CATALOG), ...Object.keys(MODULE_STEP_COUNTS)])

const unifiedModules: any = {}

for (const id of allIds) {
  const cat = MODULE_CATALOG[id] || { id, title: 'Unknown', description: '', duration: '' }
  const track = moduleToTrack[id]
  const count = MODULE_STEP_COUNTS[id] || 0
  const lsec = LEARN_SECTIONS[id]
  const wsec = WORKSHOP_STEPS[id]

  unifiedModules[id] = {
    ...cat,
    ...(track ? { track } : {}),
    stepCount: count,
    ...(lsec ? { learnSections: lsec } : {}),
    ...(wsec ? { workshopSteps: wsec } : {}),
  }
}

// Ensure the keys are nicely ordered
const sortedKeys = Object.keys(unifiedModules).sort((a, b) => {
  // Sort by track roughly, then by ID
  const trackA = unifiedModules[a].track || 'Z'
  const trackB = unifiedModules[b].track || 'Z'
  if (trackA !== trackB) {
    return TRACK_ORDER.indexOf(trackA) - TRACK_ORDER.indexOf(trackB)
  }
  return a.localeCompare(b)
})

const orderedModules: Record<string, any> = {}
for (const k of sortedKeys) {
  orderedModules[k] = unifiedModules[k]
}

// Write the output file structure
const outts = `// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleItem } from './ModuleCard'

/**
 * Ordered list of tracks for learning module organization.
 * Changing this array reorders the grids in PKILearning.
 */
export const TRACK_ORDER = ${JSON.stringify(TRACK_ORDER, null, 2)} as const

/** Semantic colors for UI badges based on track name */
export const TRACK_COLORS: Record<string, string> = ${JSON.stringify(TRACK_COLORS, null, 2)}

export interface ModuleSection {
  id: string
  label: string
}

export interface ModuleDefinition extends ModuleItem {
  track?: typeof TRACK_ORDER[number]
  stepCount: number
  learnSections?: ModuleSection[]
  workshopSteps?: ModuleSection[]
}

/**
 * Unified Source of Truth for PKI Learning Modules
 */
export const MODULES: Record<string, ModuleDefinition> = ${JSON.stringify(orderedModules, null, 2)}

// ── Derived Parallel Structures ─────────────────────────────────────────────
// (Exported to maintain 100% backwards compatibility with existing importers)

export const MODULE_CATALOG: Record<string, ModuleItem> = Object.fromEntries(
  Object.entries(MODULES).map(([k, v]) => [
    k,
    { id: v.id, title: v.title, description: v.description, duration: v.duration, ...(v.difficulty ? { difficulty: v.difficulty } : {}) }
  ])
)

export const MODULE_STEP_COUNTS: Record<string, number> = Object.fromEntries(
  Object.entries(MODULES).map(([k, v]) => [k, v.stepCount])
)

export const LEARN_SECTIONS: Record<string, ModuleSection[]> = Object.fromEntries(
  Object.entries(MODULES).filter(([_, v]) => v.learnSections).map(([k, v]) => [k, v.learnSections!])
)

export const WORKSHOP_STEPS: Record<string, ModuleSection[]> = Object.fromEntries(
  Object.entries(MODULES).filter(([_, v]) => v.workshopSteps).map(([k, v]) => [k, v.workshopSteps!])
)

export const MODULE_TO_TRACK: Record<string, string> = Object.fromEntries(
  Object.entries(MODULES).filter(([_, v]) => v.track).map(([k, v]) => [k, v.track!])
)

export const MODULE_TRACKS: { track: string; modules: ModuleItem[] }[] = TRACK_ORDER.map(track => {
  return {
    track,
    modules: Object.values(MODULES)
      .filter(m => m.track === track)
      .map(m => MODULE_CATALOG[m.id]!)
  }
})
`

const outPath = path.join(process.cwd(), 'src/components/PKILearning/moduleData.ts')
fs.writeFileSync(outPath, outts, 'utf-8')
console.log('Successfully refactored moduleData.ts')
