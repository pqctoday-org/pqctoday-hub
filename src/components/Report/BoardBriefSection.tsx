// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import type { AssessmentResult } from '../../hooks/assessmentTypes'
import type { ROISummary } from '../shared/ROICalculatorSection'

interface BoardBriefProps {
  result: AssessmentResult
  industry: string
  country: string
  roiSummary: ROISummary | null
  generatedAt: string
  visible: boolean
}

const RISK_LEVEL_LABEL: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
}

const RISK_LEVEL_BG: Record<string, string> = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#f97316',
  critical: '#ef4444',
}

function formatUSD(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${value.toFixed(0)}`
}

const ScoreBar = ({ value, max = 100 }: { value: number; max?: number }) => (
  <div
    style={{
      height: '6px',
      borderRadius: '3px',
      background: '#e5e7eb',
      marginTop: '4px',
      overflow: 'hidden',
    }}
  >
    <div
      style={{
        height: '100%',
        width: `${(value / max) * 100}%`,
        background: value >= 70 ? '#ef4444' : value >= 40 ? '#f59e0b' : '#22c55e',
        borderRadius: '3px',
      }}
    />
  </div>
)

export const BoardBriefSection: React.FC<BoardBriefProps> = ({
  result,
  industry,
  country,
  roiSummary,
  generatedAt,
  visible,
}) => {
  if (!visible) return null

  const riskLevel = result.riskLevel
  const riskColor = RISK_LEVEL_BG[riskLevel] ?? '#f59e0b'
  const topActions = result.recommendedActions?.slice(0, 3) ?? []
  const mandatedFrameworks = result.complianceImpacts?.filter((c) => c.requiresPQC === true) ?? []
  const hndlAtRisk = result.hndlRiskWindow?.isAtRisk
  const hnflAtRisk = result.hnflRiskWindow?.isAtRisk
  const formattedDate = new Date(generatedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const categoryScores = result.categoryScores

  return (
    <div className="exec-brief-content">
      {/* ─── Page 1: Risk Summary ─── */}
      <div style={{ fontFamily: 'system-ui, sans-serif', color: '#111', fontSize: '11pt' }}>
        {/* Header */}
        <div
          style={{
            borderBottom: '2px solid #1d4ed8',
            paddingBottom: '8pt',
            marginBottom: '16pt',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
          }}
        >
          <div>
            <h1 style={{ fontSize: '18pt', fontWeight: 700, margin: 0, color: '#1d4ed8' }}>
              PQC Risk Assessment
            </h1>
            <p style={{ margin: '2pt 0 0', color: '#6b7280', fontSize: '9pt' }}>
              Executive Summary — Prepared for Board Review
            </p>
          </div>
          <div style={{ textAlign: 'right', fontSize: '9pt', color: '#6b7280' }}>
            <div>{industry}</div>
            {country && <div>{country}</div>}
            <div>{formattedDate}</div>
          </div>
        </div>

        {/* Risk score + level */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24pt',
            marginBottom: '20pt',
            padding: '12pt 16pt',
            border: `2px solid ${riskColor}`,
            borderRadius: '6pt',
          }}
        >
          <div style={{ textAlign: 'center', minWidth: '80pt' }}>
            <div
              style={{
                fontSize: '40pt',
                fontWeight: 800,
                lineHeight: 1,
                color: riskColor,
              }}
            >
              {result.riskScore}
            </div>
            <div style={{ fontSize: '8pt', color: '#6b7280', marginTop: '2pt' }}>out of 100</div>
          </div>
          <div>
            <div
              style={{
                display: 'inline-block',
                background: riskColor,
                color: '#fff',
                padding: '2pt 8pt',
                borderRadius: '3pt',
                fontSize: '10pt',
                fontWeight: 700,
                marginBottom: '6pt',
              }}
            >
              {RISK_LEVEL_LABEL[riskLevel] ?? riskLevel} Risk
            </div>
            <p style={{ margin: 0, fontSize: '9.5pt', color: '#374151', lineHeight: 1.5 }}>
              {result.executiveSummary ?? result.narrative ?? ''}
            </p>
          </div>
        </div>

        {/* Category scores grid */}
        {categoryScores && (
          <div style={{ marginBottom: '20pt' }}>
            <h2
              style={{ fontSize: '11pt', fontWeight: 700, marginBottom: '8pt', color: '#374151' }}
            >
              Risk Category Breakdown
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8pt',
              }}
            >
              {[
                { label: 'Quantum Exposure', value: categoryScores.quantumExposure },
                { label: 'Migration Complexity', value: categoryScores.migrationComplexity },
                { label: 'Regulatory Pressure', value: categoryScores.regulatoryPressure },
                {
                  label: 'Organizational Readiness',
                  value: categoryScores.organizationalReadiness,
                },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  style={{
                    padding: '8pt',
                    border: '1px solid #e5e7eb',
                    borderRadius: '4pt',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '9.5pt',
                    }}
                  >
                    <span style={{ color: '#374151' }}>{label}</span>
                    <span style={{ fontWeight: 700 }}>{value}</span>
                  </div>
                  <ScoreBar value={value} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top 3 actions */}
        {topActions.length > 0 && (
          <div style={{ marginBottom: '16pt' }}>
            <h2
              style={{ fontSize: '11pt', fontWeight: 700, marginBottom: '8pt', color: '#374151' }}
            >
              Priority Actions
            </h2>
            <ol style={{ margin: 0, paddingLeft: '16pt' }}>
              {topActions.map((action, i) => (
                <li key={i} style={{ marginBottom: '4pt', fontSize: '9.5pt', color: '#374151' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      fontSize: '8pt',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: action.category === 'immediate' ? '#ef4444' : '#f59e0b',
                      marginRight: '4pt',
                    }}
                  >
                    [{action.category}]
                  </span>
                  {action.action}
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* HNDL / HNFL */}
        {(hndlAtRisk || hnflAtRisk) && (
          <div
            style={{
              padding: '8pt 12pt',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '4pt',
              fontSize: '9pt',
              color: '#7f1d1d',
            }}
          >
            <strong>Harvest-Now Risk Detected: </strong>
            {hndlAtRisk && (
              <span>
                Long-lived data may be at risk from &ldquo;Harvest Now, Decrypt Later&rdquo;
                attacks.{' '}
              </span>
            )}
            {hnflAtRisk && (
              <span>
                Signing credentials that expire past the quantum threat window are at risk.
              </span>
            )}
          </div>
        )}
      </div>

      {/* ─── Page 2: Financial Case & Next Steps ─── */}
      <div
        style={{
          fontFamily: 'system-ui, sans-serif',
          color: '#111',
          fontSize: '11pt',
          breakBefore: 'page',
          paddingTop: '16pt',
        }}
      >
        <h2
          style={{
            fontSize: '14pt',
            fontWeight: 700,
            marginBottom: '12pt',
            color: '#1d4ed8',
            borderBottom: '1px solid #e5e7eb',
            paddingBottom: '6pt',
          }}
        >
          Financial Case &amp; Compliance Obligations
        </h2>

        {/* ROI table */}
        {roiSummary && (
          <div style={{ marginBottom: '20pt' }}>
            <h3
              style={{ fontSize: '11pt', fontWeight: 700, marginBottom: '8pt', color: '#374151' }}
            >
              Migration ROI Summary
            </h3>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '10pt',
              }}
            >
              <tbody>
                {[
                  ['Migration Budget', formatUSD(roiSummary.migrationCost)],
                  ['Avoided Breach Cost', formatUSD(roiSummary.avoidedBreachCost)],
                  ['Compliance Savings', formatUSD(roiSummary.complianceSavings)],
                  [
                    'Net ROI',
                    `${roiSummary.netRoiPercent >= 0 ? '+' : ''}${roiSummary.netRoiPercent.toFixed(0)}%`,
                  ],
                  [
                    'Payback Period',
                    isFinite(roiSummary.paybackMonths)
                      ? `${Math.ceil(roiSummary.paybackMonths)} months`
                      : 'N/A',
                  ],
                ].map(([label, value], i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#f9fafb' : '#fff' }}>
                    <td style={{ padding: '5pt 10pt', color: '#6b7280' }}>{label}</td>
                    <td
                      style={{
                        padding: '5pt 10pt',
                        fontWeight: 600,
                        color: '#111',
                        textAlign: 'right',
                      }}
                    >
                      {value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Compliance obligations */}
        {mandatedFrameworks.length > 0 && (
          <div style={{ marginBottom: '20pt' }}>
            <h3
              style={{ fontSize: '11pt', fontWeight: 700, marginBottom: '8pt', color: '#374151' }}
            >
              Regulatory Obligations Requiring PQC
            </h3>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '9.5pt',
              }}
            >
              <thead>
                <tr style={{ background: '#f3f4f6' }}>
                  <th
                    style={{
                      padding: '5pt 10pt',
                      textAlign: 'left',
                      fontWeight: 600,
                      color: '#374151',
                    }}
                  >
                    Framework
                  </th>
                  <th
                    style={{
                      padding: '5pt 10pt',
                      textAlign: 'left',
                      fontWeight: 600,
                      color: '#374151',
                    }}
                  >
                    Deadline
                  </th>
                  <th
                    style={{
                      padding: '5pt 10pt',
                      textAlign: 'left',
                      fontWeight: 600,
                      color: '#374151',
                    }}
                  >
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody>
                {mandatedFrameworks.map((impact, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                    <td style={{ padding: '4pt 10pt', color: '#374151' }}>{impact.framework}</td>
                    <td style={{ padding: '4pt 10pt', color: '#374151' }}>{impact.deadline}</td>
                    <td style={{ padding: '4pt 10pt', color: '#6b7280', fontSize: '8.5pt' }}>
                      {impact.notes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Key findings */}
        {result.keyFindings && result.keyFindings.length > 0 && (
          <div style={{ marginBottom: '16pt' }}>
            <h3
              style={{ fontSize: '11pt', fontWeight: 700, marginBottom: '8pt', color: '#374151' }}
            >
              Key Findings
            </h3>
            <ul style={{ margin: 0, paddingLeft: '16pt' }}>
              {result.keyFindings.map((finding, i) => (
                <li key={i} style={{ fontSize: '9.5pt', color: '#374151', marginBottom: '3pt' }}>
                  {finding}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            borderTop: '1px solid #e5e7eb',
            paddingTop: '8pt',
            marginTop: '24pt',
            fontSize: '8pt',
            color: '#9ca3af',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <span>pqctoday.com/assess</span>
          <span>Generated {formattedDate}</span>
        </div>
      </div>
    </div>
  )
}
