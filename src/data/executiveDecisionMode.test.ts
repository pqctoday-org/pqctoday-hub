// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Every executive decision-mode link must land on a real page: a top-level
 * route declared in App.tsx, a real Command Center tool id, and query values
 * the destination page actually reads.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'
import {
  EXECUTIVE_DECISION_STEPS,
  executiveDecisionStep,
  formatTrackMinutes,
  fullPathModuleCount,
  FULL_PATH_HREF,
} from './executiveDecisionMode'
import { PERSONA_JOURNEY_BOARD_VARIANTS } from './personaConfig'
import { readGanttViewParams } from './timelineData'
import { LIBRARY_DOORS } from './libraryPurposeDoors'
import { BUSINESS_TOOLS } from '@/components/BusinessCenter/businessToolsRegistry'

const APP_SOURCE = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8')
const TOP_LEVEL_ROUTES = new Set(
  [...APP_SOURCE.matchAll(/path="\/?([a-z-]+)(?:\/\*)?"/g)].map((m) => m[1])
)
const BUSINESS_TOOL_IDS = new Set(BUSINESS_TOOLS.map((t) => t.id))

/** Query values each destination page understands (see the page's own reader). */
function queryIsUnderstood(pathname: string, params: URLSearchParams): boolean {
  if ([...params.keys()].length === 0) return true
  if (pathname === '/timeline') return readGanttViewParams(params).phase === 'Deadline'
  if (pathname === '/report') return params.get('example') === '1'
  if (pathname === '/simulation') return params.get('run') === 'exec'
  if (pathname === '/library') {
    return LIBRARY_DOORS.some((d) => d.id === params.get('purpose'))
  }
  if (pathname === '/learn') return params.get('mode') === 'mypath'
  return false
}

function assertKnownRoute(href: string) {
  const url = new URL(href, 'https://example.test')
  const segments = url.pathname.split('/').filter(Boolean)
  expect(TOP_LEVEL_ROUTES.has(segments[0]), `unknown route ${href}`).toBe(true)
  if (segments[0] === 'business') {
    expect(segments[1]).toBe('tools')
    expect(BUSINESS_TOOL_IDS.has(segments[2]), `unknown Command Center tool ${href}`).toBe(true)
    expect(segments).toHaveLength(3)
  } else {
    expect(segments, `unexpected sub-path ${href}`).toHaveLength(1)
  }
  expect(queryIsUnderstood(url.pathname, url.searchParams), `unread query in ${href}`).toBe(true)
}

describe('executive decision mode', () => {
  it('the route table found the app routes', () => {
    for (const r of ['assess', 'timeline', 'report', 'business', 'compliance', 'revisions']) {
      expect(TOP_LEVEL_ROUTES.has(r)).toBe(true)
    }
  })

  it('covers exactly the six executive boards', () => {
    expect(Object.keys(EXECUTIVE_DECISION_STEPS).sort()).toEqual(
      PERSONA_JOURNEY_BOARD_VARIANTS.executive.map((v) => v.id).sort()
    )
  })

  it.each(Object.entries(EXECUTIVE_DECISION_STEPS))(
    '%s: next and after-that hrefs are known routes',
    (_id, step) => {
      assertKnownRoute(step.nextHref)
      assertKnownRoute(step.afterHref)
      expect(step.nextHref).not.toBe(step.afterHref)
      expect(step.nextLabel.length).toBeLessThanOrEqual(40)
      expect(step.afterLabel.length).toBeLessThanOrEqual(40)
    }
  )

  it('the full-path link is a known route', () => {
    assertKnownRoute(FULL_PATH_HREF)
  })

  it('Evidence opens the sample board pack and keeps content revisions reachable', () => {
    expect(EXECUTIVE_DECISION_STEPS.evidence.nextHref).toBe('/report?example=1')
    expect(EXECUTIVE_DECISION_STEPS.evidence.afterHref).toBe('/revisions')
  })

  it('applies to executive only, and only when the flag is on', () => {
    expect(executiveDecisionStep('executive', 'mandate', true)).not.toBeNull()
    expect(executiveDecisionStep('executive', 'mandate', false)).toBeNull()
    expect(executiveDecisionStep('grc', 'evidence', true)).toBeNull()
    expect(executiveDecisionStep('executive', 'constructor', true)).toBeNull()
  })

  it('formats track time and counts the full path without the quiz', () => {
    expect(formatTrackMinutes(130)).toBe('2 hours 10')
    expect(formatTrackMinutes(60)).toBe('1 hour')
    expect(formatTrackMinutes(45)).toBe('45 minutes')
    expect(fullPathModuleCount('executive')).toBe(25)
  })
})
