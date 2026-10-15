// SPDX-License-Identifier: GPL-3.0-only
/**
 * Two merged results the Learn tab quotes in section 9 (2026-10-12 work, merged 2026-10-14):
 *  - an encrypted risk-scoring service that computes on CKKS ciphertexts under the token's keys
 *    (pqctoday-fhe #27);
 *  - the HSM's own streamed key export used directly by OpenFHE v1.6.0 (registry ID 4; engine in
 *    pqctoday-hsm #360, end-to-end run in pqctoday-fhe #28), and OpenFHE's iterative (two-round)
 *    bootstrapping on those keys (pqctoday-fhe #31, 2026-10-15).
 * Every number is copied from the merged pull requests' measured results (single runs on an Apple
 * M5 Max, in containers; for the OpenFHE set the token's export was also run on both MX95 boards,
 * pqctoday-fhe #29). Nothing here is interpolated.
 */

/** A merged pull request a claim rests on: repository, number and full merge commit. */
export interface MergedRef {
  repo: 'pqctoday-hsm' | 'pqctoday-fhe'
  pr: number
  mergeCommit: string
}

export const COMPUTE_SERVICE_REF: MergedRef = {
  repo: 'pqctoday-fhe',
  pr: 27,
  mergeCommit: '70872f9a0ace9106eb65e2c0c76ab2b9a953fca3',
}

export const OPENFHE_EXPORT_REFS: MergedRef[] = [
  { repo: 'pqctoday-hsm', pr: 360, mergeCommit: '9dea1716044217cc2e0c5809f347639f4e825564' },
  { repo: 'pqctoday-fhe', pr: 28, mergeCommit: '67217242c01c0382b72938a153243893e5804434' },
  { repo: 'pqctoday-fhe', pr: 29, mergeCommit: '461f44ae2599799f261f62245456079ffad6a710' },
  { repo: 'pqctoday-fhe', pr: 31, mergeCommit: 'cc9d7bc46e71459fd4363b1197a0b2fcc507ab97' },
]

/** "pqctoday-fhe #27, merge commit 70872f9a…" in full, as the other engine notes cite merges. */
export const citeMerged = (r: MergedRef): string =>
  `${r.repo} #${r.pr}, merge commit ${r.mergeCommit}`

/** The encrypted risk-scoring service (registry ID 3, no refresh). */
export const COMPUTE_SERVICE = {
  dataset: 'UCI "Default of Credit Card Clients" (CC BY 4.0), 23 features',
  heldOutRows: '6,000',
  slots: '32,768',
  multiplications: 3,
  aucEncrypted: '0.717298',
  aucPlaintext: '0.717299',
  serverMsMedian: 201,
  serverMsRange: '197–231 ms',
  requestMiB: 184,
  clientEncryptS: '3.6 s',
  peakMiB: '1,714 MiB',
  refusalCases: 'about 40',
} as const

/** What the service measured, one row per question a reader asks. */
export const COMPUTE_SERVICE_ROWS: { topic: string; value: string }[] = [
  {
    topic: 'What it computes',
    value: `A logistic-regression credit-risk score for ${COMPUTE_SERVICE.slots} customers per request, on encrypted data only. The model was fitted on the ${COMPUTE_SERVICE.dataset}; the sigmoid is replaced by a cubic, so the program is ${COMPUTE_SERVICE.multiplications} multiplications deep and needs no refresh (bootstrapping).`,
  },
  {
    topic: 'Accuracy',
    value: `On ${COMPUTE_SERVICE.heldOutRows} held-out rows the encrypted scores rank customers like the plaintext model: AUC ${COMPUTE_SERVICE.aucEncrypted} encrypted against ${COMPUTE_SERVICE.aucPlaintext} in plaintext, and the same decision on all ${COMPUTE_SERVICE.slots} slots. The cubic itself differs from the exact sigmoid by up to 0.104, so a score is a risk index, not a calibrated probability.`,
  },
  {
    topic: 'Speed',
    value: `About 200 ms of server time per ${COMPUTE_SERVICE.slots}-customer batch (${COMPUTE_SERVICE.serverMsRange} over 10 jobs, 6 CPUs). The data owner is the slower side: encrypting one batch takes ${COMPUTE_SERVICE.clientEncryptS}, and a request is ${COMPUTE_SERVICE.requestMiB} MiB of ciphertexts. Server peak memory ${COMPUTE_SERVICE.peakMiB}.`,
  },
  {
    topic: 'Who may upload keys',
    value:
      'The service admits a key set only with the token-signed manifest (ML-DSA-65) and pinned signer, parameter hash and generator version; a chunk the manifest does not cover is refused. It needs only the relinearization key, never a secret key.',
  },
  {
    topic: 'Transport',
    value:
      'TLS 1.3 only, with the post-quantum hybrid key exchange X25519MLKEM768 and a required client certificate.',
  },
  {
    topic: 'What it refuses',
    value: `Tested with ${COMPUTE_SERVICE.refusalCases} refusal cases: tampered or uncovered key chunks, a wrong signer or parameter set, malformed or oversized ciphertexts, a missing client certificate, TLS 1.2 and a classical-only key exchange. A scan of the logs found none of 200 random pieces of any ciphertext or key chunk, and the service writes nothing to disk.`,
  },
  {
    topic: 'Decryption',
    value:
      'Only the data owner can read a score: the token decrypts it under its owner-release policy. No third-party release.',
  },
]

