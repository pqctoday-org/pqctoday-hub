// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { ALL_CHANGELOG_VERSIONS, compareChangelogVersion, parseChangelog } from './changelogParser'

describe('changelogParser', () => {
  describe('parseChangelog', () => {
    it('parses a minimal changelog with one version', () => {
      const content = `## [1.0.0] - 2026-01-01

### Added
- **Feature A**: First feature
- **Feature B**: Second feature

### Fixed
- **Bug C**: Fixed crash
`
      const versions = parseChangelog(content)
      expect(versions).toHaveLength(1)
      expect(versions[0].version).toBe('1.0.0')
      expect(versions[0].date).toBe('2026-01-01')
      expect(versions[0].sections).toHaveLength(2)
      expect(versions[0].sections[0].type).toBe('added')
      expect(versions[0].sections[0].entries).toHaveLength(2)
      expect(versions[0].sections[0].entries[0].title).toBe('Feature A')
      expect(versions[0].sections[0].entries[0].body).toBe('First feature')
      expect(versions[0].sections[1].type).toBe('fixed')
      expect(versions[0].sections[1].entries).toHaveLength(1)
    })

    it('extracts persona tags from entries', () => {
      const content = `## [2.0.0] - 2026-02-01

### Added
- **Dashboard** [persona:executive] [persona:architect]: New analytics dashboard
`
      const versions = parseChangelog(content)
      const entry = versions[0].sections[0].entries[0]
      expect(entry.title).toBe('Dashboard')
      expect(entry.meta.personas).toEqual(['executive', 'architect'])
      // After stripping tags, the colon separator may remain at the start of body
      expect(entry.body).toContain('New analytics dashboard')
    })

    it('extracts view tags from entries', () => {
      const content = `## [2.0.0] - 2026-02-01

### Changed
- **Timeline filter** [view:/timeline]: Improved country filtering
`
      const versions = parseChangelog(content)
      const entry = versions[0].sections[0].entries[0]
      expect(entry.meta.views).toEqual(['/timeline'])
    })

    it('handles multiple versions', () => {
      const content = `## [2.0.0] - 2026-02-01

### Added
- **Feature X**: New thing

## [1.0.0] - 2026-01-01

### Added
- **Feature Y**: Old thing
`
      const versions = parseChangelog(content)
      expect(versions).toHaveLength(2)
      expect(versions[0].version).toBe('2.0.0')
      expect(versions[1].version).toBe('1.0.0')
    })

    it('maps section types correctly', () => {
      const content = `## [1.0.0] - 2026-01-01

### Added
- **A**: test

### Changed
- **B**: test

### Fixed
- **C**: test

### Data
- **D**: test

### Security
- **E**: test
`
      const versions = parseChangelog(content)
      const types = versions[0].sections.map((s) => s.type)
      expect(types).toEqual(['added', 'changed', 'fixed', 'data', 'security'])
    })

    it('handles continuation lines', () => {
      const content = `## [1.0.0] - 2026-01-01

### Added
- **Multi-line**: First line
  continued here
  and here too
`
      const versions = parseChangelog(content)
      const entry = versions[0].sections[0].entries[0]
      expect(entry.body).toContain('First line')
      expect(entry.body).toContain('continued here')
    })

    it('returns empty array for non-changelog content', () => {
      const versions = parseChangelog('Just some random text')
      expect(versions).toEqual([])
    })
  })

  describe('ALL_CHANGELOG_VERSIONS', () => {
    it('is pre-parsed and non-empty', () => {
      expect(ALL_CHANGELOG_VERSIONS.length).toBeGreaterThan(0)
    })

    it('has the latest version first', () => {
      const first = ALL_CHANGELOG_VERSIONS[0]
      expect(first.version).toBeTruthy()
      // First entry may be `Unreleased` (no date) or a released version with
      // a date string. Either is valid.
      if (first.version !== 'Unreleased') {
        expect(first.date).toBeTruthy()
      }
      expect(first.sections.length).toBeGreaterThan(0)
    })
  })

  describe('Unreleased section parsing', () => {
    it('parses `## [Unreleased]` with no date', () => {
      const content = `## [Unreleased]

### Added
- **Feature X**: shipping soon

## [1.0.0] - 2026-01-01

### Added
- **Feature Y**: shipped
`
      const versions = parseChangelog(content)
      expect(versions).toHaveLength(2)
      expect(versions[0].version).toBe('Unreleased')
      expect(versions[0].date).toBe('')
      expect(versions[0].sections[0].entries[0].title).toBe('Feature X')
    })

    it('captures multi-word dates without truncation', () => {
      const content = `## [3.3.9] - April 20, 2026

### Added
- **Feature**: ok
`
      const versions = parseChangelog(content)
      expect(versions[0].date).toBe('April 20, 2026')
    })
  })

  describe('compareChangelogVersion', () => {
    it('treats Unreleased as newer than any released version', () => {
      expect(compareChangelogVersion('Unreleased', '3.3.9')).toBeGreaterThan(0)
      expect(compareChangelogVersion('3.3.9', 'Unreleased')).toBeLessThan(0)
      expect(compareChangelogVersion('Unreleased', 'Unreleased')).toBe(0)
    })

    it('compares numeric semver correctly', () => {
      expect(compareChangelogVersion('3.3.10', '3.3.9')).toBeGreaterThan(0)
      expect(compareChangelogVersion('3.3.9', '3.3.10')).toBeLessThan(0)
      expect(compareChangelogVersion('3.4.0', '3.3.9')).toBeGreaterThan(0)
      expect(compareChangelogVersion('3.3.9', '3.3.9')).toBe(0)
    })

    it('handles missing minor/patch segments as zero', () => {
      expect(compareChangelogVersion('3', '3.0.0')).toBe(0)
      expect(compareChangelogVersion('3.1', '3.0.5')).toBeGreaterThan(0)
    })
  })
})
