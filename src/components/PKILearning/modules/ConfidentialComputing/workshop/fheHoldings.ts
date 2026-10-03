// SPDX-License-Identifier: GPL-3.0-only
import type { ActorKind, FheFlow } from '../data/fheHsmFlows'
import {
  DATA_CENTER,
  FHE_KEY_MAP,
  MAP_ITEMS,
  MODE_LABELS,
  type ItemClass,
  type ItemId,
  type Placement,
} from '../data/fheKeyMap'

/** How safe an item is where it sits at a given step. */
export type HoldStatus =
  'protected' | 'owner' | 'exposed' | 'public' | 'safe' | 'released' | 'hndl' | 'sealed'

export const HOLD_STATUS: Record<HoldStatus, { tag: string; chip: string; svg: string }> = {
  protected: {
    tag: 'protected in HSM',
    chip: 'border-success/40 bg-success/10 text-status-success',
    svg: 'fill-success/10 stroke-success/50',
  },
  owner: {
    tag: 'owner only',
    chip: 'border-warning/40 bg-warning/10 text-status-warning',
    svg: 'fill-warning/10 stroke-warning/50',
  },
  exposed: {
    tag: 'EXPOSED',
    chip: 'border-destructive/60 bg-destructive/15 text-status-error font-bold',
    svg: 'fill-destructive/15 stroke-destructive/70',
  },
  public: {
    tag: 'public',
    chip: 'border-primary/30 bg-primary/5 text-primary',
    svg: 'fill-primary/5 stroke-primary/40',
  },
  safe: {
    tag: 'encrypted',
    chip: 'border-border bg-muted/40 text-muted-foreground',
    svg: 'fill-muted/60 stroke-border',
  },
  released: {
    tag: 'released by policy',
    chip: 'border-warning/60 bg-warning/15 text-status-warning font-bold',
    svg: 'fill-warning/15 stroke-warning/70',
  },
  hndl: {
    tag: 'HNDL risk',
    chip: 'border-destructive/40 bg-destructive/10 text-status-error',
    svg: 'fill-destructive/10 stroke-destructive/50',
  },
  sealed: {
    tag: 'PQC-sealed',
    chip: 'border-success/40 bg-success/10 text-status-success',
    svg: 'fill-success/10 stroke-success/50',
  },
}

export interface HoldingsOptions {
  /** The third party persists ciphertexts and keys at rest. */
  persisted: boolean
  /** The owner's policy also releases the clear result to the third party. */
  shared: boolean
  overlay: boolean
  pqcFixed: boolean
}

export interface Holding {
  item: ItemId
  short: string
  label: string
  mode: string
  status: HoldStatus
  /** Arrives at this step. */
  isNew: boolean
}

export interface HoldingColumn {
  id: string
  label: string
  sub: string
  kind: ActorKind | 'datacenter'
}

/** The flow's actors plus the data-center (at rest) column. */
export function holdingColumns(flow: FheFlow): HoldingColumn[] {
  return [
    ...flow.actors.map((a) => ({ id: a.id, label: a.label, sub: a.sub, kind: a.kind })),
    { ...DATA_CENTER, kind: 'datacenter' as const },
  ]
}

function statusOf(
  pl: Placement,
  cls: ItemClass,
  kind: ActorKind | 'datacenter',
  opts: HoldingsOptions
): HoldStatus {
  if (pl.item === 'seed-backup') {
    if (opts.overlay && !opts.pqcFixed) return 'hndl'
    if (opts.overlay && opts.pqcFixed) return 'sealed'
    return 'safe'
  }
  if (pl.shared) return 'released'
  if (cls === 'public') return 'public'
  if (cls === 'ciphertext') return 'safe'
  if (kind === 'hsm') return 'protected'
  if (kind === 'client') return 'owner'
  return 'exposed'
}

/** What every column holds at `step`, in key-map order. */
export function holdingsAt(
  flow: FheFlow,
  step: number,
  opts: HoldingsOptions
): Record<string, Holding[]> {
  const cols = holdingColumns(flow)
  const out: Record<string, Holding[]> = Object.fromEntries(cols.map((c) => [c.id, []]))
  for (const pl of FHE_KEY_MAP[flow.id]) {
    if (pl.persisted && !opts.persisted) continue
    if (pl.shared && !opts.shared) continue
    if (pl.from > step || (pl.until !== undefined && step > pl.until)) continue
    const col = cols.find((c) => c.id === pl.at)
    if (!col) continue
    const it = MAP_ITEMS[pl.item]
    const list = out[col.id]
    if (list.some((h) => h.item === pl.item)) continue
    list.push({
      item: pl.item,
      short: it.short,
      label: it.label,
      mode: MODE_LABELS[pl.mode].long,
      status: statusOf(pl, it.cls, col.kind, opts),
      isNew: pl.from === step,
    })
  }
  return out
}

/** Largest number of items any column holds at any step, so the lane strip never jumps. */
export function maxHoldings(flow: FheFlow): number {
  let max = 1
  const all: HoldingsOptions = { persisted: true, shared: true, overlay: false, pqcFixed: false }
  for (let i = 0; i < flow.steps.length; i++) {
    for (const list of Object.values(holdingsAt(flow, i, all))) max = Math.max(max, list.length)
  }
  return max
}

/** Secret items sitting outside an HSM or the data owner's device. */
export function exposedCount(holdings: Record<string, Holding[]>): number {
  return Object.values(holdings)
    .flat()
    .filter((h) => h.status === 'exposed').length
}
