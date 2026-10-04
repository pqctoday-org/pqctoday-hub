// SPDX-License-Identifier: GPL-3.0-only
import type { RAGChunk } from '@/types/ChatTypes'
import type { PageContext } from '@/hooks/usePageContext'
import { useStructuredCitations } from '@/services/featureFlags'
import { MODULE_CATALOG } from '@/components/PKILearning/moduleData'
import { BUSINESS_TOOLS } from '@/components/BusinessCenter/businessToolsRegistry'
import { WORKSHOP_TOOLS } from '@/components/Playground/workshopRegistry'
import {
  CRYPTO_FAMILY_ITEMS,
  FUNCTION_ITEMS,
  LEVEL_ITEMS,
  REGION_ITEMS,
  STATUS_ITEMS,
} from '@/components/Algorithms/algorithmFilterOptions'
import { TIMELINE_REGION_LABELS } from '@/components/Timeline/timelineRegions'
import { LEADER_CATEGORIES } from '@/components/Leaders/leadersConstants'
import {
  CLASS_PARAM_VALUES,
  DETAIL_TAB_VALUES,
  THREATS_VIEW_MODES,
} from '@/components/Threats/threatsUrlParams'
import { INTERACTIVE_TAB_IDS } from '@/components/Playground/contexts/interactiveTabs'
import { OPENSSL_CATEGORIES } from '@/components/OpenSSLStudio/categories'

/**
 * Approximate character budget for RAG context blocks in the system prompt.
 * ~4 chars ≈ 1 token. Budgets sized to leave room for system instructions,
 * conversation history, and generated response within each model's context.
 *
 * Gemini 3.8 Flash: ~1M tokens → 80K chars (~20K tokens) for RAG context
 * Local models (web-llm): 4K–8K token context → budget scaled dynamically in
 *   WebLLMService.streamResponse (45% RAG, 20% response, rest for prompt+history).
 */
const MAX_CONTEXT_CHARS = 80_000
const LOCAL_MAX_CONTEXT_CHARS = 4_000
const MAX_INVENTORY_ENTITIES = 50
const LOCAL_MAX_INVENTORY_ENTITIES = 10

/** Display labels for entity inventory grouping */
const ENTITY_CATEGORY_LABELS: Record<string, string> = {
  algorithms: 'Algorithms',
  transitions: 'Algorithm Transitions',
  migrate: 'Products',
  certifications: 'Certifications',
  leaders: 'Leaders',
  threats: 'Threats',
  compliance: 'Compliance Frameworks',
  library: 'Standards & Documents',
  'authoritative-sources': 'Standards & Documents',
  glossary: 'Glossary Terms',
  timeline: 'Timeline Events',
  modules: 'Learning Modules',
  'module-content': 'Learning Modules',
  'module-summaries': 'Learning Modules',
  'module-topic-summaries': 'Learning Modules',
  'document-enrichment': 'Document Analysis',
  'business-center': 'Business Planning Tools',
  'guided-tour': 'App Guides',
  'user-manual': 'App Guides',
  'playground-guide': 'App Guides',
  'openssl-guide': 'App Guides',
}

/** Sources that don't produce meaningful entity names for the inventory */
const SKIP_SOURCES = new Set([
  'assessment',
  'quiz',
  'documentation',
  'priority-matrix',
  'modules',
  'module-content',
  'module-summaries',
  'module-topic-summaries',
])

/**
 * Extracts a compact entity inventory from retrieved chunks.
 * Groups unique entity names by display category for hallucination prevention.
 */
