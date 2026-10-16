// SPDX-License-Identifier: GPL-3.0-only
import { describe, expect, it } from 'vitest'
import type { ExecutiveDocument } from '@/services/storage/types'
import { BUSINESS_TOOLS } from '@/components/BusinessCenter/businessToolsRegistry'
import {
  ARCHITECTURE_PACK_DISCLAIMER,
  ARCHITECTURE_PACK_SECTIONS,
  buildArchitecturePack,
  demoteHeadings,
  toolPathFor,
} from './architecturePack'

const now = new Date('2026-10-16T12:00:00Z')

const doc = (over: Partial<ExecutiveDocument>): ExecutiveDocument => ({
  id: over.id ?? 'x',
  moduleId: 'crypto-mgmt-modernization',
  type: 'hybrid-transition',
  title: 'Hybrid plan',
  data: '# Hybrid plan\n\nBody',
  createdAt: Date.parse('2026-10-01T00:00:00Z'),
  ...over,
})

describe('architecture pack', () => {
  it('lists every section as missing, with its tool, when nothing is saved', () => {
    const pack = buildArchitecturePack({ documents: [], now, origin: 'https://example.test' })
    expect(pack.present).toEqual([])
    expect(pack.missing).toHaveLength(ARCHITECTURE_PACK_SECTIONS.length)
    for (const m of pack.missing) expect(m.toolPath).toMatch(/^\/business\/tools\//)
    expect(pack.markdown).toContain('Sections: 0 of 7 present')
    expect(pack.markdown).toContain('## What is missing')
    expect(pack.markdown).toContain('https://example.test/business/tools/mti-negotiator')
    expect(pack.markdown).toContain('Scope: not stated')
    expect(pack.markdown).toContain(ARCHITECTURE_PACK_DISCLAIMER)
  })

  it('every section type links to a tool page that exists', () => {
    const ids = new Set(BUSINESS_TOOLS.map((t) => t.id))
    for (const s of ARCHITECTURE_PACK_SECTIONS) {
      const path = toolPathFor(s.type)
      expect(path).not.toBeNull()
      expect(ids.has(String(path).replace('/business/tools/', ''))).toBe(true)
    }
  })

  it('keeps the fixed order and uses the latest document of each type', () => {
    const pack = buildArchitecturePack({
      now,
      author: 'A. Architect',
      scope: 'Payments platform',
      documents: [
        doc({ id: 'old', data: 'OLD PLAN', updatedAt: Date.parse('2026-10-02T00:00:00Z') }),
        doc({
          id: 'new',
          data: 'NEW PLAN',
          updatedAt: Date.parse('2026-10-05T00:00:00Z'),
          approvalStatus: 'approved',
          reviewer: 'R. Reviewer',
        }),
        doc({ id: 'cbom', type: 'crypto-cbom', title: 'CBOM', data: 'CBOM BODY' }),
      ],
    })
    expect(pack.present).toEqual(['crypto-cbom', 'hybrid-transition'])
    const md = pack.markdown
    expect(md).toContain('NEW PLAN')
    expect(md).not.toContain('OLD PLAN')
    expect(md.indexOf('CBOM BODY')).toBeLessThan(md.indexOf('NEW PLAN'))
    expect(md).toContain('- Author: A. Architect')
    expect(md).toContain('- Scope: Payments platform')
    expect(md).toContain('| 4 | Hybrid Transition Plan | approved | R. Reviewer | 2026-10-05 |')
    expect(md).toContain('Sections: 2 of 7 present')
  })

  it('pushes artefact headings under the section heading', () => {
    expect(demoteHeadings('# A\n## B\ntext #not\n###### F')).toBe(
      '### A\n#### B\ntext #not\n###### F'
    )
  })
})
