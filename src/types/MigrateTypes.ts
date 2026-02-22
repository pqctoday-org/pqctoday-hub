export interface SoftwareItem {
  softwareName: string
  categoryId: string
  categoryName: string
  infrastructureLayer: string
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
  migrationPhases: string
  status?: 'New' | 'Updated' | 'Deleted'
}

export interface MigrationStepTask {
  title: string
  description: string
}

export interface MigrationFrameworkMapping {
  source: string
  mapping: string
}

export interface MigrationReference {
  name: string
  organization: string
  url: string
  description: string
  type: 'Government' | 'Industry'
}

export interface MigrationStep {
  id: string
  stepNumber: number
  title: string
  shortTitle: string
  description: string
  icon: string
  tasks: MigrationStepTask[]
  frameworks: MigrationFrameworkMapping[]
  relevantSoftwareCategories: string[]
  nsaTimeline?: string
  estimatedDuration: string
}

export interface SoftwareCategoryGap {
  categoryId: string
  categoryName: string
  pqcPriority: string
  urgencyScore: number
  recommendedTimeline: string
  industriesAffected: string
  hasSoftwareInReference: boolean
  softwareCount: number
}
