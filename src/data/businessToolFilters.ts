// SPDX-License-Identifier: AGPL-3.0-only
import type { BusinessTool } from '@/components/BusinessCenter/businessToolsRegistry'

export function filterBusinessTools(tools: BusinessTool[], params: URLSearchParams) {
  const query = params.get('q')?.trim().toLowerCase()
  const category = params.get('cat')
  const zone = params.get('zone')
  const phase = params.get('phase')
  const audience = params.get('audience')
  return tools.filter(
    (tool) =>
      (!category || tool.category === category) &&
      (!zone || zone === 'all' || tool.cswp39Zone === zone) &&
      (!phase || phase === 'all' || tool.frameworkPhase === phase) &&
      (!audience || audience === 'all' || (tool.audience ?? 'business') === audience) &&
      (!query ||
        tool.name.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query) ||
        tool.keywords.some((keyword) => keyword.toLowerCase().includes(query)) ||
        tool.category.toLowerCase().includes(query))
  )
}
