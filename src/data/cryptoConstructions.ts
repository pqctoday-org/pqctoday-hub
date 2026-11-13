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

export const PQC_OUTLOOK_LABEL: Record<PqcOutlook, string> = {
  'stays-both': 'Stays: works with classical and PQC',
  replaced: 'Being replaced',
  bridge: 'Hybrid bridge',
  'pqc-native': 'New for PQC',
  'no-successor-yet': 'No PQC successor yet',
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
  /** Required when outlook is 'replaced'. */
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
        context: 'general public-key encryption',
        status: 'published',
        proofRefs: ['RFC 9180'],
      },
      {
        to: 'PQ-SUCI-Profile',
        context: '5G subscriber privacy (SUCI)',
        status: 'research',
        proofRefs: ['PQ-SUCI-MLKEM-Profile-C-2025'],
      },
    ],
    cycloneDxPrimitive: 'pke',
    proofRefs: ['SEC 1'],
    explain: {
      plain:
        'ECIES lets anyone encrypt a message for a recipient using only the recipient’s public key. The sender makes a one-time elliptic-curve key, combines it with the recipient’s key to get a shared secret, and uses that secret to encrypt the message. 5G phones use it to hide the subscriber’s permanent identity (SUCI).',
      analogy:
        'A drop box that anyone can lock with the owner’s padlock, but only the owner can open.',
      whyItMattersForPqc:
        'Its key agreement is elliptic-curve Diffie-Hellman, which a quantum computer breaks, so it has to give way to a KEM-based scheme such as HPKE with ML-KEM, or a post-quantum SUCI profile (still research in 3GPP).',
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
    classical: [{ algorithms: ['X25519', 'ECDH'], status: 'published', proofRefs: ['RFC 9180'] }],
    pqc: [{ algorithms: ['ML-KEM'], status: 'draft', proofRefs: ['draft-ietf-hpke-pq'] }],
    hybrid: [
      { algorithms: ['X25519', 'ML-KEM'], status: 'draft', proofRefs: ['draft-ietf-hpke-pq'] },
    ],
    cycloneDxPrimitive: 'pke',
    proofRefs: ['RFC 9180', 'draft-ietf-hpke-pq'],
    explain: {
      plain:
        'HPKE is a standard recipe for encrypting data to someone’s public key. It is built from three swappable parts: a key encapsulation mechanism (KEM), a key derivation function and an authenticated cipher. MLS group messaging and other protocols use it.',
      analogy: 'A standard envelope whose lock can be swapped without redesigning the envelope.',
      whyItMattersForPqc:
        'HPKE itself stays: it was designed around a KEM, so moving to post-quantum means plugging in ML-KEM or a hybrid KEM, which a draft standard defines.',
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
    cycloneDxPrimitive: 'combiner',
    proofRefs: ['RFC-10024', 'NIST SP 800-227'],
    explain: {
      plain:
        'A hybrid key exchange runs a classical exchange (such as X25519) and ML-KEM side by side and mixes both results into one key. TLS 1.3 defines named groups for this, such as X25519MLKEM768.',
      analogy: 'A door with two different locks: a thief must pick both to get in.',
      whyItMattersForPqc:
        'It is how most web traffic is getting quantum-resistant key exchange today: the key stays safe if either the classical or the post-quantum part holds.',
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
        algorithms: ['X25519', 'FFDH', 'ML-KEM'],
        status: 'draft',
        proofRefs: ['RFC 9370', 'draft-ietf-ipsecme-ikev2-mlkem-09'],
        note: 'RFC 9370 (published) defines the additional key exchanges next to the Diffie-Hellman exchange; ML-KEM as an additional exchange is a draft.',
      },
    ],
    cycloneDxPrimitive: 'key-agree',
    proofRefs: ['RFC 9370'],
    explain: {
      plain:
        'IKEv2, the key exchange behind IPsec VPNs, can run several key exchanges in a row and mix all of them into the session keys. RFC 9370 defines this so a post-quantum KEM can be added next to the classical Diffie-Hellman exchange.',
      whyItMattersForPqc:
        'It is the IPsec path to hybrid post-quantum key exchange: the classical exchange stays and ML-KEM is added as an extra round.',
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
    outlook: 'stays-both',
    classical: [{ algorithms: [], status: 'published', proofRefs: ['RFC 8784'] }],
    pqc: [{ algorithms: [], status: 'published', proofRefs: ['RFC 8784'] }],
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
        algorithms: ['X25519', 'ML-KEM'],
        status: 'draft',
        proofRefs: ['draft-ietf-mls-pq-ciphersuites-07'],
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
        'Post-quantum KEM keys and ciphertexts can be smaller than post-quantum signatures, so this idea only makes sense because of PQC.',
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
        note: 'The classical half is the PAKE group named by the paper.',
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
        'A composite signature puts an ML-DSA signature and a classical signature (RSA, ECDSA or EdDSA) together under one key and one algorithm identifier. A verifier accepts it only if both signatures check out.',
      analogy: 'One document carrying two different seals; it counts only if both are intact.',
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
        'RSA key transport is broken by a quantum computer, so CMS adds a KEM recipient type that works with ML-KEM.',
      diagram: {
        inputs: ['recipient RSA public key', 'message key'],
        combiner: 'RSA encryption',
        outputs: ['wrapped message key'],
      },
    },
  },
  {
    id: 'KeyAgree-Recipient',
    label: 'Key agreement recipient (CMS KeyAgreeRecipientInfo, JOSE/COSE ECDH-ES)',
    outlook: 'replaced',
    classical: [{ algorithms: ['ECDH'], status: 'published', proofRefs: ['RFC 7518'] }],
    successions: [
      {
        to: 'KEM-Recipient',
        context: 'CMS / S/MIME',
        status: 'published',
        proofRefs: ['RFC 9629'],
      },
    ],
    cycloneDxPrimitive: 'key-agree',
    proofRefs: ['RFC 5652', 'RFC 7518'],
    explain: {
      plain:
        'The sender agrees a shared secret with the recipient’s elliptic-curve key, derives a key-encryption key from it, and uses that to wrap the message key. CMS calls this KeyAgreeRecipientInfo; JOSE and COSE call it ECDH-ES.',
      whyItMattersForPqc:
        'Elliptic-curve Diffie-Hellman is broken by a quantum computer; the KEM recipient type replaces it in CMS.',
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
    outlook: 'replaced',
    classical: [
      { algorithms: ['X25519'], status: 'vendor-spec', proofRefs: ['Signal-PQXDH-Spec'] },
    ],
    successions: [
      { to: 'PQXDH', context: 'Signal', status: 'vendor-spec', proofRefs: ['Signal-PQXDH-Spec'] },
    ],
    cycloneDxPrimitive: 'key-agree',
    proofRefs: ['Signal-PQXDH-Spec'],
    explain: {
      plain:
        'X3DH is how Signal sets up a shared key between two people even when one of them is offline, using several Diffie-Hellman exchanges over published keys.',
      whyItMattersForPqc:
        'Recorded first messages could be decrypted later by a quantum computer, so Signal moved to PQXDH, which adds a post-quantum KEM.',
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
    outlook: 'replaced',
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
        'Its ongoing key refresh uses elliptic-curve Diffie-Hellman; Signal’s SPQR adds a post-quantum ratchet next to it.',
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
    cycloneDxPrimitive: 'kem',
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
]

const byId = new Map(CRYPTO_CONSTRUCTIONS.map((c) => [c.id, c]))

export function getConstruction(id: string): CryptoConstruction | undefined {
  return byId.get(id)
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
  'replaced',
  'bridge',
  'pqc-native',
  'no-successor-yet',
]

/** Construction ids allowed an empty algorithm list, with the reason (K2). */
export const NO_FAMILY_EXEMPT: Record<string, string> = {
  'IKEv2-PPK':
    'Mixes a preshared key through the PRF that IKEv2 negotiates; it adds no algorithm family of its own.',
}
