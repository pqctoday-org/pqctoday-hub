// SPDX-License-Identifier: GPL-3.0-only
export interface ExecExercise {
  title: string
  prompt: string
}

export const EXEC_QUANTUM_EXERCISES: ExecExercise[] = [
  {
    title: 'Scenario: Board Quantum Risk Briefing',
    prompt:
      'You are preparing a 15-minute board briefing on quantum risk. Your organization is a mid-sized financial institution with 30-year data retention requirements. Outline the key points: HNDL exposure, regulatory deadlines, budget request, and governance proposal. Use the workshop tools to quantify your exposure score.',
  },
  {
    title: 'Scenario: Vendor PQC Readiness Review',
    prompt:
      'Your top 5 vendors include a cloud provider (PQC-ready), an ERP vendor (no roadmap), a payment processor (partial support), a communication platform (unknown), and a backup provider (PQC-ready). Use the skills assessment to identify your gaps in vendor risk evaluation, then build an action plan.',
  },
  {
    title: 'Scenario: Compliance Deadline Collision',
    prompt:
      'Your organization must comply with CNSA 2.0 (2030), DORA (2025), and NIS2 (2024) simultaneously. Budget is limited. Use the action plan builder to prioritize: which deadlines require immediate action versus which allow phased migration?',
  },
]
