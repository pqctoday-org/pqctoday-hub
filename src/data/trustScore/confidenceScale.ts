// SPDX-License-Identifier: GPL-3.0-only
export const CONFIDENCE_SCALE = {
  high: 85,
  medium: 60,
  low: 30,
  unknown: 0,
} as const

export type ConfidenceLabel = keyof typeof CONFIDENCE_SCALE

export function labelToScore(label: string | undefined): number {
  const key = (label ?? '').toLowerCase() as ConfidenceLabel
  return CONFIDENCE_SCALE[key] ?? CONFIDENCE_SCALE.unknown
}
