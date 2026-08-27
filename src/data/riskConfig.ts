// SPDX-License-Identifier: GPL-3.0-only
import type { AssessmentResult } from '@/hooks/assessmentTypes'

/**
 * Shared visual config for risk levels. Kept in one place so the Report and
 * Command Center can never drift in how they color / label the same score.
 *
 * Four tiers, four distinct colors. `critical` uses its own semantic token
 * (`text-critical`, `bg-critical/*`) rather than a darker `destructive` —
 * this is what lets the gauge actually distinguish 'high' from 'critical'.
 *
 * Pure-moved out of RiskGauge.tsx (2026-08-24 audit R3.5) — that file also
 * exports the RiskGauge JSX component, so MobileReportView.tsx previously
 * carried its own copy of this map rather than importing a desktop view
 * component into the mobile boundary. It's the same source, split so both
 * surfaces can import the data half without the JSX half.
 */
export const riskConfig = {
  low: {
    color: 'text-success',
    bg: 'bg-success/10',
    border: 'border-success',
    label: 'Low Risk',
    dotHex: 'hsl(142.1, 76.2%, 36.3%)',
  },
  medium: {
    color: 'text-warning',
    bg: 'bg-warning/10',
    border: 'border-warning',
    label: 'Medium Risk',
    dotHex: 'hsl(38, 92%, 50%)',
  },
  high: {
    color: 'text-destructive',
    bg: 'bg-destructive/10',
    border: 'border-destructive',
    label: 'High Risk',
    dotHex: 'hsl(0, 84.2%, 60.2%)',
  },
  critical: {
    color: 'text-critical',
    bg: 'bg-critical/10',
    border: 'border-critical',
    label: 'Critical Risk',
    dotHex: 'hsl(340, 85%, 38%)',
  },
} as const

export type RiskLevel = AssessmentResult['riskLevel']
