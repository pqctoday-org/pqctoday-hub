// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { RoleIntroduction } from '../../../common/roleGuide'
import { SOC_GUIDE_DATA } from '../data'
import { AppliedQuantumCredit } from '@/components/PKILearning/common/FrameworkCredit'

interface Props {
  onNavigateToWorkshop: () => void
}

export const Introduction: React.FC<Props> = ({ onNavigateToWorkshop }) => (
  <>
    <RoleIntroduction data={SOC_GUIDE_DATA} onNavigateToWorkshop={onNavigateToWorkshop} />
    <AppliedQuantumCredit section="SOC Implementation" pages="165–175" />
  </>
)
