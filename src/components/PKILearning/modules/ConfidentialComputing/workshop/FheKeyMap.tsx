// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { Database, HardDrive, KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
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

type Status = 'protected' | 'owner' | 'exposed' | 'public' | 'safe' | 'hndl' | 'sealed'

const STATUS: Record<Status, { cls: string; tag: string }> = {
  protected: { cls: 'border-success/40 bg-success/10 text-status-success', tag: 'protected' },
  owner: { cls: 'border-warning/40 bg-warning/10 text-status-warning', tag: 'owner only' },
  exposed: {
    cls: 'border-destructive/60 bg-destructive/15 text-status-error font-bold',
    tag: 'EXPOSED',
  },
  public: { cls: 'border-primary/30 bg-primary/5 text-primary', tag: 'public' },
  safe: { cls: 'border-border bg-muted/40 text-muted-foreground', tag: 'ciphertext' },
  hndl: { cls: 'border-destructive/40 bg-destructive/10 text-status-error', tag: 'HNDL risk' },
  sealed: { cls: 'border-success/40 bg-success/10 text-status-success', tag: 'PQC-sealed' },
}

const CLASS_BADGE: Record<ItemClass, { label: string; cls: string }> = {
  secret: { label: 'SECRET · never expose', cls: 'text-status-error border-destructive/40' },
  public: { label: 'PUBLIC · may be exposed', cls: 'text-primary border-primary/30' },
  ciphertext: { label: 'CIPHERTEXT · safe', cls: 'text-muted-foreground border-border' },
}

function statusOf(cls: ItemClass, kind: ActorKind | 'datacenter'): Status {
  if (cls === 'public') return 'public'
  if (cls === 'ciphertext') return 'safe'
  if (kind === 'hsm') return 'protected'
  if (kind === 'client') return 'owner'
  return 'exposed'
}

interface Column {
  id: string
  label: string
  sub: string
  kind: ActorKind | 'datacenter'
}