/** Limits the service states about itself. */
export const COMPUTE_SERVICE_LIMITS =
  'Limits: the certificates are classical test certificates (the key exchange is post-quantum, the authentication is not); one tenant; keys and jobs live in memory only, so a restart drops them; run on one Mac, not on a board. A deeper model would need the refresh step and its 4.4 GB of extra keys.'

/** The HSM's key export in OpenFHE (registry ID 4, OpenFHE v1.6.0 at its 128-bit-checked settings). */
export const OPENFHE_EXPORT = {
  keys: 79,
  streamedGB: '6.56 GB',
  fullGB: '13.09 GB',
  exportS: '17.8 s',
  tokenPeakMB: '83.5 MB',
  evalLimbs: '12,483',
  mismatches: 0,
  bootstrapTokenBits: '13.28',
  bootstrapOwnBits: '13.20',
} as const

export const OPENFHE_EXPORT_ROWS: { topic: string; value: string }[] = [
  {
    topic: 'What the token exports',
    value: `All ${OPENFHE_EXPORT.keys} keys OpenFHE needs to bootstrap at these settings: 1 relinearization, 75 rotation, 1 conjugation and OpenFHE's 2 sparse-secret keys (${OPENFHE_EXPORT.fullGB} in full, ${OPENFHE_EXPORT.streamedGB} streamed). One new key kind was needed, for the dense-to-sparse key that uses two extra primes; the existing parameter sets are byte-identical.`,
  },
  {
    topic: 'Export',
    value: `${OPENFHE_EXPORT.streamedGB} streamed in ${OPENFHE_EXPORT.exportS} on an Apple M5 Max, token peak memory ${OPENFHE_EXPORT.tokenPeakMB}.`,
  },
  {
    topic: 'Checked against the reference',
    value: `${OPENFHE_EXPORT.mismatches} mismatches over ${OPENFHE_EXPORT.evalLimbs} evaluation-key limbs (and 32 public-key limbs).`,
  },
  {
    topic: 'In OpenFHE',
    value: `OpenFHE encrypts under the token's public key, then multiplies, rotates, conjugates and bootstraps with the token's ${OPENFHE_EXPORT.keys} keys and none of its own. One bootstrap, OpenFHE's default refresh, keeps ${OPENFHE_EXPORT.bootstrapTokenBits} bits with the token's keys against ${OPENFHE_EXPORT.bootstrapOwnBits} with OpenFHE's own (worst slot, mean of four runs); refreshing twice keeps more (below). One flipped bit in the new key kind breaks only bootstrapping.`,
  },
]

/** The same export generated with the token on the MX95 boards (pqctoday-fhe #29; export only). */
export const OPENFHE_EXPORT_BOARDS = {
  generationS: { mx95: '145', mx95pro: '142' },
  streamedS: { mx95: '181', mx95pro: '178' },
  pieces: '1,565',
  peakMiB: '88.6–90.6',
} as const

/** One sentence, shown with links to the two board records. */
export const OPENFHE_EXPORT_BOARDS_SENTENCE = `The token’s export of this set was also generated on both MX95 boards, in ${OPENFHE_EXPORT_BOARDS.generationS.mx95} s (MX95) and ${OPENFHE_EXPORT_BOARDS.generationS.mx95pro} s (MX95 Pro), about 2.4 minutes each, and streamed to a Mac in about 3 minutes (${OPENFHE_EXPORT_BOARDS.streamedS.mx95} s and ${OPENFHE_EXPORT_BOARDS.streamedS.mx95pro} s), with all ${OPENFHE_EXPORT_BOARDS.pieces} pieces matching the reference and the token-signed manifest and a token peak of ${OPENFHE_EXPORT_BOARDS.peakMiB} MiB`

/**
 * OpenFHE's iterative bootstrapping (EvalBootstrap with numIterations 2 and a precision argument) on
 * the same 79 keys (pqctoday-fhe #31, one Mac, a shared machine). Worst slot over 32,768 slots, mean
 * of runs: four per setting up to precision 15, two from 16. Equal to the run files in
 * public/data/fhe-evidence/ckks-openfhe-iterative-cc9d7bc (a test recomputes them).
 */
