// SPDX-License-Identifier: AGPL-3.0-only
import React, { useMemo, useCallback, useEffect, useState, useRef } from 'react'
import { isExecutiveBankOverview } from '@/components/Simulation/autorun/autoRunFill'
import {
  bankRoadmapMilestones,
  BANK_CASE_NOTE,
} from '@/components/Simulation/autorun/executiveBankCase'
import { useSimulationStore } from '@/store/useSimulationStore'
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

/** How the timeline data classifies a milestone's force. */
export type MilestoneStatus =
  | 'binding'
  | 'mandatory_for_scope'
  | 'official_target'
  | 'recommendation'
  | 'draft'
  | 'informational'
  | 'unclassified'

export const MILESTONE_STATUS_LABEL: Record<MilestoneStatus, string> = {
  binding: 'Binding',
  mandatory_for_scope: 'Mandatory for its stated scope',
  official_target: 'Official target (planning)',
  recommendation: 'Recommendation / guidance',
  draft: 'Draft',
  informational: 'Informational',
  unclassified: 'Not classified',
}

/**
 * A timeline milestone a planner can pull into a roadmap. It keeps its own
 * issuer, document type and binding status, so a policy publication, an
 * advisory target and a binding scoped deadline stay distinct. `source` is the
 * jurisdiction the timeline files it under (it is not an applicability test).
 */
export interface ExternalMilestone extends ExternalDeadline {
  issuer?: string
  kind?: string
  status?: MilestoneStatus
  sourceUrl?: string
}

/** Binding status of a timeline event: the reviewed force when present, else the curated mandate type. */
export function milestoneStatus(ev: {
  bindingForce?: MilestoneStatus
  mandateType?: 'HARD' | 'SOFT' | 'DRAFT'
}): MilestoneStatus {
  if (ev.bindingForce) return ev.bindingForce
  if (ev.mandateType === 'HARD') return 'binding'
  if (ev.mandateType === 'SOFT') return 'recommendation'
  if (ev.mandateType === 'DRAFT') return 'draft'
  return 'unclassified'
}

const KIND_LABEL: Record<string, string> = {
  Deadline: 'Deadline',
  Regulation: 'Regulation',
  Policy: 'Policy publication',
}

export interface MitigationGatewayRow {
  asset: string
  gatewayProductId: string
  reason: string
  sunset: string
}

/** Extracted (07192026, Batch 2) so the simulation's real-tool doc generator
 *  renders THIS logic — the component's export memo delegates here. */
