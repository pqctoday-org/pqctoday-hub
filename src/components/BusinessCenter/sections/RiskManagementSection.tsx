// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldAlert, TrendingUp, TrendingDown, Minus, FileBarChart, RefreshCw } from 'lucide-react'
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { HNDLHNFLSection } from '@/components/shared/HNDLHNFLSection'
import { ROICalculatorSection } from '@/components/shared/ROICalculatorSection'
import type { ROISummary } from '@/components/shared/ROICalculatorSection'
import { ArtifactCard, ArtifactPlaceholder } from '../ArtifactCard'
import {
  PILLAR_ARTIFACT_TYPES,
  PILLAR_SOURCE_MODULES,
  type BusinessMetrics,
} from '../hooks/useBusinessMetrics'
import type { ExecutiveDocument } from '@/services/storage/types'

const RISK_COLORS: Record<string, string> = {
  low: 'text-status-success',
  medium: 'text-status-warning',
  high: 'text-status-error',
  critical: 'text-status-error',
}

const RISK_BG: Record<string, string> = {
  low: 'bg-status-success/15',
  medium: 'bg-status-warning/15',
  high: 'bg-status-error/15',
  critical: 'bg-status-error/15',
}

const CATEGORY_LABELS: Record<string, string> = {
  quantumExposure: 'Quantum Exposure',
  migrationComplexity: 'Migration Complexity',
  regulatoryPressure: 'Regulatory Pressure',
  organizationalReadiness: 'Org Readiness',
}

function RiskGauge({ score, level }: { score: number; level: string }) {
  const colorClass = RISK_COLORS[level] ?? 'text-muted-foreground' // eslint-disable-line security/detect-object-injection
  const bgClass = RISK_BG[level] ?? 'bg-muted' // eslint-disable-line security/detect-object-injection

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`w-24 h-24 rounded-full flex items-center justify-center border-4 ${bgClass} border-current ${colorClass}`}
      >
        <span className={`text-3xl font-bold ${colorClass}`}>{score}</span>
      </div>
      <span className={`text-xs font-medium uppercase tracking-wide ${colorClass}`}>{level}</span>
    </div>
  )
}

function DeltaIndicator({ current, previous }: { current: number; previous: number | null }) {
  if (previous === null) return null
  const delta = current - previous
  if (delta === 0) return <Minus size={14} className="text-muted-foreground" />
  if (delta < 0)
    return (
      <span className="flex items-center gap-1 text-xs text-status-success">
        <TrendingDown size={14} />
        {Math.abs(delta)} pts
      </span>
    )
  return (
    <span className="flex items-center gap-1 text-xs text-status-error">
      <TrendingUp size={14} />+{delta} pts
    </span>
  )
}

