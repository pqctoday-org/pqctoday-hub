// SPDX-License-Identifier: GPL-3.0-only
//
// Maps each step key to its (now slot-prop-aware) legacy step component, so the
// redesign question pane can render the real data-driven step bodies.
import type React from 'react'
import { Step1Industry } from '../steps/Step1Industry'
import { Step2Country } from '../steps/Step2Country'
import { Step3Crypto } from '../steps/Step3Crypto'
import { Step4Sensitivity } from '../steps/Step4Sensitivity'
import { Step5Compliance } from '../steps/Step5Compliance'
import { Step6Migration } from '../steps/Step6Migration'
import { Step7UseCases } from '../steps/Step7UseCases'
import { Step8DataRetention } from '../steps/Step8DataRetention'
import { StepCredentialLifetime } from '../steps/StepCredentialLifetime'
import { Step9OrgScale } from '../steps/Step9OrgScale'
import { Step10CryptoAgility } from '../steps/Step10CryptoAgility'
import { Step11Infrastructure } from '../steps/Step11Infrastructure'
import { Step13TimelinePressure } from '../steps/Step13TimelinePressure'
import type { AssessStepKey, EmbeddedStepProps } from './assessFlowModel'

export const STEP_COMPONENTS: Record<AssessStepKey, React.FC<EmbeddedStepProps>> = {
  industry: Step1Industry,
  country: Step2Country,
  crypto: Step3Crypto,
  sensitivity: Step4Sensitivity,
  compliance: Step5Compliance,
  migration: Step6Migration,
  'use-cases': Step7UseCases,
  retention: Step8DataRetention,
  'credential-lifetime': StepCredentialLifetime,
  scale: Step9OrgScale,
  agility: Step10CryptoAgility,
  infra: Step11Infrastructure,
  timeline: Step13TimelinePressure,
}
