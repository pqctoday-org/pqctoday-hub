// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo } from 'react'
import { ShieldCheck, DollarSign, Clock, AlertTriangle } from 'lucide-react'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import {
  AVIONICS_SYSTEMS,
  DAL_DESCRIPTIONS,
  CERTIFICATION_AUTHORITIES,
} from '../data/certificationData'
import { DAL_COLORS } from '../data/aerospaceConstants'

const systemItems = AVIONICS_SYSTEMS.map((s) => ({ id: s.id, label: `${s.acronym} — ${s.name}` }))

function formatUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n}`
}

export const CertificationImpactAnalyzer: React.FC = () => {
  const [selectedSystem, setSelectedSystem] = useState(AVIONICS_SYSTEMS[0].id)

  const system = useMemo(
    () => AVIONICS_SYSTEMS.find((s) => s.id === selectedSystem)!,
    [selectedSystem]
  )

  const dalInfo = DAL_DESCRIPTIONS[system.dalLevel]

  // Estimate PQC library impact
  const pqcLibraryLoC = 15_000 // Typical PQC library size
  const addedTestCases = Math.round(pqcLibraryLoC * (system.mcdcExplosionPct / 100) * 2)

  return (
    <div className="space-y-6">
      {/* System Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-primary" />
          <span className="text-sm font-medium text-foreground">Select Avionics System:</span>
        </div>
        <FilterDropdown
          items={systemItems}
          selectedId={selectedSystem}
          onSelect={setSelectedSystem}
          label="System"
        />
      </div>

      {/* System Overview */}
      <div className="glass-panel p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground">
            {system.acronym}: {system.name}
          </h3>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border ${DAL_COLORS[system.dalLevel]}`}
          >
            DAL-{system.dalLevel}: {dalInfo.name}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">{system.description}</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-muted-foreground">Processor:</span>{' '}
            <span className="font-bold text-foreground">{system.typicalProcessor}</span>
          </div>
          <div>
            <span className="text-muted-foreground">RAM:</span>{' '}
            <span className="font-bold text-foreground">
              {system.ramMB >= 1024
                ? `${(system.ramMB / 1024).toFixed(0)} GB`
                : `${system.ramMB} MB`}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Bus:</span>{' '}
            <span className="font-bold text-foreground">{system.busType}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Current Crypto:</span>{' '}
            <span className="font-bold text-foreground">{system.currentCrypto}</span>
          </div>
        </div>
      </div>

      {/* Cost & Timeline Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Retrofit */}
        <div className="glass-panel p-4 space-y-3 border-l-4 border-status-warning">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <DollarSign size={16} className="text-status-warning" />
            Retrofit (STC)
          </h3>
          <p className="text-xs text-muted-foreground">
            Supplemental Type Certificate for in-service fleet. Requires integration with existing
            certified software baseline.
          </p>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Cost Range:</span>
              <span className="font-bold text-foreground">
                {formatUsd(system.certCostRetrofitUsd[0])} &ndash;{' '}
                {formatUsd(system.certCostRetrofitUsd[1])}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Timeline:</span>
              <span className="font-bold text-foreground">
                {system.certMonthsRetrofit[0]}&ndash;{system.certMonthsRetrofit[1]} months
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">MC/DC Explosion:</span>
              <span className="font-bold text-status-warning">
                +{system.mcdcExplosionPct}% test cases
              </span>
            </div>
          </div>
        </div>

        {/* Clean Sheet */}
        <div className="glass-panel p-4 space-y-3 border-l-4 border-status-success">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Clock size={16} className="text-status-success" />
            Clean-Sheet (New TC)
          </h3>
          <p className="text-xs text-muted-foreground">
            New Type Certificate with PQC designed from day one. Crypto requirements integrated into
            initial software architecture.
          </p>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Cost Range:</span>
              <span className="font-bold text-foreground">
                {formatUsd(system.certCostCleanSheetUsd[0])} &ndash;{' '}
                {formatUsd(system.certCostCleanSheetUsd[1])}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Timeline:</span>
              <span className="font-bold text-foreground">
                {system.certMonthsCleanSheet[0]}&ndash;{system.certMonthsCleanSheet[1]} months
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Savings vs Retrofit:</span>
              <span className="font-bold text-status-success">
                {Math.round(
                  ((system.certCostRetrofitUsd[1] - system.certCostCleanSheetUsd[1]) /
                    system.certCostRetrofitUsd[1]) *
                    100
                )}
                % lower cost
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Code Impact */}
      <div className="glass-panel p-4 space-y-3">
        <h3 className="text-sm font-bold text-foreground">Code Impact Assessment</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-foreground">
              {(system.linesOfCodeEstimate / 1000).toFixed(0)}K
            </div>
            <div className="text-muted-foreground">Existing LoC</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-primary">
              +{(pqcLibraryLoC / 1000).toFixed(0)}K
            </div>
            <div className="text-muted-foreground">PQC Library LoC</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-status-warning">
              +{addedTestCases.toLocaleString()}
            </div>
            <div className="text-muted-foreground">New Test Cases</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-foreground">
              {system.do254Required ? 'Yes' : 'No'}
            </div>
            <div className="text-muted-foreground">DO-254 (Hardware)</div>
          </div>
        </div>
        {system.do254Required && (
          <div className="flex items-start gap-2 text-xs text-status-warning">
            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
            This system contains custom ASICs requiring DO-254 hardware assurance. Adding a PQC
            crypto ASIC would require a separate DO-254 certification effort.
          </div>
        )}
      </div>

      {/* Certification Authorities */}
      <div className="glass-panel p-4 space-y-3">
        <h3 className="text-sm font-bold text-foreground">Certification Authority Requirements</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {CERTIFICATION_AUTHORITIES.map((auth) => (
            <div key={auth.id} className="bg-muted/50 rounded-lg p-3 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-foreground">{auth.name}</span>
                <span className="text-muted-foreground">{auth.country}</span>
              </div>
              <div className="text-muted-foreground mb-1">
                {auth.framework} &middot; {auth.standard}
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded border font-bold ${
                  auth.status.includes('Mandated')
                    ? 'bg-status-success/15 text-status-success border-status-success/30'
                    : 'bg-status-warning/15 text-status-warning border-status-warning/30'
                }`}
              >
                {auth.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
