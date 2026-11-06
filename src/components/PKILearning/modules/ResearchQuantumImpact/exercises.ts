// SPDX-License-Identifier: AGPL-3.0-only
export interface ResearchExerciseLink {
  label: string
  /** An in-app route that exists: a Learn section or a workshop step of the named module. */
  to: string
}

export interface ResearchExercise {
  title: string
  /** The kind of researcher the scenario is written for. */
  audience: string
  prompt: string
  /** Fictional inputs, stated so that every number in the worked check can be reproduced. */
  inputs: string[]
  /** Hub pages to work with while attempting the scenario. */
  resources: ResearchExerciseLink[]
  /** What a correct answer has to contain. */
  checks: string[]
  /** Worked reasoning to compare with after an attempt. */
  workedCheck: string
}

export const RESEARCH_QUANTUM_EXERCISES: ResearchExercise[] = [
  {
    title: 'Scenario: Genomic Data HNDL Risk',
    audience:
      'For researchers who hold long-lived participant data, such as genomic or clinical records.',
    prompt:
      'Your research institution stores a 500 TB genomic dataset. Each file is encrypted with AES-256, and the AES keys are protected with RSA-2048 key encapsulation. The data must remain confidential for 50 years. Calculate the HNDL exposure window, work out the latest year migration could start, and decide what migration priority this data has.',
    inputs: [
      'The dataset is encrypted and stored in 2026.',
      'Required confidentiality: 50 years, so until 2076.',
      'Assumed CRQC arrival: 2035. This is a figure chosen for the arithmetic, not a forecast.',
      'Time to move the storage and the key protection to post-quantum algorithms: 5 years (also assumed).',
    ],
    resources: [
      {
        label: 'HNDL Timeline calculator (Quantum Threats, Workshop tab)',
        to: '/learn/quantum-threats?tab=workshop&step=3',
      },
      {
        label: 'HNDL Risk Prioritization (Quantum Threats, Learn tab)',
        to: '/learn/quantum-threats?tab=learn&section=hndl',
      },
    ],
    checks: [
      'The exposure window is stated as the years between the assumed CRQC arrival and the end of the required confidentiality period.',
      'The latest migration start is calculated with Mosca’s rule: the CRQC year, minus the years the data must stay confidential, minus the years migration takes.',
      'The answer says whether that year has already passed and what that means for the priority.',
      'The answer names which protection a CRQC attacks, the RSA-2048 key protection or the AES-256 data encryption, and why.',
      'The answer says what migration cannot fix: copies of the ciphertext and wrapped keys that an adversary has already recorded.',
    ],
    workedCheck:
      'Exposure window: the data must stay confidential until 2026 + 50 = 2076, and the CRQC is assumed in 2035, so a copy recorded now could be read for 2076 − 2035 = 41 years of the period in which it is still meant to be secret. Mosca’s rule (Quantum Threats, Learn tab): start migrating within Z − X − Y years, where Z = 2035 − 2026 = 9 years until the CRQC, X = 50 years of required confidentiality and Y = 5 years to migrate. 9 − 50 − 5 = −46, and a negative result means the start date has already passed. In the HNDL Timeline calculator, set the data lifetime to 50, the CRQC year to 2035 and the migration time to 5: the migration deadline reads 2035 − 50 − 5 = 1980 and the status is OVERDUE. The migration priority is therefore the highest; this is not a dataset to schedule for later. What a CRQC attacks is the RSA-2048 key protection, not the AES-256 encryption of the data: FIPS 203 (section 1.2) says key-establishment schemes whose security depends on integer factorization or discrete logarithms are at risk if large-scale quantum computers are realized, and RSA depends on integer factorization. An adversary who recorded the wrapped keys can then recover the AES keys and decrypt the recorded data (the decrypt phase of the HNDL attack in the Learn tab). Moving the key protection to ML-KEM (FIPS 203) protects what is encrypted from then on, but it cannot protect copies already recorded under RSA-2048, so the answer should also say which copies may already be outside the institution’s control.',
  },
  {
    title: 'Scenario: Multi-Institution Federated Learning',
    audience:
      'For researchers who lead or join collaborations that share data or models across institutions.',
    prompt:
      'You are designing a federated learning system for cross-institution cancer research. Model aggregation uses TLS 1.3 with ECDH. Five universities with different IT policies need to participate. Decide how you ensure quantum-safe data exchange between each university and the aggregation server, and what you do about a university that cannot comply.',
    inputs: [
      'The aggregation server supports the hybrid key-exchange group X25519MLKEM768 (defined in RFC 10024, Post-Quantum Traditional (PQ/T) Hybrid Key Agreement Mechanisms for TLS 1.3) as well as the classical groups x25519 and secp256r1.',
      'Universities A, C and D can offer X25519MLKEM768 on their gateways.',
      'Universities B and E can offer only the classical groups x25519 and secp256r1.',
    ],
    resources: [
      {
        label: 'Hybrid KEMs in TLS 1.3 (Hybrid Cryptography, Learn tab)',
        to: '/learn/hybrid-crypto?tab=learn&section=kem-tls',
      },
      {
        label: 'PQC in TLS and Hybrid Modes (TLS Basics, Learn tab)',
        to: '/learn/tls-basics?tab=learn&section=pqc-tls',
      },
      {
        label: 'Learning Self-Check (this module, Workshop step 2: What to Learn)',
        to: '/learn/research-quantum-impact?tab=workshop&step=1',
      },
    ],
    checks: [
      'The answer names the part of the current design a CRQC attacks: the ECDH key exchange that protects recorded traffic.',
      'The answer says what each connection does when the two ends share no hybrid group.',
      'The answer counts how many of the five links can use the hybrid group today and names the universities that need work.',
      'The answer chooses between requiring a hybrid group and allowing a classical fallback, and says what each choice costs.',
    ],
    workedCheck:
      'Three of the five links can negotiate X25519MLKEM768 (A, C and D): 3 of 5 = 60%. B and E share only classical groups with the aggregation server, so their links stay on ECDH: 2 of 5 = 40%. FIPS 203 (section 1.2) lists key-establishment schemes based on discrete logarithms, including those over elliptic curves, among those at risk from large-scale quantum computers, so traffic recorded on those two links can be decrypted once a CRQC exists. In TLS 1.3 the client lists the groups it supports in order of preference and the server selects one it also supports; if the two lists share no group, the server must abort the handshake (RFC 8446, sections 4.1.1 and 4.2.7). Two policies follow. Allow a classical fallback on the aggregation server: all five universities can take part, but the links to B and E are not quantum-safe. Require a hybrid group on the aggregation server: every connection that succeeds is hybrid, but B and E cannot connect until they upgrade, so their data stays out of the training run. A mixed network is only as quantum-safe as the weakest link it accepts; the decision is which universities to admit and under which conditions.',
  },
  {
    title: 'Scenario: PQC Research Proposal',
    audience:
      'For principal investigators and grant writers drafting the data-security section of a proposal.',
    prompt:
      'A funder’s call (fictional here; read the real call text before applying anywhere) asks applicants to describe “quantum-resilient” data security for a distributed health data platform. Draft the security section: which PQC algorithms, which deployment model (hybrid or pure), and how you will validate security. Then place the work on a timeline.',
    inputs: [
      'The platform links 12 hospital sites (fictional) and stores participant data that must stay confidential for 30 years.',
      'Sites connect to each other over TLS, and datasets are released as signed archives.',
    ],
    resources: [
      {
        label: 'Who Recommends Hybrid, and Who Does Not (Hybrid Cryptography, Learn tab)',
        to: '/learn/hybrid-crypto?tab=learn&section=who-recommends',
      },
      {
        label: 'Hybrid or Pure PQC: The Risks (Hybrid Cryptography, Learn tab)',
        to: '/learn/hybrid-crypto?tab=learn&section=hybrid-risks',
      },
      {
        label: 'How to Act: phased action plan (this module, Workshop step 3)',
        to: '/learn/research-quantum-impact?tab=workshop&step=2',
      },
    ],
    checks: [
      'Key establishment and signatures are named separately, each with a NIST standard.',
      'The hybrid-or-pure choice is justified by a named authority whose scope covers this platform, not by preference alone.',
      'The validation plan names a concrete way to check the chosen implementations and says which parts of the platform it covers and which it does not.',
      'The timeline puts the milestones in order, and the order is explained.',
    ],
    workedCheck:
      'One defensible outline, not the only one. Key establishment: ML-KEM (FIPS 203), which NIST presents as an approved alternative to the key-establishment schemes of SP 800-56A (discrete logarithm) and SP 800-56B (integer factorization) that large-scale quantum computers would threaten (FIPS 203, section 1.1). Signatures on released archives: ML-DSA (FIPS 204, a lattice-based standard); SLH-DSA (FIPS 205, a hash-based standard) is the alternative built on a different kind of mathematics, as the two standards’ titles state. Hybrid or pure: pick one and cite the row of the Who Recommends table that matches your scope; the Learn tab says a recommendation applies only within its own scope, such as a national regulated perimeter or national security systems, so the section should say why the cited authority’s position applies to a research platform. Validation: FIPS 203 names NIST’s Cryptographic Module Validation Program as the route to validation; state which libraries or modules you would use, whether each is validated, and what remains unvalidated. Timeline: the phased action plan in Step 3 is a checklist to tick, not a scheduler, so copy its order into the proposal’s milestone table: survey the data and the cryptography in use (This Week), try ML-KEM and ML-DSA key generation (30 Days), write the PQC security considerations into the proposal (90 Days), submit the proposal (6 Months).',
  },
]
