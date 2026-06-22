// SPDX-License-Identifier: GPL-3.0-only
//
// Answer summaries for the Review screen — one short value string per step, plus
// a flag for answers that came from the "I'm not sure" smart default.
import type { AssessStepKey } from './assessFlowModel'

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
        : val(listText(s.dataRetention.map(prettify)) || 'Not answered')
    case 'credential-lifetime':
      return s.credentialLifetimeUnknown
        ? def(recommended)
        : val(listText(s.credentialLifetime.map(prettify)) || 'Not answered')
    case 'migration':
      return s.migrationUnknown
        ? def(recommended)
        : val(prettify(s.migrationStatus) || 'Not answered')
    case 'scale':
      return s.scaleUnknown
        ? def(recommended)
        : val(
            s.systemCount || s.teamSize
              ? `${prettify(s.systemCount) || '—'} · ${prettify(s.teamSize) || '—'}`
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
        : val(prettify(s.timelinePressure) || 'Not answered')
    default:
      return val('—')
  }
}
