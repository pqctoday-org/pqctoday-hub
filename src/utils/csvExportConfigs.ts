// SPDX-License-Identifier: AGPL-3.0-only
import type { CsvColumnConfig } from './csvExport'
import type { SoftwareItem } from '@/types/MigrateTypes'
import type { LibraryItem } from '@/data/libraryData'
import {
  exportAlgorithmSize,
  exportStackRam,
  formatAesEquivalent,
  formatLinkQuality,
  formatSecurityLevel,
  statusTierLabel,
  type AlgorithmDetail,
} from '@/data/pqcAlgorithmsData'
import { transitionFunctionLabel, type AlgorithmTransition } from '@/data/algorithmsData'
import type { TimelineEvent } from '@/types/timeline'
import type { ComplianceRecord } from '@/components/Compliance/types'
import {
  isCurrentStatus,
  pqcCoverageSummary,
  recordTypeLabel,
} from '@/components/Compliance/recordSemantics'
import type { Leader } from '@/data/leadersData'

export const MIGRATE_CSV_COLUMNS: CsvColumnConfig<SoftwareItem>[] = [
  { header: 'Software Name', accessor: (i) => i.softwareName },
  { header: 'Category', accessor: (i) => i.categoryName },
  { header: 'Infrastructure Layer', accessor: (i) => i.infrastructureLayer },
  { header: 'PQC Support', accessor: (i) => i.pqcSupport },
  { header: 'PQC Capability', accessor: (i) => i.pqcCapabilityDescription },
  { header: 'FIPS Validated', accessor: (i) => i.fipsValidated },
  { header: 'Migration Priority', accessor: (i) => i.pqcMigrationPriority },
  { header: 'Latest Version', accessor: (i) => i.latestVersion },
  { header: 'Release Date', accessor: (i) => i.releaseDate },
  { header: 'License', accessor: (i) => i.license },
  { header: 'Platforms', accessor: (i) => i.primaryPlatforms },
  { header: 'Target Industries', accessor: (i) => i.targetIndustries },
  { header: 'Repository URL', accessor: (i) => i.repositoryUrl },
]

export const LIBRARY_CSV_COLUMNS: CsvColumnConfig<LibraryItem>[] = [
  { header: 'Reference ID', accessor: (i) => i.referenceId },
  { header: 'Title', accessor: (i) => i.documentTitle },
  { header: 'Organization', accessor: (i) => i.authorsOrOrganization },
  { header: 'Status', accessor: (i) => i.documentStatus },
  { header: 'Type', accessor: (i) => i.documentType },
  { header: 'Categories', accessor: (i) => i.categories?.join('; ') },
  { header: 'Publication Date', accessor: (i) => i.initialPublicationDate },
  { header: 'Last Updated', accessor: (i) => i.lastUpdateDate },
  { header: 'Algorithm Family', accessor: (i) => i.algorithmFamily },
  { header: 'Security Levels', accessor: (i) => i.securityLevels },
  { header: 'Migration Urgency', accessor: (i) => i.migrationUrgency },
  { header: 'Region', accessor: (i) => i.regionScope },
  { header: 'URL', accessor: (i) => i.downloadUrl },
]

const NOT_RECORDED = 'Not recorded in source catalogue'

/**
 * Algorithm catalogue export. Every cell goes through the same helpers the
 * table, drawer and compare views use, so a field carries the same value, or
 * the same missing-data words, in the file as on the page — never a blank.
 */
