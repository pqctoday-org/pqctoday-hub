// SPDX-License-Identifier: GPL-3.0-only
export interface ResearchExercise {
  title: string
  prompt: string
}

export const RESEARCH_QUANTUM_EXERCISES: ResearchExercise[] = [
  {
    title: 'Scenario: Genomic Data HNDL Risk',
    prompt:
      'Your research institution stores 500TB of genomic data encrypted with AES-256 and RSA-2048 key encapsulation. The data must remain confidential for 50 years. Calculate the HNDL exposure window assuming a CRQC arrives in 2035. What migration priority does this data have? Use the self-assessment tool to quantify your exposure.',
  },
  {
    title: 'Scenario: Multi-Institution Federated Learning',
    prompt:
      'You are designing a federated learning system for cross-institution cancer research. Model aggregation uses TLS 1.3 with ECDH. Five universities with different IT policies need to participate. How do you ensure quantum-safe data exchange? Assess your PQC skills readiness using the workshop.',
  },
  {
    title: 'Scenario: PQC Research Proposal',
    prompt:
      'An NSF program solicitation requires "quantum-resilient" data security for a distributed health data platform. Draft the security section: which PQC algorithms, which deployment model (hybrid or pure), and how you will validate security. Use the action plan builder to map your timeline.',
  },
]
