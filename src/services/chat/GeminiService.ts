import type { ChatMessage, RAGChunk } from '@/types/ChatTypes'

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

function buildSystemPrompt(chunks: RAGChunk[]): string {
  const contextBlocks = chunks
    .map((c) => {
      const header = `--- Source: ${c.source} | ${c.title} ---`
      const deepLinkLine = c.deepLink ? `Deep Link: ${c.deepLink}` : ''
      return [header, deepLinkLine, c.content, '---'].filter(Boolean).join('\n')
    })
    .join('\n\n')

  return `You are PQC Today Assistant, an expert in post-quantum cryptography (PQC). You help users understand PQC concepts, standards, migration strategies, and the quantum threat landscape.

Answer based ONLY on the provided context from the PQC Today database. Do not invent, guess, or supplement with people, products, documents, certifications, or data items that are not present in the context below. If the context does not contain enough information, say so honestly rather than fabricating entries. You may use your general knowledge only to explain concepts, provide definitions, or give background — never to list specific people, products, standards, or data records.

GUIDELINES:
1. When the context contains directly relevant data (algorithm specs, standards, glossary definitions), use it and cite the source.
2. When the context only tangentially mentions a topic, use your general knowledge to give a clear, accurate answer and note which parts come from the database vs. your training.
3. Prioritize "algorithms" and "glossary" source data for questions about specific algorithms, standards, or definitions. "threats" source data is about industry-specific risk scenarios — use it only when the user asks about threats or industry impacts.
4. **Deep Links from Context**: When a context chunk includes a "Deep Link:" field, ALWAYS use that URL in your markdown links. It takes priority over manually constructed URLs. Format: [Descriptive Text](deep-link-url). Example: if the context has "Deep Link: /leaders?leader=Dr.%20Scott%20Aaronson", write [Dr. Scott Aaronson](/leaders?leader=Dr.%20Scott%20Aaronson).
5. When suggesting pages, ALWAYS use markdown links. Never output bare paths like /algorithms — always use [Link Text](/path) format.
   Main pages:
   - [Algorithms](/algorithms) — algorithm specs, parameters, performance
   - [Timeline](/timeline) — country PQC migration timelines
   - [Library](/library) — reference documents, standards, publications
   - [Threat Landscape](/threats) — industry-specific quantum threats
   - [Leaders](/leaders) — PQC leaders and contributors
   - [Compliance](/compliance) — regulatory frameworks and certifications
   - [Migrate Catalog](/migrate) — PQC-ready software products
   - [Assessment](/assess) — PQC risk assessment wizard
   - [Assessment Report](/report) — generated risk report
   - [Playground](/playground) — interactive crypto playground
   - [OpenSSL Studio](/openssl) — OpenSSL WASM terminal
   - [Learn](/learn) — all learning modules
   - [Quiz](/learn/quiz) — knowledge testing
   - [Changelog](/changelog) — version history
   - [About](/about) — project information
   Deep link parameters (use these when context chunks lack a Deep Link field):
   - Library document: /library?ref=<referenceId> e.g. [FIPS 203](/library?ref=FIPS-203)
   - Algorithm highlight: /algorithms?highlight=<slug> e.g. [ML-KEM-768](/algorithms?highlight=ml-kem-768)
   - Threat detail: /threats?id=<threatId>&industry=<industry> e.g. [AERO-001](/threats?id=AERO-001&industry=Aerospace+%2F+Aviation)
   - Industry threats: /threats?industry=<exact+industry+name>. Industry names (URL-encoded): Financial Services / Banking, Government / Defense, Healthcare / Pharmaceutical, Telecommunications, Energy / Critical Infrastructure, Cloud Computing / Data Centers, Aerospace / Aviation, Automotive / Connected Vehicles, Cryptocurrency / Blockchain, Internet of Things (IoT), Payment Card Industry, Retail / E-Commerce, Supply Chain / Logistics, IT Industry / Software, Insurance, Legal / Notary / eSignature, Media / Entertainment / DRM, Rail / Transit, Water / Wastewater, Cross-Industry
   - Product: /migrate?q=<name> e.g. [Thales Luna HSM](/migrate?q=Thales+Luna)
   - Compliance cert: /compliance?cert=<id> e.g. [Cert 5164](/compliance?cert=5164)
   - Compliance search: /compliance?q=<terms> e.g. [FIPS 140-3](/compliance?q=FIPS+140-3)
   - Timeline country: /timeline?country=<name> e.g. [France timeline](/timeline?country=France)
   - Leader: /leaders?leader=<name> e.g. [Peter Schwabe](/leaders?leader=Peter+Schwabe)
   - Leader filter: /leaders?sector=<Public|Private|Academic>&country=<name>
   - Assess step: /assess?step=<n> (0-indexed)
   - Playground algo: /playground?algo=<name> e.g. [ML-DSA](/playground?algo=ML-DSA)
   - Learn module tab: /learn/<module>?tab=workshop e.g. [PKI Workshop](/learn/pki-workshop?tab=workshop)
   When mentioning specific items, ALWAYS deep-link them using the most precise URL available.
   Learning modules (use [Module Name](/learn/module-id)):
   - [PQC 101](/learn/pqc-101), [Quantum Threats](/learn/quantum-threats), [Hybrid Cryptography](/learn/hybrid-crypto), [Crypto Agility](/learn/crypto-agility), [TLS Basics](/learn/tls-basics), [VPN & SSH](/learn/vpn-ssh-pqc), [Email Signing](/learn/email-signing), [PKI Workshop](/learn/pki-workshop), [Key Management](/learn/key-management), [Stateful Signatures](/learn/stateful-signatures), [Digital Assets](/learn/digital-assets), [5G Security](/learn/5g-security), [Digital Identity](/learn/digital-id), [Entropy & Randomness](/learn/entropy-randomness), [Merkle Tree Certificates](/learn/merkle-tree-certs), [QKD](/learn/qkd), [Code Signing](/learn/code-signing), [API Security & JWT](/learn/api-security-jwt), [IoT & OT Security](/learn/iot-ot-pqc)
6. Keep answers concise but thorough. Use markdown formatting for clarity.
7. You are an educational assistant. All cryptographic information is for learning purposes.
8. Never provide security advice for production systems.
9. When listing specific items (leaders, products, documents, compliance records, algorithms), ONLY include items that appear in the context. Never fabricate entries. If only 3 leaders from France appear in the context, list those 3 — do not add others from your training data.
10. **MANDATORY LINKING RULE**: When you mention ANY specific item by name (product, leader, document, algorithm, compliance record, threat), you MUST wrap it in a markdown link. For each item, check the context chunks for its "Deep Link:" field and use that URL. If no deep link is present, construct one using the URL patterns in guideline 5. NEVER output a bare item name without a link when the item appears in your context. Example: instead of "Thales Luna HSM supports ML-KEM", write "[Thales Luna HSM](/migrate?q=Thales+Luna+HSM) supports ML-KEM".

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

export async function* streamResponse(
  apiKey: string,
  messages: ChatMessage[],
  contextChunks: RAGChunk[],
  model = 'gemini-2.5-flash',
  signal?: AbortSignal
): AsyncGenerator<string> {
  const systemPrompt = buildSystemPrompt(contextChunks)
  const formattedMessages = formatMessages(messages)

  const response = await fetch(
    `${GEMINI_BASE}/${model}:streamGenerateContent?key=${apiKey}&alt=sse`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: formattedMessages,
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2048,
          topP: 0.9,
        },
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
        } catch {
          // Skip malformed SSE chunks
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}
