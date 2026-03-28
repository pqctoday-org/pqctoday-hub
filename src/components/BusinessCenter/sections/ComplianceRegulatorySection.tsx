// SPDX-License-Identifier: GPL-3.0-only
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { ArtifactCard, ArtifactPlaceholder } from '../ArtifactCard'
import {
  PILLAR_ARTIFACT_TYPES,
  PILLAR_SOURCE_MODULES,
  type BusinessMetrics,
  type TrackedFramework,
} from '../hooks/useBusinessMetrics'
import type { SectionArtifactCallbacks } from './RiskManagementSection'

const URGENCY_STYLES: Record<string, string> = {
  critical: 'bg-status-error/15 text-status-error border-status-error/30',
  warning: 'bg-status-warning/15 text-status-warning border-status-warning/30',
  safe: 'bg-status-success/15 text-status-success border-status-success/30',
  unknown: 'bg-muted text-muted-foreground border-border',
}

function FrameworkRow({ framework }: { framework: TrackedFramework }) {
  const style = URGENCY_STYLES[framework.urgency] ?? URGENCY_STYLES.unknown

  const deadlineLabel =
    framework.daysUntilDeadline !== null
      ? framework.daysUntilDeadline > 0
        ? `${Math.floor(framework.daysUntilDeadline / 365)}y ${Math.floor((framework.daysUntilDeadline % 365) / 30)}m`
        : 'Overdue'
      : framework.deadline || 'TBD'

  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-foreground truncate block">
          {framework.label}
        </span>
        {framework.requiresPQC && (
          <span className="text-xs text-muted-foreground">PQC required</span>
        )}
      </div>
      <div className={`px-2 py-0.5 rounded text-xs font-medium border ${style}`}>
        {deadlineLabel}
      </div>
    </div>
  )
}

export function ComplianceRegulatorySection({
  metrics,
  onViewArtifact,
  onEditArtifact,
  onDeleteArtifact,
  onRenameArtifact,
  typeFilter,
}: { metrics: BusinessMetrics } & SectionArtifactCallbacks) {
  const navigate = useNavigate()
  const allArtifacts = metrics.artifactsByPillar.compliance
  const artifacts = typeFilter && typeFilter !== 'all'
    ? allArtifacts.filter((d) => d.type === typeFilter)
    : allArtifacts
  const pillarTypes = PILLAR_ARTIFACT_TYPES.compliance
  const sourceModules = PILLAR_SOURCE_MODULES.compliance
  const existingTypes = new Set(artifacts.map((a) => a.type))

  return (
    <div className="glass-panel p-6 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <ShieldCheck size={20} className="text-primary" />
          Compliance & Regulatory
        </h2>
        {metrics.trackedFrameworks.length > 0 && (
          <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            {metrics.trackedFrameworks.length} tracked
          </span>
        )}
      </div>

      {metrics.trackedFrameworks.length === 0 && artifacts.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck size={32} />}
          title="No compliance frameworks selected"
          description="Track regulatory deadlines relevant to your industry and geography."
          action={{ label: 'Explore Frameworks', onClick: () => navigate('/compliance') }}
        />
      ) : (
        <>
          {metrics.complianceGapCount > 0 && (
            <div className="mb-3 p-2 rounded-md bg-status-warning/10 border border-status-warning/20">
              <p className="text-xs text-status-warning">
                {metrics.complianceGapCount} framework{metrics.complianceGapCount > 1 ? 's' : ''}{' '}
                require PQC but migration hasn&apos;t started
              </p>
            </div>
          )}

          {metrics.trackedFrameworks.length > 0 && (
            <div className="flex-1 overflow-y-auto max-h-48 space-y-0 mb-4">
              {metrics.trackedFrameworks.slice(0, 6).map((fw) => (
                <FrameworkRow key={fw.id} framework={fw} />
              ))}
              {metrics.trackedFrameworks.length > 6 && (
                <p className="text-xs text-muted-foreground pt-2 text-center">
                  +{metrics.trackedFrameworks.length - 6} more
                </p>
              )}
            </div>
          )}

          {/* Compliance artifacts */}
          <div className="border-t border-border pt-3 mt-auto">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Artifacts
            </h3>
            <div className="space-y-1.5">
              {artifacts.map((doc) => (
                <ArtifactCard
                  key={doc.id}
                  document={doc}
                  pillar="compliance"
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
                    moduleId={sourceModules[type] ?? 'compliance-strategy'} // eslint-disable-line security/detect-object-injection
                    pillar="compliance"
                    onNavigate={navigate}
                  />
                ))}
            </div>
          </div>

          {metrics.trackedFrameworks.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-3 self-start"
              onClick={() => navigate('/compliance')}
            >
              View All Frameworks
              <ExternalLink size={12} className="ml-1" />
            </Button>
          )}
        </>
      )}
    </div>
  )
}
