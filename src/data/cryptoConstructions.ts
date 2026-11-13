// SPDX-License-Identifier: AGPL-3.0-only
//
// Construction vocabulary for the Industry Landscape (added 2026-11-13).
//
// `cryptoMechanisms.ts` lists ALGORITHMS (ML-KEM, ECDH, ECDSA, AES…); the
// protocol matrix lists PROTOCOLS (TLS 1.3, IKEv2, MLS…). Constructions sit
// between the two: recipes that combine algorithms into something a protocol
// uses (HPKE, ECIES, hybrid key exchange, composite signatures, KEM
// recipients in CMS). Most PQC migrations change a construction, not a bare
// algorithm, so the landscape records them in their own columns
// (`classical_constructions`, `pqc_constructions`, `constructions_referenced`).
//
// This is a SEPARATE registry on purpose: the algorithm vocabulary's checks
// (registry members with byte sizes, classical→PQC `replaces` edges) cannot
// apply to a recipe. Constructions carry their own checks in
// `cryptoConstructions.driftguard.test.ts`:
//   - every instantiation's algorithms resolve in CRYPTO_MECHANISMS;
//   - the PQC outlook is consistent with the instantiations and successions;
//   - every construction is used by at least one active row;
//   - every proof reference resolves to an active, freely readable Library row.
//
// Facts here are checked against the cited documents, not recalled: each
// instantiation names the Library document that specifies it, and the private
// proof matcher reads that document.

/**
 * What happens to a construction in the PQC transition (owner decision D9,
 * 2026-11-12). The labels below are what readers see.
 */
export type PqcOutlook =
  /** Stays, works with both: unchanged, only the algorithm inside changes
   *  (or, for symmetric building blocks, at most larger keys). */
  | 'stays-both'
  /** Replaced by a newer construction: its design is tied to classical
   *  algorithms, so a different construction takes over. */
  | 'replaced'
  /** Hybrid bridge: combines a classical and a PQC algorithm so security
   *  holds if either survives. */
  | 'bridge'
  /** New because of PQC: exists only because PQC algorithms behave
   *  differently. */
  | 'pqc-native'
  /** No standardised PQC successor yet. */
  | 'no-successor-yet'
  /** Kept, extended with a post-quantum part running next to it (added
   *  2026-11-13 after review: Signal keeps the Double Ratchet and adds SPQR
   *  beside it, which is neither a replacement nor a hybrid of one design). */
  | 'extended'

export const PQC_OUTLOOK_LABEL: Record<PqcOutlook, string> = {
  'stays-both': 'Stays: works with classical and PQC',
  replaced: 'Has a newer construction for PQC',
  bridge: 'Hybrid bridge',
  'pqc-native': 'New, motivated by PQC',
  'no-successor-yet': 'No PQC successor yet',
  extended: 'Kept, extended with a PQC part',
}

/**
 * Standards status of one instantiation or succession. `vendor-spec` (owner
 * decision D11): publicly documented and deployed by one company, not
 * reviewed by a standards body.
 */
export type StandardsStatus = 'published' | 'vendor-spec' | 'draft' | 'study' | 'research'

export const STANDARDS_STATUS_LABEL: Record<StandardsStatus, string> = {
  published: 'Published standard',
  'vendor-spec': 'Vendor specification',
  draft: 'Draft',
  study: 'Under study',
  research: 'Research',
}

/**
 * The CycloneDX 1.7 `cryptoProperties.algorithmProperties.primitive` enum,
 * copied from bom-1.7.schema.json (checked 2026-11-12). There is no `pake`
 * value; a PAKE construction uses `other` with a reason.
 */
export const CYCLONEDX_PRIMITIVES = [
  'drbg',
  'mac',
  'block-cipher',
  'stream-cipher',
  'signature',
  'hash',
  'pke',
  'xof',
  'kdf',
  'key-agree',
  'kem',
  'ae',
  'combiner',
  'key-wrap',
  'other',
  'unknown',
] as const
export type CycloneDxPrimitive = (typeof CYCLONEDX_PRIMITIVES)[number]

export interface Instantiation {
  /** CRYPTO_MECHANISMS families, e.g. ['X25519'] or ['X25519', 'ML-KEM']. */
  algorithms: string[]
  status: StandardsStatus
  /**
   * Library reference_ids that specify THIS instantiation; together they must
   * name every algorithm listed (checked by the private proof matcher).
   */
  proofRefs: string[]
  /** Shown beside the instantiation, e.g. the pre-FIPS 203 Kyber note (D12). */
  note?: string
}

export interface Succession {
  /** Successor construction id. */
  to: string
  /** 'replaced-by': the newer construction takes over the job.
   *  'extended-by': it runs next to this one, which stays. */
  relation: 'replaced-by' | 'extended-by'
  /**
   * true when a cited document says so in words; false when the link is our
   * reading of the standards (the newer construction does the same job, but no
   * cited document states that it supersedes this one). The UI words the two
   * differently, so an inference is never presented as a standard's statement.
   */
  stated: boolean
  /** Where the succession applies: '5G SUCI', 'CMS / S/MIME', 'Signal'… */
  context: string
  status: StandardsStatus
  /**
   * A Library document that says the successor takes over from this
   * construction in this context — one that names BOTH, not merely one that
   * defines the successor.
   */
  proofRefs: string[]
}

/** The shape the code-drawn diagram renders (labels come from the data). */
export interface DiagramSpec {
  /** What goes in, in plain words: 'recipient public key', 'message'. */
  inputs: string[]
  /** The combining step, in plain words: 'key derivation', 'two signatures'. */
  combiner?: string
  /** What comes out: 'shared secret', 'ciphertext', 'signature'. */
  outputs: string[]
}

export interface Explanation {
  /** Two or three sentences, no jargon. */
  plain: string
  /** One sentence picture, e.g. 'a door with two different locks'. */
  analogy?: string
  /** What changes in the PQC migration, in one sentence. */
  whyItMattersForPqc: string
  /** Exact `term` of an existing glossary entry (single source of the definition). */
  glossaryTerm?: string
  /** Learn module id that teaches it hands-on. */
  learnModuleId?: string
  diagram: DiagramSpec
}

export interface CryptoConstruction {
  /** Used verbatim in the CSV construction columns. */
  id: string
  label: string
  outlook: PqcOutlook
  classical?: Instantiation[]
  pqc?: Instantiation[]
  hybrid?: Instantiation[]
  /** Required when outlook is 'replaced' or 'extended'. */
  successions?: Succession[]
  /** Required when outlook is 'no-successor-yet'. */
  noSuccessorReason?: string
  /** Date the no-successor claim was last checked against its sources. */
  noSuccessorCheckedOn?: string
  /** Other construction ids this one is built on (acyclic). */
  builtOn?: string[]
  cycloneDxPrimitive: CycloneDxPrimitive
  /** Required when cycloneDxPrimitive is 'other'. */
  otherReason?: string
  /** Library reference_ids that define the construction itself. */
  proofRefs: string[]
  explain: Explanation
}

