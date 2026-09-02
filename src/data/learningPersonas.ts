// SPDX-License-Identifier: GPL-3.0-only
// @reviewed 2026-09-01 by eram2207usa — full read; hand-verified every
// module id, estimatedMinutes sum (all 6 personas), and quiz-category
// against live code; fixed one stale explanatory comment (researcher path)
import type { QuizCategory } from '@/components/PKILearning/modules/Quiz/types'

export type PersonaId = 'executive' | 'developer' | 'architect' | 'researcher' | 'ops' | 'curious'

export type PathItem =
  | { type: 'module'; moduleId: string }
  | {
      type: 'checkpoint'
      id: string
      label: string
      categories: QuizCategory[]
    }

export interface LearningPersona {
  id: PersonaId
  label: string
  subtitle: string
  icon: 'Briefcase' | 'Code' | 'ShieldCheck' | 'GraduationCap' | 'Server' | 'Lightbulb'
  description: string
  /** Ordered module IDs — first = start here, sequence matters */
  recommendedPath: string[]
  /** Interleaved path items: module stops + quiz checkpoints */
  pathItems: PathItem[]
  estimatedMinutes: number
  /**
   * Core module IDs (a subset of `recommendedPath`, excluding the `quiz`) that make
   * up the short "Essentials" track. Completing these is what unlocks the capstone
   * (A1); the remaining recommendedPath modules stay available as optional mastery.
   */
  essentials: string[]
  /** Sum of the essentials' module durations, in minutes (guard-tested vs manifests). */
  essentialsMinutes: number
  /** Persona-specific quiz card description shown in the learning path */
  quizDescription: string
  /** Quiz categories pre-selected for this persona (matches QuizCategory type) */
  quizCategories: string[]
}

/**
 * B+ remediation WS8 (2026-08-21) — discoverability repair.
 *
 * Three modules were in ZERO persona paths and therefore reachable only by
 * Browse: `5g-security`, `trust-services-pqc` (both censused by WS8) and
 * `government-defense-pqc` (shipped 2026-07-30, after that census — found by
 * WS17's re-count and confirmed here). All three now sit in >= 2 paths.
 *
 * Position is load-bearing, not cosmetic. `CuriousModuleView.tsx` resolves
 * Previous/Next Module purely by array index (`recommendedPath.indexOf(id)` then
 * `[idx +/- 1]`), and `computeNextIncompleteModuleId` (PersonaPathView, driving
 * the "Continue where you left off" card) walks `pathItems` in order. So a module
 * appended just before `'quiz'` only ever surfaces as "next" once a learner has
 * finished the entire 19-52 item path. Every WS8 insertion is therefore placed
 * INSIDE an existing topical cluster of the target persona's own path, never at
 * the tail. The `pathItems` twin must move with it — the lockstep guard in
 * `learningPersonas.test.ts` enforces exact order equality.
 *
 * (`NextModuleCTA.tsx` implements the same index walk and is what WS8's brief
 * named, but it is currently rendered nowhere — ModuleShell's P2.3 completion
 * footer replaced it with a `trackOrder`-based handoff. Verified 2026-08-21:
 * `grep -rn 'NextModuleCTA' src` finds only the file itself and comments.)
 *
 * Deliberate non-additions, recorded so a future pass does not "fix" them by rote:
 * - `mls-group-messaging` stays at 3/6 personas (developer, architect,
 *   researcher). It is protocol-implementation content for one messaging spec
 *   (RFC 9420); developer/architect/researcher IS its natural audience. Pushing
 *   it into executive/ops/curious would be the blanket rule WS8 explicitly
 *   rejects. Narrow reach here is correct scoping, not a gap.
 * - `qkd` stays at 2/6 personas (architect, researcher), added 2026-08-29.
 *   Advanced-difficulty Hardware Infrastructure content (BB84 protocol
 *   internals, HSM key derivation) that needs dedicated QKD hardware most
 *   orgs will never deploy — architect (designs the infra) and researcher
 *   (investigates the protocol) ARE its audience. Developer has nothing to
 *   implement against it (no software integration path exists); ops has no
 *   fleet to operate; executive/curious is too deep for either's framing.
 *   Same reasoning as mls-group-messaging above, not re-litigated per pass.
 * - `pqc-candidates` (4/6), `database-encryption-pqc` (5/6) and `os-pqc` (4/6)
 *   are NOT narrow on the persona axis at all. Their real gap is a different
 *   axis entirely — see the follow-up note below.
 *
 * FOLLOW-UP, NOT CLOSED HERE — industry-landscape cross-links. Ten modules have
 * zero `learn_module_id` rows in `industry_landscape_08182026.csv` (re-counted
 * 2026-08-21 with csv.DictReader, not a naive comma split): `crypto-registry`,
 * `sbom`, `mls-group-messaging`, `ai-security-pqc`, `confidential-computing`,
 * `platform-eng-pqc`, `vendor-risk` (all seven got persona-path fixes above) plus
 * `pqc-candidates`, `database-encryption-pqc`, `os-pqc` (deliberately untouched
 * here — see above). Persona paths cannot fix that axis; it needs an Industry
 * Landscape data pass. `digital-assets` is explicitly NOT in this set: it has 14
 * cross-links, the most of any module checked — an earlier census reported 0 for
 * it, which was a parser artifact. For reference, the three reinstated modules
 * are not at zero either (`5g-security` 6, `trust-services-pqc` 4,
 * `government-defense-pqc` 4) — their gap was persona reach, which is now closed.
 */
