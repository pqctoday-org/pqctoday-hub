// SPDX-License-Identifier: GPL-3.0-only
// Shared types extracted here to avoid circular imports between index.tsx and
// its child components (RoadmapBuilder, StakeholderCommsPlanner).

export interface RoadmapOutput {
  milestones: Array<{ label: string; year: number; phaseId: string }>
  earliestYear: number | null
}
