// SPDX-License-Identifier: AGPL-3.0-only
import type { CharterState } from '@/components/BusinessCenter/tools/ProgramCharter'

/** Initial sample mandate: fund learning about the estate before approving migration. */
export const DISCOVERY_CHARTER: Partial<CharterState> = {
  scopeInclude:
    'Discovery and planning for the customer portal, records archiving and retrieval service, and software signing service. Identify protected assets, dependencies, owners and supplier constraints.',
  scopeExclude:
    'Production rollout and full migration funding are not approved at this initial gate. Retirement decisions require an assessment of service, confidentiality and trust obligations.',
  budgetYear1:
    'Discovery and planning only; estimate the amount from scoped work and approve it separately.',
  budgetMultiYear:
    'No migration budget approved yet. Refine a preliminary range after inventory and risk analysis, then submit a programme proposal with funding released at review gates.',
  budgetHorizonYears: '5',
  signOffDate: '_(sample proposal — approval pending)_',
  successCriteria:
    'Named service owners, inventory coverage and gaps, retention and signature requirements, supplier blockers, prioritised options and a documented basis for the next funding decision.',
}
