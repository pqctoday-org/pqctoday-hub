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
