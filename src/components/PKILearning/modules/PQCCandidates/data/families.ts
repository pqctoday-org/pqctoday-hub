// SPDX-License-Identifier: GPL-3.0-only
/**
 * The four mathematical families represented in the NIST signature on-ramp
 * Round 2 → Round 3 selection. Each entry summarises the hardness assumption,
 * the historical pedigree, the case for advancement, and the open concerns
 * flagged by NIST IR 8528.
 */

export type FamilyId = 'mpcith' | 'multivariate' | 'isogeny' | 'lattice'

export interface MathFamily {
  id: FamilyId
  label: string
  /** One-line tagline rendered in cards */
  tagline: string
  /** Underlying hardness assumption(s) */
  hardness: string
  /** Why NIST kept candidates in this family despite known concerns */
  whyKept: string
  /** Open problems / risks flagged by NIST or community cryptanalysis */
  openConcerns: string
  /** Candidate IDs (matches candidates.ts) belonging to this family */
  candidateIds: string[]
  /** Semantic colour token used across visualisers and tables */
  colorClass: string
  /** Border-token variant for cards */
  borderClass: string
  /** Background-token variant for badges */
  bgClass: string
  /**
   * Plain-English mini-explainer — three short paragraphs in the same
   * conversational tone as curious-summary.md. Renders inline above the
   * technical SVG so non-experts get the metaphor first.
   */
  layman: {
    /** Everyday analogy that captures the core mechanism */
    analogy: string
    /** What sets this family apart from the other three on the table */
    whatsDifferent: string
    /** The honest catch / tradeoff in plain words */
    catch: string
  }
}