export const ALGORITHM_CSV_COLUMNS: CsvColumnConfig<AlgorithmDetail>[] = [
  { header: 'Name', accessor: (i) => i.name },
  { header: 'Family', accessor: (i) => i.family },
  { header: 'Cryptographic Family', accessor: (i) => i.cryptoFamily },
  { header: 'Type', accessor: (i) => i.type },
  { header: 'Security Level', accessor: (i) => formatSecurityLevel(i) },
  { header: 'AES Equivalent', accessor: (i) => formatAesEquivalent(i) },
  { header: 'Public Key Size (bytes)', accessor: (i) => exportAlgorithmSize(i, 'publicKey') },
  { header: 'Private Key Size (bytes)', accessor: (i) => exportAlgorithmSize(i, 'privateKey') },
  {
    header: 'Sig/Ciphertext Size (bytes)',
    accessor: (i) => exportAlgorithmSize(i, 'signatureOrCiphertext'),
  },
  { header: 'Shared Secret Size (bytes)', accessor: (i) => exportAlgorithmSize(i, 'sharedSecret') },
  { header: 'Stack RAM (bytes; ~ = estimate)', accessor: (i) => exportStackRam(i) },
  { header: 'FIPS Standard', accessor: (i) => i.fipsStandard || NOT_RECORDED },
  { header: 'Maturity Tier', accessor: (i) => statusTierLabel(i.statusTier) },
  { header: 'Status Source URL', accessor: (i) => i.statusUrl || NOT_RECORDED },
  { header: 'Trusted Source ID', accessor: (i) => i.trustedSourceId || NOT_RECORDED },
  { header: 'Peer Reviewed', accessor: (i) => i.peerReviewed || NOT_RECORDED },
  { header: 'Vetting Body', accessor: (i) => i.vettingBody || NOT_RECORDED },
  { header: 'Source Link Quality', accessor: (i) => formatLinkQuality(i) },
  {
    header: 'Confidence Score',
    accessor: (i) => (i.confidenceScore === undefined ? 'Not scored' : i.confidenceScore),
  },
  { header: 'Row Last Verified', accessor: () => NOT_RECORDED },
  { header: 'Row Reviewer', accessor: () => NOT_RECORDED },
  { header: 'Verification Method', accessor: () => NOT_RECORDED },
  { header: 'Next Review', accessor: () => NOT_RECORDED },
  { header: 'Has Research Gap', accessor: (i) => (i.hasResearchGap ? 'yes' : 'no') },
  { header: 'Use Case Notes', accessor: (i) => i.useCaseNotes || NOT_RECORDED },
]

/**
 * Transition Guide export: the rows the Transition tab shows, with its own
 * columns (function, classical algorithm, candidate path, dates, status).
 */
export const TRANSITION_CSV_COLUMNS: CsvColumnConfig<AlgorithmTransition>[] = [
  { header: 'Function', accessor: (t) => transitionFunctionLabel(t.function) },
  { header: 'Classical Algorithm', accessor: (t) => t.classical },
  { header: 'Key Size', accessor: (t) => t.keySize || 'Not specified by the source' },
  {
    header: 'Candidate PQC Path',
    accessor: (t) => t.pqc || 'No reviewed replacement recorded',
  },
  { header: 'Region', accessor: (t) => t.region || 'Not specified by the source' },
  { header: 'Status', accessor: (t) => t.status || 'Not specified by the source' },
  { header: 'Maturity Tier', accessor: (t) => statusTierLabel(t.statusTier) },
  {
    header: 'Transition / Deprecation',
    accessor: (t) => t.deprecationDate || 'Not specified by the source',
  },
  {
    header: 'Standardization',
    accessor: (t) => t.standardizationDate || 'Not specified by the source',
  },
  { header: 'Status Source URL', accessor: (t) => t.statusUrl || 'Not specified by the source' },
  { header: 'Data Quality Notes', accessor: (t) => t.dataQualityNotes || 'None recorded' },
]

