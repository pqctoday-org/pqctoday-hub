// SPDX-License-Identifier: GPL-3.0-only
/**
 * Screen-space label placement for /navigate's node labels.
 *
 * Before this existed, crossing the "near" zoom tier switched on EVERY
 * node label in the scene at once — measured 2026-09-17 at 1440×900 with
 * the default filters: 809 labels on, 282 in the viewport, 279 of them
 * overlapping another label. A category spotlight on Standard did the same
 * (243 on, 240 overlapping). The fix is the technique map renderers use:
 * rank the candidates, walk them in order, and keep a label only if its
 * rectangle does not intersect one already kept — up to a fixed budget.
 *
 * Pure and DOM-free so it can be unit-tested; the caller projects each
 * label to pixels and measures its box.
 */

export interface LabelCandidate {
  id: string
  /** Screen-space box, in CSS pixels, top-left origin. */
  x: number
  y: number
  width: number
  height: number
  /** Higher wins a collision — the caller passes the node's connection count. */
  priority: number
  /** Tie-break among equal priorities — the caller passes camera distance. */
  distance: number
  /** Always kept (if on screen) and placed before everything else — the selected node. */
  pinned?: boolean
}

export interface PlaceLabelsOptions {
  /** Maximum labels kept. */
  budget: number
  /** Viewport size in CSS pixels; candidates fully outside it are dropped before placement. */
  viewportWidth: number
  viewportHeight: number
  /** Extra clearance required between two kept boxes, in pixels. */
  margin?: number
  /**
   * Labels shown on the previous pass. They are placed first (in priority
   * order, among themselves) and a non-sticky newcomer can never evict one
   * — a label already on screen stays until it collides with another
   * sticky label of higher priority or leaves the viewport. Without this
   * hysteresis two near-equal labels swap places every few frames as the
   * camera drifts, which reads as flicker; newcomers only ever fill free
   * space.
   */
  sticky?: ReadonlySet<string>
  /**
   * Boxes that are already on screen and stay there regardless — the
   * category labels. They are never hidden and never count toward the
   * budget; candidates simply may not overlap them.
   */
  obstacles?: readonly LabelCandidate[]
}

function intersects(a: LabelCandidate, b: LabelCandidate, margin: number): boolean {
  return (
    a.x < b.x + b.width + margin &&
    b.x < a.x + a.width + margin &&
    a.y < b.y + b.height + margin &&
    b.y < a.y + a.height + margin
  )
}

function onScreen(c: LabelCandidate, w: number, h: number): boolean {
  return c.x + c.width > 0 && c.x < w && c.y + c.height > 0 && c.y < h
}

function byRank(a: LabelCandidate, b: LabelCandidate): number {
  return b.priority - a.priority || a.distance - b.distance || a.id.localeCompare(b.id)
}

/** Returns the ids of the candidates to show. */
export function placeLabels(
  candidates: readonly LabelCandidate[],
  options: PlaceLabelsOptions
): Set<string> {
  const { budget, viewportWidth, viewportHeight } = options
  const margin = options.margin ?? 2
  const sticky = options.sticky ?? new Set<string>()
  const obstacles = options.obstacles ?? []
  const kept: LabelCandidate[] = []
  const result = new Set<string>()
  if (budget <= 0) return result

  const visible = candidates.filter((c) => onScreen(c, viewportWidth, viewportHeight))
  // Three passes in strict precedence: pinned, then previously shown, then
  // everything else — each pass in rank order. A later pass can never evict
  // an earlier pass's label, only fill the space it left.
  const passes = [
    visible.filter((c) => c.pinned).sort(byRank),
    visible.filter((c) => !c.pinned && sticky.has(c.id)).sort(byRank),
    visible.filter((c) => !c.pinned && !sticky.has(c.id)).sort(byRank),
  ]
  for (const pass of passes) {
    for (const candidate of pass) {
      if (kept.length >= budget) return result
      if (obstacles.some((o) => intersects(o, candidate, margin))) continue
      if (kept.some((k) => intersects(k, candidate, margin))) continue
      kept.push(candidate)
      result.add(candidate.id)
    }
  }
  return result
}

// Standard-document titles run to 790px at 10px type (median 311px) — a
// handful of those cannot coexist on any screen. The full title is still one
// hover (title attribute) or one click (detail panel) away.
export const NODE_LABEL_MAX_CHARS = 40

/** Cuts `text` to `max` characters on a word boundary where one is near, with an ellipsis. */
export function truncateLabel(text: string, max = NODE_LABEL_MAX_CHARS): string {
  const trimmed = text.trim()
  if (trimmed.length <= max) return trimmed
  const cut = trimmed.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(' ')
  // Only back up to a word boundary if it doesn't cost more than a third of
  // the budget — a title made of one long token would otherwise collapse to
  // almost nothing.
  const head = lastSpace >= Math.floor((max - 1) * 0.66) ? cut.slice(0, lastSpace) : cut
  return `${head.replace(/[\s:;,\-–—(]+$/u, '')}…`
}
