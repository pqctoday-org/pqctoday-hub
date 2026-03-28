// SPDX-License-Identifier: GPL-3.0-only
import { applyGlossaryToChildren } from '@/utils/parseGlossary'

interface Props {
  children: React.ReactNode
}

/**
 * Wraps prose content and auto-highlights any text matching a glossary term
 * with an interactive tooltip showing the definition. Skips elements already
 * wrapped in InlineTooltip to prevent double-wrapping.
 */
export const GlossaryAutoWrap = ({ children }: Props) => (
  <>{applyGlossaryToChildren(children)}</>
)
