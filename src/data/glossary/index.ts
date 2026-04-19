// SPDX-License-Identifier: GPL-3.0-only
// Glossary data loader — lazy-loads category JSON files on demand.
//
// Usage:
//   import { loadGlossary, loadCuriousGlossary, loadPkcs11Glossary } from '@/data/glossary'
//   const terms = await loadGlossary()         // all 515 terms
//   const curious = await loadCuriousGlossary() // simplified definitions
//   const pkcs11 = await loadPkcs11Glossary()   // PKCS#11 chip terms
//
// Each category is loaded individually and cached after first load.

import type { GlossaryTerm, GlossaryChipTerm } from './types'

export type { GlossaryTerm, GlossaryChipTerm }

// ── Cached promises — each category is fetched at most once ──────────────────

let _allTermsCache: GlossaryTerm[] | null = null
let _curiousCache: Record<string, string> | null = null
let _pkcs11Cache: GlossaryChipTerm[] | null = null

// ── Category loaders ─────────────────────────────────────────────────────────

const loadCategory = async (category: string): Promise<GlossaryTerm[]> => {
  const loaders: Record<string, () => Promise<{ default: unknown }>> = {
    algorithms: () => import('./algorithms.json'),
    protocols: () => import('./protocols.json'),
    standards: () => import('./standards.json'),
    concepts: () => import('./concepts.json'),
    organizations: () => import('./organizations.json'),
  }
  const mod = await loaders[category]?.()
  return (mod?.default ?? []) as GlossaryTerm[]
}

/** Load all glossary terms from all categories. Cached after first call. */
export const loadGlossary = async (): Promise<GlossaryTerm[]> => {
  if (_allTermsCache) return _allTermsCache

  const [algorithms, protocols, standards, concepts, organizations] = await Promise.all([
    loadCategory('algorithms'),
    loadCategory('protocols'),
    loadCategory('standards'),
    loadCategory('concepts'),
    loadCategory('organizations'),
  ])

  _allTermsCache = [...algorithms, ...protocols, ...standards, ...concepts, ...organizations]
  return _allTermsCache
}

/** Load a single category of glossary terms. */
export const loadGlossaryCategory = async (
  category: GlossaryTerm['category']
): Promise<GlossaryTerm[]> => {
  return loadCategory(category + 's')
}

/** Load the simplified "Curious Explorer" glossary. Cached after first call. */
export const loadCuriousGlossary = async (): Promise<Record<string, string>> => {
  if (_curiousCache) return _curiousCache
  const mod = await import('./curious.json')
  _curiousCache = mod.default as Record<string, string>
  return _curiousCache
}

/** Load the PKCS#11 chip term glossary. Cached after first call. */
export const loadPkcs11Glossary = async (): Promise<GlossaryChipTerm[]> => {
  if (_pkcs11Cache) return _pkcs11Cache
  const mod = await import('./pkcs11.json')
  _pkcs11Cache = (mod.default ?? []) as GlossaryChipTerm[]
  return _pkcs11Cache
}

// ── Synchronous access (for backward compatibility during migration) ─────────
// parseGlossary.tsx builds a regex at module load time, which requires synchronous
// access. We provide a sync getter that returns [] until the async load completes,
// then triggers a re-build.

let _syncTerms: GlossaryTerm[] = []
let _syncLoaded = false

/** Synchronous access to glossary terms. Returns [] until loadGlossary() resolves. */
export const getGlossaryTermsSync = (): GlossaryTerm[] => {
  if (!_syncLoaded) {
    _syncLoaded = true
    loadGlossary().then((terms) => {
      _syncTerms = terms
    })
  }
  return _syncTerms
}

/**
 * Initialize glossary synchronously — call this early in app startup.
 * Returns a promise that resolves when all terms are loaded.
 */
export const initGlossary = async (): Promise<GlossaryTerm[]> => {
  const terms = await loadGlossary()
  _syncTerms = terms
  _syncLoaded = true
  return terms
}
