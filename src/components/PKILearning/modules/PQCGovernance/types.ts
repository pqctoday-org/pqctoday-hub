// SPDX-License-Identifier: GPL-3.0-only
// Shared types extracted here to avoid circular imports between index.tsx and
// its child components (PolicyTemplateGenerator, KPIDashboardBuilder).

export interface RACIOutput {
  accountableRole: string
  responsibleRole: string
}

export interface PolicyOutput {
  policyType: string
  targetYear: number | null
}