/** Per-step map of where every key and data item is, how it is protected, and whether a secret is exposed. */
export const FheKeyMap: React.FC<{
  flow: FheFlow
  step: number
  overlay: boolean
  pqcFixed: boolean
}> = ({ flow, step, overlay, pqcFixed }) => {
  // A seed backup wrapped with RSA can be harvested now and unwrapped by a future quantum computer.
  const hndl = overlay && !pqcFixed
  const sealed = overlay && pqcFixed
  const [persisted, setPersisted] = useState(true)

  const columns: Column[] = [
    ...flow.actors.map((a) => ({ id: a.id, label: a.label, sub: a.sub, kind: a.kind })),
    { ...DATA_CENTER, kind: 'datacenter' as const },
  ]
  const placements = FHE_KEY_MAP[flow.id].filter((pl) => !pl.persisted || persisted)
  const visible = placements.filter(
    (pl) => pl.from <= step && (pl.until === undefined || step <= pl.until)
  )
  const items = [...new Set(placements.map((pl) => pl.item))] as ItemId[]
  const cell = (item: ItemId, col: string): Placement | undefined =>
    visible.find((pl) => pl.item === item && pl.at === col)
  const kindOf = (col: string) => columns.find((c) => c.id === col)?.kind ?? 'cloud'

  const exposedCount = visible.filter(
    (pl) => statusOf(MAP_ITEMS[pl.item].cls, kindOf(pl.at)) === 'exposed'
  ).length

  return (
    <div className="rounded-lg border border-border bg-card/40 p-3 space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
          <KeyRound size={15} className="text-primary" />
          Where keys and data are at step {step + 1}
        </h4>
        <Button
          variant={persisted ? 'outline' : 'ghost'}
          size="sm"
          onClick={() => setPersisted((v) => !v)}
          aria-pressed={persisted}
          className="gap-1 text-xs h-7"
        >
          {persisted ? <Database size={13} /> : <HardDrive size={13} />}
          {persisted ? 'Server persists at rest' : 'Server keeps RAM only'}
        </Button>
      </div>

      <p
        className={`text-[11px] font-medium ${
          exposedCount ? 'text-status-error' : 'text-status-success'
        }`}
      >
        {exposedCount
          ? `${exposedCount} secret item(s) are outside an HSM or the owner’s device.`
          : 'No secret is outside an HSM or the data owner’s device at this step.'}
      </p>

      {/* Desktop / tablet: items × locations */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-[11px] border-separate border-spacing-0.5">
          <thead>
            <tr>
              <th className="text-left font-medium text-muted-foreground p-1">Item</th>
              {columns.map((c) => (
                <th key={c.id} className="text-center font-medium text-muted-foreground p-1">
                  <div className="text-foreground">{c.label}</div>
                  <div className="text-[9px] font-normal">{c.sub}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((id) => {
              const item = MAP_ITEMS[id]
              const present = columns.some((c) => cell(id, c.id))
              return (
                <tr key={id} className={present ? '' : 'opacity-35'}>
                  <td className="p-1 align-middle">
                    <div className="font-semibold text-foreground">{item.label}</div>
                    <span
                      className={`inline-block mt-0.5 text-[9px] px-1 rounded border ${CLASS_BADGE[item.cls].cls}`}
                    >
                      {CLASS_BADGE[item.cls].label}
                    </span>
                  </td>
                  {columns.map((c) => {
                    const pl = cell(id, c.id)
                    return (
                      <td key={c.id} className="p-0.5 text-center align-middle">
                        {pl ? (
                          <Chip
                            pl={pl}
                            cls={item.cls}
                            kind={c.kind}
                            step={step}
                            hndl={hndl}
                            sealed={sealed}
                          />
                        ) : null}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Phones: one row per item present now */}
      <ul className="md:hidden space-y-1.5">
        {items
          .filter((id) => columns.some((c) => cell(id, c.id)))
          .map((id) => {
            const item = MAP_ITEMS[id]
            return (
              <li key={id} className="rounded border border-border/60 p-1.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-semibold text-foreground">{item.label}</span>
                  <span className={`text-[9px] px-1 rounded border ${CLASS_BADGE[item.cls].cls}`}>
                    {CLASS_BADGE[item.cls].label}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {columns.map((c) => {
                    const pl = cell(id, c.id)
                    return pl ? (
                      <span key={c.id} className="inline-flex items-center gap-1 text-[10px]">
                        <span className="text-muted-foreground">{c.label}:</span>
                        <Chip
                          pl={pl}
                          cls={item.cls}
                          kind={c.kind}
                          step={step}
                          hndl={hndl}
                          sealed={sealed}
                        />
                      </span>
                    ) : null
                  })}
                </div>
              </li>
            )
          })}
      </ul>

      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground pt-1">
        {(['protected', 'owner', 'exposed', 'public', 'safe', 'hndl', 'sealed'] as Status[]).map(
          (s) => (
            <span key={s} className={`px-1 rounded border ${STATUS[s].cls}`}>
              {STATUS[s].tag}
            </span>
          )
        )}
        <span>· ● new at this step</span>
        <span>
          · Modes: HSM = inside the HSM (the seed leaves only by replication to an authenticated
          HSM); RAM = memory only; at rest = stored; share = secret share in an HSM
        </span>
      </div>
      <p className="text-[10px] text-muted-foreground">
        Locations at rest are a deployment choice. The libraries only serialize (OpenFHE Serialize,
        TFHE-rs safe_serialize, Lattigo MarshalBinary); where the bytes go is up to the operator.
      </p>
    </div>
  )
}

const Chip: React.FC<{
  pl: Placement
  cls: ItemClass
  kind: ActorKind | 'datacenter'
  step: number
  hndl: boolean
  sealed: boolean
}> = ({ pl, cls, kind, step, hndl, sealed }) => {
  const backup = pl.item === 'seed-backup'
  const st = STATUS[backup && hndl ? 'hndl' : backup && sealed ? 'sealed' : statusOf(cls, kind)]
  return (
    <span
      title={`${MODE_LABELS[pl.mode].long} · ${st.tag}`}
      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 whitespace-nowrap ${st.cls}`}
    >
      {pl.from === step && <span aria-label="new at this step">●</span>}
      {MODE_LABELS[pl.mode].short}
      {st.tag === 'EXPOSED' && <span>· EXPOSED</span>}
      {st.tag === 'HNDL risk' && <span>· HNDL</span>}
      {st.tag === 'PQC-sealed' && <span>· PQC</span>}
    </span>
  )
}
