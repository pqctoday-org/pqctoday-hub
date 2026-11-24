// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Captures every tool fact a page shows, as the app computes it. The golden
 * file beside it (`toolFacts.beforeMove.golden.json`) was captured with this
 * same function on the commit before the organising fields moved out of the
 * tool registries into the tools data file, so toolsData.test.ts can prove the
 * move changed nothing a visitor sees.
 */
import {
  CATEGORIES,
  PT_ID_MAP,
  SANDBOX_TOOL_COUNT,
  WORKSHOP_TOOLS,
} from '@/components/Playground/workshopRegistry'
import {
  BUSINESS_CATEGORIES,
  BUSINESS_TOOLS,
} from '@/components/BusinessCenter/businessToolsRegistry'
import { getToolNiceMapping } from '@/data/toolNiceMapping'
import { getSandboxNiceMap } from '@/data/sandboxNiceMapping'
import { TOOLS_BY_MODULE_ID, TOOL_BY_MODULE_ID, TOOL_TITLE_BY_ID } from '@/data/moduleToolLinks'
import { TOOL_ROUTE_META } from '@/seo/toolRouteMeta.generated'

/** Drop the icon component; every other field is plain data. */
function withoutIcon<T extends { icon?: unknown }>(tool: T): Omit<T, 'icon'> {
  const { icon, ...rest } = tool
  void icon
  return rest
}

export function captureToolFacts() {
  return JSON.parse(
    JSON.stringify({
      workshopTools: WORKSHOP_TOOLS.map(withoutIcon),
      businessTools: BUSINESS_TOOLS.map(withoutIcon),
      categories: CATEGORIES,
      businessCategories: BUSINESS_CATEGORIES,
      toolNice: WORKSHOP_TOOLS.map((tool) => getToolNiceMapping(tool) ?? null),
      sandboxNice: getSandboxNiceMap(),
      toolsByModuleId: [...TOOLS_BY_MODULE_ID.entries()],
      toolByModuleId: [...TOOL_BY_MODULE_ID.entries()],
      toolTitleById: [...TOOL_TITLE_BY_ID.entries()],
      ptIdMap: PT_ID_MAP,
      sandboxToolCount: SANDBOX_TOOL_COUNT,
      toolRouteMeta: TOOL_ROUTE_META,
    })
  ) as Record<string, unknown>
}
