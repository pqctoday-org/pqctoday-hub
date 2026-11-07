// SPDX-License-Identifier: AGPL-3.0-only
//
// Answer summaries for the Review screen — one short value string per step, plus
// a flag for answers that came from the "I'm not sure" smart default.
import type { AssessStepKey } from './assessFlowModel'
import { industryRetentionConfigs, universalRetentionConfigs } from '@/data/industryAssessConfig'

/** The store fields the review reads (the real store satisfies it structurally). */
export interface AssessReviewState {
  industry: string
  country: string
  currentCryptoCategories: string[]
  cryptoUnknown: boolean
  dataSensitivity: string[]
  sensitivityUnknown: boolean
  complianceRequirements: string[]
  complianceUnknown: boolean
  cryptoUseCases: string[]
  useCasesUnknown: boolean
  dataRetention: string[]
  retentionUnknown: boolean
  credentialLifetime: string[]
  credentialLifetimeUnknown: boolean
  migrationStatus: string
  migrationUnknown: boolean
  systemCount: string
  teamSize: string
  scaleUnknown: boolean
  cryptoAgility: string
  agilityUnknown: boolean
  infrastructure: string[]
  infrastructureUnknown: boolean
  timelinePressure: string
  timelineUnknown: boolean
}

export interface AnswerSummary {
  text: string
  /** Answer came from the recommended smart default ("I'm not sure"). */
  isDefault: boolean
}

function prettify(v: string): string {
  if (!v) return v
  return v.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

/** Retention options are rows of the assessment data; show the label the question shows. */
const RETENTION_LABELS: ReadonlyMap<string, string> = new Map(
  [...universalRetentionConfigs, ...industryRetentionConfigs].map((c) => [c.id, c.label])
)

/** Range-style option ids that read as nonsense once the hyphens are stripped ("1 3y"). */
const CREDENTIAL_LIFETIME_LABELS: ReadonlyMap<string, string> = new Map([
  ['under-1y', 'Under 1 year'],
  ['1-3y', '1–3 years'],
  ['3-10y', '3–10 years'],
  ['10-25y', '10–25 years'],
  ['25-plus', '25+ years'],
  ['indefinite', 'Indefinite / permanent'],
])
const SCALE_SYSTEM_LABELS: ReadonlyMap<string, string> = new Map([
  ['1-10', '1-10 systems'],
  ['11-50', '11-50 systems'],
  ['51-200', '51-200 systems'],
  ['200-plus', '200+ systems'],
])
const SCALE_TEAM_LABELS: ReadonlyMap<string, string> = new Map([
  ['1-10', '1-10 engineers'],
  ['11-50', '11-50 engineers'],
  ['51-200', '51-200 engineers'],
  ['200-plus', '200+ engineers'],
])
const TIMELINE_LABELS: ReadonlyMap<string, string> = new Map([
  ['within-1y', 'Regulatory Deadline Within 1 Year'],
  ['within-2-3y', 'Regulatory Deadline Within 2-3 Years'],
  ['internal-deadline', 'Own Target or Distant Deadline'],
  ['no-deadline', 'No Specific Deadline'],
])

function labelFrom(labels: ReadonlyMap<string, string>): (v: string) => string {
  return (v) => labels.get(v) ?? prettify(v)
}
const retentionLabel = labelFrom(RETENTION_LABELS)
const credentialLifetimeLabel = labelFrom(CREDENTIAL_LIFETIME_LABELS)
const systemCountLabel = labelFrom(SCALE_SYSTEM_LABELS)
const teamSizeLabel = labelFrom(SCALE_TEAM_LABELS)
const timelineLabel = labelFrom(TIMELINE_LABELS)

function listText(values: string[]): string {
  if (values.length === 0) return ''
  if (values.length <= 2) return values.join(', ')
  return `${values.slice(0, 2).join(', ')} +${values.length - 2}`
}

export function summarizeAnswer(key: AssessStepKey, s: AssessReviewState): AnswerSummary {
  const def = (text: string): AnswerSummary => ({ text, isDefault: true })
  const val = (text: string): AnswerSummary => ({ text, isDefault: false })
  const recommended = 'Recommended default'
  const skipped = 'Skipped'

  switch (key) {
    case 'industry':
      return val(s.industry || 'Not answered')
    case 'country':
      return val(s.country || 'Not answered')
    case 'crypto':
      return s.cryptoUnknown
        ? def(recommended)
        : val(listText(s.currentCryptoCategories.map(prettify)) || 'Not answered')
    case 'sensitivity':
      return s.sensitivityUnknown
        ? def(recommended)
        : val(listText(s.dataSensitivity.map(prettify)) || 'Not answered')
    case 'compliance':
      return s.complianceUnknown
        ? def(recommended)
        : val(listText(s.complianceRequirements) || skipped)
    case 'use-cases':
      return s.useCasesUnknown ? def(recommended) : val(listText(s.cryptoUseCases) || skipped)
    case 'retention':
      return s.retentionUnknown
        ? def(recommended)
        : val(listText(s.dataRetention.map(retentionLabel)) || 'Not answered')
    case 'credential-lifetime':
      return s.credentialLifetimeUnknown
        ? def(recommended)
        : val(listText(s.credentialLifetime.map(credentialLifetimeLabel)) || 'Not answered')
    case 'migration':
      return s.migrationUnknown
        ? def(recommended)
        : val(prettify(s.migrationStatus) || 'Not answered')
    case 'scale':
      return s.scaleUnknown
        ? def(recommended)
        : val(
            s.systemCount || s.teamSize
              ? `${systemCountLabel(s.systemCount) || '—'} · ${teamSizeLabel(s.teamSize) || '—'}`
              : 'Not answered'
          )
    case 'agility':
      return s.agilityUnknown ? def(recommended) : val(prettify(s.cryptoAgility) || 'Not answered')
    case 'infra':
      return s.infrastructureUnknown
        ? def(recommended)
        : val(listText(s.infrastructure.map(prettify)) || skipped)
    case 'timeline':
      return s.timelineUnknown
        ? def(recommended)
        : val(timelineLabel(s.timelinePressure) || 'Not answered')
    default:
      return val('—')
  }
}
