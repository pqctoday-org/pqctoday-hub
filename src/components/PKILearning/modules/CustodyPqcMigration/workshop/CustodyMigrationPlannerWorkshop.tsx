// SPDX-License-Identifier: AGPL-3.0-only
import React, { useMemo, useState } from 'react'
import { Route, AlertTriangle, CheckCircle2, Download, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  PLANNER_COMPONENTS,
  ACCOUNT_TYPE_PROFILES,
  type AccountTypeId,
  type ControlPlane,
  type MigrationPhase,
} from '../data/custodyPqcData'
import { ClaimLine, ReadingNote } from '../components/ClaimLine'

interface ComponentAssignment {
  plane: ControlPlane
  phase: MigrationPhase
  hndl: boolean
}

interface Props {
  initialPreset?: string
}

const DEFAULT_ASSIGNMENTS: Record<string, ComponentAssignment> = Object.fromEntries(
  PLANNER_COMPONENTS.map((c) => [
    c.id,
    {
      plane: 'platform' as ControlPlane,
      phase: 'P1' as MigrationPhase,
      hndl: false,
    },
  ])
)

export const CustodyMigrationPlannerWorkshop: React.FC<Props> = ({ initialPreset }) => {
  const [assignments, setAssignments] =
    useState<Record<string, ComponentAssignment>>(DEFAULT_ASSIGNMENTS)
  const [checked, setChecked] = useState(false)
  const [accountType, setAccountType] = useState<AccountTypeId>(
    initialPreset && ACCOUNT_TYPE_PROFILES.some((a) => a.id === initialPreset)
      ? (initialPreset as AccountTypeId)
      : 'eip7702-eoa'
  )
  const [assumedCrqcYears, setAssumedCrqcYears] = useState<number>(8)
  const [recoveryWindowYears, setRecoveryWindowYears] = useState<number>(10)
  const [exportPreview, setExportPreview] = useState<string>('')

  const activeAccount =
    ACCOUNT_TYPE_PROFILES.find((a) => a.id === accountType) ?? ACCOUNT_TYPE_PROFILES[0]

  const updateRow = (id: string, patch: Partial<ComponentAssignment>) => {
    setAssignments((prev) => ({
      ...prev,
      // eslint-disable-next-line security/detect-object-injection
      [id]: { ...prev[id], ...patch },
    }))
  }

  const applyRecommended = () => {
    setAssignments(
      Object.fromEntries(
        PLANNER_COMPONENTS.map((c) => [
          c.id,
          { plane: c.correctPlane, phase: c.correctPhase, hndl: c.isHndl },
        ])
      )
    )
    setChecked(true)
  }

  const findings = useMemo(() => {
    const warnings: string[] = []
    let exactMatches = 0

    for (const c of PLANNER_COMPONENTS) {
      const a = assignments[c.id]
      if (a.plane === c.correctPlane && a.phase === c.correctPhase && a.hndl === c.isHndl) {
        exactMatches += 1
      }
      if (c.id === 'btc-bip360-sweep' && a.phase === 'P1') {
        warnings.push(
          'Bitcoin BIP-360 / BIP-361 are chain-controlled drafts — scheduling L1 transaction-signature migration in Phase 1 before chain support exists will stall.'
        )
      }
      if (c.id === 'share-backup-envelopes' && (a.phase !== 'P1' || !a.hndl)) {
        warnings.push(
          'Key & SLIP-39 share backups under RSA/ECDH wrapping are HNDL targets today — move them to Phase 1 and mark HNDL.'
        )
      }
      if (c.id === 'mpc-peer-channels' && (a.phase !== 'P1' || !a.hndl)) {
        warnings.push(
          'MPC party-to-party share channels carry secret shares over classical key exchange — classify as Phase 1 HNDL priority.'
        )
      }
      if (c.id === 'mpc-threshold-pq' && a.phase === 'P1') {
        warnings.push(
          'No NIST-standardised PQ threshold signature exists as of 20 Nov 2026 — keep threshold ML-DSA replacement in Phase 3 while applying Phase 1 channel/backup protections now.'
        )
      }
    }

    return { warnings, exactMatches }
  }, [assignments])

  const generateExport = (format: 'csv' | 'md') => {
    if (format === 'csv') {
      const header = 'Component,ControlPlane,Phase,HNDLExposed,RecommendedPlane,RecommendedPhase'
      const rows = PLANNER_COMPONENTS.map((c) => {
        const a = assignments[c.id]
        return `"${c.name}",${a.plane},${a.phase},${a.hndl ? 'Yes' : 'No'},${c.correctPlane},${c.correctPhase}`
      })
      setExportPreview([header, ...rows].join('\n'))
    } else {
      const lines = [
        '# Fictional Custody PQC Migration Plan (Educational Sample)',
        '',
        `- Selected Account Type: ${activeAccount.label}`,
        `- Learner CRQC Planning Assumption: ${assumedCrqcYears} years (not a prediction)`,
        `- Recovery / Timelock Retention Window: ${recoveryWindowYears} years`,
        '',
        '| Component | Control Plane | Phase | HNDL |',
        '|---|---|---|---|',
        ...PLANNER_COMPONENTS.map((c) => {
          const a = assignments[c.id]
          return `| ${c.name} | ${a.plane} | ${a.phase} | ${a.hndl ? 'Yes' : 'No'} |`
        }),
      ]
      setExportPreview(lines.join('\n'))
    }
  }

  const recoveryExceedsHorizon = recoveryWindowYears >= assumedCrqcYears

  return (
    <div className="space-y-6 w-full">
      <div className="glass-panel p-6 space-y-2">
        <div className="flex items-center gap-2">
          <Route className="text-primary" size={20} aria-hidden="true" />
          <h2 className="text-xl font-bold text-gradient">
            W7: Custody Migration Planner &amp; Account-Type Audit
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Sort 15 custody components into platform-, account-, or chain-controlled clocks, assign
          Phases 0–4, and mark HNDL-exposed confidentiality stores. Then inspect residual classical
          dependencies by account type and check recovery material against your own CRQC planning
          horizon.
        </p>
      </div>

      {/* Part 1: 15-Component Classification Table */}
      <div className="glass-panel p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-bold text-foreground">
            Part 1: Classify 15 Custody Components
          </h3>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="ghost"
              onClick={() => setChecked(true)}
              className="btn btn-primary px-3 py-1.5 text-xs"
            >
              Validate Plan
            </Button>
            <Button
              variant="ghost"
              onClick={applyRecommended}
              className="btn btn-secondary px-3 py-1.5 text-xs"
            >
              Load Reference Mapping
            </Button>
            <Button
              variant="ghost"
              onClick={() => generateExport('csv')}
              className="px-3 py-1.5 text-xs rounded border border-border bg-muted/40 hover:bg-muted/70 flex items-center gap-1"
            >
              <Download size={12} aria-hidden="true" /> CSV
            </Button>
            <Button
              variant="ghost"
              onClick={() => generateExport('md')}
              className="px-3 py-1.5 text-xs rounded border border-border bg-muted/40 hover:bg-muted/70 flex items-center gap-1"
            >
              <Download size={12} aria-hidden="true" /> Markdown
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-2 pr-3">Custody Component</th>
                <th className="py-2 pr-3">Control Clock</th>
                <th className="py-2 pr-3">Phase</th>
                <th className="py-2 pr-3">HNDL Now?</th>
                {checked ? <th className="py-2">Check</th> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {PLANNER_COMPONENTS.map((comp) => {
                const row = assignments[comp.id]
                const ok =
                  row.plane === comp.correctPlane &&
                  row.phase === comp.correctPhase &&
                  row.hndl === comp.isHndl
                return (
                  <tr key={comp.id} className="align-top">
                    <td className="py-2.5 pr-3">
                      <p className="font-medium text-foreground">{comp.name}</p>
                      {checked && !ok ? (
                        <p className="text-[11px] text-muted-foreground mt-0.5">{comp.why}</p>
                      ) : null}
                    </td>
                    <td className="py-2.5 pr-3">
                      <div
                        className="flex flex-wrap gap-1"
                        role="group"
                        aria-label={`Control clock for ${comp.name}`}
                      >
                        {(['platform', 'account', 'chain'] as const).map((plane) => (
                          <Button
                            key={plane}
                            variant="ghost"
                            onClick={() => updateRow(comp.id, { plane })}
                            className={`h-auto px-2 py-0.5 text-[11px] rounded border ${
                              row.plane === plane
                                ? 'bg-primary/15 text-primary border-primary/50 font-semibold'
                                : 'bg-background text-muted-foreground border-border'
                            }`}
                          >
                            {plane}
                          </Button>
                        ))}
                      </div>
                    </td>
                    <td className="py-2.5 pr-3">
                      <div
                        className="flex flex-wrap gap-1"
                        role="group"
                        aria-label={`Phase for ${comp.name}`}
                      >
                        {(['P0', 'P1', 'P2', 'P3', 'P4'] as const).map((phase) => (
                          <Button
                            key={phase}
                            variant="ghost"
                            onClick={() => updateRow(comp.id, { phase })}
                            className={`h-auto px-1.5 py-0.5 text-[11px] rounded border ${
                              row.phase === phase
                                ? 'bg-primary/15 text-primary border-primary/50 font-semibold'
                                : 'bg-background text-muted-foreground border-border'
                            }`}
                          >
                            {phase}
                          </Button>
                        ))}
                      </div>
                    </td>
                    <td className="py-2.5 pr-3">
                      <label className="inline-flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={row.hndl}
                          onChange={(e) => updateRow(comp.id, { hndl: e.target.checked })}
                        />
                        <span className="text-muted-foreground">HNDL</span>
                      </label>
                    </td>
                    {checked ? (
                      <td className="py-2.5">
                        {ok ? (
                          <span className="inline-flex items-center gap-1 text-status-success font-medium">
                            <CheckCircle2 size={14} aria-hidden="true" /> Match
                          </span>
                        ) : (
                          <span className="text-status-warning font-medium">
                            Expected {comp.correctPlane} / {comp.correctPhase}
                            {comp.isHndl ? ' / HNDL' : ''}
                          </span>
                        )}
                      </td>
                    ) : null}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {checked ? (
          <div className="space-y-2 pt-2">
            <p className="text-xs font-semibold text-foreground">
              Exact matches: {findings.exactMatches} / {PLANNER_COMPONENTS.length}
            </p>
            {findings.warnings.length > 0 ? (
              <div className="p-3 rounded-lg bg-status-warning/10 border border-status-warning/40 space-y-1.5">
                <p className="text-xs font-bold text-status-warning flex items-center gap-1.5">
                  <AlertTriangle size={14} aria-hidden="true" /> Flagged Sequencing Mistakes
                </p>
                {findings.warnings.map((w) => (
                  <p key={w} className="text-xs text-foreground">
                    • {w}
                  </p>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-status-success/10 border border-status-success/40 text-xs text-status-success font-medium">
                No critical sequencing mistakes flagged: HNDL channels/backups are in Phase 1 and
                chain-controlled drafts are tracked in Phase 2.
              </div>
            )}
          </div>
        ) : null}

        {exportPreview ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground">Exported Plan Preview</p>
              <Button
                variant="ghost"
                onClick={() => setExportPreview('')}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </Button>
            </div>
            <pre className="p-3 rounded-lg bg-muted/60 border border-border text-[11px] overflow-x-auto text-foreground">
              {exportPreview}
            </pre>
          </div>
        ) : null}
      </div>

      {/* Part 2: Account-Type Residual Classical Dependencies */}
      <div className="glass-panel p-5 space-y-4">
        <h3 className="text-base font-bold text-foreground">
          Part 2: Account-Type Selector &amp; Residual Classical Dependencies
        </h3>
        <div className="flex flex-wrap gap-2">
          {ACCOUNT_TYPE_PROFILES.map((acct) => (
            <Button
              key={acct.id}
              variant="ghost"
              onClick={() => setAccountType(acct.id)}
              className={`px-3 py-2 text-xs rounded-lg border ${
                accountType === acct.id
                  ? 'bg-primary/15 text-primary border-primary/50 font-semibold'
                  : 'bg-muted/40 text-foreground border-border hover:bg-muted/70'
              }`}
            >
              {acct.label}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-status-error/10 border border-status-error/30 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wide text-status-error">
              Residual Authorization Dependencies (Can Move Funds)
            </p>
            <ul className="list-disc pl-4 text-xs text-foreground space-y-1.5">
              {activeAccount.authorizationResidual.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="p-4 rounded-lg bg-status-warning/10 border border-status-warning/30 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wide text-status-warning">
              Residual Liveness / Censorship / Fee Dependencies Only
            </p>
            <ul className="list-disc pl-4 text-xs text-foreground space-y-1.5">
              {activeAccount.livenessResidual.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground">Control clock:</strong> {activeAccount.controlClock} ·{' '}
          <strong className="text-foreground">Rotation agility:</strong>{' '}
          {activeAccount.rotationBenefit}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {activeAccount.claimIds.map((cid) => (
            <ClaimLine key={cid} id={cid} />
          ))}
        </div>
      </div>

      {/* Part 3: Recovery Material vs Learner's Own CRQC Horizon */}
      <div className="glass-panel p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Clock size={18} className="text-primary" aria-hidden="true" />
          <h3 className="text-base font-bold text-foreground">
            Part 3: Recovery &amp; Inheritance Material Horizon Check
          </h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Enter your own planning assumption for a CRQC horizon (not a Hub prediction) and compare
          it against how long recovery envelopes or timelocked heir keys remain stored.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="space-y-1 text-xs">
            <span className="font-medium text-foreground">
              Your CRQC planning assumption: {assumedCrqcYears} years
            </span>
            <input
              type="range"
              min={3}
              max={20}
              value={assumedCrqcYears}
              onChange={(e) => setAssumedCrqcYears(Number(e.target.value))}
              className="w-full"
            />
          </label>
          <label className="space-y-1 text-xs">
            <span className="font-medium text-foreground">
              Recovery envelope / timelock lifetime: {recoveryWindowYears} years
            </span>
            <input
              type="range"
              min={1}
              max={25}
              value={recoveryWindowYears}
              onChange={(e) => setRecoveryWindowYears(Number(e.target.value))}
              className="w-full"
            />
          </label>
        </div>

        <ReadingNote
          title={
            recoveryExceedsHorizon
              ? 'Recovery material outlives your CRQC planning horizon'
              : 'Recovery window sits inside your CRQC planning horizon'
          }
        >
          {recoveryExceedsHorizon ? (
            <p>
              At {recoveryWindowYears} years ≥ your {assumedCrqcYears}-year assumption, classical
              RSA/ECDH recovery envelopes face HNDL exposure today and classical timelocked heir
              keys risk being broken before the timelock expires. Re-wrap backups under hybrid
              KEM-DEM now and plan key rotation inside the timelock window (or via PQ smart-account
              guardian rotation).
            </p>
          ) : (
            <p>
              Even when the timelock ({recoveryWindowYears} years) is shorter than your{' '}
              {assumedCrqcYears}-year assumption, encrypted recovery archives stored today remain
              HNDL targets if retained after rotation — re-wrap them under hybrid KEM-DEM and
              destroy retired classical envelopes once superseded.
            </p>
          )}
        </ReadingNote>
      </div>
    </div>
  )
}
