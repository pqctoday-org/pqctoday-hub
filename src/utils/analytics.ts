// SPDX-License-Identifier: GPL-3.0-only
import ReactGA from 'react-ga4'
import { useHistoryStore } from '@/store/useHistoryStore'
import { usePersonaStore } from '@/store/usePersonaStore'
import { MODULE_CATALOG } from '@/components/PKILearning/moduleData'
import type { HistoryEventType } from '@/types/HistoryTypes'

// Helper to check if running on localhost
const isLocalhost = () => {
  const hostname = window.location.hostname
  return hostname === 'localhost' || hostname === '127.0.0.1'
}

export const initGA = () => {
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID

  if (isLocalhost()) return

  if (measurementId) {
    ReactGA.initialize(measurementId)
  } else {
    console.warn('[Analytics] Google Analytics Measurement ID is missing.')
  }
}

export const logPageView = (path?: string) => {
  if (isLocalhost()) return

  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID
  if (measurementId) {
    const page = path || window.location.pathname + window.location.search
    ReactGA.send({
      hitType: 'pageview',
      page,
    })
  }
}

export const logEvent = (category: string, action: string, label?: string) => {
  if (isLocalhost()) return

  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID
  if (measurementId) {
    ReactGA.event({
      category,
      action,
      label,
    })
  }
}

// --- Persona dimension helper ---

/**
 * Appends persona + experience-level dimensions to a GA4 event label so every
 * event can be sliced by persona cohort in the GA4 dashboard.
 * Format: `${label}|p=<persona>|x=<experienceLevel>`
 * Reads the store non-reactively so it's safe to call outside React components.
 */
export function personaLabel(label?: string): string | undefined {
  try {
    const { selectedPersona, experienceLevel } = usePersonaStore.getState()
    if (!selectedPersona) return label
    const suffix = `p=${selectedPersona}|x=${experienceLevel ?? 'unknown'}`
    return label ? `${label}|${suffix}` : suffix
  } catch {
    return label
  }
}

// --- History event helper ---

function addHistoryEvent(
  type: HistoryEventType,
  title: string,
  opts?: { detail?: string; moduleId?: string; route?: string }
) {
  try {
    useHistoryStore.getState().addEvent({
      type,
      timestamp: Date.now(),
      title,
      ...opts,
    })
  } catch {
    // Store may not be initialized yet during SSR/test — silently skip
  }
}

function getModuleTitle(moduleId: string): string {
  return MODULE_CATALOG[moduleId]?.title ?? moduleId
}

// Engagement event helpers for key user journeys

export const logModuleStart = (moduleId: string) => {
  logEvent('Learning', 'Module Start', personaLabel(moduleId))
  addHistoryEvent('module_started', `Started ${getModuleTitle(moduleId)}`, {
    moduleId,
    route: `/learn/${moduleId}`,
  })
}

export const logModuleComplete = (moduleId: string) => {
  logEvent('Learning', 'Module Complete', personaLabel(moduleId))
  addHistoryEvent('module_completed', `Completed ${getModuleTitle(moduleId)}`, {
    moduleId,
    route: `/learn/${moduleId}`,
  })
}

export const logStepComplete = (moduleId: string, stepIndex: number, workshopStep?: number) => {
  logEvent('Learning', 'Step Complete', personaLabel(`${moduleId}:step-${stepIndex}`))
  const route =
    workshopStep !== undefined
      ? `/learn/${moduleId}?tab=workshop&step=${workshopStep}`
      : `/learn/${moduleId}`
  addHistoryEvent('step_completed', `Completed step in ${getModuleTitle(moduleId)}`, {
    detail: `Step ${stepIndex + 1}`,
    moduleId,
    route,
  })
}

export const logArtifactGenerated = (moduleId: string, artifactType: string) => {
  logEvent('Learning', 'Artifact Generated', personaLabel(`${moduleId}:${artifactType}`))
  const typeMap: Record<string, HistoryEventType> = {
    key: 'artifact_key',
    certificate: 'artifact_cert',
    csr: 'artifact_csr',
    'executive-document': 'artifact_executive',
  }
  const isExecutive = artifactType === 'executive-document'
  addHistoryEvent(typeMap[artifactType] ?? 'artifact_key', `Generated ${artifactType}`, {
    moduleId,
    route: isExecutive ? `/learn/${moduleId}?tab=workshop` : '/openssl',
  })
}

