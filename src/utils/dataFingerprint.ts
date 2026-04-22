// SPDX-License-Identifier: GPL-3.0-only
import { libraryData, type LibraryItem } from '../data/libraryData'
import { softwareData } from '../data/migrateData'
import { threatsData } from '../data/threatsData'
import { leadersData } from '../data/leadersData'
import { timelineData } from '../data/timelineData'
import { complianceFrameworks, complianceMetadata } from '../data/complianceData'
import { algorithmsData, loadedTransitionMetadata } from '../data/algorithmsData'
import { authoritativeSources, sourcesMetadata } from '../data/authoritativeSourcesData'
import { certificationXrefs, xrefMetadata } from '../data/certificationXrefData'
import { quizQuestions, quizMetadata } from '../data/quizDataLoader'
import type { DataSourceId } from '../store/useVersionStore'
import type { PersonaId } from '../data/learningPersonas'
import {
  PERSONA_LIBRARY_CATEGORIES,
  PERSONA_MIGRATE_LAYERS,
  INDUSTRY_TO_THREATS_MAP,
} from '../data/personaConfig'
import { PERSONAS } from '../data/learningPersonas'
import type { TimelineEvent } from '../types/timeline'
import { ALL_CHANGELOG_VERSIONS, type SectionType } from './changelogParser'
import type { RAGChunk } from '@/types/ChatTypes'

// ── Types ────────────────────────────────────────────────────────────────────

export interface DataChangeItem {
  id: string
  label: string
  status: 'New' | 'Updated'
  deepLink: string
  description?: string
  organization?: string
  date?: string
  tags?: string[]
}

export interface DataSourceSummary {
  sourceId: DataSourceId
  label: string
  iconName: string
  route: string
  newCount: number
  updatedCount: number
  items: DataChangeItem[]
}

// ── Source config ────────────────────────────────────────────────────────────

const SOURCE_CONFIG: Record<DataSourceId, { label: string; iconName: string; route: string }> = {
  library: { label: 'Library', iconName: 'BookOpen', route: '/library' },
  migrate: { label: 'Migration Catalog', iconName: 'ArrowRightLeft', route: '/migrate' },
  threats: { label: 'Threat Intelligence', iconName: 'AlertTriangle', route: '/threats' },
  timeline: { label: 'Timeline', iconName: 'Globe', route: '/timeline' },
  leaders: { label: 'Thought Leaders', iconName: 'Users', route: '/leaders' },
  compliance: { label: 'Compliance', iconName: 'AlertTriangle', route: '/compliance' },
  algorithms: { label: 'Algorithms', iconName: 'BookOpen', route: '/algorithms' },
  authoritativeSources: {
    label: 'Authoritative Sources',
    iconName: 'BookOpen',
    route: '/library',
  },
  certificationXref: {
    label: 'Certification Cross-References',
    iconName: 'ArrowRightLeft',
    route: '/migrate',
  },
  quiz: { label: 'Quiz Bank', iconName: 'BookOpen', route: '/learn/quiz' },
}

/**
 * For data sources that do not carry per-record `New`/`Updated` status fields,
 * emit a single synthetic "data refreshed" row keyed off the new CSV filename.
 * The row tells the user the source was refreshed and lets them deep-link to
 * the view; per-record diffing would require a build-time snapshot.
 */
function buildRefreshSummary(
  sourceId: DataSourceId,
  recordCount: number,
  filename: string | null
): DataSourceSummary {
  const config = SOURCE_CONFIG[sourceId] // eslint-disable-line security/detect-object-injection
  return {
    ...config,
    sourceId,
    newCount: 0,
    updatedCount: 1,
    items: [
      {
        id: `${sourceId}:refresh`,
        label: `${config.label} refreshed (${recordCount} records)`,
        status: 'Updated',
        deepLink: config.route,
        description: filename ? `Latest snapshot: ${filename}` : undefined,
      },
    ],
  }
}

// ── Summarisers per data source ─────────────────────────────────────────────

function getLibrarySummary(): DataSourceSummary {
  const changed = libraryData.filter(
    (i): i is LibraryItem & { status: 'New' | 'Updated' } =>
      i.status === 'New' || i.status === 'Updated'
  )
  return {
    ...SOURCE_CONFIG.library,
    sourceId: 'library',
    newCount: changed.filter((i) => i.status === 'New').length,
    updatedCount: changed.filter((i) => i.status === 'Updated').length,
    items: changed.map((i) => ({
      id: i.referenceId,
      label: i.documentTitle,
      status: i.status,
      deepLink: `/library?ref=${encodeURIComponent(i.referenceId)}`,
      description: i.shortDescription
        ? i.shortDescription.length > 100
          ? i.shortDescription.slice(0, 97) + '...'
          : i.shortDescription
        : undefined,
      organization: i.authorsOrOrganization || undefined,
      date: i.lastUpdateDate || undefined,
      tags: i.categories?.slice(0, 3),
    })),
  }
}

