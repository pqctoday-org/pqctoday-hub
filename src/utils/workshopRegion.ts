// SPDX-License-Identifier: GPL-3.0-only
import type { WorkshopRegion } from '@/types/Workshop'

const REGION_LABELS = new Map<WorkshopRegion, string>([
  ['US', 'United States'],
  ['CA', 'Canada'],
  ['AU', 'Australia'],
  ['EU', 'European Union'],
  ['UK', 'United Kingdom'],
  ['JP', 'Japan'],
  ['OTHER', 'Other'],
])

export function labelForRegion(r: WorkshopRegion): string {
  return REGION_LABELS.get(r) ?? r
}

export const COUNTRY_TO_REGION: Record<string, WorkshopRegion> = {
  'United States': 'US',
  Canada: 'CA',
  Australia: 'AU',
  'European Union': 'EU',
  'United Kingdom': 'UK',
  Japan: 'JP',
}
