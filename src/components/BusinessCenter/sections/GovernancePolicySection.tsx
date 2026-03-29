// SPDX-License-Identifier: GPL-3.0-only
import { useNavigate } from 'react-router-dom'
import { Scale, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { ArtifactCard, ArtifactPlaceholder } from '../ArtifactCard'
import {
  PILLAR_ARTIFACT_TYPES,
  PILLAR_SOURCE_MODULES,
  type BusinessMetrics,
} from '../hooks/useBusinessMetrics'
import type { SectionArtifactCallbacks } from './RiskManagementSection'

function PostureIndicator({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground capitalize">{value.replace(/-/g, ' ')}</span>
    </div>
  )
}

export function GovernancePolicySection({
  metrics,
  onViewArtifact,
  onEditArtifact,
  onDeleteArtifact,
  onRenameArtifact,
  typeFilter,
}: { metrics: BusinessMetrics } & SectionArtifactCallbacks) {
  const navigate = useNavigate()
  const allArtifacts = metrics.artifactsByPillar.governance
  const artifacts = typeFilter && typeFilter !== 'all'
    ? allArtifacts.filter((d) => d.type === typeFilter)
    : allArtifacts
  const pillarTypes = PILLAR_ARTIFACT_TYPES.governance
  const sourceModules = PILLAR_SOURCE_MODULES.governance
  const existingTypes = new Set(artifacts.map((a) => a.type))
  const hasPosture = metrics.cryptoAgility !== 'Not assessed'
  const hasArtifacts = artifacts.length > 0
  const allNotStarted = metrics.governanceModules.every((m) => m.status === 'not-started')

  return (
    <div className="glass-panel p-6 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Scale size={20} className="text-primary" />
          Governance & Policy
        </h2>
        {hasArtifacts && (
          <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            {artifacts.length} artifact{artifacts.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {allNotStarted && !hasPosture && !hasArtifacts ? (
        <EmptyState
          icon={<Scale size={32} />}
          title="No governance modules started"
          description="Build RACI matrices, policies, and KPI dashboards for your PQC program."
          action={{ label: 'Start Governance', onClick: () => navigate('/learn/pqc-governance') }}
        />
      ) : (
        <>
          {/* Posture summary from assessment data */}
          {hasPosture && (
            <div className="space-y-1.5 mb-4 pb-3 border-b border-border">
              <PostureIndicator label="Crypto Agility" value={metrics.cryptoAgility} />
              <PostureIndicator label="Migration Status" value={metrics.migrationStatus} />
            </div>
          )}

          {/* Governance artifacts */}
          <div className={hasPosture ? '' : 'flex-1'}>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Artifacts
            </h3>
            <div className="space-y-1.5">
              {artifacts.map((doc) => (
                <ArtifactCard
                  key={doc.id}
                  document={doc}
                  pillar="governance"
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
                    moduleId={sourceModules[type] ?? 'pqc-governance'} // eslint-disable-line security/detect-object-injection
                    pillar="governance"
                    onNavigate={navigate}
                  />
                ))}
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="mt-3 self-start"
            onClick={() => {
              const first = metrics.governanceModules.find((m) => m.status !== 'completed')
              navigate(first ? `/learn/${first.id}` : '/learn/pqc-governance')
            }}
          >
            {allNotStarted ? 'Start Governance' : 'Continue Learning'}
            <ExternalLink size={12} className="ml-1" />
          </Button>
        </>
      )}
    </div>
  )
}
