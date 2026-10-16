// SPDX-License-Identifier: GPL-3.0-only
/**
 * Role guides (the *QuantumImpact modules and the SOC module) link to other
 * Learn modules by id in `modules: [{ id, label }]` lists. An id with no
 * module behind it renders a link to a page that does not exist — the SOC
 * guide linked `/learn/quantum-computing-basics` until 2026-10-15, which
 * search engines reported as a 404. Every such id must be a real module.
 */
import { describe, it, expect } from 'vitest'
import { MODULE_CATALOG } from './moduleData'

const files = import.meta.glob<string>('./modules/*/data.ts', {
  query: '?raw',
  import: 'default',
  eager: true,
})

describe('Learn module cross-links point at real modules', () => {
  it('every id in a modules: [...] list exists in MODULE_CATALOG', () => {
    const missing: string[] = []
    let checked = 0
    for (const [path, src] of Object.entries(files)) {
      for (const block of src.matchAll(/modules:\s*\[([\s\S]*?)\]/g)) {
        for (const m of block[1].matchAll(/id:\s*'([^']+)'/g)) {
          checked++
          if (!MODULE_CATALOG[m[1]]) missing.push(`${path}: ${m[1]}`)
        }
      }
    }
    expect(checked).toBeGreaterThan(0)
    expect(missing).toEqual([])
  })
})
