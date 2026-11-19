// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState } from 'react'
import { Clock, AlertTriangle, CheckCircle2, Shield, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FIELD_ASSET_PROFILES } from '../data/energyGridData'

const CURRENT_YEAR = 2026

export const SmartMeterLifecyclePlanner: React.FC = () => {
  const [selectedAssetId, setSelectedAssetId] = useState<string>('smart-meter')
  const selectedAsset =
    FIELD_ASSET_PROFILES.find((a) => a.id === selectedAssetId) ?? FIELD_ASSET_PROFILES[0]

  const [deployYear, setDeployYear] = useState<number>(selectedAsset.defaultDeployYear)
  const [lifespanYears, setLifespanYears] = useState<number>(selectedAsset.typicalLifespanYears)
  const [confidentialityYears, setConfidentialityYears] = useState<number>(
    selectedAsset.defaultConfidentialityYears
  )
  const [migrationLeadYears, setMigrationLeadYears] = useState<number>(
    selectedAsset.defaultMigrationLeadYears
  )
  const [crqcHorizonYear, setCrqcHorizonYear] = useState<number>(2035)

  const handleSelectAsset = (id: string) => {
    const profile = FIELD_ASSET_PROFILES.find((a) => a.id === id)
    if (!profile) return
    setSelectedAssetId(id)
    setDeployYear(profile.defaultDeployYear)
    setLifespanYears(profile.typicalLifespanYears)
    setConfidentialityYears(profile.defaultConfidentialityYears)
    setMigrationLeadYears(profile.defaultMigrationLeadYears)
  }

  const retirementYear = deployYear + lifespanYears
  const moscaRiskYear = CURRENT_YEAR + migrationLeadYears + confidentialityYears
  const yearsUntilCrqc = crqcHorizonYear - CURRENT_YEAR
  const moscaGapYears = migrationLeadYears + confidentialityYears - yearsUntilCrqc
  const operatesPastCrqc = retirementYear >= crqcHorizonYear
  const needsInterimMitigation = moscaGapYears > 0 || operatesPastCrqc

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground flex items-start gap-2.5">
        <Info size={15} className="text-primary shrink-0 mt-0.5" />
        <span>
          <strong>Educational Mosca &amp; Field-Lifecycle Planner:</strong> Model 15–25 year utility
          asset lifespans to decide when hardware replacement cycles are too slow and interim
          gateway/symmetric-key compensating controls must bridge the gap. CRQC arrival is uncertain
          — test multiple planning horizons.
        </span>
      </div>

      {/* Asset Selector */}
      <div className="glass-panel p-5 space-y-3">
        <h3 className="text-sm font-bold text-foreground">1. Choose Field Asset Class</h3>
        <div
          role="group"
          aria-label="Choose utility field asset class"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5"
        >
          {FIELD_ASSET_PROFILES.map((asset) => {
            const active = asset.id === selectedAsset.id
            return (
              <Button
                key={asset.id}
                variant="ghost"
                aria-pressed={active}
                onClick={() => handleSelectAsset(asset.id)}
                className={`h-auto flex-col items-start text-left rounded-lg border p-3 transition-colors whitespace-normal ${
                  active
                    ? 'border-primary bg-primary/10 hover:bg-primary/15'
                    : 'border-border bg-muted/20 hover:border-primary/40'
                }`}
              >
                <span className="text-xs font-bold text-foreground block">{asset.name}</span>
                <span className="text-[11px] text-primary font-mono font-normal mt-1 block">
                  Typical lifespan: {asset.typicalLifespanYears} yrs
                </span>
              </Button>
            )
          })}
        </div>
      </div>

      {/* Sliders */}
      <div className="glass-panel p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <label
            htmlFor="deploy-year-input"
            className="text-xs font-semibold text-foreground block"
          >
            Fleet Deployment Year: <span className="text-primary font-mono">{deployYear}</span>
          </label>
          <input
            id="deploy-year-input"
            type="range"
            min={2015}
            max={2028}
            value={deployYear}
            onChange={(e) => setDeployYear(Number(e.target.value))}
            className="w-full accent-primary"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="lifespan-years-input"
            className="text-xs font-semibold text-foreground block"
          >
            Hardware Service Lifespan:{' '}
            <span className="text-primary font-mono">{lifespanYears} years</span> (retires{' '}
            {retirementYear})
          </label>
          <input
            id="lifespan-years-input"
            type="range"
            min={10}
            max={25}
            value={lifespanYears}
            onChange={(e) => setLifespanYears(Number(e.target.value))}
            className="w-full accent-primary"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="confidentiality-years-input"
            className="text-xs font-semibold text-foreground block"
          >
            Data / Trust Shelf-Life (X):{' '}
            <span className="text-primary font-mono">{confidentialityYears} years</span>
          </label>
          <input
            id="confidentiality-years-input"
            type="range"
            min={2}
            max={20}
            value={confidentialityYears}
            onChange={(e) => setConfidentialityYears(Number(e.target.value))}
            className="w-full accent-primary"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="migration-lead-input"
            className="text-xs font-semibold text-foreground block"
          >
            Fleet Migration Lead Time (Y):{' '}
            <span className="text-primary font-mono">{migrationLeadYears} years</span>
          </label>
          <input
            id="migration-lead-input"
            type="range"
            min={2}
            max={12}
            value={migrationLeadYears}
            onChange={(e) => setMigrationLeadYears(Number(e.target.value))}
            className="w-full accent-primary"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label
            htmlFor="crqc-horizon-input"
            className="text-xs font-semibold text-foreground block"
          >
            Planning Horizon for Quantum Threat (Z):{' '}
            <span className="text-primary font-mono">
              {crqcHorizonYear} ({yearsUntilCrqc} years from {CURRENT_YEAR})
            </span>
          </label>
          <input
            id="crqc-horizon-input"
            type="range"
            min={2030}
            max={2042}
            value={crqcHorizonYear}
            onChange={(e) => setCrqcHorizonYear(Number(e.target.value))}
            className="w-full accent-primary"
          />
        </div>
      </div>

      {/* Mosca Verdict */}
      <div
        role="status"
        className={`rounded-xl border p-4 space-y-2 ${
          needsInterimMitigation
            ? 'border-status-warning/50 bg-status-warning/10 text-status-warning'
            : 'border-status-success/50 bg-status-success/10 text-status-success'
        }`}
      >
        <div className="flex items-center gap-2 font-bold text-sm">
          {needsInterimMitigation ? (
            <AlertTriangle size={17} className="shrink-0" />
          ) : (
            <CheckCircle2 size={17} className="shrink-0" />
          )}
          <span>
            {needsInterimMitigation
              ? 'Interim Gateway / Symmetric-Key Mitigations Required Before Hardware Refresh'
              : 'Scheduled Refresh Window Aligns With Selected Planning Horizon'}
          </span>
        </div>
        <p className="text-xs text-foreground/90 leading-relaxed">
          {selectedAsset.name} deployed in <strong>{deployYear}</strong> stays energized until{' '}
          <strong>{retirementYear}</strong>. Mosca horizon (X + Y ={' '}
          {confidentialityYears + migrationLeadYears} yrs, reaching {moscaRiskYear}) vs. planning
          horizon {crqcHorizonYear} (Z = {yearsUntilCrqc} yrs){' '}
          {moscaGapYears > 0
            ? `leaves a ${moscaGapYears}-year exposure gap.`
            : 'falls within the selected planning window, though hardware longevity still requires RFP agility.'}
        </p>
      </div>

      {/* Two-Track Strategy Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="glass-panel p-4 space-y-1.5">
          <div className="flex items-center gap-1.5 font-semibold text-foreground">
            <Clock size={14} className="text-primary shrink-0" />
            <span>Hardware Constraint</span>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            {selectedAsset.hardwareConstraint}
          </p>
        </div>

        <div className="glass-panel p-4 space-y-1.5 border-primary/30">
          <div className="flex items-center gap-1.5 font-semibold text-foreground">
            <Shield size={14} className="text-primary shrink-0" />
            <span>Track 1: Interim Compensating Control</span>
          </div>
          <p className="text-foreground/90 leading-relaxed">{selectedAsset.interimMitigation}</p>
        </div>

        <div className="glass-panel p-4 space-y-1.5">
          <div className="flex items-center gap-1.5 font-semibold text-foreground">
            <CheckCircle2 size={14} className="text-status-success shrink-0" />
            <span>Track 2: Hardware Replacement &amp; RFP</span>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            {selectedAsset.replacementStrategy}
          </p>
        </div>
      </div>
    </div>
  )
}
