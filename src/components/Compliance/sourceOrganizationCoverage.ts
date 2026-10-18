// SPDX-License-Identifier: AGPL-3.0-only
/** Maintainer-facing reconciliation for source names not yet in the registry. */
import type { ComplianceFramework } from '@/data/complianceData'
import { complianceFrameworks } from '@/data/complianceData'
import { sourceOrganizationFor } from '@/data/sourceOrganizations'

export interface UnclassifiedSourceOrganization {
  name: string
  bodyTypes: string[]
  frameworkIds: string[]
}

export function unclassifiedSourceOrganizations(
  frameworks: readonly ComplianceFramework[] = complianceFrameworks
): UnclassifiedSourceOrganization[] {
  const byName = new Map<string, { bodyTypes: Set<string>; frameworkIds: string[] }>()
  for (const framework of frameworks) {
    const name = framework.enforcementBody.trim()
    if (!name || sourceOrganizationFor(name)) continue
    const current = byName.get(name) ?? { bodyTypes: new Set<string>(), frameworkIds: [] }
    current.bodyTypes.add(framework.bodyType)
    current.frameworkIds.push(framework.id)
    byName.set(name, current)
  }
  return Array.from(byName, ([name, value]) => ({
    name,
    bodyTypes: Array.from(value.bodyTypes).sort(),
    frameworkIds: value.frameworkIds.sort(),
  })).sort((a, b) => a.name.localeCompare(b.name))
}
