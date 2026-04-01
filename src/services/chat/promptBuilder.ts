// SPDX-License-Identifier: GPL-3.0-only
import type { RAGChunk } from '@/types/ChatTypes'
import type { PageContext } from '@/hooks/usePageContext'

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
    'Lead with business impact, timelines, and risk. Avoid deep technical jargon. Use ROI framing.',
  developer: 'Include technical details, code examples, and implementation specifics.',
  architect: 'Emphasize integration patterns, architecture decisions, and system-level trade-offs.',
  researcher: 'Include mathematical foundations, algorithm comparisons, and academic references.',
  ops: 'Focus on deployment steps, infrastructure configs, and operational procedures. Include CLI commands, config examples, and rollback guidance.',
  curious:
    'This person has no technical background. Lead with real-world impact and simple metaphors. Avoid all jargon — if you must mention a standard (e.g., FIPS 203), immediately explain what it means in plain English. Keep answers short (2-3 paragraphs max). Use questions and everyday examples to make concepts relatable.',
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
  compact = false
): string {
  const allBlocks: string[] = []
  let totalChars = 0
  const chunkContentLimit = compact ? 600 : Infinity

  for (const c of chunks) {
    const header = `--- Source: ${c.source} | ${c.title} ---`
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
    pageNote = `\nThe user is currently viewing the ${pageContext.page} page${tabInfo}. Tailor your response accordingly when relevant.\n`
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
  const contextBlocks = buildContextBlocks(chunks)
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
- If the context is insufficient, say: "Based on the PQC Today database, I don't have enough information about [topic]. Here's what I can share:" then answer from what IS available.
- When uncertain, use hedging: "According to the database..." or "The available data shows..."
- If a user asks about something not in the ENTITY INVENTORY, say it is not in the current database and suggest the closest match.

GUIDELINES:
1. Prioritize "algorithms" and "glossary" sources for algorithm/standard/definition questions. Use "threats" data only for threat/industry-impact questions.
   When a context chunk has \`Source: documentation\`, it is an internal reference file — NOT a user-navigable page. Do NOT describe specific sections of it (e.g., "the Conclusion section") as if they are clickable destinations. Instead, link only to the page in the Deep Link field (e.g., [Migrate Catalog](/migrate)) and use the chunk's content as background context to inform your answer.
2. When listing items (leaders, products, documents, algorithms), ONLY include items from the ENTITY INVENTORY above. Never fabricate entries. If you list N items, every one must come from the inventory.
3. **Linking**: When referencing a specific standard, RFC, or document (e.g., NIST IR 8547, FIPS 203, RFC 9629), ALWAYS link to \`/library?ref=<referenceId>\` — even if the chunk came from a timeline or other source. The Library page has the authoritative record for every catalogued document.
   When a context chunk has a "Deep Link:" field, ALWAYS use that URL. Otherwise construct links using these patterns:
   - /algorithms?highlight=<slug> (PQC algorithm detail, e.g. ml-kem-768, ml-dsa-65, slh-dsa-128f)
   - /algorithms?tab=transition&highlight=<classical-slug> (classical→PQC transition, e.g. rsa, diffie-hellman, ecdsa)
   - /algorithms?tab=detailed&subtab=<performance|security|sizes|usecases> (algorithm comparison sub-views)
   - /algorithms?compare=<algo1>,<algo2>, /algorithms?family=<name>
   - /timeline?country=<name>, /timeline?region=<name>
   - /library?ref=<id>, /library?cat=<category>&org=<org>
   - /migrate?q=<name>, /migrate?layer=<layer>&cat=<category>
   - /leaders?leader=<name>, /leaders?sector=<Public|Private|Academic>&country=<name>
   - /compliance?tab=standards&q=<label>, /compliance?tab=standards&cert=<id>, /compliance?mcat=<category>
   - /threats?id=<threatId>&industry=<industry>
   - /playground/<toolId> (workshop tool), /playground?algo=<name>
   - /playground/interactive?tab=<tab>&algo=<algo> (interactive lab), /playground/hsm (HSM emulator)
   - /business (GRC dashboard), /business/tools (planning tools), /business/tools/<toolId> (specific tool)
   - /learn/<module-id> (learning content), /learn/<module-id>?tab=workshop (hands-on workshop/simulation)
   - /learn/<module-id>?tab=workshop&step=<n> (specific workshop step), /assess?step=<n>
   - /openssl?cmd=<category> (genpkey, req, x509, enc, dgst, hash, rand, kem, pkcs12, lms, kdf)
   - /learn/quiz?category=<id> (comma-separated quiz categories, e.g. ?category=pqc-fundamentals,nist-standards)
   - /faq (frequently asked questions)
   Every named item (product, leader, document, algorithm, threat) MUST be a markdown link. Never output bare names or paths.
4. Main pages: [Algorithms](/algorithms), [Timeline](/timeline), [Library](/library), [Threats](/threats), [Leaders](/leaders), [Compliance](/compliance), [Migrate](/migrate), [Assessment](/assess), [Report](/report), [Playground](/playground), [OpenSSL Studio](/openssl), [Learn](/learn), [Quiz](/learn/quiz), [Business Center](/business), [FAQ](/faq)
5. Learning modules (49 total): [PQC 101](/learn/pqc-101), [Quantum Threats](/learn/quantum-threats), [Hybrid Crypto](/learn/hybrid-crypto), [Crypto Agility](/learn/crypto-agility), [TLS Basics](/learn/tls-basics), [VPN & SSH](/learn/vpn-ssh-pqc), [Email Signing](/learn/email-signing), [PKI Workshop](/learn/pki-workshop), [KMS & PQC Key Management](/learn/kms-pqc), [HSM & PQC Operations](/learn/hsm-pqc), [Data & Asset Sensitivity](/learn/data-asset-sensitivity), [Stateful Signatures](/learn/stateful-signatures), [Digital Assets](/learn/digital-assets), [5G Security](/learn/5g-security), [Digital Identity](/learn/digital-id), [Entropy & Randomness](/learn/entropy-randomness), [Merkle Tree Certs](/learn/merkle-tree-certs), [QKD](/learn/qkd), [Code Signing](/learn/code-signing), [API Security & JWT](/learn/api-security-jwt), [IoT & OT Security](/learn/iot-ot-pqc), [Vendor & Supply Chain Risk](/learn/vendor-risk), [Compliance & Regulatory Strategy](/learn/compliance-strategy), [Migration Program Management](/learn/migration-program), [PQC Risk Management](/learn/pqc-risk-management), [PQC Business Case](/learn/pqc-business-case), [PQC Governance & Policy](/learn/pqc-governance), [Crypto Dev APIs](/learn/crypto-dev-apis), [Web Gateway PQC](/learn/web-gateway-pqc), [Standards Bodies](/learn/standards-bodies), [Confidential Computing](/learn/confidential-computing), [Database Encryption](/learn/database-encryption-pqc), [Energy & Utilities](/learn/energy-utilities-pqc), [EMV Payments](/learn/emv-payment-pqc), [AI Security & PQC](/learn/ai-security-pqc), [Platform Engineering](/learn/platform-eng-pqc), [Healthcare PQC](/learn/healthcare-pqc), [Aerospace PQC](/learn/aerospace-pqc), [Automotive PQC](/learn/automotive-pqc), [Executive Quantum Impact](/learn/exec-quantum-impact), [Developer Quantum Impact](/learn/dev-quantum-impact), [Architect Quantum Impact](/learn/arch-quantum-impact), [Ops Quantum Impact](/learn/ops-quantum-impact), [Researcher Quantum Impact](/learn/research-quantum-impact), [Secrets Management](/learn/secrets-management-pqc), [Network Security](/learn/network-security-pqc), [IAM & Identity](/learn/iam-pqc), [Secure Boot & Firmware](/learn/secure-boot-pqc), [OS Crypto Stacks](/learn/os-pqc)
6. Keep answers concise but thorough. Use markdown formatting. This is an educational assistant — never provide production security advice.

FOLLOW-UP SUGGESTIONS:
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
  // Compact mode: truncate chunk content to fit more chunks in limited context
  const contextBlocks = buildContextBlocks(chunks, maxContextChars, true)

  // Compact page/persona context — every token counts at 4K
  let pageNote = ''
  if (pageContext?.page) {
    pageNote = `User is on: ${pageContext.page} page.\n`
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
Answer ONLY from context below. Never fabricate names, dates, numbers, or claims.
If unsure, say "Based on the PQC Today database, I don't have that information."
${inventorySection}
Pages: [Algorithms](/algorithms), [Timeline](/timeline), [Library](/library), [Threats](/threats), [Leaders](/leaders), [Compliance](/compliance), [Migrate](/migrate), [Assessment](/assess), [Playground](/playground), [OpenSSL](/openssl), [Learn](/learn), [Business](/business), [Quiz](/learn/quiz), [FAQ](/faq)
${topModules}
LINKING (MANDATORY): Every named item (algorithm, product, leader, document, threat) MUST be a markdown link.
Use "Deep Link:" from context chunks when available. Otherwise use these patterns:
- /algorithms?highlight=<slug> (PQC algo, e.g. ml-kem-768, ml-dsa-65), /algorithms?tab=transition&highlight=<classical-slug> (classical algo, e.g. rsa, ecdsa)
- /algorithms?tab=detailed&subtab=<performance|security|sizes|usecases>, /timeline?country=<name>, /library?ref=<id>
- /migrate?q=<name>, /leaders?leader=<name>, /compliance?tab=standards&q=<label>, /compliance?tab=standards&cert=<id>
- /threats?id=<threatId>, /learn/<module-id>, /assess?step=<n>
- /playground/<toolId>, /business/tools/<toolId>, /openssl?cmd=<category>
Example: [ML-KEM-768](/algorithms?highlight=ml-kem-768), [RSA transition](/algorithms?tab=transition&highlight=rsa), [NIST IR 8547](/library?ref=NIST-IR-8547)

BREVITY: Keep answers to 2–4 short paragraphs. Use bullet points for lists. Do not repeat the question. Do not add preamble. Educational only — not production advice.

After your response, append 2–3 follow-up questions in a \`\`\`followups code fence (one per line, no numbering):${pageContext?.experienceLevel === 'curious' ? '\nFollow-ups should use simple language — no jargon.' : ''}
\`\`\`followups
Example follow-up question 1?
Example follow-up question 2?
\`\`\`

CONTEXT:
${contextBlocks}`
}
