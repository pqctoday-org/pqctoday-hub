import type { Conversation } from '@/types/ChatTypes'

export function conversationToMarkdown(conv: Conversation): string {
  const header = `# ${conv.title}\n\n_Exported ${new Date().toLocaleDateString()}_\n\n---\n\n`
  const body = conv.messages
    .map((m) => {
      const sender = m.role === 'user' ? '**You**' : '**PQC Assistant**'
      const time = new Date(m.timestamp).toLocaleTimeString()
      return `${sender} _(${time})_\n\n${m.content}\n`
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
