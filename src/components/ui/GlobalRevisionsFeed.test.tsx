// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { applyPersonaSort } from './applyPersonaSort'
import { PERSONA_REVISION_DOMAINS } from '@/data/personaConfig'
import type { RevisionEntry } from '@/hooks/useRevisions'

function entry(pr: number, domain: string, ts: string): RevisionEntry {
  return {
    pr_number: pr,
    merge_sha: `sha${pr}`,
    merge_timestamp: ts,
    change_type: 'manual_data_correction',
    domain,
    scope_summary: `test entry ${pr}`,
    rows_affected: 1,
    module_id: null,
    tool_id: null,
    reviewer_id: 'tester',
    reviewer_display: 'Tester',
    approval_method: 'github',
    approved_via: null,
    proxy_github_handle: null,
    authored_by_llm: false,
    confidence_delta: null,
  }
}

describe('applyPersonaSort', () => {
  // Chronological order: newest first (mirrors useRevisions output).
  const FIXTURE: RevisionEntry[] = [
    entry(101, 'module', '2026-05-14T10:00:00Z'),
    entry(102, 'compliance', '2026-05-13T10:00:00Z'),
    entry(103, 'algorithms', '2026-05-12T10:00:00Z'),
    entry(104, 'library', '2026-05-11T10:00:00Z'),
    entry(105, 'migrate', '2026-05-10T10:00:00Z'),
    entry(106, 'threats', '2026-05-09T10:00:00Z'),
  ]

  it('returns input unchanged when priority list is empty', () => {
    expect(applyPersonaSort(FIXTURE, [])).toEqual(FIXTURE)
  })

  it('returns input unchanged for the researcher persona (intentionally empty priority list)', () => {
    expect(PERSONA_REVISION_DOMAINS.researcher).toEqual([])
    const result = applyPersonaSort(FIXTURE, PERSONA_REVISION_DOMAINS.researcher)
    expect(result).toEqual(FIXTURE)
  })

  it('floats priority-domain entries to the top, preserving chronological order within each group', () => {
    const result = applyPersonaSort(FIXTURE, ['compliance', 'migrate'])
    expect(result.map((r) => r.pr_number)).toEqual([
      102, // compliance — newest priority
      105, // migrate
      101, // module — non-priority, chronological order preserved
      103, // algorithms
      104, // library
      106, // threats
    ])
  })

  it('developer persona prioritises algorithms / migrate / tool', () => {
    const result = applyPersonaSort(FIXTURE, PERSONA_REVISION_DOMAINS.developer)
    // FIXTURE has algorithms (#103) and migrate (#105) but no tool entries.
    expect(result.slice(0, 2).map((r) => r.pr_number)).toEqual([103, 105])
  })

  it('executive persona prioritises compliance / migrate / threats', () => {
    const result = applyPersonaSort(FIXTURE, PERSONA_REVISION_DOMAINS.executive)
    expect(result.slice(0, 3).map((r) => r.pr_number)).toEqual([102, 105, 106])
  })

  it('preserves order when all entries are in priority domains', () => {
    const allCompliance = [
      entry(201, 'compliance', '2026-05-14T10:00:00Z'),
      entry(202, 'compliance', '2026-05-13T10:00:00Z'),
    ]
    expect(applyPersonaSort(allCompliance, ['compliance'])).toEqual(allCompliance)
  })

  it('preserves order when no entries match the priority list', () => {
    const onlyOther = [
      entry(301, 'module', '2026-05-14T10:00:00Z'),
      entry(302, 'library', '2026-05-13T10:00:00Z'),
    ]
    expect(applyPersonaSort(onlyOther, ['compliance', 'migrate'])).toEqual(onlyOther)
  })

  it('every persona has a valid revision-domain list (no typos against ALL_DOMAINS)', () => {
    const validDomains = new Set([
      'module',
      'tool',
      'library',
      'compliance',
      'migrate',
      'threats',
      'algorithms',
    ])
    for (const [persona, domains] of Object.entries(PERSONA_REVISION_DOMAINS)) {
      for (const d of domains) {
        expect(validDomains.has(d), `${persona} → "${d}" is not a known revision domain`).toBe(true)
      }
    }
  })
})
