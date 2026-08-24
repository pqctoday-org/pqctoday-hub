// SPDX-License-Identifier: GPL-3.0-only
//
// Drift guard for the mobile UX layer (design_handoff_pqc_mobile_ux
// IMPLEMENTATION-PLAN.md, improvement-plan Phase R3.4). The plan's Phase 5
// committed to an acceptance test asserting "no duration/count/lm_id
// literal exists under src/components/Mobile/" — that committed-to test was
// never built, and its absence is exactly what let the R3-audit literals
// (CRQC bounds, quiz pass threshold, records glossary, etc.) go unnoticed
// until a manual pass found them.
//
// Scope, deliberately bounded rather than a generic literal-scanner (which
// would be either too noisy — every px value, every array index — or too
// narrow to trust): two concrete, mechanically-checkable invariants the
// 2026-08-24 audit specifically asked this test to cover.
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { WORKSHOP_TOOLS } from '@/components/Playground/workshopRegistry'
import { BUSINESS_TOOLS } from '@/components/BusinessCenter/businessToolsRegistry'
import { DROPPED_TOOL_IDS as PLAYGROUND_DROPPED_IDS } from './screens/MobilePlaygroundView'
import { DROPPED_TOOL_IDS as BUSINESS_DROPPED_IDS } from './screens/MobileBusinessToolsView'

const MOBILE_DIR = dirname(fileURLToPath(import.meta.url))

function walkSourceFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      out.push(...walkSourceFiles(full))
    } else if (
      /\.tsx?$/.test(entry.name) &&
      !entry.name.endsWith('.test.ts') &&
      !entry.name.endsWith('.test.tsx')
    ) {
      out.push(full)
    }
  }
  return out
}

describe('mobile UX layer — drift guard (audit R3.4)', () => {
  // Handoff README: "Minimum sizes — enforce these. No text below 10px."
  // (R2.3 fixed the 4 real violations this test would have caught; this is
  // the regression guard so a new one under 10px has to justify itself.)
  it('no Mobile/* source renders text below the handoff-enforced 10px floor', () => {
    const violations: { file: string; match: string }[] = []
    for (const file of walkSourceFiles(MOBILE_DIR)) {
      const text = readFileSync(file, 'utf8')
      // text-[Npx] or text-[N.Npx] with N < 10 — text-[10px] and up are fine.
      const re = /text-\[(\d(?:\.\d+)?)px\]/g
      let m: RegExpExecArray | null
      while ((m = re.exec(text))) {
        if (Number(m[1]) < 10) {
          violations.push({ file: file.replace(MOBILE_DIR, 'Mobile'), match: m[0] })
        }
      }
    }
    expect(violations).toEqual([])
  })

  // audit finding: neither drop list has any guard that its ids still
  // resolve in the real registry — a renamed/removed tool id would silently
  // stop being dropped (a phone-broken tool reappearing in the mobile
  // catalogue) with no test failure anywhere.
  it('every Playground DROPPED_TOOL_IDS entry resolves in WORKSHOP_TOOLS', () => {
    const realIds = new Set(WORKSHOP_TOOLS.map((t) => t.id))
    for (const droppedId of PLAYGROUND_DROPPED_IDS) {
      expect(realIds.has(droppedId), `"${droppedId}" not found in WORKSHOP_TOOLS`).toBe(true)
    }
  })

  it('every Business Tools DROPPED_TOOL_IDS entry resolves in BUSINESS_TOOLS', () => {
    const realIds = new Set(BUSINESS_TOOLS.map((t) => t.id))
    for (const droppedId of BUSINESS_DROPPED_IDS) {
      expect(realIds.has(droppedId), `"${droppedId}" not found in BUSINESS_TOOLS`).toBe(true)
    }
  })
})
