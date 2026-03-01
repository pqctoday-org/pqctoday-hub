// SPDX-License-Identifier: GPL-3.0-only
import React, { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  Legend,
} from 'recharts'
import { TrendingUp, Info } from 'lucide-react'
import { CollapsibleSection } from './ReportContent'
import type { AssessmentResult } from '../../hooks/assessmentTypes'
import type { AssessmentSnapshot } from '../../store/useAssessmentStore'

interface KPITrendingSectionProps {
  history: AssessmentSnapshot[]
  currentResult: AssessmentResult
  defaultOpen?: boolean
}

const RISK_LEVEL_LABEL: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
}

interface LineTooltipProps {
  active?: boolean
  payload?: Array<{ value?: number; payload?: { riskLevel?: string } }>
  label?: string
}
const LineTooltip = ({ active, payload, label }: LineTooltipProps) => {
  if (!active || !payload?.length) return null
  const item = payload[0]
  const riskLevel = item.payload?.riskLevel
  return (
    <div
      style={{
        background: 'hsl(var(--card))',
        border: '1px solid hsl(var(--border))',
        borderRadius: '0.5rem',
        padding: '0.5rem 0.75rem',
        fontSize: '0.8125rem',
      }}
    >
      <p style={{ color: 'hsl(var(--muted-foreground))' }}>{label}</p>
      <p style={{ color: 'hsl(var(--primary))', fontWeight: 600 }}>Score: {item.value}</p>
      {riskLevel && (
        <p style={{ color: 'hsl(var(--foreground))' }}>
          {RISK_LEVEL_LABEL[riskLevel] ?? riskLevel}
        </p>
      )}
    </div>
  )
}

