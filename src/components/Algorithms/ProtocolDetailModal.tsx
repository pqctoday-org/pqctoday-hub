// SPDX-License-Identifier: GPL-3.0-only
import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  ExternalLink,
  FileText,
  FlaskConical,
  GitBranch,
  Rocket,
  AlertTriangle,
  Globe2,
} from 'lucide-react'
import {
  PROTOCOL_MATRIX,
  type DeploymentPosture,
  type DimensionStatus,
  type DimensionStatusValue,
  type LiveDeployment,
  type OssLibrary,
  type PlaygroundTool,
  type ProtocolDoc,
  type ProtocolMatrixRow,
  type TestabilityValue,
} from '../../data/pqcProtocolMatrix'
import { Button } from '@/components/ui/button'
import { useIsEmbedded } from '../../embed/EmbedProvider'
import { useModalPosition } from '../../hooks/useModalPosition'

interface ProtocolDetailModalProps {
  isOpen: boolean
  onClose: () => void
  protocol: ProtocolMatrixRow | null
}

function dimensionLabel(value: DimensionStatusValue): string {
  switch (value) {
    case 'rfc':
      return '✓ RFC'
    case 'draft':
      return '⊳ Draft'
    case 'experimental':
      return '⚠ Experimental'
    case 'none':
      return '✗ None'
    case 'na':
      return '— N/A'
  }
}

function dimensionTone(value: DimensionStatusValue): string {
  switch (value) {
    case 'rfc':
      return 'bg-status-success/15 text-status-success border-status-success/30'
    case 'draft':
      return 'bg-primary/15 text-primary border-primary/30'
    case 'experimental':
      return 'bg-status-warning/15 text-status-warning border-status-warning/30'
    case 'none':
      return 'bg-status-error/10 text-status-error border-status-error/30'
    case 'na':
      return 'bg-muted text-muted-foreground border-border'
  }
}

function deploymentPostureClass(posture: DeploymentPosture): string {
  switch (posture) {
    case 'production':
      return 'bg-status-success/20 text-status-success border-status-success/40'
    case 'pilot':
      return 'bg-status-warning/20 text-status-warning border-status-warning/40'
    case 'experimental':
      return 'bg-muted text-muted-foreground border-border'
  }
}

function testabilityLabel(value: TestabilityValue): string {
  switch (value) {
    case 'full':
      return 'Full'
    case 'partial':
      return 'Partial'
    case 'none':
      return 'No'
    case 'na':
      return 'N/A'
  }
}

function testabilityTone(value: TestabilityValue): string {
  switch (value) {
    case 'full':
      return 'text-status-success'
    case 'partial':
      return 'text-status-warning'
    case 'none':
      return 'text-status-error'
    case 'na':
      return 'text-muted-foreground'
  }
}

interface DimensionPanelProps {
  label: string
  status: DimensionStatus
}

