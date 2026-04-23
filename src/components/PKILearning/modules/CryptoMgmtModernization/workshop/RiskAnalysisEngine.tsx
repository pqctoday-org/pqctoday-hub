// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react'
import type { CbomExportItem } from '../data/workshopTypes'

interface RiskAnalysisEngineProps {
  cbomAssets: CbomExportItem[]
}

type RiskLevel = 'critical' | 'high' | 'medium' | 'low'
type FilterLevel = 'all' | RiskLevel

interface RankedAsset extends CbomExportItem {
  riskScore: number
  riskLevel: RiskLevel
  factors: string[]
  action: string
}

const RISK_STYLES: Record<RiskLevel, { badge: string; label: string }> = {
  critical: {
    badge: 'bg-status-error/15 text-status-error border-status-error/30',
    label: 'Critical',
  },
  high: {
    badge: 'bg-status-warning/15 text-status-warning border-status-warning/30',
    label: 'High',
  },
  medium: { badge: 'bg-status-info/15 text-status-info border-status-info/30', label: 'Medium' },
  low: { badge: 'bg-status-success/15 text-status-success border-status-success/30', label: 'Low' },
}

const SAMPLE_ASSETS: CbomExportItem[] = [
  {
    name: 'OpenSSL',
    version: '1.1.1w',
    type: 'library',
    fipsStatus: 'historical',
    esvStatus: 'not-validated',
    pqcSupport: 'None — upgrade to OpenSSL 3.x with oqs-provider',
    posture: 'red',
    notes: 'EoL September 2023. CMVP cert historical.',
    eolDate: '2023-09-11',
  },
  {
    name: 'Bouncy Castle FIPS',
    version: '1.0.2.4',
    type: 'library',
    fipsStatus: 'historical',
    esvStatus: 'not-validated',
    pqcSupport: 'ML-KEM, ML-DSA available in BC-FIPS 2.x',
    posture: 'red',
    notes: 'CMVP cert #4943 moved to historical after Sep 2025 IG update.',
  },
  {
    name: 'Azure Dedicated HSM (Luna 7.7.2)',
    version: 'fw 7.7.2',
    type: 'hsm',
    fipsStatus: 'historical',
    esvStatus: 'not-validated',
    pqcSupport: 'No PQC in FIPS boundary for this firmware',
    posture: 'red',
    notes: 'CMVP cert historical. Firmware upgrade required.',
  },
  {
    name: 'wolfCrypt FIPS',
    version: '5.6.4',
    type: 'library',
    fipsStatus: 'active',
    esvStatus: 'not-validated',
    pqcSupport: 'PQC available but outside FIPS boundary per CMVP #4718',
    posture: 'yellow',
    notes: 'PQC APIs exist but not inside FIPS boundary.',
  },
  {
    name: 'OpenSSL FIPS Provider',
    version: '3.0.9',
    type: 'library',
    fipsStatus: 'in-mip',
    esvStatus: 'in-mip',
    pqcSupport: 'ML-KEM, ML-DSA, SLH-DSA via oqs-provider',
    posture: 'yellow',
    notes: 'In MIP queue; use 3.5.x FIPS provider when validated.',
  },
  {
    name: 'BoringSSL / AWS-LC',
    version: '2024-02-20',
    type: 'library',
    fipsStatus: 'active',
    esvStatus: 'active',
    pqcSupport: 'ML-KEM-768, partial ML-DSA',
    posture: 'green',
    notes: 'AWS-LC CMVP cert #5244 active. ESV active.',
  },
  {
    name: 'Thales Luna Network HSM 7',
    version: 'fw 7.8.4',
    type: 'hsm',
    fipsStatus: 'active-pqc',
    esvStatus: 'active',
    pqcSupport: 'ML-DSA, ML-KEM in FIPS boundary',
    posture: 'green',
    notes: 'CMVP #4962 active. PQC in FIPS boundary.',
  },
]

function computeRisk(item: CbomExportItem): { score: number; factors: string[]; action: string } {
  let score = 0
  const factors: string[] = []

  if (item.fipsStatus === 'revoked') {
    score += 4
    factors.push('FIPS cert revoked')
  } else if (item.fipsStatus === 'historical') {
    score += 3
    factors.push('FIPS cert historical')
  } else if (item.fipsStatus === 'not-validated') {
    score += 2
    factors.push('No FIPS 140-3 validation')
  } else if (item.fipsStatus === 'in-mip') {
    score += 1
    factors.push('FIPS cert in MIP queue')
  }

  if (item.esvStatus === 'revoked') {
    score += 2
    factors.push('ESV cert revoked')
  } else if (item.esvStatus === 'historical') {
    score += 1
    factors.push('ESV cert historical')
  } else if (item.esvStatus === 'not-validated') {
    score += 1
    factors.push('No SP 800-90B ESV validation')
  }

  const noPqc =
    item.pqcSupport === '—' ||
    item.pqcSupport.toLowerCase().startsWith('none') ||
    item.pqcSupport.toLowerCase().startsWith('no pqc')
  const pqcOutsideBoundary = !noPqc && item.pqcSupport.toLowerCase().includes('outside fips')
  if (noPqc) {
    score += 2
    factors.push('No PQC support')
  } else if (pqcOutsideBoundary) {
    score += 1
    factors.push('PQC outside FIPS boundary')
  }

  if (item.posture === 'red') {
    score += 1
    factors.push('Overall posture: critical')
  }

  if (item.eolDate) {
    const eolMs = new Date(item.eolDate).getTime()
    const now = Date.now()
    const oneYear = 365 * 24 * 3600 * 1000
    if (eolMs < now) {
      score += 2
      factors.push('Past end-of-life')
    } else if (eolMs - now < oneYear) {
      score += 1
      factors.push('EoL within 12 months')
    }
  }

  const riskLevel: RiskLevel =
    score >= 7 ? 'critical' : score >= 5 ? 'high' : score >= 3 ? 'medium' : 'low'

  const action =
    riskLevel === 'critical'
      ? 'Immediate action — open remediation ticket this sprint; assess Mitigate or Migrate path (Step 8).'
      : riskLevel === 'high'
        ? 'Plan remediation within 90 days; add to next PDCA cycle backlog.'
        : riskLevel === 'medium'
          ? 'Schedule for next quarterly review; confirm roadmap for PQC readiness.'
          : 'Monitor — re-assess at next annual PDCA cycle.'

  return { score, factors, action }
}

