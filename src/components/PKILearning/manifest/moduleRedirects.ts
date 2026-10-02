// SPDX-License-Identifier: GPL-3.0-only
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
