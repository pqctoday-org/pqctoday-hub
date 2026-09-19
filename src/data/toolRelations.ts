// SPDX-License-Identifier: GPL-3.0-only
/**
 * Round 9, wave 1.1 (2026-09-19) — related content for the two tool families,
 * computed from the registries the way `moduleRelations.ts` computes it for
 * modules. One data source, one panel (`shared/RelatedContentPanel`).
 *
 * Playground tool: the module it practises, then up to two tools in the same
 * category (nearest in registry order), then up to two tools from other
 * categories that share an algorithm. Business tool: the neighbours in its
 * category, then up to two tools of the same framework phase from other
 * categories, then the Learn module of that phase whose title or keywords
 * overlap the tool. Deterministic, capped at five, never the item itself.
 * `toolRelations.test.ts` pins the shape and that every target resolves.
 */
import { WORKSHOP_TOOLS } from '@/components/Playground/workshopRegistry'
import { BUSINESS_TOOLS } from '@/components/BusinessCenter/businessToolsRegistry'
import { MANIFESTS } from '@/components/PKILearning/manifest/registry'
import { FRAMEWORK_PHASES, type PhaseId } from '@/data/frameworkPhases'
import { moduleIdFromToolLink } from '@/data/moduleToolLinks'
import { PERSONAS } from '@/data/learningPersonas'

export interface RelatedEntry {
  to: string
  title: string
  reason: string
}

const CAP = 5
const STOP = new Set(['pqc', 'post', 'quantum', 'and', 'the', 'for', 'with', 'crypto', 'security'])
const words = (...parts: (string | string[] | undefined)[]): Set<string> => {
  const out = new Set<string>()
  for (const p of parts) {
    const s = Array.isArray(p) ? p.join(' ') : (p ?? '')
    for (const w of s.toLowerCase().match(/[a-z0-9]+/g) ?? [])
      if (w.length > 2 && !STOP.has(w)) out.add(w)
  }
  return out
}
const overlap = (a: Set<string>, b: Set<string>) => [...a].filter((w) => b.has(w)).length
const phaseLabel = (p: PhaseId) => {
  // eslint-disable-next-line security/detect-object-injection -- PhaseId union
  const ph = FRAMEWORK_PHASES[p]
  return ph.number !== undefined && ph.number !== null ? `phase ${ph.number}` : ph.name
}
/** Neighbours in registry order, nearest first: i+1, i-1, i+2, i-2 … */
function neighbours<T extends { id: string }>(arr: T[], id: string, n: number): T[] {
  const i = arr.findIndex((t) => t.id === id)
  if (i === -1) return arr.slice(0, n)
  const out: T[] = []
  for (let d = 1; out.length < n && (i + d < arr.length || i - d >= 0); d++) {
    if (i + d < arr.length) out.push(arr[i + d])
    if (out.length < n && i - d >= 0) out.push(arr[i - d])
  }
  return out
}

export function playgroundToolRelations(toolId: string): RelatedEntry[] {
  const self = WORKSHOP_TOOLS.find((t) => t.id === toolId)
  if (!self) return []
  const out: RelatedEntry[] = []
  const seen = new Set<string>([`/playground/${toolId}`])
  const push = (e: RelatedEntry) => {
    if (out.length < CAP && !seen.has(e.to)) {
      seen.add(e.to)
      out.push(e)
    }
  }
  const mid = self.moduleLink.startsWith('/learn/') ? moduleIdFromToolLink(self.moduleLink) : null
  const mod = mid ? MANIFESTS.find((m) => m.id === mid) : undefined
  if (mod)
    push({ to: `/learn/${mod.id}`, title: mod.title, reason: 'The module this tool practises' })
  const live = WORKSHOP_TOOLS.filter((t) => !t.sandbox && !t.wip)
  const sameCat = live.filter((t) => t.category === self.category)
  for (const t of neighbours(sameCat, toolId, 2))
    push({ to: `/playground/${t.id}`, title: t.name, reason: `Also in ${self.category}` })
  const algos = new Set(self.algorithms)
  for (const t of live) {
    if (t.category === self.category || t.id === toolId) continue
    const shared = t.algorithms.find((a) => algos.has(a))
    if (shared) push({ to: `/playground/${t.id}`, title: t.name, reason: `Also uses ${shared}` })
    if (out.length >= CAP) break
  }
  // A tool alone in its category with no shared algorithm (digital-id) still
  // gets company: tools that name the same primary persona, registry order.
  if (out.length < 3) {
    for (const t of live) {
      if (t.id === toolId) continue
      const p = self.recommendedPersonas.find((x) => t.recommendedPersonas.includes(x))
      if (p)
        push({
          to: `/playground/${t.id}`,
          title: t.name,
          // eslint-disable-next-line security/detect-object-injection -- p is a PersonaId from the registry
          reason: `Also recommended for the ${PERSONAS[p].label}`,
        })
      if (out.length >= 3) break
    }
  }
  return out
}

export function businessToolRelations(toolId: string): RelatedEntry[] {
  const self = BUSINESS_TOOLS.find((t) => t.id === toolId)
  if (!self) return []
  const out: RelatedEntry[] = []
  const seen = new Set<string>([`/business/tools/${toolId}`])
  const push = (e: RelatedEntry) => {
    if (out.length < CAP && !seen.has(e.to)) {
      seen.add(e.to)
      out.push(e)
    }
  }
  const sameCat = BUSINESS_TOOLS.filter((t) => t.category === self.category)
  for (const t of neighbours(sameCat, toolId, 2))
    push({ to: `/business/tools/${t.id}`, title: t.name, reason: `Also in ${self.category}` })
  const label = phaseLabel(self.frameworkPhase)
  for (const t of BUSINESS_TOOLS) {
    if (t.category === self.category || t.frameworkPhase !== self.frameworkPhase) continue
    push({ to: `/business/tools/${t.id}`, title: t.name, reason: `Same ${label} deliverable` })
    break
  }
  // Up to two Learn modules of the same phase, most keyword overlap first; a
  // module with no overlap is listed only when the phase has nothing closer,
  // so every phase's modules are reachable from that phase's tools.
  const mine = words(self.name, self.keywords)
  const modules = MANIFESTS.filter((m) => {
    const ph = Array.isArray(m.frameworkPhase) ? m.frameworkPhase : [m.frameworkPhase]
    return m.id !== 'quiz' && ph.includes(self.frameworkPhase)
  })
    .map((m) => ({ m, score: overlap(mine, words(m.title, m.id, m.description)) }))
    .sort((a, b) => b.score - a.score || a.m.id.localeCompare(b.m.id))
  for (const { m } of modules.slice(0, 2))
    push({ to: `/learn/${m.id}`, title: m.title, reason: `Learn module for ${label}` })
  return out
}