export const PERSONAS: Record<PersonaId, LearningPersona> = {
  executive: {
    id: 'executive',
    label: 'Executive / GRC',
    subtitle: 'Risk, governance & compliance focus',
    icon: 'Briefcase',
    description:
      'Understand the quantum threat, build a business case, establish governance, track compliance deadlines, and plan a comprehensive migration strategy.',
    recommendedPath: [
      'pqc-101',
      'exec-quantum-impact',
      'quantum-threats',
      'pqc-risk-management',
      'ai-security-pqc',
      'data-asset-sensitivity',
      'pqc-business-case',
      'pqc-governance',
      'skills-team-structure',
      'pqc-grc',
      'compliance-strategy',
      'trust-services-pqc',
      'crypto-mgmt-modernization',
      'sbom',
      'crypto-registry',
      'cbom',
      'standards-bodies',
      'government-defense-pqc',
      'crypto-agility',
      'migration-program',
      'vendor-risk',
      'digital-assets',
      'verification-closure',
      'iam-pqc',
      'quiz',
    ],
    pathItems: [
      { type: 'module', moduleId: 'pqc-101' },
      { type: 'module', moduleId: 'exec-quantum-impact' },
      { type: 'module', moduleId: 'quantum-threats' },
      {
        type: 'checkpoint',
        id: 'exec-cp-1',
        label: 'Threat Landscape',
        categories: ['pqc-fundamentals', 'exec-quantum-impact', 'quantum-threats'],
      },
      { type: 'module', moduleId: 'pqc-risk-management' },
      { type: 'module', moduleId: 'ai-security-pqc' },
      { type: 'module', moduleId: 'data-asset-sensitivity' },
      { type: 'module', moduleId: 'pqc-business-case' },
      {
        type: 'checkpoint',
        id: 'exec-cp-2',
        label: 'Risk & Investment',
        categories: [
          'pqc-risk-management',
          'data-asset-sensitivity',
          'pqc-business-case',
          'industry-threats',
        ],
      },
      { type: 'module', moduleId: 'pqc-governance' },
      { type: 'module', moduleId: 'skills-team-structure' },
      { type: 'module', moduleId: 'pqc-grc' },
      { type: 'module', moduleId: 'compliance-strategy' },
      { type: 'module', moduleId: 'trust-services-pqc' },
      { type: 'module', moduleId: 'crypto-mgmt-modernization' },
      { type: 'module', moduleId: 'sbom' },
      { type: 'module', moduleId: 'crypto-registry' },
      { type: 'module', moduleId: 'cbom' },
      { type: 'module', moduleId: 'standards-bodies' },
      { type: 'module', moduleId: 'government-defense-pqc' },
      {
        type: 'checkpoint',
        id: 'exec-cp-3',
        label: 'Governance & Compliance',
        categories: [
          'pqc-governance',
          'skills-team-structure',
          'pqc-grc',
          'compliance-strategy',
          'crypto-mgmt-modernization',
          'standards-bodies',
          'compliance',
        ],
      },
      { type: 'module', moduleId: 'crypto-agility' },
      { type: 'module', moduleId: 'migration-program' },
      { type: 'module', moduleId: 'vendor-risk' },
      { type: 'module', moduleId: 'digital-assets' },
      { type: 'module', moduleId: 'verification-closure' },
      { type: 'module', moduleId: 'iam-pqc' },
      {
        type: 'checkpoint',
        id: 'exec-cp-4',
        label: 'Migration Execution',
        categories: [
          'crypto-agility',
          'migration-program',
          'vendor-risk',
          'iam-pqc',
          'migration-planning',
          'verification-closure',
        ],
      },
      { type: 'module', moduleId: 'quiz' },
    ],
    // Governance-first track. The industry deep-dive modules (kms / healthcare /
    // emv / aerospace) were removed from the mandatory executive path so a busy
    // exec reaches the capstone after the governance core; those modules remain
    // available via Browse for anyone who wants them.
    //
    // WS8 (2026-08-21) re-added five governance-shaped modules that had narrow or
    // zero persona reach, each next to the content it belongs with rather than at
    // the tail: `ai-security-pqc` beside `pqc-risk-management` (AI-security
    // governance is board-level risk scanning), `trust-services-pqc` after
    // `compliance-strategy` (qualified signatures / TSP conformity / 30-year
    // archival liability are compliance topics), `sbom` + `crypto-registry` after
    // `crypto-mgmt-modernization` (the same CBOM-governance cluster developer and
    // architect already walk), `government-defense-pqc` after `standards-bodies`
    // (CNSA 2.0 / OMB / statute mandate stack), and `digital-assets` beside
    // `vendor-risk` (custody risk sits on the same board risk register).
    // `ai-security-pqc` was one of the modules trimmed in the earlier pass; it is
    // back deliberately, and the ~10h concern that motivated that trim is now
    // carried by `essentials` (200 min) rather than by the full path, since the
    // capstone unlocks on essentials, not on the whole recommendedPath.
    estimatedMinutes: 985,
    essentials: [
      'pqc-101',
      'exec-quantum-impact',
      'quantum-threats',
      'pqc-risk-management',
      'pqc-business-case',
      'pqc-governance',
      'compliance-strategy',
    ],
    essentialsMinutes: 200,
    quizDescription:
      'Test your knowledge on quantum threats, risk management, data asset classification, business cases, governance, compliance strategy, cryptographic management modernization, migration planning, vendor risk, and identity & access management.',
    quizCategories: [
      'pqc-fundamentals',
      'exec-quantum-impact',
      'quantum-threats',
      'industry-threats',
      'data-asset-sensitivity',
      'pqc-risk-management',
      'pqc-business-case',
      'pqc-governance',
      'skills-team-structure',
      'pqc-grc',
      'compliance-strategy',
      'crypto-mgmt-modernization',
      'standards-bodies',
      'compliance',
      'migration-planning',
      'crypto-agility',
      'migration-program',
      'vendor-risk',
      'iam-pqc',
      'verification-closure',
    ],
  },
  developer: {
    id: 'developer',
    label: 'Developer / Engineer',
    subtitle: 'Protocol & implementation focus',
    icon: 'Code',
    description:
      'Hands-on protocol integration: TLS, VPN/SSH, PKI certificates, and hybrid cryptography.',
    recommendedPath: [
      'pqc-101',
      'dev-quantum-impact',
      'quantum-threats',
      'entropy-randomness',
      'pqc-candidates',
      'tls-basics',
      'vpn-ssh-pqc',
      'mls-group-messaging',
      'web-gateway-pqc',
      '5g-security',
      'pqc-testing-validation',
      'hybrid-crypto',
      'crypto-agility',
      'pki-workshop',
      'pki-enrollment-protocols',
      'crypto-dev-apis',
      'crypto-mgmt-modernization',
      'sbom',
      'cbom',
      'crypto-registry',
      'merkle-tree-certs',
      'slh-dsa',
      'stateful-signatures',
      'email-signing',
      'trust-services-pqc',
      'api-security-jwt',
      'iam-pqc',
      'database-encryption-pqc',
      'code-signing',
      'platform-eng-pqc',
      'secrets-management-pqc',
      'os-pqc',
      'iot-ot-pqc',
      'confidential-computing',
      'ai-security-pqc',
      'quiz',
    ],
    pathItems: [
      { type: 'module', moduleId: 'pqc-101' },
      { type: 'module', moduleId: 'dev-quantum-impact' },
      { type: 'module', moduleId: 'quantum-threats' },
      { type: 'module', moduleId: 'entropy-randomness' },
      { type: 'module', moduleId: 'pqc-candidates' },
      {
        type: 'checkpoint',
        id: 'dev-cp-1',
        label: 'Foundations & Threats',
        categories: [
          'pqc-fundamentals',
          'dev-quantum-impact',
          'quantum-threats',
          'entropy-randomness',
        ],
      },
      { type: 'module', moduleId: 'tls-basics' },
      { type: 'module', moduleId: 'vpn-ssh-pqc' },
      { type: 'module', moduleId: 'mls-group-messaging' },
      { type: 'module', moduleId: 'web-gateway-pqc' },
      { type: 'module', moduleId: '5g-security' },
      { type: 'module', moduleId: 'pqc-testing-validation' },
      {
        type: 'checkpoint',
        id: 'dev-cp-2',
        label: 'Protocol Integration',
        categories: [
          'tls-basics',
          'protocol-integration',
          'vpn-ssh-pqc',
          'mls-group-messaging',
          'web-gateway-pqc',
          'pqc-testing-validation',
        ],
      },
      { type: 'module', moduleId: 'hybrid-crypto' },
      { type: 'module', moduleId: 'crypto-agility' },
      {
        type: 'checkpoint',
        id: 'dev-cp-3',
        label: 'Hybrid & Agility',
        categories: ['hybrid-crypto', 'crypto-agility'],
      },
      { type: 'module', moduleId: 'pki-workshop' },
      { type: 'module', moduleId: 'pki-enrollment-protocols' },
      { type: 'module', moduleId: 'crypto-dev-apis' },
      { type: 'module', moduleId: 'crypto-mgmt-modernization' },
      { type: 'module', moduleId: 'sbom' },
      { type: 'module', moduleId: 'cbom' },
      { type: 'module', moduleId: 'crypto-registry' },
      { type: 'module', moduleId: 'merkle-tree-certs' },
      { type: 'module', moduleId: 'slh-dsa' },
      { type: 'module', moduleId: 'stateful-signatures' },
      { type: 'module', moduleId: 'email-signing' },
      { type: 'module', moduleId: 'trust-services-pqc' },
      {
        type: 'checkpoint',
        id: 'dev-cp-4',
        label: 'PKI & Signing',
        categories: [
          'pki-infrastructure',
          'crypto-dev-apis',
          'crypto-mgmt-modernization',
          'sbom',
          'cbom',
          'crypto-registry',
          'merkle-tree-certs',
          'slh-dsa',
          'stateful-signatures',
          'email-signing',
          'crypto-operations',
        ],
      },
      { type: 'module', moduleId: 'api-security-jwt' },
      { type: 'module', moduleId: 'iam-pqc' },
      { type: 'module', moduleId: 'database-encryption-pqc' },
      { type: 'module', moduleId: 'code-signing' },
      {
        type: 'checkpoint',
        id: 'dev-cp-5',
        label: 'Identity & Data',
        categories: ['api-security-jwt', 'iam-pqc', 'database-encryption-pqc', 'code-signing'],
      },
      { type: 'module', moduleId: 'platform-eng-pqc' },
      { type: 'module', moduleId: 'secrets-management-pqc' },
      { type: 'module', moduleId: 'os-pqc' },
      { type: 'module', moduleId: 'iot-ot-pqc' },
      { type: 'module', moduleId: 'confidential-computing' },
      { type: 'module', moduleId: 'ai-security-pqc' },
      {
        type: 'checkpoint',
        id: 'dev-cp-6',
        label: 'Platform & Infrastructure',
        categories: [
          'platform-eng-pqc',
          'secrets-management-pqc',
          'os-pqc',
          'iot-ot-pqc',
          'confidential-computing',
          'ai-security-pqc',
        ],
      },
      { type: 'module', moduleId: 'quiz' },
    ],
    estimatedMinutes: 1815,
    essentials: [
      'pqc-101',
      'dev-quantum-impact',
      'pqc-candidates',
      'tls-basics',
      'hybrid-crypto',
      'crypto-agility',
      'pki-workshop',
      'crypto-dev-apis',
    ],
    essentialsMinutes: 325,
    quizDescription:
      'Test your knowledge on quantum threats, TLS, VPN/SSH, MLS group messaging, PKI enrollment, cryptographic APIs, hybrid cryptography, crypto agility, PQC testing & validation, protocol integration, cryptographic management modernization, SLH-DSA, and stateful hash signatures.',
    quizCategories: [
      'pqc-fundamentals',
      'dev-quantum-impact',
      'quantum-threats',
      'entropy-randomness',
      'tls-basics',
      'protocol-integration',
      'vpn-ssh-pqc',
      'mls-group-messaging',
      'web-gateway-pqc',
      'pqc-testing-validation',
      'hybrid-crypto',
      'crypto-agility',
      'pki-infrastructure',
      'crypto-dev-apis',
      'crypto-mgmt-modernization',
      'sbom',
      'cbom',
      'crypto-registry',
      'merkle-tree-certs',
      'slh-dsa',
      'stateful-signatures',
      'crypto-operations',
      'email-signing',
      'code-signing',
      'api-security-jwt',
      'iam-pqc',
      'database-encryption-pqc',
      'secrets-management-pqc',
      'os-pqc',
      'iot-ot-pqc',
      'confidential-computing',
      'ai-security-pqc',
      'platform-eng-pqc',
    ],
  },
  architect: {
    id: 'architect',
    label: 'Security Architect',
    subtitle: 'Architecture & infrastructure focus',
    icon: 'ShieldCheck',
    description:
      'Design crypto-agile architectures, plan key management, and evaluate algorithm trade-offs.',
    recommendedPath: [
      'pqc-101',
      'arch-quantum-impact',
      'quantum-threats',
      'entropy-randomness',
      'pqc-candidates',
      'crypto-agility',
      'crypto-mgmt-modernization',
      'sbom',
      'cbom',
      'crypto-registry',
      'hybrid-crypto',
      'qkd',
      'tls-basics',
      'network-security-pqc',
      'mls-group-messaging',
      '5g-security',
      'pqc-testing-validation',
      'kms-pqc',
      'hsm-pqc',
      'secrets-management-pqc',
      'database-encryption-pqc',
      'os-pqc',
      'secure-boot-pqc',
      'confidential-computing',
      'platform-eng-pqc',
      'stateful-signatures',
      'slh-dsa',
      'pki-workshop',
      'pki-enrollment-protocols',
      'merkle-tree-certs',
      'email-signing',
      'digital-id',
      'trust-services-pqc',
      'iam-pqc',
      'api-security-jwt',
      'code-signing',
      'iot-ot-pqc',
      'quiz',
    ],
    pathItems: [
      { type: 'module', moduleId: 'pqc-101' },
      { type: 'module', moduleId: 'arch-quantum-impact' },
      { type: 'module', moduleId: 'quantum-threats' },
      { type: 'module', moduleId: 'entropy-randomness' },
      { type: 'module', moduleId: 'pqc-candidates' },
      {
        type: 'checkpoint',
        id: 'arch-cp-1',
        label: 'Foundations',
        categories: [
          'pqc-fundamentals',
          'arch-quantum-impact',
          'quantum-threats',
          'algorithm-families',
          'entropy-randomness',
        ],
      },
      { type: 'module', moduleId: 'crypto-agility' },
      { type: 'module', moduleId: 'crypto-mgmt-modernization' },
      { type: 'module', moduleId: 'sbom' },
      { type: 'module', moduleId: 'cbom' },
      { type: 'module', moduleId: 'crypto-registry' },
      { type: 'module', moduleId: 'hybrid-crypto' },
      { type: 'module', moduleId: 'qkd' },
      {
        type: 'checkpoint',
        id: 'arch-cp-2',
        label: 'Architecture Strategy',
        categories: [
          'crypto-agility',
          'crypto-mgmt-modernization',
          'sbom',
          'cbom',
          'crypto-registry',
          'hybrid-crypto',
          'qkd',
          'nist-standards',
        ],
      },
      { type: 'module', moduleId: 'tls-basics' },
      { type: 'module', moduleId: 'network-security-pqc' },
      { type: 'module', moduleId: 'mls-group-messaging' },
      { type: 'module', moduleId: '5g-security' },
      { type: 'module', moduleId: 'pqc-testing-validation' },
      { type: 'module', moduleId: 'kms-pqc' },
      { type: 'module', moduleId: 'hsm-pqc' },
      { type: 'module', moduleId: 'secrets-management-pqc' },
      {
        type: 'checkpoint',
        id: 'arch-cp-3a',
        label: 'Network & Key Infrastructure',
        categories: [
          'tls-basics',
          'network-security-pqc',
          'mls-group-messaging',
          'pqc-testing-validation',
          'kms-pqc',
          'hsm-pqc',
          'secrets-management-pqc',
        ],
      },
      { type: 'module', moduleId: 'database-encryption-pqc' },
      { type: 'module', moduleId: 'os-pqc' },
      { type: 'module', moduleId: 'secure-boot-pqc' },
      { type: 'module', moduleId: 'confidential-computing' },
      { type: 'module', moduleId: 'platform-eng-pqc' },
      { type: 'module', moduleId: 'stateful-signatures' },
      { type: 'module', moduleId: 'slh-dsa' },
      { type: 'module', moduleId: 'pki-workshop' },
      { type: 'module', moduleId: 'pki-enrollment-protocols' },
      { type: 'module', moduleId: 'merkle-tree-certs' },
      {
        type: 'checkpoint',
        id: 'arch-cp-3b',
        label: 'Systems & PKI',
        categories: [
          'database-encryption-pqc',
          'os-pqc',
          'secure-boot-pqc',
          'confidential-computing',
          'stateful-signatures',
          'slh-dsa',
          'pki-infrastructure',
          'merkle-tree-certs',
        ],
      },
      { type: 'module', moduleId: 'email-signing' },
      { type: 'module', moduleId: 'digital-id' },
      { type: 'module', moduleId: 'trust-services-pqc' },
      { type: 'module', moduleId: 'iam-pqc' },
      {
        type: 'checkpoint',
        id: 'arch-cp-4',
        label: 'Identity & Credentials',
        categories: ['email-signing', 'digital-id', 'iam-pqc'],
      },
      { type: 'module', moduleId: 'api-security-jwt' },
      { type: 'module', moduleId: 'code-signing' },
      { type: 'module', moduleId: 'iot-ot-pqc' },
      {
        type: 'checkpoint',
        id: 'arch-cp-5',
        label: 'API, Supply Chain & IoT',
        categories: ['api-security-jwt', 'code-signing', 'iot-ot-pqc'],
      },
      { type: 'module', moduleId: 'quiz' },
    ],
    estimatedMinutes: 1985,
    essentials: [
      'pqc-101',
      'arch-quantum-impact',
      'pqc-candidates',
      'crypto-agility',
      'crypto-mgmt-modernization',
      'hybrid-crypto',
      'kms-pqc',
      'hsm-pqc',
      'pki-workshop',
    ],
    essentialsMinutes: 380,
    quizDescription:
      'Test your knowledge on cryptographic foundations, architecture strategy (crypto agility, crypto management modernization, hybrid crypto, QKD), infrastructure protocols (TLS, network security, MLS group messaging, KMS, HSMs, stateful signatures, SLH-DSA, PKI, Merkle tree certs), PQC testing & validation, identity and credentials, API security, code signing, and IoT/OT security.',
    quizCategories: [
      'pqc-fundamentals',
      'arch-quantum-impact',
      'quantum-threats',
      'entropy-randomness',
      'crypto-agility',
      'crypto-mgmt-modernization',
      'sbom',
      'cbom',
      'crypto-registry',
      'hybrid-crypto',
      'qkd',
      'algorithm-families',
      'nist-standards',
      'tls-basics',
      'network-security-pqc',
      'mls-group-messaging',
      'pqc-testing-validation',
      'kms-pqc',
      'hsm-pqc',
      'secrets-management-pqc',
      'database-encryption-pqc',
      'os-pqc',
      'secure-boot-pqc',
      'confidential-computing',
      'stateful-signatures',
      'slh-dsa',
      'pki-infrastructure',
      'merkle-tree-certs',
      'email-signing',
      'digital-id',
      'iam-pqc',
      'migration-planning',
      'api-security-jwt',
      'code-signing',
      'iot-ot-pqc',
    ],
  },
  researcher: {
    id: 'researcher',
    label: 'Researcher / Academic',
    subtitle: 'Comprehensive deep dive',
    icon: 'GraduationCap',
    description:
      'Explore every module in depth — algorithms, protocols, infrastructure, and real-world applications.',
    recommendedPath: [
      'pqc-101',
      'research-quantum-impact',
      'quantum-threats',
      'entropy-randomness',
      'pqc-candidates',
      'hybrid-crypto',
      'crypto-agility',
      'crypto-mgmt-modernization',
      'data-asset-sensitivity',
      'standards-bodies',
      'qkd',
      'tls-basics',
      'vpn-ssh-pqc',
      'mls-group-messaging',
      'email-signing',
      'api-security-jwt',
      'web-gateway-pqc',
      'network-security-pqc',
      'pqc-testing-validation',
      'pki-workshop',
      'pki-enrollment-protocols',
      'kms-pqc',
      'hsm-pqc',
      'secrets-management-pqc',
      'database-encryption-pqc',
      'os-pqc',
      'secure-boot-pqc',
      'stateful-signatures',
      'slh-dsa',
      'merkle-tree-certs',
      'confidential-computing',
      'crypto-dev-apis',
      'digital-id',
      'iam-pqc',
      'code-signing',
      'platform-eng-pqc',
      'iot-ot-pqc',
      'ai-security-pqc',
      'digital-assets',
      'emv-payment-pqc',
      'energy-utilities-pqc',
      'healthcare-pqc',
      'automotive-pqc',
      'aerospace-pqc',
      'government-defense-pqc',
      'pqc-risk-management',
      'pqc-business-case',
      'pqc-governance',
      'vendor-risk',
      'migration-program',
      'compliance-strategy',
      'quiz',
    ],
    pathItems: [
      { type: 'module', moduleId: 'pqc-101' },
      { type: 'module', moduleId: 'research-quantum-impact' },
      { type: 'module', moduleId: 'quantum-threats' },
      { type: 'module', moduleId: 'entropy-randomness' },
      { type: 'module', moduleId: 'pqc-candidates' },
      {
        type: 'checkpoint',
        id: 'res-cp-1',
        label: 'Foundations',
        categories: [
          'pqc-fundamentals',
          'research-quantum-impact',
          'quantum-threats',
          'entropy-randomness',
        ],
      },
      { type: 'module', moduleId: 'hybrid-crypto' },
      { type: 'module', moduleId: 'crypto-agility' },
      { type: 'module', moduleId: 'crypto-mgmt-modernization' },
      { type: 'module', moduleId: 'data-asset-sensitivity' },
      { type: 'module', moduleId: 'standards-bodies' },
      { type: 'module', moduleId: 'qkd' },
      {
        type: 'checkpoint',
        id: 'res-cp-2',
        label: 'Strategy',
        categories: [
          'hybrid-crypto',
          'crypto-agility',
          'crypto-mgmt-modernization',
          'data-asset-sensitivity',
          'standards-bodies',
          'qkd',
          'algorithm-families',
          'nist-standards',
          'compliance',
        ],
      },
      { type: 'module', moduleId: 'tls-basics' },
      { type: 'module', moduleId: 'vpn-ssh-pqc' },
      { type: 'module', moduleId: 'mls-group-messaging' },
      { type: 'module', moduleId: 'email-signing' },
      { type: 'module', moduleId: 'api-security-jwt' },
      { type: 'module', moduleId: 'web-gateway-pqc' },
      { type: 'module', moduleId: 'network-security-pqc' },
      { type: 'module', moduleId: 'pqc-testing-validation' },
      {
        type: 'checkpoint',
        id: 'res-cp-3',
        label: 'Protocols',
        categories: [
          'tls-basics',
          'protocol-integration',
          'vpn-ssh-pqc',
          'mls-group-messaging',
          'email-signing',
          'api-security-jwt',
          'web-gateway-pqc',
          'network-security-pqc',
          'pqc-testing-validation',
        ],
      },
      { type: 'module', moduleId: 'pki-workshop' },
      { type: 'module', moduleId: 'pki-enrollment-protocols' },
      { type: 'module', moduleId: 'kms-pqc' },
      { type: 'module', moduleId: 'hsm-pqc' },
      { type: 'module', moduleId: 'secrets-management-pqc' },
      { type: 'module', moduleId: 'database-encryption-pqc' },
      { type: 'module', moduleId: 'os-pqc' },
      { type: 'module', moduleId: 'secure-boot-pqc' },
      { type: 'module', moduleId: 'stateful-signatures' },
      { type: 'module', moduleId: 'slh-dsa' },
      { type: 'module', moduleId: 'merkle-tree-certs' },
      { type: 'module', moduleId: 'confidential-computing' },
      { type: 'module', moduleId: 'crypto-dev-apis' },
      {
        type: 'checkpoint',
        id: 'res-cp-4',
        label: 'Infrastructure',
        categories: [
          'pki-infrastructure',
          'kms-pqc',
          'hsm-pqc',
          'secrets-management-pqc',
          'database-encryption-pqc',
          'os-pqc',
          'secure-boot-pqc',
          'stateful-signatures',
          'slh-dsa',
          'merkle-tree-certs',
          'confidential-computing',
          'crypto-dev-apis',
        ],
      },
      { type: 'module', moduleId: 'digital-id' },
      { type: 'module', moduleId: 'iam-pqc' },
      { type: 'module', moduleId: 'code-signing' },
      { type: 'module', moduleId: 'platform-eng-pqc' },
      { type: 'module', moduleId: 'iot-ot-pqc' },
      { type: 'module', moduleId: 'ai-security-pqc' },
      {
        type: 'checkpoint',
        id: 'res-cp-5',
        label: 'Applications',
        categories: [
          'digital-id',
          'iam-pqc',
          'code-signing',
          'platform-eng-pqc',
          'iot-ot-pqc',
          'ai-security-pqc',
        ],
      },
      { type: 'module', moduleId: 'digital-assets' },
      { type: 'module', moduleId: 'emv-payment-pqc' },
      { type: 'module', moduleId: 'energy-utilities-pqc' },
      { type: 'module', moduleId: 'healthcare-pqc' },
      { type: 'module', moduleId: 'automotive-pqc' },
      { type: 'module', moduleId: 'aerospace-pqc' },
      { type: 'module', moduleId: 'government-defense-pqc' },
      {
        type: 'checkpoint',
        id: 'res-cp-6',
        label: 'Industries',
        categories: [
          'digital-assets',
          'emv-payment-pqc',
          'energy-utilities-pqc',
          'healthcare-pqc',
          'automotive-pqc',
          'aerospace-pqc',
          'industry-threats',
        ],
      },
      { type: 'module', moduleId: 'pqc-risk-management' },
      { type: 'module', moduleId: 'pqc-business-case' },
      { type: 'module', moduleId: 'pqc-governance' },
      { type: 'module', moduleId: 'vendor-risk' },
      { type: 'module', moduleId: 'migration-program' },
      { type: 'module', moduleId: 'compliance-strategy' },
      {
        type: 'checkpoint',
        id: 'res-cp-7',
        label: 'Executive Strategy',
        categories: [
          'pqc-risk-management',
          'pqc-business-case',
          'pqc-governance',
          'vendor-risk',
          'migration-program',
          'compliance-strategy',
        ],
      },
      { type: 'module', moduleId: 'quiz' },
    ],
    // Corrected 2026-09-01: this is the sum of researcher's OWN recommendedPath
    // (51 modules + quiz below), not a whole-catalogue sum — the previous
    // comment's claim was wrong (the persona test only sums a persona's own
    // path). The true current whole-catalogue sum is ~3285 min (excl. quiz);
    // researcher's path omits 13 real modules not part of its curriculum.
    estimatedMinutes: 2805,
    essentials: [
      'pqc-101',
      'research-quantum-impact',
      'pqc-candidates',
      'entropy-randomness',
      'hybrid-crypto',
      'crypto-agility',
      'standards-bodies',
      'tls-basics',
      'pki-workshop',
    ],
    essentialsMinutes: 325,
    quizDescription:
      'Full assessment across all PQC categories — algorithms, protocols, standards, compliance, industries, and applications.',
    quizCategories: [], // empty = all categories shown (full coverage for researcher)
  },
  ops: {
    id: 'ops',
    label: 'IT Ops / DevOps',
    subtitle: 'Deploy & operate focus',
    icon: 'Server',
    description:
      'Deploy PQC across production infrastructure — certificate rollouts, key lifecycle management, TLS configurations, and system-wide crypto inventory.',
    recommendedPath: [
      'pqc-101',
      'ops-quantum-impact',
      'quantum-threats',
      'tls-basics',
      'vpn-ssh-pqc',
      'hybrid-crypto',
      'web-gateway-pqc',
      'network-security-pqc',
      'pqc-testing-validation',
      'pki-workshop',
      'pki-enrollment-protocols',
      'iam-pqc',
      'trust-services-pqc',
      'kms-pqc',
      'hsm-pqc',
      'stateful-signatures',
      'secrets-management-pqc',
      'database-encryption-pqc',
      'os-pqc',
      'secure-boot-pqc',
      'confidential-computing',
      'standards-bodies',
      'crypto-agility',
      'migration-program',
      'crypto-mgmt-modernization',
      'sbom',
      'cbom',
      'crypto-registry',
      'vendor-risk',
      'verification-closure',
      'soc-implementation-pqc',
      'platform-eng-pqc',
      'iot-ot-pqc',
      'energy-utilities-pqc',
      'ai-security-pqc',
      'aerospace-pqc',
      'quiz',
    ],
    pathItems: [
      { type: 'module', moduleId: 'pqc-101' },
      { type: 'module', moduleId: 'ops-quantum-impact' },
      { type: 'module', moduleId: 'quantum-threats' },
      {
        type: 'checkpoint',
        id: 'ops-cp-1',
        label: 'Foundations',
        categories: ['pqc-fundamentals', 'ops-quantum-impact', 'quantum-threats'],
      },
      { type: 'module', moduleId: 'tls-basics' },
      { type: 'module', moduleId: 'vpn-ssh-pqc' },
      { type: 'module', moduleId: 'hybrid-crypto' },
      { type: 'module', moduleId: 'web-gateway-pqc' },
      { type: 'module', moduleId: 'network-security-pqc' },
      { type: 'module', moduleId: 'pqc-testing-validation' },
      { type: 'module', moduleId: 'pki-workshop' },
      { type: 'module', moduleId: 'pki-enrollment-protocols' },
      { type: 'module', moduleId: 'iam-pqc' },
      { type: 'module', moduleId: 'trust-services-pqc' },
      {
        type: 'checkpoint',
        id: 'ops-cp-2',
        label: 'Protocol & Identity Operations',
        categories: [
          'tls-basics',
          'vpn-ssh-pqc',
          'hybrid-crypto',
          'web-gateway-pqc',
          'network-security-pqc',
          'pqc-testing-validation',
          'pki-infrastructure',
          'iam-pqc',
          'protocol-integration',
        ],
      },
      { type: 'module', moduleId: 'kms-pqc' },
      { type: 'module', moduleId: 'hsm-pqc' },
      { type: 'module', moduleId: 'stateful-signatures' },
      { type: 'module', moduleId: 'secrets-management-pqc' },
      { type: 'module', moduleId: 'database-encryption-pqc' },
      { type: 'module', moduleId: 'os-pqc' },
      { type: 'module', moduleId: 'secure-boot-pqc' },
      { type: 'module', moduleId: 'confidential-computing' },
      {
        type: 'checkpoint',
        id: 'ops-cp-3',
        label: 'System Infrastructure',
        categories: [
          'kms-pqc',
          'hsm-pqc',
          'stateful-signatures',
          'secrets-management-pqc',
          'database-encryption-pqc',
          'os-pqc',
          'secure-boot-pqc',
        ],
      },
      { type: 'module', moduleId: 'standards-bodies' },
      { type: 'module', moduleId: 'crypto-agility' },
      { type: 'module', moduleId: 'migration-program' },
      { type: 'module', moduleId: 'crypto-mgmt-modernization' },
      { type: 'module', moduleId: 'sbom' },
      { type: 'module', moduleId: 'cbom' },
      { type: 'module', moduleId: 'crypto-registry' },
      { type: 'module', moduleId: 'vendor-risk' },
      { type: 'module', moduleId: 'verification-closure' },
      { type: 'module', moduleId: 'soc-implementation-pqc' },
      { type: 'module', moduleId: 'platform-eng-pqc' },
      {
        type: 'checkpoint',
        id: 'ops-cp-4a',
        label: 'Migration Strategy',
        categories: [
          'standards-bodies',
          'crypto-agility',
          'migration-program',
          'crypto-mgmt-modernization',
          'migration-planning',
          'sbom',
          'cbom',
          'crypto-registry',
          'verification-closure',
          'soc-implementation-pqc',
          'platform-eng-pqc',
        ],
      },
      { type: 'module', moduleId: 'iot-ot-pqc' },
      { type: 'module', moduleId: 'energy-utilities-pqc' },
      { type: 'module', moduleId: 'ai-security-pqc' },
      { type: 'module', moduleId: 'aerospace-pqc' },
      {
        type: 'checkpoint',
        id: 'ops-cp-4b',
        label: 'Fleet & Industry',
        categories: ['iot-ot-pqc', 'energy-utilities-pqc', 'ai-security-pqc', 'aerospace-pqc'],
      },
      { type: 'module', moduleId: 'quiz' },
    ],
    estimatedMinutes: 1915,
    essentials: [
      'pqc-101',
      'ops-quantum-impact',
      'tls-basics',
      'vpn-ssh-pqc',
      'pki-workshop',
      'crypto-agility',
      'migration-program',
      'kms-pqc',
      'hsm-pqc',
    ],
    essentialsMinutes: 360,
    quizDescription:
      'Test your knowledge on TLS operations, VPN/SSH, hybrid cryptography, web gateways, PQC testing & validation, PKI certificate management, KMS and HSM operations, stateful hash signatures, crypto management modernization, standards bodies, energy/utilities, and infrastructure migration planning.',
    quizCategories: [
      'pqc-fundamentals',
      'ops-quantum-impact',
      'quantum-threats',
      'tls-basics',
      'vpn-ssh-pqc',
      'hybrid-crypto',
      'web-gateway-pqc',
      'pqc-testing-validation',
      'pki-infrastructure',
      'protocol-integration',
      'kms-pqc',
      'hsm-pqc',
      'stateful-signatures',
      'secrets-management-pqc',
      'database-encryption-pqc',
      'os-pqc',
      'secure-boot-pqc',
      'network-security-pqc',
      'iam-pqc',
      'standards-bodies',
      'crypto-agility',
      'migration-program',
      'crypto-mgmt-modernization',
      'migration-planning',
      'sbom',
      'cbom',
      'crypto-registry',
      'verification-closure',
      'soc-implementation-pqc',
      'iot-ot-pqc',
      'energy-utilities-pqc',
      'aerospace-pqc',
      'ai-security-pqc',
      'platform-eng-pqc',
    ],
  },
  curious: {
    id: 'curious',
    label: 'Curious Explorer',
    subtitle: 'New to cryptography & quantum computing',
    icon: 'Lightbulb',
    description:
      'Start from zero — understand what quantum computing means for everyday security, why it matters, and what the world is doing about it. Sample every area from protocols to industries. No technical background required.',
    recommendedPath: [
      'pqc-101',
      'pqc-candidates',
      'quantum-threats',
      'entropy-randomness',
      'pqc-risk-management',
      'data-asset-sensitivity',
      'kms-pqc',
      'healthcare-pqc',
      'compliance-strategy',
      'standards-bodies',
      'crypto-agility',
      'migration-program',
      'tls-basics',
      'email-signing',
      'database-encryption-pqc',
      'iam-pqc',
      'digital-assets',
      'digital-id',
      'quiz',
    ],
    pathItems: [
      // Phase 1: Understanding the Threat (Foundations)
      { type: 'module', moduleId: 'pqc-101' },
      { type: 'module', moduleId: 'pqc-candidates' },
      { type: 'module', moduleId: 'quantum-threats' },
      { type: 'module', moduleId: 'entropy-randomness' },
      {
        type: 'checkpoint',
        id: 'curious-cp-1',
        label: 'Understanding the Threat',
        categories: ['pqc-fundamentals', 'pqc-candidates', 'quantum-threats', 'entropy-randomness'],
      },
      // Phase 2: Why It Matters (Risk + Industry exposure)
      { type: 'module', moduleId: 'pqc-risk-management' },
      { type: 'module', moduleId: 'data-asset-sensitivity' },
      { type: 'module', moduleId: 'kms-pqc' },
      { type: 'module', moduleId: 'healthcare-pqc' },
      {
        type: 'checkpoint',
        id: 'curious-cp-2',
        label: 'Why It Matters',
        categories: [
          'pqc-risk-management',
          'data-asset-sensitivity',
          'kms-pqc',
          'healthcare-pqc',
          'industry-threats',
        ],
      },
      // Phase 3: What the World Is Doing (Strategy + Compliance)
      { type: 'module', moduleId: 'compliance-strategy' },
      { type: 'module', moduleId: 'standards-bodies' },
      { type: 'module', moduleId: 'crypto-agility' },
      { type: 'module', moduleId: 'migration-program' },
      {
        type: 'checkpoint',
        id: 'curious-cp-3',
        label: 'What the World Is Doing',
        categories: [
          'compliance-strategy',
          'standards-bodies',
          'crypto-agility',
          'migration-program',
        ],
      },
      // Phase 4: Practical Foundations (Protocols + Applications + Industries)
      { type: 'module', moduleId: 'tls-basics' },
      { type: 'module', moduleId: 'email-signing' },
      { type: 'module', moduleId: 'database-encryption-pqc' },
      { type: 'module', moduleId: 'iam-pqc' },
      { type: 'module', moduleId: 'digital-assets' },
      { type: 'module', moduleId: 'digital-id' },
      {
        type: 'checkpoint',
        id: 'curious-cp-4',
        label: 'Practical Foundations',
        categories: [
          'tls-basics',
          'email-signing',
          'database-encryption-pqc',
          'iam-pqc',
          'digital-assets',
          'digital-id',
        ],
      },
      { type: 'module', moduleId: 'quiz' },
    ],
    estimatedMinutes: 815,
    essentials: [
      'pqc-101',
      'pqc-candidates',
      'quantum-threats',
      'pqc-risk-management',
      'compliance-strategy',
      'tls-basics',
    ],
    essentialsMinutes: 205,
    quizDescription:
      'Test your understanding of quantum threats, PQC algorithm families, risk basics, compliance timelines, migration concepts, practical security foundations, and real-world digital identity applications.',
    quizCategories: [
      'pqc-fundamentals',
      'pqc-candidates',
      'quantum-threats',
      'entropy-randomness',
      'pqc-risk-management',
      'data-asset-sensitivity',
      'kms-pqc',
      'healthcare-pqc',
      'compliance-strategy',
      'standards-bodies',
      'crypto-agility',
      'migration-program',
      'tls-basics',
      'email-signing',
      'database-encryption-pqc',
      'iam-pqc',
      'digital-assets',
      'digital-id',
    ],
  },
}

