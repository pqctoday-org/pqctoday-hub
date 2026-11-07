// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { personaBlocksFor } from './personaBlocks'
import { BUSINESS_TOOLS } from '@/components/BusinessCenter/businessToolsRegistry'

describe('audit planning introduction and tool metadata use the same educational scope', () => {
  it('describes selections and related reading without predicting findings or asserting source mandates', () => {
    const roles = personaBlocksFor('/business/tools/audit-checklist')!
    expect(Object.keys(roles).sort()).toEqual(['executive', 'grc'])
    expect(roles.executive).toContain('not what an audit would find')
    expect(roles.grc).toContain('does not establish that every topic is a source requirement')
    const tool = BUSINESS_TOOLS.find((t) => t.id === 'audit-checklist')!
    expect(tool.name).toBe('Audit Readiness Checklist')
    expect(tool.description).toContain('selections do not assess readiness')
    expect(tool.goodAnswer).toContain('do not establish audit readiness')
    expect(tool.workedExample).toContain('not an audit finding or validated evidence')
    expect([roles.executive, roles.grc, tool.goodAnswer, tool.workedExample].join(' ')).not.toMatch(
      /auditor tomorrow|what an audit will find today|every item cites its source|toward Established/
    )
  })
})