function getMigrateSummary(): DataSourceSummary {
  const changed = softwareData.filter((i) => i.status === 'New' || i.status === 'Updated')
  return {
    ...SOURCE_CONFIG.migrate,
    sourceId: 'migrate',
    newCount: changed.filter((i) => i.status === 'New').length,
    updatedCount: changed.filter((i) => i.status === 'Updated').length,
    items: changed.map((i) => ({
      id: i.softwareName,
      label: i.softwareName,
      status: i.status as 'New' | 'Updated',
      deepLink: `/migrate?q=${encodeURIComponent(i.softwareName)}`,
      description: i.pqcCapabilityDescription
        ? i.pqcCapabilityDescription.length > 100
          ? i.pqcCapabilityDescription.slice(0, 97) + '...'
          : i.pqcCapabilityDescription
        : undefined,
      organization: i.categoryName || undefined,
      date: i.releaseDate || undefined,
      tags: [i.infrastructureLayer, i.pqcMigrationPriority].filter(Boolean),
    })),
  }
}

function getThreatsSummary(): DataSourceSummary {
  const changed = threatsData.filter((i) => i.status === 'New' || i.status === 'Updated')
  return {
    ...SOURCE_CONFIG.threats,
    sourceId: 'threats',
    newCount: changed.filter((i) => i.status === 'New').length,
    updatedCount: changed.filter((i) => i.status === 'Updated').length,
    items: changed.map((i) => ({
      id: i.threatId,
      label: i.description.length > 80 ? i.description.slice(0, 77) + '...' : i.description,
      status: i.status as 'New' | 'Updated',
      deepLink: `/threats?id=${encodeURIComponent(i.threatId)}`,
      description: i.description.length > 100 ? i.description.slice(0, 97) + '...' : i.description,
      organization: i.mainSource || undefined,
      tags: [i.industry, i.criticality].filter(Boolean),
    })),
  }
}

function getLeadersSummary(): DataSourceSummary {
  const changed = leadersData.filter((i) => i.status === 'New' || i.status === 'Updated')
  return {
    ...SOURCE_CONFIG.leaders,
    sourceId: 'leaders',
    newCount: changed.filter((i) => i.status === 'New').length,
    updatedCount: changed.filter((i) => i.status === 'Updated').length,
    items: changed.map((i) => ({
      id: i.name,
      label: i.name,
      status: i.status as 'New' | 'Updated',
      deepLink: `/leaders?leader=${encodeURIComponent(i.name)}`,
      description: i.bio ? (i.bio.length > 100 ? i.bio.slice(0, 97) + '...' : i.bio) : undefined,
      organization: i.organizations?.[0] || undefined,
      tags: [i.type, i.category].filter(Boolean),
    })),
  }
}