export const FAMILIES: Record<FamilyId, MathFamily> = {
  mpcith: {
    id: 'mpcith',
    label: 'MPC-in-the-Head',
    tagline: 'Prove knowledge by simulating a multi-party computation inside a hash transcript.',
    hardness:
      'Security reduces to symmetric primitives (AES, hash functions) or well-studied combinatorial problems (syndrome decoding, MQ). No novel number-theoretic assumptions required.',
    whyKept:
      'Three candidates kept to cover the strongest security foundations: FAEST (AES), SDitH (coding theory, studied since 1970s), MQOM (MQ, best performance of MPCitH category).',
    openConcerns:
      'Signatures are inherently large (kilobytes) because they encode a simulated-computation transcript. MQOM still needs further QROM proof maturation.',
    candidateIds: ['faest', 'mqom', 'sdith'],
    colorClass: 'text-status-success',
    borderClass: 'border-status-success/40',
    bgClass: 'bg-status-success/10',
    layman: {
      analogy:
        "Imagine you want to prove you know a secret password without ever saying it out loud. You split the password into four pieces, hand each piece to a different friend, ask each of them to do a calculation, and have them seal their answers in envelopes. A random challenge then picks three of the four envelopes to open. If the opened answers are consistent with each other, I'm convinced you know the real password — and the one envelope I never opened keeps the secret safe.",
      whatsDifferent:
        'This family is built entirely from cryptographic tools we already trust deeply — AES (the same cipher protecting your Wi-Fi) and hash functions. No exotic new math, just clever use of old reliable bricks. That makes it the most conservative bet of the four families: if these schemes break, a lot of other cryptography breaks first.',
      catch:
        'Signatures are pretty chunky — kilobytes, not bytes — because you have to send all those envelope contents along. Fine for desktops and servers; awkward for tiny sensors where every byte costs battery.',
    },
  },
  multivariate: {
    id: 'multivariate',
    label: 'Multivariate',
    tagline: 'Hidden-structure quadratic systems — tiny signatures, big public keys.',
    hardness:
      'Inverting a system of multivariate quadratic polynomials with a trapdoor (Oil and Vinegar, introduced 1999). Hardness rests on the MQ problem and the secrecy of the oil/vinegar partition.',
    whyKept:
      'Potentially smallest signatures of any PQC family (~96–838 B). SNOVA odd-characteristic reparameterisation reaches sub-FN-DSA combined sizes. No attack has broken the underlying UOV construction itself.',
    openConcerns:
      "The 2025 Ran wedge attack and the Furue–Ikematsu small-field attack each pushed 3 of UOV's 4 parameter sets below their security targets, hit MAYO-2 by ~30 bits, and broke most SNOVA parameter sets. QR-UOV (odd characteristic) survived unscathed.",
    candidateIds: ['uov', 'mayo', 'qr-uov', 'snova'],
    colorClass: 'text-status-warning',
    borderClass: 'border-status-warning/40',
    bgClass: 'bg-status-warning/10',
    layman: {
      analogy:
        'Imagine a giant puzzle made of quadratic equations. To anyone without the secret shortcut, solving it would take longer than the universe has existed. But the signer knows a hidden trick: pick random values for half the puzzle (called the "vinegar"), and the other half (the "oil") collapses into simple linear math you can solve in milliseconds. The verifier sees only the public puzzle template — which looks impenetrably random — and has no idea where the shortcut hides.',
      whatsDifferent:
        'This family produces the smallest signatures of any candidate in the contest — about the size of a short tweet, sometimes just 96 bytes. That would be transformative for tiny embedded devices where every byte costs power. The trade-off lives in the other direction: the public key itself can be hundreds of kilobytes, like sending a phone book to verify a postage stamp.',
      catch:
        'In 2025 a clever mathematical trick (the "wedge attack") found a way to spot where the secret shortcut hides for several variants — security dropped below target overnight, and teams are now reparameterising. One variant called QR-UOV was unscathed thanks to an unusual design choice; expect that to become the template going forward.',
    },
  },
  isogeny: {
    id: 'isogeny',
    label: 'Isogeny',
    tagline:
      'Supersingular elliptic-curve isogenies — the smallest signature + public key of any PQC candidate.',
    hardness:
      'Computing isogenies between supersingular elliptic curves and determining their endomorphism rings. Among the newest cryptographic assumptions.',
    whyKept:
      'At NIST Category 1, SQIsign signatures are 148 B and combined pk+sig fits in a single Ethernet frame — transformative for IoT, certificates, firmware. Round 2 redesign (higher-dimensional isogenies) cut signing time ~20×.',
    openConcerns:
      'Isogeny cryptography is young. The 2022 SIKE break (auxiliary torsion-point attack) is the cautionary backdrop — SQIsign avoids that structure, but the math is hard to audit. Constant-time signing remains an open implementation challenge.',
    candidateIds: ['sqisign'],
    colorClass: 'text-status-info',
    borderClass: 'border-status-info/40',
    bgClass: 'bg-status-info/10',
    layman: {
      analogy:
        'Imagine a colossal maze where every room is a mathematical "elliptic curve" and every door between rooms is a special mathematical bridge called an isogeny. The maze has more rooms than there are atoms in the observable universe. You start in room A and you have to end in room Z, having walked a specific path through millions of rooms. Your signature is a compact 148-byte note that proves you knew the path — without revealing which doors you actually took.',
      whatsDifferent:
        "The signature plus the public key combined is smaller than any other PQC candidate — small enough to fit in a single network packet. That's transformative for use cases where every byte matters: digital certificates, firmware updates, billions of IoT devices, smart cards that have to phone home over slow radio links.",
      catch:
        "The math is new and only a few hundred people on Earth fully understand it. A cousin scheme called SIKE was spectacularly broken in 2022 by an unexpected attack — recovered private keys in under an hour. SQIsign uses a different design that doesn't have that specific weakness, but the whole field is still earning the cryptographic community's trust.",
    },
  },
  lattice: {
    id: 'lattice',
    label: 'Lattice',
    tagline: 'Same family as ML-DSA / FN-DSA — but integer-only sampling, no floating point.',
    hardness:
      'Search Module Lattice Isomorphism Problem (smLIP) and One-More-Shortest-Vector Problem (omSVP). Newer than the standard SVP/LWE/SIS family but related.',
    whyKept:
      "HAWK eliminates Falcon's floating-point Gaussian-sampling pain — pure integer arithmetic on a rank-2 module lattice. Compact 555 B signatures at Category 1, smaller than both ML-DSA and FN-DSA, and easier to implement in constant time on constrained hardware.",
    openConcerns:
      "omSVP definition discrepancy required refinement during Round 2. Advances in solving smLIP variants exist but do not currently apply to HAWK's cyclotomic number fields — flagged for further community analysis.",
    candidateIds: ['hawk'],
    colorClass: 'text-primary',
    borderClass: 'border-primary/40',
    bgClass: 'bg-primary/10',
    layman: {
      analogy:
        'Picture a five-hundred-dimensional crystal where atoms sit at regular grid points. Find the atom closest to a randomly-pointed laser dot — easy enough if your math handles five-hundred-dimensional rounding. Falcon (selected for standardisation as FN-DSA, FIPS 206 still in draft) does this with fractional decimal numbers, which is brittle to implement safely on a phone or a smart card. HAWK does the exact same problem with whole numbers only — same security, simpler implementation, fewer ways to accidentally leak the secret.',
      whatsDifferent:
        "This is the same broad family of math as ML-DSA — the lattice signer that's already standardised — so the underlying assumptions are the most-studied of the four families. What makes HAWK distinctive is a fresh approach that ditches floating-point math entirely. That matters enormously for tiny devices where one rounding bug can leak your key over time.",
      catch:
        "The specific flavour of lattice problem HAWK is built on is younger than the standard lattice problems. It's been studied for several years and looks solid, but it hasn't accumulated the decades of beating-on that, say, the lattice math behind ML-KEM has had. That's the only real reservation NIST flagged.",
    },
  },
}

export const FAMILY_LIST: MathFamily[] = Object.values(FAMILIES)
