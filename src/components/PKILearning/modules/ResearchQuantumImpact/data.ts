// SPDX-License-Identifier: GPL-3.0-only
import type { RoleGuideData } from '../../common/roleGuide/types'

export const RESEARCH_GUIDE_DATA: RoleGuideData = {
  roleId: 'researcher',
  roleLabel: 'Researcher / Academic',
  tagline:
    'Research data with long confidentiality needs is uniquely vulnerable to quantum attacks. Your field needs PQC-literate researchers.',

  urgencyStatement:
    'Research institutions handle some of the most sensitive long-lived data on the planet \u2014 genomic sequences, clinical trial results, defense research, and intellectual property that may remain confidential for decades. This data is a prime target for Harvest Now, Decrypt Later attacks. Additionally, the PQC field itself is an active research area with open problems in side-channel analysis, formal verification, and cross-disciplinary applications.',

  threatImpacts: [
    {
      id: 'research-data',
      title: 'Long-Lived Research Data',
      description:
        'Genomic, clinical, defense, and proprietary research data may require confidentiality for 20-50+ years.',
      severity: 'critical',
      timeframe: 'Already at risk (HNDL)',
      exampleScenario:
        'A pharmaceutical company\u2019s phase-3 clinical trial data is encrypted with RSA-2048. The data must remain confidential for 25 years. Nation-state adversaries intercepting this data today could decrypt it in 10-15 years \u2014 well within the confidentiality window.',
    },
    {
      id: 'academic-publishing',
      title: 'Publication & Peer Review Integrity',
      description:
        'Digital signatures on academic publications, peer reviews, and grant proposals will need PQC-resistant verification.',
      severity: 'high',
      timeframe: '2026-2035',
      exampleScenario:
        'A landmark paper signed with ECDSA in 2025 is challenged in 2040. The digital signature can no longer be verified because ECDSA has been broken. Questions arise about the paper\u2019s authenticity, affecting citation chains and research reproducibility.',
    },
    {
      id: 'research-infra',
      title: 'Research Infrastructure Vulnerability',
      description:
        'HPC clusters, data repositories, and collaborative platforms use cryptography that will be broken by quantum computers.',
      severity: 'high',
      timeframe: '2025-2030',
      exampleScenario:
        'Your university\u2019s HPC cluster uses SSH with ECDH key exchange for researcher access. A quantum-capable adversary could intercept and later decrypt all data transmitted to and from the cluster, including unpublished results.',
    },
    {
      id: 'emerging-research',
      title: 'Emerging PQC Research Opportunities',
      description:
        'Active research areas include side-channel attacks on PQC, lattice-based cryptanalysis, hybrid formal verification, and QKD integration.',
      severity: 'medium',
      timeframe: 'Ongoing',
      exampleScenario:
        'A researcher discovers a side-channel vulnerability in a widely deployed ML-KEM implementation. This finding has massive impact across industry and government, but the researcher lacked PQC expertise to identify it earlier.',
    },
    {
      id: 'cross-disciplinary',
      title: 'Cross-Disciplinary PQC Applications',
      description:
        'Fields like bioinformatics, financial modeling, IoT, and AI/ML increasingly need PQC-aware security.',
      severity: 'medium',
      timeframe: '2025-2035',
      exampleScenario:
        'A bioinformatics team designs a federated learning system for multi-institution genomic analysis. The system uses classical encryption for model aggregation. Without PQC, the entire collaborative dataset is vulnerable to future decryption.',
    },
    {
      id: 'grant-funding',
      title: 'Funding & Grant Competitiveness',
      description:
        'Funding agencies increasingly prioritize quantum-safe security in research proposals.',
      severity: 'low',
      timeframe: '2026-2030',
      exampleScenario:
        'An NSF proposal for a distributed health data platform is scored down because the security section does not address quantum-safe data protection. The competing proposal from another institution includes a PQC migration plan and wins the award.',
    },
  ],

  selfAssessment: [
    {
      id: 'long-conf',
      label: 'I work with data requiring >10 year confidentiality (genomic, clinical, defense)',
      weight: 18,
    },
    {
      id: 'hpc-access',
      label: 'I access HPC clusters or shared research infrastructure via SSH/VPN',
      weight: 12,
    },
    {
      id: 'collab-data',
      label: 'I participate in multi-institution data sharing or federated research',
      weight: 10,
    },
    {
      id: 'publishes',
      label: 'I publish research with digitally signed documents or code',
      weight: 8,
    },
    {
      id: 'crypto-related',
      label: 'My research touches cryptography, security, or information theory',
      weight: 15,
    },
    {
      id: 'grant-writer',
      label: 'I write grant proposals that include security or data protection sections',
      weight: 8,
    },
    {
      id: 'no-pqc-awareness',
      label: 'I have limited awareness of post-quantum cryptography standards',
      weight: 12,
    },
    {
      id: 'sensitive-ip',
      label: 'My research involves patentable or commercially sensitive IP',
      weight: 10,
    },
    {
      id: 'no-data-classification',
      label: 'My institution lacks a data classification policy for quantum risk',
      weight: 7,
    },
  ],

  skillGaps: [
    {
      id: 'lattice-foundations',
      category: 'Algorithm Foundations',
      skill: 'Lattice-Based Cryptography',
      description:
        'Understanding Learning with Errors (LWE), Module-LWE, and their role in ML-KEM and ML-DSA.',
      targetLevel: 'advanced',
      linkedModules: [
        { id: 'pqc-101', label: 'PQC 101' },
        { id: 'quantum-threats', label: 'Quantum Threats' },
      ],
    },
    {
      id: 'hash-based-sigs',
      category: 'Algorithm Foundations',
      skill: 'Hash-Based Signature Schemes',
      description: 'Deep understanding of XMSS, LMS/HSS, SLH-DSA, and their security proofs.',
      targetLevel: 'advanced',
      linkedModules: [{ id: 'stateful-signatures', label: 'Stateful Signatures' }],
    },
    {
      id: 'entropy-analysis',
      category: 'Algorithm Foundations',
      skill: 'Entropy & Randomness Analysis',
      description:
        'Evaluating entropy sources, DRBG constructions, and their adequacy for PQC key generation.',
      targetLevel: 'intermediate',
      linkedModules: [{ id: 'entropy-randomness', label: 'Entropy & Randomness' }],
    },
    {
      id: 'hybrid-formal',
      category: 'Security Analysis',
      skill: 'Hybrid Cryptography & Formal Methods',
      description:
        'Analyzing security of hybrid classical+PQC constructions and their formal security proofs.',
      targetLevel: 'intermediate',
      linkedModules: [{ id: 'hybrid-crypto', label: 'Hybrid Cryptography' }],
    },
    {
      id: 'qkd-protocols',
      category: 'Security Analysis',
      skill: 'QKD Protocols & Limitations',
      description:
        'Understanding BB84, E91, and practical QKD deployments, including their limitations vs. PQC.',
      targetLevel: 'intermediate',
      linkedModules: [{ id: 'qkd', label: 'Quantum Key Distribution' }],
    },
    {
      id: 'standards-process',
      category: 'Standards & Policy',
      skill: 'PQC Standards Landscape',
      description:
        'Understanding NIST, ISO, ETSI, and IETF standardization processes for PQC algorithms.',
      targetLevel: 'intermediate',
      linkedModules: [{ id: 'standards-bodies', label: 'Standards Bodies' }],
    },
    {
      id: 'side-channel',
      category: 'Implementation Analysis',
      skill: 'Side-Channel Analysis',
      description:
        'Identifying and mitigating side-channel vulnerabilities in PQC implementations.',
      targetLevel: 'basic',
      linkedModules: [{ id: 'confidential-computing', label: 'Confidential Computing' }],
    },
    {
      id: 'pqc-applications',
      category: 'Implementation Analysis',
      skill: 'Cross-Disciplinary PQC Applications',
      description:
        'Applying PQC concepts to bioinformatics, financial systems, IoT, and emerging technology domains.',
      targetLevel: 'basic',
      linkedModules: [
        { id: 'digital-assets', label: 'Digital Assets' },
        { id: 'iot-ot-pqc', label: 'IoT/OT PQC' },
        { id: 'ai-security-pqc', label: 'AI Security & PQC' },
      ],
    },
  ],

  knowledgeDomains: [
    {
      name: 'Mathematical Foundations',
      description: 'Deep dive into the mathematical problems underlying PQC algorithm security.',
      modules: [
        { id: 'pqc-101', label: 'PQC 101' },
        { id: 'quantum-threats', label: 'Quantum Threats' },
        { id: 'entropy-randomness', label: 'Entropy & Randomness' },
      ],
    },
    {
      name: 'Algorithm Design & Analysis',
      description: 'Study signature schemes, key encapsulation, and their security proofs.',
      modules: [
        { id: 'stateful-signatures', label: 'Stateful Signatures' },
        { id: 'hybrid-crypto', label: 'Hybrid Crypto' },
        { id: 'merkle-tree-certs', label: 'Merkle Tree Certs' },
      ],
    },
    {
      name: 'Quantum Communications',
      description: 'Understand QKD protocols, deployments, and their relationship to PQC.',
      modules: [{ id: 'qkd', label: 'Quantum Key Distribution' }],
    },
    {
      name: 'Standards & Applications',
      description: 'Navigate the standardization landscape and apply PQC across domains.',
      modules: [
        { id: 'standards-bodies', label: 'Standards Bodies' },
        { id: 'digital-assets', label: 'Digital Assets' },
        { id: 'iot-ot-pqc', label: 'IoT/OT PQC' },
      ],
    },
  ],

  actionItems: [
    {
      id: 'res-immediate-1',
      phase: 'immediate',
      title: 'Survey PQC in Your Domain',
      description: 'Assess how post-quantum cryptography impacts your specific research field.',
      checklist: [
        'Identify data in your research with long-term confidentiality requirements',
        'Search for PQC-related publications in your field (last 2 years)',
        'Check if your institution has a quantum risk policy for research data',
        'Review the cryptographic protocols used by your research infrastructure',
      ],
    },
    {
      id: 'res-30d-1',
      phase: '30-day',
      title: 'Experiment with PQC Algorithms',
      description: 'Get hands-on experience with NIST-standardized PQC algorithms.',
      checklist: [
        'Install liboqs or PQC-enabled OpenSSL in your research environment',
        'Generate ML-KEM and ML-DSA key pairs programmatically',
        'Run performance benchmarks against classical algorithms',
        'Explore PQC interoperability in your programming language ecosystem',
      ],
    },
    {
      id: 'res-90d-1',
      phase: '90-day',
      title: 'Publish or Present PQC Awareness',
      description: 'Share PQC knowledge within your research community.',
      checklist: [
        'Present PQC overview at a departmental seminar or lab meeting',
        'Draft a position paper on quantum risk in your field',
        'Identify potential PQC research collaborations',
        'Review and comment on relevant IETF or NIST drafts',
        'Add PQC security considerations to your next grant proposal',
      ],
    },
    {
      id: 'res-6mo-1',
      phase: '6-month',
      title: 'Establish PQC Research Program',
      description: 'Build sustainable PQC research capacity in your institution.',
      checklist: [
        'Propose or join a PQC-focused research group or working group',
        'Submit a grant proposal with PQC security as a component',
        'Contribute to open-source PQC implementations or analysis tools',
        'Establish collaboration with cryptography researchers at other institutions',
        'Publish a PQC-related paper, tool, or dataset',
      ],
    },
  ],

  quickWins: [
    {
      id: 'qw-litreview',
      label: 'Search for "post-quantum" in your field',
      description:
        'A quick Google Scholar search reveals how your peers are addressing quantum risk.',
    },
    {
      id: 'qw-data-audit',
      label: 'List your data with >10yr confidentiality',
      description:
        'Genomic data, clinical results, and defense research are highest-priority targets.',
    },
    {
      id: 'qw-playground',
      label: 'Try the PQC Playground',
      description:
        'Generate ML-KEM and ML-DSA keys in your browser to see how PQC algorithms work hands-on.',
    },
  ],

  kpiMetrics: [
    {
      label: 'Data Risk Assessment',
      target: 'Complete',
      description: 'All research data classified by quantum risk exposure.',
    },
    {
      label: 'PQC Literacy',
      target: 'Intermediate',
      description: 'Working knowledge of NIST PQC standards and their mathematical foundations.',
    },
    {
      label: 'Hands-On Experience',
      target: '\u2265 3 algorithms',
      description: 'Practical experience with ML-KEM, ML-DSA, and at least one hash-based scheme.',
    },
    {
      label: 'Community Engagement',
      target: '\u2265 1 presentation',
      description: 'At least one PQC-related talk, paper, or workshop contribution.',
    },
    {
      label: 'Grant Integration',
      target: '\u2265 1 proposal',
      description: 'PQC security considerations included in at least one grant proposal.',
    },
    {
      label: 'Collaboration',
      target: 'Established',
      description: 'Active collaboration with cryptography researchers or PQC working groups.',
    },
  ],
}
