// SPDX-License-Identifier: AGPL-3.0-only
import React, { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Scale, ShieldAlert, CheckCircle2, AlertTriangle, Info, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getStandard } from '@/data/standardsRegistry'
import { SOURCE_CLAIMS } from '../data/sourceClaims'
import {
  CONTROL_ROWS,
  CUSTODY_DESIGN_PRESETS,
  INSURER_AUDITOR_MATRIX,
  JURISDICTION_PROFILES,
  US_FEDERAL_CONTEXT_BAND,
  type ControlId,
} from '../data/custodyGovernanceData'

export interface RegulationMapperProps {
  initialPreset?: string
  initialJurisdictions?: string[]
}

export const RegulationControlMapperWorkshop: React.FC<RegulationMapperProps> = ({
  initialPreset,
  initialJurisdictions,
}) => {
  const defaultPreset =
    CUSTODY_DESIGN_PRESETS.find((p) => p.id === initialPreset)?.id ?? CUSTODY_DESIGN_PRESETS[0].id

  const [selectedPresetId, setSelectedPresetId] = useState<string>(defaultPreset)
  const [selectedJurisdictionIds, setSelectedJurisdictionIds] = useState<string[]>(
    initialJurisdictions && initialJurisdictions.length > 0
      ? initialJurisdictions
      : ['eu-mica-dora', 'hk-sfc']
  )
  const [showMarketPractice, setShowMarketPractice] = useState<boolean>(true)
  const [showUsContextBand, setShowUsContextBand] = useState<boolean>(true)
  const [onlyUnmappedControls, setOnlyUnmappedControls] = useState<boolean>(false)

  const activePreset = useMemo(
    () =>
      CUSTODY_DESIGN_PRESETS.find((p) => p.id === selectedPresetId) ?? CUSTODY_DESIGN_PRESETS[0],
    [selectedPresetId]
  )

  const implementedSet = useMemo(
    () => new Set<ControlId>(activePreset.implementedControls),
    [activePreset]
  )

  const selectedProfiles = useMemo(
    () => JURISDICTION_PROFILES.filter((j) => selectedJurisdictionIds.includes(j.id)),
    [selectedJurisdictionIds]
  )

  const toggleJurisdiction = (id: string) => {
    setSelectedJurisdictionIds((prev) => {
      if (prev.includes(id)) {
        return prev.length > 1 ? prev.filter((x) => x !== id) : prev
      }
      return [...prev, id]
    })
  }

  const visibleControls = useMemo(
    () =>
      onlyUnmappedControls ? CONTROL_ROWS.filter((c) => !implementedSet.has(c.id)) : CONTROL_ROWS,
    [onlyUnmappedControls, implementedSet]
  )

  const unmappedCount = CONTROL_ROWS.length - activePreset.implementedControls.length

  return (
    <div className="space-y-6 w-full">
      {/* Header & educational boundary */}
      <div className="glass-panel p-5 space-y-3">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Scale size={18} className="text-primary" aria-hidden="true" />
              W11 · Regulation &amp; Assurance Control Mapper
            </h2>
            <p className="text-xs text-muted-foreground">
              Educational decision mapper — <strong>not legal advice</strong> and{' '}
              <strong>no compliance verdict</strong>. Selected jurisdictions are compared{' '}
              <strong>side by side</strong>, never stacked as cumulative obligations. Where a design
              preset has no matching control, the tool reports{' '}
              <code>no mapped control found (reviewer analysis)</code> — never
              &ldquo;non-compliant&rdquo;.
            </p>
          </div>
          <span className="text-[11px] px-2.5 py-1 rounded border bg-status-info/10 text-status-info border-status-info/30 font-medium">
            As of 2026-11-21 · Standalone presets
          </span>
        </div>
      </div>

      {/* Step 1: Custody Design Preset & Jurisdiction Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-panel p-4 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">
            1. Choose a Built-in Custody Design Preset (Standalone from Module A1 W4)
          </h3>
          <div className="space-y-2">
            {CUSTODY_DESIGN_PRESETS.map((preset) => {
              const active = preset.id === activePreset.id
              return (
                <Button
                  key={preset.id}
                  type="button"
                  variant="ghost"
                  onClick={() => setSelectedPresetId(preset.id)}
                  className={`w-full h-auto block whitespace-normal text-left p-3 rounded-lg border transition-colors ${
                    active
                      ? 'bg-primary/10 border-primary text-foreground'
                      : 'bg-muted/30 border-border text-muted-foreground hover:bg-muted/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-foreground">{preset.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-muted border border-border text-foreground shrink-0">
                      {preset.implementedControls.length}/{CONTROL_ROWS.length} controls
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1 font-normal">
                    {preset.summary}
                  </p>
                </Button>
              )
            })}
          </div>
          <p className="text-xs text-muted-foreground bg-muted/40 p-2.5 rounded border border-border">
            <strong className="text-foreground">Design note:</strong>{' '}
            {activePreset.architectureNotes}
          </p>
        </div>

        <div className="glass-panel p-4 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">
            2. Select Jurisdictions / Baselines to Compare Side by Side
          </h3>
          <p className="text-xs text-muted-foreground">
            Pick one or more jurisdictions below. Each column keeps its own entity scope, licence
            gate, effective version, and binding verb (&ldquo;shall&rdquo; vs &ldquo;should&rdquo;).
          </p>
          <div className="flex flex-wrap gap-2">
            {JURISDICTION_PROFILES.map((j) => {
              const selected = selectedJurisdictionIds.includes(j.id)
              return (
                <Button
                  key={j.id}
                  type="button"
                  variant="ghost"
                  onClick={() => toggleJurisdiction(j.id)}
                  className={`text-xs px-3 py-1.5 h-auto rounded-md border ${
                    selected
                      ? 'bg-primary/15 border-primary text-primary font-semibold'
                      : 'bg-muted/40 border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {j.shortName}
                </Button>
              )
            })}
          </div>

          <div className="pt-2 border-t border-border space-y-2">
            <h4 className="text-xs font-semibold text-foreground">Display &amp; Gate Filters</h4>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowMarketPractice((v) => !v)}
                className={`text-xs px-3 py-1.5 h-auto rounded-md border ${
                  showMarketPractice
                    ? 'bg-status-info/15 border-status-info/40 text-status-info'
                    : 'bg-muted/40 border-border text-muted-foreground'
                }`}
              >
                {showMarketPractice ? 'Hide' : 'Show'} Insurer &amp; Auditor Columns (Market
                Practice)
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowUsContextBand((v) => !v)}
                className={`text-xs px-3 py-1.5 h-auto rounded-md border ${
                  showUsContextBand
                    ? 'bg-status-warning/15 border-status-warning/40 text-status-warning'
                    : 'bg-muted/40 border-border text-muted-foreground'
                }`}
              >
                {showUsContextBand ? 'Hide' : 'Show'} US Federal Context Band (SAB 121/122 &amp;
                OCC)
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOnlyUnmappedControls((v) => !v)}
                className={`text-xs px-3 py-1.5 h-auto rounded-md border ${
                  onlyUnmappedControls
                    ? 'bg-status-warning/15 border-status-warning/40 text-status-warning'
                    : 'bg-muted/40 border-border text-muted-foreground'
                }`}
              >
                {onlyUnmappedControls
                  ? `Showing ${unmappedCount} unmapped controls only`
                  : `Filter to unmapped controls (${unmappedCount})`}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Step 2: Applicability Gates (ALWAYS shown before control cells) */}
      <div className="glass-panel p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Building2 size={16} className="text-primary" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-foreground">
            3. Applicability Gates (Evaluate Before Reading Any Control Cell)
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {selectedProfiles.map((profile) => (
            <div
              key={profile.id}
              className="p-3 rounded-lg bg-muted/40 border border-border space-y-1.5 text-xs"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-foreground">{profile.shortName}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/30">
                  {profile.band}
                </span>
              </div>
              <p className="text-muted-foreground">
                <strong className="text-foreground">Entity type:</strong> {profile.gates.entityType}
              </p>
              <p className="text-muted-foreground">
                <strong className="text-foreground">Licence scope:</strong>{' '}
                {profile.gates.licenceScope}
              </p>
              <p className="text-muted-foreground">
                <strong className="text-foreground">Effective version:</strong>{' '}
                {profile.gates.effectiveVersion}
              </p>
              <p className="text-muted-foreground">
                <strong className="text-foreground">Exemptions / limits:</strong>{' '}
                {profile.gates.exemptionsAndLimits}
              </p>
              <p className="text-muted-foreground">
                <strong className="text-foreground">Binding force:</strong>{' '}
                {profile.gates.bindingForceSummary}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Step 3: Side-by-side Control Matrix */}
      <div className="glass-panel p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-semibold text-foreground">
            4. Side-by-Side Control Map ({activePreset.name})
          </h3>
          <span className="text-xs text-muted-foreground">
            {visibleControls.length} controls shown · Side-by-side comparison (not cumulative)
          </span>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/70 text-foreground border-b border-border">
              <tr>
                <th className="p-2.5 font-semibold min-w-[190px]">Control &amp; Preset Status</th>
                {selectedProfiles.map((profile) => (
                  <th key={profile.id} className="p-2.5 font-semibold min-w-[210px]">
                    <div>{profile.shortName}</div>
                    <div className="text-[10px] font-normal text-muted-foreground">
                      {profile.band}
                    </div>
                  </th>
                ))}
                {showMarketPractice ? (
                  <>
                    <th className="p-2.5 font-semibold min-w-[200px] bg-status-info/10">
                      <div>Insurer Asks</div>
                      <div className="text-[10px] font-normal text-status-info">
                        Market practice — not a mandate
                      </div>
                    </th>
                    <th className="p-2.5 font-semibold min-w-[200px] bg-status-info/10">
                      <div>Auditor Tests</div>
                      <div className="text-[10px] font-normal text-status-info">
                        Market practice — not a mandate
                      </div>
                    </th>
                  </>
                ) : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visibleControls.length === 0 ? (
                <tr>
                  <td
                    colSpan={1 + selectedProfiles.length + (showMarketPractice ? 2 : 0)}
                    className="p-4 text-center text-muted-foreground"
                  >
                    Every control row has a mapped element in this preset. Switch presets or turn
                    off the unmapped filter to inspect all 12 rows.
                  </td>
                </tr>
              ) : (
                visibleControls.map((ctrl) => {
                  const hasControl = implementedSet.has(ctrl.id)
                  const mp = INSURER_AUDITOR_MATRIX[ctrl.id]
                  return (
                    <tr key={ctrl.id} className="align-top">
                      <td className="p-2.5 space-y-1">
                        <div className="font-semibold text-foreground">{ctrl.label}</div>
                        <div className="text-[11px] text-muted-foreground">{ctrl.moduleLink}</div>
                        {hasControl ? (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-status-success/15 text-status-success border border-status-success/30 font-medium">
                            <CheckCircle2 size={11} aria-hidden="true" /> Mapped in preset
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-status-warning/15 text-status-warning border border-status-warning/30 font-medium">
                            <ShieldAlert size={11} aria-hidden="true" /> no mapped control found
                            (reviewer analysis)
                          </span>
                        )}
                      </td>

                      {selectedProfiles.map((profile) => {
                        const cell = profile.cells[ctrl.id]
                        const std = cell.claimId
                          ? getStandard(SOURCE_CLAIMS[cell.claimId].sourceId)
                          : null
                        return (
                          <td key={profile.id} className="p-2.5 space-y-1 text-muted-foreground">
                            {cell.notStated ? (
                              <span className="italic text-muted-foreground">Not stated</span>
                            ) : (
                              <>
                                <div className="flex flex-wrap items-center gap-1">
                                  <span className="text-[10px] px-1.5 py-0.5 rounded border bg-muted text-foreground border-border font-medium">
                                    {cell.bindingVerb}
                                  </span>
                                  {std && cell.citation ? (
                                    <Link
                                      to={std.deepLink}
                                      className="text-[11px] font-medium text-primary hover:underline"
                                    >
                                      {cell.citation}
                                    </Link>
                                  ) : (
                                    <span className="text-[11px] font-medium text-foreground">
                                      {cell.citation}
                                    </span>
                                  )}
                                </div>
                                <p>{cell.text}</p>
                              </>
                            )}
                          </td>
                        )
                      })}

                      {showMarketPractice ? (
                        <>
                          <td className="p-2.5 space-y-1 bg-status-info/5 text-muted-foreground">
                            <div className="text-[10px] font-semibold text-status-info">
                              {mp.insurerAsks.sourceLabel}
                            </div>
                            <p className={mp.insurerAsks.notStatedInSource ? 'italic' : ''}>
                              {mp.insurerAsks.text}
                            </p>
                          </td>
                          <td className="p-2.5 space-y-1 bg-status-info/5 text-muted-foreground">
                            <div className="text-[10px] font-semibold text-status-info">
                              {mp.auditorTests.sourceLabel}
                            </div>
                            <p>{mp.auditorTests.text}</p>
                          </td>
                        </>
                      ) : null}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Step 4: Separate US Federal Context Band (Instrument-Type Gate) */}
      {showUsContextBand ? (
        <div className="glass-panel p-4 border-status-warning/40 bg-status-warning/5 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-status-warning" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-foreground">
              Context Band Only (Excluded from Control Cells by Instrument-Type Gate): US Federal
              Accounting &amp; Permissibility Texts
            </h3>
          </div>
          <p className="text-xs text-muted-foreground">
            These texts are intentionally separated from the key-management control rows above: they
            govern financial-statement accounting or national-bank legal authority rather than
            cryptographic key controls.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {US_FEDERAL_CONTEXT_BAND.map((item) => {
              const claim = SOURCE_CLAIMS[item.claimId]
              const std = getStandard(claim.sourceId)
              return (
                <div
                  key={item.id}
                  className="p-3 rounded-lg bg-background/60 border border-border text-xs space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Link to={std.deepLink} className="font-semibold text-primary hover:underline">
                      {item.title}
                    </Link>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted border border-border text-muted-foreground">
                      {item.instrumentType}
                    </span>
                  </div>
                  <p className="text-muted-foreground">{claim.text}</p>
                  <p className="text-[11px] text-foreground">
                    <strong>Gate reason:</strong> {item.whyExcludedFromControlCells} (
                    {item.asOfVersion})
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}

      <div className="p-3 rounded-lg bg-muted/40 border border-border text-xs text-muted-foreground flex items-start gap-2">
        <Info size={14} className="text-primary shrink-0 mt-0.5" aria-hidden="true" />
        <span>
          <strong>Reminder:</strong> Mapping a control in W11 does not certify compliance or prove
          Rule G1 authority separation. Pair this map with Q1–Q6 in Section 6 and verify assurance
          report scope boundaries before relying on any vendor attestation.
        </span>
      </div>
    </div>
  )
}