export const logAlgorithmView = (algorithmName: string) => {
  logEvent('Algorithms', 'View Detail', algorithmName)
}

export const logComplianceSearch = (query: string) => {
  logEvent('Compliance', 'Search', query)
}

export const logComplianceFilter = (filterType: string, value: string) => {
  logEvent('Compliance', 'Filter', `${filterType}:${value}`)
}

export const logMigrateAction = (action: string, label?: string) => {
  logEvent('Migrate', action, label)
}

export const logLibrarySearch = (query: string) => {
  logEvent('Library', 'Search', query)
}

export const logLibraryDownload = (fileName: string) => {
  logEvent('Library', 'Download', fileName)
}

export const logExternalLink = (category: string, url: string) => {
  logEvent(category, 'External Link', url)
}

// --- Patents tracking ---

export const logPatentView = (patentNumber: string) => {
  logEvent('Patents', 'View Detail', patentNumber)
}

export const logPatentSearch = (query: string) => {
  logEvent('Patents', 'Search', sanitizeQuery(query))
}

export const logPatentFilter = (filterKey: string, value: string) => {
  logEvent('Patents', 'Filter', `${filterKey}:${value}`)
}

export const logPatentFilterClear = () => {
  logEvent('Patents', 'Filter Clear')
}

export const logPatentSort = (sortKey: string) => {
  logEvent('Patents', 'Sort', sortKey)
}

export const logPatentInsightsFilter = (filterType: string, value: string) => {
  logEvent('Patents', 'Insights Filter', `${filterType}:${value}`)
}

export const logPatentExport = (count: number) => {
  logEvent('Patents', 'Export CSV', String(count))
}

// --- FAQ tracking ---

export const logFaqSearch = (query: string) => {
  logEvent('FAQ', 'Search', sanitizeQuery(query))
}

export const logFaqExpand = (question: string) => {
  logEvent('FAQ', 'Expand', sanitizeQuery(question))
}

// --- Business Tools grid tracking ---

export const logBusinessToolsSearch = (query: string) => {
  logEvent('Business', 'Tools Search', sanitizeQuery(query))
}

export const logBusinessToolsFilter = (category: string | null) => {
  logEvent('Business', 'Tools Filter', category ?? 'All')
}

// --- Explore tracking ---

export const logExploreTileClick = (destination: string) => {
  logEvent('Explore', 'Tile Click', destination)
}

export const logExploreUnlock = () => {
  logEvent('Explore', 'Unlock Advanced')
}

// --- Report tracking ---

export const logReportViewed = (industry: string, riskLevel: string) => {
  logEvent('Report', 'Viewed', `${industry || 'unknown'}:${riskLevel}`)
}

export const logReportShareLinkOpened = () => {
  logEvent('Report', 'Share Link Opened')
}

export const logReportCta = (target: 'start-assessment' | 'complete-assessment') => {
  logEvent('Report', 'CTA Click', target)
}

// Scrub PII (emails, URLs) before sending query strings to GA4
function sanitizeQuery(q: string): string {
  return q
    .replace(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi, '[email]')
    .replace(/https?:\/\/\S+/gi, '[url]')
    .slice(0, 80)
}

// --- Chat / RAG quality tracking ---

export const logChatFeedback = (
  feedback: 'helpful' | 'unhelpful',
  query: string,
  sourceCount: number
) => {
  logEvent(
    'Chat',
    `Feedback ${feedback === 'helpful' ? 'Helpful' : 'Unhelpful'}`,
    sanitizeQuery(query)
  )
  logEvent('Chat', 'Feedback Sources', String(sourceCount))
}

export const logChatQuery = (page: string) => {
  logEvent('Chat', 'Query', page)
}

export const logChatRetry = (type: 'retry' | 'edit') => {
  logEvent('Chat', type === 'retry' ? 'Retry' : 'Edit & Resend')
}

export const logChatChunksUsed = (page: string, sources: string[], count: number) => {
  logEvent('Chat', 'RAG Chunks', `${page}:${count}`)
  const unique = [...new Set(sources)]
  unique.slice(0, 5).forEach((src) => logEvent('Chat', 'RAG Source', src))
}