/**
 * Infer a persona suggestion from a completed assessment.
 * Returns null if the assessment isn't complete or there's not enough signal.
 */
export function inferPersonaFromAssessment(assessment: {
  assessmentStatus: 'not-started' | 'in-progress' | 'complete'
  teamSize: string
  migrationStatus: string
  cryptoAgility: string
  currentCrypto?: string[]
  complianceRequirements?: string[]
  cryptoUseCases?: string[]
  infrastructure?: string[]
}): PersonaId | null {
  if (assessment.assessmentStatus !== 'complete') return null

  const cryptoCount = assessment.currentCrypto?.length ?? 0
  const complianceCount = assessment.complianceRequirements?.length ?? 0
  const useCaseCount = assessment.cryptoUseCases?.length ?? 0
  const infraCount = assessment.infrastructure?.length ?? 0

  // Researcher: comprehensive breadth across many assessment dimensions
  // (selected many algorithms, many compliance frameworks, many use cases)
  if (cryptoCount >= 5 && complianceCount >= 4 && useCaseCount >= 4) {
    return 'researcher'
  }

  // Executive: early-stage migration, focus on risk/compliance rather than implementation
  if (
    (assessment.migrationStatus === 'not-started' || assessment.migrationStatus === '') &&
    assessment.cryptoAgility !== 'fully-abstracted' &&
    infraCount <= 2
  ) {
    return 'executive'
  }

  // Developer: hands-on implementer actively doing the migration. Checked BEFORE the
  // infra-count-driven ops/architect branches so a small, hands-on team on an
  // infra-heavy stack (infraCount >= 3) — or with a partially-abstracted crypto layer —
  // is not misrouted to ops/architect. `teamSize` is the IC-vs-org-scale discriminator
  // (previously part of the signature but never read); '1-10' skews to hands-on ICs who
  // write and deploy the code themselves. Larger teams keep their ops/architect routing
  // below. `fully-abstracted` is excluded here because it is the strongest architect
  // (design-first) signal.
  if (
    (assessment.migrationStatus === 'started' || assessment.migrationStatus === 'planning') &&
    assessment.teamSize === '1-10' &&
    assessment.cryptoAgility !== 'fully-abstracted'
  ) {
    return 'developer'
  }

  // Ops: deep infrastructure involvement + actively migrating + hands-on (not fully abstracted)
  if (
    infraCount >= 3 &&
    (assessment.migrationStatus === 'started' || assessment.migrationStatus === 'planning') &&
    assessment.cryptoAgility !== 'fully-abstracted'
  ) {
    return 'ops'
  }

  // Architect: deep infrastructure involvement or crypto-agile design focus
  if (
    assessment.cryptoAgility === 'fully-abstracted' ||
    assessment.cryptoAgility === 'partially-abstracted' ||
    infraCount >= 3
  ) {
    return 'architect'
  }

  // Developer: actively migrating or planning, implementation-focused
  if (assessment.migrationStatus === 'started' || assessment.migrationStatus === 'planning') {
    return 'developer'
  }

  // 'curious' is intentionally never inferred — it is a self-selected entry point for
  // users who want to explore without a declared role. Any user who completed the
  // assessment has expressed enough intent to map to a functional persona instead.
  return null
}

