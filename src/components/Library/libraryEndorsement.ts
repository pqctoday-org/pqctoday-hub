// SPDX-License-Identifier: AGPL-3.0-only
import { buildEndorsementUrl, buildFlagUrl } from '@/utils/endorsement'
import type { LibraryItem } from '@/data/libraryData'

/**
 * Build a prefilled GitHub Discussions endorsement URL for a library resource.
 * @param includeExtended  When true, adds algorithmFamily + securityLevels (detail popover).
 */
export function buildLibraryEndorsementUrl(item: LibraryItem, includeExtended = false): string {
  const details = [
    `**Reference ID:** ${item.referenceId}`,
    `**Title:** ${item.documentTitle}`,
    `**Authors:** ${item.authorsOrOrganization}`,
    `**Status:** ${item.documentStatus}`,
    `**Type:** ${item.documentType}`,
    item.applicableIndustries?.length
      ? `**Industries:** ${item.applicableIndustries.join(', ')}`
      : '',
    item.migrationUrgency ? `**Migration Urgency:** ${item.migrationUrgency}` : '',
  ]

  if (includeExtended) {
    details.push(
      item.algorithmFamily
        ? `**pqctoday catalog algorithm classification:** ${item.algorithmFamily}`
        : '',
      item.securityLevels ? `**pqctoday catalog security-level tags:** ${item.securityLevels}` : ''
    )
  }

  return buildEndorsementUrl({
    category: 'library-resource-endorsement',
    title: `Endorse: ${item.referenceId} — ${item.documentTitle}`,
    resourceType: 'Library Resource',
    resourceId: item.referenceId,
    resourceDetails: details.filter(Boolean).join('\n'),
    pageUrl: `/library?ref=${encodeURIComponent(item.referenceId)}`,
  })
}

/**
 * Build a prefilled GitHub Discussions flag URL for a library resource.
 * @param includeExtended  When true, adds algorithmFamily + securityLevels (detail popover).
 */
export function buildLibraryFlagUrl(item: LibraryItem, includeExtended = false): string {
  const details = [
    `**Reference ID:** ${item.referenceId}`,
    `**Title:** ${item.documentTitle}`,
    `**Authors:** ${item.authorsOrOrganization}`,
    `**Status:** ${item.documentStatus}`,
    `**Type:** ${item.documentType}`,
    item.applicableIndustries?.length
      ? `**Industries:** ${item.applicableIndustries.join(', ')}`
      : '',
    item.migrationUrgency ? `**Migration Urgency:** ${item.migrationUrgency}` : '',
  ]

  if (includeExtended) {
    details.push(
      item.algorithmFamily
        ? `**pqctoday catalog algorithm classification:** ${item.algorithmFamily}`
        : '',
      item.securityLevels ? `**pqctoday catalog security-level tags:** ${item.securityLevels}` : ''
    )
  }

  return buildFlagUrl({
    category: 'library-resource-endorsement',
    title: `Flag: ${item.referenceId} — ${item.documentTitle}`,
    resourceType: 'Library Resource',
    resourceId: item.referenceId,
    resourceDetails: details.filter(Boolean).join('\n'),
    pageUrl: `/library?ref=${encodeURIComponent(item.referenceId)}`,
  })
}
