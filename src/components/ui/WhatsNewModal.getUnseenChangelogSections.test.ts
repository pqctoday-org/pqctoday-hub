// SPDX-License-Identifier: GPL-3.0-only
/**
 * Regression guard for a real, live bug found while investigating 3
 * pre-existing failing tests during the dev-tabs-pkcs11-kmip G9/W6 gate
 * sweep: CHANGELOG.md's top section routinely lands ahead of package.json
 * (this repo's own workflow — entries accumulate in a numbered provisional
 * heading before the version bump), and `getUnseenChangelogSections`
 * treated "newer than lastSeenVersion" as sufficient to surface a section
 * — with no cap at what's actually running. Since `markAllSeen()` can only
 * ever set `lastSeenVersion` to the CURRENT app version, that section was
 * permanently "unseen" for every real visitor until the version bump —
 * the mobile ⋯ button's unread dot was undismissable in production.
 *
 * First block uses the REAL CHANGELOG.md content (not a fixture), with
 * `getCurrentVersion` mocked to control which side of the top entry "the
 * app" is on — proves the fix against production data, not something that
 * could drift from it. The `Unreleased` exemption has no real heading to
 * test against currently, so that one case uses synthetic parsed content.
 */
import { describe, it, expect, vi } from 'vitest'
import { ALL_CHANGELOG_VERSIONS, parseChangelog } from '../../utils/changelogParser'

const mockCurrentVersion = vi.hoisted(() => ({ value: '0.0.0' }))

vi.mock('../../store/useVersionStore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../store/useVersionStore')>()
  return { ...actual, getCurrentVersion: () => mockCurrentVersion.value }
})

const { getUnseenChangelogSections } = await import('./WhatsNewModal')

describe('getUnseenChangelogSections — never surfaces a section ahead of the running app version', () => {
  const topVersion = ALL_CHANGELOG_VERSIONS[0].version
  const secondVersion = ALL_CHANGELOG_VERSIONS[1].version

  it('sanity: the real CHANGELOG.md has at least 2 versions to test against', () => {
    expect(ALL_CHANGELOG_VERSIONS.length).toBeGreaterThanOrEqual(2)
  })

  it('hides the top section when the app is still on the version below it (the bug)', () => {
    mockCurrentVersion.value = secondVersion
    expect(getUnseenChangelogSections(secondVersion, null)).toEqual([])
  })

  it('shows the top section once the app version catches up to it', () => {
    mockCurrentVersion.value = topVersion
    expect(getUnseenChangelogSections(secondVersion, null).length).toBeGreaterThan(0)
  })

  it('the null-lastSeenVersion fallback also respects the cap, not just the >lastSeen filter', () => {
    mockCurrentVersion.value = secondVersion
    const sections = getUnseenChangelogSections(null, null)
    const secondEntryTitles = ALL_CHANGELOG_VERSIONS[1].sections.flatMap((s) =>
      s.entries.map((e) => e.title)
    )
    const shownTitles = sections.flatMap((s) => s.entries.map((e) => e.title))
    for (const title of shownTitles) {
      expect(secondEntryTitles).toContain(title)
    }
  })
})

describe('getUnseenChangelogSections — the literal "Unreleased" marker stays exempt from the cap', () => {
  it('surfaces Unreleased even when the app is on the oldest real version', async () => {
    const synthetic = parseChangelog(`## [Unreleased]

### Added
- **Draft feature**: not yet in any numbered release

## [2.0.0] - 2026-01-02

### Added
- **Released feature**: shipped

## [1.0.0] - 2026-01-01

### Added
- **Older feature**: shipped earlier
`)
    vi.doMock('../../utils/changelogParser', async (importOriginal) => {
      const actual = await importOriginal<typeof import('../../utils/changelogParser')>()
      return { ...actual, ALL_CHANGELOG_VERSIONS: synthetic }
    })
    vi.resetModules()
    mockCurrentVersion.value = '1.0.0'
    const mod = await import('./WhatsNewModal')
    const sections = mod.getUnseenChangelogSections('1.0.0', null)
    const titles = sections.flatMap((s) => s.entries.map((e) => e.title))
    expect(titles).toContain('Draft feature')

    vi.doUnmock('../../utils/changelogParser')
    vi.resetModules()
  })
})
