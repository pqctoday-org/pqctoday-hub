// SPDX-License-Identifier: GPL-3.0-only
import { useNavigate } from 'react-router-dom'
import { Truck, AlertTriangle, ExternalLink, CheckCircle2, AlertCircle, Circle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { ArtifactCard, ArtifactPlaceholder } from '../ArtifactCard'
import {
  PILLAR_ARTIFACT_TYPES,
  PILLAR_SOURCE_MODULES,
  type BusinessMetrics,
  type InfraLayerCoverage,
} from '../hooks/useBusinessMetrics'
import type { SectionArtifactCallbacks } from './RiskManagementSection'

const DEPENDENCY_LABELS: Record<string, { label: string; color: string }> = {
  'heavy-vendor': { label: 'Heavy Vendor', color: 'text-status-error bg-status-error/15' },
  mixed: { label: 'Mixed', color: 'text-status-warning bg-status-warning/15' },
  'open-source': { label: 'Open Source', color: 'text-status-success bg-status-success/15' },
  'in-house': { label: 'In-House', color: 'text-status-success bg-status-success/15' },
}

function LayerDot({ coverage }: { coverage: InfraLayerCoverage }) {
  const Icon =
    coverage.status === 'covered' ? CheckCircle2 : coverage.status === 'gap' ? AlertCircle : Circle

  const color =
    coverage.status === 'covered'
      ? 'text-status-success'
      : coverage.status === 'gap'
        ? 'text-status-warning'
        : 'text-muted-foreground/40'

  return (
    <div className="flex flex-col items-center gap-1">
      <Icon size={16} className={color} />
      <span className="text-xs text-muted-foreground truncate max-w-16 text-center">
        {coverage.layer}
      </span>
      {coverage.productCount > 0 && (
        <span className="text-xs font-medium text-foreground">{coverage.productCount}</span>
      )}
    </div>
  )
}

function FipsBadge({ label, count, color }: { label: string; count: number; color: string }) {
  if (count === 0) return null
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded ${color}`}>
      {count} {label}
    </span>
  )
}

export function VendorSupplyChainSection({
  metrics,
  onViewArtifact,
  onEditArtifact,
  onDeleteArtifact,
}: { metrics: BusinessMetrics } & SectionArtifactCallbacks) {
  const navigate = useNavigate()
  const hasVendorData =
    metrics.vendorDependency !== '' ||
    metrics.vendorUnknown ||
    metrics.assessmentStatus !== 'not-started'
  const hasAssessedLayers = metrics.infraLayerCoverage.some((lc) => lc.assessed)
  const depInfo = DEPENDENCY_LABELS[metrics.vendorDependency]
  const artifacts = metrics.artifactsByPillar.vendor
  const pillarTypes = PILLAR_ARTIFACT_TYPES.vendor
  const sourceModules = PILLAR_SOURCE_MODULES.vendor
  const existingTypes = new Set(artifacts.map((a) => a.type))

  const hasAnyContent =
    hasVendorData ||
    metrics.vendorModuleProgress.status !== 'not-started' ||
    metrics.bookmarkedProducts.length > 0 ||
    artifacts.length > 0 ||
    hasAssessedLayers

  if (!hasAnyContent) {
    return (
      <div className="glass-panel p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground mb-4">
          <Truck size={20} className="text-primary" />
          Vendor & Migration
        </h2>
        <EmptyState
          icon={<Truck size={32} />}
          title="Vendor risk not assessed"
          description="Complete your assessment, vendor risk module, and bookmark migration products to track supply chain posture."
          action={{ label: 'Start Assessment', onClick: () => navigate('/assess') }}
        />
      </div>
    )
  }

  return (
    <div className="glass-panel p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Truck size={20} className="text-primary" />
          Vendor & Migration
        </h2>
        <div className="flex items-center gap-2">
          {metrics.uniqueVendorCount > 0 && (
            <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {metrics.uniqueVendorCount} vendor{metrics.uniqueVendorCount !== 1 ? 's' : ''}
            </span>
          )}
          {metrics.bookmarkedProducts.length > 0 && (
            <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {metrics.bookmarkedProducts.length} product
              {metrics.bookmarkedProducts.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column: Vendor posture + infra coverage */}
        <div className="space-y-4">
          {/* Vendor dependency posture */}
          {metrics.vendorUnknown ? (
            <div className="p-2 rounded-md bg-status-warning/10 border border-status-warning/20 flex items-center gap-2">
              <AlertTriangle size={14} className="text-status-warning shrink-0" />
              <p className="text-xs text-status-warning">
                Vendor dependency model not known — assessment used conservative defaults
              </p>
            </div>
          ) : depInfo ? (
            <div>
              <span className="text-xs text-muted-foreground">Vendor Dependency</span>
              <div className="mt-1">
                <span className={`text-sm font-medium px-2 py-0.5 rounded ${depInfo.color}`}>
                  {depInfo.label}
                </span>
              </div>
            </div>
          ) : null}

          {/* Infrastructure layer coverage */}
          {(metrics.bookmarkedProducts.length > 0 || hasAssessedLayers) && (
            <div>
              <span className="text-xs text-muted-foreground mb-2 block">
                Infrastructure Coverage
              </span>
              <div className="flex items-start justify-between gap-2">
                {metrics.infraLayerCoverage.map((lc) => (
                  <LayerDot key={lc.layer} coverage={lc} />
                ))}
              </div>
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CheckCircle2 size={10} className="text-status-success" /> Covered
                </span>
                <span className="flex items-center gap-1">
                  <AlertCircle size={10} className="text-status-warning" /> Gap
                </span>
                <span className="flex items-center gap-1">
                  <Circle size={10} className="text-muted-foreground/40" /> N/A
                </span>
              </div>
            </div>
          )}

          {/* FIPS breakdown */}
          {metrics.bookmarkedProducts.length > 0 && (
            <div>
              <span className="text-xs text-muted-foreground mb-2 block">FIPS Readiness</span>
              <div className="flex flex-wrap gap-2">
                <FipsBadge
                  label="Validated"
                  count={metrics.fipsBreakdown.validated}
                  color="bg-status-success/15 text-status-success"
                />
                <FipsBadge
                  label="Partial"
                  count={metrics.fipsBreakdown.partial}
                  color="bg-status-warning/15 text-status-warning"
                />
                <FipsBadge
                  label="No FIPS"
                  count={metrics.fipsBreakdown.none}
                  color="bg-muted text-muted-foreground"
                />
              </div>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="self-start"
            onClick={() => navigate('/migrate')}
          >
            Browse Catalog
            <ExternalLink size={12} className="ml-1" />
          </Button>
        </div>

        {/* Right column: Vendor & migration artifacts */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Artifacts
          </h3>
          <div className="space-y-1.5">
            {artifacts.map((doc) => (
              <ArtifactCard
                key={doc.id}
                document={doc}
                pillar="vendor"
                onView={onViewArtifact}
                onEdit={onEditArtifact}
                onDelete={onDeleteArtifact}
              />
            ))}
            {pillarTypes
              .filter((t) => !existingTypes.has(t))
              .map((type) => (
                <ArtifactPlaceholder
                  key={type}
                  type={type}
                  moduleId={sourceModules[type] ?? 'vendor-risk'} // eslint-disable-line security/detect-object-injection
                  pillar="vendor"
                  onNavigate={navigate}
                />
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}
