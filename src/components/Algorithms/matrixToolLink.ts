// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Where a protocol-matrix playground chip leads, shared by the laptop matrix
 * and the phone detail sheet so the two can never send a reader to different
 * pages. Pure logic over the workshop registry (no JSX).
 */
import type { PlaygroundTool } from '@/data/pqcProtocolMatrix'
import { WORKSHOP_TOOLS } from '@/components/Playground/workshopRegistry'

// Resolve the canonical destination for a matrix PlaygroundTool cell.
// Priority: explicit per-cell `url` > registry `moduleLink` > playground fallback.
// Without this, every cell would hit `/playground/<toolId>`, which for several
// tools (e.g. pki-enrollment) is a minimal preview rather than the full workshop.
const WORKSHOP_TOOL_LINKS: Record<string, string> = Object.fromEntries(
  WORKSHOP_TOOLS.map((t) => [t.id, t.moduleLink])
)

export function resolveToolLink(tool: PlaygroundTool): string {
  // eslint-disable-next-line security/detect-object-injection -- toolId is a literal from the matrix data
  return tool.url ?? WORKSHOP_TOOL_LINKS[tool.toolId] ?? `/playground/${tool.toolId}`
}

/** True when a tool cell resolves to a Learn module rather than the tool itself. */
function opensLearnModule(href: string): boolean {
  return href.startsWith('/learn/')
}

/**
 * Visible label for a tool cell. When the link resolves to the Learn module
 * that hosts the tool (registry `moduleLink`), say so, so the label matches
 * where the click lands.
 */
export function toolLinkLabel(tool: PlaygroundTool, href: string): string {
  return opensLearnModule(href) ? `${tool.toolName} (Learn module)` : tool.toolName
}

export function toolLinkTitle(tool: PlaygroundTool, href: string): string {
  return opensLearnModule(href)
    ? `Opens the Learn module that hosts ${tool.toolName}`
    : `Open ${tool.toolName}`
}
