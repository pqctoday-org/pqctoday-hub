// SPDX-License-Identifier: GPL-3.0-only
import React, { useMemo, useState } from 'react'
import { Layers, ArrowLeftRight, AlertTriangle, Info } from 'lucide-react'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { CompleteStepAction } from '../../../common/CompleteStepAction'
import {
  OT_ZONES,
  OT_CONDUITS,
  AUTH_POSTURES,
  CONF_POSTURES,
  assessZone,
  rankZones,
  recommendedAction,
  type AuthPosture,
  type ConfPosture,
  type ZoneAssessment,
} from '../data/zoneConduitData'

interface ZoneConduitPlannerProps {
  onComplete: () => void
  onTopZoneChange?: (a: ZoneAssessment | null) => void
}

type Postures = Record<string, { auth: AuthPosture; conf: ConfPosture }>

const defaultPostures = (): Postures =>
  Object.fromEntries(OT_ZONES.map((z) => [z.id, { auth: z.defaultAuth, conf: z.defaultConf }]))

function scoreColor(n: number) {
  if (n >= 80) return 'text-status-error'
  if (n >= 50) return 'text-status-warning'
  if (n > 0) return 'text-primary'
  return 'text-status-success'
}

function Bar({ label, value, cls }: { label: string; value: number; cls: string }) {
  return (
    <div>
      <div className="flex justify-between text-[10px] mb-0.5">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono text-foreground">{value}/100</span>
      </div>
      <div className="w-full bg-muted rounded-full h-1.5">
        <div className={`h-1.5 rounded-full ${cls}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

export const ZoneConduitPlanner: React.FC<ZoneConduitPlannerProps> = ({
  onComplete,
  onTopZoneChange,
}) => {
  const [postures, setPostures] = useState<Postures>(defaultPostures)

  const assessments = useMemo(
    () =>
      OT_ZONES.map((z) => {
        const p = postures[z.id]
        return assessZone(z, p?.auth, p?.conf)
      }),
    [postures]
  )
  const ranked = useMemo(() => rankZones(assessments), [assessments])

  React.useEffect(() => {
    onTopZoneChange?.(ranked[0] && ranked[0].priority > 0 ? ranked[0] : null)
  }, [ranked, onTopZoneChange])

  const zoneName = (id: string) => OT_ZONES.find((z) => z.id === id)?.name ?? id
  const zonePriority = (id: string) => assessments.find((a) => a.zone.id === id)?.priority ?? 0

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        The Purdue levels below are grouped into IEC 62443 <strong>zones</strong>; the links between
        them are <strong>conduits</strong>. Set how each zone authenticates commands and firmware
        and how it protects traffic. Every zone gets two scores — <strong>forgery</strong> (what a
        quantum computer could make the zone accept) and <strong>HNDL</strong> (what recorded
        traffic could reveal) — and is ranked by the larger one. Model estimate, not a measurement.
      </p>

      <div className="space-y-3">
        {OT_ZONES.map((zone) => {
          const a = assessments.find((x) => x.zone.id === zone.id)!

          const p = postures[zone.id]
          return (
            <div key={zone.id} className="glass-panel p-4">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono bg-muted text-muted-foreground rounded px-1.5 py-0.5">
                      {zone.purdue}
                    </span>
                    <span className="text-sm font-bold text-foreground">{zone.name}</span>
                    <span className="text-[10px] bg-primary/10 text-primary rounded px-1.5 py-0.5">
                      SL-T {zone.slTarget}
                    </span>
                    <span className="text-[10px] bg-muted text-muted-foreground rounded px-1.5 py-0.5">
                      {zone.lifecycleYears}-yr assets
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{zone.assets}</p>
                  <p className="text-[11px] text-foreground/70 mt-1">
                    <span className="text-muted-foreground">Authenticity anchor:</span>{' '}
                    {zone.authenticityAnchor}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 lg:min-w-[440px]">
                  <div>
                    <span className="text-[10px] text-muted-foreground block mb-0.5">
                      Commands & firmware authenticated by
                    </span>
                    <FilterDropdown
                      noContainer
                      selectedId={p.auth}
                      onSelect={(id) =>
                        setPostures((prev) => ({
                          ...prev,
                          [zone.id]: { ...prev[zone.id], auth: id as AuthPosture },
                        }))
                      }
                      items={AUTH_POSTURES.map((o) => ({ id: o.id, label: o.label }))}
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block mb-0.5">
                      Traffic protected by
                    </span>
                    <FilterDropdown
                      noContainer
                      selectedId={p.conf}
                      onSelect={(id) =>
                        setPostures((prev) => ({
                          ...prev,
                          [zone.id]: { ...prev[zone.id], conf: id as ConfPosture },
                        }))
                      }
                      items={CONF_POSTURES.map((o) => ({ id: o.id, label: o.label }))}
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                <Bar label="Forgery (authenticity)" value={a.forgery} cls="bg-status-error/70" />
                <Bar label="HNDL (confidentiality)" value={a.hndl} cls="bg-status-warning/70" />
              </div>
              {a.todayGaps.length > 0 && (
                <p className="text-[11px] text-muted-foreground mt-2 flex items-start gap-1">
                  <Info size={12} className="shrink-0 mt-0.5" />
                  {a.todayGaps.includes('unauthenticated')
                    ? 'Unauthenticated today: forgeable now without a quantum computer — a present-day gap, not scored as quantum risk.'
                    : 'Plaintext traffic: readable today; common and often acceptable in L0–L1, and not a quantum problem.'}
                </p>
              )}
            </div>
          )
        })}
      </div>

      <div className="glass-panel p-4">
        <div className="flex items-center gap-2 mb-3">
          <Layers size={16} className="text-primary" />
          <h3 className="text-sm font-bold text-foreground">Zone migration order</h3>
        </div>
        <div
          className="overflow-x-auto"
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- required by WCAG: a scrollable region with no focusable content is unreachable by keyboard; axe's documented fix for `scrollable-region-focusable` (same pattern as VpnSimulationPanel.tsx).
          tabIndex={0}
          role="region"
          aria-label="Scrollable table"
        >
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left p-2 font-medium">#</th>
                <th className="text-left p-2 font-medium">Zone</th>
                <th className="text-center p-2 font-medium">Forgery</th>
                <th className="text-center p-2 font-medium">HNDL</th>
                <th className="text-center p-2 font-medium">Priority</th>
                <th className="text-left p-2 font-medium">Driver</th>
                <th className="text-left p-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((a, idx) => (
                <tr key={a.zone.id} className="border-b border-border/50 align-top">
                  <td className="p-2 font-mono">{idx + 1}</td>
                  <td className="p-2 font-medium text-foreground">
                    {a.zone.purdue} {a.zone.name}
                  </td>
                  <td className="p-2 text-center font-mono">{a.forgery}</td>
                  <td className="p-2 text-center font-mono">{a.hndl}</td>
                  <td className={`p-2 text-center font-mono font-bold ${scoreColor(a.priority)}`}>
                    {a.priority}
                  </td>
                  <td className="p-2 capitalize">
                    {a.driver === 'hndl' ? 'HNDL' : a.driver === 'none' ? '—' : 'Forgery'}
                  </td>
                  <td className="p-2 text-muted-foreground min-w-[220px]">
                    {recommendedAction(a)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-panel p-4">
        <div className="flex items-center gap-2 mb-3">
          <ArrowLeftRight size={16} className="text-primary" />
          <h3 className="text-sm font-bold text-foreground">Conduits</h3>
        </div>
        <div className="space-y-2">
          {OT_CONDUITS.map((c) => (
            <div key={c.id} className="bg-muted/40 rounded-lg p-3 border border-border text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-foreground">
                  {zoneName(c.from)} ↔ {zoneName(c.to)}
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">
                  endpoint priorities {zonePriority(c.from)} / {zonePriority(c.to)}
                </span>
              </div>
              <p className="text-muted-foreground mt-1">{c.carries}</p>
              <p className="text-primary mt-1">{c.pqcAction}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-start gap-3 bg-status-warning/10 rounded-lg p-4 border border-status-warning/30">
        <AlertTriangle size={18} className="text-status-warning shrink-0 mt-0.5" />
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="text-sm font-bold text-foreground">
            Why Level 0–1 is not &ldquo;low&rdquo;
          </p>
          <p>
            Controllers rarely carry secrets worth harvesting, so an HNDL-only view ranks them last.
            But they accept firmware and project downloads signed with RSA or ECDSA. The day a
            quantum computer can forge those signatures, every controller that still trusts the old
            key will accept the attacker&rsquo;s code — and controllers stay in service for decades,
            so the signing roots have to move years before that day.
          </p>
          <p>
            IEC 62443-3-3 SR 4.3 and 62443-4-2 CR 4.3 require &ldquo;commonly accepted&rdquo;
            cryptography for the target security level; neither says anything about PQC yet.
          </p>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <CompleteStepAction recordsArtifact={false} onClick={onComplete} />
      </div>
    </div>
  )
}
