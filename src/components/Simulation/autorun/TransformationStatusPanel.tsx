// SPDX-License-Identifier: AGPL-3.0-only
/** Named sample-planning groups, objective timing and illustrative HNDL exposure. */
import { Ring } from '../atoms'
import { RibbonTermTooltip } from '../RibbonTermTooltip'
import type { TransformationStatus, OnTime } from './transformationStatus'

function chip(onTime: OnTime): { icon: string; cls: string } {
  switch (onTime) {
    case 'done':
      return { icon: '✓', cls: 'text-success' }
    case 'done-late':
      return { icon: '✓', cls: 'text-warning' }
    case 'done-unknown':
      return { icon: '?', cls: 'text-muted-foreground' }
    case 'late':
      return { icon: '⚠', cls: 'text-destructive' }
    default:
      return { icon: '○', cls: 'text-muted-foreground' }
  }
}

export function TransformationStatusPanel({ status }: { status: TransformationStatus }) {
  const exposurePct = status.hndlExposure == null ? null : Math.round(status.hndlExposure * 100)
  return (
    <div className="flex shrink-0 flex-wrap items-stretch gap-x-4 gap-y-2 rounded-xl border border-border bg-card px-4 py-2">
      <div className="flex items-center gap-2.5">
        <Ring level={Math.round(status.maturity)} sz={46} />
        <div className="leading-tight">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-primary">
            Transformation
          </div>
          <div className="font-mono text-[12px] font-bold text-foreground">
            Maturity {status.maturity.toFixed(1)} / 4
          </div>
          <div
            className={`font-mono text-[10px] ${exposurePct == null ? 'text-muted-foreground' : exposurePct > 50 ? 'text-destructive' : exposurePct > 10 ? 'text-warning' : 'text-success'}`}
          >
            {exposurePct == null
              ? 'Sample HNDL exposure unavailable'
              : `Sample HNDL exposure ${exposurePct}%`}
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-w-0 md:min-w-[210px] flex-col justify-center gap-0.5">
        {status.objectives.map((o) => {
          const c = chip(o.onTime)
          return (
            <div key={o.id} className="flex items-center gap-1.5 font-mono text-[11px]">
              <span className={`font-bold ${c.cls}`}>{c.icon}</span>
              <span className="text-foreground">{o.label}</span>
              <span className="text-muted-foreground">
                · target {o.byYear}
                {o.onTime === 'done-unknown' ? ' · completion timing unknown' : ''}
              </span>
            </div>
          )
        })}
      </div>
      <p className="w-full text-xs text-muted-foreground">
        Counts show completed sample planning links for each named group. HNDL exposure is an
        illustrative planning model; completing links does not establish deployed protection.
      </p>

      <div className="flex flex-1 min-w-0 md:min-w-[190px] flex-col justify-center gap-1">
        {status.tracks.map((t) => (
          <div key={t.id} className="font-mono text-[10px]">
            <div className="flex justify-between text-muted-foreground">
              {/* 2026-08-02 — carries the plain-English HNDL/TNFL definitions that
                used to live on the (now de-duplicated) Vital signs risk chips. */}
              <RibbonTermTooltip concept={t.track === 'TNFL' ? 'tnfl' : 'hndl'}>
                <span>
                  {t.track} · {t.tier}
                </span>
              </RibbonTermTooltip>
              <span>{t.year}</span>
            </div>
            {t.progress == null ? (
              <div className="mt-0.5 text-muted-foreground">Planning unassessed</div>
            ) : (
              <>
                <div className="text-muted-foreground">
                  {t.completedCount}/{t.requiredCount} sample planning links complete
                </div>
                <div
                  className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-muted"
                  role="progressbar"
                  aria-label={`${t.track} ${t.tier} sample planning`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(t.progress * 100)}
                >
                  <div
                    className={`h-full rounded-full ${t.track === 'HNDL' ? 'bg-destructive' : 'bg-primary'}`}
                    style={{ width: `${Math.round(t.progress * 100)}%` }}
                  />
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
