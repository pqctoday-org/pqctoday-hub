// SPDX-License-Identifier: GPL-3.0-only
import type { CsvColumnConfig } from './csvExport'
import type { SoftwareItem } from '@/types/MigrateTypes'
import type { LibraryItem } from '@/data/libraryData'
import type { AlgorithmDetail } from '@/data/pqcAlgorithmsData'
import type { TimelineEvent } from '@/types/timeline'
import type { ComplianceRecord } from '@/components/Compliance/types'
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

export const ALGORITHM_CSV_COLUMNS: CsvColumnConfig<AlgorithmDetail>[] = [
  { header: 'Name', accessor: (i) => i.name },
  { header: 'Family', accessor: (i) => i.family },
  { header: 'Type', accessor: (i) => i.type },
  { header: 'Security Level', accessor: (i) => i.securityLevel },
  { header: 'AES Equivalent', accessor: (i) => i.aesEquivalent },
  { header: 'Public Key Size (bytes)', accessor: (i) => i.publicKeySize },
  { header: 'Private Key Size (bytes)', accessor: (i) => i.privateKeySize },
  { header: 'Sig/Ciphertext Size (bytes)', accessor: (i) => i.signatureCiphertextSize },
  { header: 'Shared Secret Size (bytes)', accessor: (i) => i.sharedSecretSize },
  { header: 'KeyGen Cycles', accessor: (i) => i.keyGenCycles },
  { header: 'Sign/Encaps Cycles', accessor: (i) => i.signEncapsCycles },
  { header: 'Verify/Decaps Cycles', accessor: (i) => i.verifyDecapsCycles },
  { header: 'Stack RAM (bytes)', accessor: (i) => i.stackRAM },
  { header: 'FIPS Standard', accessor: (i) => i.fipsStandard },
  { header: 'Use Case Notes', accessor: (i) => i.useCaseNotes },
]

export const TIMELINE_CSV_COLUMNS: CsvColumnConfig<TimelineEvent>[] = [
  { header: 'Country', accessor: (i) => i.countryName },
  { header: 'Organization', accessor: (i) => i.orgName },
  { header: 'Organization Full Name', accessor: (i) => i.orgFullName },
  { header: 'Title', accessor: (i) => i.title },
  { header: 'Phase', accessor: (i) => i.phase },
  { header: 'Type', accessor: (i) => i.type },
  { header: 'Start Year', accessor: (i) => i.startYear },
  { header: 'End Year', accessor: (i) => i.endYear },
  { header: 'Description', accessor: (i) => i.description },
  { header: 'Source URL', accessor: (i) => i.sourceUrl },
  { header: 'Source Date', accessor: (i) => i.sourceDate },
]

export const COMPLIANCE_CSV_COLUMNS: CsvColumnConfig<ComplianceRecord>[] = [
  { header: 'ID', accessor: (i) => i.id },
  { header: 'Product Name', accessor: (i) => i.productName },
  { header: 'Vendor', accessor: (i) => i.vendor },
  { header: 'Category', accessor: (i) => i.productCategory },
  { header: 'Type', accessor: (i) => i.type },
  { header: 'Source', accessor: (i) => i.source },
  { header: 'Status', accessor: (i) => i.status },
  { header: 'Certification Level', accessor: (i) => i.certificationLevel },
  { header: 'PQC Coverage', accessor: (i) => String(i.pqcCoverage) },
  { header: 'Classical Algorithms', accessor: (i) => i.classicalAlgorithms },
  { header: 'Date', accessor: (i) => i.date },
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
