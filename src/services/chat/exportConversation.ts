// SPDX-License-Identifier: AGPL-3.0-only
import type { ChatMessage, Conversation } from '@/types/ChatTypes'

function markdownText(value: string): string {
  return value.replace(/\r?\n/g, ' ').replace(/([\\`*_{}[\]()<>#+!|])/g, '\\$1')
}

function recordedLink(value: string): string {
  // Reuse only public HTTP(S) or site-relative links as clickable citations.
  // A cache path or another scheme stays literal; do not invent a public URL.
  if (!/[\r\n<>]/.test(value)) {
    try {
      const siteRelative = value.startsWith('/') && !value.startsWith('//')
      const url = new URL(value, siteRelative ? 'https://www.pqctoday.com' : undefined)
      if (url.protocol === 'https:' || url.protocol === 'http:') return `<${url.href}>`
    } catch {
      /* A non-URL source identifier is still retained below. */
    }
  }
  return markdownText(value)
}

function recordedSources(message: ChatMessage): string {
  const refs = message.sourceRefs ?? []
  const ids = message.sources ?? []
  if (!refs.length && !ids.length) return ''
  const lines = ['', '**Recorded sources for this message**', '']
  for (const ref of refs) {
    const tier = ref.trustTier ? ` [${ref.trustTier}]` : ' [Trust tier not recorded]'
    lines.push(`- ${markdownText(ref.title)}${tier} — source: ${markdownText(ref.source)}`)
    if (ref.deepLink) lines.push(`  - Link: ${recordedLink(ref.deepLink)}`)
  }
  if (ids.length) {
    lines.push('', 'Recorded source identifiers:')
    for (const id of ids) lines.push(`- ${markdownText(id)}`)
  }
  if (refs.some((ref) => ref.trustTier))
    lines.push(
      '',
      'Trust tiers are PQC Today’s own assessment of each source, not the source’s claim about itself.'
    )
  return lines.join('\n') + '\n'
}

export function conversationToMarkdown(conv: Conversation): string {
  const header = `# ${conv.title}\n\n_Exported ${new Date().toLocaleDateString()}_\n\n---\n\n`
  const body = conv.messages
    .map((m) => {
      const sender = m.role === 'user' ? '**You**' : '**PQC Assistant**'
      const time = new Date(m.timestamp).toLocaleTimeString()
      return `${sender} _(${time})_\n\n${m.content}\n${recordedSources(m)}`
    })
    .join('\n---\n\n')
  return header + body
}

export function downloadMarkdown(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
