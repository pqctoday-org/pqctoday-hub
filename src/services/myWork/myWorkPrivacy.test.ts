// SPDX-License-Identifier: AGPL-3.0-only
/* eslint-disable security/detect-non-literal-fs-filename -- static-analysis test that reads the repo's own src/ tree */
/**
 * Decision J5: no learner text goes to analytics. Two checks: nothing in My work or Updates reaches the analytics
 * module except through `myWorkAnalytics.ts` (whose only inputs are an action name and a count), and a full pass
 * through the screens, with recognisable comment and answer text, sends no event that contains any of it.
 */
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'fs'
import { join } from 'path'

const SRC = join(process.cwd(), 'src')
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((e) => {
    const full = join(dir, e)
    return statSync(full).isDirectory() ? walk(full) : [full]
  })

const MY_WORK_FILES = [
  ...walk(join(SRC, 'components/MyWork')),
  ...walk(join(SRC, 'services/myWork')),
  join(SRC, 'services/assistant/savedAnswers.ts'),
  join(SRC, 'store/useMyWorkStore.ts'),
  join(SRC, 'store/useUpdatesStore.ts'),
  join(SRC, 'store/deviceLocalJson.ts'),
].filter((f) => !/\.test\.tsx?$/.test(f))

describe('no learner text to analytics (J5)', () => {
  it('only myWorkAnalytics.ts imports the analytics module', () => {
    const importers = MY_WORK_FILES.filter((f) =>
      /from ['"]@\/utils\/analytics['"]/.test(readFileSync(f, 'utf8'))
    )
    expect(importers.map((f) => f.replace(SRC, 'src'))).toEqual([
      'src/services/myWork/myWorkAnalytics.ts',
    ])
  })

  it('myWorkAnalytics takes an action name and a number, nothing that can hold text', () => {
    const text = readFileSync(join(SRC, 'services/myWork/myWorkAnalytics.ts'), 'utf8')
    const signature = /export function trackMyWork\(([^)]*)\)/.exec(text)?.[1] ?? ''
    expect(signature.replace(/\s+/g, ' ').trim()).toBe('action: MyWorkAction, count?: number')
    expect(text).not.toMatch(/\bstring\b.*\bparams?\b/)
  })

  it('no file in My work talks to an analytics library or beacon directly', () => {
    for (const f of MY_WORK_FILES) {
      const text = readFileSync(f, 'utf8')
      expect(text, f).not.toMatch(/ReactGA|gtag\(|sendBeacon/)
    }
  })
})
