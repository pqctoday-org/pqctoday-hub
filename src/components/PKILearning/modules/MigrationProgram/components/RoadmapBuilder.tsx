// SPDX-License-Identifier: GPL-3.0-only
import React, { useMemo, useCallback, useEffect, useState } from 'react'
import { useModuleStore } from '@/store/useModuleStore'
import { useExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import { useAlgorithmTransitionsForAssessment } from '@/hooks/useAlgorithmTransitionsForAssessment'
import { useMigrateSelectionStore, useSelectedProductIds } from '@/store/useMigrateSelectionStore'
import { softwareData } from '@/data/migrateData'
import { Button } from '@/components/ui/button'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { ExportableArtifact } from '../../../common/executive'
import type { ExternalDeadline } from '../../../common/executive'
import { PreFilledBanner } from '@/components/BusinessCenter/widgets/PreFilledBanner'
import type { SimRoadmapInput } from '@/simulation/simRoadmap'
import { useBookmarkStore } from '@/store/useBookmarkStore'
import {
  FRAMEWORK_PHASES,
  FRAMEWORK_AUTHOR,
  FRAMEWORK_LICENSE,
  FRAMEWORK_NAME,
  FRAMEWORK_URL,
  FRAMEWORK_VERSION,
  PHASE_ORDER,
  type PhaseId,
} from '@/data/frameworkPhases'
import { TwoTrackRoadmapTimeline } from './TwoTrackRoadmapTimeline'
import {
  TRACK_META,
  TRACK_ORDER,
  criticalPathLength,
  trackForFunction,
  type RoadmapMilestone,
} from './roadmapTracks'
import type { RoadmapOutput } from '../types'

export interface MitigationGatewayRow {
  asset: string
  gatewayProductId: string
  reason: string
  sunset: string
}

/** Extracted (07192026, Batch 2) so the simulation's real-tool doc generator
 *  renders THIS logic — the component's export memo delegates here. */
export function buildRoadmapMarkdown(
  selectedDeadlines: ExternalDeadline[],
  currentMilestones: RoadmapMilestone[],
  mitigations: MitigationGatewayRow[]
): string {
  const labelById = new Map(currentMilestones.map((m) => [m.id, m.label]))
  let md = '# PQC Migration Roadmap (Two-Track)\n\n'
  md += `Generated: ${new Date().toLocaleDateString()}\n\n`
  md += `_Built on the ${FRAMEWORK_NAME} ${FRAMEWORK_VERSION} — ${FRAMEWORK_AUTHOR} (${FRAMEWORK_LICENSE}). ${FRAMEWORK_URL}_\n\n`

  if (selectedDeadlines.length > 0) {
    md += '## External Regulatory Deadlines\n\n'
    md += '| Year | Deadline | Source |\n|------|----------|--------|\n'
    for (const d of [...selectedDeadlines].sort((a, b) => a.year - b.year)) {
      md += `| ${d.year} | ${d.label} | ${d.source} |\n`
    }
    md += '\n'
  }

  // Per-track milestones — the framework's parallel-workstream structure.
  for (const track of TRACK_ORDER) {
    const laneMs = currentMilestones
      .filter((m) => m.track === track)
      .sort((a, b) => a.year - b.year)
    if (laneMs.length === 0) continue
    const meta = TRACK_META[track]
    md += `## ${meta.label}\n\n`
    md += `_${meta.focus} — ${meta.rationale}_\n\n`
    md +=
      '| Year | Phase · Gate | Milestone | Depends on |\n|------|------|-----------|------------|\n'
    for (const m of laneMs) {
      const deps = (m.dependsOn ?? []).map((d) => labelById.get(d) ?? d).join('; ') || '—'
      md += `| ${m.year} | ${phaseGateTag(m.phaseId)} | ${m.label} | ${deps} |\n`
    }
    md += '\n'
  }

  // Gate table for the phases present.
  const phasesUsed = [...new Set(currentMilestones.map((m) => m.phaseId))].sort(
    (a, b) => PHASE_ORDER.indexOf(a) - PHASE_ORDER.indexOf(b)
  )
  if (phasesUsed.length > 0) {
    md += '## Milestone Gates\n\n'
    md += '| Gate | Phase | Criterion | Sign-off |\n|------|-------|-----------|----------|\n'
    for (const pid of phasesUsed) {
      const p = FRAMEWORK_PHASES[pid]
      if (!p.gate) continue
      md += `| ${p.gate.id} | ${p.name} | ${p.gate.criterion} | ${p.gate.authority} |\n`
    }
    md += '\n'
  }

  md += `**Critical path:** ${criticalPathLength(currentMilestones)} milestones deep (longest dependency chain).\n\n`

  // CSWP.39 §4.6 — Mitigation Gateway specs (with mandatory sunset date).
  md += '## Mitigation Gateway (CSWP.39 §4.6)\n\n'
  if (mitigations.length === 0) {
    md +=
      '_No mitigation gateways specified. CSWP.39 §4.6 frames a crypto gateway as an architectural fix for legacy systems that cannot be modified directly, not a substitute for migrating the algorithm inside them — every mitigation requires a sunset date._\n\n'
  } else {
    md += '| Asset | Gateway product | Reason | Sunset |\n|---|---|---|---|\n'
    for (const m of mitigations) {
      const gateway =
        softwareData.find((p) => p.productId === m.gatewayProductId)?.softwareName ||
        m.gatewayProductId ||
        '—'
      md += `| ${m.asset || '—'} | ${gateway} | ${m.reason || '—'} | ${m.sunset || '⚠ MISSING'} |\n`
    }
    md += '\n'
  }

  return md
}

const MODULE_ID = 'migration-program'

/**
 * A teaching default that shows the framework's real shape: a governance spine
 * (P0→P3) that both technical tracks depend on, then Track A (confidentiality /
 * KEM) and Track B (integrity / signatures-PKI) running in parallel.
 * Exported (07192026, Batch 2) for the simulation's real-tool doc generator —
 * the sim's sample roadmap IS the tool's own teaching default.
 */
export const DEFAULT_MILESTONES: RoadmapMilestone[] = [
  {
    id: 'def-mandate',
    label: 'Executive mandate & budget approved',
    year: 2026,
    phaseId: 'p0',
    track: 'program',
  },
  {
    id: 'def-inventory',
    label: 'Cryptographic inventory complete',
    year: 2026,
    phaseId: 'p1',
    track: 'program',
  },
  {
    id: 'def-cbom',
    label: 'CBOM published (machine-verifiable)',
    year: 2027,
    phaseId: 'p2',
    track: 'program',
    dependsOn: ['def-inventory'],
  },
  {
    id: 'def-qra',
    label: 'Risk scoring & QRA delivered',
    year: 2027,
    phaseId: 'p3',
    track: 'program',
    dependsOn: ['def-cbom'],
  },
  {
    id: 'def-kem-pilot',
    label: 'Pilot ML-KEM hybrid in TLS',
    year: 2027,
    phaseId: 'p5',
    track: 'A',
    dependsOn: ['def-qra'],
  },
  {
    id: 'def-kem-vpn',
    label: 'Migrate VPN / IPsec key exchange',
    year: 2028,
    phaseId: 'p5',
    track: 'A',
    dependsOn: ['def-kem-pilot'],
  },
  {
    id: 'def-sig-codesign',
    label: 'Migrate code/firmware signing to ML-DSA',
    year: 2028,
    phaseId: 'p5',
    track: 'B',
    dependsOn: ['def-qra'],
  },
  {
    id: 'def-sig-pki',
    label: 'Re-issue root / intermediate CAs (PQC)',
    year: 2030,
    phaseId: 'p6',
    track: 'B',
    dependsOn: ['def-sig-codesign'],
  },
]

/**
 * Parse the Year out of a transition CSV deprecation/standardization date.
 * Formats like "2030 (Deprecated) / 2035 (Disallowed)" or "2024 (FIPS 203)" or
 * just "2030". Returns the FIRST 4-digit year.
 */
function extractYear(raw: string): number | null {
  const m = raw.match(/(20\d{2})/)
  return m ? Number(m[1]) : null
}

const isPhaseId = (s: string): s is PhaseId => (PHASE_ORDER as string[]).includes(s)

/** Shape guard for a persisted milestone (restored from a saved roadmap's `inputs`). */
function isValidMilestone(m: unknown): m is RoadmapMilestone {
  if (!m || typeof m !== 'object') return false
  const x = m as Record<string, unknown>
  return (
    typeof x.id === 'string' &&
    typeof x.label === 'string' &&
    typeof x.year === 'number' &&
    (x.track === 'program' || x.track === 'A' || x.track === 'B') &&
    typeof x.phaseId === 'string' &&
    isPhaseId(x.phaseId as string)
  )
}

interface SavedRoadmapInputs {
  milestones?: unknown
  selectedDeadlines?: ExternalDeadline[]
  mitigations?: MitigationGatewayRow[]
}

/** Short "P3 · G3" style phase/gate tag for export. */
function phaseGateTag(id: PhaseId): string {
  const p = FRAMEWORK_PHASES[id]
  const label = p.number !== null ? `P${p.number}` : id === 'verify-close' ? 'V&C' : 'Foundations'
  return p.gate ? `${label} · ${p.gate.id}` : label
}

interface RoadmapBuilderProps {
  onOutput?: (output: RoadmapOutput) => void
}

export const RoadmapBuilder: React.FC<RoadmapBuilderProps> = ({ onOutput }) => {
  const { countryDeadlines, algorithmMigrations } = useExecutiveModuleData()
  const { addExecutiveDocument } = useModuleStore()
  const executiveDocuments = useModuleStore((s) => s.artifacts.executiveDocuments)
  const transitions = useAlgorithmTransitionsForAssessment()
  const myTimelineCountries = useBookmarkStore((s) => s.myTimelineCountries)
  // Effective selection = legacy `myProducts` ∪ workbench `choice` picks (see
  // useSelectedProductIds' docstring). Reading `myProducts` alone here missed
  // every product a user actually picked via the Migration Workbench's Replace
  // tab (which only ever writes `choice`/`plan`, never `myProducts`).
  const myProductIdsBookmarked = useSelectedProductIds()
  const toggleMyProduct = useMigrateSelectionStore((s) => s.toggleMyProduct)

  // Map country deadlines to ExternalDeadline[] format
  const externalDeadlines: ExternalDeadline[] = useMemo(() => {
    const deadlines: ExternalDeadline[] = []
    for (const country of countryDeadlines) {
      for (const body of country.bodies) {
        for (const event of body.events) {
          if (
            event.phase === 'Deadline' ||
            event.phase === 'Regulation' ||
            event.phase === 'Policy'
          ) {
            deadlines.push({ label: event.title, year: event.endYear, source: country.countryName })
          }
        }
      }
    }
    const seen = new Set<string>()
    return deadlines
      .filter((d) => {
        const key = `${d.label}-${d.year}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .sort((a, b) => a.year - b.year)
  }, [countryDeadlines])

  // Assessment-derived milestones: one per reported algorithm transition,
  // routed to Track A (KEM/confidentiality) or Track B (signature/integrity) by
  // the transition's `function`, anchored on the NIST deprecation year.
  const assessmentMilestones = useMemo<RoadmapMilestone[]>(() => {
    if (transitions.length === 0) return []
    return transitions.map((t, i) => {
      const year =
        extractYear(t.deprecationDate) ??
        extractYear(t.standardizationDate) ??
        (algorithmMigrations.find((m) => m.classical === t.classical)?.urgency === 'immediate'
          ? new Date().getFullYear() + 1
          : new Date().getFullYear() + 3)
      return {
        id: `assess-ms-${i + 1}`,
        label: `Migrate ${t.classical}${t.keySize ? ` (${t.keySize})` : ''} → ${t.pqc}`,
        year,
        phaseId: 'p5' as PhaseId,
        track: trackForFunction(t.function),
      }
    })
  }, [transitions, algorithmMigrations])

  // Seed from the latest committed Simulation roadmap (its UNCLEARED phases) →
  // the governance spine. Higher priority than the assessment-derived seed.
  const simRoadmapMilestones = useMemo<RoadmapMilestone[]>(() => {
    const latest = (executiveDocuments ?? [])
      .filter((d) => d.type === 'sim-roadmap' && d.inputs)
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))[0]
    const input = latest?.inputs as SimRoadmapInput | undefined
    const uncleared = input?.phases?.filter((p) => !p.cleared) ?? []
    if (uncleared.length === 0) return []
    const horizon = Math.max(1, input?.yearsToHorizon || uncleared.length)
    const thisYear = new Date().getFullYear()
    return uncleared.map((p, i) => ({
      id: `sim-ms-${p.id}`,
      label: `Clear ${p.name}`,
      year: thisYear + Math.max(1, Math.ceil(((i + 1) / uncleared.length) * horizon)),
      phaseId: isPhaseId(p.id) ? p.id : 'p4',
      track: 'program' as const,
    }))
  }, [executiveDocuments])

  // Restore the user's own last-saved roadmap (highest priority) so the plan is
  // round-trippable — this is the read-back half of persisting `inputs`.
  const savedRoadmap = useMemo<SavedRoadmapInputs | undefined>(() => {
    const latest = (executiveDocuments ?? [])
      .filter((d) => d.type === 'migration-roadmap' && d.inputs)
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))[0]
    return latest?.inputs as SavedRoadmapInputs | undefined
  }, [executiveDocuments])
  const savedMilestones = useMemo<RoadmapMilestone[]>(() => {
    const ms = savedRoadmap?.milestones
    return Array.isArray(ms) ? ms.filter(isValidMilestone) : []
  }, [savedRoadmap])

  const seedSource: 'saved' | 'sim' | 'assessment' | null =
    savedMilestones.length > 0
      ? 'saved'
      : simRoadmapMilestones.length > 0
        ? 'sim'
        : assessmentMilestones.length > 0
          ? 'assessment'
          : null
  const seedMilestones =
    seedSource === 'saved'
      ? savedMilestones
      : seedSource === 'sim'
        ? simRoadmapMilestones
        : seedSource === 'assessment'
          ? assessmentMilestones
          : DEFAULT_MILESTONES
  const [currentMilestones, setCurrentMilestones] =
    React.useState<RoadmapMilestone[]>(seedMilestones)
  const [seededFrom, setSeededFrom] = React.useState<'saved' | 'sim' | 'assessment' | null>(
    seedSource
  )

  // Structured output, shared by the live onOutput prop (linear wizard) and
  // the export below (`output:`, read back via useSavedArtifactOutput by
  // Stakeholder Comms Planner / KPI Tracker / Deployment Playbook when
  // they're reached outside that wizard — Simulation, Business Center).
  const roadmapOutputPayload: RoadmapOutput | null = useMemo(() => {
    if (currentMilestones.length === 0) return null
    const earliest = currentMilestones.reduce((min, m) => (m.year < min ? m.year : min), Infinity)
    return {
      milestones: currentMilestones.map((m) => ({
        label: m.label,
        year: m.year,
        phaseId: m.phaseId,
      })),
      earliestYear: isFinite(earliest) ? earliest : null,
    }
  }, [currentMilestones])

  useEffect(() => {
    if (onOutput && roadmapOutputPayload) onOutput(roadmapOutputPayload)
  }, [onOutput, roadmapOutputPayload])

  // Deadlines: restore from a saved roadmap, else pre-select from bookmarked countries.
  const initialSelectedDeadlines = useMemo<ExternalDeadline[]>(() => {
    if (Array.isArray(savedRoadmap?.selectedDeadlines)) return savedRoadmap.selectedDeadlines
    if (myTimelineCountries.length === 0) return []
    const set = new Set(myTimelineCountries.map((c) => c.toLowerCase()))
    return externalDeadlines.filter((d) => set.has(d.source.toLowerCase()))
  }, [savedRoadmap, myTimelineCountries, externalDeadlines])
  const [selectedDeadlines, setSelectedDeadlines] =
    React.useState<ExternalDeadline[]>(initialSelectedDeadlines)

  const deadlineKey = (d: ExternalDeadline) => `${d.label}-${d.year}-${d.source}`
  const toggleDeadline = (d: ExternalDeadline) =>
    setSelectedDeadlines((prev) =>
      prev.some((x) => deadlineKey(x) === deadlineKey(d))
        ? prev.filter((x) => deadlineKey(x) !== deadlineKey(d))
        : [...prev, d]
    )

  // Deadline browser: search text + country filter, grouped by source so 80+ entries
  // stay scannable instead of one giant unsorted wrap of chips.
  const [deadlineSearch, setDeadlineSearch] = useState('')
  const [deadlineCountryFilter, setDeadlineCountryFilter] = useState('')
  const deadlineCountries = useMemo(
    () => [...new Set(externalDeadlines.map((d) => d.source))].sort(),
    [externalDeadlines]
  )
  const deadlineGroups = useMemo(() => {
    const query = deadlineSearch.trim().toLowerCase()
    const filtered = externalDeadlines.filter((d) => {
      if (deadlineCountryFilter && d.source !== deadlineCountryFilter) return false
      if (!query) return true
      return (
        d.label.toLowerCase().includes(query) ||
        d.source.toLowerCase().includes(query) ||
        String(d.year).includes(query)
      )
    })
    const bySource = new Map<string, ExternalDeadline[]>()
    for (const d of filtered) {
      const group = bySource.get(d.source)
      if (group) group.push(d)
      else bySource.set(d.source, [d])
    }
    return [...bySource.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [externalDeadlines, deadlineSearch, deadlineCountryFilter])

  // CSWP.39 §4.6 — Mitigation gateway rows for assets where direct migration is blocked.
  // Same union as myProductIdsBookmarked above — a gateway product chosen via the
  // Workbench's Replace tab must show as already-selected here too.
  const myProductIds = useSelectedProductIds()
  const candidateGateways = useMemo(() => {
    const myProductSet = new Set(myProductIds)
    const isGatewayCategory = (cat: string) => /gateway|sase|zero[\s-]?trust|tls/i.test(cat || '')
    return softwareData
      .filter((p) => isGatewayCategory(p.categoryName))
      .map((p) => ({
        productId: p.productId,
        label: `${p.softwareName} (${p.categoryName})`,
        selected: myProductSet.has(p.productId),
      }))
      .sort((a, b) => Number(b.selected) - Number(a.selected) || a.label.localeCompare(b.label))
  }, [myProductIds])

  const [mitigations, setMitigations] = React.useState<MitigationGatewayRow[]>(
    Array.isArray(savedRoadmap?.mitigations) ? savedRoadmap.mitigations : []
  )
  const addMitigation = () =>
    setMitigations((prev) => [...prev, { asset: '', gatewayProductId: '', reason: '', sunset: '' }])
  const updateMitigation = (idx: number, patch: Partial<MitigationGatewayRow>) =>
    setMitigations((prev) => prev.map((row, i) => (i === idx ? { ...row, ...patch } : row)))
  const removeMitigation = (idx: number) =>
    setMitigations((prev) => prev.filter((_, i) => i !== idx))

  const yearRange = useMemo<[number, number]>(
    () => [2025, Math.max(2036, new Date().getFullYear() + 10)],
    []
  )

  const exportMarkdown = useMemo(
    () => buildRoadmapMarkdown(selectedDeadlines, currentMilestones, mitigations),
    [selectedDeadlines, currentMilestones, mitigations]
  )

  const handleExport = useCallback(() => {
    addExecutiveDocument({
      id: `migration-roadmap-${Date.now()}`,
      moduleId: MODULE_ID,
      type: 'migration-roadmap',
      title: 'PQC Migration Roadmap',
      data: exportMarkdown,
      // Persist the structured plan so the roadmap is restorable (C1 read-back).
      inputs: { milestones: currentMilestones, selectedDeadlines, mitigations },
      output: roadmapOutputPayload ?? undefined,
      createdAt: Date.now(),
    })
  }, [
    addExecutiveDocument,
    exportMarkdown,
    currentMilestones,
    selectedDeadlines,
    mitigations,
    roadmapOutputPayload,
  ])

  return (
    <div className="space-y-6">
      {seededFrom === 'saved' && (
        <PreFilledBanner
          summary={`Restored ${savedMilestones.length} milestone${savedMilestones.length !== 1 ? 's' : ''} from your last saved roadmap — edit and re-export to update it.`}
          onClear={() => {
            setCurrentMilestones(DEFAULT_MILESTONES)
            setSeededFrom(null)
          }}
        />
      )}
      {seededFrom === 'sim' && (
        <PreFilledBanner
          summary={`${simRoadmapMilestones.length} milestone${simRoadmapMilestones.length !== 1 ? 's' : ''} seeded from your latest Simulation run — refine the draft here.`}
          onClear={() => {
            setCurrentMilestones(DEFAULT_MILESTONES)
            setSeededFrom(null)
          }}
        />
      )}
      {seededFrom === 'assessment' && (
        <PreFilledBanner
          summary={`${assessmentMilestones.length} milestone${assessmentMilestones.length !== 1 ? 's' : ''} from your reported algorithms, split into Track A (key-exchange) and Track B (signatures) and anchored on NIST deprecation dates.`}
          onClear={() => {
            setCurrentMilestones(DEFAULT_MILESTONES)
            setSeededFrom(null)
          }}
        />
      )}

      <div className="glass-panel p-4">
        <p className="text-sm text-foreground mb-1">
          A PQC migration runs as <span className="font-semibold">two parallel tracks</span> on the
          framework&apos;s phase spine, not one linear list:
        </p>
        <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-0.5">
          <li>
            <span className="font-medium text-foreground">Track A (Confidentiality / KEM)</span> —
            urgent now because of Harvest-Now-Decrypt-Later (HNDL).
          </li>
          <li>
            <span className="font-medium text-foreground">
              Track B (Integrity / Signatures &amp; PKI)
            </span>{' '}
            — not urgent today but the longest lead time, so it must start early because of
            Trust-Now-Forge-Later (TNFL): forged signatures only matter once a quantum computer can
            forge them, but replacing signing keys and trust anchors takes years.
          </li>
        </ul>
        <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
          Gates G0→G3 (mandate → inventory → CBOM → risk scoring) are a shared governance spine both
          tracks pass through together, producing the prioritized backlog and approved roadmap (G4)
          they then execute against. From there the same phase/gate structure runs independently and
          in parallel per track, because the two tracks don&apos;t share deadlines or dependencies
          once execution begins. The illustrative milestones below show one example: Track A
          piloting hybrid key exchange (G5) while Track B first migrates code-signing algorithms
          (also G5) before later re-issuing PKI root/intermediate CAs (G6) — infrastructure work
          that only shows up once a roadmap actually reaches that stage.
        </p>
      </div>

      {/* Regulatory deadline selector */}
      {externalDeadlines.length > 0 && (
        <div className="glass-panel p-4 space-y-3">
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">
              US federal deadlines below derive from{' '}
              <a
                href="https://www.federalregister.gov/documents/2026/06/25/2026-12909/securing-the-nation-against-advanced-cryptographic-attacks"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Executive Order 14412, &ldquo;Securing the Nation Against Advanced Cryptographic
                Attacks&rdquo;
              </a>{' '}
              (June 22, 2026): High Value Assets and high-impact federal systems transition to PQC
              for key establishment by December 31, 2030, and digital signatures by December 31,
              2031.
            </p>
          </div>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-sm font-medium text-foreground">
              Regulatory deadlines ({selectedDeadlines.length}/{externalDeadlines.length} selected)
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="text"
                value={deadlineSearch}
                onChange={(e) => setDeadlineSearch(e.target.value)}
                placeholder="Search year, country, or name…"
                aria-label="Search regulatory deadlines"
                className="text-xs rounded-md border border-input bg-background px-2 py-1 w-56"
              />
              <FilterDropdown
                items={deadlineCountries}
                selectedId={deadlineCountryFilter}
                onSelect={setDeadlineCountryFilter}
                defaultLabel="All countries"
                searchable
                size="sm"
              />
            </div>
          </div>
          {deadlineGroups.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No deadlines match this filter.</p>
          ) : (
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {deadlineGroups.map(([source, group]) => (
                <div key={source}>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                    {source} ({group.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {group.map((d) => {
                      const on = selectedDeadlines.some((x) => deadlineKey(x) === deadlineKey(d))
                      return (
                        <Button
                          key={deadlineKey(d)}
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleDeadline(d)}
                          className={`h-auto rounded px-2 py-0.5 text-[11px] border font-normal ${
                            on
                              ? 'bg-status-error/15 border-status-error/40 text-status-error'
                              : 'bg-background border-border text-muted-foreground'
                          }`}
                        >
                          {d.year} · {d.label}
                        </Button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <TwoTrackRoadmapTimeline
        milestones={currentMilestones}
        deadlines={selectedDeadlines}
        yearRange={yearRange}
        onChange={setCurrentMilestones}
      />

      {/* CSWP.39 §4.6 — Mitigation Gateway specs */}
      <div className="glass-panel p-4 space-y-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Mitigation Gateways (CSWP.39 §4.6)
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              For assets where direct migration is blocked, document the gateway / bump-in-the-wire
              that mitigates the risk — every entry must carry a mandatory sunset date.
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addMitigation}>
            + Add mitigation
          </Button>
        </div>
        {mitigations.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No mitigations specified.</p>
        ) : (
          <div className="space-y-2">
            {mitigations.map((row, idx) => (
              <div key={idx} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-start">
                <input
                  type="text"
                  className="text-sm rounded-md border border-input bg-background p-2"
                  placeholder="Asset (e.g., legacy MQ)"
                  value={row.asset}
                  onChange={(e) => updateMitigation(idx, { asset: e.target.value })}
                  aria-label="Asset"
                />
                <div className="flex items-center gap-1">
                  <FilterDropdown
                    items={[
                      { id: '', label: '— Select gateway —' },
                      ...candidateGateways.map((g) => ({
                        id: g.productId,
                        label: `${g.selected ? '★ ' : ''}${g.label}`,
                      })),
                    ]}
                    selectedId={row.gatewayProductId}
                    onSelect={(id) => updateMitigation(idx, { gatewayProductId: id })}
                    size="sm"
                  />
                  {row.gatewayProductId && (
                    <Button
                      type="button"
                      variant={
                        myProductIdsBookmarked.includes(row.gatewayProductId)
                          ? 'secondary'
                          : 'outline'
                      }
                      size="sm"
                      className="h-7 px-2 text-[10px] shrink-0"
                      onClick={() => toggleMyProduct(row.gatewayProductId)}
                      title={
                        myProductIdsBookmarked.includes(row.gatewayProductId)
                          ? 'Remove from My Products'
                          : 'Add to My Products (saves on /migrate)'
                      }
                    >
                      {myProductIdsBookmarked.includes(row.gatewayProductId) ? '★ Mine' : '+ Mine'}
                    </Button>
                  )}
                </div>
                <input
                  type="text"
                  className="text-sm rounded-md border border-input bg-background p-2"
                  placeholder="Reason (why migration is blocked)"
                  value={row.reason}
                  onChange={(e) => updateMitigation(idx, { reason: e.target.value })}
                  aria-label="Reason"
                />
                <div className="flex gap-1">
                  <input
                    type="text"
                    required
                    className="text-sm rounded-md border border-input bg-background p-2 flex-1"
                    placeholder="Sunset (YYYY-MM-DD)"
                    value={row.sunset}
                    onChange={(e) => updateMitigation(idx, { sunset: e.target.value })}
                    aria-label="Sunset date"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeMitigation(idx)}
                    aria-label="Remove mitigation"
                    className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive"
                  >
                    ×
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ExportableArtifact
        title="Roadmap Export"
        exportData={exportMarkdown}
        filename="pqc-migration-roadmap"
        formats={['markdown', 'pdf']}
        wideTable
        onExport={handleExport}
      >
        <p className="text-sm text-muted-foreground">
          Export your two-track migration roadmap with per-track milestones, gates, dependencies,
          regulatory deadlines, and mitigation gateways.
        </p>
      </ExportableArtifact>
    </div>
  )
}
