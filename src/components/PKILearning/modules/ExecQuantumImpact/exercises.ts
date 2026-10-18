// SPDX-License-Identifier: AGPL-3.0-only
export interface ExecExercise {
  title: string
  prompt: string
}

export const EXEC_QUANTUM_EXERCISES: ExecExercise[] = [
  {
    title: 'Scenario: Board Quantum Risk Briefing',
    prompt:
      'You are preparing a 15-minute board briefing for a mid-sized financial institution with 30-year data retention. Separate known facts, CRQC scenarios, potentially applicable obligations, and evidence still needed. Produce three board questions and proposed owners; do not invent an exposure score.',
  },
  {
    title: 'Scenario: Vendor PQC Readiness Review',
    prompt:
      'Your top five vendors report different PQC maturity. Identify what evidence would support each claim, record Unknown where the product or version is not scoped, and propose an owner and review date before carrying a vendor KPI into the dashboard.',
  },
  {
    title: 'Scenario: Compliance Deadline Collision',
    prompt:
      'Classify DORA and NIS2 as broader cyber-risk duties, NIST IR 8547 as an initial public draft transition proposal, and any scoped national roadmap or mandate separately. Determine applicability before prioritizing work, and list the official source and owner who must verify each conclusion.',
  },
]
