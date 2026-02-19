import React, { useMemo } from 'react'
import { ExternalLink } from 'lucide-react'
import { threatsData } from '../../data/threatsData'
import type { ThreatData } from '../../data/threatsData'
import clsx from 'clsx'

/** Maps assess-module industry names to threats CSV industry column values. */
const ASSESS_TO_THREATS_INDUSTRY: Record<string, string[]> = {
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
  ],
  'Energy & Utilities': [
    'Energy / Critical Infrastructure',
    'Water / Wastewater',
    'Rail / Transit',
  ],
  Automotive: ['Automotive / Connected Vehicles'],
  Aerospace: ['Aerospace / Aviation'],
  'Retail & E-Commerce': [
    'Retail / E-Commerce',
    'Payment Card Industry',
    'Supply Chain / Logistics',
  ],
  Education: [],
  Other: [],
}

const criticalityConfig: Record<ThreatData['criticality'], { label: string; className: string }> = {
  Critical: { label: 'Critical', className: 'bg-destructive/10 text-destructive' },
  High: { label: 'High', className: 'bg-warning/10 text-warning' },
  'Medium-High': { label: 'Med-High', className: 'bg-warning/5 text-warning' },
  Medium: { label: 'Medium', className: 'bg-muted text-muted-foreground' },
  Low: { label: 'Low', className: 'bg-success/10 text-success' },
}

const ThreatRow: React.FC<{ threat: ThreatData }> = ({ threat }) => {
  const crit = criticalityConfig[threat.criticality] ?? criticalityConfig['Medium']

  return (
    <tr className="border-b border-border/50 align-top">
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
      <td className="py-2.5 pr-3 text-xs text-muted-foreground max-w-[160px]">
        {threat.cryptoAtRisk}
      </td>
      <td className="py-2.5 text-xs text-primary max-w-[160px]">{threat.pqcReplacement}</td>
    </tr>
  )
}

interface ReportThreatsAppendixProps {
  industry: string
}

export const ReportThreatsAppendix: React.FC<ReportThreatsAppendixProps> = ({ industry }) => {
  const { industryThreats, crossThreats } = useMemo(() => {
    // eslint-disable-next-line security/detect-object-injection
    const threatIndustryNames = ASSESS_TO_THREATS_INDUSTRY[industry] ?? []

    const industry_ = threatsData.filter((t) => threatIndustryNames.includes(t.industry))
    const cross = threatsData.filter((t) => t.industry === 'Cross-Industry')

    return { industryThreats: industry_, crossThreats: cross }
  }, [industry])

  const hasIndustryThreats = industryThreats.length > 0

  return (
    <div className="space-y-4 overflow-x-auto">
      <div className="min-w-[560px]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="py-2 pr-3 text-muted-foreground font-medium text-xs">Threat ID</th>
              <th className="py-2 pr-3 text-muted-foreground font-medium text-xs">Criticality</th>
              <th className="py-2 pr-3 text-muted-foreground font-medium text-xs">Description</th>
              <th className="py-2 pr-3 text-muted-foreground font-medium text-xs">
                Crypto at Risk
              </th>
              <th className="py-2 text-muted-foreground font-medium text-xs">PQC Replacement</th>
            </tr>
          </thead>
          <tbody>
            {hasIndustryThreats &&
              industryThreats.map((t) => <ThreatRow key={t.threatId} threat={t} />)}
          </tbody>
        </table>

        {/* Cross-industry threats divider */}
        {crossThreats.length > 0 && (
          <>
            <div className="flex items-center gap-3 py-3 border-t border-border mt-2">
              <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">
                Cross-Industry Threats
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <table className="w-full text-sm">
              <tbody>
                {crossThreats.map((t) => (
                  <ThreatRow key={t.threatId} threat={t} />
                ))}
              </tbody>
            </table>
          </>
        )}

        {!hasIndustryThreats && crossThreats.length === 0 && (
          <p className="text-muted-foreground text-sm py-4 text-center">
            No threat data available for this industry.
          </p>
        )}
      </div>
    </div>
  )
}