export const TIMELINE_CSV_COLUMNS: CsvColumnConfig<TimelineEvent>[] = [
  { header: 'Country', accessor: (i) => i.countryName },
  { header: 'Organization', accessor: (i) => i.orgName },
  { header: 'Organization Full Name', accessor: (i) => i.orgFullName },
  { header: 'Title', accessor: (i) => i.title },
  { header: 'Phase', accessor: (i) => i.phase },
  { header: 'Type', accessor: (i) => i.type },
  { header: 'Start Year', accessor: (i) => i.startYear },
  { header: 'End Year', accessor: (i) => (i.openEnded ? '' : i.endYear) },
  { header: 'Description', accessor: (i) => i.description },
  { header: 'Source URL', accessor: (i) => i.sourceUrl },
  { header: 'Source Date', accessor: (i) => i.sourceDate },
]

/**
 * Certification-record export. 'Type' uses the user-facing label ('NIST CAVP'
 * for the internal 'ACVP' value, 'CSPN (ANSSI)' for CSPN); 'PQC Coverage'
 * says where the PQC names come from (Approved Algorithms list, CAVP
 * validation, or merely named in a Security Target) and keeps "not read"
 * distinct from "none". Prepend `complianceExportPreamble()` (recordsExport.ts)
 * so the file carries the dataset scope.
 */
export const COMPLIANCE_CSV_COLUMNS: CsvColumnConfig<ComplianceRecord>[] = [
  { header: 'ID', accessor: (i) => i.id },
  { header: 'Product Name', accessor: (i) => i.productName },
  { header: 'Vendor', accessor: (i) => i.vendor },
  { header: 'Category', accessor: (i) => i.productCategory },
  { header: 'Type', accessor: (i) => recordTypeLabel(i.type) },
  { header: 'Source', accessor: (i) => i.source },
  { header: 'Status', accessor: (i) => i.status },
  { header: 'Current', accessor: (i) => (isCurrentStatus(i.status) ? 'yes' : 'no') },
  { header: 'Certification Level', accessor: (i) => i.certificationLevel },
  { header: 'PQC Coverage', accessor: (i) => pqcCoverageSummary(i) },
  { header: 'Classical Algorithms', accessor: (i) => i.classicalAlgorithms },
  { header: 'Date', accessor: (i) => i.date },
  { header: 'FIPS Standard', accessor: (i) => i.cmvpStandard },
  { header: 'Status Observed At', accessor: (i) => i.cmvpDetailsFetchedAt },
  { header: 'Sunset Date', accessor: (i) => i.sunsetDate },
  {
    header: 'Approved Algorithms (CAVP refs)',
    accessor: (i) =>
      i.cmvpApprovedAlgorithms
        ?.map((a) => (a.cavpRefs?.length ? `${a.name} [${a.cavpRefs.join(' ')}]` : a.name))
        .join('; '),
  },
  { header: 'CAVP First Validated', accessor: (i) => i.cavpFirstValidated },
  { header: 'Entropy Standard', accessor: (i) => i.esvStandard },
  { header: 'Entropy Noise Source', accessor: (i) => i.esvNoiseSourceClassification },
  { header: 'Entropy Reuse Status', accessor: (i) => i.esvReuseStatus },
  { header: 'Entropy First Validated', accessor: (i) => i.esvFirstValidated },
  { header: 'CC Archived Date', accessor: (i) => i.ccArchivedDate },
  { header: 'Security Target', accessor: (i) => i.securityTargetUrls?.[0] },
  { header: 'Link', accessor: (i) => i.link },
]

export const LEADERS_CSV_COLUMNS: CsvColumnConfig<Leader>[] = [
  { header: 'Name', accessor: (i) => i.name },
  { header: 'Title', accessor: (i) => i.title },
  { header: 'Country', accessor: (i) => i.country },
  { header: 'Type', accessor: (i) => i.type },
  { header: 'Category', accessor: (i) => i.category },
  { header: 'Organizations', accessor: (i) => i.organizations?.join('; ') },
  { header: 'Bio', accessor: (i) => i.bio },
  { header: 'Website', accessor: (i) => i.websiteUrl },
  { header: 'LinkedIn', accessor: (i) => i.linkedinUrl },
]
