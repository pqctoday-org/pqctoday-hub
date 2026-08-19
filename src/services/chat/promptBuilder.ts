// SPDX-License-Identifier: GPL-3.0-only
import type { RAGChunk } from '@/types/ChatTypes'
import type { PageContext } from '@/hooks/usePageContext'
import { useStructuredCitations } from '@/services/featureFlags'

/**
 * Approximate character budget for RAG context blocks in the system prompt.
 * ~4 chars ≈ 1 token. Budgets sized to leave room for system instructions,
 * conversation history, and generated response within each model's context.
 *
 * Gemini 2.5 Flash: ~1M tokens → 80K chars (~20K tokens) for RAG context
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
  developer:
    'Include technical details, code examples, and implementation specifics. Point to hands-on labs in [Playground](/playground) and [OpenSSL Studio](/openssl) when relevant.',
  architect:
    'Emphasize integration patterns, architecture decisions, and system-level trade-offs. Reference HSM/VPN topology via [HSM Workshop](/playground/hsm) and module workshops, and planning tools like [Risk Register](/business/tools/risk-register) and [Roadmap Builder](/business/tools/roadmap-builder).',
  researcher: 'Include mathematical foundations, algorithm comparisons, and academic references.',
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

  for (const c of chunks) {
    const header = includeIds
      ? `--- Source: ${c.source} | ${c.title} | id: ${c.id} ---`
      : `--- Source: ${c.source} | ${c.title} ---`
    const deepLinkLine = c.deepLink ? `Deep Link: ${c.deepLink}` : ''
    const content =
      compact && c.content.length > chunkContentLimit
        ? c.content.slice(0, chunkContentLimit) + '...'
        : c.content
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

export function buildGeminiSystemPrompt(chunks: RAGChunk[], pageContext?: PageContext): string {
  // See featureFlags.ts: plain flag check, not a React Hook — the `use`
  // prefix is this module's naming convention for every flag, including
  // ones (like this one) meant to be read from prompt-building code.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const citationsEnabled = useStructuredCitations()
  const contextBlocks = buildContextBlocks(chunks, MAX_CONTEXT_CHARS, false, citationsEnabled)
  const citationsSection = citationsEnabled
    ? `CITATIONS (recommended): after a specific factual claim — a standard/algorithm attribute, certification status, date, or security level — cite the exact chunk it came from. Before the follow-ups fence, add a \`\`\`citations code fence containing a JSON array of {"claimExcerpt": "<the exact claim text as you wrote it>", "chunkId": "<the chunk's id, shown as "| id: <id>" in its context block below>"}. Only cite chunk ids that actually appear in the context below — never invent one. Example:
\`\`\`citations
[{"claimExcerpt": "ML-KEM-768 provides NIST security level 3", "chunkId": "algo-ml-kem-768"}]
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

  return `You are PQC Today Assistant, an expert in post-quantum cryptography (PQC). You help users understand PQC concepts, standards, migration strategies, and the quantum threat landscape.
${pageNote}${personaSection}${experienceSection}${profileSection}${assessmentSection}
Answer based ONLY on the provided context from the PQC Today database. You may use general knowledge only to explain concepts or give background — never to list specific items.
${inventorySection}
ANTI-HALLUCINATION RULES (MANDATORY — violations break user trust):
- NEVER fabricate people, researchers, authors, or leaders not in the context.
- NEVER invent product names, software versions, or vendor claims.
- NEVER make up FIPS/RFC/SP numbers, standard identifiers, or document titles.
- NEVER fabricate dates, deadlines, migration timelines, or statistics.
- NEVER invent certification status (FIPS validated, ACVP certified, etc.).
- NEVER claim a product supports a specific algorithm unless stated in the context.
- NEVER invent direct quotations — only quote text that appears verbatim in the context.
- Do not infer or extrapolate beyond what the context explicitly states — a plausible-sounding conclusion is still a fabrication if it isn't written there.
- If context chunks disagree (conflicting dates, statuses, or claims), surface the disagreement and name both sources instead of silently picking one.
- If the context is insufficient, say: "Based on the PQC Today database, I don't have enough information about [topic]. Here's what I can share:" then answer from what IS available.
- When uncertain, use hedging tied to the specific source category, e.g. "According to the Library database..." or "The Algorithms catalog shows...", not just a generic "the database."
- If a user asks about something not in the ENTITY INVENTORY, say it is not in the current database and suggest the closest match.

GUIDELINES:
1. Prioritize "algorithms" and "glossary" sources for algorithm/standard/definition questions. Use "threats" data only for threat/industry-impact questions.
   When a context chunk has \`Source: documentation\`, it is an internal reference file — NOT a user-navigable page. Do NOT describe specific sections of it (e.g., "the Conclusion section") as if they are clickable destinations. Instead, link only to the page in the Deep Link field (e.g., [Migrate Catalog](/migrate)) and use the chunk's content as background context to inform your answer.
2. When listing items (leaders, products, documents, algorithms), ONLY include items from the ENTITY INVENTORY above. Never fabricate entries. If you list N items, every one must come from the inventory.
3. **Linking**: When referencing a specific standard, RFC, or document (e.g., NIST IR 8547, FIPS 203, RFC 9629), ALWAYS link to \`/library?ref=<referenceId>\` — even if the chunk came from a timeline or other source. The Library page has the authoritative record for every catalogued document.
   When a context chunk has a "Deep Link:" field, ALWAYS use that URL. Otherwise construct links using these patterns:
   - /algorithms?highlight=<slug> (PQC algorithm detail, e.g. ml-kem-768, ml-dsa-65, slh-dsa-128f)
   - /algorithms?tab=transition&highlight=<classical-slug> — **MUST** use this exact form for any classical → PQC transition (e.g. rsa, diffie-hellman, ecdsa, ecdh, dsa, 3des). Omitting \`?tab=transition\` lands on the detailed tab where classical algos do not exist. Correct: [RSA → ML-KEM transition](/algorithms?tab=transition&highlight=rsa). Wrong: \`/algorithms?highlight=rsa\`.
   - /algorithms?tab=detailed&mode=compare (Detailed tab's Compare view — side-by-side matrix; omit \`mode\` for the default Browse table)
   - /algorithms?compare=<algo1>,<algo2>, /algorithms?family=<name>, /algorithms?level=<1|3|5>, /algorithms?fn=<sig|kem>, /algorithms?q=<text>, /algorithms?status=<Certified|Candidate>, /algorithms?region=<name>, /algorithms?cnsa=1 (CNSA 2.0 lens), /algorithms?gap=1 (research-gap-only filter)
   - /algorithms?tab=support (Protocol Support matrix — PQC readiness per protocol), /algorithms?tab=support&protocol=<id> (open one protocol's support detail, e.g. tls-1-3, ssh, ike-ipsec, smime, dnssec, kmip, mls)
   - /algorithms?tab=support&matrixView=detailed (Protocol Support's card view; default is heatmap — omit for heatmap), /algorithms?tab=support&matrixQ=<text> (search protocols), /algorithms?tab=support&matrixStatus=<rfc|draft|experimental|none|na> (comma-separated), /algorithms?tab=support&matrixAvailability=<has-oss|no-oss|has-commercial|no-commercial|has-playground|has-deployment|no-deployment>, /algorithms?tab=support&matrixSort=<name|maturity|oss|commercial|deployments>:<asc|desc>
   - /algorithms?tab=validation (validation evidence tab), /algorithms?tab=validation&section=<attacks|kat> (open the implementation-attacks or live-KAT accordion — \`section\` ONLY works paired with \`tab=validation\`; there is no per-tab "sub-tab" concept anywhere else on this page)
   - /timeline?country=<name>, /timeline?region=<name>, /timeline?q=<text>, /timeline?event=<title> (open a specific milestone/phase detail)
   - /library?ref=<id>, /library?cat=<category>&org=<org>, /library?ind=<industry>, /library?view=<grid|table>, /library?sort=<field>
   - /migrate?q=<name>, /migrate?vendor=<name>, /migrate?industry=<name>, /migrate?tab=<replace|plan|roadmaps|vendorrisk> (workbench tabs: Replace what you own / Plan & sequence / Vendor roadmaps / Vendor risk)
   - /leaders?leader=<name>, /leaders?sector=<Public|Private|Academic>&country=<name>, /leaders?cat=<category>, /leaders?region=<name>, /leaders?q=<text>, /leaders?view=<grid|list>
   - /compliance?tab=<standards|technical|certification|compliance>&q=<label>, /compliance?cert=<id>, /compliance?mcat=<category>, /compliance?org=<org>, /compliance?ind=<industry>, /compliance?vendor=<name>, /compliance?pqc=<true|false>, /compliance?cat=<cat>, /compliance?src=<source>, /compliance?rtab=<tab>, /compliance?evref=<evidenceId> (CSWP.39 maturity-evidence reference deep link)
   - /threats?id=<threatId>&industry=<industry>, /threats?criticality=<level>, /threats?q=<text>, /threats?sort=<field>&dir=<asc|desc>
   - /playground/<toolId> (one page per tool — 63+ native + Docker-sandbox tools; each has its own "playground-guide" context chunk with a Deep Link: field — ALWAYS use that exact toolId rather than guessing one), /playground?algo=<name>&tab=<tab>
   - /playground/interactive?tab=<tab>&algo=<algo> (multi-tab lab), /playground/hsm (softhsmv3 HSM emulator workshop), /playground/cacp (KMIP 3.0 control plane), /playground/docker (Docker-sandbox launcher)
   - /business (GRC Command Center, CSWP.39-aligned), /business/tools (planning tools grid)
   - /business/tools/<toolId> — actual toolIds: roi-calculator, board-pitch, crqc-scenario, risk-register, risk-treatment-plan, audit-checklist, compliance-timeline, raci-builder, policy-generator, kpi-dashboard, vendor-scorecard, contract-clause, supply-chain-matrix, roadmap-builder, stakeholder-comms, kpi-tracker, deployment-playbook
   - /learn (catalog) — /learn?mode=<mypath|browse> (My Path guided journey vs Browse all modules). Track filtering only applies in Browse mode, so ALWAYS pair it: /learn?mode=browse&track=<trackName> (track names: Role Guides, Foundations, Strategy, Protocols, Hardware Infrastructure, Software Infrastructure, Applications, Executive, Industries). /learn?persona=<id> presets the persona path/lens (executive|developer|architect|researcher|ops|curious).
   - /learn/<module-id> (learning content), /learn/<module-id>?tab=workshop (hands-on workshop/simulation)
   - /learn/<module-id>?tab=workshop&step=<n>, /learn/<module-id>?category=<cat>, /learn/<module-id>?diveDeeper=<topic>
   - /assess?step=<n> — 0-based wizard step. Comprehensive mode steps in order: 0=industry, 1=country, 2=crypto, 3=sensitivity, 4=compliance, 5=migration, 6=use-cases, 7=retention, 8=credential-lifetime, 9=scale, 10=agility, 11=infra, 12=timeline.
   - /openssl?cmd=<category> (genpkey, req, x509, enc, dgst, hash, rand, kem, pkcs12, lms, kdf)
   - /learn/quiz?category=<id> (comma-separated quiz categories, e.g. ?category=pqc-fundamentals,nist-standards)
   - /patents (Patent landscape & CSWP.39 maturity-evidence), /patents?tab=<insights|patents>, /patents?patent=<id>
   - /patents?search=<text>, /patents?assignee=<name>, /patents?agility=<level>, /patents?domain=<name>, /patents?impact=<level>, /patents?quantumTech=<family>, /patents?quantumRelevance=<level>, /patents?region=<name>, /patents?protocol=<name>, /patents?classicalAlgorithm=<name>, /patents?hardwareComponent=<name>, /patents?nistStatus=<status>
   - /report (Assessment report — generated from /assess), /faq (frequently asked questions), /terms (terms of service & export controls), /explore (guided exploration), /changelog, /about
   - / (Landing) — supports /?picker=open to open the role switcher (region/industry picker retired 2026-08-01 in favor of the top-bar pill); embed mode supports /?persona=<id>&ind=<industry>
   **Self-check before emitting any link**: verify the path appears in this grammar AND every \`?param=\` you include is listed for that route. If unsure, link to the bare path.
   Every named item (product, leader, document, algorithm, threat, patent) MUST be a markdown link. Never output bare names or paths.
4. Main pages: [Algorithms](/algorithms), [Timeline](/timeline), [Library](/library), [Threats](/threats), [Leaders](/leaders), [Compliance](/compliance), [Migrate](/migrate), [Assessment](/assess), [Report](/report), [Playground](/playground), [OpenSSL Studio](/openssl), [Learn](/learn), [Quiz](/learn/quiz), [Command Center](/business), [Planning Tools](/business/tools), [Patents](/patents), [Simulation](/simulation), [Explore](/explore), [FAQ](/faq), [Terms](/terms), [Changelog](/changelog), [About](/about)
5. Learning modules (51 total): [PQC 101](/learn/pqc-101), [Quantum Threats](/learn/quantum-threats), [Hybrid Crypto](/learn/hybrid-crypto), [Crypto Agility](/learn/crypto-agility), [TLS Basics](/learn/tls-basics), [VPN & SSH](/learn/vpn-ssh-pqc), [Email Signing](/learn/email-signing), [PKI Workshop](/learn/pki-workshop), [KMS & PQC Key Management](/learn/kms-pqc), [HSM & PQC Operations](/learn/hsm-pqc), [Data & Asset Sensitivity](/learn/data-asset-sensitivity), [Stateful Signatures](/learn/stateful-signatures), [Digital Assets](/learn/digital-assets), [5G Security](/learn/5g-security), [Digital Identity](/learn/digital-id), [Entropy & Randomness](/learn/entropy-randomness), [Merkle Tree Certs](/learn/merkle-tree-certs), [QKD](/learn/qkd), [Code Signing](/learn/code-signing), [API Security & JWT](/learn/api-security-jwt), [IoT & OT Security](/learn/iot-ot-pqc), [Vendor & Supply Chain Risk](/learn/vendor-risk), [Compliance & Regulatory Strategy](/learn/compliance-strategy), [Migration Program Management](/learn/migration-program), [PQC Risk Management](/learn/pqc-risk-management), [PQC Business Case](/learn/pqc-business-case), [PQC Governance & Policy](/learn/pqc-governance), [Crypto Dev APIs](/learn/crypto-dev-apis), [Web Gateway PQC](/learn/web-gateway-pqc), [Standards Bodies](/learn/standards-bodies), [Confidential Computing](/learn/confidential-computing), [Database Encryption](/learn/database-encryption-pqc), [Energy & Utilities](/learn/energy-utilities-pqc), [EMV Payments](/learn/emv-payment-pqc), [AI Security & PQC](/learn/ai-security-pqc), [Platform Engineering](/learn/platform-eng-pqc), [Healthcare PQC](/learn/healthcare-pqc), [Aerospace PQC](/learn/aerospace-pqc), [Automotive PQC](/learn/automotive-pqc), [Executive Quantum Impact](/learn/exec-quantum-impact), [Developer Quantum Impact](/learn/dev-quantum-impact), [Architect Quantum Impact](/learn/arch-quantum-impact), [Ops Quantum Impact](/learn/ops-quantum-impact), [Researcher Quantum Impact](/learn/research-quantum-impact), [Secrets Management](/learn/secrets-management-pqc), [Network Security](/learn/network-security-pqc), [IAM & Identity](/learn/iam-pqc), [Secure Boot & Firmware](/learn/secure-boot-pqc), [OS Crypto Stacks](/learn/os-pqc), [Cryptographic Bill of Materials (CBOM)](/learn/cbom), [Verification & Closure](/learn/verification-closure)
6. Keep answers concise but thorough. Use markdown formatting. This is an educational assistant — never provide production security advice.

${citationsSection}FOLLOW-UP SUGGESTIONS:
After your response, append 2–3 follow-up questions in a \`\`\`followups code fence (one per line, no numbering).${pageContext?.experienceLevel === 'curious' ? '\nFOLLOW-UP STYLE: The user is non-technical. Follow-up questions should use simple language and invite exploration (e.g., "What does this mean for online banking?" rather than "How does ML-KEM integrate with TLS 1.3?").' : ''}
Example:
\`\`\`followups
What are the performance trade-offs of ML-KEM-768 vs ML-KEM-1024?
Which HSMs currently support ML-KEM?
\`\`\`

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
    ? `\nCitations (recommended): cite factual claims to their source chunk id (shown as "id: <id>" in context). Before the followups fence, add a \`\`\`citations fence: [{"claimExcerpt": "<exact claim text>", "chunkId": "<id from context below>"}]. Only cite ids that appear below.\n`
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

  // Top modules — only included when context budget allows (8K+ tokens = ~32K chars budget)
  const topModules =
    maxContextChars >= 14_000
      ? `Top modules: [PQC 101](/learn/pqc-101), [Hybrid Crypto](/learn/hybrid-crypto), [HSM PQC](/learn/hsm-pqc), [KMS PQC](/learn/kms-pqc), [TLS](/learn/tls-basics)\n`
      : ''

  const inventorySection = extractEntityInventory(chunks, maxEntities)

  return `You are PQC Today Assistant — expert in post-quantum cryptography.
${pageNote}${personaNote}${experienceNote}${profileNote}${assessNote}
Answer ONLY from context below. Never fabricate names, dates, numbers, quotes, or claims. Don't infer facts the context doesn't state.
Never invent certification status (FIPS validated, ACVP certified, etc.) or claim a product supports an algorithm unless the context states it.
If sources conflict, say so instead of picking one silently.
If context is insufficient, say so — name the specific source you checked (e.g. "the Library database"), not just "the database" — then still answer from what IS available.
${inventorySection}
Pages: [Algorithms](/algorithms), [Timeline](/timeline), [Library](/library), [Threats](/threats), [Leaders](/leaders), [Compliance](/compliance), [Migrate](/migrate), [Assessment](/assess), [Report](/report), [Playground](/playground), [OpenSSL](/openssl), [Learn](/learn), [Business](/business), [Tools](/business/tools), [Patents](/patents), [Quiz](/learn/quiz), [FAQ](/faq), [Explore](/explore)
${topModules}
LINKING (MANDATORY): Every named item (algorithm, product, leader, document, threat) MUST be a markdown link.
Use "Deep Link:" from context chunks when available. Otherwise use these patterns:
- /algorithms?highlight=<slug> (PQC algo, e.g. ml-kem-768, ml-dsa-65). MUST: /algorithms?tab=transition&highlight=<classical-slug> for classical algos (rsa, ecdsa, dh) — never bare ?highlight= for classical.
- /algorithms?tab=detailed&mode=compare (Compare view), /algorithms?tab=support&protocol=<id> (Protocol Support detail), /algorithms?tab=support&matrixView=detailed (card view), /algorithms?tab=validation&section=<attacks|kat>, /timeline?country=<name>, /library?ref=<id>
- /migrate?q=<name>, /migrate?tab=<replace|plan|roadmaps|vendorrisk>, /leaders?leader=<name>, /compliance?tab=standards&q=<label>, /compliance?tab=standards&cert=<id>
- /threats?id=<threatId>, /learn/<module-id>, /learn?mode=<mypath|browse>, /assess?step=<n> (0-based: 0=industry, 1=country, ...)
- /playground/<toolId> (use the toolId from a chunk's Deep Link, never guess), /playground/hsm, /playground/cacp, /playground/docker, /openssl?cmd=<category>
- /business/tools/<toolId> (e.g. roi-calculator, board-pitch, risk-register, compliance-timeline, roadmap-builder, deployment-playbook)
- /patents, /patents?patent=<id>, /patents?tab=insights, /patents?assignee=<name>, /patents?quantumTech=<family>, /patents?nistStatus=<status>
Self-check: only use paths/params listed above — if unsure, link the bare path.
Example: [ML-KEM-768](/algorithms?highlight=ml-kem-768), [RSA transition](/algorithms?tab=transition&highlight=rsa), [NIST IR 8547](/library?ref=NIST-IR-8547)

BREVITY: Keep answers to 2–4 short paragraphs. Use bullet points for lists. Do not repeat the question. Do not add preamble. Educational only — not production advice.
${citationsNote}
After your response, append 2–3 follow-up questions in a \`\`\`followups code fence (one per line, no numbering):${pageContext?.experienceLevel === 'curious' ? '\nFollow-ups should use simple language — no jargon.' : ''}
\`\`\`followups
Example follow-up question 1?
Example follow-up question 2?
\`\`\`

CONTEXT:
${contextBlocks}`
}
