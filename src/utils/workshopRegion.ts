// SPDX-License-Identifier: GPL-3.0-only
import type { WorkshopRegion } from '@/types/Workshop'

export function labelForRegion(r: WorkshopRegion): string {
  return r === 'US' ? 'United States' : r === 'CA' ? 'Canada' : r === 'AU' ? 'Australia' : r
}

export const COUNTRY_TO_REGION: Record<string, WorkshopRegion> = {
  'United States': 'US',
  Canada: 'CA',
  Australia: 'AU',
}
