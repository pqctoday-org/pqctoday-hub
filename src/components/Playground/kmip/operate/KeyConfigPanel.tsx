// SPDX-License-Identifier: GPL-3.0-only
//
// Algorithm / key-size / governance-attribute config, extracted from
// KmipPlaygroundView's "Plane 2 · KMIP Lifecycle" section (K4b, gaps-closeout
// WP-4.2). Renders as a flat sequence of siblings (no wrapper element) so it
// slots into the parent's existing <section> unchanged — see
// KmipPlaygroundView.tsx's own comment at the call site.
import { Wand2 } from 'lucide-react'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ALGORITHMS } from '@/wasm/kmip/kmipMeta'
import type { OperateContext } from './types'

export function KeyConfigPanel({ operate }: { operate: OperateContext }) {
  const {
    algo,
    onSelectAlgo,
    chosen,
    isSpecOnly,
    keyLength,
    setKeyLength,
    govAttrsText,
    setGovAttrsText,
  } = operate
  return (
    <>
      <p className="text-xs font-medium text-muted-foreground mb-1">Algorithm</p>
      <div className="mb-3" data-testid="kmip-algo">
        <FilterDropdown
          items={ALGORITHMS.map((a) => ({
            id: a.value,
            label: a.auto
              ? a.label
              : a.runnable === false
                ? a.label
                : a.pqc
                  ? `${a.label} · PQC`
                  : a.label,
            icon: a.auto ? <Wand2 size={13} className="text-primary" /> : undefined,
          }))}
          selectedId={algo}
          onSelect={onSelectAlgo}
          label="Algorithm"
          className="w-full"
        />
      </div>
      {isSpecOnly && (
        <p className="mb-3 -mt-2 text-[10.5px] text-status-warning">
          Spec-only: a real algorithm policies can reference, but this in-browser engine can't
          create one — see what happens below.
        </p>
      )}
      {chosen?.sizes && (
        <div className="mb-3 -mt-2" data-testid="kmip-key-size">
          <p className="mb-1 text-[10px] font-medium text-muted-foreground">
            {algo === 'RSA' ? 'Key size' : 'Curve'} — a real request parameter, not a label;
            policies with a minimum (FIPS-only, BSI, 2030 roadmap) gate on it.
          </p>
          <div className="flex gap-1.5">
            {chosen.sizes.map((s) => (
              <Button
                key={s.length}
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setKeyLength(s.length)}
                className={cn(
                  'h-auto rounded-full border px-2.5 py-0.5 text-[10.5px] font-medium',
                  keyLength === s.length
                    ? 'border-primary/60 bg-primary/10 text-primary'
                    : 'border-border bg-background/60 text-muted-foreground hover:border-primary/40 hover:text-foreground'
                )}
              >
                {s.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="mb-3" data-testid="kmip-gov-attrs">
        <p className="mb-1 text-[10px] font-medium text-muted-foreground">
          Key tags (governance attributes) — some policies require one at key creation, e.g. CNSA
          2.0 needs <code className="font-mono">x-pqctoday-cnsa-classification=Secret</code>
        </p>
        <input
          type="text"
          value={govAttrsText}
          onChange={(e) => setGovAttrsText(e.target.value)}
          placeholder="name=value, name=value (optional)"
          className="w-full rounded-md border border-border bg-background/60 px-2 py-1 font-mono text-[11px] text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none"
        />
      </div>
    </>
  )
}