const FILTER_LABELS: FilterLevel[] = ['all', 'critical', 'high', 'medium', 'low']

export const RiskAnalysisEngine: React.FC<RiskAnalysisEngineProps> = ({ cbomAssets }) => {
  const [filter, setFilter] = useState<FilterLevel>('all')

  const source = cbomAssets.length > 0 ? cbomAssets : SAMPLE_ASSETS
  const usingLive = cbomAssets.length > 0

  const ranked: RankedAsset[] = useMemo(
    () =>
      source
        .map((item) => {
          const { score, factors, action } = computeRisk(item)
          const riskLevel: RiskLevel =
            score >= 7 ? 'critical' : score >= 5 ? 'high' : score >= 3 ? 'medium' : 'low'
          return { ...item, riskScore: score, riskLevel, factors, action }
        })
        .sort((a, b) => b.riskScore - a.riskScore),
    [source]
  )

  const counts = useMemo(
    () => ({
      critical: ranked.filter((r) => r.riskLevel === 'critical').length,
      high: ranked.filter((r) => r.riskLevel === 'high').length,
      medium: ranked.filter((r) => r.riskLevel === 'medium').length,
      low: ranked.filter((r) => r.riskLevel === 'low').length,
    }),
    [ranked]
  )

  const visible = filter === 'all' ? ranked : ranked.filter((r) => r.riskLevel === filter)

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        CSWP.39 §5 step 4 (Prioritise) requires a Risk Analysis Engine that scores assets from the
        Information Repository and produces a prioritised remediation queue. This engine scores each
        CBOM asset on FIPS validation status, ESV status, PQC readiness, posture, and EoL.
      </p>

      {/* Data source banner */}
      <div
        className={`flex items-start gap-2 rounded-lg p-3 border text-xs ${usingLive ? 'bg-status-success/10 border-status-success/30' : 'bg-muted/40 border-border'}`}
      >
        <Info
          size={14}
          className={`mt-0.5 shrink-0 ${usingLive ? 'text-status-success' : 'text-muted-foreground'}`}
        />
        <p className={usingLive ? 'text-status-success' : 'text-muted-foreground'}>
          {usingLive
            ? `Using CBOM loaded from Step 3 — ${source.length} assets.`
            : `No CBOM loaded from Step 3 yet. Showing ${SAMPLE_ASSETS.length} educational sample assets. Complete Step 3 to analyse your own CBOM.`}
        </p>
      </div>

      {/* Risk summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(['critical', 'high', 'medium', 'low'] as RiskLevel[]).map((lvl) => (
          <div key={lvl} className={`rounded-lg p-3 border text-center ${RISK_STYLES[lvl].badge}`}>
            <div className="text-2xl font-bold">{counts[lvl]}</div>
            <div className="text-xs font-bold mt-0.5">{RISK_STYLES[lvl].label}</div>
          </div>
        ))}
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap gap-2">
        {FILTER_LABELS.map((f) => (
          <Button
            key={f}
            variant={filter === f ? 'gradient' : 'outline'}
            onClick={() => setFilter(f)}
            className="text-xs capitalize"
          >
            {f === 'all'
              ? `All (${ranked.length})`
              : `${RISK_STYLES[f as RiskLevel].label} (${counts[f as RiskLevel]})`}
          </Button>
        ))}
      </div>

      {/* Ranked asset table */}
      <div className="space-y-3">
        {visible.length === 0 && (
          <div className="flex items-center gap-2 text-status-success text-sm p-4 bg-muted/30 rounded-lg border border-border">
            <CheckCircle2 size={16} />
            No assets in this risk category.
          </div>
        )}
        {visible.map((asset, i) => (
          <div key={i} className="bg-muted/40 rounded-lg p-4 border border-border space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-foreground text-sm">{asset.name}</span>
                <span className="text-xs text-muted-foreground font-mono">{asset.version}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded border font-bold uppercase ${RISK_STYLES[asset.riskLevel].badge}`}
                >
                  {RISK_STYLES[asset.riskLevel].label} · score {asset.riskScore}
                </span>
                <span className="text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5">
                  {asset.type}
                </span>
              </div>
            </div>

            {/* Risk factors */}
            <div className="flex flex-wrap gap-1.5">
              {asset.factors.map((f) => (
                <span
                  key={f}
                  className="text-[10px] bg-muted/60 text-muted-foreground border border-border rounded px-1.5 py-0.5"
                >
                  {f}
                </span>
              ))}
            </div>

            {/* Action */}
            <div className="flex items-start gap-1.5">
              <AlertTriangle size={12} className="text-status-warning mt-0.5 shrink-0" />
              <p className="text-xs text-foreground/80">{asset.action}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="text-xs text-muted-foreground bg-muted/30 rounded p-3 border border-border">
        <strong className="text-foreground">Next:</strong> For Critical and High assets, proceed to
        Step 8 (Mitigate or Migrate) to run the CSWP.39 §4.6 crypto-agility decision wizard and
        determine whether a crypto gateway or full algorithm migration is appropriate.
      </div>
    </div>
  )
}
