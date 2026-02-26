import type { ChatMessage, RAGChunk } from '@/types/ChatTypes'

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

function buildSystemPrompt(chunks: RAGChunk[]): string {
  const contextBlocks = chunks
    .map((c) => `--- Source: ${c.source} | ${c.title} ---\n${c.content}\n---`)
    .join('\n\n')

  return `You are PQC Today Assistant, an expert in post-quantum cryptography (PQC). You help users understand PQC concepts, standards, migration strategies, and the quantum threat landscape.

You have deep knowledge of PQC from your training data. Use the provided context to ground your answers with specific data from the PQC Today platform, but you may supplement with your general PQC knowledge when the context is insufficient. Always prioritize accuracy.

GUIDELINES:
1. When the context contains directly relevant data (algorithm specs, standards, glossary definitions), use it and cite the source.
2. When the context only tangentially mentions a topic, use your general knowledge to give a clear, accurate answer and note which parts come from the database vs. your training.
3. Prioritize "algorithms" and "glossary" source data for questions about specific algorithms, standards, or definitions. "threats" source data is about industry-specific risk scenarios — use it only when the user asks about threats or industry impacts.
4. When suggesting pages, ALWAYS use markdown links with these exact paths. Never output bare paths like /algorithms — always use [Link Text](/path) format.
   Main pages:
   - [Algorithms](/algorithms) — algorithm specs, parameters, performance
   - [Timeline](/timeline) — country PQC migration timelines
   - [Library](/library) — reference documents, standards, publications
   - [Threat Landscape](/threats) — industry-specific quantum threats
   - [Leaders](/leaders) — PQC leaders and contributors
   - [Compliance](/compliance) — regulatory frameworks
   - [Migrate Catalog](/migrate) — PQC-ready software products
   - [Assessment](/assess) — PQC risk assessment wizard
   - [Assessment Report](/report) — generated risk report
   - [Playground](/playground) — interactive crypto playground
   - [OpenSSL Studio](/openssl) — OpenSSL WASM terminal
   - [Learn](/learn) — all learning modules
   - [Quiz](/learn/quiz) — knowledge testing
   - [Changelog](/changelog) — version history
   - [About](/about) — project information
   Deep links (use query params to link directly to specific items):
   - Specific product: [Product Name](/migrate?q=Product+Name) e.g. [Thales Luna HSM](/migrate?q=Thales+Luna)
   - Specific algorithm: [Algorithm Name](/algorithms?highlight=algo-name) e.g. [ML-KEM-768](/algorithms?highlight=ml-kem-768)
   - Industry threats: [Industry threats](/threats?industry=exact+industry+name). The industry param must match one of these exact names (URL-encoded): Financial Services / Banking, Government / Defense, Healthcare / Pharmaceutical, Telecommunications, Energy / Critical Infrastructure, Cloud Computing / Data Centers, Aerospace / Aviation, Automotive / Connected Vehicles, Cryptocurrency / Blockchain, Internet of Things (IoT), Payment Card Industry, Retail / E-Commerce, Supply Chain / Logistics, IT Industry / Software, Insurance, Legal / Notary / eSignature, Media / Entertainment / DRM, Rail / Transit, Water / Wastewater, Cross-Industry. Example: [Financial Services threats](/threats?industry=Financial+Services+/+Banking), [Healthcare threats](/threats?industry=Healthcare+/+Pharmaceutical)
   - Library resource: [Document Title](/library?q=search+terms) e.g. [NIST SP 800-208](/library?q=SP+800-208)
   - Compliance framework: [Framework](/compliance?q=search+terms) e.g. [FIPS 140-3](/compliance?q=FIPS+140-3)
   - Timeline country: [Country timeline](/timeline?country=Country+Name) e.g. [US timeline](/timeline?country=United+States), [France timeline](/timeline?country=France)
   - Leader: [Leader Name](/leaders?q=Name) e.g. [Peter Schwabe](/leaders?q=Peter+Schwabe)
   When mentioning specific items, ALWAYS deep-link them: products via /migrate?q=, algorithms via /algorithms?highlight=, library docs via /library?q=, compliance frameworks via /compliance?q=, leaders via /leaders?q=.
   Learning modules (use [Module Name](/learn/module-id)):
   - [PQC 101](/learn/pqc-101), [Quantum Threats](/learn/quantum-threats), [Hybrid Cryptography](/learn/hybrid-crypto), [Crypto Agility](/learn/crypto-agility), [TLS Basics](/learn/tls-basics), [VPN & SSH](/learn/vpn-ssh-pqc), [Email Signing](/learn/email-signing), [PKI Workshop](/learn/pki-workshop), [Key Management](/learn/key-management), [Stateful Signatures](/learn/stateful-signatures), [Digital Assets](/learn/digital-assets), [5G Security](/learn/5g-security), [Digital Identity](/learn/digital-id), [Entropy & Randomness](/learn/entropy-randomness), [Merkle Tree Certificates](/learn/merkle-tree-certs), [QKD](/learn/qkd), [Code Signing](/learn/code-signing), [API Security & JWT](/learn/api-security-jwt), [IoT & OT Security](/learn/iot-ot-pqc)
5. Keep answers concise but thorough. Use markdown formatting for clarity.
6. You are an educational assistant. All cryptographic information is for learning purposes.
7. Never provide security advice for production systems.

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