export function extractEntityInventory(
  chunks: RAGChunk[],
  maxEntities = MAX_INVENTORY_ENTITIES
): string {
  const groups = new Map<string, Set<string>>()

  for (const c of chunks) {
    if (SKIP_SOURCES.has(c.source)) continue

    const label = ENTITY_CATEGORY_LABELS[c.source]
    if (!label) continue

    // Extract the best entity name for this chunk
    let name: string | null = null
    switch (c.source) {
      case 'threats':
        name = c.metadata?.threatId ?? c.title
        break
      case 'timeline':
        name = c.metadata?.country ? `${c.metadata.country}/${c.metadata.org ?? ''}` : c.title
        break
      default:
        name = c.title
    }

    if (!name || name.length < 2) continue
    // Sanitize: collapse newlines and excess whitespace
    name = name
      .replace(/[\n\r]+/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim()
    if (name.length < 2) continue
    // Truncate long names
    if (name.length > 50) name = name.slice(0, 47) + '...'

    const existing = groups.get(label)
    if (existing) {
      existing.add(name)
    } else {
      groups.set(label, new Set([name]))
    }
  }

  // Flatten and cap total entities
  const lines: string[] = []
  let totalCount = 0

  for (const [label, names] of groups) {
    if (totalCount >= maxEntities) break
    const remaining = maxEntities - totalCount
    const nameArr = [...names].slice(0, remaining)
    if (nameArr.length === 0) continue
    lines.push(`${label} (${nameArr.length}): ${nameArr.join(', ')}`)
    totalCount += nameArr.length
  }

  if (lines.length === 0) return ''

  return `\nENTITY INVENTORY (reference ONLY items from this list):\n${lines.join('\n')}\n\nIf the user asks about an item not in this inventory, say it is not in the current database and suggest the closest match from the inventory.\n`
}

/* ------------------------------------------------------------------ */
/*  Shared helpers for context block & persona/profile/assessment     */
/* ------------------------------------------------------------------ */

const PERSONA_DEPTH: Record<string, string> = {
  executive:
    'Lead with business impact, timelines, and risk. Avoid deep technical jargon. Use ROI framing aligned with NIST CSWP.39 (PQC Migration). When relevant, point to the [Command Center](/business) and planning tools like [ROI Calculator](/business/tools/roi-calculator), [Board Pitch](/business/tools/board-pitch), [CRQC Scenario](/business/tools/crqc-scenario).',
  grc: 'Lead with scope, cited sources, and evidence gaps rather than a verdict — name what to establish, record, source or verify, and always name an owner and a review step. Avoid implying compliance from a technical status alone. When relevant, point to the [obligations register](/compliance?tab=obligations) and Command Center tools like [Compliance Checklist](/business/tools/compliance-checklist), [Risk Register](/business/tools/risk-register), [Vendor Scorecard](/business/tools/vendor-scorecard), [Audit Checklist](/business/tools/audit-checklist).',
  developer:
    'Include technical details, code examples, and implementation specifics. Point to hands-on labs in [Playground](/playground) and [OpenSSL Studio](/openssl) when relevant.',
  architect:
    'Emphasize integration patterns, architecture decisions, and system-level trade-offs. Reference HSM/VPN topology via [HSM Workshop](/playground/hsm) and module workshops, and planning tools like [Risk Register](/business/tools/risk-register) and [Roadmap Builder](/business/tools/roadmap-builder).',
  researcher: 'Include mathematical foundations, algorithm comparisons, and academic references.',
  'cert-engineer':
    'Answer as for someone who tests or certifies cryptographic modules: name the standard and section (FIPS 140-3, SP 800-90B, FIPS 203/204/205, ISO/IEC 19790), and keep the FIPS 140-3 stages distinct — a CAVP algorithm validation is a prerequisite, "in process" means NIST lists the module on Modules In Process, and only a module certificate is a certification. Point to the [ACVP suite](/playground/hsm?tab=build&dtab=acvp), the [Validation tab](/algorithms?tab=validation) and [Product Records](/compliance?tab=records) when relevant.',
  ops: 'Focus on deployment steps, infrastructure configs, and operational procedures. Include CLI commands, config examples, and rollback guidance. Point to [HSM Workshop](/playground/hsm), [VPN & SSH PQC](/learn/vpn-ssh-pqc), and [Deployment Playbook](/business/tools/deployment-playbook) when relevant.',
  curious:
    'This person has no technical background. Lead with real-world impact and simple metaphors. Avoid all jargon — if you must mention a standard (e.g., FIPS 203), immediately explain what it means in plain English. Never use an acronym without expanding it on first use. Keep answers short (2-3 paragraphs max). Use questions and everyday examples to make concepts relatable.',
}

const EXPERIENCE_DEPTH: Record<string, string> = {
  curious:
    'The user is a non-technical person exploring PQC for the first time. MANDATORY RULE: You are FORBIDDEN from inventing new technical analogies. You may ONLY use these approved analogies:\n1) Encryption: Like a locked mailbox where anyone can drop in a letter, but only the owner has the key.\n2) Quantum Threat: Like an army of millions of locksmiths working simultaneously to pick a lock, bypassing the need to guess combinations.\n3) PQC Transition: Like upgrading the locks on a bank vault from a standard physical key to a biometric scanner.\nDefine every technical term on first use. Focus on "why it matters" and "what happens next" rather than implementation details. Never assume familiarity with IT infrastructure.',
  basics:
    'The user has basic familiarity with PQC concepts. Provide moderate detail with brief explanations of advanced terms.',
  expert:
    'The user is an expert. Be concise and technical. Skip introductory explanations. Use precise terminology and reference standards directly.',
}

const REGION_LABELS: Record<string, string> = {
  americas: 'Americas',
  eu: 'Europe',
  apac: 'Asia-Pacific',
  global: 'Global',
}

function buildContextBlocks(
  chunks: RAGChunk[],
  maxChars = MAX_CONTEXT_CHARS,
  compact = false,
  includeIds = false
): string {
  const allBlocks: string[] = []
  let totalChars = 0
  const chunkContentLimit = compact ? 600 : Infinity

  const compactContent = (value: string): string => {
    if (!compact || value.length <= chunkContentLimit) return value
    const candidate = value.slice(0, chunkContentLimit)
    const sentenceEnd = Math.max(
      candidate.lastIndexOf('. '),
      candidate.lastIndexOf('.\n'),
      candidate.lastIndexOf('\n')
    )
    // Avoid exposing a made-up ellipsis as if it were verbatim corpus text.
    // Prefer a complete sentence/line when one exists near the cutoff.
    return sentenceEnd >= Math.floor(chunkContentLimit * 0.55)
      ? candidate.slice(0, sentenceEnd + (candidate.charAt(sentenceEnd) === '.' ? 1 : 0)).trimEnd()
      : candidate.trimEnd()
  }

  for (const c of chunks) {
    const header = includeIds
      ? `--- Source: ${c.source} | ${c.title} | id: ${c.id} ---`
      : `--- Source: ${c.source} | ${c.title} ---`
    const deepLinkLine = c.deepLink ? `Deep Link: ${c.deepLink}` : ''
    const content = compactContent(c.content)
    const block = [header, deepLinkLine, content, '---'].filter(Boolean).join('\n')

    if (totalChars + block.length > maxChars) break
    allBlocks.push(block)
    totalChars += block.length
  }

  return allBlocks.join('\n\n')
}

function buildSharedSections(chunks: RAGChunk[], pageContext?: PageContext, maxEntities?: number) {
  let pageNote = ''
  if (pageContext?.page) {
    const tabInfo =
      pageContext.tab && pageContext.tab !== 'learn'
        ? ` (${pageContext.tab} tab${pageContext.step ? `, step ${pageContext.step + 1}` : ''})`
        : ''
    const filterInfo = pageContext.filters ? ` with ${pageContext.filters} already applied` : ''
    pageNote = `\nThe user is currently viewing the ${pageContext.page} page${tabInfo}${filterInfo}. Tailor your response accordingly when relevant — when linking back to this page, preserve state the user already has set instead of resetting it.\n`
  }

  let personaSection = ''
  if (pageContext?.persona) {
    const depth = PERSONA_DEPTH[pageContext.persona as string]
    if (depth) personaSection = `\nRESPONSE STYLE: ${depth}\n`
  }

  let experienceSection = ''
  if (pageContext?.experienceLevel) {
    const depth = EXPERIENCE_DEPTH[pageContext.experienceLevel as string]
    if (depth) experienceSection = `EXPERIENCE LEVEL: ${depth}\n`
  }

  const profileLines: string[] = []
  if (pageContext?.industry) profileLines.push(`Industry: ${pageContext.industry}`)
  if (pageContext?.region) {
    const label = REGION_LABELS[pageContext.region as string] ?? pageContext.region
    profileLines.push(`Region: ${label}`)
  }
  const profileSection =
    profileLines.length > 0 ? `\nUSER PROFILE:\n  ${profileLines.join('\n  ')}\n` : ''

  let assessmentSection = ''
  if (pageContext?.assessmentComplete && pageContext.riskScore !== undefined) {
    const lines: string[] = [
      `Risk Score: ${pageContext.riskScore}/100 (${pageContext.riskLevel ?? 'Unknown'})`,
    ]
    if (pageContext.complianceFrameworks && pageContext.complianceFrameworks.length > 0)
      lines.push(`Compliance: ${pageContext.complianceFrameworks.join(', ')}`)
    if (pageContext.infrastructure && pageContext.infrastructure.length > 0)
      lines.push(`Infrastructure: ${pageContext.infrastructure.join(', ')}`)
    if (pageContext.migrationStatus) lines.push(`Migration Status: ${pageContext.migrationStatus}`)
    if (pageContext.timelinePressure)
      lines.push(`Timeline Pressure: ${pageContext.timelinePressure}`)
    if (pageContext.cryptoAgility) lines.push(`Crypto Agility: ${pageContext.cryptoAgility}`)
    assessmentSection = `\nUser's PQC Assessment:\n  ${lines.join('\n  ')}\n`
  }

  const inventorySection = extractEntityInventory(chunks, maxEntities)

  return {
    pageNote,
    personaSection,
    experienceSection,
    profileSection,
    assessmentSection,
    inventorySection,
  }
}

/* ------------------------------------------------------------------ */
/*  Gemini system prompt — full instructions (for large cloud models) */
/* ------------------------------------------------------------------ */

/**
 * The Learn modules for the prompt's link list, built from the same catalog the
 * site counts from, so the list and its total can never drift from the modules
 * that exist (a typed list said "51 total" while the catalog had 73). The
 * synthetic Quiz entry is not a module; the main-pages list links /learn/quiz.
 */
export function buildModuleLinkList(): { count: number; links: string } {
  const modules = Object.values(MODULE_CATALOG).filter((m) => m.id !== 'quiz')
  return {
    count: modules.length,
    links: modules.map((m) => `[${m.title}](/learn/${m.id})`).join(', '),
  }
}

/**
 * The ids of every planning tool under /business/tools/<toolId>, from the same
 * registry the Planning Tools page lists. A typed list named 17 of 37 tools, so
 * the assistant could not link the rest.
 */
export function buildBusinessToolIdList(): string {
  return BUSINESS_TOOLS.map((tool) => tool.id).join(', ')
}

/**
 * How many /playground/<toolId> pages exist, from the playground registry: every
 * tool, split into those that run in the browser and the Docker-sandbox ones.
 */
export function countPlaygroundTools(): { total: number; native: number; sandbox: number } {
  const sandbox = WORKSHOP_TOOLS.filter((tool) => tool.sandbox).length
  return { total: WORKSHOP_TOOLS.length, native: WORKSHOP_TOOLS.length - sandbox, sandbox }
}

/**
 * The criticality values /threats?criticality= accepts, most severe first. Typed
 * here (the Threats page lists only the levels its data has, and loading that
 * data into the prompt would be far too heavy); promptBuilder.test.ts fails
 * when the data and this list disagree.
 */
export const THREAT_CRITICALITY_LEVELS = ['Critical', 'High', 'Medium', 'Low'] as const

/**
 * The pages the "Main pages" line links, in the order shown. Typed here because
 * the route metadata that lists every page is far too large to import into the
 * assistant's code; promptBuilder.test.ts checks this list against that
 * metadata, so a page added to the site cannot be left out without a decision.
 */
export const MAIN_PAGES: ReadonlyArray<{ label: string; path: string }> = [
  { label: 'Algorithms', path: '/algorithms' },
  { label: 'Timeline', path: '/timeline' },
  { label: 'Library', path: '/library' },
  { label: 'Threats', path: '/threats' },
  { label: 'Leaders', path: '/leaders' },
  { label: 'Compliance', path: '/compliance' },
  { label: 'Migrate', path: '/migrate' },
  { label: 'Assessment', path: '/assess' },
  { label: 'Report', path: '/report' },
  { label: 'Playground', path: '/playground' },
  { label: 'OpenSSL Studio', path: '/openssl' },
  { label: 'Learn', path: '/learn' },
  { label: 'Quiz', path: '/learn/quiz' },
  { label: 'Command Center', path: '/business' },
  { label: 'Planning Tools', path: '/business/tools' },
  { label: 'Patents', path: '/patents' },
  { label: 'Simulation', path: '/simulation' },
  { label: 'Explore', path: '/explore' },
  { label: 'FAQ', path: '/faq' },
  { label: 'Terms', path: '/terms' },
  { label: 'Changelog', path: '/changelog' },
  { label: 'About', path: '/about' },
  { label: 'Sponsor', path: '/sponsor' },
  { label: 'Editorial Independence', path: '/editorial-independence' },
  { label: 'Revisions', path: '/revisions' },
  { label: 'Navigate', path: '/navigate' },
]

/** The "Main pages" line: each page as a markdown link. */
export function buildMainPageList(): string {
  return MAIN_PAGES.map((page) => `[${page.label}](${page.path})`).join(', ')
}

/**
 * The filter ids a dropdown offers, for a link's value list: without the "All"
 * placeholder, and with a space written as %20 so the value stays one token in
 * a markdown link (the page decodes it).
 */
function filterValues(items: ReadonlyArray<{ id: string }>): string[] {
  return items.filter((item) => item.id !== 'All').map((item) => item.id.replace(/ /g, '%20'))
}

/**
 * The values the prompt tells the assistant to put after `?param=` for the
 * pages whose filters take a fixed set. Each comes from the page's own list, so
 * the prompt cannot name a value the page does not accept or leave one out. A
 * typed list said `fn=<sig|kem>`, but the Algorithms page compares the exact
 * strings KEM and Signature, so those links showed an empty table.
 */
export function buildLinkValueLists() {
  return {
    algorithmFamily: filterValues(CRYPTO_FAMILY_ITEMS),
    algorithmFunction: filterValues(FUNCTION_ITEMS),
    algorithmLevel: filterValues(LEVEL_ITEMS),
    algorithmStatus: filterValues(STATUS_ITEMS),
    algorithmRegion: filterValues(REGION_ITEMS),
    timelineRegion: Object.keys(TIMELINE_REGION_LABELS),
    leaderCategory: [...LEADER_CATEGORIES],
    threatClass: [...CLASS_PARAM_VALUES],
    threatMode: [...THREATS_VIEW_MODES],
    threatTab: [...DETAIL_TAB_VALUES],
    threatCriticality: [...THREAT_CRITICALITY_LEVELS],
    playgroundTab: [...INTERACTIVE_TAB_IDS],
    opensslCategory: [...OPENSSL_CATEGORIES],
  }
}

export function buildGeminiSystemPrompt(chunks: RAGChunk[], pageContext?: PageContext): string {
  // See featureFlags.ts: plain flag check, not a React Hook — the `use`
  // prefix is this module's naming convention for every flag, including
  // ones (like this one) meant to be read from prompt-building code.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const citationsEnabled = useStructuredCitations()
  const contextBlocks = buildContextBlocks(chunks, MAX_CONTEXT_CHARS, false, citationsEnabled)
  const citationsSection = citationsEnabled
    ? `CORPUS EVIDENCE (REQUIRED): every substantive sentence in the answer must map to retrieved evidence. Use the complete sentence as claimExcerpt; a shorter substring does not count. Before the follow-ups fence, add a \`\`\`citations code fence containing a JSON array of {"claimExcerpt": "<the complete sentence exactly as written in your answer>", "evidenceExcerpt": "<a verbatim supporting excerpt copied from the cited context chunk>", "chunkId": "<the chunk's exact id>"}. A paraphrase is allowed only when its evidenceExcerpt directly supports it. Never cite a chunk merely because it is topically related. Only use chunk ids and evidence text that appear below. Example:
\`\`\`citations
[{"claimExcerpt": "ML-KEM-768 provides NIST security level 3.", "evidenceExcerpt": "Security Level: 3", "chunkId": "algo-ml-kem-768"}]
\`\`\`

`
    : ''
  const {
    pageNote,
    personaSection,
    experienceSection,
    profileSection,
    assessmentSection,
    inventorySection,
  } = buildSharedSections(chunks, pageContext)
  const moduleList = buildModuleLinkList()
  const businessToolIds = buildBusinessToolIdList()
  const playgroundTools = countPlaygroundTools()
  const values = buildLinkValueLists()
  const mainPages = buildMainPageList()

  return `You are PQC Today Assistant, an expert in post-quantum cryptography (PQC). You help users understand PQC concepts, standards, migration strategies, and the quantum threat landscape.
${pageNote}${personaSection}${experienceSection}${profileSection}${assessmentSection}
Answer based ONLY on the provided context from the PQC Today database. Do not use general knowledge, training-memory facts, or external information. You may explain or paraphrase the context, but every factual statement must be directly supported by a verbatim evidence excerpt from it.
${inventorySection}
ANTI-HALLUCINATION RULES (MANDATORY — violations break user trust):
- Prefer short prose with one supported claim per sentence. Avoid headings and tables; their labels and rows also count as claims and require evidence.
- NEVER fabricate people, researchers, authors, or leaders not in the context.
- NEVER invent product names, software versions, or vendor claims.
- NEVER make up FIPS/RFC/SP numbers, standard identifiers, or document titles.
- NEVER fabricate dates, deadlines, migration timelines, or statistics.
- NEVER invent certification status (FIPS validated, ACVP certified, etc.).
- NEVER claim a product supports a specific algorithm unless stated in the context.
- NEVER invent direct quotations — only quote text that appears verbatim in the context.
- Do not infer or extrapolate beyond what the context explicitly states — a plausible-sounding conclusion is still a fabrication if it isn't written there.
- If context chunks disagree (conflicting dates, statuses, or claims), surface the disagreement and name both sources instead of silently picking one.
- If the context only partly answers the question, state the specific limitation briefly and then answer from what IS supported. Only when none of the retrieved context addresses the question, say: "Based on the PQC Today database, I don't have enough information about [topic]."
- When uncertain, use hedging tied to the specific source category, e.g. "According to the Library database..." or "The Algorithms catalog shows...", not just a generic "the database."
- If a user asks about something not in the ENTITY INVENTORY, say it is not in the current database and suggest the closest match.

GUIDELINES:
1. Prioritize "algorithms" and "glossary" sources for algorithm/standard/definition questions. Use "threats" data only for threat/industry-impact questions.
   When a context chunk has \`Source: documentation\`, it is an internal reference file — NOT a user-navigable page. Do NOT describe specific sections of it (e.g., "the Conclusion section") as if they are clickable destinations. Instead, link only to the page in the Deep Link field (e.g., [Migrate Catalog](/migrate)) and use the chunk's content as background context to inform your answer.
2. When listing items (leaders, products, documents, algorithms), ONLY include items from the ENTITY INVENTORY above. Never fabricate entries. If you list N items, every one must come from the inventory.
3. **Linking**: When referencing a specific standard, RFC, or document (e.g., NIST IR 8547, FIPS 203, RFC 9629), ALWAYS link to \`/library?ref=<referenceId>\` — even if the chunk came from a timeline or other source. The Library page has the authoritative record for every catalogued document.
   When a context chunk has a "Deep Link:" field, ALWAYS use that URL. Otherwise construct links using these patterns:
   - /algorithms?algo=<algorithm id or exact name> (open one algorithm's detail, e.g. ML-KEM-768), /algorithms?highlight=<name[,name]> (tint rows in the table, e.g. ml-kem-768, ml-dsa-65)
   - /algorithms?tab=transition&highlight=<classical-slug> — **MUST** use this exact form for any classical → PQC transition (e.g. rsa, diffie-hellman, ecdsa, ecdh, dsa, 3des). Omitting \`?tab=transition\` lands on the detailed tab where classical algos do not exist. Correct: [RSA → ML-KEM transition](/algorithms?tab=transition&highlight=rsa). Wrong: \`/algorithms?highlight=rsa\`.
   - /algorithms?tab=detailed&mode=compare (Detailed tab's Compare view — side-by-side matrix; omit \`mode\` for the default Browse table)
   - /algorithms?compare=<algo1>,<algo2>, /algorithms?family=<${values.algorithmFamily.join('|')}>, /algorithms?level=<${values.algorithmLevel.join('|')}>, /algorithms?fn=<${values.algorithmFunction.join('|')}>, /algorithms?q=<text>, /algorithms?status=<${values.algorithmStatus.join('|')}>, /algorithms?region=<${values.algorithmRegion.join('|')}> (family, level, fn, status and region take exactly these values, case-sensitive — any other value, such as fn=kem or fn=sig, matches nothing and shows an empty table), /algorithms?cnsa=1 (CNSA 2.0 lens), /algorithms?gap=1 (research-gap-only filter), /algorithms?quickview=<nist-picks|fips-validated|none>
   - /algorithms?tab=support (Protocol Support matrix — PQC readiness per protocol), /algorithms?tab=support&protocol=<id> (open one protocol's support detail, e.g. tls-1-3, ssh, ike-ipsec, smime, dnssec, kmip, mls)
   - /algorithms?tab=support&matrixView=detailed (Protocol Support's card view; default is heatmap — omit for heatmap), /algorithms?tab=support&matrixQ=<text> (search protocols), /algorithms?tab=support&matrixStatus=<rfc|draft|experimental|none|na> (comma-separated), /algorithms?tab=support&matrixAvailability=<has-oss|no-oss|has-commercial|no-commercial|has-playground|has-deployment|no-deployment>, /algorithms?tab=support&matrixSort=<name|maturity|oss|commercial|deployments>:<asc|desc>
   - /algorithms?tab=validation (validation evidence tab), /algorithms?tab=validation&section=<attacks|kat|coverage> (open that Validation section — \`section\` ONLY works paired with \`tab=validation\`), /algorithms?tab=validation&section=attacks&attack=<algorithm> (one algorithm's implementation-attack profile)
   - /algorithms?tab=landscape (industry landscape), /algorithms?tab=landscape&industry=<label>, /algorithms?usecase=<useCaseId> (open one landscape use case)
   - /timeline?event=<event_id> (open one milestone/phase — use the event id from the chunk's Deep Link), /timeline?country=<name>, /timeline?region=<${values.timelineRegion.join('|')}>, /timeline?q=<text>
   - /library?ref=<id>, /library?cat=<category>&org=<org>, /library?sector=<NAICS code, e.g. 52 finance, 92 public administration>, /library?view=<cards|table>, /library?sort=<field>. Any page also accepts ?spec=<referenceId> to open that document in place.
   - /migrate?product=<product_id> (open one product — use the id from the chunk's Deep Link), /migrate?productIds=<id,id>, /migrate?tab=<replace|plan|roadmaps|vendorrisk> (Replace what you own / Plan & sequence / Vendor roadmaps / Vendor risk), /migrate?tab=roadmaps&vendor=<VND-id>, /migrate?domain=<domain id>. Never use ?q= on /migrate.
   - /leaders?leader=<leader id or name>, /leaders?sector=<Public|Private|Academic>&country=<name>, /leaders?cat=<category — singular: ${values.leaderCategory.join(', ')}>, /leaders?region=<americas|eu|apac>, /leaders?q=<text>, /leaders?mode=<cards|table|stack>, /leaders?layer=<Public|Private|Academic> (stack view layer)
   - /compliance?framework=<id> (open one framework, e.g. CNSA-2, FIPS-140-3), /compliance?cert=<recordId> (open one certification record), /compliance?evref=<library ref> (CSWP.39 evidence reference; tab=cswp39 optional), /compliance?tab=<obligations|requirements|progress|products|standards|certification|compliance|records|foryou|cswp39>, /compliance?q=<text>, /compliance?pqc=<algorithm name, e.g. ML-KEM>, /compliance?mcat=<category>, /compliance?org=<org>, /compliance?ind=<industry>, /compliance?vendor=<name>, /compliance?cat=<cat>, /compliance?src=<source>, /compliance?rtab=<tab>
   - /threats?id=<threatId>&industry=<industry>, /threats?criticality=<${values.threatCriticality.join('|')}>, /threats?class=<${values.threatClass.join('|')}>, /threats?q=<text>, /threats?sort=<industry|threatId|criticality|evidence>&dir=<asc|desc>, /threats?mode=<${values.threatMode.join('|')}> (list layout; default table), /threats?protocol=<protocol slug, e.g. tls-https, ssh, vpn-ipsec> (developer protocol lens), /threats?id=<threatId>&threattab=<${values.threatTab.join('|')}> (open that threat on its Detection or Response tab; default detection), /threats?view=horizon (CRQC Threat Horizon)
   - /playground/<toolId> (one page per tool — ${playgroundTools.total} tools: ${playgroundTools.native} native + ${playgroundTools.sandbox} Docker-sandbox; each has its own "playground-guide" context chunk with a Deep Link: field — ALWAYS use that exact toolId rather than guessing one), /playground?algo=<name>&tab=<tab>
   - /playground/interactive?tab=<${values.playgroundTab.join('|')}>&algo=<algo> (multi-tab lab; opens on keystore when tab is omitted), /playground/hsm (softhsmv3 HSM emulator workshop), /playground/cacp (KMIP 3.0 control plane), /playground/docker (Docker-sandbox launcher)
   - /business (GRC Command Center, CSWP.39-aligned), /business/tools (planning tools grid)
   - /business/tools/<toolId> — actual toolIds: ${businessToolIds}
   - /learn (catalog) — /learn?mode=<mypath|browse> (My Path guided journey vs Browse all modules). Track filtering only applies in Browse mode, so ALWAYS pair it: /learn?mode=browse&track=<trackName> (track names: Role Guides, Foundations, Strategy, Protocols, Hardware Infrastructure, Software Infrastructure, Applications, Executive, Industries). /learn?persona=<id> presets the persona path/lens (executive|grc|developer|architect|researcher|cert-engineer|ops|curious).
   - /learn/<module-id> (learning content), /learn/<module-id>?tab=workshop (hands-on workshop/simulation)
   - /learn/<module-id>?tab=workshop&step=<n>, /learn/<module-id>?category=<cat>, /learn/<module-id>?diveDeeper=<topic>
   - /assess?step=<n> — 0-based wizard step. Comprehensive mode steps in order: 0=industry, 1=country, 2=crypto, 3=sensitivity, 4=compliance, 5=migration, 6=use-cases, 7=retention, 8=credential-lifetime, 9=scale, 10=agility, 11=infra, 12=timeline.
   - /openssl?cmd=<category> (${values.opensslCategory.join(', ')})
   - /learn/quiz?category=<id> (comma-separated quiz categories, e.g. ?category=pqc-fundamentals,nist-standards)
   - /patents (Patent landscape & CSWP.39 maturity-evidence), /patents?tab=<insights|explore|search>, /patents?patent=US<number> (e.g. US12676741)
   - /patents?search=<text>, /patents?assignee=<name>, /patents?agility=<level>, /patents?domain=<name>, /patents?impact=<level>, /patents?quantumTech=<family>, /patents?quantumRelevance=<level>, /patents?region=<name>, /patents?protocol=<name>, /patents?classicalAlgorithm=<name>, /patents?hardwareComponent=<name>, /patents?nistStatus=<status>
   - /report (Assessment report — generated from /assess), /faq (frequently asked questions), /terms (terms of service & export controls), /explore (guided exploration), /changelog, /about
   - / (Landing) — supports /?picker=open to open the role switcher (region/industry picker retired 2026-08-01 in favor of the top-bar pill); embed mode supports /?persona=<id>&ind=<industry>
   **Self-check before emitting any link**: verify the path appears in this grammar AND every \`?param=\` you include is listed for that route. If unsure, link to the bare path.
   Every named item (product, leader, document, algorithm, threat, patent) MUST be a markdown link. Never output bare names or paths.
4. Main pages: ${mainPages}
5. Learning modules (${moduleList.count} total): ${moduleList.links}
6. Keep answers to 2–5 short, evidence-backed sentences or bullets. Use markdown formatting. Do not generate follow-up questions; the UI derives those separately. This is an educational assistant — never provide production security advice.

${citationsSection}

CONTEXT FROM PQC TODAY DATABASE:
${contextBlocks}`
}

/* ------------------------------------------------------------------ */
/*  Local model system prompt — streamlined for smaller models        */
/* ------------------------------------------------------------------ */

export function buildLocalSystemPrompt(
  chunks: RAGChunk[],
  pageContext?: PageContext,
  maxContextChars: number = LOCAL_MAX_CONTEXT_CHARS,
  maxEntities: number = LOCAL_MAX_INVENTORY_ENTITIES
): string {
  // See buildGeminiSystemPrompt for why this flag check is safe outside a
  // component despite the `use` prefix.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const citationsEnabled = useStructuredCitations()
  // Compact mode: truncate chunk content to fit more chunks in limited context
  const contextBlocks = buildContextBlocks(chunks, maxContextChars, true, citationsEnabled)
  const citationsNote = citationsEnabled
    ? `\nOUTPUT FORMAT (REQUIRED): Write at most 3 short bullet sentences, even when the context contains more than 3 matching items. Then write exactly one \`\`\`citations fence containing one JSON array. Add one object per bullet: {"claimExcerpt":"<copy the complete bullet sentence exactly as written above, without the bullet marker>","evidenceExcerpt":"<one contiguous verbatim excerpt copied from its context chunk; never add ...>","chunkId":"<that chunk's exact id>"}. The number of citation objects must equal the number of bullets. Never substitute source wording for the exact bullet text in claimExcerpt.\n`
    : ''

  // Compact page/persona context — every token counts at 4K
  let pageNote = ''
  if (pageContext?.page) {
    const filterInfo = pageContext.filters ? ` (${pageContext.filters})` : ''
    pageNote = `User is on: ${pageContext.page} page${filterInfo}.\n`
  }
  let personaNote = ''
  if (pageContext?.persona) {
    const depth = PERSONA_DEPTH[pageContext.persona as string]
    if (depth) personaNote = `Style: ${depth}\n`
  }
  let experienceNote = ''
  if (pageContext?.experienceLevel) {
    const depth = EXPERIENCE_DEPTH[pageContext.experienceLevel as string]
    if (depth) experienceNote = `Experience: ${depth}\n`
  }

  // Condensed user profile (persona + industry + region on one line)
  const profileParts: string[] = []
  if (pageContext?.persona) profileParts.push(`${pageContext.persona} persona`)
  if (pageContext?.industry) profileParts.push(pageContext.industry)
  if (pageContext?.region) {
    const label = REGION_LABELS[pageContext.region as string] ?? pageContext.region
    profileParts.push(label)
  }
  const profileNote = profileParts.length > 0 ? `User: ${profileParts.join(' | ')}\n` : ''

  // Condensed assessment context
  let assessNote = ''
  if (pageContext?.assessmentComplete && pageContext.riskScore !== undefined) {
    const parts = [`Risk ${pageContext.riskScore}/100 (${pageContext.riskLevel ?? '?'})`]
    if (pageContext.complianceFrameworks?.length)
      parts.push(pageContext.complianceFrameworks.slice(0, 3).join(', '))
    if (pageContext.migrationStatus) parts.push(pageContext.migrationStatus)
    assessNote = `Assessment: ${parts.join(' | ')}\n`
  }

  const inventorySection = extractEntityInventory(chunks, maxEntities)

  return `You are PQC Today Assistant — expert in post-quantum cryptography.
${pageNote}${personaNote}${experienceNote}${profileNote}${assessNote}
Answer ONLY from context below. Do not use general knowledge or training-memory facts. You may explain or paraphrase the context, but every factual statement must map to verbatim evidence from it. Never fabricate names, dates, numbers, quotes, or claims. Don't infer facts the context doesn't state.
Prefer short prose with one supported claim per sentence. Avoid headings and tables; their labels and rows also require evidence.
Never invent certification status (FIPS validated, ACVP certified, etc.) or claim a product supports an algorithm unless the context states it.
If sources conflict, say so instead of picking one silently.
If context only partly answers the question, state the limitation briefly and then answer from what IS supported. Only when none of the retrieved context addresses the question, say: "Based on the PQC Today database, I don't have enough information about [topic]."
${inventorySection}
Do not write markdown links. The application appends validated deep links from the cited corpus chunks after grounding.

BREVITY: Do not repeat the question. Do not add a heading, preamble, conclusion, table, or follow-up questions. Educational only — not production advice.
${citationsNote}

CONTEXT:
${contextBlocks}`
}
