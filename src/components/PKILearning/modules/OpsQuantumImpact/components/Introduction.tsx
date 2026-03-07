// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { RoleIntroduction } from '../../../common/roleGuide'
import { OPS_GUIDE_DATA } from '../data'

interface Props {
  onNavigateToWorkshop: () => void
}

export const Introduction: React.FC<Props> = ({ onNavigateToWorkshop }) => (
  <RoleIntroduction data={OPS_GUIDE_DATA} onNavigateToWorkshop={onNavigateToWorkshop} />
)
