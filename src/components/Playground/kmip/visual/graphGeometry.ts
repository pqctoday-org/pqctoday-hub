// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection -- position keys are rule
   ids from the policy model, never user-controlled property names. */
//
// graphGeometry.ts — direction-aware layout + port/bezier helpers for the
// decision-pipeline canvas. Two orientations share one node vocabulary:
//   • 'tb' — waterfall: request on top, rules down a centre spine, Deny exits
//            right, Allow/Rekey terminals at the bottom.
//   • 'lr' — pipeline: request left, rules staggered across 3 lanes, the three
//            terminals on the right rail.
// Pure functions only (no React) so the canvas and the token animator share
// exactly one source of coordinates.
import type { EditablePolicy } from './policyEditModel'

export const NODE_H = 82
export const NW_LR = 182
export const NW_TB = 250
export const REQ = { w: 158, h: 104 }
export const SINK = { w: 170, h: 66 }

export type Dir = 'tb' | 'lr'
export type TerminalKind = 'allow' | 'rekey' | 'deny'
export type PortWhich = 'in' | 'out' | 'branch'

export interface Point {
  x: number
  y: number
}
export interface Rect extends Point {
  w: number
  h: number
}

export interface Layout {
  dir: Dir
  pos: Record<string, Point>
  reqPos: Point
  sinks: Record<TerminalKind, Point>
  contentW: number
  contentH: number
}

export const nodeW = (dir: Dir): number => (dir === 'tb' ? NW_TB : NW_LR)

/** Port coordinate on a node/request rect for the given direction. */
export function portOf(rect: Rect, which: PortWhich, dir: Dir): Point {
  const cx = rect.x + rect.w / 2
  const cy = rect.y + rect.h / 2
  if (dir === 'tb') {
    if (which === 'in') return { x: cx, y: rect.y }
    if (which === 'out') return { x: cx, y: rect.y + rect.h }
    return { x: rect.x + rect.w, y: cy } // branch → right
  }
  if (which === 'in') return { x: rect.x, y: cy }
  if (which === 'out') return { x: rect.x + rect.w, y: cy }
  return { x: cx, y: rect.y + rect.h } // branch → bottom
}

/** Input port on a terminal (sink) rect. */
export function sinkInPort(kind: TerminalKind, rect: Rect, dir: Dir): Point {
  if (dir === 'tb' && kind !== 'deny') return { x: rect.x + rect.w / 2, y: rect.y } // top
  return { x: rect.x, y: rect.y + rect.h / 2 } // left
}

// ── Bezier path builders ────────────────────────────────────────────────────

const linkH = (a: Point, b: Point): string => {
  const dx = Math.max(40, Math.abs(b.x - a.x) * 0.5)
  return `M${a.x},${a.y} C${a.x + dx},${a.y} ${b.x - dx},${b.y} ${b.x},${b.y}`
}
const linkV = (a: Point, b: Point): string => {
  const dy = Math.max(30, Math.abs(b.y - a.y) * 0.5)
  return `M${a.x},${a.y} C${a.x},${a.y + dy} ${b.x},${b.y - dy} ${b.x},${b.y}`
}
const bezV = (a: Point, b: Point): string => {
  const dy = Math.max(30, Math.abs(b.y - a.y) * 0.5)
  return `M${a.x},${a.y} C${a.x},${a.y + dy} ${b.x - 40},${b.y} ${b.x},${b.y}`
}

/** Sequential edge (request→rule→rule→terminal) for the given orientation. */
export const linkPath = (a: Point, b: Point, dir: Dir): string =>
  dir === 'tb' ? linkV(a, b) : linkH(a, b)

/** Deny-branch edge (off the branch port to the Deny terminal). */
export const branchPath = (a: Point, b: Point, dir: Dir): string =>
  dir === 'tb' ? linkH(a, b) : bezV(a, b)

// ── Layout generator ──────────────────────────────────────────────────────

/** Compute a fresh default layout for a policy in the given orientation. */
export function defaultLayout(policy: EditablePolicy, dir: Dir): Layout {
  const pos: Record<string, Point> = {}
  const n = policy.rules.length

  if (dir === 'tb') {
    const spineX = 150
    const stepY = 112
    const startY = 150
    const nw = NW_TB
    policy.rules.forEach((r, i) => {
      pos[r.id] = { x: spineX, y: startY + i * stepY }
    })
    const bottomY = startY + n * stepY + 6
    const rightX = spineX + nw + 150
    const cx = spineX + nw / 2
    const sinks: Record<TerminalKind, Point> = {
      deny: { x: rightX, y: startY + (n * stepY) / 2 - SINK.h / 2 },
      allow: { x: cx - 20 - SINK.w, y: bottomY },
      rekey: { x: cx + 20, y: bottomY },
    }
    return {
      dir,
      pos,
      reqPos: { x: spineX + (nw - REQ.w) / 2, y: 24 },
      sinks,
      contentW: rightX + SINK.w + 60,
      contentH: bottomY + SINK.h + 40,
    }
  }

  // lr
  const startX = 250
  const stepX = 192
  const lanes = [60, 228, 396]
  policy.rules.forEach((r, i) => {
    pos[r.id] = { x: startX + i * stepX, y: lanes[i % 3] }
  })
  const maxX = startX + n * stepX
  const sinks: Record<TerminalKind, Point> = {
    allow: { x: maxX + 40, y: 96 },
    rekey: { x: maxX + 40, y: 222 },
    deny: { x: maxX + 40, y: 348 },
  }
  return {
    dir,
    pos,
    reqPos: { x: 40, y: 208 },
    sinks,
    contentW: maxX + 40 + SINK.w + 60,
    contentH: 500,
  }
}

/** Rebuild layout for a new rule count/orientation, preserving manual drag
 * positions for surviving ids when the orientation is unchanged. */
export function relayout(policy: EditablePolicy, dir: Dir, prev: Layout | null): Layout {
  const fresh = defaultLayout(policy, dir)
  if (!prev || prev.dir !== dir) return fresh
  const pos = { ...fresh.pos }
  for (const id of Object.keys(prev.pos)) {
    if (pos[id]) pos[id] = prev.pos[id]
  }
  return { ...fresh, pos }
}

/** Fit-to-view transform for a content box inside a viewport. */
export function fitView(
  contentW: number,
  contentH: number,
  viewW: number,
  viewH: number
): { x: number; y: number; s: number } {
  const raw = Math.min((viewW - 48) / contentW, (viewH - 48) / contentH, 1)
  const s = Math.max(0.32, raw)
  return {
    x: Math.max(16, (viewW - contentW * s) / 2),
    y: Math.max(16, (viewH - contentH * s) / 2),
    s,
  }
}
