// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { RoleIntroduction } from '../../../common/roleGuide'
import { OPS_GUIDE_DATA } from '../data'
import { OperationsWorkedChecks } from './OperationsWorkedChecks'
import { SourcedSectionPanel } from '@/components/PKILearning/common/SourcedSection'
import { VPN_ADMINISTRATION_SECTION } from '../data/vpnAdministrationSection'

interface Props {
  onNavigateToWorkshop: () => void
}

export const Introduction: React.FC<Props> = ({ onNavigateToWorkshop }) => (
  <>
    <RoleIntroduction data={OPS_GUIDE_DATA} onNavigateToWorkshop={onNavigateToWorkshop} />
    <SourcedSectionPanel section={VPN_ADMINISTRATION_SECTION} />
    <OperationsWorkedChecks />
  </>
)
