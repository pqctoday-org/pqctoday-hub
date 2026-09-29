// SPDX-License-Identifier: GPL-3.0-only
/**
 * 09-28 nav remediation (WP5) — the `?open=` contract for a simulation resource.
 *
 * An open resource used to be component state only, so browser Back left
 * `/simulation` instead of closing it, and a resource could not be linked to.
 * Opening one now pushes a single history entry carrying `?open=<value>`:
 *
 *   value = `1~<phase>~<kind>~<route>`   (URLSearchParams handles the escaping)
 *
 * Decoding is strict, and a decoded value is only ever turned back into a step
 * by matching it against the phase's own steps (tree + Resources map) — or, for
 * `learn`, an embeddable module's canonical route. A decoded route is never
 * navigated to: at worst an unknown value is rejected and stripped.
 */
import type { TreeStep } from './types'

export const OPEN_PARAM = 'open'
const VERSION = '1'
const MAX_ROUTE = 300

export interface DecodedOpen {
  phase: string
  kind: string
  to: string
}

export function encodeOpen(phase: string, step: Pick<TreeStep, 'kind' | 'to'>): string {
  return [VERSION, phase, step.kind, step.to].join('~')
}

/** Strict parse; null for anything that is not a well-formed v1 value for a
 *  known phase with a same-origin, path-only route. */
export function decodeOpen(
  value: string | null | undefined,
  phases: readonly string[]
): DecodedOpen | null {
  if (!value) return null
  const parts = value.split('~')
  if (parts.length < 4) return null
  const [version, phase, kind, ...rest] = parts
  const to = rest.join('~')
  if (version !== VERSION) return null
  if (!phase || !phases.includes(phase)) return null
  if (!kind || !/^[a-z-]{1,24}$/.test(kind)) return null
  if (!to.startsWith('/') || to.startsWith('//') || to.length > MAX_ROUTE) return null
  if (/[\s\\]/.test(to)) return null
  return { phase, kind, to }
}

/** Turn a decoded value back into a real step, or null. `candidates` are the
 *  phase's own steps (tree + Resources map); a `learn` route for an embeddable
 *  module is also accepted, since a Learn module can be opened from outside
 *  the tree (a tip card's "Learn more"). */
export function resolveOpen(
  decoded: DecodedOpen,
  candidates: readonly TreeStep[],
  learn: { isEmbeddable: (moduleId: string) => boolean; label: (moduleId: string) => string }
): TreeStep | null {
  const match = candidates.find((c) => c.kind === decoded.kind && c.to === decoded.to)
  if (match) return match
  if (decoded.kind === 'learn') {
    const m = /^\/learn\/([a-z0-9-]+)(\?[\w=&-]*)?$/.exec(decoded.to)
    const moduleId = m?.[1]
    if (moduleId && learn.isEmbeddable(moduleId)) {
      return { kind: 'learn', label: learn.label(moduleId), to: decoded.to, moduleId }
    }
  }
  return null
}
