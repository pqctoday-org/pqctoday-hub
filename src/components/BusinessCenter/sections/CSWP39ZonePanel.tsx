// SPDX-License-Identifier: GPL-3.0-only
/**
 * Per-zone Command Center panel for one CSWP.39 Fig 3 zone.
 *
 * Renders the zone header (title, sub-element chips, CPM pillar, §-ref, tier
 * badge), then the artifact list — sub-grouped by `cswp39ZoneSubElement` so
 * users see, inside Governance, the artifacts under "Standards", "Crypto
 * Policies", "Supply Chains", etc.
 */
import React, { useState } from 'react'
import { ChevronDown, ChevronUp, GraduationCap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { CSWP39_ZONE_DETAILS, CSWP39_ZONE_STYLES, type ZoneId } from '@/data/cswp39ZoneData'
import type { ExecutiveDocument, ExecutiveDocumentType } from '@/services/storage/types'
import type { BusinessMetrics } from '../hooks/useBusinessMetrics'
import {
  type Density,
  showAdvancedZoneMetadata,
  showSubElementGroups,
  showZoneWires,
} from '../lib/density'
import {
  ZONE_ARTIFACT_TYPES,
  getArtifactsForZone,
  getZoneForType,
  orderByFeatured,
} from '../lib/cswp39StepMapping'
import { getPillarForType } from '../lib/cswp39StepMapping'
import { ArtifactCard, ArtifactPlaceholder } from '../ArtifactCard'
import { BUSINESS_TOOLS, ARTIFACT_TYPE_TO_TOOL_ID } from '../businessToolsRegistry'
import { computeZoneTiers } from '../lib/cswp39Tier'
import { TierBadge } from '../widgets/TierBadge'
import { useAssessmentSnapshot } from '@/hooks/assessment/useAssessmentSnapshot'
import { getArtifactSuggestion } from '@/data/assessmentToArtifactPriority'
import { AssetsWire } from './wires/AssetsWire'
import { GovernanceWire } from './wires/GovernanceWire'
import { ManagementToolsWire } from './wires/ManagementToolsWire'
import { MigrationWire } from './wires/MigrationWire'
import { MitigationWire } from './wires/MitigationWire'
import { RiskManagementWire } from './wires/RiskManagementWire'

export interface CSWP39ZonePanelProps {
  zone: ZoneId
  metrics: BusinessMetrics
  defaultOpen?: boolean
  /** Controlled open state. When provided, the panel is fully controlled by the parent. */
  open?: boolean
  /** Called when the toggle button is clicked in controlled mode. */
  onToggle?: () => void
  /** Optional ordering for featured artifact types (drives persona-aware sort). */
  featuredArtifacts?: ExecutiveDocumentType[]
  /** UI density. Suppresses tier badge, §-ref, sub-element grouping and wire
   *  at 'basic'; shows everything at 'advanced'. Defaults to 'advanced' so
   *  callers that don't pass a density still get the legacy full UI. */
  density?: Density
  onViewArtifact: (doc: ExecutiveDocument) => void
  onEditArtifact: (doc: ExecutiveDocument) => void
  onDeleteArtifact: (doc: ExecutiveDocument) => void
  onRenameArtifact?: (id: string, newTitle: string) => void
  onCreateArtifact: (type: ExecutiveDocumentType) => void
}

/** Look up the zone sub-element label for an artifact type via the tool registry. */
function getZoneSubElement(type: ExecutiveDocumentType): string | undefined {
  // eslint-disable-next-line security/detect-object-injection
  const toolId = ARTIFACT_TYPE_TO_TOOL_ID[type]
  if (!toolId) return undefined
  return BUSINESS_TOOLS.find((t) => t.id === toolId)?.cswp39ZoneSubElement
}

const UNGROUPED_LABEL = '__ungrouped__'

interface SubGroup {
  label: string
  artifacts: ExecutiveDocument[]
  missingTypes: ExecutiveDocumentType[]
}

/** Group artifacts + missing types by zone sub-element. The sub-element order
 *  follows `CSWP39_ZONE_DETAILS[zone].contains` so visual order matches Fig 3. */
function buildSubGroups(
  zone: ZoneId,
  artifacts: ExecutiveDocument[],
  missingTypes: ExecutiveDocumentType[]
): SubGroup[] {
  const order = CSWP39_ZONE_DETAILS[zone].contains
  const groupOrder = [...order, UNGROUPED_LABEL]
  const map = new Map<string, SubGroup>()
  for (const label of groupOrder) {
    map.set(label, { label, artifacts: [], missingTypes: [] })
  }

  for (const doc of artifacts) {
    const sub = getZoneSubElement(doc.type) ?? UNGROUPED_LABEL
    const group = map.get(sub) ?? map.get(UNGROUPED_LABEL)!
    group.artifacts.push(doc)
  }
  for (const type of missingTypes) {
    const sub = getZoneSubElement(type) ?? UNGROUPED_LABEL
    const group = map.get(sub) ?? map.get(UNGROUPED_LABEL)!
    group.missingTypes.push(type)
  }

  // Drop empty groups; keep ungrouped only if it has content.
  return groupOrder
    .map((label) => map.get(label)!)
    .filter((g) => g.artifacts.length > 0 || g.missingTypes.length > 0)
}

export const CSWP39ZonePanel: React.FC<CSWP39ZonePanelProps> = ({
  zone,
  metrics,
  defaultOpen = false,
  open: controlledOpen,
  onToggle,
  featuredArtifacts,
  density = 'advanced',
  onViewArtifact,
  onEditArtifact,
  onDeleteArtifact,
  onRenameArtifact,
  onCreateArtifact,
}) => {
  // eslint-disable-next-line security/detect-object-injection
  const detail = CSWP39_ZONE_DETAILS[zone]
  // eslint-disable-next-line security/detect-object-injection
  const style = CSWP39_ZONE_STYLES[zone]
  // eslint-disable-next-line security/detect-object-injection
  const sectionTypes = ZONE_ARTIFACT_TYPES[zone]
  // eslint-disable-next-line security/detect-object-injection
  const tier = computeZoneTiers(metrics)[zone]

  const isControlled = controlledOpen !== undefined
  const [internalOpen, setInternalOpen] = useState(defaultOpen)
  const open = isControlled ? controlledOpen : internalOpen
  const handleToggle = isControlled ? (onToggle ?? (() => {})) : () => setInternalOpen((v) => !v)
  const assessmentSnap = useAssessmentSnapshot()

  const artifacts = orderByFeatured(getArtifactsForZone(metrics, zone), featuredArtifacts)
  const existing = new Set(artifacts.map((a) => a.type))
  const missing = sectionTypes.filter((t) => !existing.has(t))
  const subGroups = buildSubGroups(zone, artifacts, missing)
  const hasContent = artifacts.length > 0 || missing.length > 0

  return (
    <div id={`zone-${zone}`} className={`glass-panel p-4 border-2 rounded-lg ${style.border}`}>
      <div className="flex items-start gap-3">
        <div
          className={`flex items-center justify-center w-9 h-9 rounded-lg font-bold text-[10px] tracking-wider shrink-0 ${style.activeBg} ${style.text}`}
          aria-hidden
        >
          {detail.label.split(' ')[0].slice(0, 4).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className={`text-base font-bold ${style.text}`}>{detail.title}</h3>
            {showAdvancedZoneMetadata(density) && (
              <>
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide px-2 py-0.5 rounded bg-muted/60">
                  {detail.cswpRef}
                </span>
                <TierBadge result={tier} />
              </>
            )}
            <span className="text-[10px] text-muted-foreground">
              {artifacts.length}/{sectionTypes.length} created
            </span>
            {detail.learnRoute && !open && (
              // Collapsed: promote "Learn this zone" to a primary button so
              // first-time learners have an obvious entry point.
              <Link to={detail.learnRoute}>
                <Button size="sm" variant="default" className="h-6 px-2 gap-1 text-[10px]">
                  <GraduationCap size={11} />
                  Learn this zone
                </Button>
              </Link>
            )}
            {detail.learnRoute && open && (
              // Expanded: keep the original lightweight inline link.
              <Link
                to={detail.learnRoute}
                className="inline-flex items-center gap-1 text-[10px] font-medium text-primary hover:underline"
                title={`Learn ${detail.title.toLowerCase()} in the workshop`}
              >
                <GraduationCap size={11} />
                Learn this zone →
              </Link>
            )}
          </div>
          <p className="text-xs text-foreground/80 mt-1.5">{detail.what}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {detail.contains.map((item) => (
              <span
                key={item}
                className={`text-[10px] px-1.5 py-0.5 rounded ${style.activeBg} ${style.text}`}
              >
                {item}
              </span>
            ))}
          </div>
        </div>
        <Button
          variant="ghost"
          className="shrink-0 h-8 px-2"
          onClick={handleToggle}
          aria-expanded={open}
          aria-label={open ? `Collapse ${detail.title}` : `Expand ${detail.title}`}
          data-workshop-target={`section-business-zone-${zone}`}
        >
          {open ? (
            <ChevronUp size={16} className="text-muted-foreground" />
          ) : (
            <ChevronDown size={16} className="text-muted-foreground" />
          )}
        </Button>
      </div>

      {open && (
        <div className="mt-3 pl-12 space-y-4">
          {/* Data wires — surface user-state from existing pages/stores
               (Migrate selection, Assess result, Compliance frameworks, etc.). */}
          {showZoneWires(density) && wireFor[zone] && (
            <div>{React.createElement(wireFor[zone]!, { metrics })}</div>
          )}

          {/* Artifacts section. When a zone has both a wire and registered
               tools, the wire renders above; when it only has a wire (no tools
               wired yet — assets / management-tools), we suppress the empty
               artifact-placeholder copy because the wire IS the content. */}
          {hasContent ? (
            <div>
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                Artifacts
              </div>
              <div className="space-y-3">
                {subGroups.map((group) => (
                  <div key={group.label}>
                    {group.label !== UNGROUPED_LABEL && showSubElementGroups(density) && (
                      <div className="text-[10px] font-semibold text-muted-foreground/80 uppercase tracking-wide mb-1">
                        {group.label}
                      </div>
                    )}
                    <div className="space-y-1.5">
                      {group.artifacts.map((doc) => (
                        <ArtifactCard
                          key={doc.id}
                          document={doc}
                          pillar={getPillarForType(doc.type)}
                          onView={onViewArtifact}
                          onEdit={onEditArtifact}
                          onDelete={onDeleteArtifact}
                          onRename={onRenameArtifact}
                        />
                      ))}
                      {group.missingTypes.map((type) => (
                        <ArtifactPlaceholder
                          key={type}
                          type={type}
                          pillar={getPillarForType(type)}
                          onCreate={onCreateArtifact}
                          suggestion={getArtifactSuggestion(type, assessmentSnap) ?? undefined}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : !wireFor[zone] ? (
            <div className="text-xs text-muted-foreground italic">
              No tools wired into this zone yet. PKILearning workshop builders for{' '}
              {detail.title.toLowerCase()} will land in a follow-up.
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

/** Per-zone data wire dispatch. Each wire reads from `useBusinessMetrics` and
 *  surfaces user-state from existing pages (Migrate selection, Assess result,
 *  Compliance frameworks, threats catalog, migration workflow). Zones without
 *  a wire (management-tools, mitigation) render only their artifacts list —
 *  management-tools is now populated by ManagementToolsAudit + CBOM builders. */
const wireFor: Record<ZoneId, React.ComponentType<{ metrics: BusinessMetrics }> | null> = {
  governance: GovernanceWire,
  assets: AssetsWire,
  'management-tools': ManagementToolsWire,
  'risk-management': RiskManagementWire,
  mitigation: MitigationWire,
  migration: MigrationWire,
}

// Avoid unused-import warning while computeZoneTiers/getZoneForType are
// referenced via re-export elsewhere — keep getZoneForType reachable.
export { getZoneForType }
