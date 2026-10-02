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

/**
 * moduleId -> the curated "Sub-topics keywords" line of that module's topic
 * summary (e.g. iot-pqc: "... SCADA ICS, Purdue model, critical
 * infrastructure ..."). Used by the Learn browse-all search so a module is
 * findable by topics its short card description does not spell out. Only the
 * keywords line is used, not the long scope paragraph, to keep matches precise.
 */
export const MODULE_TOPIC_KEYWORDS: Record<string, string> = Object.fromEntries(
  Object.entries(MODULE_TOPIC_SUMMARIES).flatMap(([id, body]) => {
    const m = body.match(/\*\*Sub-topics keywords:\*\*\s*([^\n]*)/)
    return m && m[1].trim() ? [[id, m[1].trim()]] : []
  })
)
