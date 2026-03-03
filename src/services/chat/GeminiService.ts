// SPDX-License-Identifier: GPL-3.0-only
import type { ChatMessage, RAGChunk } from '@/types/ChatTypes'
import type { PageContext } from '@/hooks/usePageContext'

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

/**
 * Approximate character budget for RAG context blocks in the system prompt.
 * Gemini 2.5 Flash supports ~1M tokens; we reserve ~80K chars (~20K tokens)
 * for context to leave ample room for system instructions + conversation history.
 */
const MAX_CONTEXT_CHARS = 80_000
const MAX_INVENTORY_ENTITIES = 30

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

export function buildSystemPrompt(chunks: RAGChunk[], pageContext?: PageContext): string {
  // Build context blocks with size guard — drop lowest-priority chunks if over budget
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

  const contextBlocks = allBlocks.join('\n\n')

  let pageNote = ''
  if (pageContext?.page) {
    const tabInfo =
      pageContext.tab && pageContext.tab !== 'learn'
        ? ` (${pageContext.tab} tab${pageContext.step ? `, step ${pageContext.step + 1}` : ''})`
        : ''
    pageNote = `\nThe user is currently viewing the ${pageContext.page} page${tabInfo}. Tailor your response accordingly when relevant.\n`
  }

  // Persona-specific response style
  const PERSONA_DEPTH: Record<string, string> = {
    executive:
      'Lead with business impact, timelines, and risk. Avoid deep technical jargon. Use ROI framing.',
    developer: 'Include technical details, code examples, and implementation specifics.',
    architect:
      'Emphasize integration patterns, architecture decisions, and system-level trade-offs.',
    researcher: 'Include mathematical foundations, algorithm comparisons, and academic references.',
  }
  let personaSection = ''
  if (pageContext?.persona) {
    const depth = PERSONA_DEPTH[pageContext.persona as string]
    if (depth) personaSection = `\nRESPONSE STYLE: ${depth}\n`
  }

  // User profile (industry + region)
  const REGION_LABELS: Record<string, string> = {
    americas: 'Americas',
    eu: 'Europe',
    apac: 'Asia-Pacific',
    global: 'Global',
  }
  const profileLines: string[] = []
  if (pageContext?.industry) profileLines.push(`Industry: ${pageContext.industry}`)
  if (pageContext?.region) {
    const label = REGION_LABELS[pageContext.region as string] ?? pageContext.region
    profileLines.push(`Region: ${label}`)
  }
  const profileSection =
    profileLines.length > 0 ? `\nUSER PROFILE:\n  ${profileLines.join('\n  ')}\n` : ''

  // Assessment context
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

  return `You are PQC Today Assistant, an expert in post-quantum cryptography (PQC). You help users understand PQC concepts, standards, migration strategies, and the quantum threat landscape.
${pageNote}${personaSection}${profileSection}${assessmentSection}
Answer based ONLY on the provided context from the PQC Today database. Do not invent or supplement with people, products, documents, certifications, or data not present below. Say so honestly if the context is insufficient. You may use general knowledge only to explain concepts or give background — never to list specific items.
${inventorySection}
GUIDELINES:
1. Prioritize "algorithms" and "glossary" sources for algorithm/standard/definition questions. Use "threats" data only for threat/industry-impact questions.
2. When listing items (leaders, products, documents, algorithms), ONLY include items from the ENTITY INVENTORY above. Never fabricate entries.
3. **Linking**: When a context chunk has a "Deep Link:" field, ALWAYS use that URL. Otherwise construct links using these patterns:
   - /algorithms?highlight=<slug>, /timeline?country=<name>, /library?ref=<id>
   - /migrate?q=<name>, /leaders?leader=<name>, /compliance?cert=<id>
   - /threats?id=<threatId>&industry=<industry>, /playground?algo=<name>
   - /learn/<module-id> (learning content), /learn/<module-id>?tab=workshop (hands-on workshop/simulation)
   - /learn/<module-id>?tab=workshop&step=<n> (specific workshop step), /assess?step=<n>
   - /openssl?cmd=<category> (genpkey, req, x509, enc, dgst, hash, rand, kem, pkcs12, lms, kdf)
   - /learn/quiz?category=<id> (comma-separated quiz categories, e.g. ?category=pqc-fundamentals,nist-standards)
   Every named item (product, leader, document, algorithm, threat) MUST be a markdown link. Never output bare names or paths.
4. Main pages: [Algorithms](/algorithms), [Timeline](/timeline), [Library](/library), [Threats](/threats), [Leaders](/leaders), [Compliance](/compliance), [Migrate](/migrate), [Assessment](/assess), [Report](/report), [Playground](/playground), [OpenSSL Studio](/openssl), [Learn](/learn), [Quiz](/learn/quiz)
5. Learning modules (25 total): [PQC 101](/learn/pqc-101), [Quantum Threats](/learn/quantum-threats), [Hybrid Crypto](/learn/hybrid-crypto), [Crypto Agility](/learn/crypto-agility), [TLS Basics](/learn/tls-basics), [VPN & SSH](/learn/vpn-ssh-pqc), [Email Signing](/learn/email-signing), [PKI Workshop](/learn/pki-workshop), [KMS & PQC Key Management](/learn/kms-pqc), [HSM & PQC Operations](/learn/hsm-pqc), [Stateful Signatures](/learn/stateful-signatures), [Digital Assets](/learn/digital-assets), [5G Security](/learn/5g-security), [Digital Identity](/learn/digital-id), [Entropy & Randomness](/learn/entropy-randomness), [Merkle Tree Certs](/learn/merkle-tree-certs), [QKD](/learn/qkd), [Code Signing](/learn/code-signing), [API Security & JWT](/learn/api-security-jwt), [IoT & OT Security](/learn/iot-ot-pqc), [Vendor & Supply Chain Risk](/learn/vendor-risk), [Compliance & Regulatory Strategy](/learn/compliance-strategy), [Migration Program Management](/learn/migration-program), [PQC Risk Management](/learn/pqc-risk-management), [PQC Business Case](/learn/pqc-business-case), [PQC Governance & Policy](/learn/pqc-governance)
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

function formatMessages(
  messages: ChatMessage[]
): Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> {
  // Send last 10 messages for context
  return messages.slice(-10).map((m) => ({
    role: m.role === 'user' ? ('user' as const) : ('model' as const),
    parts: [{ text: m.content }],
  }))
}

export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch(`${GEMINI_BASE}/gemini-2.5-flash?key=${apiKey}`)
    return response.ok
  } catch {
    return false
  }
}

/**
 * Safety settings — lower thresholds for cybersecurity content so legitimate
 * PQC discussions (cryptanalysis, attack vectors, algorithm weaknesses) aren't blocked.
 */
const SAFETY_SETTINGS = [
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
]

const MAX_RETRIES = 2
const RETRY_DELAY_MS = 1_000

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  retries = MAX_RETRIES
): Promise<Response> {
  const response = await fetch(url, init)

  // Only retry on transient server errors (5xx), not client errors
  if (response.status >= 500 && retries > 0) {
    await new Promise((resolve) =>
      setTimeout(resolve, RETRY_DELAY_MS * (MAX_RETRIES - retries + 1))
    )
    return fetchWithRetry(url, init, retries - 1)
  }

  return response
}

export async function* streamResponse(
  apiKey: string,
  messages: ChatMessage[],
  contextChunks: RAGChunk[],
  model = 'gemini-2.5-flash',
  signal?: AbortSignal,
  pageContext?: PageContext
): AsyncGenerator<string> {
  const systemPrompt = buildSystemPrompt(contextChunks, pageContext)
  const formattedMessages = formatMessages(messages)

  const response = await fetchWithRetry(
    `${GEMINI_BASE}/${model}:streamGenerateContent?key=${apiKey}&alt=sse`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: formattedMessages,
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 8192,
          topP: 0.9,
        },
        safetySettings: SAFETY_SETTINGS,
      }),
      signal,
    }
  )

  if (!response.ok) {
    const status = response.status
    if (status === 401 || status === 403) {
      throw new Error('Invalid API key. Please check your key and try again.')
    }
    if (status === 429) {
      throw new Error('Rate limit reached. Please wait a moment before trying again.')
    }
    throw new Error(`Gemini API error: ${status}`)
  }

  const reader = response.body?.getReader()
  if (!reader) throw new Error('No response body')

  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const json = line.slice(6).trim()
        if (!json || json === '[DONE]') continue

        try {
          const parsed = JSON.parse(json)
          const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text
          if (text) yield text
          const finishReason = parsed.candidates?.[0]?.finishReason
          if (finishReason === 'MAX_TOKENS') {
            yield '\n\n*(Response truncated — try asking a more specific question.)*'
          } else if (finishReason === 'SAFETY') {
            yield '\n\n*(Response blocked by content safety filters. Try rephrasing your question.)*'
          } else if (finishReason === 'RECITATION') {
            yield '\n\n*(Response stopped due to potential copyright concerns. Try a more specific question.)*'
          }
        } catch {
          // Skip malformed SSE chunks
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}