export const CRYPTO_CONSTRUCTIONS: CryptoConstruction[] = [
  // ── Public-key encryption ─────────────────────────────────────────────
  {
    id: 'ECIES',
    label: 'ECIES (elliptic-curve integrated encryption)',
    outlook: 'replaced',
    classical: [{ algorithms: ['ECDH'], status: 'published', proofRefs: ['SEC 1'] }],
    successions: [
      {
        to: 'HPKE',
        relation: 'replaced-by',
        stated: false,
        context: 'general public-key encryption',
        status: 'published',
        proofRefs: ['RFC 9180'],
      },
      {
        to: 'PQ-SUCI-Profile',
        relation: 'replaced-by',
        stated: true,
        context: '5G subscriber privacy (SUCI)',
        status: 'research',
        proofRefs: ['PQ-SUCI-MLKEM-Profile-C-2025'],
      },
    ],
    cycloneDxPrimitive: 'pke',
    proofRefs: ['SEC 1', 'PQ-SUCI-MLKEM-Profile-C-2025'],
    explain: {
      plain:
        'ECIES lets anyone encrypt a message for a recipient using only the recipient’s public key. The sender makes a one-time elliptic-curve key, combines it with the recipient’s key to get a shared secret, and uses that secret to encrypt the message. 5G phones use it to hide the subscriber’s permanent identity (SUCI).',
      analogy:
        'A drop box that anyone can lock with the owner’s padlock, but only the owner can open.',
      whyItMattersForPqc:
        'Its key agreement is elliptic-curve Diffie-Hellman, which a quantum computer breaks. KEM-based designs do the same job: HPKE can use ML-KEM, and post-quantum SUCI profiles are being researched and studied for 5G.',
      glossaryTerm: 'ECIES',
      diagram: {
        inputs: ['recipient public key', 'message'],
        combiner: 'key derivation + encryption',
        outputs: ['ephemeral public key', 'ciphertext'],
      },
    },
  },
  {
    id: 'PQ-SUCI-Profile',
    label: 'Post-quantum SUCI profile (5G)',
    outlook: 'pqc-native',
    pqc: [
      {
        algorithms: ['ML-KEM'],
        status: 'research',
        proofRefs: ['PQ-SUCI-MLKEM-Profile-C-2025'],
        note: 'Research proposal; the paper uses Kyber-512 (pre-FIPS 203). 3GPP has not standardised a post-quantum SUCI profile; it is studied in TR 33.703.',
      },
    ],
    cycloneDxPrimitive: 'kem',
    proofRefs: ['PQ-SUCI-MLKEM-Profile-C-2025', '3GPP-Post-Quantum-Cryptography-SA3-Overview'],
    explain: {
      plain:
        'A proposed way to conceal a 5G subscriber’s identity with a post-quantum KEM instead of ECIES. Today’s 3GPP specification only defines elliptic-curve profiles; post-quantum profiles are being studied, not standardised.',
      whyItMattersForPqc:
        'SIM cards and networks last for years, so the SUCI scheme is one of the places telecoms must plan to change before a quantum computer can reveal recorded identities.',
      glossaryTerm: 'SUCI',
      learnModuleId: '5g-security',
      diagram: {
        inputs: ['home network public key', 'subscriber identity'],
        combiner: 'KEM encapsulation + encryption',
        outputs: ['KEM ciphertext', 'concealed identity'],
      },
    },
  },
  {
    id: 'HPKE',
    label: 'HPKE (Hybrid Public Key Encryption)',
    outlook: 'stays-both',
    classical: [
      { algorithms: ['X25519'], status: 'published', proofRefs: ['RFC 9180'] },
      { algorithms: ['ECDH'], status: 'published', proofRefs: ['RFC 9180'] },
    ],
    pqc: [
      {
        algorithms: ['ML-KEM'],
        status: 'draft',
        proofRefs: ['draft-ietf-hpke-pq'],
        note: 'With ML-KEM, HPKE’s authenticated modes (AuthEncap/AuthDecap) are not available.',
      },
    ],
    hybrid: [
      { algorithms: ['X25519', 'ML-KEM'], status: 'draft', proofRefs: ['draft-ietf-hpke-pq'] },
    ],
    builtOn: ['KDF', 'AEAD'],
    cycloneDxPrimitive: 'pke',
    proofRefs: ['RFC 9180', 'draft-ietf-hpke-pq'],
    explain: {
      plain:
        'HPKE is a standard recipe for encrypting data to someone’s public key. It is built from three swappable parts: a key encapsulation mechanism (KEM), a key derivation function and an authenticated cipher. MLS group messaging and other protocols use it.',
      analogy: 'A standard envelope whose lock can be swapped without redesigning the envelope.',
      whyItMattersForPqc:
        'HPKE itself stays: it was designed around a KEM, so moving to post-quantum means plugging in ML-KEM or a hybrid KEM, defined in an IETF working-group draft. Its authenticated modes are not available with ML-KEM.',
      glossaryTerm: 'Hybrid Public Key Encryption',
      diagram: {
        inputs: ['recipient public key', 'message'],
        combiner: 'KEM + key derivation + authenticated encryption',
        outputs: ['encapsulated key', 'ciphertext'],
      },
    },
  },

  // ── Key exchange ──────────────────────────────────────────────────────
  {
    id: 'Hybrid-KEM',
    label: 'Hybrid key exchange (e.g. X25519MLKEM768)',
    outlook: 'bridge',
    hybrid: [
      { algorithms: ['X25519', 'ML-KEM'], status: 'published', proofRefs: ['RFC-10024'] },
      { algorithms: ['ECDH', 'ML-KEM'], status: 'published', proofRefs: ['RFC-10024'] },
    ],
    builtOn: ['KDF'],
    cycloneDxPrimitive: 'combiner',
    proofRefs: ['RFC-10024', 'NIST SP 800-227'],
    explain: {
      plain:
        'A hybrid key exchange runs a classical exchange (such as X25519) and ML-KEM side by side and mixes both results into one key. TLS 1.3 defines named groups for this, such as X25519MLKEM768.',
      analogy: 'A door with two different locks: a thief must pick both to get in.',
      whyItMattersForPqc:
        'TLS 1.3 now has standard hybrid groups such as X25519MLKEM768: the key stays safe if either the classical or the post-quantum part holds.',
      glossaryTerm: 'Hybrid Key Exchange',
      learnModuleId: 'hybrid-crypto',
      diagram: {
        inputs: ['classical key share', 'ML-KEM key share'],
        combiner: 'concatenate and derive',
        outputs: ['shared secret'],
      },
    },
  },
  {
    id: 'IKEv2-Multi-KE',
    label: 'IKEv2 multiple key exchanges (RFC 9370)',
    outlook: 'bridge',
    hybrid: [
      {
        algorithms: ['X25519', 'ML-KEM'],
        status: 'draft',
        proofRefs: ['RFC 9370', 'draft-ietf-ipsecme-ikev2-mlkem-09'],
        note: 'RFC 9370 (published) defines the additional key exchanges; ML-KEM in IKEv2 is a draft.',
      },
      {
        algorithms: ['ECDH', 'ML-KEM'],
        status: 'draft',
        proofRefs: ['RFC 9370', 'draft-ietf-ipsecme-ikev2-mlkem-09'],
      },
      {
        algorithms: ['FFDH', 'ML-KEM'],
        status: 'draft',
        proofRefs: ['RFC 9370', 'draft-ietf-ipsecme-ikev2-mlkem-09'],
      },
    ],
    cycloneDxPrimitive: 'key-agree',
    proofRefs: ['RFC 9370'],
    explain: {
      plain:
        'IKEv2, the key exchange behind IPsec VPNs, can run several key exchanges in a row and mix all of them into the session keys. RFC 9370 defines this so a post-quantum KEM can be added next to the classical Diffie-Hellman exchange.',
      whyItMattersForPqc:
        'It is the IPsec path to hybrid post-quantum key exchange: ML-KEM can be added as an extra exchange next to the classical one.',
      diagram: {
        inputs: ['classical Diffie-Hellman', 'additional ML-KEM exchange'],
        combiner: 'IKEv2 key derivation',
        outputs: ['IPsec session keys'],
      },
    },
  },
  {
    id: 'IKEv2-PPK',
    label: 'IKEv2 post-quantum preshared keys (RFC 8784)',
    outlook: 'pqc-native',
    pqc: [
      {
        algorithms: [],
        status: 'published',
        proofRefs: ['RFC 8784'],
        note: 'Symmetric: protection comes from the preshared key, not from a public-key algorithm.',
      },
    ],
    cycloneDxPrimitive: 'kdf',
    proofRefs: ['RFC 8784'],
    explain: {
      plain:
        'Two VPN endpoints that already share a secret key mix it into the IKEv2 key derivation. Because the shared key never travels over the network, recorded traffic stays protected even if the public-key exchange is later broken.',
      whyItMattersForPqc:
        'It gives quantum resistance without any new public-key algorithm, at the cost of distributing and managing the shared keys.',
      diagram: {
        inputs: ['IKEv2 key exchange result', 'preshared post-quantum key'],
        combiner: 'key derivation',
        outputs: ['IPsec session keys'],
      },
    },
  },
  {
    id: 'MLS-PQ-Combiner',
    label: 'MLS post-quantum combiner',
    outlook: 'bridge',
    hybrid: [
      {
        algorithms: ['ML-KEM'],
        status: 'draft',
        proofRefs: ['draft-ietf-mls-combiner-02', 'draft-ietf-mls-pq-ciphersuites-07'],
        note: 'The classical half is the traditional MLS session with its own cipher suite; the post-quantum session uses an ML-KEM cipher suite.',
      },
    ],
    cycloneDxPrimitive: 'combiner',
    proofRefs: ['draft-ietf-mls-combiner-02'],
    explain: {
      plain:
        'MLS keeps group chats encrypted as members join and leave. The combiner runs a traditional MLS session and a post-quantum one together and feeds the post-quantum secrets into the traditional session.',
      whyItMattersForPqc:
        'Large groups get post-quantum protection without paying the cost of post-quantum keys on every single update.',
      diagram: {
        inputs: ['traditional MLS session', 'post-quantum MLS session'],
        combiner: 'secret injection',
        outputs: ['group keys'],
      },
    },
  },
  {
    id: 'AuthKEM',
    label: 'AuthKEM (KEM-based TLS authentication)',
    outlook: 'pqc-native',
    pqc: [
      { algorithms: ['ML-KEM'], status: 'draft', proofRefs: ['draft-celi-wiggers-tls-authkem-07'] },
    ],
    cycloneDxPrimitive: 'kem',
    proofRefs: ['draft-celi-wiggers-tls-authkem-07'],
    explain: {
      plain:
        'In normal TLS the server proves its identity with a signature. AuthKEM proposes proving it with a KEM instead: the client encapsulates a secret to the server’s certified KEM key, and only the real server can recover it.',
      whyItMattersForPqc:
        'It was proposed with post-quantum KEMs in mind, because KEM keys and ciphertexts can be smaller than post-quantum signatures; the draft notes it can also work with (EC)DH certificate keys.',
      diagram: {
        inputs: ['server certified KEM public key'],
        combiner: 'KEM encapsulation',
        outputs: ['secret only the real server can recover'],
      },
    },
  },
  {
    id: 'Hybrid-PAKE',
    label: 'Hybrid password-authenticated key exchange',
    outlook: 'bridge',
    hybrid: [
      {
        algorithms: ['ML-KEM'],
        status: 'research',
        proofRefs: ['Hybrid-Post-Quantum-Password-Authenticated-Key-Exchange'],
        note: 'The classical half is the CPace PAKE named by the draft (an individual Internet-Draft).',
      },
    ],
    cycloneDxPrimitive: 'other',
    otherReason: 'CycloneDX 1.7 has no PAKE primitive.',
    proofRefs: ['Hybrid-Post-Quantum-Password-Authenticated-Key-Exchange'],
    explain: {
      plain:
        'A password-authenticated key exchange lets two parties who share only a password agree on a strong key without ever revealing the password. The hybrid version combines a classical PAKE with a post-quantum KEM.',
      whyItMattersForPqc:
        'Password logins that use a PAKE would otherwise rely on discrete-log problems a quantum computer can solve.',
      diagram: {
        inputs: ['shared password', 'ML-KEM exchange'],
        combiner: 'combine both exchanges',
        outputs: ['session key'],
      },
    },
  },

  // ── Signatures and certificates ───────────────────────────────────────
  {
    id: 'Composite-Sig',
    label: 'Composite signatures (ML-DSA + classical)',
    outlook: 'bridge',
    hybrid: [
      {
        algorithms: ['ML-DSA', 'RSA-sig'],
        status: 'draft',
        proofRefs: ['draft-ietf-lamps-cms-composite-sigs'],
      },
      {
        algorithms: ['ML-DSA', 'ECDSA'],
        status: 'draft',
        proofRefs: ['draft-ietf-lamps-cms-composite-sigs'],
      },
      {
        algorithms: ['ML-DSA', 'EdDSA'],
        status: 'draft',
        proofRefs: ['draft-ietf-lamps-cms-composite-sigs'],
      },
    ],
    cycloneDxPrimitive: 'signature',
    proofRefs: ['draft-ietf-lamps-cms-composite-sigs'],
    explain: {
      plain:
        'A composite signature puts an ML-DSA signature and a classical signature (RSA, ECDSA or EdDSA) together under one key and one algorithm identifier, so the two always travel as a pair.',
      analogy: 'One document carrying two different seals.',
      whyItMattersForPqc:
        'Certificates and signed email can move to post-quantum signatures while keeping classical security during the transition.',
      glossaryTerm: 'Composite Signature',
      learnModuleId: 'hybrid-crypto',
      diagram: {
        inputs: ['message', 'composite private key'],
        combiner: 'two signatures',
        outputs: ['composite signature'],
      },
    },
  },
  {
    id: 'Composite-KEM',
    label: 'Composite KEM (ML-KEM + classical)',
    outlook: 'bridge',
    hybrid: [
      {
        algorithms: ['ML-KEM', 'RSA-kex'],
        status: 'draft',
        proofRefs: ['draft-ietf-lamps-pq-composite-kem-23'],
      },
      {
        algorithms: ['ML-KEM', 'ECDH'],
        status: 'draft',
        proofRefs: ['draft-ietf-lamps-pq-composite-kem-23'],
      },
      {
        algorithms: ['ML-KEM', 'X25519'],
        status: 'draft',
        proofRefs: ['draft-ietf-lamps-pq-composite-kem-23'],
      },
      {
        algorithms: ['ML-KEM', 'ECDH'],
        status: 'published',
        proofRefs: ['RFC 9980'],
        note: 'OpenPGP composite ML-KEM + ECDH encryption.',
      },
    ],
    cycloneDxPrimitive: 'kem',
    proofRefs: ['draft-ietf-lamps-pq-composite-kem-23', 'RFC 9980'],
    explain: {
      plain:
        'A composite KEM pairs ML-KEM with a classical key exchange or key transport under one public key, and combines both shared secrets into one. Certificates and encrypted email can then carry a single key that is safe if either part holds.',
      analogy: 'A door with two different locks behind one key ring.',
      whyItMattersForPqc:
        'It lets encryption to long-lived certificate keys become quantum-resistant without giving up the classical protection yet.',
      diagram: {
        inputs: ['composite public key'],
        combiner: 'two encapsulations + combiner',
        outputs: ['ciphertext', 'shared secret'],
      },
    },
  },

  // ── Message encryption recipients (CMS / JOSE / COSE) ─────────────────
  {
    id: 'KeyTrans-Recipient',
    label: 'Key transport recipient (CMS KeyTransRecipientInfo)',
    outlook: 'replaced',
    classical: [{ algorithms: ['RSA-kex'], status: 'published', proofRefs: ['RFC 5652'] }],
    successions: [
      {
        to: 'KEM-Recipient',
        relation: 'replaced-by',
        stated: false,
        context: 'CMS / S/MIME',
        status: 'published',
        proofRefs: ['RFC 9629'],
      },
    ],
    cycloneDxPrimitive: 'pke',
    proofRefs: ['RFC 5652'],
    explain: {
      plain:
        'In encrypted email (S/MIME) and other CMS messages, the message key is encrypted directly with each recipient’s RSA public key. That wrapped key travels with the message.',
      whyItMattersForPqc:
        'RSA key transport is broken by a quantum computer; CMS has a KEM recipient type that does the same job with ML-KEM.',
      diagram: {
        inputs: ['recipient RSA public key', 'message key'],
        combiner: 'RSA encryption',
        outputs: ['wrapped message key'],
      },
    },
  },
  {
    id: 'KeyAgree-Recipient',
    label: 'Key agreement recipient (CMS KeyAgreeRecipientInfo)',
    outlook: 'replaced',
    classical: [{ algorithms: ['ECDH'], status: 'published', proofRefs: ['RFC 7518'] }],
    successions: [
      {
        to: 'KEM-Recipient',
        relation: 'replaced-by',
        stated: false,
        context: 'CMS / S/MIME',
        status: 'published',
        proofRefs: ['RFC 9629'],
      },
    ],
    builtOn: ['KDF', 'Key-Wrap'],
    cycloneDxPrimitive: 'key-agree',
    proofRefs: ['RFC 5652', 'RFC 7518', 'RFC 9053'],
    explain: {
      plain:
        'The sender agrees a shared secret with the recipient’s elliptic-curve key, derives a key-encryption key from it, and uses that to wrap the message key. CMS calls this KeyAgreeRecipientInfo; JOSE and COSE have a similar mode called ECDH-ES.',
      whyItMattersForPqc:
        'Elliptic-curve Diffie-Hellman is broken by a quantum computer; in CMS the KEM recipient type does the same job with ML-KEM.',
      diagram: {
        inputs: ['recipient EC public key', 'message key'],
        combiner: 'ECDH + key derivation + key wrap',
        outputs: ['wrapped message key'],
      },
    },
  },
  {
    id: 'KEM-Recipient',
    label: 'KEM recipient (CMS KEMRecipientInfo)',
    outlook: 'stays-both',
    classical: [{ algorithms: ['RSA-kex'], status: 'published', proofRefs: ['RFC 9690'] }],
    pqc: [{ algorithms: ['ML-KEM'], status: 'published', proofRefs: ['RFC-9936'] }],
    builtOn: ['KDF', 'Key-Wrap'],
    cycloneDxPrimitive: 'kem',
    proofRefs: ['RFC 9629'],
    explain: {
      plain:
        'RFC 9629 adds a recipient type to CMS that works with any key encapsulation mechanism: the sender encapsulates a secret to the recipient’s KEM key, derives a key-encryption key, and wraps the message key with it.',
      whyItMattersForPqc:
        'Because it is defined for any KEM, the same structure carries RSA-KEM today and ML-KEM for post-quantum email and signed-and-encrypted documents.',
      glossaryTerm: 'KEMRecipientInfo',
      diagram: {
        inputs: ['recipient KEM public key', 'message key'],
        combiner: 'KEM encapsulation + key derivation + key wrap',
        outputs: ['KEM ciphertext', 'wrapped message key'],
      },
    },
  },

  // ── Secure messaging ──────────────────────────────────────────────────
  {
    id: 'X3DH',
    label: 'X3DH (Signal initial key agreement)',
    outlook: 'extended',
    classical: [
      { algorithms: ['X25519'], status: 'vendor-spec', proofRefs: ['Signal-PQXDH-Spec'] },
    ],
    successions: [
      {
        to: 'PQXDH',
        relation: 'extended-by',
        stated: false,
        context: 'Signal',
        status: 'vendor-spec',
        proofRefs: ['Signal-PQXDH-Spec'],
      },
    ],
    cycloneDxPrimitive: 'key-agree',
    proofRefs: ['Signal-PQXDH-Spec'],
    explain: {
      plain:
        'X3DH is how Signal sets up a shared key between two people even when one of them is offline, using several Diffie-Hellman exchanges over published keys.',
      whyItMattersForPqc:
        'Recorded first messages could be decrypted later by a quantum computer. Signal’s PQXDH keeps X3DH’s Diffie-Hellman exchanges and adds a post-quantum KEM to them.',
      diagram: {
        inputs: ['identity keys', 'signed prekey', 'one-time prekey'],
        combiner: 'several Diffie-Hellman exchanges + key derivation',
        outputs: ['initial shared key'],
      },
    },
  },
  {
    id: 'PQXDH',
    label: 'PQXDH (Signal post-quantum key agreement)',
    outlook: 'bridge',
    hybrid: [
      {
        algorithms: ['X25519', 'ML-KEM'],
        status: 'vendor-spec',
        proofRefs: ['Signal-PQXDH-Spec'],
        note: 'Uses CRYSTALS-Kyber-1024, the pre-FIPS 203 version of ML-KEM.',
      },
    ],
    cycloneDxPrimitive: 'key-agree',
    proofRefs: ['Signal-PQXDH-Spec'],
    explain: {
      plain:
        'PQXDH keeps X3DH’s Diffie-Hellman exchanges and adds a post-quantum KEM encapsulation to a published prekey, mixing both into the first shared key.',
      analogy: 'The same handshake, plus a second lock only a post-quantum key opens.',
      whyItMattersForPqc:
        'It protects a conversation’s first messages against harvest-now, decrypt-later attacks.',
      glossaryTerm: 'PQXDH',
      diagram: {
        inputs: ['X3DH key exchanges', 'KEM prekey'],
        combiner: 'Diffie-Hellman + KEM + key derivation',
        outputs: ['initial shared key'],
      },
    },
  },
  {
    id: 'Double-Ratchet',
    label: 'Double Ratchet (Signal)',
    outlook: 'extended',
    classical: [
      {
        algorithms: ['ECDH'],
        status: 'vendor-spec',
        proofRefs: ['Signal-Blog-SPQR-Post-Quantum-Ratchets'],
      },
    ],
    successions: [
      {
        to: 'SPQR',
        relation: 'extended-by',
        stated: true,
        context: 'Signal',
        status: 'vendor-spec',
        proofRefs: ['Signal-Blog-SPQR-Post-Quantum-Ratchets'],
      },
    ],
    cycloneDxPrimitive: 'key-agree',
    proofRefs: ['Signal-Blog-SPQR-Post-Quantum-Ratchets'],
    explain: {
      plain:
        'After the first key is set up, the Double Ratchet keeps changing the keys with every message, so a key stolen today does not unlock past or future messages.',
      whyItMattersForPqc:
        'Its ongoing key refresh uses elliptic-curve Diffie-Hellman. Signal keeps it and runs a post-quantum ratchet, SPQR, next to it.',
      diagram: {
        inputs: ['current chain keys', 'new Diffie-Hellman ratchet keys'],
        combiner: 'ratchet step',
        outputs: ['new message keys'],
      },
    },
  },
  {
    id: 'SPQR',
    label: 'SPQR triple ratchet (Signal)',
    outlook: 'bridge',
    hybrid: [
      {
        algorithms: ['ECDH', 'ML-KEM'],
        status: 'vendor-spec',
        proofRefs: ['Signal-Blog-SPQR-Post-Quantum-Ratchets'],
      },
    ],
    cycloneDxPrimitive: 'key-agree',
    proofRefs: ['Signal-Blog-SPQR-Post-Quantum-Ratchets'],
    explain: {
      plain:
        'SPQR runs an ML-KEM-based ratchet alongside the Double Ratchet and mixes both into the message keys; Signal calls the result the Triple Ratchet.',
      whyItMattersForPqc:
        'It extends post-quantum protection from a conversation’s first messages to the whole conversation.',
      diagram: {
        inputs: ['Double Ratchet keys', 'ML-KEM ratchet keys'],
        combiner: 'mix both ratchets',
        outputs: ['message keys'],
      },
    },
  },
  {
    id: 'Apple-PQ3',
    label: 'PQ3 (Apple iMessage)',
    outlook: 'bridge',
    hybrid: [
      {
        algorithms: ['ECDH', 'ML-KEM'],
        status: 'vendor-spec',
        proofRefs: ['Apple-PQ3-Security-Blog'],
        note: 'Apple’s post names P-256 ECDH with Kyber-768 and Kyber-1024, the pre-FIPS 203 version of ML-KEM.',
      },
    ],
    cycloneDxPrimitive: 'key-agree',
    proofRefs: ['Apple-PQ3-Security-Blog'],
    explain: {
      plain:
        'PQ3 is iMessage’s protocol that combines elliptic-curve key agreement with a post-quantum KEM, both when a conversation starts and periodically during it.',
      whyItMattersForPqc:
        'Like Signal’s design, it guards recorded messages against later decryption by a quantum computer.',
      diagram: {
        inputs: ['elliptic-curve key agreement', 'post-quantum KEM'],
        combiner: 'combine and rekey',
        outputs: ['message keys'],
      },
    },
  },

  // ── Building blocks (group 2) ─────────────────────────────────────────
  {
    id: 'Key-Wrap',
    label: 'AES key wrap (AES-KW / AES-KWP)',
    outlook: 'stays-both',
    classical: [{ algorithms: ['AES'], status: 'published', proofRefs: ['RFC 3394'] }],
    pqc: [{ algorithms: ['AES'], status: 'published', proofRefs: ['IETF RFC 5649'] }],
    cycloneDxPrimitive: 'key-wrap',
    proofRefs: [
      'RFC 3394',
      'IETF RFC 5649',
      'NIST-SP-800-38F-Recommendation-for-Block-Cipher-Modes-of-Ope',
    ],
    explain: {
      plain:
        'Key wrap encrypts one key with another key so it can be stored or sent safely, and detects any tampering when it is unwrapped. The AES key wrap modes are standardised by the IETF and NIST.',
      whyItMattersForPqc:
        'It is symmetric, so it stays: post-quantum designs use it after a KEM to wrap the actual key.',
      diagram: {
        inputs: ['key-encryption key', 'key to protect'],
        combiner: 'AES key wrap',
        outputs: ['wrapped key'],
      },
    },
  },
  {
    id: 'Asymmetric-Key-Wrap',
    label: 'Asymmetric key wrap (RSA-OAEP, RSA-AES key wrap)',
    outlook: 'replaced',
    classical: [
      {
        algorithms: ['RSA-kex'],
        status: 'published',
        proofRefs: ['PKCS11-V32-OS-OASIS', 'AWS-KMS-Import-Wrapping-Keys'],
      },
    ],
    successions: [
      {
        to: 'KEM-Key-Wrap',
        relation: 'replaced-by',
        stated: false,
        context: 'HSM key import and transport (PKCS#11 v3.2)',
        status: 'published',
        proofRefs: ['PKCS11-V32-OS-OASIS'],
      },
    ],
    builtOn: ['Key-Wrap'],
    cycloneDxPrimitive: 'key-wrap',
    proofRefs: ['PKCS11-V32-OS-OASIS', 'AWS-KMS-Import-Wrapping-Keys'],
    explain: {
      plain:
        'To move a key into a cloud KMS or an HSM, it is encrypted under the target’s RSA public key, either directly (RSA-OAEP) or by wrapping a temporary AES key with RSA and the real key with AES.',
      whyItMattersForPqc:
        'RSA is broken by a quantum computer, so key import needs a KEM-based replacement; PKCS#11 v3.2 adds encapsulation for KEMs such as ML-KEM.',
      diagram: {
        inputs: ['target RSA public key', 'key to import'],
        combiner: 'RSA encryption (+ AES key wrap)',
        outputs: ['wrapped key material'],
      },
    },
  },
  {
    id: 'KEM-Key-Wrap',
    label: 'KEM-based key wrap (encapsulate, then wrap)',
    outlook: 'pqc-native',
    pqc: [
      {
        algorithms: ['ML-KEM'],
        status: 'published',
        proofRefs: ['PKCS11-V32-OS-OASIS'],
        note: 'PKCS#11 v3.2 defines the KEM operations (C_EncapsulateKey, C_DecapsulateKey); using the encapsulated secret to wrap a key, for example with AES key wrap, is our description of how they fit together.',
      },
    ],
    builtOn: ['Key-Wrap'],
    cycloneDxPrimitive: 'kem',
    proofRefs: ['PKCS11-V32-OS-OASIS'],
    explain: {
      plain:
        'Instead of encrypting a key with RSA, the sender encapsulates a fresh secret to the recipient’s KEM key and can use that secret to protect the key, for example with AES key wrap. PKCS#11 v3.2 adds encapsulate and decapsulate operations for KEMs such as ML-KEM.',
      whyItMattersForPqc:
        'It is how HSMs and key managers can move keys between each other with ML-KEM instead of RSA.',
      diagram: {
        inputs: ['recipient ML-KEM public key', 'key to protect'],
        combiner: 'KEM encapsulation + AES key wrap',
        outputs: ['KEM ciphertext', 'wrapped key'],
      },
    },
  },
  {
    id: 'KDF',
    label: 'Key derivation (HKDF, SP 800-56C, KMAC)',
    outlook: 'stays-both',
    classical: [
      { algorithms: ['SHA'], status: 'published', proofRefs: ['NIST-SP-800-56C-R2'] },
      { algorithms: ['AES'], status: 'published', proofRefs: ['NIST-SP-800-56C-R2'] },
    ],
    pqc: [
      { algorithms: ['SHA'], status: 'published', proofRefs: ['NIST-SP-800-56C-R2'] },
      { algorithms: ['AES'], status: 'published', proofRefs: ['NIST-SP-800-56C-R2'] },
    ],
    cycloneDxPrimitive: 'kdf',
    proofRefs: ['RFC 5869', 'NIST-SP-800-56C-R2', 'NIST-SP-800-185'],
    explain: {
      plain:
        'A key derivation function turns a shared secret into the actual keys a protocol uses, mixing in context so that different uses get different keys. HKDF, the NIST SP 800-56C methods and KMAC are common examples.',
      whyItMattersForPqc:
        'It stays: hybrid schemes rely on it to combine the classical and post-quantum secrets into one key.',
      diagram: {
        inputs: ['shared secret', 'context information'],
        combiner: 'hash- or MAC-based derivation',
        outputs: ['derived keys'],
      },
    },
  },
  {
    id: 'MAC',
    label: 'Message authentication codes (HMAC, CMAC, GMAC, KMAC)',
    outlook: 'stays-both',
    classical: [
      { algorithms: ['SHA'], status: 'published', proofRefs: ['NIST-SP-800-185'] },
      {
        algorithms: ['AES'],
        status: 'published',
        proofRefs: [
          'NIST-SP-800-38B-Recommendation-for-Block-Cipher-Modes-of-Ope',
          'NIST-SP-800-38D',
        ],
      },
    ],
    pqc: [
      { algorithms: ['SHA'], status: 'published', proofRefs: ['NIST-SP-800-185'] },
      {
        algorithms: ['AES'],
        status: 'published',
        proofRefs: [
          'NIST-SP-800-38B-Recommendation-for-Block-Cipher-Modes-of-Ope',
          'NIST-SP-800-38D',
        ],
      },
    ],
    cycloneDxPrimitive: 'mac',
    proofRefs: [
      'FIPS-198-1',
      'NIST-SP-800-38B-Recommendation-for-Block-Cipher-Modes-of-Ope',
      'NIST-SP-800-38D',
      'NIST-SP-800-185',
    ],
    explain: {
      plain:
        'A MAC is a short tag computed with a shared secret key that proves a message came from someone holding the key and was not changed. HMAC uses a hash function; CMAC and GMAC use a block cipher such as AES.',
      whyItMattersForPqc:
        'It is symmetric, so it stays; the question is key length, not the construction.',
      diagram: {
        inputs: ['shared key', 'message'],
        combiner: 'keyed hash or cipher',
        outputs: ['authentication tag'],
      },
    },
  },
  {
    id: 'AEAD',
    label: 'Authenticated encryption (AES-GCM, ChaCha20-Poly1305, Ascon)',
    outlook: 'stays-both',
    classical: [
      { algorithms: ['AES'], status: 'published', proofRefs: ['NIST-SP-800-38D'] },
      {
        algorithms: ['ChaCha20'],
        status: 'published',
        proofRefs: ['ChaCha20-and-Poly1305-for-IETF-Protocols'],
      },
      { algorithms: ['Ascon'], status: 'published', proofRefs: ['NIST-SP-800-232'] },
    ],
    pqc: [
      { algorithms: ['AES'], status: 'published', proofRefs: ['NIST-SP-800-38D'] },
      {
        algorithms: ['ChaCha20'],
        status: 'published',
        proofRefs: ['ChaCha20-and-Poly1305-for-IETF-Protocols'],
      },
      { algorithms: ['Ascon'], status: 'published', proofRefs: ['NIST-SP-800-232'] },
    ],
    cycloneDxPrimitive: 'ae',
    proofRefs: ['NIST-SP-800-38D', 'ChaCha20-and-Poly1305-for-IETF-Protocols', 'NIST-SP-800-232'],
    explain: {
      plain:
        'Authenticated encryption keeps data secret and detects any change to it in one step. AES-GCM and ChaCha20-Poly1305 are the common choices; Ascon is NIST’s lightweight option for small devices.',
      whyItMattersForPqc:
        'It stays: post-quantum work changes how the key is agreed, not how the data is then encrypted.',
      diagram: {
        inputs: ['key', 'nonce', 'data'],
        combiner: 'encrypt and authenticate',
        outputs: ['ciphertext + tag'],
      },
    },
  },
  {
    id: 'DRBG',
    label: 'Deterministic random bit generators (SP 800-90A)',
    outlook: 'stays-both',
    classical: [
      { algorithms: ['AES'], status: 'published', proofRefs: ['NIST-SP-800-90A-R1'] },
      { algorithms: ['SHA'], status: 'published', proofRefs: ['NIST-SP-800-90A-R1'] },
    ],
    pqc: [
      { algorithms: ['AES'], status: 'published', proofRefs: ['NIST-SP-800-90A-R1'] },
      { algorithms: ['SHA'], status: 'published', proofRefs: ['NIST-SP-800-90A-R1'] },
    ],
    cycloneDxPrimitive: 'drbg',
    proofRefs: ['NIST-SP-800-90A-R1', 'NIST-SP-800-90C'],
    explain: {
      plain:
        'A DRBG stretches a small amount of true randomness (entropy) into the stream of random numbers keys are made from. NIST SP 800-90A defines CTR_DRBG (AES), Hash_DRBG and HMAC_DRBG.',
      whyItMattersForPqc:
        'It stays; every post-quantum key generation draws on it, so its quality matters as much as ever.',
      diagram: {
        inputs: ['entropy input', 'nonce'],
        combiner: 'AES- or hash-based generator',
        outputs: ['random bits'],
      },
    },
  },
  {
    id: 'Merkle-Tree-Cert',
    label: 'Merkle tree certificates',
    outlook: 'stays-both',
    classical: [
      {
        algorithms: ['ECDSA'],
        status: 'draft',
        proofRefs: ['draft-ietf-plants-merkle-tree-certs'],
      },
    ],
    pqc: [
      {
        algorithms: ['ML-DSA'],
        status: 'draft',
        proofRefs: ['draft-ietf-plants-merkle-tree-certs'],
      },
    ],
    cycloneDxPrimitive: 'other',
    otherReason: 'A certificate format, not a single algorithm primitive.',
    proofRefs: ['draft-ietf-plants-merkle-tree-certs'],
    explain: {
      plain:
        'Instead of signing every certificate separately, a certificate authority signs a batch at once by signing the root of a Merkle tree; each certificate then carries a short proof that it is in the tree.',
      whyItMattersForPqc:
        'Post-quantum signatures are large, so signing many certificates with one signature keeps the extra size off every connection.',
      diagram: {
        inputs: ['batch of certificates'],
        combiner: 'Merkle tree + one signature on the root',
        outputs: ['certificate + inclusion proof'],
      },
    },
  },
  {
    id: 'Hybrid-Cert',
    label: 'Hybrid certificates (Chameleon)',
    outlook: 'bridge',
    hybrid: [
      {
        algorithms: ['ML-DSA', 'ECDSA'],
        status: 'draft',
        proofRefs: ['draft-bonnell-lamps-chameleon-certs-07'],
      },
    ],
    cycloneDxPrimitive: 'other',
    otherReason: 'A certificate format, not a single algorithm primitive.',
    proofRefs: ['draft-bonnell-lamps-chameleon-certs-07'],
    explain: {
      plain:
        'A Chameleon certificate packs a second, related certificate inside the first, so one file can be read as either a classical or a post-quantum certificate depending on what the relying party understands.',
      whyItMattersForPqc:
        'It lets one certificate serve old and new clients during the transition, without running two parallel PKIs.',
      glossaryTerm: 'Chameleon Certificate',
      diagram: {
        inputs: ['classical certificate', 'post-quantum certificate'],
        combiner: 'embed the difference (delta)',
        outputs: ['one paired certificate'],
      },
    },
  },

  // ── Industry-specific (group 3) ───────────────────────────────────────
  {
    id: 'Key-Block',
    label: 'Payment key blocks',
    outlook: 'stays-both',
    classical: [
      {
        algorithms: ['3DES'],
        status: 'published',
        proofRefs: ['PCI-SSC-Key-Blocks-101-104-AES-TDES-key-management'],
      },
      {
        algorithms: ['AES'],
        status: 'published',
        proofRefs: ['PCI-SSC-Key-Blocks-101-104-AES-TDES-key-management'],
      },
    ],
    pqc: [
      {
        algorithms: ['AES'],
        status: 'published',
        proofRefs: ['PCI-SSC-Key-Blocks-101-104-AES-TDES-key-management'],
      },
    ],
    cycloneDxPrimitive: 'key-wrap',
    proofRefs: ['PCI-SSC-Key-Blocks-101-104-AES-TDES-key-management'],
    explain: {
      plain:
        'In payments, keys travel between devices inside a key block: the key is encrypted together with a header that says what the key may be used for, and the whole block is protected against changes.',
      whyItMattersForPqc:
        'Key blocks are symmetric and work with TDES or AES keys, so quantum computers do not change how they work.',
      diagram: {
        inputs: ['key-block protection key', 'key + usage header'],
        combiner: 'encrypt and authenticate',
        outputs: ['key block'],
      },
    },
  },
  {
    id: '3GPP-AKA',
    label: '3GPP authentication and key agreement (MILENAGE)',
    outlook: 'stays-both',
    classical: [
      {
        algorithms: ['AES'],
        status: 'published',
        proofRefs: ['Specification-of-the-MILENAGE-algorithm-set-An-example-algor'],
      },
    ],
    pqc: [
      {
        algorithms: ['AES'],
        status: 'study',
        proofRefs: ['3GPP-Post-Quantum-Cryptography-SA3-Overview'],
        note: '3GPP is specifying 256-bit algorithm sets, because Grover’s algorithm reduces the effective strength of symmetric keys.',
      },
    ],
    cycloneDxPrimitive: 'mac',
    proofRefs: [
      'Specification-of-the-MILENAGE-algorithm-set-An-example-algor',
      '3GPP-Post-Quantum-Cryptography-SA3-Overview',
    ],
    explain: {
      plain:
        'When a phone joins a mobile network, the SIM and the operator prove to each other that they share the same secret key and derive session keys from it. MILENAGE is the example algorithm set for this, built on the Rijndael (AES) block cipher.',
      whyItMattersForPqc:
        'It uses only symmetric cryptography, so it is not broken by Shor’s algorithm; 3GPP is adding 256-bit algorithm sets for extra margin against Grover’s algorithm.',
      glossaryTerm: 'MILENAGE',
      diagram: {
        inputs: ['shared subscriber key', 'network challenge'],
        combiner: 'MILENAGE functions',
        outputs: ['response', 'session keys'],
      },
    },
  },
  {
    id: 'Cardano-KES',
    label: 'Key-evolving signatures (Cardano KES)',
    outlook: 'no-successor-yet',
    classical: [
      {
        algorithms: ['EdDSA'],
        status: 'vendor-spec',
        proofRefs: ['input-output-hk-kes-Cardano-Key-Evolving-Signatures-Sum6Kes'],
      },
    ],
    noSuccessorCheckedOn: '2026-11-13',
    noSuccessorReason:
      'As of 13 Nov 2026 the cited KES implementation is Ed25519-based, and we found no specified post-quantum key-evolving signature for it.',
    cycloneDxPrimitive: 'signature',
    proofRefs: ['input-output-hk-kes-Cardano-Key-Evolving-Signatures-Sum6Kes'],
    explain: {
      plain:
        'Cardano block producers sign with keys that evolve over time: after each period the old key is erased, so a key stolen later cannot forge blocks from earlier periods.',
      whyItMattersForPqc:
        'It is built on Ed25519, which a quantum computer breaks; we found no specified post-quantum version (checked 13 Nov 2026).',
      diagram: {
        inputs: ['current period key', 'block'],
        combiner: 'sign, then evolve and erase',
        outputs: ['block signature', 'next period key'],
      },
    },
  },
  {
    id: 'eMRTD-Auth',
    label: 'ePassport chip protocols (PACE, Chip and Active Authentication)',
    outlook: 'stays-both',
    classical: [
      {
        algorithms: ['ECDH', 'ECDSA', 'AES'],
        status: 'published',
        proofRefs: ['ICAO-Doc-9303-Part-11-Security-Mechanisms-for-MRTDs'],
      },
      {
        algorithms: ['FFDH', 'RSA-sig', 'AES'],
        status: 'published',
        proofRefs: ['ICAO-Doc-9303-Part-11-Security-Mechanisms-for-MRTDs'],
      },
    ],
    pqc: [
      {
        algorithms: ['ML-KEM', 'ML-DSA'],
        status: 'study',
        proofRefs: ['ICAO-TAG-TRIP-5-WP-18'],
        note: 'ICAO working paper comparing post-quantum options for the chip; no post-quantum protocol is specified yet.',
      },
    ],
    cycloneDxPrimitive: 'key-agree',
    proofRefs: ['ICAO-Doc-9303-Part-11-Security-Mechanisms-for-MRTDs'],
    explain: {
      plain:
        'An ePassport chip sets up an encrypted channel with the inspection system (PACE) and proves it is a genuine, not a cloned, chip (Chip Authentication or Active Authentication).',
      whyItMattersForPqc:
        'Passports stay valid for years; an ICAO working paper reviews post-quantum options for these protocols and recommends starting work on them.',
      diagram: {
        inputs: ['access code from the passport', 'chip keys'],
        combiner: 'key agreement + chip proof',
        outputs: ['secure channel', 'genuine-chip proof'],
      },
    },
  },
  {
    id: 'SLH-DSA-MTL',
    label: 'SLH-DSA in Merkle Tree Ladder mode (DNSSEC)',
    outlook: 'pqc-native',
    pqc: [
      {
        algorithms: ['SLH-DSA'],
        status: 'draft',
        proofRefs: ['draft-fregly-dnsop-slh-dsa-mtl-dnssec-06'],
        note: 'Individual Internet-Draft; version -06 expired in October 2026.',
      },
    ],
    cycloneDxPrimitive: 'signature',
    proofRefs: ['draft-fregly-dnsop-slh-dsa-mtl-dnssec-06'],
    explain: {
      plain:
        'Merkle Tree Ladder mode lets one SLH-DSA signature cover many DNS records at once; each record then carries a small proof instead of a full post-quantum signature.',
      whyItMattersForPqc:
        'SLH-DSA signatures are large, and DNS responses must stay small, so this mode makes hash-based signatures practical for DNSSEC.',
      diagram: {
        inputs: ['many DNS records'],
        combiner: 'Merkle ladder + one SLH-DSA signature',
        outputs: ['record + short proof'],
      },
    },
  },
  {
    id: 'Rosenpass',
    label: 'Rosenpass (post-quantum key exchange beside WireGuard)',
    outlook: 'bridge',
    hybrid: [
      {
        algorithms: ['Classic-McEliece', 'ML-KEM'],
        status: 'research',
        proofRefs: ['Rosenpass-Protocol'],
        note: 'Uses Classic McEliece and round-3 Kyber (the pre-FIPS 203 version of ML-KEM), and feeds the result to WireGuard as a preshared key; WireGuard’s own classical exchange is the other half.',
      },
    ],
    cycloneDxPrimitive: 'kem',
    proofRefs: ['Rosenpass-Protocol'],
    explain: {
      plain:
        'Rosenpass runs a separate post-quantum key exchange next to a WireGuard VPN and hands the resulting secret to WireGuard as its preshared key.',
      whyItMattersForPqc:
        'The VPN tunnel becomes resistant to harvest-now, decrypt-later attacks without changing WireGuard itself.',
      diagram: {
        inputs: ['Classic McEliece exchange', 'Kyber exchange'],
        combiner: 'combine into a preshared key',
        outputs: ['WireGuard preshared key'],
      },
    },
  },
  // ── Group 4: constructions whose proofs are added to the Library with them ──
  {
    id: 'Threshold-Sig',
    label: 'Threshold signatures (FROST)',
    outlook: 'stays-both',
    classical: [
      {
        algorithms: ['Schnorr'],
        status: 'published',
        proofRefs: ['RFC-9591-The-Flexible-Round-Optimized-Schnorr-Threshold-FROS'],
      },
      {
        algorithms: ['EdDSA'],
        status: 'published',
        proofRefs: ['RFC-9591-The-Flexible-Round-Optimized-Schnorr-Threshold-FROS'],
      },
    ],
    pqc: [
      {
        algorithms: ['ML-DSA'],
        status: 'research',
        proofRefs: ['Efficient-Threshold-ML-DSA-Brave'],
        note: 'Threshold ML-DSA is research; NIST has an open call for multi-party threshold schemes (IR 8214C).',
      },
    ],
    cycloneDxPrimitive: 'signature',
    proofRefs: [
      'RFC-9591-The-Flexible-Round-Optimized-Schnorr-Threshold-FROS',
      'NIST-IR-8214C-NIST-First-Call-for-Multi-Party-Threshold-Sche',
    ],
    explain: {
      plain:
        'In a threshold signature, a key is split among several parties and any agreed number of them can sign together, while no single party ever holds the whole key. FROST does this in two rounds for Schnorr signatures.',
      whyItMattersForPqc:
        'The classical schemes rest on elliptic curves; post-quantum threshold signing, for example with ML-DSA, is still research, and NIST has an open call for threshold schemes.',
      diagram: {
        inputs: ['message', 'key shares held by several signers'],
        combiner: 'two signing rounds',
        outputs: ['one ordinary signature'],
      },
    },
  },
  {
    id: 'ECVRF',
    label: 'Verifiable random functions (ECVRF)',
    outlook: 'no-successor-yet',
    classical: [
      {
        algorithms: ['EdDSA'],
        status: 'published',
        proofRefs: [
          'RFC-9381-Verifiable-Random-Functions-VRFs',
          'Cardano-cardano-crypto-praos-VRF-suite-ECVRF-ED25519-SHA512',
        ],
      },
    ],
    noSuccessorReason:
      'As of 13 Nov 2026 the VRFs in RFC 9381 are elliptic-curve and RSA based, and we found no standardised post-quantum VRF.',
    noSuccessorCheckedOn: '2026-11-13',
    cycloneDxPrimitive: 'other',
    otherReason: 'CycloneDX 1.7 has no verifiable-random-function primitive.',
    proofRefs: ['RFC-9381-Verifiable-Random-Functions-VRFs'],
    explain: {
      plain:
        'A verifiable random function turns an input into a random-looking output that only the key holder can compute, plus a proof anyone can check. Cardano uses one to pick who produces the next block.',
      whyItMattersForPqc:
        'The standard VRFs use elliptic curves or RSA, which a quantum computer breaks; we found no standardised post-quantum VRF (checked 13 Nov 2026).',
      diagram: {
        inputs: ['secret key', 'input'],
        combiner: 'VRF evaluation',
        outputs: ['random output', 'proof'],
      },
    },
  },
  {
    id: 'OPRF-PrivacyPass',
    label: 'Privacy Pass tokens (OPRF, blind RSA)',
    outlook: 'no-successor-yet',
    classical: [
      {
        algorithms: [],
        status: 'published',
        proofRefs: [
          'RFC-9497-Oblivious-Pseudorandom-Functions-OPRFs-Using-Prime',
          'RFC-9578-Privacy-Pass-Issuance-Protocols',
        ],
        note: 'VOPRF over the P-384 group.',
      },
      {
        algorithms: ['RSA-sig'],
        status: 'published',
        proofRefs: ['RFC-9474-RSA-Blind-Signatures', 'RFC-9578-Privacy-Pass-Issuance-Protocols'],
      },
    ],
    noSuccessorReason:
      'As of 13 Nov 2026 the standardised token types use an elliptic-curve OPRF or blind RSA, and we found no standardised post-quantum token type.',
    noSuccessorCheckedOn: '2026-11-13',
    cycloneDxPrimitive: 'other',
    otherReason: 'CycloneDX 1.7 has no OPRF or blind-signature primitive.',
    proofRefs: [
      'RFC-9576-The-Privacy-Pass-Architecture',
      'RFC-9578-Privacy-Pass-Issuance-Protocols',
    ],
    explain: {
      plain:
        'Privacy Pass lets a website check that a visitor passed a test, such as a CAPTCHA, earlier, without learning who they are: the visitor redeems an anonymous token issued with an oblivious function or a blind signature.',
      whyItMattersForPqc:
        'Both token types rest on elliptic curves or RSA, and we found no standardised post-quantum version (checked 13 Nov 2026).',
      diagram: {
        inputs: ['blinded token request'],
        combiner: 'issuer evaluates or blind-signs',
        outputs: ['unlinkable token'],
      },
    },
  },
  {
    id: 'Secret-Sharing',
    label: 'Secret sharing (Shamir)',
    outlook: 'stays-both',
    classical: [
      {
        algorithms: [],
        status: 'published',
        proofRefs: ['NIST-IR-8214C-NIST-First-Call-for-Multi-Party-Threshold-Sche'],
      },
    ],
    pqc: [
      {
        algorithms: [],
        status: 'published',
        proofRefs: ['NIST-IR-8214C-NIST-First-Call-for-Multi-Party-Threshold-Sche'],
      },
    ],
    cycloneDxPrimitive: 'other',
    otherReason: 'CycloneDX 1.7 has no secret-sharing primitive.',
    proofRefs: ['NIST-IR-8214C-NIST-First-Call-for-Multi-Party-Threshold-Sche'],
    explain: {
      plain:
        'Secret sharing splits a secret, such as a master key, into shares so that any agreed number of them can rebuild it while fewer reveal nothing. Custody providers and HSM backups use it.',
      whyItMattersForPqc:
        'Shamir’s scheme does not rely on a hard mathematical problem, so a quantum computer gives an attacker with too few shares no advantage.',
      diagram: {
        inputs: ['secret', 'threshold'],
        combiner: 'split into shares',
        outputs: ['shares held by different parties'],
      },
    },
  },
  {
    id: 'WireGuard-Noise',
    label: 'WireGuard handshake (Noise IKpsk2)',
    outlook: 'extended',
    classical: [
      {
        algorithms: ['X25519'],
        status: 'published',
        proofRefs: ['Post-quantum-WireGuard-IACR-ePrint-2020-379'],
      },
    ],
    successions: [
      {
        to: 'Rosenpass',
        relation: 'extended-by',
        stated: true,
        context: 'WireGuard VPNs',
        status: 'research',
        proofRefs: ['Rosenpass-Protocol'],
      },
    ],
    cycloneDxPrimitive: 'key-agree',
    proofRefs: ['Post-quantum-WireGuard-IACR-ePrint-2020-379'],
    explain: {
      plain:
        'WireGuard sets up its VPN keys with a short handshake built from the Noise framework, using X25519 key exchanges and an optional preshared key.',
      whyItMattersForPqc:
        'X25519 is broken by a quantum computer; Rosenpass keeps WireGuard and feeds it a post-quantum preshared key, and research such as PQ-WireGuard replaces the exchanges with KEMs.',
      diagram: {
        inputs: ['static and ephemeral keys', 'optional preshared key'],
        combiner: 'Noise IKpsk2 handshake',
        outputs: ['tunnel keys'],
      },
    },
  },
  {
    id: 'PQ-Noise',
    label: 'Post-quantum Noise handshakes',
    outlook: 'pqc-native',
    pqc: [
      {
        algorithms: ['ML-KEM'],
        status: 'research',
        proofRefs: ['Post-Quantum-Noise-IACR-ePrint-2022-539'],
        note: 'Research: the paper replaces Diffie-Hellman in Noise patterns with KEMs and instantiates them with Kyber, the pre-FIPS 203 version of ML-KEM.',
      },
    ],
    cycloneDxPrimitive: 'key-agree',
    proofRefs: ['Post-Quantum-Noise-IACR-ePrint-2022-539'],
    explain: {
      plain:
        'Post-quantum Noise rewrites the Noise handshake patterns, used by WireGuard and messaging apps, so that every Diffie-Hellman step becomes a KEM step.',
      whyItMattersForPqc:
        'It shows how protocols built on Noise could become fully post-quantum, beyond adding a preshared key; it is research, not a standard.',
      diagram: {
        inputs: ['KEM public keys'],
        combiner: 'KEM-based handshake pattern',
        outputs: ['session keys'],
      },
    },
  },
]

