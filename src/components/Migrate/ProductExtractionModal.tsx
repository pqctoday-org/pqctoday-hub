// SPDX-License-Identifier: GPL-3.0-only
import { X, Sparkles } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useEffect, useRef } from 'react'
import FocusLock from 'react-focus-lock'
import clsx from 'clsx'
import type { ProductExtraction } from '../../data/productExtractionData'
import type { LibraryEnrichment } from '../../data/libraryEnrichmentData'
import { AskAssistantButton } from '../ui/AskAssistantButton'
import { useIsEmbedded } from '../../embed/EmbedProvider'
import { useModalPosition } from '../../hooks/useModalPosition'
import { Button } from '@/components/ui/button'

interface ProductExtractionModalProps {
  isOpen: boolean
  onClose: () => void
  extraction: ProductExtraction | null
  softwareName: string
  catalogEnrichment?: LibraryEnrichment | null
}

/** Returns true if the value contains real data (not "Not stated", "Unknown", empty, etc.) */
function hasValue(val: string | undefined): boolean {
  if (!val) return false
  const lower = val.toLowerCase().trim()
  return (
    lower !== '' && lower !== 'not stated' && lower !== 'unknown' && !lower.startsWith('not stated')
  )
}

/** Split comma/semicolon-separated values into tags, filtering out empties */
function splitTags(val: string): string[] {
  return val
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean)
}

const TAG_STYLES = {
  primary: 'bg-primary/10 text-primary border border-primary/20',
  destructive: 'bg-destructive/10 text-destructive border border-destructive/20',
  warning: 'bg-status-warning/10 text-status-warning border border-status-warning/20',
  success: 'bg-status-success/10 text-status-success border border-status-success/20',
  default: 'bg-muted/30 text-muted-foreground border border-border',
  info: 'bg-status-info/10 text-status-info border border-status-info/20',
} as const

type TagVariant = keyof typeof TAG_STYLES

function SectionHeader({ title, isFirst = false }: { title: string; isFirst?: boolean }) {
  return (
    <div className={clsx(!isFirst && 'border-t border-border/30 pt-3')}>
      <h4 className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mb-2">
        {title}
      </h4>
    </div>
  )
}

function FieldText({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
        {label}
      </h5>
      <p className="text-sm text-foreground leading-relaxed">{value}</p>
    </div>
  )
}

