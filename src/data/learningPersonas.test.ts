// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { PERSONAS, type PathItem } from './learningPersonas'

const moduleIdsFromPathItems = (items: PathItem[]): string[] =>
  items
    .filter((p): p is Extract<PathItem, { type: 'module' }> => p.type === 'module')
    .map((p) => p.moduleId)

describe('learningPersonas — path consistency', () => {
  // The rendered learning path is driven by `pathItems`; `recommendedPath` is the flat
  // advertised list. If a module appears in pathItems but not recommendedPath the two
  // disagree on what the path contains (the drift that dropped `verification-closure`
  // from the executive path). Guard the executive persona explicitly.
  //
  // NOTE: the ops / developer / architect personas currently carry the same kind of
  // drift (e.g. `cbom`, `verification-closure` present in pathItems only). Reconciling
  // those is a separate curriculum decision and is intentionally NOT enforced here yet,
  // so this business-persona fix cannot silently alter a technical persona's path.
  it('executive: recommendedPath includes every module rendered in pathItems', () => {
    const exec = PERSONAS.executive
    const rendered = moduleIdsFromPathItems(exec.pathItems)
    const advertised = new Set(exec.recommendedPath)
    const missing = rendered.filter((id) => !advertised.has(id))
    expect(missing).toEqual([])
  })

  it('executive: recommendedPath has no module absent from the rendered path', () => {
    const exec = PERSONAS.executive
    const rendered = new Set(moduleIdsFromPathItems(exec.pathItems))
    const orphaned = exec.recommendedPath.filter((id) => !rendered.has(id))
    expect(orphaned).toEqual([])
  })
})
