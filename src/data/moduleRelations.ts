// SPDX-License-Identifier: GPL-3.0-only
/**
 * moduleRelations — module↔module relations computed from tags the manifests
 * already carry, with an explicit seam for a hand-authored graph to override.
 *
 * Why this file exists (WS12 / WS22 Phase 1 Stage 3, 2026-08-21):
 *   The product had shipped the same tag-driven auto-surfacing move three times
 *   in narrow places — `toolSearchEntries.ts` (⌘K entries derived from the two
 *   tool registries), the tool→module "Related module" card derived from
 *   `WorkshopTool.moduleLink`, and `RecommendedResourcesPanel` keyed off a
 *   business tool's own `cswp39Zone`. Module→module was the one direction with
 *   NO mechanism at all: a grep for "Related Modules" across all 65 modules
 *   found exactly two hand-written JSX blocks. This is the fourth application
 *   of the same pattern, not a fourth pattern.
 *
 * The signals, and why these:
 *   - `track` — present on 64 of 65 manifests (only the synthetic `quiz` entry
 *     has none, and it is excluded as a candidate anyway). The smallest track
 *     holds 4 modules, so same-track alone guarantees every module at least 3
 *     candidates; the panel can never render empty. Guarded.
 *   - `frameworkPhase` — required, present on 65 of 65, `PhaseId | PhaseId[]`.
 *   - `taxonomy.algorithms` / `taxonomy.standards` — populated on 21 of 65. A
 *     BONUS signal only: never required for a candidate to qualify, so the
 *     44 manifests without it are not penalised. Terms are weighted by how
 *     rare they are across those 21, so "ML-DSA" (11 of 21) cannot outrank a
 *     module's own track.
 *
 * No relationship here is authored. Every edge is a consequence of tags that
 * already existed for unrelated reasons (catalogue grouping, phase colouring,
 * the derive pipeline's MODULE_TAXONOMY).
 *
 * ── The override seam (deliberate, load-bearing) ──────────────────────────
 * `WS2-module-graph.md` proposes hand-authored `prerequisiteIds`/`followOnIds`
 * on ModuleManifest. If that ever ships it MUST override this engine, not stack
 * with it: two "related modules" sources rendering side by side double up and
 * neither can be reasoned about. So `moduleRelations()` returns an `origin`
 * discriminator and the panel renders exactly one list:
 *
 *   authored        — the manifest declares prerequisiteIds/followOnIds.
 *                     Computed output is discarded, not appended.
 *   authored-inline — the module renders its own hand-written Related Modules
 *                     block inside its tab content (2 modules today). Computed
 *                     output is suppressed entirely so the visitor never sees
 *                     two competing panels. See AUTHORED_INLINE_RELATED.
 *   computed        — this engine's tag-derived output (every other module).
 *
 * `moduleRelations.driftguard.test.ts` asserts all three branches, that the
 * inline set matches a re-derivation from source, and that no module can end
 * up with an empty computed panel.
 */
import { MANIFESTS, MANIFEST_BY_ID } from '@/components/PKILearning/manifest/registry'
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

export interface RelatedModule {
  id: string
  title: string
  score: number
  /** Human-readable justification, rendered under the link. */
  reason: string
}

export type RelationOrigin = 'authored' | 'authored-inline' | 'computed'

export interface ModuleRelationsResult {
  origin: RelationOrigin
  entries: RelatedModule[]
}

/** How many computed relations the panel shows. */
export const RELATED_MODULES_CAP = 4

/** Score weights — see the file header for why each signal was chosen. */
const SCORE_SAME_TRACK = 2
const SCORE_SHARED_PHASE = 2
const SCORE_PER_SHARED_TAXONOMY = 3
const SCORE_PER_SHARED_COMMON_TAXONOMY = 1
/**
 * A taxonomy term shared by more than this share of the taxonomy-bearing
 * manifests is a weak signal, not a topical one, and scores the reduced weight.
 * Measured 2026-08-21 across the 21 populated manifests: `ML-DSA` appears in 11
 * and `ML-KEM` in 9 — almost every module touches them, so left at full weight
 * they pushed generic algorithm matches above a module's own track siblings
 * (`hsm-pqc` ranked `mls-group-messaging` over `secure-boot-pqc`). The cutoff is
 * derived from the data on every call, not hard-coded per term.
 */
const COMMON_TAXONOMY_SHARE = 1 / 3

/**
 * Modules that already render their OWN hand-written "Related Modules" block
 * inside their tab content. The computed panel is suppressed for these so the
 * authored curation wins and no module shows two competing panels.
 *
 * This is the pre-WS2 form of the same override the `authored` branch handles:
 * a human picked these edges, so a tag heuristic does not get to argue.
 * `moduleRelations.driftguard.test.ts` re-derives this set from the module
 * sources on every run, so adding or removing an inline block without updating
 * this list fails the build rather than shipping a duplicate panel.
 */
export const AUTHORED_INLINE_RELATED: readonly string[] = ['automotive-pqc', 'pqc-business-case']

/** Modules that are never a related-module candidate (synthetic entries). */
function isCandidate(m: ModuleManifest): boolean {
  return !m.custom && Boolean(m.track)
}

