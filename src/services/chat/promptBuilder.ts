// SPDX-License-Identifier: GPL-3.0-only
import type { RAGChunk } from '@/types/ChatTypes'
import type { PageContext } from '@/hooks/usePageContext'

/**
 * Approximate character budget for RAG context blocks in the system prompt.
 * Gemini 2.5 Flash supports ~1M tokens; Phi-3.5 Mini supports 128K tokens.
 * We reserve ~80K chars (~20K tokens) for context to leave ample room for
 * system instructions + conversation history.
 */
const MAX_CONTEXT_CHARS = 80_000
const MAX_INVENTORY_ENTITIES = 50

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
export function extractEntityInventory(chunks: RAGChunk[]): string {
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
    if (totalCount >= MAX_INVENTORY_ENTITIES) break
    const remaining = MAX_INVENTORY_ENTITIES - totalCount
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
}

const REGION_LABELS: Record<string, string> = {
  americas: 'Americas',
  eu: 'Europe',
  apac: 'Asia-Pacific',
  global: 'Global',
}

function buildContextBlocks(chunks: RAGChunk[]): string {
  const allBlocks: string[] = []
  let totalChars = 0

  for (const c of chunks) {
    const header = `--- Source: ${c.source} | ${c.title} ---`
    const deepLinkLine = c.deepLink ? `Deep Link: ${c.deepLink}` : ''
    const block = [header, deepLinkLine, c.content, '---'].filter(Boolean).join('\n')

    if (totalChars + block.length > MAX_CONTEXT_CHARS) break
    allBlocks.push(block)
    totalChars += block.length
  }

  return allBlocks.join('\n\n')
}

function buildSharedSections(chunks: RAGChunk[], pageContext?: PageContext) {
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

  const inventorySection = extractEntityInventory(chunks)

  return { pageNote, personaSection, profileSection, assessmentSection, inventorySection }
}

/* ------------------------------------------------------------------ */
/*  Gemini system prompt — full instructions (for large cloud models) */
/* ------------------------------------------------------------------ */

export function buildGeminiSystemPrompt(chunks: RAGChunk[], pageContext?: PageContext): string {
  const contextBlocks = buildContextBlocks(chunks)
  const { pageNote, personaSection, profileSection, assessmentSection, inventorySection } =
    buildSharedSections(chunks, pageContext)

  return `You are PQC Today Assistant, an expert in post-quantum cryptography (PQC). You help users understand PQC concepts, standards, migration strategies, and the quantum threat landscape.
${pageNote}${personaSection}${profileSection}${assessmentSection}
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
   - /algorithms?highlight=<slug>, /timeline?country=<name>, /library?ref=<id>
   - /migrate?q=<name>, /leaders?leader=<name>, /compliance?cert=<id>
   - /threats?id=<threatId>&industry=<industry>, /playground?algo=<name>
   - /learn/<module-id> (learning content), /learn/<module-id>?tab=workshop (hands-on workshop/simulation)
   - /learn/<module-id>?tab=workshop&step=<n> (specific workshop step), /assess?step=<n>
   - /openssl?cmd=<category> (genpkey, req, x509, enc, dgst, hash, rand, kem, pkcs12, lms, kdf)
   - /learn/quiz?category=<id> (comma-separated quiz categories, e.g. ?category=pqc-fundamentals,nist-standards)
   Every named item (product, leader, document, algorithm, threat) MUST be a markdown link. Never output bare names or paths.
4. Main pages: [Algorithms](/algorithms), [Timeline](/timeline), [Library](/library), [Threats](/threats), [Leaders](/leaders), [Compliance](/compliance), [Migrate](/migrate), [Assessment](/assess), [Report](/report), [Playground](/playground), [OpenSSL Studio](/openssl), [Learn](/learn), [Quiz](/learn/quiz)
5. Learning modules (27 total): [PQC 101](/learn/pqc-101), [Quantum Threats](/learn/quantum-threats), [Hybrid Crypto](/learn/hybrid-crypto), [Crypto Agility](/learn/crypto-agility), [TLS Basics](/learn/tls-basics), [VPN & SSH](/learn/vpn-ssh-pqc), [Email Signing](/learn/email-signing), [PKI Workshop](/learn/pki-workshop), [KMS & PQC Key Management](/learn/kms-pqc), [HSM & PQC Operations](/learn/hsm-pqc), [Data & Asset Sensitivity](/learn/data-asset-sensitivity), [Stateful Signatures](/learn/stateful-signatures), [Digital Assets](/learn/digital-assets), [5G Security](/learn/5g-security), [Digital Identity](/learn/digital-id), [Entropy & Randomness](/learn/entropy-randomness), [Merkle Tree Certs](/learn/merkle-tree-certs), [QKD](/learn/qkd), [Code Signing](/learn/code-signing), [API Security & JWT](/learn/api-security-jwt), [IoT & OT Security](/learn/iot-ot-pqc), [Vendor & Supply Chain Risk](/learn/vendor-risk), [Compliance & Regulatory Strategy](/learn/compliance-strategy), [Migration Program Management](/learn/migration-program), [PQC Risk Management](/learn/pqc-risk-management), [PQC Business Case](/learn/pqc-business-case), [PQC Governance & Policy](/learn/pqc-governance)
6. Keep answers concise but thorough. Use markdown formatting. This is an educational assistant — never provide production security advice.

FOLLOW-UP SUGGESTIONS:
After your response, append 2–3 follow-up questions in a \`\`\`followups code fence (one per line, no numbering). Example:
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

export function buildLocalSystemPrompt(chunks: RAGChunk[], pageContext?: PageContext): string {
  const contextBlocks = buildContextBlocks(chunks)
  const { pageNote, personaSection, profileSection, assessmentSection, inventorySection } =
    buildSharedSections(chunks, pageContext)

  return `You are PQC Today Assistant, an expert in post-quantum cryptography (PQC). You help users understand PQC concepts, standards, migration strategies, and the quantum threat landscape.
${pageNote}${personaSection}${profileSection}${assessmentSection}
Answer based ONLY on the provided context below. You may use general knowledge to explain concepts — never to list specific items.
${inventorySection}
RULES:
- NEVER fabricate names, numbers, dates, or claims not in the context.
- If context is insufficient, say "Based on the PQC Today database, I don't have information about [topic]" and share what IS available.
- When uncertain, say "According to the database..." or "The available data shows..."
- ONLY list items from the ENTITY INVENTORY above.
- When a context chunk has a "Deep Link:" field, use it as a markdown link (e.g., [Title](deep-link-url)).
- Keep answers concise. Use markdown formatting. This is educational — never provide production security advice.

After your response, suggest 2–3 follow-up questions, each on its own line starting with "- ".

CONTEXT FROM PQC TODAY DATABASE:
${contextBlocks}`
}