function getTimelineSummary(): DataSourceSummary {
  // Flatten nested structure to get all events with status
  const allEvents: (TimelineEvent & { countryName: string })[] = []
  for (const country of timelineData) {
    for (const body of country.bodies) {
      for (const event of body.events) {
        if (event.status === 'New' || event.status === 'Updated') {
          allEvents.push({ ...event, countryName: country.countryName })
        }
      }
    }
  }
  return {
    ...SOURCE_CONFIG.timeline,
    sourceId: 'timeline',
    newCount: allEvents.filter((e) => e.status === 'New').length,
    updatedCount: allEvents.filter((e) => e.status === 'Updated').length,
    items: allEvents.map((e) => ({
      id: `${e.countryName}:${e.orgName}:${e.phase}:${e.title}`,
      label: `${e.countryName} — ${e.title}`,
      status: e.status as 'New' | 'Updated',
      deepLink: `/timeline?country=${encodeURIComponent(e.countryName)}`,
      description: e.description
        ? e.description.length > 100
          ? e.description.slice(0, 97) + '...'
          : e.description
        : undefined,
      organization: e.orgName || undefined,
      date:
        e.startYear && e.endYear
          ? `${e.startYear}–${e.endYear}`
          : e.startYear
            ? String(e.startYear)
            : undefined,
      tags: [e.phase, e.type].filter(Boolean),
    })),
  }
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns summaries for all data sources that have changed items,
 * filtered to only include sources listed in `changedSources`.
 */
export function getDataSourceSummaries(changedSources: DataSourceId[]): DataSourceSummary[] {
  const builders: Record<DataSourceId, () => DataSourceSummary> = {
    library: getLibrarySummary,
    migrate: getMigrateSummary,
    threats: getThreatsSummary,
    leaders: getLeadersSummary,
    timeline: getTimelineSummary,
    compliance: () =>
      buildRefreshSummary(
        'compliance',
        complianceFrameworks.length,
        complianceMetadata?.filename ?? null
      ),
    algorithms: () =>
      buildRefreshSummary(
        'algorithms',
        algorithmsData.length,
        loadedTransitionMetadata?.filename ?? null
      ),
    authoritativeSources: () =>
      buildRefreshSummary(
        'authoritativeSources',
        authoritativeSources.length,
        sourcesMetadata?.filename ?? null
      ),
    certificationXref: () =>
      buildRefreshSummary(
        'certificationXref',
        certificationXrefs.length,
        xrefMetadata?.filename ?? null
      ),
    quiz: () => buildRefreshSummary('quiz', quizQuestions.length, quizMetadata?.filename ?? null),
  }

  return changedSources
    .map((id) => {
      // eslint-disable-next-line security/detect-object-injection
      const build = builders[id]
      return build()
    })
    .filter((s) => s.items.length > 0 || s.newCount > 0 || s.updatedCount > 0)
}

/**
 * Filters data source summaries to show only items relevant to the given persona.
 * Returns a new array — does not mutate input.
 *
 * - Library: filtered by PERSONA_LIBRARY_CATEGORIES + persona's recommendedPath modules
 * - Migrate: filtered by PERSONA_MIGRATE_LAYERS
 * - Threats: filtered by selectedIndustries via INDUSTRY_TO_THREATS_MAP
 * - Timeline & Leaders: always fully relevant (cross-cutting)
 * - No persona (null): returns everything unfiltered
 */
export function filterSummariesForPersona(
  summaries: DataSourceSummary[],
  personaId: PersonaId | null,
  selectedIndustries: string[]
): DataSourceSummary[] {
  if (!personaId) return summaries

  return summaries
    .map((summary) => {
      switch (summary.sourceId) {
        case 'library': {
          // eslint-disable-next-line security/detect-object-injection
          const preferredCategories = PERSONA_LIBRARY_CATEGORIES[personaId]
          // eslint-disable-next-line security/detect-object-injection
          const recommendedModules = PERSONAS[personaId].recommendedPath
          // Empty arrays = show everything (researcher, etc.)
          if (preferredCategories.length === 0) return summary
          const filtered = summary.items.filter((item) => {
            const libItem = libraryData.find((l) => l.referenceId === item.id)
            if (!libItem) return false
            const categoryMatch = libItem.categories.some((c) => preferredCategories.includes(c))
            const moduleMatch =
              libItem.moduleIds?.some((m) => recommendedModules.includes(m)) ?? false
            return categoryMatch || moduleMatch
          })
          return rebuildCounts(summary, filtered)
        }

        case 'migrate': {
          // eslint-disable-next-line security/detect-object-injection
          const layers = PERSONA_MIGRATE_LAYERS[personaId]
          if (layers.length === 0) return summary
          const filtered = summary.items.filter((item) => {
            const sw = softwareData.find((s) => s.softwareName === item.id)
            return sw ? layers.includes(sw.infrastructureLayer) : false
          })
          return rebuildCounts(summary, filtered)
        }

        case 'threats': {
          if (selectedIndustries.length === 0) return summary
          const allowedIndustries = selectedIndustries.flatMap(
            (ind) => INDUSTRY_TO_THREATS_MAP[ind] ?? [] // eslint-disable-line security/detect-object-injection
          )
          if (allowedIndustries.length === 0) return summary
          const filtered = summary.items.filter((item) => {
            const threat = threatsData.find((t) => t.threatId === item.id)
            return threat ? allowedIndustries.includes(threat.industry) : false
          })
          return rebuildCounts(summary, filtered)
        }

        // Timeline, leaders, and synthetic refresh-only sources are
        // cross-cutting — always fully relevant
        case 'timeline':
        case 'leaders':
        case 'compliance':
        case 'algorithms':
        case 'authoritativeSources':
        case 'certificationXref':
        case 'quiz':
          return summary
      }
    })
    .filter((s) => s.items.length > 0)
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function rebuildCounts(
  summary: DataSourceSummary,
  filteredItems: DataChangeItem[]
): DataSourceSummary {
  return {
    ...summary,
    items: filteredItems,
    newCount: filteredItems.filter((i) => i.status === 'New').length,
    updatedCount: filteredItems.filter((i) => i.status === 'Updated').length,
  }
}

// ── Dynamic RAG chunk for "What's New" queries ──────────────────────────────

const RECENT_VERSIONS_COUNT = 3

/**
 * Builds a dynamic RAGChunk summarising recent changelog entries and data changes,
 * filtered by persona. Used by useChatSend to inject context when the user asks
 * "what's new?" — returns null if there's nothing to report.
 */
// Curious-friendly section labels — plain language instead of developer jargon
const CURIOUS_SECTION_LABELS: Record<SectionType, string> = {
  added: 'New things you can do',
  changed: 'Things that got better',
  fixed: 'Problems we solved',
  data: 'New information added',
  security: 'Safety improvements',
  other: 'Other updates',
}

// Curious-friendly data source labels
const CURIOUS_SOURCE_LABELS: Record<string, string> = {
  Library: 'Reference documents and standards',
  'Migration Catalog': 'Software and tools tracker',
  'Threat Intelligence': 'Security risk updates',
  Timeline: 'Country migration deadlines',
  'Thought Leaders': 'Expert profiles',
}

export function buildWhatsNewRAGChunk(
  changedSources: DataSourceId[],
  personaId: PersonaId | null,
  selectedIndustries: string[],
  experienceLevel?: string | null
): RAGChunk | null {
  const isCurious = experienceLevel === 'curious'
  const lines: string[] = []

  // Curious preamble — guides the LLM to explain in simple terms
  if (isCurious) {
    lines.push(
      '(Note to assistant: The user is non-technical. Summarise the updates below in everyday language. Skip version numbers and technical details — focus on what changed and why it matters.)\n'
    )
  }

  // ── Changelog entries (recent versions, persona-filtered) ─────────────
  const recentVersions = ALL_CHANGELOG_VERSIONS.slice(0, RECENT_VERSIONS_COUNT)

  // Merge sections across versions
  const mergedSections = new Map<SectionType, string[]>()
  for (const v of recentVersions) {
    for (const section of v.sections) {
      const entries = section.entries
        .filter(
          (e) => !personaId || e.meta.personas.length === 0 || e.meta.personas.includes(personaId)
        )
        .map((e) => (e.body ? `${e.title}: ${e.body}` : e.title))
      if (entries.length > 0) {
        const existing = mergedSections.get(section.type) ?? []
        existing.push(...entries)
        mergedSections.set(section.type, existing)
      }
    }
  }

  if (mergedSections.size > 0) {
    const versionRange =
      recentVersions.length === 1
        ? `v${recentVersions[0].version}`
        : `v${recentVersions.at(-1)!.version}–v${recentVersions[0].version}`
    lines.push(isCurious ? '## Recent improvements' : `## App Updates (${versionRange})`)

    const sectionOrder: SectionType[] = ['added', 'changed', 'fixed', 'data', 'security', 'other']
    for (const type of sectionOrder) {
      const items = mergedSections.get(type)
      if (!items || items.length === 0) continue
      const label = isCurious
        ? CURIOUS_SECTION_LABELS[type] // eslint-disable-line security/detect-object-injection
        : type.charAt(0).toUpperCase() + type.slice(1)
      lines.push(`### ${label}`)
      for (const item of items) {
        lines.push(`- ${item}`)
      }
    }
  }

  // ── Data source diffs (new/updated records) ───────────────────────────
  if (changedSources.length > 0) {
    const raw = getDataSourceSummaries(changedSources)
    const summaries = filterSummariesForPersona(raw, personaId, selectedIndustries)

    if (summaries.length > 0) {
      lines.push('')
      lines.push(isCurious ? '## New content added to the platform' : '## Data Changes')
      for (const s of summaries) {
        const counts: string[] = []
        if (s.newCount > 0) counts.push(`${s.newCount} new`)
        if (s.updatedCount > 0) counts.push(`${s.updatedCount} updated`)
        const sourceLabel = isCurious ? (CURIOUS_SOURCE_LABELS[s.label] ?? s.label) : s.label
        lines.push(`### ${sourceLabel} (${counts.join(', ')})`)
        // List up to 10 items per source to keep chunk size manageable
        for (const item of s.items.slice(0, 10)) {
          lines.push(`- [${item.status}] ${item.label}`)
        }
        if (s.items.length > 10) {
          lines.push(`- ... and ${s.items.length - 10} more`)
        }
      }
    }
  }

  if (lines.length === 0) return null

  const content = lines.join('\n')

  return {
    id: 'dynamic-whats-new',
    source: 'whats-new',
    title: isCurious ? "What's new on PQC Today" : "What's New in PQC Today",
    content,
    category: 'changelog',
    metadata: {
      dynamic: 'true',
      persona: personaId ?? 'all',
      ...(isCurious ? { audience: 'curious' } : {}),
    },
    deepLink: '/changelog',
    priority: 10,
  }
}
