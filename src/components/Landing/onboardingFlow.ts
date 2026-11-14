// SPDX-License-Identifier: AGPL-3.0-only
import type { PersonaId } from '@/data/learningPersonas'
import type { ExperienceLevel, Region } from '@/store/usePersonaStore'
import {
  findAllCompatible,
  type WorkshopFlowManifest,
  type WorkshopFlowManifestEntry,
} from '@/services/workshopFlowLoader'
import { personaRegionToWorkshop } from '@/utils/workshopDeepLink'

export interface FlowProfile {
  persona: PersonaId | null
  proficiency: ExperienceLevel | null
  industry: string | null
  region: Region | null
}

/**
 * Picks the guided tour the Home "watch" button starts. Uses the same
 * compatibility rule as the Workshop panel's Recommended tab
 * (findAllCompatible: an unset profile facet matches any flow value), so Home
 * only ever offers a tour the panel also lists for this profile. Only a flow written for this role counts:
 * a role-agnostic flow other than the generic overview does not exist today,
 * and if one is added it should not displace a role's own tour.
 *
 * Before 2026-11-14 this only knew the curious tour and gave every other role
 * the generic overview, so the developer, ops, executive, researcher and
 * architect tours in public/workshop/index.json were never offered from Home.
 */
export function pickFlowEntry(
  manifest: WorkshopFlowManifest,
  profile: FlowProfile
): WorkshopFlowManifestEntry | null {
  const generic = manifest.flows.find((f) => f.isGenericFallback) ?? null
  const persona = profile.persona
  if (!persona) return generic
  const roleFlows = findAllCompatible(manifest, {
    role: persona,
    proficiency: profile.proficiency ?? undefined,
    industry: profile.industry ?? undefined,
    region: personaRegionToWorkshop(profile.region) ?? undefined,
  }).filter((f) => !f.isGenericFallback && Array.isArray(f.match.roles))
  return roleFlows[0] ?? generic
}
