// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  SPLIT_MODULE_REDIRECTS,
  MOVED_CONTENT_REDIRECTS,
  REORDERED_WORKSHOP_STEPS,
  resolveSplitRedirect,
  resolveMovedContentRedirect,
  resolveReorderedStepRedirect,
} from './moduleRedirects'
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

describe('moved-content URL redirects (a module that is still live gave content away)', () => {
  it('only names modules that are still live, and sends content to live modules and real ids', () => {
    for (const [from, rule] of MOVED_CONTENT_REDIRECTS) {
      expect(LIVE.has(from), `${from} must still be live`).toBe(true)
      expect(LIVE.has(rule.to), `${from} → ${rule.to}`).toBe(true)
      const target = MANIFESTS.find((m) => m.id === rule.to)!
      const steps = target.workshopSteps ?? []
      for (const index of rule.workshopSteps.values()) {
        expect(index, `${rule.to} has a workshop step at index ${index}`).toBeLessThan(steps.length)
      }
      const sections = new Set((target.learnSections ?? []).map((s) => s.id))
      for (const id of rule.learnSections.values()) {
        expect(sections.has(id), `${rule.to} has learn section ${id}`).toBe(true)
      }
    }
  })

  it('no longer has the moved step or section on the module that gave it away', () => {
    for (const [from, rule] of MOVED_CONTENT_REDIRECTS) {
      const old = MANIFESTS.find((m) => m.id === from)!
      // The old step index must not be a step any more, or the redirect would
      // hijack a real step of the old module.
      for (const index of rule.workshopSteps.keys()) {
        expect(index, `${from} workshop step ${index} was removed`).toBeGreaterThanOrEqual(
          (old.workshopSteps ?? []).length
        )
      }
      const ids = new Set((old.learnSections ?? []).map((s) => s.id))
      for (const id of rule.learnSections.keys()) {
        expect(ids.has(id), `${from} learn section ${id} was removed`).toBe(false)
      }
    }
  })

  it('sends the old FHE workshop step to the new module, keeping other params and the hash', () => {
    expect(resolveMovedContentRedirect('confidential-computing', '?tab=workshop&step=5')).toBe(
      '/learn/homomorphic-encryption?tab=workshop&step=0'
    )
    expect(
      resolveMovedContentRedirect('confidential-computing', '?step=5&tab=workshop&x=1', '#top')
    ).toBe('/learn/homomorphic-encryption?step=0&tab=workshop&x=1#top')
  })

  it('sends the old FHE learn section, by hash or by ?section=, to the first new section', () => {
    expect(
      resolveMovedContentRedirect('confidential-computing', '', '#homomorphic-encryption')
    ).toBe('/learn/homomorphic-encryption#fhe-fundamentals')
    expect(
      resolveMovedContentRedirect(
        'confidential-computing',
        '?tab=learn&section=homomorphic-encryption'
      )
    ).toBe('/learn/homomorphic-encryption?tab=learn&section=fhe-fundamentals')
  })

  it('leaves every other URL of the old module alone', () => {
    expect(resolveMovedContentRedirect('confidential-computing', '')).toBeNull()
    expect(resolveMovedContentRedirect('confidential-computing', '?tab=workshop&step=4')).toBeNull()
    // step=5 without the Workshop tab is not an FHE link
    expect(resolveMovedContentRedirect('confidential-computing', '?step=5')).toBeNull()
    expect(resolveMovedContentRedirect('confidential-computing', '?tab=workshop&step=x')).toBeNull()
    expect(resolveMovedContentRedirect('confidential-computing', '', '#attestation')).toBeNull()
    expect(
      resolveMovedContentRedirect('confidential-computing', '?section=tee-fundamentals')
    ).toBeNull()
    expect(resolveMovedContentRedirect('hsm-pqc', '?tab=workshop&step=5')).toBeNull()
  })
})

describe('reordered workshop steps (a module that keeps its id)', () => {
  it('only names live modules, and every old and new index is a real step of that module', () => {
    for (const [id, rule] of REORDERED_WORKSHOP_STEPS) {
      const manifest = MANIFESTS.find((m) => m.id === id)
      expect(manifest, `${id} is a live module`).toBeDefined()
      const count = manifest?.workshopSteps?.length ?? 0
      for (const [from, to] of rule.steps) {
        expect(from).toBeLessThan(count)
        expect(to).toBeLessThan(count)
      }
      // a reorder is a permutation: no two old steps land on the same new step
      expect(new Set(rule.steps.values()).size).toBe(rule.steps.size)
    }
  })

  it('maps every old Hybrid Cryptography step to the step that is the same workshop step now', () => {
    const open = (n: number) =>
      resolveReorderedStepRedirect('hybrid-crypto', `?tab=workshop&step=${n}`)
    expect(open(2)).toBe('/learn/hybrid-crypto?tab=workshop&step=4&sv=2') // CA Setup
    expect(open(3)).toBe('/learn/hybrid-crypto?tab=workshop&step=5&sv=2') // Hybrid Formats
    expect(open(4)).toBe('/learn/hybrid-crypto?tab=workshop&step=6&sv=2') // Inspect & Compare
    expect(open(5)).toBe('/learn/hybrid-crypto?tab=workshop&step=3&sv=2') // Hybrid Signatures
    expect(open(6)).toBe('/learn/hybrid-crypto?tab=workshop&step=2&sv=2') // HPKE
  })

  it('marks steps that did not move so that they are not remapped later', () => {
    expect(resolveReorderedStepRedirect('hybrid-crypto', '?tab=workshop&step=1')).toBe(
      '/learn/hybrid-crypto?tab=workshop&step=1&sv=2'
    )
  })

  it('leaves a current link (carrying sv) alone', () => {
    expect(resolveReorderedStepRedirect('hybrid-crypto', '?tab=workshop&step=3&sv=2')).toBeNull()
  })

  it('leaves links without a step, on another tab, or with a bad step alone', () => {
    expect(resolveReorderedStepRedirect('hybrid-crypto', '?tab=workshop')).toBeNull()
    expect(resolveReorderedStepRedirect('hybrid-crypto', '?tab=learn&step=3')).toBeNull()
    expect(resolveReorderedStepRedirect('hybrid-crypto', '?tab=workshop&step=abc')).toBeNull()
    expect(resolveReorderedStepRedirect('pki-workshop', '?tab=workshop&step=3')).toBeNull()
  })

  it('keeps other query parameters and the hash', () => {
    expect(
      resolveReorderedStepRedirect('hybrid-crypto', '?tab=workshop&step=5&flow=x', '#top')
    ).toBe('/learn/hybrid-crypto?tab=workshop&step=3&flow=x&sv=2#top')
  })
})
