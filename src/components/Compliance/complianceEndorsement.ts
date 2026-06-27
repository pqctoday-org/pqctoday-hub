// SPDX-License-Identifier: GPL-3.0-only
import { buildEndorsementUrl, buildFlagUrl } from '@/utils/endorsement'
import type { ComplianceFramework } from '@/data/complianceData'
import type { ComplianceRecord } from './types'

/* ── Compliance frameworks (standards / certification / regulatory) ── */

function frameworkDetails(fw: ComplianceFramework): string {
  return [
    `**Framework:** ${fw.label}`,
    `**ID:** ${fw.id}`,
    fw.enforcementBody ? `**Enforcement body:** ${fw.enforcementBody}` : '',
    fw.countries?.length ? `**Jurisdiction:** ${fw.countries.join(', ')}` : '',
    fw.deadline ? `**Deadline:** ${fw.deadline}` : '',
  ]
    .filter(Boolean)
    .join('\n')
}

export function buildFrameworkEndorsementUrl(fw: ComplianceFramework): string {
  return buildEndorsementUrl({
    category: 'compliance-endorsement',
    title: `Endorse: ${fw.label}`,
    resourceType: 'Compliance Framework',
    resourceId: fw.id,
    resourceDetails: frameworkDetails(fw),
    pageUrl: `/compliance?framework=${encodeURIComponent(fw.id)}`,
  })
}

export function buildFrameworkFlagUrl(fw: ComplianceFramework): string {
  return buildFlagUrl({
    category: 'compliance-endorsement',
    title: `Flag: ${fw.label}`,
    resourceType: 'Compliance Framework',
    resourceId: fw.id,
    resourceDetails: frameworkDetails(fw),
    pageUrl: `/compliance?framework=${encodeURIComponent(fw.id)}`,
  })
}

/* ── Compliance records (product certifications) ── */

function recordDetails(record: ComplianceRecord): string {
  return [
    `**Product:** ${record.productName}`,
    record.vendor ? `**Vendor:** ${record.vendor}` : '',
    record.type ? `**Type:** ${record.type}` : '',
    record.source ? `**Source:** ${record.source}` : '',
    record.certificationLevel ? `**Level:** ${record.certificationLevel}` : '',
  ]
    .filter(Boolean)
    .join('\n')
}

const recordLabel = (record: ComplianceRecord): string =>
  record.vendor ? `${record.productName} (${record.vendor})` : record.productName

export function buildRecordEndorsementUrl(record: ComplianceRecord): string {
  return buildEndorsementUrl({
    category: 'compliance-endorsement',
    title: `Endorse: ${recordLabel(record)}`,
    resourceType: 'Compliance Record',
    resourceId: record.id,
    resourceDetails: recordDetails(record),
    pageUrl: `/compliance?record=${encodeURIComponent(record.id)}`,
  })
}

export function buildRecordFlagUrl(record: ComplianceRecord): string {
  return buildFlagUrl({
    category: 'compliance-endorsement',
    title: `Flag: ${recordLabel(record)}`,
    resourceType: 'Compliance Record',
    resourceId: record.id,
    resourceDetails: recordDetails(record),
    pageUrl: `/compliance?record=${encodeURIComponent(record.id)}`,
  })
}

export { recordLabel }