/**
 * Maps the modules that appear in any persona's `essentials` to their quiz category.
 * Most module IDs are their own category, but a few differ (e.g. pki-workshop →
 * pki-infrastructure). Only the essentials union needs coverage here.
 */
const ESSENTIALS_MODULE_QUIZ_CATEGORY: Record<string, string> = {
  'pqc-101': 'pqc-fundamentals',
  'pqc-candidates': 'pqc-fundamentals',
  'quantum-threats': 'quantum-threats',
  'entropy-randomness': 'entropy-randomness',
  'dev-quantum-impact': 'dev-quantum-impact',
  'arch-quantum-impact': 'arch-quantum-impact',
  'ops-quantum-impact': 'ops-quantum-impact',
  'research-quantum-impact': 'research-quantum-impact',
  'exec-quantum-impact': 'exec-quantum-impact',
  'tls-basics': 'tls-basics',
  'vpn-ssh-pqc': 'vpn-ssh-pqc',
  'hybrid-crypto': 'hybrid-crypto',
  'crypto-agility': 'crypto-agility',
  'crypto-mgmt-modernization': 'crypto-mgmt-modernization',
  'standards-bodies': 'standards-bodies',
  'pki-workshop': 'pki-infrastructure',
  'kms-pqc': 'kms-pqc',
  'hsm-pqc': 'hsm-pqc',
  'migration-program': 'migration-program',
  'crypto-dev-apis': 'crypto-dev-apis',
  'pqc-risk-management': 'pqc-risk-management',
  'pqc-business-case': 'pqc-business-case',
  'pqc-governance': 'pqc-governance',
  'compliance-strategy': 'compliance-strategy',
}

/**
 * Quiz categories that cover a persona's Essentials — used to scope the capstone quiz
 * so an Essentials-only learner is tested only on what they studied. Intentionally
 * under-inclusive: a category is included only if it maps from an essential AND is in
 * the persona's own `quizCategories` (an empty `quizCategories`, as researcher uses,
 * means "all categories", so no filter is applied). Missing a category just yields
 * fewer questions; it can never surface questions on unstudied modules.
 */
export function essentialsQuizCategories(personaId: PersonaId): string[] {
  const persona = PERSONAS[personaId]
  const allowAll = persona.quizCategories.length === 0
  const allowed = new Set(persona.quizCategories)
  const cats = new Set<string>()
  for (const moduleId of persona.essentials) {
    const cat = ESSENTIALS_MODULE_QUIZ_CATEGORY[moduleId]
    if (cat && (allowAll || allowed.has(cat))) cats.add(cat)
  }
  return [...cats]
}
