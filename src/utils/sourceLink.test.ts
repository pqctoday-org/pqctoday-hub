// SPDX-License-Identifier: GPL-3.0-only
import { describe, expect, it } from 'vitest'
import { SOURCE_REPO_URL, normalizeCommit, shortCommit, sourceCodeUrl } from './sourceLink'

const SHA = '0123456789abcdef0123456789abcdef01234567'

describe('sourceLink', () => {
  it('links the exact commit when it is known', () => {
    expect(sourceCodeUrl(SHA)).toBe(`${SOURCE_REPO_URL}/tree/${SHA}`)
    expect(shortCommit(SHA)).toBe('0123456')
  })

  it('accepts an upper-case or padded commit', () => {
    expect(normalizeCommit(`  ${SHA.toUpperCase()}\n`)).toBe(SHA)
  })

  it('falls back to the repository when the commit is unknown or malformed', () => {
    for (const bad of [null, '', 'unknown', SHA.slice(0, 7), `${SHA}0`, 'g'.repeat(40)]) {
      expect(sourceCodeUrl(bad)).toBe(SOURCE_REPO_URL)
      expect(shortCommit(bad)).toBeNull()
    }
  })

  it('defaults to the commit recorded at build (or the repository when none was)', () => {
    expect(sourceCodeUrl()).toMatch(
      /^https:\/\/github\.com\/pqctoday-org\/pqctoday-hub(\/tree\/[0-9a-f]{40})?$/
    )
  })

  it('points at the public pqctoday-hub repository', () => {
    expect(SOURCE_REPO_URL).toBe('https://github.com/pqctoday-org/pqctoday-hub')
  })
})
