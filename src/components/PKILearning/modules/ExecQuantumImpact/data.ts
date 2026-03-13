// SPDX-License-Identifier: GPL-3.0-only
import type { RoleGuideData } from '../../common/roleGuide/types'

export const EXEC_GUIDE_DATA: RoleGuideData = {
  roleId: 'executive',
  roleLabel: 'Executive / GRC',
  tagline:
    'Your governance decisions today determine whether your organization is quantum-ready or quantum-vulnerable.',

  // Step 1: Why It Matters
  urgencyStatement:
    'Quantum computers will break the encryption protecting your most sensitive data. Adversaries are already harvesting encrypted data today for future decryption. As an executive, you bear fiduciary responsibility for protecting organizational assets against this emerging threat, and regulators are setting binding deadlines.',

  threatImpacts: [
    {
      id: 'hndl-strategic',
      title: 'Harvest Now, Decrypt Later (HNDL)',
      description:
        'Adversaries intercept and store encrypted data today, planning to decrypt it once quantum computers are available.',
      severity: 'critical',
      timeframe: 'Already happening',
      exampleScenario:
        'A foreign intelligence service captures your encrypted M&A communications today. In 5-10 years, they decrypt everything — deal terms, valuations, strategic plans — long before your confidentiality obligations expire.',
    },
    {
      id: 'regulatory-deadlines',
      title: 'Regulatory Compliance Deadlines',
      description:
        'CNSA 2.0, NIS2, DORA, and sector-specific regulations mandate PQC migration on fixed timelines.',
      severity: 'critical',
      timeframe: '2025-2035 deadlines',
      exampleScenario:
        'Your US government contracts require CNSA 2.0 compliance by 2030 for software/firmware. Non-compliance means contract loss, re-compete exclusion, and potential debarment.',
    },
    {
      id: 'board-liability',
      title: 'Board & Fiduciary Liability',
      description:
        'Directors face increasing personal liability for cybersecurity failures. Quantum risk is a known and documented threat.',
      severity: 'high',
      timeframe: 'Growing annually',
      exampleScenario:
        'A shareholder derivative suit alleges board negligence after a post-quantum data breach. The plaintiffs point to NIST advisories from 2024 warning organizations to begin migration, arguing the board had constructive notice.',
    },
    {
      id: 'vendor-supply-chain',
      title: 'Vendor & Supply Chain Risk',
      description:
        'Your vendors\u2019 PQC readiness directly impacts your organization\u2019s security posture.',
      severity: 'high',
      timeframe: '2025-2028 assessment window',
      exampleScenario:
        'Your cloud provider announces ML-KEM support but your ERP vendor has no PQC roadmap. Data flowing between systems remains vulnerable at the weakest link.',
    },
    {
      id: 'competitive-disadvantage',
      title: 'Competitive Disadvantage',
      description:
        'Early PQC adopters gain trust advantages in regulated markets; laggards face customer attrition.',
      severity: 'medium',
      timeframe: '2026-2030',
      exampleScenario:
        'A competitor wins a major government contract partly because they demonstrated PQC-ready infrastructure. Your RFP response could not make the same claim.',
    },
    {
      id: 'insurance-cost',
      title: 'Rising Cyber Insurance Costs',
      description:
        'Insurers are beginning to factor quantum risk into policy pricing and exclusion clauses.',
      severity: 'medium',
      timeframe: '2026-2030',
      exampleScenario:
        'Your cyber insurance renewal includes a new quantum-risk questionnaire. Organizations without a documented PQC migration plan face 15-25% premium increases or coverage exclusions.',
    },
  ],

  selfAssessment: [
    {
      id: 'long-data',
      label: 'We store data requiring confidentiality beyond 10 years',
      weight: 15,
    },
    {
      id: 'regulated',
      label: 'We operate in a regulated industry (finance, healthcare, government, defense)',
      weight: 15,
    },
    { id: 'gov-contracts', label: 'We hold government or defense contracts', weight: 12 },
    {
      id: 'multi-jurisdiction',
      label: 'We operate across multiple regulatory jurisdictions',
      weight: 10,
    },
    { id: 'no-inventory', label: 'We lack a comprehensive cryptographic inventory', weight: 10 },
    { id: 'no-pqc-plan', label: 'We have no documented PQC migration plan', weight: 12 },
    {
      id: 'vendor-deps',
      label: 'We rely on 10+ third-party vendors for critical operations',
      weight: 8,
    },
    {
      id: 'ip-sensitive',
      label: 'We handle high-value intellectual property or trade secrets',
      weight: 10,
    },
    { id: 'no-budget', label: 'No budget has been allocated for PQC migration', weight: 8 },
  ],

  // Step 2: What to Learn
  skillGaps: [
    {
      id: 'risk-quantification',
      category: 'Risk & Strategy',
      skill: 'Quantum Risk Quantification',
      description:
        'Ability to quantify HNDL/HNFL exposure windows and translate them into financial risk metrics for board reporting.',
      targetLevel: 'intermediate',
      linkedModules: [
        { id: 'pqc-risk-management', label: 'PQC Risk Management' },
        { id: 'quantum-threats', label: 'Quantum Threats' },
      ],
    },
    {
      id: 'compliance-landscape',
      category: 'Risk & Strategy',
      skill: 'PQC Compliance Landscape',
      description:
        'Understanding of CNSA 2.0, NIS2, DORA, and sector-specific PQC mandates and their timelines.',
      targetLevel: 'intermediate',
      linkedModules: [
        { id: 'compliance-strategy', label: 'Compliance & Regulatory Strategy' },
        { id: 'standards-bodies', label: 'Standards Bodies' },
        { id: 'healthcare-pqc', label: 'Healthcare PQC' },
      ],
    },
    {
      id: 'business-case',
      category: 'Risk & Strategy',
      skill: 'PQC Business Case Building',
      description:
        'Constructing ROI models, cost-benefit analyses, and investment proposals for PQC migration.',
      targetLevel: 'intermediate',
      linkedModules: [
        { id: 'pqc-business-case', label: 'PQC Business Case' },
        { id: 'emv-payment-pqc', label: 'EMV Payment PQC' },
      ],
    },
    {
      id: 'governance',
      category: 'Governance & Oversight',
      skill: 'PQC Governance Frameworks',
      description:
        'Establishing governance structures, policies, and accountability for cryptographic transitions.',
      targetLevel: 'intermediate',
      linkedModules: [{ id: 'pqc-governance', label: 'PQC Governance' }],
    },
    {
      id: 'vendor-risk',
      category: 'Governance & Oversight',
      skill: 'Vendor PQC Readiness Assessment',
      description:
        'Evaluating vendor PQC roadmaps, contract requirements, and supply chain cryptographic dependencies.',
      targetLevel: 'basic',
      linkedModules: [
        { id: 'vendor-risk', label: 'Vendor Risk' },
        { id: 'aerospace-pqc', label: 'Aerospace PQC' },
      ],
    },
    {
      id: 'data-sensitivity',
      category: 'Governance & Oversight',
      skill: 'Data Asset Sensitivity Classification',
      description:
        'Classifying data assets by confidentiality lifetime and mapping them to PQC migration priority.',
      targetLevel: 'basic',
      linkedModules: [
        { id: 'data-asset-sensitivity', label: 'Data & Asset Sensitivity' },
        { id: 'energy-utilities-pqc', label: 'Energy & Utilities PQC' },
      ],
    },
    {
      id: 'migration-oversight',
      category: 'Program Management',
      skill: 'Migration Program Oversight',
      description:
        'Overseeing multi-year PQC migration programs: milestones, KPIs, stakeholder communication.',
      targetLevel: 'basic',
      linkedModules: [{ id: 'migration-program', label: 'Migration Program Mgmt' }],
    },
    {
      id: 'algo-literacy',
      category: 'Technical Literacy',
      skill: 'PQC Algorithm Literacy',
      description:
        'High-level understanding of ML-KEM, ML-DSA, SLH-DSA, and why they replace RSA/ECC.',
      targetLevel: 'basic',
      linkedModules: [{ id: 'pqc-101', label: 'PQC 101' }],
    },
  ],

  knowledgeDomains: [
    {
      name: 'Threat Awareness',
      description:
        'Understand the quantum threat landscape and why it matters to your organization.',
      modules: [
        { id: 'pqc-101', label: 'PQC 101' },
        { id: 'quantum-threats', label: 'Quantum Threats' },
      ],
    },
    {
      name: 'Risk & Investment',
      description: 'Quantify risk, build the business case, and secure migration funding.',
      modules: [
        { id: 'pqc-risk-management', label: 'Risk Management' },
        { id: 'pqc-business-case', label: 'Business Case' },
        { id: 'data-asset-sensitivity', label: 'Data Sensitivity' },
      ],
    },
    {
      name: 'Governance & Compliance',
      description: 'Establish oversight frameworks and navigate regulatory requirements.',
      modules: [
        { id: 'pqc-governance', label: 'Governance' },
        { id: 'compliance-strategy', label: 'Compliance Strategy' },
        { id: 'standards-bodies', label: 'Standards Bodies' },
      ],
    },
    {
      name: 'Execution & Operations',
      description: 'Oversee migration programs and manage vendor cryptographic readiness.',
      modules: [
        { id: 'migration-program', label: 'Migration Program' },
        { id: 'vendor-risk', label: 'Vendor Risk' },
      ],
    },
  ],

  // Step 3: How to Act
  actionItems: [
    {
      id: 'exec-immediate-1',
      phase: 'immediate',
      title: 'Request Cryptographic Inventory',
      description: 'Ask your CISO or security team for a current cryptographic inventory report.',
      checklist: [
        'Request inventory of all RSA, ECC, and DH usage across systems',
        'Identify data assets with confidentiality requirements beyond 2035',
        'Request a list of vendor dependencies using vulnerable cryptography',
      ],
    },
    {
      id: 'exec-immediate-2',
      phase: 'immediate',
      title: 'Schedule Quantum Risk Briefing',
      description: 'Arrange a quantum threat briefing for the executive team and board.',
      checklist: [
        'Schedule 30-minute quantum risk overview for leadership team',
        'Request CISO prepare HNDL exposure assessment',
        'Add PQC migration to next board meeting agenda',
      ],
    },
    {
      id: 'exec-30d-1',
      phase: '30-day',
      title: 'Commission PQC Risk Assessment',
      description: 'Initiate a formal quantum risk assessment across the organization.',
      checklist: [
        'Engage internal or external team for PQC risk assessment',
        'Define scope: all systems handling sensitive data with >5yr confidentiality',
        'Review HNDL exposure windows for top 20 data assets',
        'Assess current vendor PQC roadmaps and contract language',
      ],
    },
    {
      id: 'exec-90d-1',
      phase: '90-day',
      title: 'Present Business Case to Board',
      description: 'Build and present the PQC migration business case for executive approval.',
      checklist: [
        'Develop cost-benefit analysis for PQC migration',
        'Map compliance deadlines to migration milestones',
        'Propose PQC governance committee charter',
        'Request multi-year budget allocation for migration program',
      ],
    },
    {
      id: 'exec-90d-2',
      phase: '90-day',
      title: 'Establish PQC Governance',
      description: 'Set up governance structures for ongoing cryptographic transition oversight.',
      checklist: [
        'Appoint PQC migration executive sponsor',
        'Establish cross-functional PQC steering committee',
        'Define reporting cadence and KPI dashboard',
      ],
    },
    {
      id: 'exec-6mo-1',
      phase: '6-month',
      title: 'Fund & Launch Migration Pilot',
      description: 'Execute the first phase of PQC migration on a non-critical system.',
      checklist: [
        'Approve budget for migration pilot project',
        'Select pilot system (low-risk, high-learning-value)',
        'Integrate PQC requirements into procurement and vendor management',
        'Update cyber insurance documentation with PQC migration plan',
        'Schedule quarterly board progress reviews',
      ],
    },
  ],

  quickWins: [
    {
      id: 'qw-inventory',
      label: 'Ask for the crypto inventory',
      description: 'One email to your CISO can surface your quantum exposure in days, not months.',
    },
    {
      id: 'qw-briefing',
      label: 'Add quantum risk to next board agenda',
      description: 'A 10-minute agenda item creates organizational awareness and accountability.',
    },
    {
      id: 'qw-vendor',
      label: 'Check your top 3 vendors\u2019 PQC roadmaps',
      description:
        'Most major cloud and software vendors have published PQC timelines. Review them.',
    },
  ],

  kpiMetrics: [
    {
      label: 'Crypto Inventory Coverage',
      target: '100%',
      description: 'Percentage of systems with documented cryptographic usage.',
    },
    {
      label: 'HNDL Exposure',
      target: '< 5 years',
      description: 'Maximum gap between data confidentiality requirement and PQC migration date.',
    },
    {
      label: 'Vendor PQC Readiness',
      target: '> 80%',
      description: 'Percentage of critical vendors with documented PQC migration roadmaps.',
    },
    {
      label: 'Board Awareness',
      target: 'Quarterly',
      description: 'Frequency of quantum risk reporting to board of directors.',
    },
    {
      label: 'Compliance Coverage',
      target: '100%',
      description: 'Percentage of applicable PQC mandates with mapped migration milestones.',
    },
    {
      label: 'Migration Budget',
      target: 'Approved',
      description: 'Multi-year PQC migration budget formally approved by leadership.',
    },
  ],
}
