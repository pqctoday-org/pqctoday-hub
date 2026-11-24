// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Structured content for the AICryptoAttacks module (LM-087).
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'ai-crypto-attacks',
  version: '1.0.0',
  // lastReviewed is left unset until the module review record is written.
  lastEdited: '2026-11-24',

  standards: [
    getStandard('Discovering-cryptographic-weaknesses-with-Claude'),
    getStandard('CVE-2026-5194'),
    getStandard('Cloud-Threat-Horizons-Report-H1-2026'),
    getStandard('SCA-2023-Masked-Kyber-DL'),
    getStandard('Binance-Security-Incident-Update-and-Initial-Findings-Report'),
    getStandard('Project-Glasswing-An-initial-update'),
    getStandard('CVE-2026-45445'),
    getStandard('Do-Users-Write-More-Insecure-Code-with-AI-Assistants'),
    getStandard('Evaluating-Large-Language-Models-for-Code-Review'),
    getStandard('Attacking-and-Fixing-PKCS-11-Security-Tokens'),
    getStandard('Salsa-Picante-A-Machine-Learning-Attack-on-LWE-with-Binary-S'),
    getStandard('SALSA-VERDE-a-machine-learning-attack-on-LWE-with-sparse-sma'),
    getStandard('NIST IR 8547'),
    getStandard('NSA CNSA 2.0'),
    getStandard('NSA CNSA 2.0 FAQ'),
    getStandard('FIPS 203'),
    getStandard('FIPS 204'),
    getStandard('FIPS 205'),
    getStandard('ref-gidney-factor-rsa'),
    getStandard('2025-Identity-Threat-Landscape-Report-Inside-the-Infostealer'),
    getStandard('Adversarial-Misuse-of-Generative-AI-Google-Cloud-Blog'),
    getStandard('GTIG-AI-Threat-Tracker-Agentic-Threat-Activity-Crosses-a-Sig'),
    getStandard('IOCTA-2026-The-evolving-threat-landscape-how-encryption-prox'),
    getStandard('FBI-IC3-PSA241203-Criminals-Use-Generative-Artificial-Intell'),
    getStandard('North-Korea-Responsible-for-6-Billion-Binance-Attack-FBI'),
    getStandard('Asleep-at-the-Keyboard-Assessing-the-Security-of-GitHub-Copi'),
    getStandard('wolfSSL-Guidance-for-FIPS-Customers-Auditing-Direct-Calls-to'),
    getStandard('From-Naptime-to-Big-Sleep-Using-Large-Language-Models-To-Cat'),
    getStandard('DARPA-AI-Cyber-Challenge-AIxCC-Final-Competition-Winners'),
    getStandard('Leveling-Up-Fuzzing-Finding-more-vulnerabilities-with-AI'),
    getStandard('Chosen-Ciphertext-Attacks-Against-Protocols-Based-on-the-RSA'),
    getStandard('SCA-2017-AES-CNN-Jitter'),
    getStandard('Template-and-CPA-Side-Channel-Attacks-on-the-Kyber-ML-KEM-Pa'),
    getStandard('PROACT-2025-SCA-Lattice-PQC'),
    getStandard('NIST-SP-800-140F'),
    getStandard('NIST-FIPS140-3-IG-PQC'),
    getStandard('ISO-IEC-19790-2025'),
    getStandard('Non-Profiled-Deep-Learning-based-Side-Channel-attacks-with-S'),
    getStandard('On-the-Security-of-PKCS-11'),
    getStandard('PKCS11-V32-OS-OASIS'),
    getStandard('About-keys-Azure-Key-Vault-Managed-HSM'),
    getStandard('Tutorial-Configure-and-Query-HSM-Operation-Audit-Logs-for-Az'),
    getStandard('Efficient-Padding-Oracle-Attacks-on-Cryptographic-Hardware'),
    getStandard('HAWK-n-Key-Recovery-Reduces-to-SVP-in-Dimension-n-2-1'),
    getStandard('Why-Mythos-Finding-a-Flaw-in-HAWK-is-Good-for-PQC-Entrust'),
    getStandard('Hawk-A-fast-compact-and-floating-point-free-post-quantum-sig'),
    getStandard('Improving-Attacks-on-Round-Reduced-Speck32-64-using-Deep-Lea'),
    getStandard('SALSA-2022-Lattice-Transformer'),
    getStandard('Benchmarking-Attacks-on-Learning-with-Errors'),
    getStandard('FPLLL'),
    getStandard('Regev-LWE-Survey'),
    getStandard('SALSA-FRESCA-Angular-Embeddings-and-Pre-Training-for-ML-Atta'),
    getStandard('Push-protection-GitHub-Docs'),
    getStandard('Secrets-Management-OWASP-Cheat-Sheet-Series'),
    getStandard('SP-1800-44-Secure-Software-Development-Security-and-Operatio'),
    getStandard('libcrux-The-formally-verified-crypto-library-for-Rust'),
    getStandard('Verifying-Libcrux-s-ML-KEM'),
  ],

  algorithms: [
    getAlgorithm('ML-KEM-768'),
    getAlgorithm('ML-DSA-65'),
    getAlgorithm('SLH-DSA-SHA2-128s'),
    getAlgorithm('ECDSA P-256'),
    getAlgorithm('RSA-2048'),
  ],

  // Migration schedule baselines (NIST IR 8547 and NSA CNSA 2.0).
  deadlines: [
    {
      year: 2027,
      label: 'NSA CNSA 2.0 FAQ Ver. 2.2 new deployments expectation (Jan 1, 2027)',
      source: 'NSA CNSA 2.0 FAQ',
    },
    {
      year: 2030,
      label: 'NIST IR 8547 deprecation of classical public-key algorithms (after 2030)',
      source: 'NIST IR 8547',
    },
    {
      year: 2035,
      label: 'NIST IR 8547 disallowance & CNSA 2.0 NSS completion',
      source: 'NSA CNSA 2.0',
    },
  ],

  narratives: {
    overview:
      'Foundations threat-model module examining how AI changes risk across five cryptographic layers: keys and secrets in software, implementation and protocol flaw discovery, deep-learning side-channel attacks, KMS/HSM key policies, and mathematical cryptanalysis. Every claim is classified under a structured capability rubric as demonstrated, reported, or hypothesised with an explicit as-of date (2026-11-21).',
    keyConcepts:
      'Published AI results have weakened an unstandardised candidate (HAWK, withdrawn 29 Jul 2026), improved a 7-of-10-round AES-128 meet-in-the-middle attack (2^105 chosen plaintexts, 200-800x faster), trained neural distinguishers on round-reduced Speck32/64, and attacked plain LWE with small or sparse secrets (SALSA family). None of these results break standardised FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), FIPS 205 (SLH-DSA), or full-round AES. Operational risk today centres on leaked credentials, AI-assisted vulnerability discovery in cryptographic libraries (such as wolfSSL CVE-2026-5194 in PQC-enabled builds and OpenSSL CVE-2026-45445), and deep-learning side-channel evaluation limits.',
    workshopSummary:
      'Five toy-data-only interactive labs: Secret Hunt (pattern matching vs missed secret leaks in sample repo files), Key-Policy Review (evaluating PKCS #11 and cloud KMS templates without emitting call sequences or keys), Synthetic Trace Learning Lab (comparing template vs learned classifiers under jitter and masking on synthetic in-page waves), Claim & Rubric Sorter (classifying 12 AI-and-crypto claims by maturity and target scope), and Layered Defence Planner (selecting controls across three sample systems).',
    relatedStandards:
      'FIPS 203, FIPS 204, FIPS 205, NIST IR 8547, NSA CNSA 2.0 and FAQ Ver. 2.2, PKCS #11 v3.2 OASIS Standard, NIST SP 800-140F, FIPS 140-3 IG 12.A, CVE-2026-5194, and CVE-2026-45445.',
  },
}
