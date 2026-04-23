// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import Papa from 'papaparse'
import type {
  QuizQuestion,
  QuizCategory,
  QuestionType,
  QuizCategoryMeta,
} from '@/components/PKILearning/modules/Quiz/types'
import { loadLatestCSV, splitPipe } from './csvUtils'

// ─── Raw CSV row shape ───

interface RawQuizRow {
  id: string
  category: string
  type: string
  difficulty: string
  quiz_mode: string
  question: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer: string
  explanation: string
  learn_more_path: string
  personas: string
  industries: string
}

// ─── Transform function ───

function transformQuizRow(row: RawQuizRow): QuizQuestion | null {
  if (!row.id || !row.question) return null

  const type = row.type as QuestionType
  const quizMode = row.quiz_mode as 'quick' | 'full' | 'both'

  // Build options array with correct IDs
  const options: { id: string; text: string }[] = []
  if (type === 'true-false') {
    if (row.option_a) options.push({ id: 'true', text: row.option_a })
    if (row.option_b) options.push({ id: 'false', text: row.option_b })
  } else {
    const ids = ['a', 'b', 'c', 'd']
    const optionTexts = [row.option_a, row.option_b, row.option_c, row.option_d]
    for (let i = 0; i < 4; i++) {
      if (optionTexts[i]) options.push({ id: ids[i], text: optionTexts[i] })
    }
  }

  // Skip rows with no options (e.g. truncated CSV rows)
  if (options.length === 0) return null

  // Parse correctAnswer — pipe-delimited for multi-select
  const correctAnswer: string | string[] =
    type === 'multi-select' ? row.correct_answer.split('|') : row.correct_answer

  const q: QuizQuestion = {
    id: row.id,
    category: row.category as QuizCategory,
    type,
    difficulty: row.difficulty as 'beginner' | 'intermediate' | 'advanced',
    quizMode,
    question: row.question,
    options,
    correctAnswer,
    explanation: row.explanation,
    personas: splitPipe(row.personas),
    industries: splitPipe(row.industries),
  }
  if (row.learn_more_path) q.learnMorePath = row.learn_more_path
  return q
}

// ─── Load and export ───

const modules = import.meta.glob('./pqcquiz_*.csv', {
  query: '?raw',
  import: 'default',
  eager: true,
})

const { data: questions, metadata } = loadLatestCSV<RawQuizRow, QuizQuestion>(
  modules,
  /pqcquiz_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/,
  transformQuizRow
)

export const quizQuestions: QuizQuestion[] = questions

export const quizMetadata = metadata

// ─── Standalone CSV parser for tests ───

export function parseQuizCSV(csvContent: string): QuizQuestion[] {
  if (!csvContent.trim()) return []
  const { data } = Papa.parse(csvContent.trim(), {
    header: true,
    skipEmptyLines: true,
  })
  return (data as RawQuizRow[]).map(transformQuizRow).filter((q): q is QuizQuestion => q !== null)
}

// ─── Dynamic category metadata ───