export const KPITrendingSection: React.FC<KPITrendingSectionProps> = ({
  history,
  currentResult,
  defaultOpen = false,
}) => {
  const style = getComputedStyle(document.documentElement)
  const primaryColor = `hsl(${style.getPropertyValue('--primary').trim()})`
  const mutedColor = `hsl(${style.getPropertyValue('--muted-foreground').trim()})`
  const destructiveColor = `hsl(${style.getPropertyValue('--destructive').trim()})`
  const warningColor = `hsl(${style.getPropertyValue('--warning') || '38 92% 50%'})`

  const lineData = useMemo(
    () =>
      history.map((snap) => ({
        date: new Date(snap.completedAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        riskScore: snap.riskScore,
        riskLevel: snap.riskLevel,
      })),
    [history]
  )

  const currentScores = currentResult.categoryScores
  const previousScores = history.length >= 2 ? history[history.length - 2].categoryScores : null

  const radarData = [
    {
      subject: 'Quantum\nExposure',
      current: currentScores?.quantumExposure ?? 0,
      previous: previousScores?.quantumExposure,
    },
    {
      subject: 'Migration\nComplexity',
      current: currentScores?.migrationComplexity ?? 0,
      previous: previousScores?.migrationComplexity,
    },
    {
      subject: 'Regulatory\nPressure',
      current: currentScores?.regulatoryPressure ?? 0,
      previous: previousScores?.regulatoryPressure,
    },
    {
      subject: 'Org\nReadiness',
      current: currentScores?.organizationalReadiness ?? 0,
      previous: previousScores?.organizationalReadiness,
    },
  ]

  const hasMultiple = history.length >= 2

  return (
    <CollapsibleSection
      title="Risk Score Trending"
      icon={<TrendingUp size={18} className="text-primary" />}
      defaultOpen={defaultOpen}
      infoTip="Tracks your PQC risk score and category breakdown across assessments. Complete additional assessments over time to see your progress."
    >
      {/* Single-snapshot callout */}
      {!hasMultiple && (
        <div className="print:hidden flex items-start gap-2 rounded-lg bg-muted/30 border border-border px-4 py-3 mb-5 text-sm text-muted-foreground">
          <Info size={15} className="shrink-0 mt-0.5 text-primary" />
          <span>
            Complete your next assessment to see score trends over time. Your current category
            scores are shown below.
          </span>
        </div>
      )}

      {/* Print-only table */}
      <div className="hidden print:block mb-4 text-sm">
        <p className="font-semibold mb-2">Assessment History</p>
        <table className="w-full text-left border-collapse text-xs mb-4">
          <thead>
            <tr>
              <th className="border-b border-border pb-1 pr-4">Date</th>
              <th className="border-b border-border pb-1 pr-4">Risk Score</th>
              <th className="border-b border-border pb-1">Level</th>
            </tr>
          </thead>
          <tbody>
            {history.map((snap, i) => (
              <tr key={i}>
                <td className="py-1 pr-4">
                  {new Date(snap.completedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </td>
                <td className="py-1 pr-4">{snap.riskScore}</td>
                <td className="py-1">{RISK_LEVEL_LABEL[snap.riskLevel] ?? snap.riskLevel}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {currentScores && (
          <>
            <p className="font-semibold mb-2">Current Category Scores</p>
            <table className="w-full text-left border-collapse text-xs">
              <tbody>
                <tr>
                  <td className="py-1 pr-4">Quantum Exposure</td>
                  <td>{currentScores.quantumExposure}</td>
                </tr>
                <tr>
                  <td className="py-1 pr-4">Migration Complexity</td>
                  <td>{currentScores.migrationComplexity}</td>
                </tr>
                <tr>
                  <td className="py-1 pr-4">Regulatory Pressure</td>
                  <td>{currentScores.regulatoryPressure}</td>
                </tr>
                <tr>
                  <td className="py-1 pr-4">Org Readiness</td>
                  <td>{currentScores.organizationalReadiness}</td>
                </tr>
              </tbody>
            </table>
          </>
        )}
      </div>

      <div className="print:hidden grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line chart — risk score over time */}
        {hasMultiple && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Overall Risk Score</p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={lineData} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
                <XAxis
                  dataKey="date"
                  tick={{ fill: mutedColor, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: mutedColor, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                />
                <ReferenceLine
                  y={70}
                  stroke={destructiveColor}
                  strokeDasharray="4 3"
                  label={{ value: 'High', fill: destructiveColor, fontSize: 10, position: 'right' }}
                />
                <ReferenceLine
                  y={40}
                  stroke={warningColor}
                  strokeDasharray="4 3"
                  label={{ value: 'Med', fill: warningColor, fontSize: 10, position: 'right' }}
                />
                <Tooltip content={<LineTooltip />} />
                <Line
                  type="monotone"
                  dataKey="riskScore"
                  stroke={primaryColor}
                  strokeWidth={2}
                  dot={{ fill: primaryColor, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Radar chart — category breakdown */}
        {currentScores && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Category Breakdown</p>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData} margin={{ top: 8, right: 24, left: 24, bottom: 8 }}>
                <PolarGrid stroke={`hsl(${style.getPropertyValue('--border').trim()})`} />
                <PolarAngleAxis dataKey="subject" tick={{ fill: mutedColor, fontSize: 10 }} />
                <Radar
                  name="Current"
                  dataKey="current"
                  stroke={primaryColor}
                  fill={primaryColor}
                  fillOpacity={0.3}
                />
                {previousScores && (
                  <Radar
                    name="Previous"
                    dataKey="previous"
                    stroke={mutedColor}
                    fill={mutedColor}
                    fillOpacity={0.15}
                  />
                )}
                {previousScores && <Legend wrapperStyle={{ fontSize: 11 }} />}
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* If only 1 snapshot, show radar full-width */}
        {!hasMultiple && !currentScores && (
          <p className="text-sm text-muted-foreground">
            Category scores are only available for comprehensive assessments.
          </p>
        )}
      </div>
    </CollapsibleSection>
  )
}
