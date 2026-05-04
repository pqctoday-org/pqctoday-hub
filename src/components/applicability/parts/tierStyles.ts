// SPDX-License-Identifier: GPL-3.0-only
import type { ApplicabilityTier } from '../../../utils/applicabilityEngine'

/**
 * Visual tokens per tier — used by ApplicabilityPanel and ExecutiveTimelineView
 * so badge / dot styling stays consistent across the persona-specific views and
 * the generic fallback panel.
 */
export const TIER_STYLES: Record<ApplicabilityTier, { dot: string; chip: string; label: string }> =
  {
    mandatory: {
      dot: 'bg-status-error',
      chip: 'bg-status-error/10 text-status-error border-status-error/30',
      label: 'Mandatory',
    },
    recognized: {
      dot: 'bg-secondary',
      chip: 'bg-secondary/10 text-secondary border-secondary/30',
      label: 'Recognized',
    },
    'cross-border': {
      dot: 'bg-status-warning',
      chip: 'bg-status-warning/10 text-status-warning border-status-warning/30',
      label: 'Cross-border',
    },
    advisory: {
      dot: 'bg-primary',
      chip: 'bg-primary/10 text-primary border-primary/30',
      label: 'Advisory',
    },
    informational: {
      dot: 'bg-muted-foreground',
      chip: 'bg-muted/50 text-muted-foreground border-border',
      label: 'Informational',
    },
  }