const CATEGORY_CONFIG: Record<QuizCategory, { label: string; description: string; icon: string }> =
  {
    'ai-security-pqc': {
      label: 'AI & Machine Learning PQC',
      description:
        'AI model protection, true data provenance, scale encryption, and securing agentic workflows.',
      icon: 'Cpu',
    },
    'pqc-fundamentals': {
      label: 'PQC Fundamentals',
      description: 'Quantum threats, HNDL attacks, and the basics of post-quantum cryptography.',
      icon: 'Shield',
    },
    'algorithm-families': {
      label: 'Algorithm Families',
      description:
        'Lattice-based, code-based, and hash-based PQC algorithms — names, properties, and trade-offs.',
      icon: 'Layers',
    },
    'nist-standards': {
      label: 'NIST Standards',
      description: 'FIPS standards, security levels, and the NIST PQC standardization process.',
      icon: 'FileCheck',
    },
    'migration-planning': {
      label: 'Migration Planning',
      description: 'Migration frameworks, crypto agility, CBOM, and hybrid deployment strategies.',
      icon: 'Route',
    },
    compliance: {
      label: 'Compliance & Regulations',
      description: 'CNSA 2.0, ANSSI, eIDAS 2.0, and global PQC compliance deadlines.',
      icon: 'Scale',
    },
    'protocol-integration': {
      label: 'Protocol Integration',
      description: 'PQC in TLS, IPsec, CMS/S/MIME, OpenPGP, 5G, and SSH protocols.',
      icon: 'Network',
    },
    'industry-threats': {
      label: 'Industry Threats',
      description: 'Sector-specific quantum risks across finance, healthcare, telecom, and more.',
      icon: 'AlertTriangle',
    },
    'crypto-operations': {
      label: 'Crypto Operations',
      description:
        'KEMs vs signatures, key sizes, encapsulation, performance, and practical trade-offs.',
      icon: 'Key',
    },
    'digital-assets': {
      label: 'Digital Assets',
      description:
        'Blockchain cryptography, elliptic curves, HD wallets, and post-quantum threats to digital assets.',
      icon: 'Bitcoin',
    },
    'tls-basics': {
      label: 'TLS Basics',
      description:
        'TLS 1.3 handshake, cipher suites, key exchange, certificates, and PQC integration.',
      icon: 'Lock',
    },
    'pki-infrastructure': {
      label: 'PKI Infrastructure',
      description:
        'X.509 certificates, certificate authorities, digital signatures, and PQC migration for PKI.',
      icon: 'Award',
    },
    'digital-id': {
      label: 'Digital Identity',
      description:
        'eIDAS 2.0, EUDI Wallets, credential formats, trust frameworks, and post-quantum readiness for digital identity.',
      icon: 'Fingerprint',
    },
    '5g-security': {
      label: '5G Security',
      description:
        'SUCI subscriber privacy, 5G-AKA authentication, MILENAGE, SIM provisioning, and post-quantum upgrades for 5G networks.',
      icon: 'Radio',
    },
    'quantum-threats': {
      label: 'Quantum Threats',
      description:
        "Shor's and Grover's algorithms, CRQC timelines, HNDL attack mechanics, and security level degradation.",
      icon: 'Zap',
    },
    'hybrid-crypto': {
      label: 'Hybrid Cryptography',
      description:
        'Hybrid KEMs, composite signatures, X25519MLKEM768, dual-OID certificates, and transition standards.',
      icon: 'Combine',
    },
    'crypto-agility': {
      label: 'Crypto Agility',
      description:
        'Abstraction layers, CBOM scanning, provider model, CycloneDX, and the 7-phase migration framework.',
      icon: 'Repeat',
    },
    'vpn-ssh-pqc': {
      label: 'VPN/IPsec & SSH',
      description:
        'IKEv2 with ML-KEM, SSH hybrid key exchange, WireGuard Rosenpass, and protocol size comparisons.',
      icon: 'Shield',
    },
    'stateful-signatures': {
      label: 'Stateful Signatures',
      description:
        'LMS/HSS, XMSS/XMSS^MT, Merkle tree signatures, one-time signature state, and NIST SP 800-208.',
      icon: 'GitBranch',
    },
    'email-signing': {
      label: 'Email & Document Signing',
      description:
        'S/MIME, CMS SignedData/EnvelopedData, RFC 9629 KEMRecipientInfo, and PQC migration for email.',
      icon: 'Mail',
    },
    'kms-pqc': {
      label: 'KMS & PQC Key Management',
      description:
        'Key lifecycle (NIST SP 800-57), envelope encryption with ML-KEM, hybrid key wrapping, multi-provider rotation planning.',
      icon: 'KeyRound',
    },
    'hsm-pqc': {
      label: 'HSM & PQC Operations',
      description:
        'PKCS#11 v3.2, HSM vendor comparison, firmware migration, and FIPS 140-3 validation.',
      icon: 'HardDrive',
    },
    'entropy-randomness': {
      label: 'Entropy & Randomness',
      description:
        'SP 800-90 A/B/C, DRBGs, entropy sources, TRNG vs QRNG, and min-entropy estimation.',
      icon: 'Dice',
    },
    'merkle-tree-certs': {
      label: 'Merkle Tree Certificates',
      description:
        'MTC batch signing, inclusion proofs, MTCA architecture, domain-separated hashing, and IETF PLANTS WG standardization.',
      icon: 'TreePine',
    },
    qkd: {
      label: 'Quantum Key Distribution',
      description:
        'BB84 protocol, QBER eavesdropper detection, sifted keys, privacy amplification, satellite QKD, and QKD + PQC hybrid integration.',
      icon: 'Atom',
    },
    'code-signing': {
      label: 'Code Signing & Supply Chain',
      description:
        'Code signing certificate chains, ML-DSA package signing, Sigstore keyless signing, and supply chain integrity.',
      icon: 'Package',
    },
    'api-security-jwt': {
      label: 'API Security & JWT',
      description:
        'JWT/JWS/JWE with PQC algorithms, JOSE header changes, ML-DSA token signing, ML-KEM key agreement, and OAuth 2.0 migration.',
      icon: 'KeyRound',
    },
    'iot-ot-pqc': {
      label: 'IoT & OT Security',
      description:
        'PQC for constrained devices, RFC 7228 device classes, firmware signing, DTLS 1.3, certificate chain bloat, and SCADA migration.',
      icon: 'Cpu',
    },
    'pqc-risk-management': {
      label: 'PQC Risk Management',
      description:
        'Risk quantification, CRQC timeline planning, risk registers, and quantum threat-based risk assessment.',
      icon: 'AlertTriangle',
    },
    'pqc-business-case': {
      label: 'PQC Business Case',
      description:
        'ROI modeling, breach cost analysis, budget frameworks, and executive communication for PQC investment.',
      icon: 'TrendingUp',
    },
    'pqc-governance': {
      label: 'PQC Governance & Policy',
      description:
        'RACI matrices, PQC policies, governance models, board reporting, and organizational accountability.',
      icon: 'Building2',
    },
    'compliance-strategy': {
      label: 'Compliance Strategy',
      description:
        'Multi-jurisdiction mapping, audit readiness, regulatory horizon scanning, and compliance planning.',
      icon: 'Scale',
    },
    'migration-program': {
      label: 'Migration Program',
      description:
        'Roadmap construction, phase-gating, resource planning, stakeholder communications, and KPI tracking.',
      icon: 'Route',
    },
    'vendor-risk': {
      label: 'Vendor & Supply Chain',
      description:
        'Vendor PQC scorecards, contract requirements, SBOM/CBOM evaluation, and third-party risk assessment.',
      icon: 'Package',
    },
    'data-asset-sensitivity': {
      label: 'Data & Asset Sensitivity',
      description:
        'Classifying data assets, mapping compliance obligations, NIST RMF/ISO 27005/FAIR methodologies, and PQC migration priority.',
      icon: 'Database',
    },
    'standards-bodies': {
      label: 'Standards, Certification & Compliance Bodies',
      description:
        'NIST, ISO/IEC, ETSI, IETF, CMVP, ENISA, ANSSI, BSI — who creates standards, who certifies, and who mandates.',
      icon: 'Building2',
    },
    'web-gateway-pqc': {
      label: 'Web Gateway PQC',
      description:
        'PQC deployment at web gateways, CDNs, load balancers, and WAFs: TLS termination, certificate lifecycle, and vendor migration.',
      icon: 'Globe',
    },
    'energy-utilities-pqc': {
      label: 'Energy & Utilities PQC',
      description:
        'NERC CIP compliance, IEC 61850/62351 substation security, DNP3/DLMS/COSEM protocol hardening, smart meter key management, and safety risk scoring.',
      icon: 'Zap',
    },
    'emv-payment-pqc': {
      label: 'EMV & Payment PQC',
      description:
        'EMV chip card authentication, payment network PQC migration, tokenization, POS terminal crypto, and PCI DSS compliance.',
      icon: 'CreditCard',
    },
    'healthcare-pqc': {
      label: 'Healthcare PQC',
      description:
        'HIPAA/HITECH compliance, HL7 FHIR security, medical device cryptography, and healthcare data protection.',
      icon: 'Heart',
    },
    'aerospace-pqc': {
      label: 'Aerospace PQC',
      description:
        'Avionics protocol constraints, satellite link budgets, DO-178C certification, export controls, and multi-decade fleet crypto interoperability.',
      icon: 'Rocket',
    },
    'automotive-pqc': {
      label: 'Automotive PQC',
      description:
        'Vehicle E/E architecture, sensor data integrity, ISO 26262 safety-crypto, automotive HSM lifecycle, digital car keys, OTA orchestration, and V2X PKI migration.',
      icon: 'Car',
    },
    'crypto-dev-apis': {
      label: 'Cryptographic APIs & Languages',
      description:
        'JCA/JCE, OpenSSL EVP, PKCS#11, Windows CNG, Bouncy Castle, and Rust/Go/Python/Java crypto ecosystems with PQC library selection, provider patterns, and migration guidance.',
      icon: 'Code2',
    },
    'confidential-computing': {
      label: 'Confidential Computing & TEEs',
      description:
        'TEE architectures (SGX, TDX, CCA, SEV-SNP, Nitro), remote attestation, memory encryption, TEE-HSM integration, and quantum threat analysis for confidential computing.',
      icon: 'Cpu',
    },
    'platform-eng-pqc': {
      label: 'Platform Engineering & PQC',
      description:
        'CI/CD pipeline crypto inventory, container signing migration, IaC quantum-vulnerable defaults, policy enforcement, posture monitoring, and platform migration runway.',
      icon: 'GitBranch',
    },
    'secrets-management-pqc': {
      label: 'Secrets Management & PQC',
      description:
        'Migrate secrets managers (Vault, AWS Secrets Manager, Azure Key Vault) to quantum-safe encryption, automated rotation, and PQC key wrapping.',
      icon: 'KeyRound',
    },
    'network-security-pqc': {
      label: 'Network Security & PQC',
      description:
        'NGFWs, IDS/IPS, TLS inspection, and zero trust network architecture migration to post-quantum cryptography.',
      icon: 'Network',
    },
    'database-encryption-pqc': {
      label: 'Database Encryption & PQC',
      description:
        'TDE, column-level encryption, queryable encryption, and BYOK/HYOK migration for databases with external PQC KMS.',
      icon: 'Database',
    },
    'iam-pqc': {
      label: 'Identity & Access Management with PQC',
      description:
        'JWT/SAML/OIDC token signing with ML-DSA, Active Directory quantum risks, and PQC zero trust identity architecture.',
      icon: 'UserCheck',
    },
    'secure-boot-pqc': {
      label: 'Secure Boot & Firmware PQC',
      description:
        'Migrate UEFI Secure Boot, firmware signing, and TPM attestation to post-quantum cryptography with ML-DSA-65.',
      icon: 'Shield',
    },
    'os-pqc': {
      label: 'OS & Platform Crypto PQC',
      description:
        'System-wide TLS policies, SSH host key migration, package signing, and FIPS mode compatibility for OS-level PQC.',
      icon: 'Monitor',
    },
    'exec-quantum-impact': {
      label: 'Executive Quantum Impact',
      description:
        'Fiduciary risk, regulatory deadlines, board-level PQC action planning, and quantum exposure self-assessment.',
      icon: 'Briefcase',
    },
    'dev-quantum-impact': {
      label: 'Developer Quantum Impact',
      description:
        'Library transitions, key/signature size impacts, TLS/JWT migration, and developer PQC readiness.',
      icon: 'Code',
    },
    'arch-quantum-impact': {
      label: 'Architect Quantum Impact',
      description:
        'PKI hierarchy migration, hybrid certificate design, HSM root of trust, and crypto-agile architecture.',
      icon: 'Layers',
    },
    'ops-quantum-impact': {
      label: 'Ops Quantum Impact',
      description:
        'Certificate operations, VPN/SSH fleet migration, monitoring recalibration, and deployment pipeline PQC.',
      icon: 'Settings',
    },
    'research-quantum-impact': {
      label: 'Researcher Quantum Impact',
      description:
        'Research data HNDL exposure, institutional infrastructure, PQC algorithm research opportunities.',
      icon: 'Microscope',
    },
    'pqc-testing-validation': {
      label: 'PQC Testing & Validation',
      description:
        'Passive discovery, active scanning, performance benchmarking, interoperability testing, TVLA, and test strategy design.',
      icon: 'ScanSearch',
    },
    'crypto-mgmt-modernization': {
      label: 'Crypto Management Modernization',
      description:
        'Crypto inventory, agility, lifecycle management, and modernization programs for post-quantum readiness.',
      icon: 'RefreshCw',
    },
    'slh-dsa': {
      label: 'SLH-DSA',
      description:
        'Stateless hash-based digital signatures (FIPS 205) — SPHINCS+ standardised for post-quantum signing.',
      icon: 'TreePine',
    },
  }

// Compute question counts dynamically from loaded data
const categoryCounts = new Map<QuizCategory, number>()
for (const q of questions) {
  categoryCounts.set(q.category, (categoryCounts.get(q.category) || 0) + 1)
}

export const quizCategories: QuizCategoryMeta[] = (
  Object.keys(CATEGORY_CONFIG) as QuizCategory[]
).map((id) => ({
  id,
  ...CATEGORY_CONFIG[id],
  questionCount: categoryCounts.get(id) || 0,
}))

// ─── Persona question counts (precomputed for awareness score) ───

export const quizPersonaCounts: Record<string, number> = {}
export const quizPersonaQuestionIds: Record<string, Set<string>> = {}

for (const persona of ['executive', 'developer', 'architect', 'researcher', 'ops', 'curious']) {
  const matching = questions.filter((q) => q.personas.length === 0 || q.personas.includes(persona))
  quizPersonaCounts[persona] = matching.length
  quizPersonaQuestionIds[persona] = new Set(matching.map((q) => q.id))
}
// Fallback for no persona selected
quizPersonaCounts['all'] = questions.length
quizPersonaQuestionIds['all'] = new Set(questions.map((q) => q.id))