const byId = new Map(CRYPTO_CONSTRUCTIONS.map((c) => [c.id, c]))

const byLowerId = new Map(CRYPTO_CONSTRUCTIONS.map((c) => [c.id.toLowerCase(), c]))

export function getConstruction(id: string): CryptoConstruction | undefined {
  return byId.get(id)
}

/** Deep-link lookup: case-insensitive, like ?usecase= and ?standard=. */
export function findConstruction(id: string): CryptoConstruction | undefined {
  return byLowerId.get(id.trim().toLowerCase())
}

export function isKnownConstruction(id: string): boolean {
  return byId.has(id)
}

/** Every instantiation of a construction, with the side it belongs to. */
export function instantiationsOf(
  c: CryptoConstruction
): { side: 'classical' | 'pqc' | 'hybrid'; inst: Instantiation }[] {
  return [
    ...(c.classical ?? []).map((inst) => ({ side: 'classical' as const, inst })),
    ...(c.pqc ?? []).map((inst) => ({ side: 'pqc' as const, inst })),
    ...(c.hybrid ?? []).map((inst) => ({ side: 'hybrid' as const, inst })),
  ]
}

/** The algorithm families a construction uses (union over its instantiations). */
export function algorithmsOf(c: CryptoConstruction): string[] {
  return [...new Set(instantiationsOf(c).flatMap((x) => x.inst.algorithms))]
}

