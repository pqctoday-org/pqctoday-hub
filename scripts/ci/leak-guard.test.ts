// SPDX-License-Identifier: AGPL-3.0-only
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

  it('flags an internal item key anywhere, naming the rule and not the key', () => {
    // Assembled from fragments so this file holds no literal key.
    const key = ['q', 'library', 'edit-some-document-short-description'].join(':')
    const found = scanDiff(diff('src/data/x.csv', [`Applied via approved proposal ${key} on 2026`]))
    expect(found).toEqual([{ rule: 'internal-key', where: 'src/data/x.csv:1' }])
    expect(format(found, 'enforce')).not.toContain('some-document')
    // Also in commit text and PR text, which have no file path.
    expect(scanText(`see ${key}`, 'PR body').map((f) => f.rule)).toEqual(['internal-key'])
    // The key shape needs a section and a slug, and a separate word before the q.
    for (const text of [
      'q:only-one-part',
      'faq:library:edit-x',
      'seq-q:library:x',
      'Q: Which algorithm? A: ML-KEM',
      'https://example.org/search?q=ml-kem:fips',
      'ratio q:p',
    ]) {
      expect(scanDiff(diff('src/data/x.csv', [text]))).toEqual([])
    }
  })

  it('flags "owner decision" in data files only', () => {
    const note = 'All-sector flag: marked all-sector by owner decision; no scope clause settles it.'
    for (const file of ['src/data/a_01012026.csv', 'public/data/b.json', 'public/c.jsonl']) {
      expect(scanDiff(diff(file, [note])).map((f) => f.rule)).toEqual(['decision-citation'])
    }
    expect(scanDiff(diff('src/data/a.csv', ['By Owner-Decision of the board']))).toHaveLength(1)
    // Code comments and repository docs may use the phrase.
    for (const file of ['src/lib/x.ts', 'GATES.md', '.github/workflows/ci.yml', 'dist/x.html']) {
      expect(scanDiff(diff(file, [note]))).toEqual([])
    }
    // Commit and PR text have no file path, so the data-only rule does not apply.
    expect(scanText(note, 'commit message')).toEqual([])
    // The same text in a data file is found when the file is named.
    expect(scanText(note, 'f:1', 'src/data/a.csv').map((f) => f.rule)).toEqual([
      'decision-citation',
    ])
    // A longer word is not the phrase.
    expect(scanDiff(diff('src/data/a.csv', ['the ownership decision tree']))).toEqual([])
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