export const OPENFHE_ITERATIVE = {
  /** One refresh (the control), four runs. */
  oneRound: { own: '13.20', token: '13.22' },
  /** The rule in OpenFHE's example (measured bits minus 5), precision argument 8. */
  rule: { precision: 8, own: '21.18', token: '21.07', release: '21.07' },
  /**
   * The best settings found by the sweep, token's keys, shown to one decimal: precision 19 and 20
   * give 31.80 and 31.73; at precision 19 the owner release gives 30.53 with the true scale applied
   * and 27.02 at face value.
   */
  best: {
    precisions: '19 to 20',
    tokenRange: '31.7 to 31.8',
    releaseScaled: '30.5',
    releaseFace: '27.0',
  },
  /** The result falls above the best settings (token's keys at precision 22 and 24, one decimal). */
  falls: { at22: '28.0', at24: '24.2' },
  /** A fresh public-key encryption in the earlier run of the same set, token's keys (32.13). */
  freshBits: '32.1',
  /** Largest gap between the token's keys and OpenFHE's own over the two-round settings, in bits. */
  agreeWithinBits: '0.4',
  secondsOneRound: '3.2',
  secondsTwoRounds: '6',
  levelsLeft: { oneRound: 8, twoRounds: 7 },
  peakGiB: '16.6',
  /** Multiplicative depth that would keep 8 levels, refused at N = 2^16. */
  refusedDepth: 26,
} as const

/** What the token's keys give OpenFHE's two-round refresh, one row per question a reader asks. */
export const OPENFHE_ITERATIVE_ROWS: { topic: string; value: string }[] = [
  {
    topic: 'One refresh (default)',
    value: `13.2 bits, worst slot, mean of four runs (${OPENFHE_ITERATIVE.oneRound.token} with the token’s keys, ${OPENFHE_ITERATIVE.oneRound.own} with OpenFHE’s own).`,
  },
  {
    topic: 'Two rounds, the example’s rule',
    value: `21.1 bits with the token’s keys (${OPENFHE_ITERATIVE.rule.own} with OpenFHE’s own, ${OPENFHE_ITERATIVE.rule.release} through the token’s owner release), at the setting OpenFHE’s example recommends: the measured bits minus 5, here precision ${OPENFHE_ITERATIVE.rule.precision}.`,
  },
  {
    topic: 'Two rounds, best setting found',
    value: `${OPENFHE_ITERATIVE.best.tokenRange} bits at precision ${OPENFHE_ITERATIVE.best.precisions} with the token’s keys, close to the ${OPENFHE_ITERATIVE.freshBits} bits of a freshly encrypted ciphertext in the earlier run. Through the token’s owner release (precision 19), which rounds to 2^-30: ${OPENFHE_ITERATIVE.best.releaseScaled} bits when the ciphertext’s true scale is applied, ${OPENFHE_ITERATIVE.best.releaseFace} bits when the release is read at face value, because OpenFHE’s scale after a bootstrap differs from 2^52 by 6 to 7 parts in a billion and the token’s input carries the scale only as a power of two.`,
  },
  {
    topic: 'Choosing the setting',
    value: `Below precision 19 the result is about 13.2 plus the precision; above 20 it falls (${OPENFHE_ITERATIVE.falls.at22} at 22, ${OPENFHE_ITERATIVE.falls.at24} at 24; the cause was not investigated). At these parameters the setting moves the result bit for bit, and the best one was found by sweeping, not from a documented rule.`,
  },
  {
    topic: 'Token’s keys against OpenFHE’s own',
    value: `Within ${OPENFHE_ITERATIVE.agreeWithinBits} bit at every two-round setting. The key set did not change: the same 79 keys, nothing different on the token.`,
  },
  {
    topic: 'Cost',
    value: `About twice the time (about ${OPENFHE_ITERATIVE.secondsTwoRounds} s against ${OPENFHE_ITERATIVE.secondsOneRound} s, on a shared Mac with six cores, so compare the ratio) and one level fewer: ${OPENFHE_ITERATIVE.levelsLeft.twoRounds} left after the refresh instead of ${OPENFHE_ITERATIVE.levelsLeft.oneRound}. Keeping 8 levels would need a deeper chain (multiplicative depth ${OPENFHE_ITERATIVE.refusedDepth}), which OpenFHE refuses at N = 2^16 with its 128-bit check; it asks for N = 2^17. Peak memory is unchanged, ${OPENFHE_ITERATIVE.peakGiB} GiB.`,
  },
]

/** One paragraph above the table, shown with the link to the iterative record. */
export const OPENFHE_ITERATIVE_INTRO =
  'OpenFHE can also refresh a ciphertext in two rounds (iterative bootstrapping): the second round bootstraps the first round’s error, scaled up by 2^precision (a setting you choose), and subtracts it. It works with the token’s keys as they stand'

export const OPENFHE_EXPORT_LIMITS =
  'Limits: owner release only, because no flood bound has been measured for this set; about 13 bits after one bootstrap is OpenFHE’s default precision at these settings, and a second round raises it; OpenFHE itself ran on one platform only, a container on a Mac, because the boards ran the token’s export and not OpenFHE; the two-round results come from one seeded input vector and a few runs per setting (four up to precision 15, two above), with the variant that raises the modulus first only.'
