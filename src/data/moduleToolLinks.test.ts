// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { MANIFEST_BY_ID } from '@/components/PKILearning/manifest/registry'
import { MODULE_CATALOG } from '@/components/PKILearning/moduleData'
import { WORKSHOP_TOOLS } from '@/components/Playground/workshopRegistry'
import { mobilePracticeTool, moduleIdFromToolLink, resolveModuleTool } from './moduleToolLinks'

describe('mobilePracticeTool — Wave B2 mobile "Practice on your phone" shortlist', () => {
  it('excludes the 3 modules declined for mobile even though they have a real derived tool', () => {
    for (const id of ['mls-group-messaging', 'vpn-ssh-pqc', 'confidential-computing']) {
      const manifest = MANIFEST_BY_ID[id]!
      expect(resolveModuleTool(manifest), `${id} should still have a derived tool`).toBeTruthy()
      expect(mobilePracticeTool(manifest), `${id} should be excluded from mobile`).toBeUndefined()
    }
  })

  it('returns the same tool resolveModuleTool would, for a module not on the exclusion list', () => {
    const manifest = MANIFEST_BY_ID['slh-dsa']!
    expect(mobilePracticeTool(manifest)).toBe(resolveModuleTool(manifest))
    expect(mobilePracticeTool(manifest)).toBe('slh-dsa')
  })

  it('offers the KMIP control plane tool as the phone practice step of Crypto Agility (linked 25 Nov 2026)', () => {
    expect(mobilePracticeTool(MANIFEST_BY_ID['crypto-agility']!)).toBe('cacp-kmip')
  })

  it('shows the KMIP control plane tool a related module on the laptop and the phone alike', () => {
    // Both the laptop detail panel and the phone sheet read the related module the same way:
    // the tool's moduleLink, then the module's title in the catalogue.
    const tool = WORKSHOP_TOOLS.find((t) => t.id === 'cacp-kmip')!
    const moduleId = moduleIdFromToolLink(tool.moduleLink)
    expect(moduleId).toBe('crypto-agility')
    expect(MODULE_CATALOG[moduleId!]?.title).toBeTruthy()
  })

  it('has no twin for hsm-pqc — the plan proposed it but no tool in the registry links back to it', () => {
    expect(mobilePracticeTool(MANIFEST_BY_ID['hsm-pqc']!)).toBeUndefined()
  })

  it("reads a lesson only from a /learn/ link, never from a tool's own page", () => {
    expect(moduleIdFromToolLink('/learn/crypto-agility')).toBe('crypto-agility')
    expect(moduleIdFromToolLink('/learn/iam-pqc?tab=workshop&step=2')).toBe('iam-pqc')
    expect(moduleIdFromToolLink('/playground/openssl-studio')).toBeNull()
    expect(moduleIdFromToolLink('')).toBeNull()
  })

  it('returns undefined for a module with no tool link at all', () => {
    expect(mobilePracticeTool(MANIFEST_BY_ID['pqc-101']!)).toBeUndefined()
  })
})
