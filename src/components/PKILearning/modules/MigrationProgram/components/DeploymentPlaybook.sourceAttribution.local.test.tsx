// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  DEPLOYMENT_PLAYBOOK_TITLE,
  DEPLOYMENT_PLAYBOOK_DESCRIPTION,
  DEPLOYMENT_PLAYBOOK_SECTIONS,
} from './DeploymentPlaybook'
import { buildChecklistMarkdown } from '@/components/PKILearning/common/OpsChecklist'
describe('Hub lifecycle checklist attribution', () => {
  it('retains the critical planning item but does not call it a NIST sunset requirement', () => {
    const item = DEPLOYMENT_PLAYBOOK_SECTIONS.flatMap((s) => s.items).find(
      (i) => i.id === 'decom-sunset-date'
    )!
    expect(item.critical).toBe(true)
    expect(item.label).toContain('Hub planning prompt')
    expect(item.label).toContain(
      '§4.6 describes gateway architecture and does not prescribe a sunset date'
    )
    const empty = buildChecklistMarkdown(
      DEPLOYMENT_PLAYBOOK_TITLE,
      DEPLOYMENT_PLAYBOOK_DESCRIPTION,
      DEPLOYMENT_PLAYBOOK_SECTIONS,
      new Set()
    )
    const checked = buildChecklistMarkdown(
      DEPLOYMENT_PLAYBOOK_TITLE,
      DEPLOYMENT_PLAYBOOK_DESCRIPTION,
      DEPLOYMENT_PLAYBOOK_SECTIONS,
      new Set(['decom-sunset-date'])
    )
    expect(empty).toContain('- [ ] ' + item.label)
    expect(checked).toContain('- [x] ' + item.label)
    expect(empty).not.toContain('Set a mandatory sunset date')
  })
})

describe('Retirement planning examples', () => {
  it('keeps both unchecked and fully checked exports scoped to fictional planning artifacts', () => {
    const items = DEPLOYMENT_PLAYBOOK_SECTIONS.flatMap((section) => section.items)
    const retirement = items.find((item) => item.id === 'decom-evidence')!
    expect(retirement.label).toContain('fictional retirement examples')
    expect(retirement.label).toContain('removed trust entries')
    for (const checked of [new Set<string>(), new Set(items.map((item) => item.id))]) {
      const markdown = buildChecklistMarkdown(
        DEPLOYMENT_PLAYBOOK_TITLE,
        DEPLOYMENT_PLAYBOOK_DESCRIPTION,
        DEPLOYMENT_PLAYBOOK_SECTIONS,
        checked
      )
      expect(markdown).toContain('do not establish retirement of a deployed system')
      expect(markdown).toContain(retirement.label)
      expect(markdown).not.toContain('CMVP cert # / ACVP run / CVE-scan clean')
    }
  })
})

describe('Deployment performance planning prompt', () => {
  it('keeps full and resumed baseline measurements in unchecked and selected Markdown without an invented percentage', () => {
    const item = DEPLOYMENT_PLAYBOOK_SECTIONS.flatMap((section) => section.items).find(
      (row) => row.id === 'hybrid-perf-test'
    )!
    for (const checked of [new Set<string>(), new Set(['hybrid-perf-test'])]) {
      const markdown = buildChecklistMarkdown(
        DEPLOYMENT_PLAYBOOK_TITLE,
        DEPLOYMENT_PLAYBOOK_DESCRIPTION,
        DEPLOYMENT_PLAYBOOK_SECTIONS,
        checked
      )
      expect(markdown).toContain(item.label)
      expect(markdown).toContain(
        'full and resumed handshake latency, throughput, message sizes and failure rates against the selected baseline'
      )
      expect(markdown).not.toContain('expect 2-5% increase')
    }
  })
})
