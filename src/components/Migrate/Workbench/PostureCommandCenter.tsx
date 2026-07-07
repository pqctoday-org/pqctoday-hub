// SPDX-License-Identifier: GPL-3.0-only
import { ArrowRight, RotateCcw } from 'lucide-react'
import { REPLACE_ASSETS, DECISIONS } from '@/data/migrationAssets'
import { useMigrateSelectionStore } from '@/store/useMigrateSelectionStore'
import { Button } from '../../ui/button'
import { ConfirmButton } from './workbenchUi'
import type { MigrationPosture } from './useMigrationPlan'

const TOTAL_ASSETS = REPLACE_ASSETS.length

export function PostureCommandCenter({
  posture,
  onGoToReplace,
}: {
  posture: MigrationPosture
  onGoToReplace: () => void
}) {
  const clearPlan = useMigrateSelectionStore((s) => s.clearPlan)
  const {
    plannedAssets,
    readyN,
    blockedN,
    readyPct,
    blockedPct,
    hndlCount,
    nearestYear,
    nearestAsset,
    nextMove,
    foundations,
  } = posture

  if (plannedAssets.length === 0 && foundations.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-8 text-center">
        <p className="text-sm font-semibold text-foreground">Build your migration plan</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Pick the cryptography you run — TLS, VPN, SSH, certs and more — to get a sequenced,
          quantum-safe plan aligned to NIST IR 8547 &amp; CNSA 2.0.
        </p>
        <Button variant="gradient" size="sm" className="mt-3" onClick={onGoToReplace}>
          Add what you run
        </Button>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-secondary/30 bg-gradient-to-br from-primary/[0.06] to-secondary/[0.04] p-4">
      <div className="flex flex-col gap-4 lg:flex-row">
        {/* readiness */}
        <div className="min-w-[188px]">
          <p className="font-mono text-[9.5px] uppercase tracking-wide text-muted-foreground">
            Your readiness
          </p>
          <p className="text-[34px] font-extrabold leading-none text-foreground">{readyPct}%</p>
          <p className="text-[11px] text-muted-foreground">have a GA path</p>
          <div className="mt-2 flex h-2.5 overflow-hidden rounded-full bg-muted" aria-hidden>
            <div className="bg-status-success" style={{ width: `${readyPct}%` }} />
            <div className="bg-status-warning" style={{ width: `${blockedPct}%` }} />
          </div>
          <p className="mt-1 text-[10px]">
            <span className="text-status-success">{readyN} ready to move</span>
            <span className="text-muted-foreground"> · </span>
            <span className="text-status-warning">{blockedN} blocked</span>
          </p>
        </div>

        {/* stat tiles */}
        <div className="grid flex-1 grid-cols-1 gap-2.5 sm:grid-cols-3">
          <StatTile
            label="In your plan"
            value={`${plannedAssets.length} / ${TOTAL_ASSETS}`}
            caption="assets"
          />
          <StatTile
            label="HNDL-urgent"
            value={String(hndlCount)}
            caption="long-lived data exposed now"
            tone="text-status-error"
          />
          <StatTile
            label="Nearest CNSA deadline"
            value={nearestYear ? String(nearestYear) : '—'}
            caption={nearestAsset?.label ?? 'add assets to see'}
            tone="text-status-warning"
          />
        </div>
      </div>

      {/* next move */}
      <div className="mt-3 flex items-center gap-3 rounded-xl border border-status-success/20 bg-status-success/[0.07] p-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-status-success/20 text-status-success">
          <ArrowRight size={15} aria-hidden />
        </span>
        <p className="min-w-0 flex-1 text-xs text-foreground">
          <strong>Next move:</strong>{' '}
          {nextMove
            ? `${nextMove.asset.label} is a ${DECISIONS[nextMove.asset.decision].label} — ${
                nextMove.product ?? 'pick a product'
              }`
            : plannedAssets.length === 0
              ? 'add what you run to start your plan'
              : 'unblock your roadmap/mitigate assets'}
        </p>
        {nextMove && (
          <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
            Wave {nextMove.asset.wave} · {nextMove.asset.cnsaYear}
          </span>
        )}
        <ConfirmButton
          size="sm"
          className="shrink-0 text-muted-foreground hover:text-foreground"
          onConfirm={clearPlan}
          confirmChildren={
            <>
              <RotateCcw size={13} /> Clear it all?
            </>
          }
        >
          <RotateCcw size={13} /> Start over
        </ConfirmButton>
      </div>
    </div>
  )
}

function StatTile({
  label,
  value,
  caption,
  tone = 'text-foreground',
}: {
  label: string
  value: string
  caption: string
  tone?: string
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/40 p-3">
      <p className="font-mono text-[9.5px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className={`text-[21px] font-extrabold leading-tight ${tone}`}>{value}</p>
      <p className="text-[10px] text-muted-foreground">{caption}</p>
    </div>
  )
}