function TrendSparkline({ data }: { data: { completedAt: string; riskScore: number }[] }) {
  if (data.length < 2) return null

  const chartData = data.map((d) => ({
    date: new Date(d.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    score: d.riskScore,
  }))

  return (
    <div className="w-32 h-12">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Tooltip
            contentStyle={{
              fontSize: '11px',
              padding: '4px 8px',
              borderRadius: '6px',
              border: '1px solid hsl(var(--border))',
              background: 'hsl(var(--card))',
              color: 'hsl(var(--foreground))',
            }}
            formatter={(value: number | undefined) => [`${value ?? 0}`, 'Risk']}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function CategoryBar({ label, score }: { label: string; score: number }) {
  const color =
    score >= 70 ? 'bg-status-error' : score >= 40 ? 'bg-status-warning' : 'bg-status-success'

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-36 shrink-0 text-right">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-medium text-foreground w-8 text-right">{score}</span>
    </div>
  )
}

export interface SectionArtifactCallbacks {
  onViewArtifact: (doc: ExecutiveDocument) => void
  onEditArtifact: (doc: ExecutiveDocument) => void
  onDeleteArtifact: (doc: ExecutiveDocument) => void
  onRenameArtifact?: (id: string, newTitle: string) => void
  typeFilter?: string
}

export function RiskManagementSection({
  metrics,
  onViewArtifact,
  onEditArtifact,
  onDeleteArtifact,
  onRenameArtifact,
  typeFilter,
}: { metrics: BusinessMetrics } & SectionArtifactCallbacks) {
  const navigate = useNavigate()
  const [, setRoiSummary] = useState<ROISummary | null>(null)

  if (metrics.assessmentStatus === 'not-started') {
    return (
      <div className="glass-panel p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground mb-4">
          <ShieldAlert size={20} className="text-primary" />
          Risk Management
        </h2>
        <EmptyState
          icon={<ShieldAlert size={32} />}
          title="No risk assessment completed"
          description="Run your PQC risk assessment to see risk scores, HNDL/HNFL analysis, ROI modeling, and artifact management."
          action={{ label: 'Start Assessment', onClick: () => navigate('/assess') }}
        />
      </div>
    )
  }

  const allArtifacts = metrics.artifactsByPillar.risk
  const artifacts = typeFilter && typeFilter !== 'all'
    ? allArtifacts.filter((d) => d.type === typeFilter)
    : allArtifacts
  const pillarTypes = PILLAR_ARTIFACT_TYPES.risk
  const sourceModules = PILLAR_SOURCE_MODULES.risk
  const existingTypes = new Set(artifacts.map((a) => a.type))

  return (
    <div className="space-y-4">
      {/* Risk overview card */}
      <div className="glass-panel p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <ShieldAlert size={20} className="text-primary" />
            Risk Management
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/assess')}>
              <RefreshCw size={14} className="mr-1" />
              Re-Assess
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/report')}>
              <FileBarChart size={14} className="mr-1" />
              Full Report
            </Button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="flex flex-col items-center gap-2">
            {metrics.riskScore !== null && metrics.riskLevel && (
              <RiskGauge score={metrics.riskScore} level={metrics.riskLevel} />
            )}
            <DeltaIndicator current={metrics.riskScore ?? 0} previous={metrics.previousRiskScore} />
          </div>

          <div className="flex flex-col items-center gap-1">
            <span className="text-xs text-muted-foreground">Trend</span>
            <TrendSparkline data={metrics.assessmentHistory} />
            {metrics.assessmentHistory.length < 2 && (
              <span className="text-xs text-muted-foreground italic">
                Complete 2+ assessments to see trends
              </span>
            )}
          </div>

          {metrics.categoryScores && (
            <div className="flex-1 space-y-2 w-full">
              {(Object.entries(CATEGORY_LABELS) as [keyof typeof CATEGORY_LABELS, string][]).map(
                ([key, label]) => (
                  <CategoryBar
                    key={key}
                    label={label}
                    score={
                      metrics.categoryScores?.[key as keyof typeof metrics.categoryScores] ?? 0
                    }
                  />
                )
              )}
            </div>
          )}
        </div>
      </div>

      {/* HNDL/HNFL risk windows */}
      {metrics.assessmentResult &&
        (metrics.assessmentResult.hndlRiskWindow || metrics.assessmentResult.hnflRiskWindow) && (
          <HNDLHNFLSection
            hndl={metrics.assessmentResult.hndlRiskWindow}
            hnfl={metrics.assessmentResult.hnflRiskWindow}
            defaultOpen={false}
          />
        )}

      {/* ROI Calculator */}
      {metrics.assessmentResult && (
        <ROICalculatorSection
          result={metrics.assessmentResult}
          industry={metrics.industry}
          defaultOpen={false}
          onSummaryChange={setRoiSummary}
        />
      )}

      {/* Risk artifacts */}
      {(artifacts.length > 0 || metrics.assessmentStatus === 'complete') && (
        <div className="glass-panel p-6">
          <h3 className="text-sm font-semibold text-foreground mb-3">Risk Artifacts</h3>
          <div className="space-y-2">
            {artifacts.map((doc) => (
              <ArtifactCard
                key={doc.id}
                document={doc}
                pillar="risk"
                onView={onViewArtifact}
                onEdit={onEditArtifact}
                onDelete={onDeleteArtifact}
                onRename={onRenameArtifact}
              />
            ))}
            {pillarTypes
              .filter((t) => !existingTypes.has(t))
              .map((type) => (
                <ArtifactPlaceholder
                  key={type}
                  type={type}
                  moduleId={sourceModules[type] ?? 'pqc-risk-management'} // eslint-disable-line security/detect-object-injection
                  pillar="risk"
                  onNavigate={navigate}
                />
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
