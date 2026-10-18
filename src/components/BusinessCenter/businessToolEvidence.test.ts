// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { BUSINESS_TOOLS } from './businessToolsRegistry'
import { BUSINESS_TOOL_EVIDENCE_IDS, businessToolEvidence } from '@/data/businessToolEvidence'

describe('business tool evidence contract', () => {
  it('classifies every registered tool and no stale tool id', () => {
    const registryIds = BUSINESS_TOOLS.map((tool) => tool.id).sort()
    expect([...BUSINESS_TOOL_EVIDENCE_IDS].sort()).toEqual(registryIds)
    for (const id of registryIds) {
      const evidence = businessToolEvidence(id)
      expect(evidence?.label).toBeTruthy()
      expect(evidence?.proves).toBeTruthy()
      expect(evidence?.doesNotProve).toBeTruthy()
    }
  })
})
