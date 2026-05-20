// SPDX-License-Identifier: GPL-3.0-only
import { useState, useMemo, useEffect, useRef } from 'react'
import type { MaturityRequirement } from '@/types/MaturityTypes'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import {
  Network,
  ShieldCheck,
  ShieldAlert,
  Clock,
  ChevronDown,
  ChevronUp,
  MapPin,
  Factory,
  BookOpen,
  CalendarClock,
  Building2,
  Search,
  ExternalLink,
  BookmarkCheck,
  Bookmark,
  Award,
  Globe,
  SlidersHorizontal,
  Info,
} from 'lucide-react'
import {
  complianceFrameworks,
  type ComplianceFramework,
  type RegionBloc,
  type DeadlinePhase,
  regionForCountry,
  REGION_BLOC_ORDER,
} from '@/data/complianceData'
import { usePersonaStore } from '@/store/usePersonaStore'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { NAICS_LABELS } from '@/components/common/SectorFilter'
import { CountryFlag } from '@/components/common/CountryFlag'
import { ViewToggle, type ViewMode } from '@/components/Library/ViewToggle'
import { useComplianceSelectionStore } from '@/store/useComplianceSelectionStore'
import { TrustScoreBadge } from '@/components/ui/TrustScoreBadge'
import { conceptIdForFramework } from '@/data/complianceData'
import { hasGraphEdges } from '@/utils/conceptXwalkGraph'
import { FrameworkConceptGraphModal } from './FrameworkConceptGraphModal'
import { resolveTimelineRef } from '@/utils/timelineResolver'
import { useSemanticSearch } from '@/services/search/useSemanticSearch'
import { SemanticSearchHint } from '@/components/common/SemanticSearchHint'
import { useTrustTierFilter } from '@/components/common/TrustTierFilter'

// ── Deadline helpers ────────────────────────────────────────────────────

import {
  extractYear,
  deadlineUrgency,
  urgencyColor,
  type DeadlineUrgency,
} from '@/utils/deadlineUrgency'

function urgencyBgColor(urgency: DeadlineUrgency) {
  switch (urgency) {
    case 'overdue':
      return 'bg-status-error'
    case 'imminent':
      return 'bg-status-warning'
    case 'near':
      return 'bg-status-success'
    case 'future':
    case 'ongoing':
      return 'bg-muted-foreground'
  }
}

// ── Country helpers ─────────────────────────────────────────────────────

/** Map compliance CSV country names → ISO flag codes */
const COUNTRY_FLAG_CODE: Record<string, string> = {
  'United States': 'us',
  Canada: 'ca',
  Australia: 'au',
  'European Union': 'eu',
  France: 'fr',
  Germany: 'de',
  'Czech Republic': 'cz',
  Italy: 'it',
  Spain: 'es',
  'United Kingdom': 'gb',
  Japan: 'jp',
  Singapore: 'sg',
  'South Korea': 'kr',
  'New Zealand': 'nz',
  Israel: 'il',
  China: 'cn',
  Global: 'un',
}

/** Abbreviate country names for chips */
function countryChip(country: string): string {
  const map: Record<string, string> = {
    'United States': 'US',
    Canada: 'CA',
    Australia: 'AU',
    'European Union': 'EU',
    France: 'FR',
    Germany: 'DE',
    'Czech Republic': 'CZ',
    Japan: 'JP',
    Singapore: 'SG',
    'South Korea': 'KR',
    'United Kingdom': 'UK',
    Israel: 'IL',
    Italy: 'IT',
    Spain: 'ES',
    'New Zealand': 'NZ',
    China: 'CN',
    Global: 'Global',
  }
  // eslint-disable-next-line security/detect-object-injection
  return map[country] ?? country
}

/** Abbreviate industry names for chips */
function industryChip(industry: string): string {
  const map: Record<string, string> = {
    'Finance & Banking': 'Finance',
    'Government & Defense': 'Gov/Def',
    Healthcare: 'Health',
    Telecommunications: 'Telecom',
    Technology: 'Tech',
    'Energy & Utilities': 'Energy',
    Automotive: 'Auto',
    Aerospace: 'Aero',
    'Retail & E-Commerce': 'Retail',
    Manufacturing: 'Mfg',
  }
  // eslint-disable-next-line security/detect-object-injection
  return map[industry] ?? industry
}

// ── Sort helpers ─────────────────────────────────────────────────────────

export type FrameworkSortOption = 'name' | 'deadline'

const FRAMEWORK_SORT_OPTIONS: { id: FrameworkSortOption; label: string }[] = [
  { id: 'deadline', label: 'Deadline ↑' },
  { id: 'name', label: 'Name A-Z' },
]

// Deadline facet values — keep in sync with DeadlinePhase in complianceData.ts
const DEADLINE_FILTER_OPTIONS: { id: 'All' | DeadlinePhase; label: string }[] = [
  { id: 'All', label: 'Any deadline' },
  { id: 'active', label: 'Active / in force' },
  { id: 'imminent', label: 'Imminent (≤1y)' },
  { id: 'near', label: 'Near-term (2-3y)' },
  { id: 'mid', label: 'Mid-term (4-6y)' },
  { id: 'long', label: 'Long-term (>6y)' },
  { id: 'ongoing', label: 'Ongoing / no year' },
]

function sortFrameworks(items: ComplianceFramework[], sort: FrameworkSortOption) {
  return [...items].sort((a, b) => {
    if (sort === 'name') return a.label.localeCompare(b.label)
    // deadline: requiresPQC first, then by year ascending, then alphabetical
    if (a.requiresPQC !== b.requiresPQC) return a.requiresPQC ? -1 : 1
    const aYear = extractYear(a.deadline) ?? 9999
    const bYear = extractYear(b.deadline) ?? 9999
    if (aYear !== bYear) return aYear - bYear
    return a.label.localeCompare(b.label)
  })
}

// ── Timeline bar ────────────────────────────────────────────────────────

const TIMELINE_START = 2024
const TIMELINE_END = 2036
const TIMELINE_SPAN = TIMELINE_END - TIMELINE_START
const TODAY_YEAR = new Date().getFullYear()
const STACK_COLUMNS = 3

function yearLeftPercent(year: number): number {
  const clamped = Math.max(TIMELINE_START, Math.min(TIMELINE_END, year))
  return ((clamped - TIMELINE_START) / TIMELINE_SPAN) * 100
}

