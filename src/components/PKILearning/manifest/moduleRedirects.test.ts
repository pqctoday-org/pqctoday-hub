// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { SPLIT_MODULE_REDIRECTS, resolveSplitRedirect } from './moduleRedirects'
import { MODULE_ID_RENAMES } from './contentVersion'
import { MANIFESTS } from './registry'

const LIVE = new Set(MANIFESTS.map((m) => m.id))

describe('split-module URL redirects', () => {
  it('redirects from retired ids to live modules only', () => {
    for (const [from, rule] of SPLIT_MODULE_REDIRECTS) {
      expect(LIVE.has(from), `${from} must be retired`).toBe(false)
      for (const target of [rule.fallback, ...rule.byPath.values()]) {
        expect(LIVE.has(target), `${from} → ${target}`).toBe(true)
      }
    }
  })

  it('falls back to the module saved progress is renamed to', () => {
    for (const [from, rule] of SPLIT_MODULE_REDIRECTS) {
      expect(MODULE_ID_RENAMES[from], from).toBe(rule.fallback)
    }
  })

  it('routes the old FIPS & PCI URL by its learn path, keeping other params and the hash', () => {
    expect(resolveSplitRedirect('fips-pci-certification', '?path=pci')).toBe(
      '/learn/pci-certification'
    )
    expect(resolveSplitRedirect('fips-pci-certification', '?path=fips&tab=workshop', '#x')).toBe(
      '/learn/fips-140-3-certification?tab=workshop#x'
    )
    expect(resolveSplitRedirect('fips-pci-certification', '')).toBe(
      '/learn/fips-140-3-certification'
    )
    expect(resolveSplitRedirect('fips-pci-certification', '?path=nope')).toBe(
      '/learn/fips-140-3-certification'
    )
  })

  it('returns null for an id that was never split', () => {
    expect(resolveSplitRedirect('hsm-pqc', '?path=pci')).toBeNull()
  })
})