/** Constructions that name `id` as a successor. */
export function predecessorsOf(id: string): CryptoConstruction[] {
  return CRYPTO_CONSTRUCTIONS.filter((c) => c.successions?.some((s) => s.to === id))
}

/** Constructions built from an algorithm family (for the algorithm card). */
export function constructionsUsingAlgorithm(family: string): CryptoConstruction[] {
  return CRYPTO_CONSTRUCTIONS.filter((c) => algorithmsOf(c).includes(family))
}

/** Constructions whose `builtOn` names `id` (they contain it). */
export function containersOf(id: string): CryptoConstruction[] {
  return CRYPTO_CONSTRUCTIONS.filter((c) => c.builtOn?.includes(id))
}

/** Outlook order used for grouping chips and the transition map. */
export const PQC_OUTLOOK_ORDER: PqcOutlook[] = [
  'stays-both',
  'extended',
  'replaced',
  'bridge',
  'pqc-native',
  'no-successor-yet',
]

/**
 * Hybrid instantiations whose classical half is not an algorithm family (a
 * whole classical session, a PAKE, or another protocol), with the reason (K4).
 */
export const HYBRID_CLASSICAL_HALF_ELSEWHERE: Record<string, string> = {
  'MLS-PQ-Combiner': 'The classical half is a traditional MLS session with its own cipher suite.',
  'Hybrid-PAKE': 'The classical half is the CPace password-authenticated key exchange.',
  Rosenpass:
    'The classical half is WireGuard’s own key exchange, which receives the preshared key.',
}

/** Construction ids allowed an empty algorithm list, with the reason (K2). */
export const NO_FAMILY_EXEMPT: Record<string, string> = {
  'OPRF-PrivacyPass':
    'The VOPRF token type works over the P-384 group, which the algorithm vocabulary has no family for.',
  'Secret-Sharing':
    'Shamir secret sharing is information-theoretic: it uses no public-key algorithm family.',
  'IKEv2-PPK':
    'Mixes a preshared key through the PRF that IKEv2 negotiates; it adds no algorithm family of its own.',
}
