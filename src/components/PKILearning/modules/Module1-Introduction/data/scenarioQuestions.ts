// SPDX-License-Identifier: GPL-3.0-only
/**
 * Scenario-based challenge questions for PQC 101.
 *
 * Each scenario presents a real-world decision context and asks the learner
 * to reason about urgency, algorithm selection, or migration strategy.
 * Used by PQC101Exercises for the advanced "Apply It" section.
 */

export interface ScenarioQuestion {
  /** Short title for the scenario card */
  title: string
  /** The situation description */
  scenario: string
  /** What the learner must decide */
  question: string
  /** Correct answer with justification */
  answer: string
  /** Urgency level — colours the card border */
  urgency: 'critical' | 'high' | 'medium'
  /** Industry tag */
  industry: string
}

export const SCENARIO_QUESTIONS: ScenarioQuestion[] = [
  {
    title: 'Hospital Record Archive',
    scenario:
      'A hospital encrypts patient records with RSA-2048 and stores them for 50 years per regulation. A CRQC (cryptographically relevant quantum computer) is projected to exist within 10–15 years.',
    question:
      'Should the hospital migrate its archive encryption now, or wait until quantum computers actually exist?',
    answer:
      'Migrate now. The data has a 50-year sensitivity window, meaning records encrypted today will still need to be secret in 2075. With a CRQC projected in 10–15 years, adversaries may already be running HNDL attacks — collecting ciphertext today to decrypt later. RSA-2048 must be replaced with a quantum-safe scheme (e.g., AES-256 for symmetric data encryption at rest) before the CRQC window closes.',
    urgency: 'critical',
    industry: 'Healthcare',
  },
  {
    title: 'Firmware Signing for IoT Devices',
    scenario:
      'A device manufacturer signs firmware updates for embedded IoT sensors using ECDSA P-256. The sensors have a 15-year field lifetime and cannot receive key-exchange algorithm updates — only firmware signature verification logic can be patched via OTA.',
    question:
      'Which PQC signing algorithm should the manufacturer adopt for new firmware releases, and why?',
    answer:
      'SLH-DSA (FIPS 205) is the safest choice for firmware signing due to its minimal and conservative security assumptions — security relies only on hash function properties, with no lattice or algebraic structure to attack. ML-DSA (FIPS 204) is also acceptable and produces smaller signatures. FN-DSA is not recommended due to its complex constant-time implementation requirements on embedded hardware. Since sensors cannot update their key-exchange mechanism, the HNFL threat (forge firmware signatures post-quantum) is the primary concern — making signing algorithm choice the critical decision.',
    urgency: 'high',
    industry: 'IoT & Automotive',
  },
  {
    title: 'TLS Certificate Authority Migration',
    scenario:
      'A private CA issues X.509 certificates with 2-year validity for internal services. The CA root has a 20-year validity. The security team is planning its PQC migration roadmap.',
    question:
      'Which component — the CA root certificate, intermediate CA certificates, or end-entity certificates — is most urgent to migrate to PQC signing, and why?',
    answer:
      "The CA root certificate is most urgent. It has a 20-year validity window, meaning a root signed today with classical ECDSA could be forged post-quantum before it expires. Intermediate CAs (typically 5–10 years) are next. End-entity leaf certificates with 2-year validity are least urgent by timeline alone. However, all three should be on the migration roadmap: the root and intermediates to ML-DSA (FIPS 204) immediately, and end-entity certificates as part of the rollout. The CA's key-encapsulation (TLS handshake) should also migrate to ML-KEM (FIPS 203) for forward secrecy.",
    urgency: 'critical',
    industry: 'Finance & Banking',
  },
  {
    title: 'Classified Document Archive',
    scenario:
      'A government agency encrypted 10 years of classified intelligence reports with RSA-4096 and stores them air-gapped. An adversary nation-state is known to be collecting encrypted government traffic (HNDL program).',
    question:
      'RSA-4096 is much larger than RSA-2048. Does this buy meaningful extra time against a CRQC?',
    answer:
      "No. Shor's Algorithm breaks RSA regardless of key size — larger moduli increase the number of qubits and gate operations required, but the algorithm still runs in polynomial time. RSA-4096 provides no meaningful quantum-safe margin; it only slows classical attacks. The agency should treat all RSA-encrypted archives as potentially compromised once a CRQC exists and should prioritise re-encrypting the most sensitive records with AES-256 (which only requires doubling key size to resist Grover's) and migrating new communications to ML-KEM.",
    urgency: 'critical',
    industry: 'Government & Defense',
  },
  {
    title: 'Blockchain Wallet Key Management',
    scenario:
      "A cryptocurrency exchange holds customer funds in wallets secured by secp256k1 ECDSA keys (the same curve used by Bitcoin and Ethereum). Funds in 'exposed' addresses (where the public key is on-chain) are particularly vulnerable.",
    question:
      'Why are exposed on-chain public keys more immediately vulnerable to a CRQC than unexposed (P2PKH) addresses?',
    answer:
      "A P2PKH address only reveals a hash of the public key until the first spend — a CRQC cannot recover a private key from a hash. But once a transaction is broadcast or an address reuses its public key (e.g., exchange hot wallets), the public key is visible on-chain forever. A CRQC running Shor's Algorithm against a known secp256k1 public key can recover the private key directly. Exposed public keys represent an immediate HNDL-equivalent risk: anyone who recorded the blockchain can retroactively attack those addresses once a CRQC exists. Exchanges should migrate to quantum-safe custody solutions before that window opens.",
    urgency: 'high',
    industry: 'Blockchain & Crypto',
  },
]
