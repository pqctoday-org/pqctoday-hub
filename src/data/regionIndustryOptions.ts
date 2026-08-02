// SPDX-License-Identifier: GPL-3.0-only
/**
 * Canonical Region + industry option lists — icon/label/description — shared
 * by every UI that lets a user pick a region or industry.
 *
 * Extracted 2026-08-01 (persona-journeys A-grade redesign, top-bar pill
 * follow-up) from `PersonalizationSection.tsx`'s now-retired Track→Role→
 * Region→Industry wizard, which was the sole previous home for `REGIONS` —
 * and consolidates `INDUSTRY_ICONS`, which had already drifted into two
 * separate, hand-copied definitions (`PersonalizationSection.tsx` and
 * `PersonalizedAvatar.tsx`, both deleted alongside the wizard). One source of
 * truth now for both the top bar's `RegionIndustryPill` and any future
 * region/industry picker.
 */
import type { LucideIcon } from 'lucide-react'
import {
  Car,
  Compass,
  Globe,
  Globe2,
  HeartPulse,
  Landmark,
  Layers,
  MapPin,
  Plane,
  Radio,
  Cpu,
  ShoppingCart,
  Sun,
  Shield,
  Zap,
} from 'lucide-react'
import type { Region } from '@/store/usePersonaStore'

export interface RegionOption {
  id: Region
  label: string
  description: string
  Icon: LucideIcon
  cornerIcon: LucideIcon
}

export const REGIONS: RegionOption[] = [
  {
    id: 'global',
    label: 'Global',
    description: 'All regions, no filtering',
    Icon: Globe,
    cornerIcon: Globe2,
  },
  {
    id: 'americas',
    label: 'Americas',
    description: 'US/Canada, NIST & CISA focus',
    Icon: MapPin,
    cornerIcon: MapPin,
  },
  {
    id: 'eu',
    label: 'Europe',
    description: 'EU, ENISA/BSI/ANSSI standards',
    Icon: Landmark,
    cornerIcon: Compass,
  },
  {
    id: 'mena',
    label: 'MENA',
    description: 'Israel, UAE, Saudi Arabia & Gulf states',
    Icon: Compass,
    cornerIcon: MapPin,
  },
  {
    id: 'apac',
    label: 'APAC',
    description: 'Australia, Japan, Singapore & more',
    Icon: Sun,
    cornerIcon: Globe2,
  },
]

/** Region id (or the timeline-only 'All' sentinel — see PERSONA_TIMELINE_REGION) → display label. */
export const REGION_LABELS: Record<string, string> = {
  americas: 'Americas',
  eu: 'EU',
  mena: 'MENA',
  apac: 'APAC',
  global: 'Global',
  All: 'All regions',
}

/** Industry name (AVAILABLE_INDUSTRIES, @/hooks/assessmentData) → representative icon. */
export const INDUSTRY_ICONS: Record<string, LucideIcon> = {
  'Finance & Banking': Landmark,
  'Government & Defense': Shield,
  Healthcare: HeartPulse,
  Telecommunications: Radio,
  Technology: Cpu,
  'Energy & Utilities': Zap,
  Automotive: Car,
  Aerospace: Plane,
  'Retail & E-Commerce': ShoppingCart,
  Other: Layers,
}
