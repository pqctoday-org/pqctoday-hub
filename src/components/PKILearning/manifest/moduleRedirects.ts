// SPDX-License-Identifier: AGPL-3.0-only
/**
 * URL redirects for Learn modules that were SPLIT into several modules.
 *
 * A 1→1 rename would only need a route alias; a split has to choose a
 * successor. The old module's `?path=` (its learn-path id) picks one, and is
 * then dropped because the successor has no such path; anything else in the
 * query string and the hash are kept. With no (or an unknown) path, the
 * fallback wins — the same module MODULE_ID_RENAMES sends saved progress to.
 */

interface SplitRedirect {
  /** Old learn-path id → successor module id. */
  byPath: ReadonlyMap<string, string>
  /** Successor when `?path=` is absent or unknown. */
  fallback: string
}

export const SPLIT_MODULE_REDIRECTS: ReadonlyMap<string, SplitRedirect> = new Map([
  // 2026-09-27: FIPS 140-3 & PCI deep dive → LM-067 FIPS + LM-071 PCI.
  [
    'fips-pci-certification',
    {
      byPath: new Map([
        ['fips', 'fips-140-3-certification'],
        ['pci', 'pci-certification'],
      ]),
      fallback: 'fips-140-3-certification',
    },
  ],
  // 2026-10-01: 1→1 renames from the IoT/OT split (no learn-path choice needed).
  ['iot-ot-pqc', { byPath: new Map(), fallback: 'iot-pqc' }],
  ['energy-utilities-pqc', { byPath: new Map(), fallback: 'ot-pqc' }],
])

/** Target URL (`/learn/<id>[?query][#hash]`) for an old split-module URL, or null. */
export function resolveSplitRedirect(fromId: string, search: string, hash = ''): string | null {
  const rule = SPLIT_MODULE_REDIRECTS.get(fromId)
  if (!rule) return null
  const params = new URLSearchParams(search)
  const target = rule.byPath.get(params.get('path') ?? '') ?? rule.fallback
  params.delete('path')
  const query = params.toString()
  return `/learn/${target}${query ? `?${query}` : ''}${hash}`
}

/**
 * URL redirects for content that MOVED OUT of a module that is still live.
 *
 * A split that keeps the old id (confidential-computing keeps its id; its
 * homomorphic-encryption content moved to its own module) cannot use
 * SPLIT_MODULE_REDIRECTS, which redirects a RETIRED id as a whole. Here the old
 * module still renders, so only the URLs that pointed at the moved parts are
 * sent on; every other URL of the old module is left alone.
 *
 * Two kinds of URL moved:
 *  - a workshop step, linked as `?tab=workshop&step=<index>` (an index, so it
 *    also changes meaning when steps are removed from the old module);
 *  - a learn section, linked as `#<id>` or `?section=<id>`.
 */
interface MovedContentRedirect {
  /** Module that now holds the content. */
  to: string
  /** Workshop step index in the old module → index in the new module. */
  workshopSteps: ReadonlyMap<number, number>
  /** Learn section id in the old module → section id in the new module. */
  learnSections: ReadonlyMap<string, string>
}

export const MOVED_CONTENT_REDIRECTS: ReadonlyMap<string, MovedContentRedirect> = new Map([
  // 2026-10-04: FHE section and "FHE + HSM Flows" workshop step (the 6th, index 5)
  // moved from Confidential Computing & TEEs (LM-019) to Homomorphic Encryption
  // (LM-076). The one old learn section became five; its readers land on the first.
  [
    'confidential-computing',
    {
      to: 'homomorphic-encryption',
      workshopSteps: new Map([[5, 0]]),
      learnSections: new Map([['homomorphic-encryption', 'fhe-fundamentals']]),
    },
  ],
])

/**
 * Target URL (`/learn/<id>[?query][#hash]`) for an old URL of a module that gave
 * content away, or null when the URL does not point at moved content (the old
 * module then renders as usual). Other query params and the hash are kept.
 */
export function resolveMovedContentRedirect(
  fromId: string,
  search: string,
  hash = ''
): string | null {
  const rule = MOVED_CONTENT_REDIRECTS.get(fromId)
  if (!rule) return null
  const params = new URLSearchParams(search)
  let nextHash = hash
  let moved = false

  // Workshop step: only when the URL explicitly opens the Workshop tab.
  if (params.get('tab') === 'workshop' && params.has('step')) {
    const step = Number.parseInt(params.get('step') ?? '', 10)
    const target = Number.isNaN(step) ? undefined : rule.workshopSteps.get(step)
    if (target !== undefined) {
      params.set('step', String(target))
      moved = true
    }
  }

  // Learn section, by `?section=` or `#id`.
  const sectionParam = params.get('section')
  const fromParam = sectionParam === null ? undefined : rule.learnSections.get(sectionParam)
  if (sectionParam !== null && fromParam !== undefined) {
    params.set('section', fromParam)
    moved = true
  }
  const hashId = hash.replace(/^#/, '')
  const fromHash = hashId ? rule.learnSections.get(hashId) : undefined
  if (fromHash !== undefined) {
    nextHash = `#${fromHash}`
    moved = true
  }

  if (!moved) return null
  const query = params.toString()
  return `/learn/${rule.to}${query ? `?${query}` : ''}${nextHash}`
}

/**
 * Workshop steps that were REORDERED inside a module that keeps its id.
 *
 * `?tab=workshop&step=<index>` is an index, so a reorder silently points an old link at
 * a different step. The module now writes `&sv=<version>` next to the step it shows; an
 * incoming link that names a step but carries no (or an older) `sv` uses the old order
 * and is rewritten to the new one, once. A link without `step` is the first step in both
 * orders and is left alone.
 */
interface ReorderedSteps {
  /** Written to the URL as `sv`; bump it when the order changes again. */
  version: string
  /** Index in the old order → index in the order the module has now. */
  steps: ReadonlyMap<number, number>
}

export const REORDERED_WORKSHOP_STEPS: ReadonlyMap<string, ReorderedSteps> = new Map([
  // 2026-11-01 (4.192.0): Hybrid Cryptography workshop. Old order: Key Generation, Encrypt &
  // Sign, CA Setup, Hybrid Formats, Inspect & Compare, Hybrid Signatures, HPKE. New order:
  // Key Generation, Hybrid KEM, HPKE, Hybrid Signatures, CA Setup, Hybrid Formats, Inspect &
  // Compare.
  [
    'hybrid-crypto',
    {
      version: '2',
      steps: new Map([
        [2, 4],
        [3, 5],
        [4, 6],
        [5, 3],
        [6, 2],
      ]),
    },
  ],
])

/**
 * Target URL (`/learn/<id>[?query][#hash]`) for an old-order workshop link of a reordered
 * module, or null when the link needs no change (no step, another tab, or already current).
 */
export function resolveReorderedStepRedirect(
  moduleId: string,
  search: string,
  hash = ''
): string | null {
  const rule = REORDERED_WORKSHOP_STEPS.get(moduleId)
  if (!rule) return null
  const params = new URLSearchParams(search)
  if (params.get('tab') !== 'workshop' || !params.has('step')) return null
  if (params.get('sv') === rule.version) return null
  const step = Number.parseInt(params.get('step') ?? '', 10)
  if (Number.isNaN(step)) return null
  params.set('step', String(rule.steps.get(step) ?? step))
  params.set('sv', rule.version)
  return `/learn/${moduleId}?${params.toString()}${hash}`
}
