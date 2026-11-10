// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Two real lifecycle outcomes used as worked examples in the PQC Candidates
 * module: a candidate withdrawn by its own authors (HAWK) and a published
 * scheme that a national body advises against for new use while its guideline
 * still lists it (Classic McEliece).
 *
 * Every sentence paraphrases or quotes its cited source. The Classic McEliece
 * text must say "advises against new use" and never "withdrawn": the BSI has not
 * removed it from TR-02102-1 (see algorithmAdvisories.ts and its invariant test).
 */

export interface OutcomeSource {
  label: string
  /** Library reference_id, linked as /library?ref=<id> */
  libraryRef?: string
  /** External URL, used when no Library row exists */
  url?: string
}

export interface OutcomeStep {
  /** Display date, as precise as the source gives it */
  date: string
  text: string
}

export interface LifecycleOutcomeExample {
  id: 'hawk' | 'classic-mceliece'
  scheme: string
  outcome: string
  steps: OutcomeStep[]
  /** What the outcome means for someone choosing an algorithm */
  meaning: string
  sources: OutcomeSource[]
}

export const LIFECYCLE_OUTCOME_EXAMPLES: LifecycleOutcomeExample[] = [
  {
    id: 'hawk',
    scheme: 'HAWK (lattice signature, NIST additional signatures)',
    outcome: 'Withdrawn by its authors',
    steps: [
      {
        date: '14 May 2026',
        text: 'NIST advances HAWK to the third round of the additional signatures process, as the only lattice-based candidate (NIST IR 8610).',
      },
      {
        date: '28 Jul 2026',
        text: 'An improved key-recovery attack is announced on NIST’s pqc-forum. The announcement says it lowers the HAWK-512 key-recovery cost from 2^150 to 2^108 (a gate-count estimate), recovered a HAWK-256 key end-to-end in a few hours on one server, and was “found by Claude, with minimal technical guidance from people.” Anthropic’s research post says its researchers discovered the attack using Claude Mythos Preview.',
      },
      {
        date: '29 Jul 2026',
        text: 'The HAWK team withdraws HAWK. Its site says Anthropic discovered the attack, which “approximately halves the block size required in lattice reduction to recover an (equivalent) private key” and that “Hawk is insecure and should not be used.”',
      },
    ],
    meaning:
      'HAWK is no longer in the NIST process and will not become a NIST standard from this round. NIST’s Round 3 page now lists it as withdrawn, leaving eight candidates. Do not deploy it.',
    sources: [
      {
        label: 'pqc-forum announcement (28 Jul 2026)',
        libraryRef: 'HAWK-n-Key-Recovery-Reduces-to-SVP-in-Dimension-n-2-1',
      },
      {
        label: 'Anthropic research post (28 Jul 2026)',
        libraryRef: 'Discovering-cryptographic-weaknesses-with-Claude',
      },
      {
        label: 'Entrust blog on the attack (Aug 2026)',
        libraryRef: 'Why-Mythos-Finding-a-Flaw-in-HAWK-is-Good-for-PQC-Entrust',
      },
      {
        label: 'NIST Round 3 page',
        url: 'https://csrc.nist.gov/projects/pqc-dig-sig/round-3-additional-signatures',
      },
      { label: 'HAWK team site', url: 'https://hawk-sign.info' },
    ],
  },
  {
    id: 'classic-mceliece',
    scheme: 'Classic McEliece (code-based KEM, BSI TR-02102-1)',
    outcome: 'A national body advises against new use',
    steps: [
      {
        date: 'Jun 2026',
        text: 'Classic McEliece is standardised at ISO/IEC in June 2026, and the BSI’s TR-02102-1 has recommended it since 2020, currently with selected parameter sets and for hybrid use only.',
      },
      {
        date: '1 Oct 2026',
        text: 'The BSI advises against new use of Classic McEliece in new developments (notice dated 29 Sep 2026, published 1 Oct). It cites 2026 progress in structural attacks on binary Goppa codes, including one paper, not yet peer reviewed, that estimates key recovery at 2^99–2^102 operations for the TR-02102-1 parameter sets, and it expects further improvements. The BSI reports no practical attack on those sets so far.',
      },
    ],
    meaning:
      'The scheme stays in the published guideline: TR-02102-1 keeps it until its next revision, expected early 2027, and a hybrid deployment still gives at least the security of its classical half. For new work the BSI points to FrodoKEM, ML-KEM, or HQC once its standard is published.',
    sources: [
      {
        label: 'BSI notice on Classic McEliece (1 Oct 2026)',
        libraryRef: 'BSI-Hinweise-zu-aktuellen-Entwicklungen-um-Classic-McEliece',
      },
      { label: 'BSI TR-02102-1', libraryRef: 'BSI TR-02102-1' },
    ],
  },
]

/** Plain-language contrast between the two outcomes. */
export const LIFECYCLE_OUTCOME_DIFFERENCE =
  'Withdrawn means the authors took their scheme out of the selection process, so it will not be standardised there; for HAWK the authors also say it is insecure and should not be used. An advisory against new use is different: the scheme stays in a published standard or guideline, but a national body tells you not to start new work with it, and the guideline’s next revision settles its place.'
