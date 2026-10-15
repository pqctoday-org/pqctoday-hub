// SPDX-License-Identifier: GPL-3.0-only
/**
 * Two merged results the Learn tab quotes in section 9 (2026-10-12 work, merged 2026-10-14):
 *  - an encrypted risk-scoring service that computes on CKKS ciphertexts under the token's keys
 *    (pqctoday-fhe #27);
 *  - the HSM's own streamed key export used directly by OpenFHE v1.6.0 (registry ID 4; engine in
 *    pqctoday-hsm #360, end-to-end run in pqctoday-fhe #28).
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
    value: `OpenFHE encrypts under the token's public key, then multiplies, rotates, conjugates and bootstraps with the token's ${OPENFHE_EXPORT.keys} keys and none of its own. Bootstrapping keeps ${OPENFHE_EXPORT.bootstrapTokenBits} bits with the token's keys against ${OPENFHE_EXPORT.bootstrapOwnBits} with OpenFHE's own (worst slot, mean of four runs). One flipped bit in the new key kind breaks only bootstrapping.`,
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

export const OPENFHE_EXPORT_LIMITS =
  'Limits: owner release only, because no flood bound has been measured for this set; about 13 bits after bootstrapping is OpenFHE’s own precision at these settings; OpenFHE itself ran on one platform only, a container on a Mac, because the boards ran the token’s export and not OpenFHE.'
