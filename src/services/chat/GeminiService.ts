import type { ChatMessage, RAGChunk } from '@/types/ChatTypes'
import type { PageContext } from '@/hooks/usePageContext'

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

function buildSystemPrompt(chunks: RAGChunk[], pageContext?: PageContext): string {
  const contextBlocks = chunks
    .map((c) => {
      const header = `--- Source: ${c.source} | ${c.title} ---`
      const deepLinkLine = c.deepLink ? `Deep Link: ${c.deepLink}` : ''
      return [header, deepLinkLine, c.content, '---'].filter(Boolean).join('\n')
    })
    .join('\n\n')

  let pageNote = ''
  if (pageContext?.page) {
    const tabInfo =
      pageContext.tab && pageContext.tab !== 'learn'
        ? ` (${pageContext.tab} tab${pageContext.step ? `, step ${pageContext.step + 1}` : ''})`
        : ''
    pageNote = `\nThe user is currently viewing the ${pageContext.page} page${tabInfo}. Tailor your response accordingly when relevant.\n`
  }

  return `You are PQC Today Assistant, an expert in post-quantum cryptography (PQC). You help users understand PQC concepts, standards, migration strategies, and the quantum threat landscape.
${pageNote}
Answer based ONLY on the provided context from the PQC Today database. Do not invent or supplement with people, products, documents, certifications, or data not present below. Say so honestly if the context is insufficient. You may use general knowledge only to explain concepts or give background — never to list specific items.

GUIDELINES:
1. Prioritize "algorithms" and "glossary" sources for algorithm/standard/definition questions. Use "threats" data only for threat/industry-impact questions.
2. When listing items (leaders, products, documents, algorithms), ONLY include items from the context. Never fabricate entries.
3. **Linking**: When a context chunk has a "Deep Link:" field, ALWAYS use that URL. Otherwise construct links using these patterns:
   - /algorithms?highlight=<slug>, /timeline?country=<name>, /library?ref=<id>
   - /migrate?q=<name>, /leaders?leader=<name>, /compliance?cert=<id>
   - /threats?id=<threatId>&industry=<industry>, /playground?algo=<name>
   - /learn/<module-id> (learning content), /learn/<module-id>?tab=workshop (hands-on workshop/simulation)
   - /learn/<module-id>?tab=workshop&step=<n> (specific workshop step), /assess?step=<n>
   Every named item (product, leader, document, algorithm, threat) MUST be a markdown link. Never output bare names or paths.
4. Main pages: [Algorithms](/algorithms), [Timeline](/timeline), [Library](/library), [Threats](/threats), [Leaders](/leaders), [Compliance](/compliance), [Migrate](/migrate), [Assessment](/assess), [Report](/report), [Playground](/playground), [OpenSSL Studio](/openssl), [Learn](/learn), [Quiz](/learn/quiz)
5. Learning modules: [PQC 101](/learn/pqc-101), [Quantum Threats](/learn/quantum-threats), [Hybrid Crypto](/learn/hybrid-crypto), [Crypto Agility](/learn/crypto-agility), [TLS Basics](/learn/tls-basics), [VPN & SSH](/learn/vpn-ssh-pqc), [Email Signing](/learn/email-signing), [PKI Workshop](/learn/pki-workshop), [Key Management](/learn/key-management), [Stateful Signatures](/learn/stateful-signatures), [Digital Assets](/learn/digital-assets), [5G Security](/learn/5g-security), [Digital Identity](/learn/digital-id), [Entropy & Randomness](/learn/entropy-randomness), [Merkle Tree Certs](/learn/merkle-tree-certs), [QKD](/learn/qkd), [Code Signing](/learn/code-signing), [API Security & JWT](/learn/api-security-jwt), [IoT & OT Security](/learn/iot-ot-pqc)
6. Keep answers concise but thorough. Use markdown formatting. This is an educational assistant — never provide production security advice.

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
  signal?: AbortSignal,
  pageContext?: PageContext
): AsyncGenerator<string> {
  const systemPrompt = buildSystemPrompt(contextChunks, pageContext)
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
