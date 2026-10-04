// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi, afterEach } from 'vitest'
import { reviewerDisplay, REVIEWER_DISPLAY_ALIASES } from './reviewerDisplay'

describe('reviewerDisplay', () => {
  it('shows the earliest automated records as "maintainer (automated)"', () => {
    expect(reviewerDisplay('claude-agent (automated remediation)')).toBe('maintainer (automated)')
  })

  it('leaves every other reviewer name exactly as stored', () => {
    for (const name of [
      'eramusa',
      'maintainer',
      'Maintainer',
      'maintenance-review',
      'unreviewed',
    ]) {
      expect(reviewerDisplay(name)).toBe(name)
    }
  })

  it('an alias never maps to a name that names a tool', () => {
    for (const shown of REVIEWER_DISPLAY_ALIASES.values()) {
      expect(shown).not.toMatch(/claude|codex|gpt|agent/i)
    }
  })
})

describe('useRevisions applies the alias to what readers see', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it('renders the stored automated name as the neutral one, and keeps the others', async () => {
    const line = (display: string) =>
      JSON.stringify({
        pr_number: 1,
        merge_sha: 'abc',
        merge_timestamp: '2026-06-05T18:33:47-04:00',
        change_type: 'data_update',
        domain: 'migrate',
        scope_summary: 's',
        rows_affected: 1,
        module_id: null,
        tool_id: null,
        reviewer_id: 'x',
        reviewer_display: display,
        approval_method: 'offline',
        approved_via: null,
        proxy_github_handle: null,
        authored_by_llm: true,
        confidence_delta: null,
      })
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        text: () =>
          Promise.resolve(
            [line('claude-agent (automated remediation)'), line('eramusa')].join('\n')
          ),
      })
    )
    vi.resetModules()
    const { renderHook, waitFor } = await import('@testing-library/react')
    const { useRevisions } = await import('@/hooks/useRevisions')
    const { result } = renderHook(() => useRevisions())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    const shown = result.current.revisions.map((r) => r.reviewer_display).sort()
    expect(shown).toEqual(['eramusa', 'maintainer (automated)'])
  })
})
