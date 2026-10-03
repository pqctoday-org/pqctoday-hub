// SPDX-License-Identifier: GPL-3.0-only
import { describe, expect, it } from 'vitest'
import { addedLines, format, scanDiff, scanText } from './leak-guard'

const diff = (file: string, added: string[], start = 1) =>
  [
    `diff --git a/${file} b/${file}`,
    `--- a/${file}`,
    `+++ b/${file}`,
    `@@ -0,0 +${start},${added.length} @@`,
    ...added.map((l) => `+${l}`),
  ].join('\n')

describe('leak-guard', () => {
  it('flags each generic leak pattern in added lines', () => {
    const lines = [
      'see ../pqctoday-priv/scripts/x.py',
      'cached at local-evidence-cache/library/a.pdf',
      'path /Users/First Last/work/file',
      'tmp /private/tmp/claude-501/abc',
      'ruling cx-20260924T223958Z-5e54ccb6',
      'logged in codex-log',
      'from maintenance/lineage/report',
      'see .claude/skills/x/SKILL.md',
    ]
    const rules = scanDiff(diff('src/data/x.csv', lines)).map((f) => f.rule)
    expect(rules).toEqual([
      'private-repo',
      'evidence-cache',
      'home-path',
      'session-tmp-path',
      'run-id',
      'internal-log',
      'internal-folder',
      'agent-config-path',
    ])
  })

  it('reports the location, never the matched text', () => {
    const f = scanDiff(diff('public/a.md', ['x', 'see local-evidence-cache/secret.pdf'], 10))
    expect(f).toEqual([{ rule: 'evidence-cache', where: 'public/a.md:11' }])
    const out = format(f, 'report')
    expect(out).toContain('report-only')
    expect(out).not.toContain('secret.pdf')
  })

  it('flags a new .gitignore re-include', () => {
    const f = scanDiff(diff('.gitignore', ['!scripts/some-tool.py']))
    expect(f.map((x) => x.rule)).toEqual(['gitignore-reinclude'])
  })

  it('does not flag ordinary teaching content', () => {
    const lines = [
      'Large language models such as Claude or GPT can leak secrets.',
      'The maintenance window for HSM firmware is quarterly.',
      'Data lineage is tracked per record.',
    ]
    expect(scanDiff(diff('src/components/Lesson.tsx', lines))).toEqual([])
  })

  it('ignores its own files and removed lines', () => {
    expect(scanDiff(diff('scripts/ci/leak-guard.ts', ['pqctoday-priv']))).toEqual([])
    const removed = ['--- a/x.md', '+++ b/x.md', '@@ -1,1 +0,0 @@', '-pqctoday-priv'].join('\n')
    expect(scanDiff(removed)).toEqual([])
  })

  it('tracks new line numbers across hunks', () => {
    const d = ['+++ b/f.txt', '@@ -3,0 +4,2 @@', '+a', '+b', '@@ -9,0 +12,1 @@', '+c'].join('\n')
    expect(addedLines(d).map((a) => a.line)).toEqual([4, 5, 12])
  })

  it('checks commit messages and PR text, allowing attribution lines', () => {
    const msg = 'fix: thing\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>\n'
    expect(scanText(msg, 'commit message')).toEqual([])
    expect(scanText('see pqctoday-priv/maintenance/x', 'PR body').map((f) => f.rule)).toContain(
      'private-repo'
    )
  })
})
