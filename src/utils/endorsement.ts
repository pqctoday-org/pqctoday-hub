// SPDX-License-Identifier: GPL-3.0-only
import { logEvent } from './analytics'

const DISCUSSIONS_NEW_BASE = 'https://github.com/pqctoday/pqctoday-hub/discussions/new'
const DISCUSSIONS_SEARCH_BASE = 'https://github.com/pqctoday/pqctoday-hub/discussions'

/**
 * Build a GitHub Discussions search URL for a resource label.
 * Used when a user re-clicks an already-endorsed/flagged button to find
 * the discussion they previously created.
 */
export const buildDiscussionSearchUrl = (resourceLabel: string): string => {
  const params = new URLSearchParams({ discussions_q: resourceLabel })
  return `${DISCUSSIONS_SEARCH_BASE}?${params.toString()}`
}

export type EndorsementCategory =
  | 'leader-endorsement'
  | 'threat-endorsement'
  | 'learn-module-endorsement'
  | 'timeline-endorsement'
  | 'library-resource-endorsement'
  | 'pqc-tool-endorsement'

interface EndorsementParams {
  category: EndorsementCategory
  title: string
  resourceType: string
  resourceId: string
  resourceDetails: string
  pageUrl: string
}

export function buildEndorsementUrl({
  category,
  title,
  resourceType,
  resourceId,
  resourceDetails,
  pageUrl,
}: EndorsementParams): string {
  const body = [
    `## Endorsement: ${resourceType}`,
    '',
    `**Resource:** ${resourceId}`,
    `**Page:** [View on PQC Today](https://pqctoday.com${pageUrl})`,
    '',
    resourceDetails,
    '',
    '### Why I endorse this resource',
    '',
    '- [ ] Accurate and well-sourced',
    '- [ ] Valuable for PQC migration planning',
    '- [ ] Relevant to my industry or role',
    '- [ ] Clearly written and educational',
    '',
    '### Additional comments (optional)',
    '',
    '<!-- Add your comments here -->',
    '',
  ].join('\n')

  const params = new URLSearchParams({
    category,
    title,
    body,
  })

  return `${DISCUSSIONS_NEW_BASE}?${params.toString()}`
}

export const logEndorsement = (resourceType: string, resourceLabel: string) => {
  logEvent('Endorsement', 'Open', `${resourceType}:${resourceLabel}`)
}

/* ── Flag Issue Discussions ── */

export function buildFlagUrl({
  category,
  title,
  resourceType,
  resourceId,
  resourceDetails,
  pageUrl,
}: EndorsementParams): string {
  const body = [
    `## Flag: ${resourceType}`,
    '',
    `**Resource:** ${resourceId}`,
    `**Page:** [View on PQC Today](https://pqctoday.com${pageUrl})`,
    '',
    resourceDetails,
    '',
    '### Issue type',
    '',
    '- [ ] Inaccurate or outdated information',
    '- [ ] Not relevant to PQC migration',
    '- [ ] Inadequate depth or coverage',
    '- [ ] Broken link or missing content',
    '',
    '### Description of the issue',
    '',
    '<!-- Describe what is wrong and, if possible, suggest a correction -->',
    '',
  ].join('\n')

  const params = new URLSearchParams({
    category,
    title,
    body,
  })

  return `${DISCUSSIONS_NEW_BASE}?${params.toString()}`
}

export const logFlag = (resourceType: string, resourceLabel: string) => {
  logEvent('Flag', 'Open', `${resourceType}:${resourceLabel}`)
}

/* ── Product Update Discussions ── */

export type ProductUpdateCategory = 'update-product-pqc-information'

interface ProductUpdateParams {
  productName: string
  categoryName: string
  currentPqcSupport: string
  productDetails: string
  pageUrl: string
}

export function buildProductUpdateUrl({
  productName,
  categoryName,
  currentPqcSupport,
  productDetails,
  pageUrl,
}: ProductUpdateParams): string {
  const body = [
    `## Product PQC Information Update`,
    '',
    `**Product:** ${productName}`,
    `**Category:** ${categoryName}`,
    `**Current PQC Support:** ${currentPqcSupport}`,
    `**Page:** [View on PQC Today](https://pqctoday.com${pageUrl})`,
    '',
    productDetails,
    '',
    '### Type of update',
    '',
    '- [ ] New PQC algorithm support',
    '- [ ] Updated version or release',
    '- [ ] New certification (FIPS, CC, etc.)',
    '- [ ] Corrected information',
    '- [ ] Other',
    '',
    '### Updated information',
    '',
    '<!-- Describe the update here -->',
    '',
    '### Source / reference (optional)',
    '',
    '<!-- Link to vendor announcement, release notes, or documentation -->',
    '',
  ].join('\n')

  const category: ProductUpdateCategory = 'update-product-pqc-information'
  const params = new URLSearchParams({
    category,
    title: `Update: ${productName}`,
    body,
  })

  return `${DISCUSSIONS_NEW_BASE}?${params.toString()}`
}

export const logProductUpdate = (productName: string) => {
  logEvent('ProductUpdate', 'Open', productName)
}
