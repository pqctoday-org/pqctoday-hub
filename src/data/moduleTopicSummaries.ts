import raw from './module-topic-summaries.md?raw'

function parse(text: string): Record<string, string> {
  const result: Record<string, string> = {}
  const sections = text.split(/^## /m).filter(Boolean)
  for (const section of sections) {
    const newline = section.indexOf('\n')
    if (newline === -1) continue
    const heading = section.slice(0, newline).trim()
    const dashIdx = heading.indexOf(' — ')
    const moduleId = dashIdx > 0 ? heading.slice(0, dashIdx).trim() : heading.split(' ')[0].trim()
    const body = section.slice(newline).trim()
    if (moduleId && body) result[moduleId] = body
  }
  return result
}

export const MODULE_TOPIC_SUMMARIES: Record<string, string> = parse(raw)
