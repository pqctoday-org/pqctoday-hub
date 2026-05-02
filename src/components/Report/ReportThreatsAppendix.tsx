// SPDX-License-Identifier: GPL-3.0-only
import React, { useMemo } from 'react'
import { ExternalLink, EyeOff } from 'lucide-react'
import type { ThreatData } from '../../data/threatsData'
import { useThreatsData } from '../../hooks/useThreatsData'
import { Button } from '../ui/button'
import clsx from 'clsx'

/** Maps assess-module industry names to threats CSV industry column values. */
export const ASSESS_TO_THREATS_INDUSTRY: Record<string, string[]> = {
  'Finance & Banking': [
    'Financial Services / Banking',
    'Cryptocurrency / Blockchain',
    'Payment Card Industry',
    'Insurance',
    'Legal / Notary / eSignature',
  ],
  'Government & Defense': ['Government / Defense'],
  Healthcare: ['Healthcare / Pharmaceutical'],
  Telecommunications: ['Telecommunications'],
  Technology: [
    'Cloud Computing / Data Centers',
    'IT Industry / Software',
    'Internet of Things (IoT)',
    'Media / Entertainment / DRM',
    'Supply Chain / Logistics',
  ],
  'Energy & Utilities': [
    'Energy / Critical Infrastructure',
    'Water / Wastewater',
    'Rail / Transit',
  ],
  Automotive: ['Automotive / Connected Vehicles'],
  Aerospace: ['Aerospace / Aviation'],
  'Retail & E-Commerce': ['Retail / E-Commerce', 'Payment Card Industry'],
  Other: [],
}

const criticalityConfig: Record<ThreatData['criticality'], { label: string; className: string }> = {
  Critical: { label: 'Critical', className: 'bg-destructive/10 text-destructive' },
  High: { label: 'High', className: 'bg-warning/10 text-warning' },
  'Medium-High': { label: 'Med-High', className: 'bg-warning/5 text-warning' },
  Medium: { label: 'Medium', className: 'bg-muted text-muted-foreground' },
  Low: { label: 'Low', className: 'bg-success/10 text-success' },
}

const ThreatRow: React.FC<{
  threat: ThreatData
  isRelevant?: boolean
  onHide?: (threatId: string) => void
}> = ({ threat, isRelevant, onHide }) => {
  const crit = criticalityConfig[threat.criticality] ?? criticalityConfig['Medium']

  return (
    <tr
      className={clsx(
        'border-b border-border/50 align-top',
        isRelevant && 'bg-primary/5 border-l-2 border-l-primary'
      )}
    >
      <td className="p-2 w-8 print:hidden">
        {onHide && (
          <Button
            variant="ghost"
            type="button"
            aria-label="Hide this threat"
            onClick={(e) => {
              e.stopPropagation()
              onHide(threat.threatId)
            }}
            className="p-1 h-auto w-auto rounded text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10"
          >
            <EyeOff size={14} />
          </Button>
        )}
      </td>
      <td className="py-2.5 pr-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
        {threat.sourceUrl ? (
          <a
            href={threat.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-primary hover:underline"
            aria-label={`Source for ${threat.threatId}`}
          >
            {threat.threatId}
            <ExternalLink size={10} />
          </a>
        ) : (
          threat.threatId
        )}
      </td>
      <td className="py-2.5 pr-3">
        <span
          className={clsx(
            'text-[10px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap',
            crit.className
          )}
        >
          {crit.label}
        </span>
      </td>
      <td className="py-2.5 pr-3 text-xs text-foreground leading-relaxed max-w-xs">
        {threat.description}
      </td>
      <td className="py-2.5 pr-3 text-xs text-muted-foreground max-w-[160px] hidden md:table-cell">
        {threat.cryptoAtRisk}
      </td>
      <td className="py-2.5 text-xs text-primary max-w-[160px]">{threat.pqcReplacement}</td>
    </tr>
  )
}

interface ReportThreatsAppendixProps {
  industry: string
  /** User's selected algorithms — rows matching these get highlighted. */
  userAlgorithms?: string[]
  hiddenThreatIds: string[]
  onHideThreat: (id: string) => void
}

/** Check if a threat's cryptoAtRisk field mentions any of the user's algorithms. */
function threatMatchesAlgorithms(cryptoAtRisk: string, algorithms: string[]): boolean {
  const normalized = cryptoAtRisk.toLowerCase()
  return algorithms.some((algo) => {
    // Normalize algo names for fuzzy matching (e.g., "ECDSA P-256" → "ecdsa", "RSA-2048" → "rsa")
    const base = algo.toLowerCase().split(/[-\s]/)[0]
    return normalized.includes(base)
  })
}

export const ReportThreatsAppendix: React.FC<ReportThreatsAppendixProps> = ({
  industry,
  userAlgorithms,
  hiddenThreatIds,
  onHideThreat,
}) => {
  const { data: threatsData } = useThreatsData()
  const hiddenSet = useMemo(() => new Set(hiddenThreatIds), [hiddenThreatIds])

  const industryThreats = useMemo(() => {
    // eslint-disable-next-line security/detect-object-injection
    const threatIndustryNames = ASSESS_TO_THREATS_INDUSTRY[industry] ?? []
    return threatsData.filter(
      (t) => threatIndustryNames.includes(t.industry) && !hiddenSet.has(t.threatId)
    )
  }, [industry, hiddenSet, threatsData])

  return (
    <div className="space-y-4 overflow-x-auto print:overflow-visible">
      <div className="min-w-[400px] print:min-w-0">
        {industryThreats.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="w-8 print:hidden" />
                <th className="py-2 pr-3 text-muted-foreground font-medium text-xs">Threat ID</th>
                <th className="py-2 pr-3 text-muted-foreground font-medium text-xs">Criticality</th>
                <th className="py-2 pr-3 text-muted-foreground font-medium text-xs">Description</th>
                <th className="py-2 pr-3 text-muted-foreground font-medium text-xs hidden md:table-cell">
                  Crypto at Risk
                </th>
                <th className="py-2 text-muted-foreground font-medium text-xs">PQC Replacement</th>
              </tr>
            </thead>
            <tbody>
              {industryThreats.map((t) => (
                <ThreatRow
                  key={t.threatId}
                  threat={t}
                  isRelevant={
                    userAlgorithms?.length
                      ? threatMatchesAlgorithms(t.cryptoAtRisk, userAlgorithms)
                      : false
                  }
                  onHide={onHideThreat}
                />
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-muted-foreground text-sm py-4 text-center">
            No threat data available for this industry.
          </p>
        )}
      </div>
    </div>
  )
}