export function buildRoadmapMarkdown(
  selectedDeadlines: ExternalMilestone[],
  currentMilestones: RoadmapMilestone[],
  mitigations: MitigationGatewayRow[]
): string {
  const labelById = new Map(currentMilestones.map((m) => [m.id, m.label]))
  let md = '# PQC Migration Roadmap (Two-Track)\n\n'
  md += `Generated: ${new Date().toLocaleDateString()}\n\n`
  md += `_Built on the ${FRAMEWORK_NAME} ${FRAMEWORK_VERSION} — ${FRAMEWORK_AUTHOR} (${FRAMEWORK_LICENSE}). ${FRAMEWORK_URL}_\n\n`

  if (selectedDeadlines.length > 0) {
    md += '## External Milestones Selected For This Plan\n\n'
    md +=
      '| Year | Milestone | Jurisdiction | Issuer | Type | Status | Link |\n|------|-----------|--------------|--------|------|--------|------|\n'
    for (const d of [...selectedDeadlines].sort((a, b) => a.year - b.year)) {
      const status = MILESTONE_STATUS_LABEL[d.status ?? 'unclassified']
      md += `| ${d.year} | ${d.label} | ${d.source} | ${d.issuer || '—'} | ${d.kind || '—'} | ${status} | ${d.sourceUrl || '—'} |\n`
    }
    md +=
      "\n_These are the planner's own selections. A milestone applies only to the parties and systems in its stated scope, and a policy publication or advisory target is a planning input, not a legal deadline. Status is as classified in the timeline data; confirm applicability against the source document._\n\n"
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
  selectedDeadlines?: ExternalMilestone[]
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
  // Effective selection = legacy `myProducts` ∪ workbench `choice` picks (see
  // useSelectedProductIds' docstring). Reading `myProducts` alone here missed
  // every product a user actually picked via the Migration Workbench's Replace
  // tab (which only ever writes `choice`/`plan`, never `myProducts`).
  const myProductIdsBookmarked = useSelectedProductIds()
  const toggleMyProduct = useMigrateSelectionStore((s) => s.toggleMyProduct)

  // Map timeline milestones to ExternalMilestone[] format, keeping each one's
  // issuer, document type, binding status and source link.
  const externalDeadlines: ExternalMilestone[] = useMemo(() => {
    const deadlines: ExternalMilestone[] = []
    for (const country of countryDeadlines) {
      for (const body of country.bodies) {
        for (const event of body.events) {
          if (
            event.phase === 'Deadline' ||
            event.phase === 'Regulation' ||
            event.phase === 'Policy'
          ) {
            const milestone: ExternalMilestone = {
              label: event.title,
              year: event.endYear,
              source: country.countryName,
              issuer: event.orgName || body.name,
              kind: KIND_LABEL[event.phase] ?? event.phase,
              status: milestoneStatus(event),
            }
            if (event.sourceUrl) milestone.sourceUrl = event.sourceUrl
            deadlines.push(milestone)
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
  const sampleBank = isExecutiveBankOverview(useSimulationStore.getState().sector)
  const sampleTimelineRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!sampleBank) return
    const frame = requestAnimationFrame(() =>
      sampleTimelineRef.current?.scrollIntoView?.({ block: 'start' })
    )
    return () => cancelAnimationFrame(frame)
  }, [sampleBank])
  const seedMilestones = sampleBank
    ? bankRoadmapMilestones()
    : seedSource === 'saved'
      ? savedMilestones
      : seedSource === 'sim'
        ? simRoadmapMilestones
        : seedSource === 'assessment'
          ? assessmentMilestones
          : DEFAULT_MILESTONES
  const [currentMilestones, setCurrentMilestones] =
    React.useState<RoadmapMilestone[]>(seedMilestones)
  const [seededFrom, setSeededFrom] = React.useState<'saved' | 'sim' | 'assessment' | null>(
    sampleBank ? null : seedSource
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

  // Milestones: restore from a saved roadmap. Nothing is pre-selected from a
  // country: whether a milestone applies depends on its issuer's scope and on
  // your systems, so the planner selects each one explicitly.
  const initialSelectedDeadlines = useMemo<ExternalMilestone[]>(() => {
    if (sampleBank) return []
    if (Array.isArray(savedRoadmap?.selectedDeadlines)) return savedRoadmap.selectedDeadlines
    return []
  }, [sampleBank, savedRoadmap])
  const [selectedDeadlines, setSelectedDeadlines] =
    React.useState<ExternalMilestone[]>(initialSelectedDeadlines)

  const deadlineKey = (d: ExternalMilestone) => `${d.label}-${d.year}-${d.source}`
  const toggleDeadline = (d: ExternalMilestone) =>
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
    const bySource = new Map<string, ExternalMilestone[]>()
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
    !sampleBank && Array.isArray(savedRoadmap?.mitigations) ? savedRoadmap.mitigations : []
  )
  const addMitigation = () =>
    setMitigations((prev) => [...prev, { asset: '', gatewayProductId: '', reason: '', sunset: '' }])
  const updateMitigation = (idx: number, patch: Partial<MitigationGatewayRow>) =>
    setMitigations((prev) => prev.map((row, i) => (i === idx ? { ...row, ...patch } : row)))
  const removeMitigation = (idx: number) =>
    setMitigations((prev) => prev.filter((_, i) => i !== idx))

  const yearRange = useMemo<[number, number]>(() => {
    if (sampleBank) {
      const years = bankRoadmapMilestones().map((item) => item.year)
      return [Math.min(...years), Math.max(...years)]
    }
    return [2025, Math.max(2036, new Date().getFullYear() + 10)]
  }, [sampleBank])

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
          summary={`${assessmentMilestones.length} milestone${assessmentMilestones.length !== 1 ? 's' : ''} from your reported algorithms, split into Track A (key-exchange) and Track B (signatures) and anchored on the deprecation dates in NIST IR 8547 (final, October 2026).`}
          onClear={() => {
            setCurrentMilestones(DEFAULT_MILESTONES)
            setSeededFrom(null)
          }}
        />
      )}

      <div className="glass-panel p-4">
        <p className="text-sm text-foreground mb-1">
          A PQC migration is easier to plan through{' '}
          <span className="font-semibold">two lenses</span> on the framework&apos;s shared phase
          spine, not one linear list:
        </p>
        <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-0.5">
          <li>
            <span className="font-medium text-foreground">Track A (Confidentiality / KEM)</span> —
            data that must stay secret over its lifetime. Harvest-Now-Decrypt-Later (HNDL) means
            ciphertext captured today can be exposed later, so exposure builds up now.
          </li>
          <li>
            <span className="font-medium text-foreground">
              Track B (Integrity / Signatures &amp; PKI)
            </span>{' '}
            — signatures have no equivalent passive harvest step, since a forgery needs a quantum
            computer to exist first. But replacing signing keys, trust anchors and verifiers has the
            longest lead time, so the work should start now, and any signature deadline or
            dependency you already have keeps its own date.
          </li>
        </ul>
        <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
          Gates G0→G3 (mandate → inventory → CBOM → risk scoring) are a shared governance spine both
          tracks pass through together, producing the prioritized backlog and approved roadmap (G4)
          they then execute against. In the sample below the two lenses are drawn as separate tasks
          after G4, but a real estate shares components, people and test environments across them.
          Map the shared components, resources and dependencies for each service, and add
          cross-track dependencies where they exist (for example, a hybrid key-exchange pilot that
          needs a re-issued intermediate CA). The sample shows Track A piloting hybrid key exchange
          (G5) while Track B first migrates code-signing algorithms (also G5) before later
          re-issuing PKI root/intermediate CAs (G6); it does not mean the tracks are independent in
          every estate.
        </p>
      </div>

      {sampleBank && (
        <p className="rounded-lg border border-primary/30 p-3 text-xs text-muted-foreground">
          {BANK_CASE_NOTE}
        </p>
      )}
      {/* Regulatory deadline selector */}
      {externalDeadlines.length > 0 && (
        <div className="glass-panel p-4 space-y-3">
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">
              This list mixes policy publications, advisory targets, and binding deadlines, each
              with its own issuer and scope. A country listing does not tell you which apply to you:
              select only the milestones whose issuer and scope cover your systems. For example, US
              federal items derive from{' '}
              <a
                href="https://www.federalregister.gov/documents/2026/06/25/2026-12909/securing-the-nation-against-advanced-cryptographic-attacks"
                target="_blank"
                rel="noopener noreferrer"
                // `underline`, not `hover:underline`: this link sits inside a
                // paragraph, so colour alone is not a sufficient affordance
                // (axe link-in-text-block / WCAG 1.4.1).
                className="text-primary underline"
              >
                Executive Order 14412, &ldquo;Securing the Nation Against Advanced Cryptographic
                Attacks&rdquo;
              </a>{' '}
              (June 22, 2026), which directs federal agencies to transition their High Value Assets
              and high impact systems (excluding National Security Systems) to PQC for key
              establishment by December 31, 2030, and for digital signatures by December 31, 2031.
              It directs those agencies; it is not a deadline for other organizations.
            </p>
          </div>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-sm font-medium text-foreground">
              External milestones ({selectedDeadlines.length}/{externalDeadlines.length} selected)
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
                          title={[
                            d.issuer,
                            d.kind,
                            MILESTONE_STATUS_LABEL[d.status ?? 'unclassified'],
                            d.sourceUrl,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                          className={`h-auto rounded px-2 py-0.5 text-[11px] border font-normal ${
                            on
                              ? 'bg-primary/15 border-primary/40 text-primary'
                              : 'bg-background border-border text-muted-foreground'
                          }`}
                        >
                          {d.year} · {d.label} ·{' '}
                          <span className="italic">
                            {MILESTONE_STATUS_LABEL[d.status ?? 'unclassified']}
                          </span>
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

      <div ref={sampleTimelineRef} data-testid="roadmap-timeline">
        <TwoTrackRoadmapTimeline
          milestones={currentMilestones}
          deadlines={selectedDeadlines}
          yearRange={yearRange}
          onChange={setCurrentMilestones}
        />
      </div>

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
          the external milestones you selected (with issuer, type, and status), and mitigation
          gateways.
        </p>
      </ExportableArtifact>
    </div>
  )
}
