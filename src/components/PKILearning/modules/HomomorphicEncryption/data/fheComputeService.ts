// SPDX-License-Identifier: GPL-3.0-only
/**
 * Two merged results the Learn tab quotes in section 9 (2026-10-12 work, merged 2026-10-14):
 *  - an encrypted risk-scoring service that computes on CKKS ciphertexts under the token's keys
 *    (pqctoday-fhe #27);
 *  - the HSM's own streamed key export used directly by OpenFHE v1.6.0 (registry ID 4; engine in
 *    pqctoday-hsm #360, end-to-end run in pqctoday-fhe #28), and OpenFHE's iterative (two-round)
 *    bootstrapping on those keys (pqctoday-fhe #31, 2026-10-15);
 *  - the scoring service on an x86-64 virtual machine and on an MX95 Pro board with the token on a
 *    second board (pqctoday-fhe #32, 2026-10-15).
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

/** The scoring service on an x86-64 VM and on the MX95 Pro; its custodian is the HSM main commit below. */
export const COMPUTE_SERVICE_RUNS_REF: MergedRef = {
  repo: 'pqctoday-fhe',
  pr: 32,
  mergeCommit: 'ed7b92ee2bb3fae7bc9cb22e24a80490c786d1fd',
}

/** The HSM main commit the custodian of those runs was built from (it contains pqctoday-hsm #360). */
export const COMPUTE_SERVICE_RUNS_CUSTODIAN_COMMIT = 'ebbc3d20ab209bfba125243f2b9a029b71a8cf9d'

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
    value: `On the Mac, about 200 ms of server time per ${COMPUTE_SERVICE.slots}-customer batch (${COMPUTE_SERVICE.serverMsRange} over 10 jobs, 6 CPUs; the other machines are below). The data owner is the slower side: encrypting one batch takes ${COMPUTE_SERVICE.clientEncryptS}, and a request is ${COMPUTE_SERVICE.requestMiB} MiB of ciphertexts. Server peak memory ${COMPUTE_SERVICE.peakMiB}.`,
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

/**
 * The same service on three machines (batch of 32,768 customers, registry ID 3, owner release, no
 * refresh). Mac: the headline run of pqctoday-fhe #27 (median 201 ms, 197 to 231 ms over 10 jobs,
 * peak 1,714 MiB, 17,813 requests an hour by the server's run time). x86-64 VM and MX95 Pro:
 * pqctoday-fhe #32, medians of three repetitions with the range over all 8 jobs of the run, taken
 * from the run files in public/data/fhe-evidence/ckks-scoring-service-*-ed7b92e (a test recomputes
 * them).
 */
export const COMPUTE_SERVICE_MACHINES = {
  mac: { perHourByRunTime: '17,800' },
  vm: {
    medianMs: '277',
    rangeMs: '273–305',
    peakMiB: '1,311',
    admission: '40 ms to verify and 100 ms to assemble',
    perHourByRunTime: '13,000',
    runS: '47',
  },
  pro: {
    medianS: '4.29',
    rangeS: '4.16–4.66',
    peakMiB: '1,870',
    admission: '170 ms to verify and 497 ms to assemble',
    perHourSequential: '600',
    perHourByRunTime: '840',
    runS: '202',
    tokenExportS: '124',
    tokenExportMBs: '35.7',
    tokenPeakMiB: '83',
    timesTheMac: '21',
  },
  accuracyBits: '21.00',
  auc: '0.717298 against 0.717299',
} as const

export const COMPUTE_SERVICE_MACHINES_INTRO =
  'The same service, built as a static binary for each processor, also ran on an x86-64 virtual machine and on an MX95 Pro board, the latter with the token on a second board (the base MX95), so the three roles sat on three machines. The data owner’s client was a container on the Mac in every run'

export const COMPUTE_SERVICE_MACHINE_ROWS: { topic: string; value: string }[] = [
  {
    topic: 'Mac (Apple M5 Max)',
    value: `Service and token in containers on the same Mac: about 200 ms per batch (median 201 ms, ${COMPUTE_SERVICE.serverMsRange} over 10 jobs), peak ${COMPUTE_SERVICE.peakMiB}, about ${COMPUTE_SERVICE_MACHINES.mac.perHourByRunTime} requests an hour by server time alone.`,
  },
  {
    topic: 'x86-64 virtual machine',
    value: `12 virtual CPUs (AMD Ryzen AI 9 HX 370), the token in a container on the Mac: ${COMPUTE_SERVICE_MACHINES.vm.medianMs} ms per batch (median of three repetitions; ${COMPUTE_SERVICE_MACHINES.vm.rangeMs} ms over all 8 jobs), peak ${COMPUTE_SERVICE_MACHINES.vm.peakMiB} MiB, key set admitted with ${COMPUTE_SERVICE_MACHINES.vm.admission}, about ${COMPUTE_SERVICE_MACHINES.vm.perHourByRunTime} requests an hour by server time alone, whole run ${COMPUTE_SERVICE_MACHINES.vm.runS} s.`,
  },
  {
    topic: 'MX95 Pro board',
    value: `6 Cortex-A55 cores and 15.4 GiB, the token on the base MX95 board (it exported its 4.41 GB key set in ${COMPUTE_SERVICE_MACHINES.pro.tokenExportS} s, ${COMPUTE_SERVICE_MACHINES.pro.tokenExportMBs} MB/s, ${COMPUTE_SERVICE_MACHINES.pro.tokenPeakMiB} MiB peak): ${COMPUTE_SERVICE_MACHINES.pro.medianS} s per batch (median of three repetitions; ${COMPUTE_SERVICE_MACHINES.pro.rangeS} s over all 8 jobs), about ${COMPUTE_SERVICE_MACHINES.pro.timesTheMac} times the Mac, peak ${COMPUTE_SERVICE_MACHINES.pro.peakMiB} MiB, key set admitted with ${COMPUTE_SERVICE_MACHINES.pro.admission}, ${COMPUTE_SERVICE_MACHINES.pro.perHourSequential} requests an hour one at a time with the ${COMPUTE_SERVICE.requestMiB} MiB upload (${COMPUTE_SERVICE_MACHINES.pro.perHourByRunTime} by server time alone), whole run ${COMPUTE_SERVICE_MACHINES.pro.runS} s.`,
  },
]

/** One sentence under the table: the result did not depend on the machine. */
export const COMPUTE_SERVICE_MACHINES_SAME_RESULT = `The scores were identical on all three machines: ${COMPUTE_SERVICE_MACHINES.accuracyBits} bits against the plaintext cubic, the same decision on every slot at 0.5 and 0.25, AUC ${COMPUTE_SERVICE_MACHINES.auc}.`

/** Limits the service states about itself. */
export const COMPUTE_SERVICE_LIMITS =
  'Limits: the certificates are classical test certificates (the key exchange is post-quantum, the authentication is not); one tenant; keys and jobs live in memory only, so a restart drops them; a program of 3 multiplications and one batch size (32,768 customers); one run per machine; the virtual machine and board runs use the published test seed, so their secret key is public and they measure time, memory and correctness, not secrecy; the x86 run is a virtual machine, not a dedicated host, and its cores were not pinned; the board’s service listens on loopback and is reached through an ssh tunnel with TLS inside it. A deeper model would need the refresh step and its 4.4 GB of extra keys.'

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
