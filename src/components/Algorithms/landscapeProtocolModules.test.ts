// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  PROTOCOL_LEARN_MODULE,
  MECHANISM_LEARN_MODULE,
  protocolModulesForUseCase,
} from './landscapeProtocolModules'
import { landscapeIndustriesForModule } from './landscapeLearnLinks'
import { loadIndustryLandscape } from '@/data/industryLandscapeData'
import { MANIFEST_BY_ID } from '@/components/PKILearning/manifest/registry'

describe('landscape protocol → module edge (round 9, wave 1.6)', () => {
  it('every mapped module id is a real Learn module', () => {
    for (const [k, v] of [
      ...Object.entries(PROTOCOL_LEARN_MODULE),
      ...Object.entries(MECHANISM_LEARN_MODULE),
    ])
      expect(MANIFEST_BY_ID[v], `${k} -> ${v}`).toBeDefined()
  })
  it('every protocol vocabulary value the CSV uses is either mapped or deliberately unmapped', () => {
    const { useCases } = loadIndustryLandscape()
    const used = new Set(useCases.flatMap((u) => u.protocolsTarget))
    const unmapped = [...used].filter((p) => !PROTOCOL_LEARN_MODULE[p]).sort()
    // No Learn module teaches these; add the module first, then the mapping.
    expect(unmapped).toEqual(['cose', 'eap-radius', 'macsec', 'rpki-bgpsec', 'tpm'])
  })
  it('a TLS use case links tls-basics via tls-1-3 and never repeats its sector module', () => {
    const { useCases } = loadIndustryLandscape()
    const tls = useCases.find(
      (u) => u.protocolsTarget.includes('tls-1-3') && u.learnModuleId !== 'tls-basics'
    )!
    const links = protocolModulesForUseCase(tls)
    expect(links).toContainEqual({ moduleId: 'tls-basics', via: 'tls-1-3' })
    expect(links.map((l) => l.moduleId)).not.toContain(tls.learnModuleId)
    expect(new Set(links.map((l) => l.moduleId)).size).toBe(links.length)
  })
  it('the module panel lists sector rows first, then protocol rows, and reaches the protocol modules', () => {
    const { useCases } = loadIndustryLandscape()
    const tlsEntries = landscapeIndustriesForModule('tls-basics', useCases)
    expect(tlsEntries.length).toBeGreaterThanOrEqual(5)
    const edges = tlsEntries.map((e) => e.edge)
    expect(edges.indexOf('protocol')).toBeGreaterThanOrEqual(edges.lastIndexOf('sector'))
    const covered = new Set<string>()
    for (const uc of useCases) {
      if (uc.learnModuleId) covered.add(uc.learnModuleId)
      for (const l of protocolModulesForUseCase(uc)) covered.add(l.moduleId)
    }
    // 23 sector modules on 4.95.0; the protocol edge adds the modules the rows'
    // vocabulary names (tls-basics, pki-workshop, vpn-ssh-pqc, hsm-pqc, kms-pqc …).
    expect(covered.size).toBeGreaterThanOrEqual(28)
  })
})
