export interface SoftwareItem {
  softwareName: string
  categoryId: string
  categoryName: string
  pqcSupport: string
  pqcCapabilityDescription: string
  licenseType: string
  license: string
  latestVersion: string
  releaseDate: string
  fipsValidated: string
  pqcMigrationPriority: string
  primaryPlatforms: string
  targetIndustries: string
  authoritativeSource: string
  repositoryUrl: string
  productBrief: string
  sourceType: string
  verificationStatus: string
  lastVerifiedDate: string
  status?: 'New' | 'Updated' | 'Deleted'
}