function phasesOf(m: ModuleManifest): string[] {
  return Array.isArray(m.frameworkPhase) ? m.frameworkPhase : [m.frameworkPhase]
}

function taxonomyTermsOf(m: ModuleManifest): string[] {
  const t = m.taxonomy
  if (!t) return []
  return [...(t.algorithms ?? []), ...(t.standards ?? [])]
}

/**
 * Per-term weight, derived from how many manifests carry each term. Rare terms
 * ("LMS/XMSS", "SPDX / ISO 5962") say two modules are about the same thing;
 * ubiquitous ones ("ML-DSA") say almost nothing. See COMMON_TAXONOMY_SHARE.
 */
function taxonomyWeights(all: ModuleManifest[]): Map<string, number> {
  const counts = new Map<string, number>()
  let bearing = 0
  for (const m of all) {
    if (!m.taxonomy) continue
    bearing++
    for (const term of new Set(taxonomyTermsOf(m))) counts.set(term, (counts.get(term) ?? 0) + 1)
  }
  const cutoff = bearing * COMMON_TAXONOMY_SHARE
  const weights = new Map<string, number>()
  for (const [term, n] of counts)
    weights.set(term, n > cutoff ? SCORE_PER_SHARED_COMMON_TAXONOMY : SCORE_PER_SHARED_TAXONOMY)
  return weights
}

/**
 * Tag-computed relations for one module, highest score first.
 *
 * Pure: takes the full manifest collection so it can be unit-tested against
 * fixtures without the registry. Self is always excluded; only candidates with
 * a non-zero score are returned; the caller applies {@link RELATED_MODULES_CAP}.
 */
export function relatedModules(id: string, all: ModuleManifest[]): RelatedModule[] {
  const self = all.find((m) => m.id === id)
  if (!self || !isCandidate(self)) return []

  const selfPhases = new Set(phasesOf(self))
  const selfTaxonomy = new Set(taxonomyTermsOf(self))
  const weights = taxonomyWeights(all)

  const scored = all
    .filter((m) => m.id !== id && isCandidate(m))
    .map((m) => {
      const reasons: string[] = []
      let score = 0

      if (self.track && m.track === self.track) {
        score += SCORE_SAME_TRACK
        reasons.push(`Same track · ${m.track}`)
      }

      const sharedPhases = phasesOf(m).filter((p) => selfPhases.has(p))
      if (sharedPhases.length > 0) {
        score += SCORE_SHARED_PHASE
        reasons.push('Same migration phase')
      }

      const sharedTerms = taxonomyTermsOf(m).filter((t) => selfTaxonomy.has(t))
      if (sharedTerms.length > 0) {
        for (const term of sharedTerms) score += weights.get(term) ?? SCORE_PER_SHARED_TAXONOMY
        reasons.push(`Shares ${sharedTerms.slice(0, 3).join(', ')}`)
      }

      return {
        id: m.id,
        title: m.title,
        score,
        reason: reasons.join(' · '),
        // Tie-break only: keep neighbours in the same track adjacent so the
        // ordering is stable and reads as a sequence, never a random draw.
        trackDistance:
          self.track && m.track === self.track
            ? Math.abs((m.trackOrder ?? 0) - (self.trackOrder ?? 0))
            : Number.MAX_SAFE_INTEGER,
      }
    })
    .filter((c) => c.score > 0)

  scored.sort(
    (a, b) => b.score - a.score || a.trackDistance - b.trackDistance || a.id.localeCompare(b.id)
  )

  return scored.map(({ id: cid, title, score, reason }) => ({ id: cid, title, score, reason }))
}

/**
 * The authored graph, if a module declares one.
 *
 * Returns `null` when the manifest carries neither array — which is every
 * module today, since WS2 is unbuilt. The moment a manifest populates either
 * field this takes over completely; nothing computed is appended.
 */
export function authoredRelations(
  m: ModuleManifest,
  byId: Record<string, ModuleManifest> = MANIFEST_BY_ID
): RelatedModule[] | null {
  const prerequisites = m.prerequisiteIds ?? []
  const followOns = m.followOnIds ?? []
  if (prerequisites.length === 0 && followOns.length === 0) return null

  const resolve = (ids: string[], reason: string): RelatedModule[] =>
    ids
      .map((rid) => byId[rid as keyof typeof byId])
      .filter((target): target is ModuleManifest => Boolean(target))
      .map((target) => ({ id: target.id, title: target.title, score: 0, reason }))

  return [...resolve(prerequisites, 'Prerequisite'), ...resolve(followOns, 'Continue with')]
}

/**
 * The single entry point the UI uses. Exactly one source wins — see the
 * override seam note in the file header.
 */
export function moduleRelations(
  id: string,
  all: ModuleManifest[] = MANIFESTS
): ModuleRelationsResult {
  const self = all.find((m) => m.id === id)
  if (!self) return { origin: 'computed', entries: [] }

  const authored = authoredRelations(self, Object.fromEntries(all.map((m) => [m.id, m])))
  if (authored) return { origin: 'authored', entries: authored }

  if (AUTHORED_INLINE_RELATED.includes(id)) return { origin: 'authored-inline', entries: [] }

  return { origin: 'computed', entries: relatedModules(id, all).slice(0, RELATED_MODULES_CAP) }
}