function DimensionPanel({ label, status }: DimensionPanelProps) {
  return (
    <div className="rounded-md border border-border bg-card/50 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <span
          className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${dimensionTone(
            status.value
          )}`}
        >
          {dimensionLabel(status.value)}
        </span>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{status.note}</p>
      {status.deploymentPosture && (
        <div className="mt-2 flex items-start gap-1.5 rounded-md border border-border bg-muted/30 px-2 py-1.5">
          <span
            className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0 text-[10px] font-medium ${deploymentPostureClass(
              status.deploymentPosture
            )}`}
          >
            <Rocket size={9} />
            {status.deploymentPosture === 'production'
              ? 'Production'
              : status.deploymentPosture === 'pilot'
                ? 'Pilot'
                : 'Experimental'}
          </span>
          {status.deploymentNote && (
            <span className="text-[10px] leading-tight text-muted-foreground">
              {status.deploymentNote}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

function DocCard({ doc, label }: { doc: ProtocolDoc; label: string }) {
  return (
    <a
      href={doc.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start gap-2 rounded-md border border-border bg-card/50 p-2.5 transition-colors hover:border-primary/30 hover:bg-primary/5"
      title={`${label}: ${doc.title}`}
    >
      <FileText size={14} className="mt-0.5 shrink-0 text-primary" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 text-xs font-medium text-foreground group-hover:text-primary">
          <span className="truncate">{doc.id}</span>
          <ExternalLink size={10} className="shrink-0 opacity-60" />
        </div>
        <div className="text-[10px] leading-tight text-muted-foreground line-clamp-2">
          {doc.title}
        </div>
        <div className="text-[10px] leading-tight text-muted-foreground mt-0.5">{doc.date}</div>
      </div>
    </a>
  )
}

function LibraryRow({ lib, tone }: { lib: OssLibrary; tone: 'oss' | 'commercial' }) {
  const toneClass =
    tone === 'oss'
      ? 'border-primary/20 hover:border-primary/40 bg-primary/5 hover:bg-primary/10'
      : 'border-accent/20 hover:border-accent/40 bg-accent/5 hover:bg-accent/10'
  return (
    <Link
      to={`/migrate?software=${encodeURIComponent(lib.productId)}`}
      className={`group flex items-center justify-between gap-2 rounded-md border px-3 py-2 transition-colors ${toneClass}`}
    >
      <div className="flex flex-col min-w-0">
        <span className="text-sm font-medium text-foreground truncate">{lib.name}</span>
        {lib.versionNote && (
          <span className="text-[10px] leading-tight text-muted-foreground truncate">
            {lib.versionNote}
          </span>
        )}
      </div>
      <ExternalLink size={11} className="shrink-0 opacity-40 group-hover:opacity-80" />
    </Link>
  )
}

function DeploymentRow({ deployment }: { deployment: LiveDeployment }) {
  return (
    <a
      href={deployment.referenceUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start justify-between gap-2 rounded-md border border-status-success/20 bg-status-success/5 px-3 py-2 transition-colors hover:border-status-success/40 hover:bg-status-success/10"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <Globe2 size={12} className="shrink-0 text-status-success" />
          <span className="text-sm font-semibold text-foreground truncate">
            {deployment.provider}
          </span>
          {deployment.since && (
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
              since {deployment.since}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground line-clamp-3">
          {deployment.what}
        </p>
      </div>
      <ExternalLink
        size={11}
        className="mt-0.5 shrink-0 opacity-40 group-hover:opacity-80"
        aria-label="Open reference"
      />
    </a>
  )
}

function PlaygroundCard({ tool }: { tool: PlaygroundTool }) {
  return (
    <Link
      to={`/playground/${tool.toolId}`}
      className="block rounded-md border border-primary/30 bg-primary/10 p-3 transition-colors hover:border-primary/50 hover:bg-primary/20"
    >
      <div className="mb-1.5 flex items-center gap-2">
        <FlaskConical size={14} className="text-primary" />
        <span className="text-sm font-semibold text-primary">{tool.toolName}</span>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px]">
        <span className="text-muted-foreground">
          pKEM:{' '}
          <span className={testabilityTone(tool.testability.pureKem)}>
            {testabilityLabel(tool.testability.pureKem)}
          </span>
        </span>
        <span className="text-muted-foreground">
          hKEM:{' '}
          <span className={testabilityTone(tool.testability.hybridKem)}>
            {testabilityLabel(tool.testability.hybridKem)}
          </span>
        </span>
        <span className="text-muted-foreground">
          pSig:{' '}
          <span className={testabilityTone(tool.testability.pureSig)}>
            {testabilityLabel(tool.testability.pureSig)}
          </span>
        </span>
        <span className="text-muted-foreground">
          hSig:{' '}
          <span className={testabilityTone(tool.testability.hybridSig)}>
            {testabilityLabel(tool.testability.hybridSig)}
          </span>
        </span>
      </div>
    </Link>
  )
}

export function ProtocolDetailModal({ isOpen, onClose, protocol }: ProtocolDetailModalProps) {
  const isEmbedded = useIsEmbedded()
  const positionStyle = useModalPosition(isEmbedded)

  const parent = useMemo(
    () =>
      protocol?.inheritsFromProtocolId
        ? PROTOCOL_MATRIX.find((r) => r.id === protocol.inheritsFromProtocolId)
        : undefined,
    [protocol]
  )

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && protocol && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 embed-backdrop bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`glass-panel p-6 max-w-5xl w-full max-h-[88dvh] overflow-y-auto z-50 ${
              isEmbedded ? '' : 'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'
            }`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="protocol-detail-modal-title"
            style={{ ...positionStyle, zIndex: 50 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="mb-5 flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2
                    id="protocol-detail-modal-title"
                    className="text-2xl font-bold text-foreground"
                  >
                    {protocol.name}
                  </h2>
                  {parent && (
                    <span className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground">
                      <GitBranch size={11} />
                      inherits from{' '}
                      <span className="font-medium text-foreground">{parent.name}</span>
                    </span>
                  )}
                  {protocol.inheritedBy && protocol.inheritedBy.length > 0 && (
                    <span
                      className="inline-flex items-center gap-1 rounded-md border border-accent/30 bg-accent/10 px-2 py-0.5 text-[11px] text-accent"
                      title={`Same PQC posture also covers: ${protocol.inheritedBy.join(', ')}`}
                    >
                      <GitBranch size={11} />
                      inherited by: {protocol.inheritedBy.join(', ')}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{protocol.description}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                aria-label="Close protocol details"
              >
                <X size={20} />
              </Button>
            </div>

            {/* Standardization dimensions */}
            <section className="mb-6">
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Standardization status
              </h3>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <DimensionPanel label="Pure KEM" status={protocol.dimensions.pureKem} />
                <DimensionPanel label="Hybrid KEM" status={protocol.dimensions.hybridKem} />
                <DimensionPanel label="Pure Signature" status={protocol.dimensions.pureSig} />
                <DimensionPanel label="Hybrid Signature" status={protocol.dimensions.hybridSig} />
              </div>
            </section>

            {/* Documents */}
            <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Latest releases ({protocol.latestRelease.length})
                </h3>
                {protocol.latestRelease.length === 0 ? (
                  <div className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                    <AlertTriangle size={12} /> None
                  </div>
                ) : (
                  <div className="space-y-2">
                    {protocol.latestRelease.map((d) => (
                      <DocCard key={d.id} doc={d} label="Release" />
                    ))}
                  </div>
                )}
              </div>
              <div>
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Latest drafts ({protocol.latestDraft.length})
                </h3>
                {protocol.latestDraft.length === 0 ? (
                  <div className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                    <AlertTriangle size={12} /> None
                  </div>
                ) : (
                  <div className="space-y-2">
                    {protocol.latestDraft.map((d) => (
                      <DocCard key={d.id} doc={d} label="Draft" />
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Implementations */}
            <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Open source ({protocol.ossLibraries.length})
                </h3>
                {protocol.ossLibraries.length === 0 ? (
                  <div className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                    <AlertTriangle size={12} /> None chipped
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {protocol.ossLibraries.map((lib) => (
                      <LibraryRow key={lib.productId} lib={lib} tone="oss" />
                    ))}
                  </div>
                )}
              </div>
              <div>
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Commercial ({protocol.commercialLibraries.length})
                </h3>
                {protocol.commercialLibraries.length === 0 ? (
                  <div className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                    <AlertTriangle size={12} /> None chipped
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {protocol.commercialLibraries.map((lib) => (
                      <LibraryRow key={lib.productId} lib={lib} tone="commercial" />
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Live deployments */}
            <section className="mb-6">
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Live deployments ({protocol.liveDeployments?.length ?? 0})
              </h3>
              {!protocol.liveDeployments || protocol.liveDeployments.length === 0 ? (
                <div className="flex flex-col gap-2 rounded-md border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                  <div className="inline-flex items-center gap-1.5">
                    <Globe2 size={12} className="shrink-0" /> No known production deployment
                    {parent && (
                      <span className="ml-1">
                        — see <span className="font-medium text-foreground">{parent.name}</span> for
                        inherited deployments
                      </span>
                    )}
                  </div>
                  {protocol.noDeploymentReason && (
                    <p className="leading-relaxed text-muted-foreground/90">
                      {protocol.noDeploymentReason}
                    </p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  {protocol.liveDeployments.map((d, idx) => (
                    <DeploymentRow key={`${d.provider}-${idx}`} deployment={d} />
                  ))}
                </div>
              )}
            </section>

            {/* Playgrounds */}
            <section>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Playground tools ({protocol.playgrounds.length})
              </h3>
              {protocol.playgrounds.length === 0 ? (
                <div className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                  <AlertTriangle size={12} /> No in-browser playground for this protocol
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  {protocol.playgrounds.map((tool) => (
                    <PlaygroundCard key={tool.toolId} tool={tool} />
                  ))}
                </div>
              )}
            </section>

            {/* Footer */}
            <div className="mt-6 pt-3 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Press Esc or click outside to close</span>
              <span>Protocol id: {protocol.id}</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
