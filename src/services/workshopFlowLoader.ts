// SPDX-License-Identifier: GPL-3.0-only
import type { FlowMatch, ResolvedFlowContext, WorkshopFlow, WorkshopRegion } from '@/types/Workshop'
import type { ExperienceLevel } from '@/store/usePersonaStore'
import type { PersonaId } from '@/data/learningPersonas'

/**
 * Manifest entry as written by `scripts/build-workshop-manifest.ts`. Lighter
 * than the full WorkshopFlow — used by the Browse-all picker without
 * fetching every flow JSON up-front.
 */
export interface WorkshopFlowManifestEntry {
  id: string
  file: string
  title: string
  match: FlowMatch
  totalEstMinutes: number
  stepCount: number
  isGenericFallback?: boolean
  date: string
}

export interface WorkshopFlowManifest {
  $schema?: string
  version: string
  generatedAt: string
  flows: WorkshopFlowManifestEntry[]
}

const MANIFEST_URL = 'workshop/index.json'

let manifestCache: WorkshopFlowManifest | null = null
const flowCache = new Map<string, WorkshopFlow>()

/**
 * Fetches the workshop manifest. Cached for the session; pass `force` to
 * re-fetch (useful when authors edit the JSON during dev).
 */
export async function loadManifest(force = false): Promise<WorkshopFlowManifest> {
  if (manifestCache && !force) return manifestCache
  const res = await fetch(MANIFEST_URL, { cache: force ? 'no-cache' : 'default' })
  if (!res.ok) {
    throw new Error(`Failed to load workshop manifest: ${res.status}`)
  }
  const data = (await res.json()) as WorkshopFlowManifest
  manifestCache = data
  return data
}

/**
 * Loads a specific flow JSON. Cached by file name.
 */
export async function loadFlow(file: string): Promise<WorkshopFlow> {
  if (flowCache.has(file)) return flowCache.get(file)!
  const res = await fetch(`workshop/${file}`)
  if (!res.ok) {
    throw new Error(`Failed to load workshop flow ${file}: ${res.status}`)
  }
  const flow = (await res.json()) as WorkshopFlow
  flowCache.set(file, flow)
  return flow
}

/**
 * Resolves the best-matching flow for the active persona context.
 * Specificity wins (most-explicit match descriptor); when nothing matches,
 * returns the first entry flagged with `isGenericFallback: true`. Returns
 * null if neither a match nor a generic fallback exists.
 */
export function resolveFromManifest(
  manifest: WorkshopFlowManifest,
  ctx: ResolvedFlowContext
): WorkshopFlowManifestEntry | null {
  const candidates = manifest.flows.filter((f) => !f.isGenericFallback && matchesCtx(f.match, ctx))
  if (candidates.length > 0) {
    return candidates.reduce((best, cur) =>
      specificity(cur.match) > specificity(best.match) ? cur : best
    )
  }
  return manifest.flows.find((f) => f.isGenericFallback) ?? null
}

/**
 * Returns every manifest entry compatible with the persona context, sorted
 * most-specific first. The generic fallback (if present) is appended at the
 * end so it always appears as a last-resort tab in the Recommended view.
 *
 * "Compatible" uses loose matching: a null persona facet (e.g. industry='All')
 * is treated as a wildcard against any flow value. Symmetrically, a flow
 * declaring `industries: '*'` matches any persona industry.
 */
export function findAllCompatible(
  manifest: WorkshopFlowManifest,
  ctx: Partial<ResolvedFlowContext>
): WorkshopFlowManifestEntry[] {
  const matched = manifest.flows.filter(
    (f) => !f.isGenericFallback && matchesCtxLoose(f.match, ctx)
  )
  matched.sort((a, b) => specificity(b.match) - specificity(a.match))
  const generic = manifest.flows.find((f) => f.isGenericFallback)
  return generic ? [...matched, generic] : matched
}

function matchesCtx(match: FlowMatch, ctx: ResolvedFlowContext): boolean {
  return (
    arrMatches(match.roles, ctx.role as PersonaId) &&
    arrMatches(match.proficiencies, ctx.proficiency as ExperienceLevel) &&
    arrMatches(match.industries, ctx.industry) &&
    arrMatches(match.regions, ctx.region as WorkshopRegion)
  )
}

/**
 * Loose-match: a missing/null/All persona facet is treated as a wildcard.
 * Lets architects with industry=null see every industry-specific flow.
 */
function matchesCtxLoose(match: FlowMatch, ctx: Partial<ResolvedFlowContext>): boolean {
  return (
    looseAxisMatches(match.roles, ctx.role) &&
    looseAxisMatches(match.proficiencies, ctx.proficiency) &&
    looseAxisMatches(match.industries, ctx.industry) &&
    looseAxisMatches(match.regions, ctx.region)
  )
}

function arrMatches<T>(allowed: T[] | '*' | undefined, value: T): boolean {
  if (!allowed || allowed === '*') return true
  return allowed.includes(value)
}

function looseAxisMatches<T>(allowed: T[] | '*' | undefined, value: T | null | undefined): boolean {
  if (!allowed || allowed === '*') return true
  if (value === null || value === undefined) return true // user has no preference → wildcard
  return (allowed as T[]).includes(value)
}

function specificity(match: FlowMatch): number {
  return (
    (match.roles === '*' ? 0 : 1) +
    (match.proficiencies === '*' ? 0 : 1) +
    (match.industries === '*' ? 0 : 1) +
    (match.regions === '*' ? 0 : 1)
  )
}

/** Lookup a manifest entry by id (used when the user picks a flow from Browse-all). */
export function findEntry(
  manifest: WorkshopFlowManifest,
  id: string
): WorkshopFlowManifestEntry | null {
  return manifest.flows.find((f) => f.id === id) ?? null
}

/** Test-only helper to clear the in-memory caches between unit tests. */
export function _resetCachesForTest(): void {
  manifestCache = null
  flowCache.clear()
}
