// SPDX-License-Identifier: GPL-3.0-only
import type { ArtifactSection } from '@/components/PKILearning/common/executive'
import type { ExecutiveModuleData } from '@/hooks/useExecutiveModuleData'

export type FormData = Record<string, Record<string, string | string[]>>

export interface PitchVariant {
  title: string
  description: string
  objective: string
  filename: string
  sections: ArtifactSection[]
  renderPreview: (formData: FormData, data: ExecutiveModuleData) => string
}

export type PitchVariantBuilder = (data: ExecutiveModuleData) => PitchVariant
