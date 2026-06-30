// SPDX-License-Identifier: GPL-3.0-only
// Shared types extracted here to avoid circular imports between index.tsx and
// its child components (MaturityAssessment).

export interface MaturityOutput {
  weakestAssetClass: string
  weakestPillar: string
  averageScore: number
}
