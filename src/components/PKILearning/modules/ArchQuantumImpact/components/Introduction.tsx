// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { RoleIntroduction } from '../../../common/roleGuide'
import { ARCH_GUIDE_DATA } from '../data'
import { SourcedSectionPanel } from '@/components/PKILearning/common/SourcedSection'
import { SYSTEM_DESIGN_STANDARDS_SECTION } from '../data/systemDesignStandardsSection'

interface Props {
  onNavigateToWorkshop: () => void
}

export const Introduction: React.FC<Props> = ({ onNavigateToWorkshop }) => (
  <>
    <RoleIntroduction data={ARCH_GUIDE_DATA} onNavigateToWorkshop={onNavigateToWorkshop} />
    <SourcedSectionPanel section={SYSTEM_DESIGN_STANDARDS_SECTION} />
  </>
)
