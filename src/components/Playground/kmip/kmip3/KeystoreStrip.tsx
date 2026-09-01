// SPDX-License-Identifier: GPL-3.0-only
//
// KeystoreStrip — persistent, sticky horizontal strip of session objects
// shared across all 4 KMIP3.0 sub-tabs (Learn, Commands, Dev, Batch &
// Macros), so an object created in one sub-tab is visible from any
// other. Pattern-matched on `PolicyControlStrip.tsx`'s sticky-strip-of-cards
// layout. No local refresh plumbing needed: the engine's mutating ops all
// funnel through the existing `onChanged` callback, which the mounting
// parent uses to bump its own state — that re-render cascades down to this
// component, which reads `engine.listObjects()` fresh every render.
import { Fingerprint } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { KmipEngine, KmipObject } from '@/wasm/kmip/kmipEngine'

const STATE_DOT: Record<string, string> = {
  PreActive: 'bg-muted-foreground',
  Active: 'bg-status-success',
  Deactivated: 'bg-status-warning',
  Compromised: 'bg-status-error',
  Destroyed: 'bg-muted-foreground',
  DestroyedCompromised: 'bg-muted-foreground',
}

function ObjectChip({ object }: { object: KmipObject }) {
  const dot = STATE_DOT[object.state] ?? 'bg-muted-foreground'
  const shortUid = object.uid.length > 14 ? `…${object.uid.slice(-10)}` : object.uid
  return (
    <span
      title={`${object.objectType} · ${object.state} · ${object.uid}`}
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-2 py-1 text-[11px]"
    >
      <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', dot)} />
      <span className="font-medium text-foreground">{object.algorithm}</span>
      <span className="text-muted-foreground">{object.objectType}</span>
      <span className="font-mono text-muted-foreground">{shortUid}</span>
    </span>
  )
}

export function KeystoreStrip({ engine }: { engine: KmipEngine }) {
  const objects = engine.listObjects()
  if (objects.length === 0) return null

  return (
    <section className="sticky top-0 z-10 mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card/60 px-3 py-2 backdrop-blur-sm">
      <Fingerprint size={13} className="shrink-0 text-muted-foreground" />
      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        Session objects ({objects.length})
      </span>
      <div className="flex flex-wrap items-center gap-1.5">
        {objects.map((o) => (
          <ObjectChip key={o.uid} object={o} />
        ))}
      </div>
    </section>
  )
}