export function DeadlineTimeline({
  frameworks,
  label,
}: {
  frameworks: ComplianceFramework[]
  label?: string
}) {
  const withDeadlines = frameworks.filter((f) => extractYear(f.deadline) !== null)
  const years = Array.from({ length: TIMELINE_SPAN + 1 }, (_, i) => TIMELINE_START + i)

  const byYear = new Map<number, ComplianceFramework[]>()
  for (const fw of withDeadlines) {
    const year = extractYear(fw.deadline)!
    const bucket = Math.max(TIMELINE_START, Math.min(TIMELINE_END, year))
    if (!byYear.has(bucket)) byYear.set(bucket, [])
    byYear.get(bucket)!.push(fw)
  }

  const maxStackHeight = Math.max(
    0,
    ...Array.from(byYear.values()).map((fws) => Math.ceil(fws.length / STACK_COLUMNS))
  )
  const stackPx = maxStackHeight * 14 + 8 // 10px dot + 4px gap per row, plus breathing room
  const stackHeight = Math.max(72, Math.min(240, stackPx))

  return (
    <div className="glass-panel p-4 space-y-3">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-foreground">PQC Compliance Deadlines</h3>
        {label && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground border border-border rounded-full px-2 py-0.5">
            <Globe size={10} aria-hidden="true" />
            {label}
          </span>
        )}
      </div>
      <div className="relative overflow-x-auto">
        {/* px-3 keeps edge dots (2024 / 2036) fully visible inside the overflow container. */}
        <div className="min-w-[480px] px-3">
          {/* Year labels: absolute-positioned so they line up exactly with dot columns. */}
          <div className="relative h-4 text-xs text-muted-foreground mb-1">
            {years
              .filter((y) => y % 2 === 0 || y === TIMELINE_END)
              .map((y) => (
                <span
                  key={y}
                  className="absolute top-0 text-center whitespace-nowrap"
                  style={{ left: `${yearLeftPercent(y)}%`, transform: 'translateX(-50%)' }}
                >
                  {y}
                </span>
              ))}
          </div>
          <div className="relative h-2 bg-muted rounded-full">
            <div
              className="absolute top-0 h-2 w-0.5 bg-foreground/40"
              style={{
                left: `${yearLeftPercent(TODAY_YEAR)}%`,
              }}
              title={`Today (${TODAY_YEAR})`}
            />
          </div>
          <div className="relative mt-2" style={{ height: `${stackHeight}px` }}>
            {Array.from(byYear.entries()).map(([year, fws]) => {
              const left = yearLeftPercent(year)
              return (
                <div
                  key={year}
                  className="absolute top-0"
                  style={{ left: `${left}%`, transform: 'translateX(-50%)' }}
                >
                  <div
                    className="grid gap-1 justify-items-center"
                    style={{ gridTemplateColumns: `repeat(${STACK_COLUMNS}, 10px)` }}
                  >
                    {fws.map((fw) => {
                      const urgency = deadlineUrgency(fw.deadline)
                      return (
                        <div key={fw.id} className="group relative">
                          <div
                            className={`w-2.5 h-2.5 rounded-full ${urgencyBgColor(urgency)} cursor-default`}
                            title={`${fw.label}: ${fw.deadline}`}
                          />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-20 whitespace-nowrap">
                            <div className="bg-popover border border-border text-xs text-foreground px-2 py-1 rounded shadow-lg">
                              <span className="font-semibold">{fw.label}</span>
                              <span className={`ml-1 ${urgencyColor(urgency)}`}>{fw.deadline}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground mt-1 px-1">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-status-error inline-block" /> Overdue
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-status-warning inline-block" /> Imminent
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-status-success inline-block" /> Near-term
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-muted-foreground inline-block" /> Future
            </span>
            <span className="flex items-center gap-1">
              <span className="w-0.5 h-3 bg-foreground/40 inline-block" /> Today
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Region context card ─────────────────────────────────────────────────

/**
 * One short paragraph per regulatory bloc explaining what PQC governance
 * looks like in that region. Surfaces inline above the framework grid when
 * the user filters to a specific bloc, so the page provides context for a
 * Brazilian / Indonesian / Nigerian visitor rather than just a raw list of
 * 3-4 matching rows.
 */
const REGION_CONTEXT: Record<RegionBloc, { title: string; body: string }> = {
  'North America': {
    title: 'North America',
    body: 'Dominated by US federal mandates: CNSA 2.0 (NSA) and NIST IR 8547 set the binding deprecation timeline through 2035. FIPS 140-3 (NIST CMVP) and FedRAMP carry the certification weight. Canada (CCCS) cross-recognises FIPS 140-3 and tracks NIST PQC for federal procurement.',
  },
  'European Union': {
    title: 'European Union',
    body: 'Layered framework: ENISA publishes the technical PQC guidance, EUCC is the cross-border certification scheme, NIS2 + DORA + eIDAS 2.0 are the operative legal instruments. National authorities (ANSSI, BSI, AgID, RIA, NCSC-IE, CCB, A-SIT, NASK) transpose NIS2 and add country-specific PQC roadmaps.',
  },
  'Europe (non-EU)': {
    title: 'Europe (non-EU)',
    body: 'Mixed landscape: UK NCSC, Switzerland and Norway track EU PQC guidance closely. Russia operates a separate national crypto regime (GOST via TC 26) with no Western PQC adoption. Turkey aligns partially with EU (KVKK / GDPR) but cryptography is BTK-regulated.',
  },
  'United Kingdom': {
    title: 'United Kingdom',
    body: 'NCSC publishes the UK Quantum-Safe Cryptography migration roadmap (2023-2035). Critical National Infrastructure operators are expected to publish PQC migration plans by 2028. Common Criteria evaluations are run via CCRA; FIPS 140-3 is widely required in cross-border procurement.',
  },
  'Asia-Pacific': {
    title: 'Asia-Pacific',
    body: 'Heterogeneous: Australia (ASD ISPEC 1) and Japan (METI/CRYPTREC) have explicit PQC tracks. South Korea (KISA) is developing national PQC profiles. Singapore (CSA), India (CERT-In), Indonesia (BSSN), Thailand (NCSA), Vietnam (MIC), Philippines (NPC) anchor to ISO 27001 + NIST. China and Hong Kong run separate national crypto regimes.',
  },
  'Middle East': {
    title: 'Middle East',
    body: 'Most jurisdictions anchor security obligations in national Personal Data Protection Laws (UAE, Saudi Arabia, Bahrain, Jordan) with ISO 27001 as the base technical standard. Israel (INCD) tracks NIST PQC closely. No region-wide PQC mandate yet; HNDL is the primary near-term concern for long-lived financial and government records.',
  },
  Africa: {
    title: 'Africa',
    body: 'The African Union Malabo Convention is the pan-continental harmonising instrument (entered into force 2023). National enforcement is country-by-country: NDPC (Nigeria), DPC (Egypt), ODPC (Kenya), Information Regulator (South Africa). PQC adoption is in advisory phase; the AU Cybersecurity Expert Group has flagged quantum-safe transition as a 2025+ priority.',
  },
  'Latin America': {
    title: 'Latin America',
    body: 'Data-protection laws dominate (LGPD in Brazil, Habeas Data 1581 in Colombia, Law 29733 in Peru, Law 18.331 in Uruguay, AAIP in Argentina) — most align with GDPR-style technical security obligations. Uruguay holds an EU adequacy decision. PQC mandates are not yet in force anywhere in the region; tracking is via national CERTs and digital-government agencies.',
  },
  Global: {
    title: 'Global instruments',
    body: 'Cross-border frameworks operate above the national layer: ISO/IEC JTC 1/SC 27 standardises PQC algorithms internationally, Common Criteria (CCRA) provides mutual-recognition of product evaluations, IETF integrates PQC into internet protocols (TLS, SSH, CMS, S/MIME), SWIFT CSP applies to wholesale banking, and PCI DSS to card payments.',
  },
  Other: {
    title: 'Other',
    body: 'Jurisdictions not yet classified into a regulatory bloc. If you see this label persisting, it usually means a country was added to the CSV without a corresponding entry in COUNTRY_TO_REGION — see src/data/complianceData.ts.',
  },
}

function RegionContextCard({ region }: { region: RegionBloc }) {
  // eslint-disable-next-line security/detect-object-injection
  const entry = REGION_CONTEXT[region]
  if (!entry) return null
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border border-primary/20 bg-primary/5 text-sm">
      <Globe size={16} className="text-primary mt-0.5 shrink-0" />
      <div className="space-y-0.5">
        <span className="font-semibold text-foreground">{entry.title}</span>
        <p className="text-muted-foreground text-xs">{entry.body}</p>
      </div>
    </div>
  )
}

// ── Framework card ──────────────────────────────────────────────────────

function FrameworkCard({
  fw,
  maturityByRefId,
  onNavigateToCswp39,
  onSelectDetail,
  highlighted,
}: {
  fw: ComplianceFramework
  maturityByRefId?: Map<string, MaturityRequirement[]>
  onNavigateToCswp39?: (refId: string) => void
  onSelectDetail?: (fw: ComplianceFramework) => void
  highlighted?: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const [graphOpen, setGraphOpen] = useState(false)
  const [maturityOpen, setMaturityOpen] = useState(false)
  const urgency = deadlineUrgency(fw.deadline)
  const hasRefs = fw.libraryRefs.length > 0 || fw.timelineRefs.length > 0
  const isSelected = useComplianceSelectionStore((s) => s.myFrameworks.includes(fw.id))
  const toggleMyFramework = useComplianceSelectionStore((s) => s.toggleMyFramework)
  const graphConceptId = conceptIdForFramework(fw)
  const showGraphIcon = graphConceptId !== undefined && hasGraphEdges(graphConceptId)

  // All maturity requirements reachable via this framework's library refs
  const maturityItems = useMemo(() => {
    if (!maturityByRefId) return []
    return fw.libraryRefs.flatMap((ref) => maturityByRefId.get(ref) ?? [])
  }, [fw.libraryRefs, maturityByRefId])

  const maturityCount = maturityItems.length

  const maturityRefId = useMemo(() => {
    if (!maturityByRefId) return null
    return fw.libraryRefs.find((ref) => maturityByRefId.has(ref)) ?? null
  }, [fw.libraryRefs, maturityByRefId])

  return (
    <div
      id={`fw-${fw.id}`}
      data-workshop-target={`compliance-framework-${fw.id}`}
      className={`glass-panel p-4 space-y-3 flex flex-col scroll-mt-20 transition-shadow duration-300${onSelectDetail ? ' cursor-pointer' : ''} ${highlighted ? 'ring-2 ring-primary shadow-glow' : ''}`}
      onClick={onSelectDetail ? () => onSelectDetail(fw) : undefined}
      onKeyDown={
        onSelectDetail
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onSelectDetail(fw)
              }
            }
          : undefined
      }
      role={onSelectDetail ? 'button' : undefined}
      tabIndex={onSelectDetail ? 0 : undefined}
      aria-label={onSelectDetail ? `View details for ${fw.label}` : undefined}
    >
      <div className="flex items-start gap-2">
        {fw.pqcRequirement === 'yes' ? (
          <ShieldCheck size={18} className="text-status-success shrink-0 mt-0.5" />
        ) : fw.pqcRequirement === 'partial' || fw.pqcRequirement === 'expected' ? (
          <ShieldCheck size={18} className="text-status-warning shrink-0 mt-0.5" />
        ) : fw.pqcRequirement === 'guidance' ? (
          <ShieldCheck size={18} className="text-status-info shrink-0 mt-0.5" />
        ) : (
          <ShieldAlert size={18} className="text-muted-foreground shrink-0 mt-0.5" />
        )}
        <div className="min-w-0 flex-1">
          <h4 className="font-semibold text-foreground text-sm leading-tight">{fw.label}</h4>
          <div className="flex items-center gap-2 flex-wrap">
            <TrustScoreBadge resourceType="compliance" resourceId={fw.id} size="sm" />
            {fw.confidenceScore !== undefined && (
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                  fw.confidenceScore >= 70
                    ? 'bg-status-success/10 text-status-success border-status-success/30'
                    : fw.confidenceScore >= 40
                      ? 'bg-status-warning/10 text-status-warning border-status-warning/30'
                      : 'bg-status-error/10 text-status-error border-status-error/30'
                }`}
                title={`Data confidence: ${fw.confidenceScore}/100`}
              >
                {fw.confidenceScore}%
              </span>
            )}
            {fw.bodyType === 'industry_alliance' && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded bg-secondary/10 text-secondary font-semibold"
                title="Industry alliance / consortium — not a regulator; produces reference implementations, policy guidance, and migration tooling"
              >
                Alliance
              </span>
            )}
            {fw.pqcRequirement === 'yes' ? (
              <span className="text-xs text-status-success font-medium">Requires PQC</span>
            ) : fw.pqcRequirement === 'partial' ? (
              <span
                className="text-xs text-status-warning font-medium"
                title="PQC required for some scope but not the whole framework"
              >
                PQC partial
              </span>
            ) : fw.pqcRequirement === 'expected' ? (
              <span
                className="text-xs text-status-warning font-medium"
                title="PQC mandate anticipated but not yet codified"
              >
                PQC expected
              </span>
            ) : fw.pqcRequirement === 'guidance' ? (
              <span
                className="text-xs text-status-info font-medium"
                title="Framework publishes PQC guidance but does not mandate adoption"
              >
                PQC guidance
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">No PQC mandate yet</span>
            )}
            {fw.enforcementBody && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                <Building2 size={8} />
                {fw.enforcementBody}
              </span>
            )}
          </div>
        </div>
        {showGraphIcon && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label={`Open concept graph for ${fw.label}`}
            title="Concept graph (IR 8477 xwalk)"
            onClick={(e) => {
              e.stopPropagation()
              setGraphOpen(true)
            }}
            className="p-1 h-auto shrink-0 text-muted-foreground hover:text-primary"
          >
            <Network size={16} />
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={isSelected ? 'Remove from My Frameworks' : 'Add to My Frameworks'}
          onClick={(e) => {
            e.stopPropagation()
            toggleMyFramework(fw.id)
          }}
          className={`p-1 h-auto shrink-0 ${
            isSelected
              ? 'text-primary hover:text-primary/80'
              : 'text-muted-foreground/40 hover:text-primary'
          }`}
        >
          {isSelected ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
        </Button>
      </div>
      {showGraphIcon && graphConceptId && (
        <FrameworkConceptGraphModal
          isOpen={graphOpen}
          onClose={() => setGraphOpen(false)}
          centerConceptId={graphConceptId}
          title={fw.label}
        />
      )}

      <div className={`flex items-center gap-1.5 text-xs ${urgencyColor(urgency)}`}>
        <Clock size={12} />
        <span className="font-medium">
          {urgency === 'overdue' ? `${fw.deadline} — Overdue` : fw.deadline}
        </span>
      </div>

      <p className="text-xs text-muted-foreground line-clamp-2">{fw.description}</p>

      {fw.countries.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {fw.countries.map((c) => (
            <span
              key={c}
              title={c}
              className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium"
            >
              <MapPin size={8} />
              {/* Hide the label on narrow screens to save space; icon + tooltip still convey the country. */}
              <span className="hidden sm:inline">{countryChip(c)}</span>
            </span>
          ))}
        </div>
      )}

      {fw.industries.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {fw.industries.map((ind) => (
            <span
              key={ind}
              title={ind}
              className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium"
            >
              <Factory size={8} />
              <span className="hidden sm:inline">{industryChip(ind)}</span>
            </span>
          ))}
        </div>
      )}

      {fw.cswp39Tags && fw.cswp39Tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {fw.cswp39Tags.map((tag) => (
            <span
              key={tag}
              title={`NIST CSWP 39 consideration: ${tag}`}
              className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent font-medium border border-accent/20"
            >
              {tag.replace('cswp39:', '')}
            </span>
          ))}
        </div>
      )}

      {(hasRefs || fw.notes || fw.website) && (
        <div className="flex items-center gap-2 mt-auto pt-1">
          {fw.website && (
            <a
              href={fw.website}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium hover:bg-muted/80 hover:text-foreground transition-colors"
              title={`Official site: ${fw.website}`}
            >
              <ExternalLink size={8} />
              Site
            </a>
          )}
          {maturityCount > 0 && onNavigateToCswp39 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                setMaturityOpen((p) => !p)
              }}
              aria-expanded={maturityOpen}
              className={`h-auto inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium transition-colors border ${maturityOpen ? 'bg-primary/20 text-primary border-primary/40' : 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20'}`}
              title="View CSWP.39 governance requirements extracted from this framework"
            >
              {maturityCount} CSWP.39 req{maturityCount !== 1 ? 's' : ''}
              {maturityOpen ? <ChevronUp size={8} /> : <ChevronDown size={8} />}
            </Button>
          )}
          {fw.libraryRefs.length > 0 && (
            <Link
              to={`/library?q=${encodeURIComponent(fw.libraryRefs.join(' '))}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-secondary/10 text-secondary font-medium hover:bg-secondary/20 transition-colors"
              title={`Library: ${fw.libraryRefs.join(', ')}`}
            >
              <BookOpen size={8} />
              {fw.libraryRefs.length} ref{fw.libraryRefs.length > 1 ? 's' : ''}
            </Link>
          )}
          {fw.timelineRefs.length > 0 &&
            (() => {
              const first = resolveTimelineRef(fw.timelineRefs[0])
              const country = first.country
              const href = country
                ? `/timeline?country=${encodeURIComponent(country)}`
                : '/timeline'
              const label =
                first.events.length > 0
                  ? `${first.country} — ${first.org}: ${first.events.length} event${first.events.length > 1 ? 's' : ''} (${first.earliestYear}-${first.latestYear})`
                  : `Timeline: ${fw.timelineRefs.join(', ')}`
              return (
                <Link
                  to={href}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent font-medium hover:bg-accent/20 transition-colors"
                  title={label}
                >
                  <CalendarClock size={8} />
                  Timeline
                </Link>
              )
            })()}
          {fw.enforcementBody && fw.bodyType === 'certification_body' && (
            <Link
              to={`/compliance?tab=records&q=${encodeURIComponent(fw.enforcementBody)}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium hover:bg-muted/80 hover:text-foreground transition-colors"
              title={`Cert records for ${fw.enforcementBody}`}
            >
              <Award size={8} />
              Certs
            </Link>
          )}
          {fw.notes && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                setExpanded(!expanded)
              }}
              className="flex items-center gap-1 h-auto py-0 text-xs text-primary hover:text-primary/80 ml-auto"
            >
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {expanded ? 'Hide' : 'Notes'}
            </Button>
          )}
        </div>
      )}

      {/* Inline CSWP.39 requirements panel */}
      {maturityOpen && maturityItems.length > 0 && (
        // eslint-disable-next-line jsx-a11y/no-static-element-interactions
        <div
          className="border-t border-border pt-2 space-y-1.5"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          aria-label="CSWP.39 governance requirements"
        >
          {maturityItems.slice(0, 6).map((req, i) => (
            <div key={i} className="flex items-start gap-2 text-[11px]">
              <span
                className={`shrink-0 mt-0.5 px-1.5 py-0 rounded text-[9px] font-semibold leading-5 ${
                  req.maturityLevel === 1
                    ? 'bg-status-error/15 text-status-error'
                    : req.maturityLevel === 2
                      ? 'bg-status-warning/15 text-status-warning'
                      : req.maturityLevel === 3
                        ? 'bg-status-info/15 text-status-info'
                        : 'bg-status-success/15 text-status-success'
                }`}
              >
                L{req.maturityLevel}
              </span>
              <span className="shrink-0 mt-0.5 text-[9px] uppercase tracking-wide text-muted-foreground font-medium leading-5 min-w-[56px]">
                {req.pillar}
              </span>
              <span className="text-foreground/80 leading-relaxed line-clamp-2">
                {req.requirement}
              </span>
            </div>
          ))}
          {maturityRefId && onNavigateToCswp39 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onNavigateToCswp39(maturityRefId)
              }}
              className="h-auto text-[10px] px-0 py-0.5 text-primary hover:text-primary/80 font-medium"
            >
              {maturityItems.length > 6 ? `+${maturityItems.length - 6} more · ` : ''}Open in
              CSWP.39 explorer →
            </Button>
          )}
        </div>
      )}

      {expanded && (
        <div className="text-xs text-muted-foreground bg-muted/30 rounded p-2 border border-border space-y-2">
          {fw.notes && <p>{fw.notes}</p>}
          {fw.libraryRefs.length > 0 && (
            <div className="pt-1 border-t border-border/50">
              <span className="font-medium text-foreground">Related documents:</span>
              <ul className="mt-0.5 space-y-0.5">
                {fw.libraryRefs.map((ref) => (
                  <li key={ref}>
                    <Link
                      to={`/library?ref=${encodeURIComponent(ref)}`}
                      className="text-secondary hover:text-secondary/80 underline underline-offset-2"
                    >
                      {ref}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {fw.timelineRefs.length > 0 && (
            <div className="pt-1 border-t border-border/50">
              <span className="font-medium text-foreground">Timeline entries:</span>
              <ul className="mt-0.5 space-y-0.5">
                {fw.timelineRefs.map((ref) => {
                  const resolved = resolveTimelineRef(ref)
                  const href = resolved.country
                    ? `/timeline?country=${encodeURIComponent(resolved.country)}`
                    : '/timeline'
                  const topEvents = resolved.events.slice(0, 3)
                  return (
                    <li key={ref} className="space-y-0.5">
                      <Link
                        to={href}
                        className="text-accent hover:text-accent/80 underline underline-offset-2"
                      >
                        {resolved.country
                          ? `${resolved.country} — ${resolved.org}`
                          : ref.replace(':', ' — ')}
                      </Link>
                      {resolved.events.length === 0 ? (
                        <span className="ml-2 text-[10px] text-status-warning">
                          no events in timeline
                        </span>
                      ) : (
                        <span className="ml-2 text-[10px] text-muted-foreground">
                          {resolved.events.length} event
                          {resolved.events.length > 1 ? 's' : ''} · {resolved.earliestYear}–
                          {resolved.latestYear}
                        </span>
                      )}
                      {topEvents.length > 0 && (
                        <ul className="ml-4 space-y-0 list-[circle] list-inside">
                          {topEvents.map((e) => (
                            <li
                              key={`${e.title}-${e.startYear}`}
                              className="text-[10px] text-muted-foreground"
                            >
                              <span className="font-medium text-foreground/80">{e.title}</span>
                              <span className="ml-1">
                                ({e.startYear}
                                {e.endYear !== e.startYear ? `–${e.endYear}` : ''})
                              </span>
                            </li>
                          ))}
                          {resolved.events.length > topEvents.length && (
                            <li className="text-[10px] text-muted-foreground italic">
                              +{resolved.events.length - topEvents.length} more on the timeline
                            </li>
                          )}
                        </ul>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Framework table row ─────────────────────────────────────────────────

function FrameworkTableRow({ fw }: { fw: ComplianceFramework }) {
  const urgency = deadlineUrgency(fw.deadline)
  const isSelected = useComplianceSelectionStore((s) => s.myFrameworks.includes(fw.id))
  const toggleMyFramework = useComplianceSelectionStore((s) => s.toggleMyFramework)
  return (
    <tr className="border-b border-border hover:bg-muted/20 transition-colors">
      <td className="py-2.5 px-2 w-8 text-center">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={isSelected ? 'Remove from My Frameworks' : 'Add to My Frameworks'}
          onClick={(e) => {
            e.stopPropagation()
            toggleMyFramework(fw.id)
          }}
          className={`p-1 h-auto ${
            isSelected
              ? 'text-primary hover:text-primary/80'
              : 'text-muted-foreground/40 hover:text-primary'
          }`}
        >
          {isSelected ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
        </Button>
      </td>
      <td className="py-2.5 px-3">
        <div className="flex items-center gap-2">
          {fw.requiresPQC ? (
            <ShieldCheck size={14} className="text-status-success shrink-0" />
          ) : (
            <ShieldAlert size={14} className="text-muted-foreground shrink-0" />
          )}
          <span className="text-sm font-medium text-foreground">{fw.label}</span>
          {fw.website && (
            <a
              href={fw.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors shrink-0"
              title="Official website"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink size={10} />
            </a>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 ml-5 line-clamp-1">{fw.description}</p>
      </td>
      <td className="py-2.5 px-3 text-xs text-muted-foreground whitespace-nowrap">
        {fw.enforcementBody}
      </td>
      <td className={`py-2.5 px-3 text-xs font-medium whitespace-nowrap ${urgencyColor(urgency)}`}>
        {fw.deadline}
      </td>
      <td className="py-2.5 px-3">
        <div className="flex flex-wrap gap-1">
          {fw.countries.slice(0, 3).map((c) => (
            <span
              key={c}
              className="inline-flex items-center gap-0.5 text-[10px] px-1 py-0.5 rounded bg-muted text-muted-foreground"
            >
              {/* eslint-disable-next-line security/detect-object-injection */}
              {COUNTRY_FLAG_CODE[c] && (
                <CountryFlag
                  code={COUNTRY_FLAG_CODE[c]}
                  width={12}
                  height={9}
                  className="rounded-[1px]"
                />
              )}
              {countryChip(c)}
            </span>
          ))}
          {fw.countries.length > 3 && (
            <span className="text-[10px] text-muted-foreground">+{fw.countries.length - 3}</span>
          )}
        </div>
      </td>
      <td className="py-2.5 px-3">
        <div className="flex gap-1.5">
          {fw.libraryRefs.length > 0 && (
            <Link
              to={`/library?q=${encodeURIComponent(fw.libraryRefs.join(' '))}`}
              className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-secondary/10 text-secondary font-medium hover:bg-secondary/20 transition-colors"
            >
              <BookOpen size={8} />
              {fw.libraryRefs.length}
            </Link>
          )}
          {fw.timelineRefs.length > 0 &&
            (() => {
              const first = resolveTimelineRef(fw.timelineRefs[0])
              const href = first.country
                ? `/timeline?country=${encodeURIComponent(first.country)}`
                : '/timeline'
              const title =
                first.events.length > 0
                  ? `${first.country} — ${first.org}: ${first.events.length} event${first.events.length > 1 ? 's' : ''} (${first.earliestYear}-${first.latestYear})`
                  : fw.timelineRefs.join(', ')
              return (
                <Link
                  to={href}
                  className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent font-medium hover:bg-accent/20 transition-colors"
                  title={title}
                >
                  <CalendarClock size={8} />
                </Link>
              )
            })()}
        </div>
      </td>
    </tr>
  )
}

function FrameworkTable({ frameworks }: { frameworks: ComplianceFramework[] }) {
  return (
    <div className="glass-panel overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="py-2.5 px-2 w-8 text-center text-xs font-semibold text-muted-foreground">
              My
            </th>
            <th className="py-2.5 px-3 text-left text-xs font-semibold text-muted-foreground">
              Name
            </th>
            <th className="py-2.5 px-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">
              Enforcement Body
            </th>
            <th className="py-2.5 px-3 text-left text-xs font-semibold text-muted-foreground">
              Deadline
            </th>
            <th className="py-2.5 px-3 text-left text-xs font-semibold text-muted-foreground">
              Countries
            </th>
            <th className="py-2.5 px-3 text-left text-xs font-semibold text-muted-foreground">
              Refs
            </th>
          </tr>
        </thead>
        <tbody>
          {frameworks.map((fw) => (
            <FrameworkTableRow key={fw.id} fw={fw} />
          ))}
        </tbody>
      </table>
      {frameworks.length === 0 && (
        <div className="p-8 text-center text-muted-foreground text-sm">
          No entries match the selected filters.
        </div>
      )}
    </div>
  )
}

// ── Main component ──────────────────────────────────────────────────────

interface ComplianceLandscapeProps {
  /** Pre-filtered set of frameworks to display. Defaults to all complianceFrameworks. */
  frameworks?: ComplianceFramework[]
  /** Whether to render the deadline timeline bar. Defaults to true. */
  showDeadlineTimeline?: boolean
  /** Maturity requirements lookup — enables CSWP.39 req chips on compliance framework cards */
  maturityByRefId?: Map<string, MaturityRequirement[]>
  /** Called when user clicks a CSWP.39 req chip; navigates to CSWP.39 tab filtered to refId */
  onNavigateToCswp39?: (refId: string) => void
  /** Controlled filter state (lifted to ComplianceView for URL sync) */
  orgFilter?: string
  industryFilter?: string
  regionFilter?: RegionBloc | 'All'
  countryFilter?: string
  deadlineFilter?: 'All' | DeadlinePhase
  searchText?: string
  searchInputValue?: string
  sortBy?: FrameworkSortOption
  viewMode?: ViewMode
  onOrgFilterChange?: (org: string) => void
  onIndustryFilterChange?: (ind: string) => void
  onRegionFilterChange?: (region: RegionBloc | 'All') => void
  onCountryFilterChange?: (country: string) => void
  onDeadlineFilterChange?: (phase: 'All' | DeadlinePhase) => void
  onSearchTextChange?: (text: string) => void
  onSortByChange?: (sort: FrameworkSortOption) => void
  onViewModeChange?: (mode: ViewMode) => void
  /** When set, scroll to and ring-highlight this framework ID for 3 s */
  highlightFrameworkId?: string | null
  /** Called when user clicks "Details →" on a framework card */
  onSelectFramework?: (fw: ComplianceFramework) => void
}

export function ComplianceLandscape({
  frameworks: frameworksProp,
  showDeadlineTimeline = true,
  maturityByRefId,
  onNavigateToCswp39,
  orgFilter: orgFilterProp,
  industryFilter: industryFilterProp,
  regionFilter: regionFilterProp,
  countryFilter: countryFilterProp,
  deadlineFilter: deadlineFilterProp,
  searchText: searchTextProp,
  searchInputValue: searchInputValueProp,
  sortBy: sortByProp,
  viewMode: viewModeProp,
  highlightFrameworkId,
  onOrgFilterChange,
  onIndustryFilterChange,
  onRegionFilterChange,
  onCountryFilterChange,
  onDeadlineFilterChange,
  onSearchTextChange,
  onSortByChange,
  onViewModeChange,
  onSelectFramework,
}: ComplianceLandscapeProps = {}) {
  const sourceFrameworks = frameworksProp ?? complianceFrameworks
  const { selectedIndustries } = usePersonaStore()
  const myFrameworks = useComplianceSelectionStore((s) => s.myFrameworks)
  const showOnlyMine = useComplianceSelectionStore((s) => s.showOnlyMine)
  const setShowOnlyMine = useComplianceSelectionStore((s) => s.setShowOnlyMine)

  // Filter state — controlled from parent when props provided, local fallback otherwise
  const [localOrg, setLocalOrg] = useState<string>('All')
  const [localIndustry, setLocalIndustry] = useState<string>(
    selectedIndustries.length === 1 ? selectedIndustries[0] : 'All'
  )
  const [localRegion, setLocalRegion] = useState<RegionBloc | 'All'>('All')
  const [localCountry, setLocalCountry] = useState<string>('All')
  const [localDeadline, setLocalDeadline] = useState<'All' | DeadlinePhase>('All')
  const [localSearch, setLocalSearch] = useState<string>('')
  const [localSort, setLocalSort] = useState<FrameworkSortOption>('deadline')
  const [localView, setLocalView] = useState<ViewMode>('cards')
  const [showMoreFilters, setShowMoreFilters] = useState(
    () =>
      (orgFilterProp ?? 'All') !== 'All' ||
      (industryFilterProp ?? 'All') !== 'All' ||
      (countryFilterProp ?? 'All') !== 'All'
  )
  const [pqcRequiredOnly, setPqcRequiredOnly] = useState(false)
  const [hasDeadlineOnly, setHasDeadlineOnly] = useState(false)
  const tierFilter = useTrustTierFilter()

  const orgFilter = orgFilterProp ?? localOrg
  const industryFilter = industryFilterProp ?? localIndustry
  const regionFilter = regionFilterProp ?? localRegion
  const countryFilter = countryFilterProp ?? localCountry
  const deadlineFilter = deadlineFilterProp ?? localDeadline
  const searchInputVal = searchInputValueProp ?? localSearch
  const searchFilterText = searchTextProp ?? localSearch
  const sortBy = sortByProp ?? localSort
  const viewMode = viewModeProp ?? localView
  const secondaryFilterCount =
    (orgFilter !== 'All' ? 1 : 0) +
    (industryFilter !== 'All' ? 1 : 0) +
    (countryFilter !== 'All' ? 1 : 0)

  // Phase 3 — semantic supplement. Queries like "banking sector
  // cryptographic resilience" surface DORA, PCI-DSS, MAS without
  // requiring the user to recall the framework name.
  const semantic = useSemanticSearch('compliance', searchFilterText, { limit: 30 })
  const semanticIdSet = useMemo(
    () =>
      semantic.mode === 'semantic' ? new Set(semantic.hits.map((h) => h.id.toLowerCase())) : null,
    [semantic.mode, semantic.hits]
  )

  const setOrgFilter = onOrgFilterChange ?? setLocalOrg
  const setIndustryFilter = onIndustryFilterChange ?? setLocalIndustry
  const setRegionFilter = onRegionFilterChange ?? setLocalRegion
  const setCountryFilter = onCountryFilterChange ?? setLocalCountry
  const setDeadlineFilter = onDeadlineFilterChange ?? setLocalDeadline
  const setSearchText = onSearchTextChange ?? setLocalSearch
  const setSortBy = onSortByChange ?? setLocalSort
  const setViewMode = onViewModeChange ?? setLocalView

  // Organization options — derived from full dataset so non-empty facets are
  // never hidden by the active body-type tab.
  const orgItems = useMemo(() => {
    const orgs = new Set<string>()
    for (const fw of complianceFrameworks) {
      if (fw.enforcementBody) orgs.add(fw.enforcementBody)
    }
    return [
      { id: 'All', label: 'All Organizations' },
      ...[...orgs].sort().map((o) => ({ id: o, label: o })),
    ]
  }, [])

  // Industry options — derived from full dataset (union of fw.industries),
  // which in this CSV are NAICS 2-digit sector codes (e.g. "52", "92"). We
  // render the human-readable label via NAICS_LABELS and fall back to the
  // raw code only when no label is registered, so users never see bare
  // numbers in the dropdown. If the active industryFilter isn't in the
  // vocabulary (e.g. seeded from a cross-page persona/URL using a different
  // taxonomy like "Finance & Banking"), include it anyway so the dropdown
  // surfaces the active value instead of falling back to "Industry".
  const industryItems = useMemo(() => {
    const inds = new Set<string>()
    for (const fw of complianceFrameworks) {
      for (const i of fw.industries) inds.add(i)
    }
    if (industryFilter !== 'All' && !inds.has(industryFilter)) {
      inds.add(industryFilter)
    }
    const labelFor = (code: string) => {
      // eslint-disable-next-line security/detect-object-injection
      const label = NAICS_LABELS[code]
      return label ? `${label} (${code})` : code
    }
    return [
      { id: 'All', label: 'All Industries' },
      ...[...inds]
        .sort((a, b) => labelFor(a).localeCompare(labelFor(b)))
        .map((i) => ({ id: i, label: labelFor(i) })),
    ]
  }, [industryFilter])

  // Region options — derived from full dataset with per-region counts so the
  // facet always lists every populated region (e.g. Africa) regardless of the
  // active body-type tab. The "All" label still reflects the in-tab count for
  // the user's current view.
  const regionItems = useMemo(() => {
    const counts = new Map<RegionBloc, number>()
    for (const fw of complianceFrameworks) {
      const seen = new Set<RegionBloc>()
      for (const c of fw.countries) {
        const r = regionForCountry(c)
        if (!seen.has(r)) {
          counts.set(r, (counts.get(r) ?? 0) + 1)
          seen.add(r)
        }
      }
    }
    const ordered = REGION_BLOC_ORDER.filter((r) => counts.has(r))
    return [
      { id: 'All', label: `All Regions (${sourceFrameworks.length})` },
      ...ordered.map((r) => ({ id: r, label: `${r} (${counts.get(r) ?? 0})` })),
    ]
  }, [sourceFrameworks.length])

  // Country options — derived from full dataset, sorted alphabetically with per-country
  // counts. Multi-country frameworks contribute to each tagged country's count.
  const countryItems = useMemo(() => {
    const counts = new Map<string, number>()
    for (const fw of complianceFrameworks) {
      const seen = new Set<string>()
      for (const c of fw.countries) {
        const trimmed = c.trim()
        if (!trimmed || seen.has(trimmed)) continue
        counts.set(trimmed, (counts.get(trimmed) ?? 0) + 1)
        seen.add(trimmed)
      }
    }
    const sorted = [...counts.keys()].sort()
    return [
      { id: 'All', label: 'All Countries' },
      ...sorted.map((c) => ({ id: c, label: `${c} (${counts.get(c) ?? 0})` })),
    ]
  }, [])

  // Sort options as FilterDropdown items
  const sortItems = FRAMEWORK_SORT_OPTIONS.map((o) => ({ id: o.id, label: o.label }))

  // Deadline phase options
  const deadlineItems = DEADLINE_FILTER_OPTIONS.map((o) => ({ id: o.id, label: o.label }))

  // Apply user filters + sort (quick-filter toggles applied separately below)
  const baseFrameworks = useMemo(() => {
    let result = [...sourceFrameworks]

    if (orgFilter !== 'All') {
      result = result.filter((fw) => fw.enforcementBody === orgFilter)
    }
    if (industryFilter !== 'All') {
      result = result.filter((fw) => fw.industries.includes(industryFilter))
    }
    if (regionFilter !== 'All') {
      result = result.filter((fw) => fw.countries.some((c) => regionForCountry(c) === regionFilter))
    }
    if (countryFilter !== 'All') {
      result = result.filter((fw) => fw.countries.some((c) => c.trim() === countryFilter))
    }
    if (deadlineFilter !== 'All') {
      result = result.filter((fw) => fw.deadlinePhase === deadlineFilter)
    }
    if (searchFilterText.trim()) {
      const q = searchFilterText.toLowerCase()
      result = result.filter((fw) => {
        const lexicalMatch =
          fw.label.toLowerCase().includes(q) ||
          fw.description.toLowerCase().includes(q) ||
          fw.enforcementBody.toLowerCase().includes(q)
        if (lexicalMatch) return true
        // Semantic supplement — chunkToResource maps compliance chunks
        // by metadata.id. Framework `fw.id` is the same key.
        if (semanticIdSet && semanticIdSet.has(fw.id.toLowerCase())) return true
        return false
      })
    }
    if (showOnlyMine) {
      result = result.filter((fw) => myFrameworks.includes(fw.id))
    }

    return sortFrameworks(result, sortBy)
  }, [
    sourceFrameworks,
    orgFilter,
    industryFilter,
    regionFilter,
    countryFilter,
    deadlineFilter,
    searchFilterText,
    semanticIdSet,
    sortBy,
    showOnlyMine,
    myFrameworks,
  ])

  // Quick-filter toggles applied on top of base result
  const displayedFrameworks = useMemo(() => {
    if (pqcRequiredOnly) return baseFrameworks.filter((f) => f.requiresPQC)
    if (hasDeadlineOnly) return baseFrameworks.filter((f) => extractYear(f.deadline) !== null)
    return baseFrameworks
  }, [baseFrameworks, pqcRequiredOnly, hasDeadlineOnly])

  // Stats — always reflect what's currently visible in the grid
  const pqcCount = displayedFrameworks.filter((f) => f.requiresPQC).length
  const deadlineCount = displayedFrameworks.filter((f) => extractYear(f.deadline) !== null).length

  // Scroll to and briefly highlight a framework when deep-linked via ?framework=<id>
  const prevHighlightRef = useRef<string | null | undefined>(undefined)
  useEffect(() => {
    if (!highlightFrameworkId || highlightFrameworkId === prevHighlightRef.current) return
    prevHighlightRef.current = highlightFrameworkId
    const el = document.getElementById(`fw-${highlightFrameworkId}`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [highlightFrameworkId])

  return (
    <div className="space-y-4">
      {/* Summary stats — PQC and Deadlines panels are clickable filter toggles */}
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <div className="glass-panel px-4 py-2 flex items-center gap-2 select-none">
          <span className="text-2xl font-bold text-foreground">{displayedFrameworks.length}</span>
          <span className="text-muted-foreground">
            {pqcRequiredOnly || hasDeadlineOnly ? 'Shown' : 'Entries'}
          </span>
        </div>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setPqcRequiredOnly((v) => !v)
            setHasDeadlineOnly(false)
          }}
          className={`glass-panel px-4 py-2 flex items-center gap-2 h-auto text-sm rounded-lg transition-all ${
            pqcRequiredOnly
              ? 'ring-2 ring-status-success/40 bg-status-success/5'
              : 'hover:bg-status-success/5'
          }`}
          title={pqcRequiredOnly ? 'Clear PQC filter' : 'Show only PQC-required entries'}
          aria-pressed={pqcRequiredOnly}
        >
          <ShieldCheck size={16} className="text-status-success" />
          <span className="text-2xl font-bold text-foreground">{pqcCount}</span>
          <span className="text-muted-foreground">Require PQC</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setHasDeadlineOnly((v) => !v)
            setPqcRequiredOnly(false)
          }}
          className={`glass-panel px-4 py-2 flex items-center gap-2 h-auto text-sm rounded-lg transition-all ${
            hasDeadlineOnly
              ? 'ring-2 ring-status-warning/40 bg-status-warning/5'
              : 'hover:bg-status-warning/5'
          }`}
          title={
            hasDeadlineOnly ? 'Clear deadline filter' : 'Show only entries with explicit deadlines'
          }
          aria-pressed={hasDeadlineOnly}
        >
          <Clock size={16} className="text-status-warning" />
          <span className="text-2xl font-bold text-foreground">{deadlineCount}</span>
          <span className="text-muted-foreground">Explicit Deadlines</span>
        </Button>
        {tierFilter.length > 0 && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Info size={11} className="text-status-info shrink-0" />
            Trust tier filter active — some entries are hidden.
          </p>
        )}
      </div>

      {/* Timeline visualization (desktop only) — only when showDeadlineTimeline=true */}
      {showDeadlineTimeline && (
        <div className="hidden md:block">
          <DeadlineTimeline frameworks={displayedFrameworks} />
        </div>
      )}

      {/* Filter band — primary controls always visible; org · industry · country behind "More" */}
      <div className="bg-card border border-border rounded-lg shadow-sm p-2 space-y-2">
        {/* Primary row */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[160px]">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              type="text"
              placeholder="Search standards..."
              aria-label="Search compliance entries"
              value={searchInputVal}
              onChange={(e) => setSearchText(e.target.value)}
              className="bg-muted/30 hover:bg-muted/50 border border-border rounded-lg pl-8 pr-4 py-1.5 text-xs focus:outline-none focus:border-primary/50 w-full transition-colors text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Region */}
          <div className="flex items-center gap-1 flex-none">
            <FilterDropdown
              items={regionItems}
              selectedId={regionFilter}
              onSelect={(id) => setRegionFilter(id as RegionBloc | 'All')}
              defaultLabel="Region"
              noContainer
              opaque
            />
            {regionFilter !== 'All' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRegionFilter('All')}
                className="h-auto py-1 px-2 text-xs bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
                aria-label="Clear region filter"
              >
                All
              </Button>
            )}
          </div>

          {/* Deadline */}
          <div className="flex items-center gap-1 flex-none">
            <FilterDropdown
              items={deadlineItems}
              selectedId={deadlineFilter}
              onSelect={(id) => setDeadlineFilter(id as 'All' | DeadlinePhase)}
              defaultLabel="Deadline"
              noContainer
              opaque
            />
            {deadlineFilter !== 'All' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeadlineFilter('All')}
                className="h-auto py-1 px-2 text-xs bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
                aria-label="Clear deadline filter"
              >
                All
              </Button>
            )}
          </div>

          {/* More Filters toggle */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowMoreFilters((v) => !v)}
            className={`h-auto text-xs px-3 py-1.5 border font-medium whitespace-nowrap ${
              showMoreFilters || secondaryFilterCount > 0
                ? 'border-primary/30 bg-primary/10 text-primary'
                : 'border-border bg-muted/30 text-muted-foreground hover:text-foreground hover:border-primary/30'
            }`}
            aria-expanded={showMoreFilters}
          >
            <SlidersHorizontal size={12} />
            {secondaryFilterCount > 0 ? `Filters (${secondaryFilterCount})` : 'More'}
          </Button>

          {/* Right-side controls */}
          <div className="flex items-center gap-2 ml-auto">
            {viewMode === 'cards' && (
              <FilterDropdown
                items={sortItems}
                selectedId={sortBy}
                onSelect={(id) => setSortBy(id as FrameworkSortOption)}
                defaultLabel="Sort"
                noContainer
                opaque
              />
            )}
            <ViewToggle mode={viewMode} onChange={setViewMode} />
            {myFrameworks.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowOnlyMine(!showOnlyMine)}
                className={`h-auto text-xs px-3 py-1.5 border font-medium whitespace-nowrap ${
                  showOnlyMine
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-muted/30 text-muted-foreground hover:text-foreground hover:border-primary/30'
                }`}
                aria-pressed={showOnlyMine}
              >
                <BookmarkCheck size={12} />
                My ({myFrameworks.length})
              </Button>
            )}
          </div>
        </div>

        {/* Secondary row — org · industry · country (collapsed by default;
            always shown when any secondary filter is active so users can see
            what's applied even if the toggle is closed). */}
        {(showMoreFilters || secondaryFilterCount > 0) && (
          <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-border/50 animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="flex-1 basis-[calc(33%-0.5rem)] min-w-[130px]">
              <FilterDropdown
                items={orgItems}
                selectedId={orgFilter}
                onSelect={setOrgFilter}
                defaultLabel="Organization"
                noContainer
                opaque
              />
            </div>
            <div className="flex items-center gap-1 flex-1 basis-[calc(33%-0.5rem)] min-w-0">
              <div className="flex-1 min-w-[130px]">
                <FilterDropdown
                  items={industryItems}
                  selectedId={industryFilter}
                  onSelect={setIndustryFilter}
                  defaultLabel="Industry"
                  noContainer
                  opaque
                />
              </div>
              {industryFilter !== 'All' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIndustryFilter('All')}
                  className="h-auto py-1 px-2 text-xs bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
                  aria-label="Clear industry filter"
                >
                  All
                </Button>
              )}
            </div>
            <div className="flex items-center gap-1 flex-1 basis-[calc(33%-0.5rem)] min-w-0">
              <div className="flex-1 min-w-[130px]">
                <FilterDropdown
                  items={countryItems}
                  selectedId={countryFilter}
                  onSelect={setCountryFilter}
                  defaultLabel="Country"
                  noContainer
                  opaque
                />
              </div>
              {countryFilter !== 'All' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCountryFilter('All')}
                  className="h-auto py-1 px-2 text-xs bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
                  aria-label="Clear country filter"
                >
                  All
                </Button>
              )}
            </div>
            {secondaryFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setOrgFilter('All')
                  setIndustryFilter('All')
                  setCountryFilter('All')
                }}
                className="ml-auto h-auto py-1 px-2 text-xs text-muted-foreground hover:text-foreground whitespace-nowrap"
              >
                Clear secondary
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Region context — short paragraph explaining what PQC governance looks
          like in the selected bloc. Shown only when a region is selected so it
          doesn't compete with the page-level intro when the user is exploring
          the full landscape. */}
      {regionFilter !== 'All' && <RegionContextCard region={regionFilter} />}

      {/* Semantic search hint — surfaces when embedding-driven matches augment the lexical filter */}
      <SemanticSearchHint
        mode={semantic.mode}
        loading={semantic.loading}
        query={searchFilterText}
        semanticHitCount={semantic.hits.length}
        noun="related frameworks"
      />

      {/* Content */}
      {viewMode === 'cards' ? (
        displayedFrameworks.length === 0 ? (
          <div className="glass-panel p-8 text-center text-muted-foreground space-y-2">
            <p>No entries match your current selection.</p>
            {searchFilterText.trim() && semantic.loading && (
              <p className="text-xs text-muted-foreground/70">
                Semantic search is still loading — results may update in a moment.
              </p>
            )}
            {searchFilterText.trim() && !semantic.loading && semantic.mode === 'semantic' && (
              <p className="text-xs text-muted-foreground/70">
                Neither keyword nor semantic matching found a framework for &ldquo;
                {searchFilterText.trim()}&rdquo;. Try rephrasing, or clear a Region or Deadline
                filter to widen the scope.
              </p>
            )}
            {searchFilterText.trim() && !semantic.loading && semantic.mode === 'lexical' && (
              <p className="text-xs text-muted-foreground/70">
                No keyword match for &ldquo;{searchFilterText.trim()}&rdquo;. Semantic search is not
                yet available — try different terms, or clear a filter.
              </p>
            )}
            {!searchFilterText.trim() && (
              <p className="text-xs">
                Try clearing a Region, Deadline, or type filter to widen the results.
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {displayedFrameworks.map((fw) => (
              <FrameworkCard
                key={fw.id}
                fw={fw}
                maturityByRefId={maturityByRefId}
                onNavigateToCswp39={onNavigateToCswp39}
                onSelectDetail={onSelectFramework}
                highlighted={highlightFrameworkId === fw.id}
              />
            ))}
          </div>
        )
      ) : (
        <FrameworkTable frameworks={displayedFrameworks} />
      )}
    </div>
  )
}
