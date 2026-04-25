// SPDX-License-Identifier: GPL-3.0-only
import type {
  PillarId,
  MaturityLevel,
  AssetClass,
} from '@/components/PKILearning/modules/CryptoMgmtModernization/data/maturityModel'

export type { PillarId, MaturityLevel, AssetClass }

export type MaturityCategory =
  | 'Technical Standards'
  | 'Certification Schemes'
  | 'Compliance Frameworks'
  | 'Standardization Bodies'

export interface MaturityRequirement {
  refId: string
  sourceName: string
  category: MaturityCategory
  sourceType: string
  pillar: PillarId
  maturityLevel: MaturityLevel
  assetClass: AssetClass | 'all'
  requirement: string
  evidenceQuote: string
  evidenceLocation: string
  sourceUrl: string
  confidence: 'high' | 'medium' | 'low'
  extractionModel: string
  extractionDate: string
}
