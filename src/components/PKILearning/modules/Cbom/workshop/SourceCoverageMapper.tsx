// SPDX-License-Identifier: GPL-3.0-only
import { useMemo, useState } from 'react'
import { CheckCircle2, AlertTriangle, Layers, EyeOff, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  SAMPLE_INVENTORY,
  DISCOVERY_TOOLS,
  LAYERS,
  type ToolId,
  type InventoryAsset,
} from '@/data/cryptoEstate'

/**
 * Source Coverage Mapper — run the discovery tools you have over the shared
 * sample estate (@/data/cryptoEstate) and see, computed live: how many assets a
 * tool combination discovers, which stay hidden ("ghost" crypto), per-layer
 * coverage, and the single best net-new scanner to add. Reuse what you run,
 * then add net-new only for the blind spots.
 */

const TOTAL = SAMPLE_INVENTORY.length

function discoveredBy(selected: Set<ToolId>): Set<string> {
  const found = new Set<string>()
  for (const a of SAMPLE_INVENTORY) {
    if (a.discoverableBy.some((t) => selected.has(t))) found.add(a.id)
  }
  return found
}

export function SourceCoverageMapper() {
  const [selected, setSelected] = useState<Set<ToolId>>(new Set(['vuln-scanner', 'clm']))

  const toggle = (id: ToolId) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const found = useMemo(() => discoveredBy(selected), [selected])
  const hidden = SAMPLE_INVENTORY.filter((a) => !found.has(a.id))
  const ghosts = hidden.filter((a) => a.discoverableBy.length === 0)

  // Greedy: which unselected tool reveals the most currently-hidden assets?
  const bestNetNew = useMemo(() => {
    let best: { id: ToolId; gain: number } | null = null
    for (const tool of DISCOVERY_TOOLS) {
      if (selected.has(tool.id)) continue
      const gain = hidden.filter((a) => a.discoverableBy.includes(tool.id)).length
      if (gain > 0 && (!best || gain > best.gain)) best = { id: tool.id, gain }
    }
    return best
  }, [selected, hidden])

  const pct = Math.round((found.size / TOTAL) * 100)

  const layerRow = (layerId: (typeof LAYERS)[number]['id']) => {
    const all = SAMPLE_INVENTORY.filter((a) => a.layer === layerId)
    const cov = all.filter((a) => found.has(a.id)).length
    return { total: all.length, covered: cov }
  }

  return (
    <div className="space-y-4">
      <div className="glass-panel p-4">
        <div className="mb-1 flex items-center gap-2">
          <Layers size={18} className="text-primary" />
          <h3 className="font-semibold text-foreground">
            Discovery coverage over the sample estate ({TOTAL} assets)
          </h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Tick the tools you already run; net-new scanners are marked{' '}
          <span className="text-status-info">＋</span>. Coverage is computed live.
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {DISCOVERY_TOOLS.map((tool) => {
          const on = selected.has(tool.id)
          return (
            <Button
              key={tool.id}
              variant="ghost"
              onClick={() => toggle(tool.id)}
              className={`glass-panel h-auto w-full flex-col items-start justify-start whitespace-normal border p-3 text-left ${
                on ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2
                  size={15}
                  className={on ? 'text-primary' : 'text-muted-foreground/40'}
                />
                <span className="text-sm font-medium text-foreground">{tool.name}</span>
                {tool.netNew && (
                  <span className="rounded bg-status-info/15 px-1 text-[10px] text-status-info">
                    ＋ net-new
                  </span>
                )}
              </div>
              <p className="ml-6 mt-0.5 text-xs text-muted-foreground">{tool.note}</p>
            </Button>
          )
        })}
      </div>

      <div className="glass-panel p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-semibold text-foreground">
            {found.size}/{TOTAL} assets discovered
          </span>
          <span className="text-sm text-muted-foreground">{pct}%</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded bg-muted">
          <div className="h-full bg-status-success transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-3 grid gap-1.5">
          {LAYERS.map((l) => {
            const r = layerRow(l.id)
            const full = r.total > 0 && r.covered === r.total
            return (
              <div key={l.id} className="flex items-center justify-between text-xs">
                <span className="text-foreground">{l.label}</span>
                <span className={full ? 'text-status-success' : 'text-status-warning'}>
                  {r.covered}/{r.total} {full ? '✓' : '— gap'}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {bestNetNew && (
        <div className="glass-panel border border-status-info/30 p-3 text-sm">
          <span className="flex items-center gap-1 font-medium text-status-info">
            <Plus size={14} /> Best next scanner
          </span>
          <span className="text-foreground">
            Add <strong>{DISCOVERY_TOOLS.find((t) => t.id === bestNetNew.id)?.name}</strong> — it
            reveals <strong>{bestNetNew.gain}</strong> currently-hidden asset
            {bestNetNew.gain > 1 ? 's' : ''}.
          </span>
        </div>
      )}

      {hidden.length > 0 && (
        <div className="glass-panel border border-status-warning/30 p-3">
          <span className="mb-2 flex items-center gap-1 text-sm font-medium text-status-warning">
            <EyeOff size={14} /> {hidden.length} hidden ({ghosts.length} unfindable by any tool)
          </span>
          <div className="space-y-1">
            {hidden.slice(0, 6).map((a: InventoryAsset) => (
              <div key={a.id} className="flex items-center justify-between text-xs">
                <span className="text-foreground">{a.name}</span>
                <span className="font-mono text-muted-foreground">
                  {a.currentAlgorithm}
                  {a.discoverableBy.length === 0 && (
                    <span className="ml-1 inline-flex items-center gap-0.5 text-status-error">
                      <AlertTriangle size={10} /> ghost
                    </span>
                  )}
                </span>
              </div>
            ))}
            {hidden.length > 6 && (
              <p className="text-xs text-muted-foreground">…and {hidden.length - 6} more.</p>
            )}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            The legacy appliance is a true ghost — no scanner parses it; it needs manual / passive
            discovery. Everything found normalizes to one CycloneDX CBOM.
          </p>
        </div>
      )}
    </div>
  )
}
