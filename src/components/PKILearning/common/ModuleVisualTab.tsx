// SPDX-License-Identifier: GPL-3.0-only
import { CuriousSummaryBanner } from './CuriousSummaryBanner'

interface ModuleVisualTabProps {
  moduleId: string
}

/**
 * Visual tab content for learn modules.
 * Renders the module's infographic and "In Simple Terms" summary,
 * available to all users regardless of experience level.
 */
export const ModuleVisualTab = ({ moduleId }: ModuleVisualTabProps) => (
  <CuriousSummaryBanner moduleId={moduleId} isFullPage={true} />
)