export const logChatCacheHit = (page: string) => {
  logEvent('Chat', 'Cache Hit', page)
}

export const logChatOpened = () => {
  logEvent('Chat', 'Opened')
}

// --- Page accuracy feedback ---

export const logAccuracyFeedback = (vote: 'accurate' | 'inaccurate', pagePath: string) => {
  logEvent('Accuracy', vote, pagePath)
}

// --- Command Center tracking ---

export const logBusinessToolOpen = (toolId: string, toolName: string) => {
  logEvent('Business', 'Tool Open', `${toolId}:${toolName}`)
  addHistoryEvent('page_view', `Opened ${toolName}`, {
    route: `/business/tools/${toolId}`,
  })
}

export const logBusinessToolExport = (toolId: string, format: string) => {
  logEvent('Business', 'Tool Export', `${toolId}:${format}`)
}

// --- Embed mode tracking ---

export const logEmbedSession = (
  vendorId: string,
  kid: string,
  presets: string[],
  isTest: boolean
) => {
  logEvent('Embed', 'Session Start', `${vendorId}:${presets.join('+')}|kid=${kid}|test=${isTest}`)
}

export const logEmbedError = (code: string, kid?: string) => {
  logEvent('Embed', 'Verification Error', kid ? `${code}|kid=${kid}` : code)
}

export const logEmbedRouteBlocked = (
  attempted: string,
  reason: 'route' | 'module' | 'tool' | 'difficulty'
) => {
  logEvent('Embed', 'Route Blocked', `${attempted}|reason=${reason}`)
}

export const logEmbedPolicyApplied = (
  vendorId: string,
  personas: string[],
  regions: string[],
  industries: string[]
) => {
  const parts = [`vendor=${vendorId}`]
  if (personas.length) parts.push(`personas=${personas.join(',')}`)
  if (regions.length) parts.push(`regions=${regions.join(',')}`)
  if (industries.length) parts.push(`industries=${industries.join(',')}`)
  logEvent('Embed', 'Policy Applied', parts.join('|'))
}

// --- Assessment wizard tracking ---

export const logAssessStart = () => {
  logEvent('Assessment', 'Start')
}

export const logAssessStep = (step: number, label: string) => {
  logEvent('Assessment', 'Step', `${step}:${label}`)
}

export const logAssessComplete = (personaResult: string) => {
  logEvent('Assessment', 'Complete', personaResult)
}

export const logAssessReset = () => {
  logEvent('Assessment', 'Reset')
}

// --- Persona / personalization tracking ---

export const logPersonaSelected = (
  persona: string,
  source: 'picker' | 'assessment' | 'embed' | 'switch'
) => {
  logEvent('Persona', 'Selected', `${persona}:${source}`)
}

export const logRegionSelected = (region: string) => {
  logEvent('Persona', 'Region', region)
}

export const logIndustrySelected = (industry: string) => {
  logEvent('Persona', 'Industry', industry)
}

// --- Learning module tab tracking ---

export const logModuleTabSwitch = (moduleId: string, tab: 'learn' | 'workshop' | string) => {
  logEvent('Learning', 'Tab Switch', personaLabel(`${moduleId}:${tab}`))
}

// --- Engagement event loggers (UX-GLOBAL-01) ---

export const logAchievementUnlocked = (achievementId: string, rarity?: string) => {
  logEvent(
    'Achievement',
    'Unlocked',
    personaLabel(rarity ? `${achievementId}:${rarity}` : achievementId)
  )
}

export const logBookmarkToggle = (section: string, id: string, action: 'add' | 'remove') => {
  logEvent('Bookmark', action === 'add' ? 'Added' : 'Removed', personaLabel(`${section}:${id}`))
}

export const logEndorsementGiven = (
  resourceType: string,
  resourceId: string,
  kind: 'endorse' | 'flag'
) => {
  logEvent(
    'Endorsement',
    kind === 'endorse' ? 'Endorsed' : 'Flagged',
    personaLabel(`${resourceType}:${resourceId}`)
  )
}

export const logQuizAnswer = (questionId: string, correct: boolean) => {
  logEvent('Quiz', correct ? 'Correct' : 'Incorrect', personaLabel(questionId))
}