function FieldTags({
  label,
  items,
  variant = 'default',
}: {
  label: string
  items: string[]
  variant?: TagVariant
}) {
  if (items.length === 0) return null
  return (
    <div>
      <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
        {label}
      </h5>
      <div className="flex flex-wrap gap-1">
        {items.map((item) => (
          <span
            key={item}
            className={clsx(
              'inline-flex items-center px-1.5 py-0.5 rounded text-xs',
              TAG_STYLES[variant]
            )}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

function PqcSupportBadge({ value }: { value: string }) {
  const lower = value.toLowerCase()
  let badgeClass: string
  if (lower.startsWith('yes')) {
    badgeClass = TAG_STYLES.success
  } else if (lower.startsWith('partial') || lower.startsWith('limited')) {
    badgeClass = TAG_STYLES.warning
  } else if (lower.startsWith('planned') || lower.startsWith('in progress')) {
    badgeClass = TAG_STYLES.warning
  } else if (lower.startsWith('no')) {
    badgeClass = TAG_STYLES.destructive
  } else {
    badgeClass = TAG_STYLES.default
  }
  return (
    <span
      className={clsx('inline-flex items-center px-2 py-0.5 rounded text-xs font-bold', badgeClass)}
    >
      {value}
    </span>
  )
}

export const ProductExtractionModal = ({
  isOpen,
  onClose,
  extraction,
  softwareName,
  catalogEnrichment,
}: ProductExtractionModalProps) => {
  const popoverRef = useRef<HTMLDivElement>(null)
  const isEmbedded = useIsEmbedded()
  const positionStyle = useModalPosition(isEmbedded)

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose()
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen || (!extraction && !catalogEnrichment)) return null

  const hasStrategicContext = !!(
    catalogEnrichment &&
    (catalogEnrichment.mainTopic ||
      catalogEnrichment.keyTakeaways.length > 0 ||
      catalogEnrichment.migrationTimeline?.length ||
      catalogEnrichment.leadersContributions.length > 0 ||
      catalogEnrichment.hybridApproaches.length > 0 ||
      catalogEnrichment.securityLevels.length > 0 ||
      catalogEnrichment.targetAudience.length > 0)
  )

  // Determine which sections have content
  const hasCrypto =
    !!extraction &&
    (hasValue(extraction.cryptoPrimitives) ||
      hasValue(extraction.signatureSchemes) ||
      hasValue(extraction.keyManagementModel))

  const hasBlockchain =
    !!extraction &&
    (hasValue(extraction.supportedBlockchains) || hasValue(extraction.consensusMechanism))

  const hasPqc =
    !!extraction &&
    (hasValue(extraction.pqcSupport) ||
      hasValue(extraction.pqcCapabilityDescription) ||
      hasValue(extraction.pqcRoadmapDetails))

  const hasCompliance =
    !!extraction && (hasValue(extraction.regulatoryStatus) || hasValue(extraction.licenseType))

  const hasOverview =
    !!extraction &&
    (hasValue(extraction.productBrief) ||
      hasValue(extraction.architectureType) ||
      hasValue(extraction.infrastructureLayer))

  const content = (
    <>
      {/* Backdrop */}
      <div
        className={`${isEmbedded ? 'absolute' : 'fixed'} inset-0 z-overlay bg-black/60 embed-backdrop`}
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Centering wrapper (non-embedded) */}
      <div
        className={clsx(!isEmbedded && 'fixed inset-0 flex items-center justify-center p-4')}
        style={!isEmbedded ? { zIndex: 9999 } : undefined}
      >
        <FocusLock returnFocus>
          <div
            ref={popoverRef}
            className="w-[95vw] sm:w-[85vw] md:w-[60vw] max-w-[900px] max-h-[85dvh] border border-border rounded-xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col bg-popover text-popover-foreground shadow-2xl"
            style={isEmbedded ? { zIndex: 9999, ...positionStyle } : undefined}
            role="dialog"
            aria-modal="true"
            aria-labelledby="extraction-modal-title"
          >
            {/* Header */}
            <div className="p-4 border-b border-border bg-muted/20 flex justify-between items-start gap-4 flex-shrink-0">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                    <Sparkles size={10} aria-hidden="true" />
                    Extraction
                  </span>
                  {hasValue(extraction?.category) && (
                    <span className="text-xs text-muted-foreground">{extraction?.category}</span>
                  )}
                </div>
                <h3
                  id="extraction-modal-title"
                  className="text-lg font-bold text-foreground leading-tight"
                >
                  {softwareName}
                </h3>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <AskAssistantButton
                  question={`Tell me about ${softwareName}'s PQC capabilities and migration readiness.${extraction?.pqcCapabilityDescription ? ` Current status: ${extraction.pqcCapabilityDescription}` : ''}${extraction?.cryptoPrimitives ? ` Crypto: ${extraction.cryptoPrimitives}` : ''}`}
                />
                <Button
                  variant="ghost"
                  onClick={onClose}
                  aria-label="Close details"
                  className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                >
                  <X size={18} aria-hidden="true" />
                </Button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="p-4 overflow-y-auto space-y-4">
              {/* Overview */}
              {hasOverview && extraction && (
                <div>
                  <SectionHeader title="Overview" isFirst />
                  <div className="space-y-3">
                    {hasValue(extraction.productBrief) && (
                      <FieldText label="Product Brief" value={extraction.productBrief} />
                    )}
                    {hasValue(extraction.architectureType) && (
                      <FieldText label="Architecture" value={extraction.architectureType} />
                    )}
                    {hasValue(extraction.infrastructureLayer) && (
                      <FieldTags
                        label="Infrastructure Layers"
                        items={splitTags(extraction.infrastructureLayer)}
                        variant="info"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Crypto & Key Management */}
              {hasCrypto && extraction && (
                <div>
                  <SectionHeader title="Crypto & Key Management" isFirst={!hasOverview} />
                  <div className="space-y-3">
                    {hasValue(extraction.cryptoPrimitives) && (
                      <FieldTags
                        label="Crypto Primitives"
                        items={splitTags(extraction.cryptoPrimitives)}
                        variant="primary"
                      />
                    )}
                    {hasValue(extraction.signatureSchemes) && (
                      <FieldTags
                        label="Signature Schemes"
                        items={splitTags(extraction.signatureSchemes)}
                        variant="primary"
                      />
                    )}
                    {hasValue(extraction.keyManagementModel) && (
                      <FieldText
                        label="Key Management Model"
                        value={extraction.keyManagementModel}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Blockchain */}
              {hasBlockchain && extraction && (
                <div>
                  <SectionHeader title="Blockchain" isFirst={!hasOverview && !hasCrypto} />
                  <div className="space-y-3">
                    {hasValue(extraction.supportedBlockchains) && (
                      <FieldText
                        label="Supported Blockchains"
                        value={extraction.supportedBlockchains}
                      />
                    )}
                    {hasValue(extraction.consensusMechanism) && (
                      <FieldText
                        label="Consensus Mechanism"
                        value={extraction.consensusMechanism}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* PQC Readiness */}
              {hasPqc && extraction && (
                <div>
                  <SectionHeader
                    title="PQC Readiness"
                    isFirst={!hasOverview && !hasCrypto && !hasBlockchain}
                  />
                  <div className="space-y-3">
                    {hasValue(extraction.pqcSupport) && (
                      <div>
                        <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                          PQC Support
                        </h5>
                        <PqcSupportBadge value={extraction.pqcSupport} />
                      </div>
                    )}
                    {hasValue(extraction.pqcCapabilityDescription) && (
                      <FieldText
                        label="Capability Description"
                        value={extraction.pqcCapabilityDescription}
                      />
                    )}
                    {hasValue(extraction.pqcMigrationPriority) &&
                      extraction.pqcMigrationPriority.toLowerCase() !== 'unknown' && (
                        <div>
                          <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                            Migration Priority
                          </h5>
                          <span
                            className={clsx(
                              'inline-flex items-center px-2 py-0.5 rounded text-xs font-bold',
                              extraction.pqcMigrationPriority === 'Critical'
                                ? TAG_STYLES.destructive
                                : extraction.pqcMigrationPriority === 'High'
                                  ? TAG_STYLES.warning
                                  : TAG_STYLES.default
                            )}
                          >
                            {extraction.pqcMigrationPriority}
                          </span>
                        </div>
                      )}
                    {hasValue(extraction.pqcRoadmapDetails) && (
                      <FieldText label="PQC Roadmap" value={extraction.pqcRoadmapDetails} />
                    )}
                  </div>
                </div>
              )}

              {/* Compliance & Licensing */}
              {hasCompliance && extraction && (
                <div>
                  <SectionHeader
                    title="Compliance & Licensing"
                    isFirst={!hasOverview && !hasCrypto && !hasBlockchain && !hasPqc}
                  />
                  <div className="space-y-3">
                    {hasValue(extraction.regulatoryStatus) && (
                      <FieldText label="Regulatory Status" value={extraction.regulatoryStatus} />
                    )}
                    {hasValue(extraction.licenseType) && (
                      <FieldText label="License Type" value={extraction.licenseType} />
                    )}
                  </div>
                </div>
              )}

              {/* Security & Deployment — v3 dimensions */}
              {extraction &&
                (hasValue(extraction.implementationAttackSurface) ||
                  hasValue(extraction.testingValidation) ||
                  hasValue(extraction.constrainedDeviceIoT) ||
                  hasValue(extraction.supplyChainRisk) ||
                  hasValue(extraction.deploymentComplexity)) && (
                  <div>
                    <SectionHeader title="Security & Deployment" />
                    <div className="space-y-3">
                      {hasValue(extraction.implementationAttackSurface) && (
                        <FieldTags
                          label="Implementation Attack Surface"
                          items={splitTags(extraction.implementationAttackSurface)}
                          variant="destructive"
                        />
                      )}
                      {hasValue(extraction.testingValidation) && (
                        <FieldTags
                          label="Testing & Validation"
                          items={splitTags(extraction.testingValidation)}
                          variant="info"
                        />
                      )}
                      {hasValue(extraction.constrainedDeviceIoT) && (
                        <FieldTags
                          label="IoT & Constrained Devices"
                          items={splitTags(extraction.constrainedDeviceIoT)}
                          variant="warning"
                        />
                      )}
                      {hasValue(extraction.supplyChainRisk) && (
                        <FieldText label="Supply Chain Risk" value={extraction.supplyChainRisk} />
                      )}
                      {hasValue(extraction.deploymentComplexity) && (
                        <FieldText
                          label="Deployment Complexity"
                          value={extraction.deploymentComplexity}
                        />
                      )}
                    </div>
                  </div>
                )}

              {/* Executive Context — v4 dimensions */}
              {extraction &&
                (hasValue(extraction.financialBusinessImpact) ||
                  hasValue(extraction.organizationalReadiness)) && (
                  <div>
                    <SectionHeader title="Executive Context" />
                    <div className="space-y-3">
                      {hasValue(extraction.financialBusinessImpact) && (
                        <FieldText
                          label="Financial & Business Impact"
                          value={extraction.financialBusinessImpact}
                        />
                      )}
                      {hasValue(extraction.organizationalReadiness) && (
                        <FieldText
                          label="Organizational Readiness"
                          value={extraction.organizationalReadiness}
                        />
                      )}
                    </div>
                  </div>
                )}

              {/* Strategic Context — from catalog enrichment */}
              {hasStrategicContext && catalogEnrichment && (
                <div>
                  <SectionHeader
                    title="Strategic Context"
                    isFirst={
                      !hasOverview && !hasCrypto && !hasBlockchain && !hasPqc && !hasCompliance
                    }
                  />
                  <div className="space-y-3">
                    {catalogEnrichment.mainTopic && (
                      <FieldText label="Summary" value={catalogEnrichment.mainTopic} />
                    )}
                    {catalogEnrichment.keyTakeaways.length > 0 && (
                      <div>
                        <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                          Key Takeaways
                        </h5>
                        <ul className="space-y-1">
                          {catalogEnrichment.keyTakeaways.map((t, i) => (
                            <li
                              key={i}
                              className="text-sm text-foreground leading-relaxed flex gap-2"
                            >
                              <span className="text-primary mt-0.5">•</span>
                              <span>{t}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {catalogEnrichment.migrationTimeline &&
                      catalogEnrichment.migrationTimeline.length > 0 && (
                        <FieldTags
                          label="Migration Timeline"
                          items={catalogEnrichment.migrationTimeline}
                          variant="warning"
                        />
                      )}
                    {catalogEnrichment.hybridApproaches.length > 0 && (
                      <FieldTags
                        label="Hybrid & Transition Approaches"
                        items={catalogEnrichment.hybridApproaches}
                        variant="info"
                      />
                    )}
                    {catalogEnrichment.securityLevels.length > 0 && (
                      <FieldTags
                        label="Security Levels & Parameters"
                        items={catalogEnrichment.securityLevels}
                        variant="primary"
                      />
                    )}
                    {catalogEnrichment.leadersContributions.length > 0 && (
                      <FieldTags
                        label="Leaders & Contributors"
                        items={catalogEnrichment.leadersContributions}
                        variant="default"
                      />
                    )}
                    {catalogEnrichment.targetAudience.length > 0 && (
                      <FieldTags
                        label="Target Audience"
                        items={catalogEnrichment.targetAudience}
                        variant="default"
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </FocusLock>
      </div>
    </>
  )

  return createPortal(content, document.body)
}
