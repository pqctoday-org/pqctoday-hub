// SPDX-License-Identifier: GPL-3.0-only

export interface ThreatImpact {
  id: string
  title: string
  description: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  timeframe: string
  exampleScenario: string
}

export interface SelfAssessmentItem {
  id: string
  label: string
  weight: number
}

export interface SkillGap {
  id: string
  category: string
  skill: string
  description: string
  targetLevel: 'basic' | 'intermediate' | 'advanced'
  linkedModules: { id: string; label: string }[]
}

export interface ActionItem {
  id: string
  phase: 'immediate' | '30-day' | '90-day' | '6-month'
  title: string
  description: string
  checklist: string[]
}

export interface QuickWin {
  id: string
  label: string
  description: string
}

export interface KpiMetric {
  label: string
  description: string
  target: string
}

export interface KnowledgeDomain {
  name: string
  description: string
  modules: { id: string; label: string }[]
}

export interface RoleGuideData {
  roleId: string
  roleLabel: string
  tagline: string

  /** Step 1: Why It Matters */
  threatImpacts: ThreatImpact[]
  selfAssessment: SelfAssessmentItem[]
  urgencyStatement: string

  /** Step 2: What to Learn */
  skillGaps: SkillGap[]
  knowledgeDomains: KnowledgeDomain[]

  /** Step 3: How to Act */
  actionItems: ActionItem[]
  quickWins: QuickWin[]
  kpiMetrics: KpiMetric[]
}

export type SkillLevel = 'none' | 'basic' | 'intermediate' | 'advanced'
