// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { RoleIntroduction } from '../../../common/roleGuide'
import { RESEARCH_GUIDE_DATA } from '../data'

interface Props {
  onNavigateToWorkshop: () => void
}

export const Introduction: React.FC<Props> = ({ onNavigateToWorkshop }) => (
  <RoleIntroduction data={RESEARCH_GUIDE_DATA} onNavigateToWorkshop={onNavigateToWorkshop} />
)
