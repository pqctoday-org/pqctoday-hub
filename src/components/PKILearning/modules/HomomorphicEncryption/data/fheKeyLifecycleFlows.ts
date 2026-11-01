// SPDX-License-Identifier: AGPL-3.0-only

// ── Two key-lifecycle scenarios for the "FHE + HSM Flows" workshop step (2026-10-11) ─────
// 1. CKKS key rotation without decrypting stored data (pqctoday-hsm #351 and #354, merged).
// 2. CKKS shared (2-of-2) decryption by two tokens (a study and a Lattigo prototype; nothing
//    is built in pqctoday-hsm yet).
// Every measured number comes from the evidence records named in `measured` (see
// workshop/fheRotationSharedData.ts for the same numbers behind the concepts workshop views).
// This file only holds data; the tables are merged into the flow tables by the files that own
// them (fheHsmFlows.ts, fheHsmCosts.ts, fheHsmStepIO.ts, fheKeyMap.ts).

import type { DataState, FheFlow, Phase } from './fheHsmFlows'
import type { KeyId, StepCost } from './fheHsmCosts'
import type { StepIO } from './fheHsmStepIO'
import type { Placement } from './fheKeyMap'

export type LifecycleFlowId = 'ckks-key-rotation' | 'ckks-shared-decrypt'

const ROTATION_ENGINE =
  'Key rotation is merged in pqctoday-hsm (#351, #354), behind a non-default build feature of the educational engine. It ran as a software token in a container on a Mac; it has not been run on a board.'

const SHARED_ENGINE =
  'Planned. Shared decryption is a feasibility study with a Lattigo prototype (both parties in one process on a Mac); a share mode in the generator and a partial-decryption release are not built in pqctoday-hsm yet.'

export const KEY_LIFECYCLE_FLOWS: FheFlow[] = [
  {
    id: 'ckks-key-rotation',
    baseline: {
      implementation:
        'Lattigo v6.2.0 core/rlwe: GenEvaluationKeyNew(skInput = s_old, skOutput = s_new) and Evaluator.ApplyEvaluationKey',
      codeUrl: 'https://github.com/tuneinsight/lattigo/tree/v6.2.0/core/rlwe',
      paper:
        'Lattigo v6.2.0 SECURITY.md: key rotation is listed as a mitigation that limits the material available to IND-CPA-D attacks',
      paperUrl: 'https://github.com/tuneinsight/lattigo/blob/v6.2.0/SECURITY.md',
    },
    engineDefault: {
      status: 'engine',
      note: 'Key rotation is merged in pqctoday-hsm (#351, #354).',
    },
    validation: {
      target:
        'Reproduced against Lattigo v6.2.0: the token’s rotation key matched Lattigo’s own rebuild limb for limb (30 of 30), Lattigo switched a level-9 and a level-0 ciphertext, the switched ciphertexts no longer decrypt under the old key, and the new seed decrypted the result under its policy. Measured with the software token in a container on a Mac; not run on a board and not independently reviewed.',
      reference: 'Lattigo v6.2.0 evaluation keys; pqctoday-fhe rotation reference run',
    },
    label: 'CKKS key rotation',
    tagline:
      'Move stored ciphertexts to a new key without decrypting them: the security officer, the token and the server, and what the token refuses.',
    tileHint: 'SO ONLY · 31.5 MB KEY · 8 REFUSALS',
    scaling: {
      verdict: 'scales',
      note: 'A rotation key is one key-switching key at the lower levels stored ciphertexts use: 31.5 MB (15.7 MB streamed in 4 calls of 8 limbs, token peak 51.4 MiB), not the 157 MB of a bootstrapping-level key and not the 3.94 GB key set. Measured on a Mac with the software token in a container: 0.14 s to stream it, 10–37 ms per ciphertext at the server. The new key set must still be streamed once.',
    },
    colorClass: 'text-status-warning',
    borderClass: 'border-warning/40',
    bgClass: 'bg-warning/10',
    layman: {
      analogy:
        'Changing the lock on a warehouse without opening the sealed crates: a one-way adapter converts each crate’s seal from the old lock to the new one, and nobody reads what is inside.',
      whatsDifferent:
        'Decrypting every stored ciphertext and encrypting it again would send the data through the very path that is under suspicion after an incident. Here the token produces one small key and the server does the conversion on ciphertexts.',
      catch:
        'The adapter has a price: whoever holds the new secret and the adapter can compute the old secret, so it is used once and deleted. Whether someone who holds the old secret can read a converted ciphertext without having kept the original is not established.',
    },
    actors: [
      {
        id: 'client',
        label: 'Security officer + owner',
        sub: 'rotation ceremony / app',
        kind: 'client',
        zone: 'owner',
      },
      {
        id: 'hsm',
        label: 'HSM',
        sub: 'FHE key custodian',
        kind: 'hsm',
        holdsSecret: true,
        zone: 'owner',
      },
      { id: 'cloud', label: 'FHE server', sub: 'stored ciphertexts', kind: 'cloud', zone: 'third' },
    ],
    steps: [
      {
        id: 'so-starts-rotation',
        from: 'client',
        to: 'hsm',
        label: 'start (SO session)',
        api: 'CKM_PQCTODAY_FHE_DERIVE_PUBLIC, parameter version 3, kind 3 (rotation descriptor)',
        deployment: true,
        title: 'The security officer starts the rotation',
        engineNote: ROTATION_ENGINE,
        detail:
          'Only a security-officer session may run a rotation. The token checks the session before it looks at any key: a user session is refused with CKR_USER_TYPE_INVALID and a public session with CKR_USER_NOT_LOGGED_IN. The security officer names the old and the new seed by lineage and never holds a handle to either. Pick who starts it, and what the new secret is, in “Try to start a rotation” below.',
        link: 'tls',
      },
      {
        id: 'token-generates-new-secret',
        from: 'hsm',
        to: 'hsm',
        label: 'new seed ← DRBG',
        api: 'KeyGen()',
        deployment: true,
        title: 'The token generates the new secret itself',
        engineNote: ROTATION_ENGINE,
        detail:
          'The new seed is made inside the token with the same mechanism as any FHE seed, never supplied or imported by the caller. A switching key toward a secret the caller knows would hand over the old secret, so a seed that was imported, or that arrived as a copy from another token (even one that made it), is refused as the new secret. Both seeds must belong to the same parameter set, and the new seed’s decryption policy must be equal to or stricter than the old one’s.',
        link: 'fhe',
      },
      {
        id: 'stream-rotation-key',
        from: 'hsm',
        to: 'cloud',
        label: '31.5 MB key, streamed',
        api: 'GenEvaluationKeyNew(s_old, s_new)',
        deployment: true,
        title: 'Stream the rotation key with a signed manifest',
        verdict: 'ok',
        engineNote: ROTATION_ENGINE,
        detail:
          'One key-switching key from the old secret to the new one, at the lower levels stored ciphertexts use: 31,457,872 B, of which the token streams the b half, 15,728,640 B, in 4 calls of 8 limbs. The a half is re-expanded by the receiver. The token signs a manifest of the pieces once every digit has been sent exactly once. Measured: all 30 limbs matched Lattigo’s own rebuild from the two seeds.',
        link: 'sig',
      },
      {
        id: 'server-switches-ciphertexts',
        from: 'cloud',
        to: 'cloud',
        label: 'switch c(old) → c(new)',
        api: 'rlwe.Evaluator.ApplyEvaluationKey',
        title: 'The server switches each stored ciphertext',
        detail:
          'The server applies the key to every stored ciphertext; the result decrypts under the new secret and no plaintext appears. Measured on a Mac: 36.5 ms at the top level (9) and 10.1 ms at level 0, with precision 28.7 → 27.1 bits and 28.6 → 27.3 bits, a loss of about 1.3–1.6 bits.',
        link: 'fhe',
      },
      {
        id: 'return-switched-ciphertext',
        from: 'cloud',
        to: 'client',
        label: 'FHE(data) under new key',
        title: 'The owner fetches a switched ciphertext',
        detail:
          'The server returns a switched ciphertext still encrypted, now under the new secret. It never held a key that could open it.',
        link: 'tls',
      },
      {
        id: 'decrypt-with-new-secret',
        from: 'client',
        to: 'hsm',
        label: 'decrypt under new key',
        api: 'Decrypt (policy version 2)',
        deployment: true,
        title: 'The new secret decrypts it; the old one no longer does',
        engineNote: ROTATION_ENGINE,
        detail:
          'The new seed decrypts the switched level-0 ciphertext under its own policy: released rounded to 20 bits it keeps 20.99 bits. Under the old key a switched ciphertext gives noise: −27.8 bits at level 0 and −387.8 bits at level 9. Not established: whether a holder of the old secret can read a switched ciphertext without the original; until it is, the server deletes the rotation key and the old seed is retired.',
        link: 'tls',
      },
      {
        id: 'so-retires-old-secret',
        from: 'client',
        to: 'hsm',
        label: 'retire old seed (SO)',
        api: 'retire_old_seed(SO session, old lineage)',
        deployment: true,
        title: 'The security officer retires the old secret',
        engineNote: ROTATION_ENGINE,
        detail:
          'Only after the rotation manifest was signed, and after the server reports that every stored ciphertext was switched; the token cannot check that itself. The token first commits a signed retirement record to its retirement ledger, a public object that cannot be modified, copied or destroyed and that names both lineages, the parameter hash and the time, and links to the rotation manifest by its descriptor hash. Only then does it destroy the old seed.',
        link: 'sig',
      },
      {
        id: 'server-deletes-rotation-key',
        from: 'cloud',
        to: 'cloud',
        label: 'delete rotation key',
        title: 'The server deletes the rotation key',
        detail:
          'Whoever holds the new secret and the rotation key can compute the old secret, so the key is used once and deleted. Rotation protects data from then on; it does not make copies of old ciphertexts safe from someone who already holds the old secret.',
      },
    ],
    hsmDoes:
      'Checks the session and the seeds, generates the new seed itself, streams one key-switching key with a signed manifest, decrypts under the new seed’s policy and retires the old seed with a signed record.',
    staysSecret:
      'Both seeds, until the old one is destroyed. The rotation key is public data, but together with the new secret it reveals the old one, so it is used once and deleted.',
    watchOut:
      'Refused by the token: a user or public session, the same seed, a different parameter set, a copy of a token-made key as the new secret, going back from new to old, a second target for the same old secret, and a looser decryption policy.',
    measured: [
      { label: 'rotation run (Mac, software token)', of: 'rotation' },
      { label: 'key-set sizes', of: 'sizes' },
    ],
  },
  {
    id: 'ckks-shared-decrypt',
    baseline: {
      implementation:
        'Lattigo v6.2.0 multiparty: additive N-out-of-N key generation (PublicKeyGenProtocol, RelinearizationKeyGenProtocol, GaloisKeyGenProtocol, EvaluationKeyGenProtocol) and collective key switching (KeySwitchProtocol, PublicKeySwitchProtocol)',
      codeUrl: 'https://pkg.go.dev/github.com/tuneinsight/lattigo/v6/multiparty',
      paper:
        'Mouchet, Troncoso-Pastoriza, Bossuat, Hubaux: Multiparty Homomorphic Encryption from Ring-Learning-with-Errors (PoPETs 2021)',
      paperUrl: 'https://petsymposium.org/popets/2021/popets-2021-0071.php',
    },
    engineDefault: {
      status: 'planned',
      note: 'Shared decryption is a study and a Lattigo prototype; nothing is built in pqctoday-hsm yet.',
    },
    validation: {
      target:
        'Evidence-scoped measurements only; no absolute claims. A Lattigo prototype with both parties in one process on a Mac, at the real parameters (N = 2¹⁶): the joint keys bootstrap, one share alone decrypts nothing, and a crafted request to one party returns its whole share. No token or board run.',
      reference: 'Lattigo v6.2.0 multiparty package (Go), the prototype’s library',
    },
    label: 'CKKS shared (2-of-2) decryption',
    tagline:
      'Two boards each hold a share of the secret, so decrypting needs both: what each sends, what it costs, and what sharing does not fix.',
    tileHint: 'TWO TOKENS · 4.10 GB EACH · −27.8 BITS ALONE',
    scaling: {
      verdict: 'scales-when-streamed',
      note: 'Each token streams 4.10 GB of key shares (the single-token stream is 3.94 GB) in the existing chunk format for 50 of the 51 keys, and downloads 157 MB of the aggregated first round for the relinearization key. The time was not measured on the boards; the study extrapolates about 222 s on one MX95 core and 75–87 s on six MX95 Pro cores. The sums and the decryption are cheap: a decryption share is 0.5 MB and took 1.9 ms on a Mac.',
    },
    colorClass: 'text-primary',
    borderClass: 'border-primary/40',
    bgClass: 'bg-primary/10',
    layman: {
      analogy:
        'A vault that needs two keys turned at once, held by two different people. Neither can open it alone, and a thief who steals one key gets nothing.',
      whatsDifferent:
        'With one token, an unrestricted or insufficiently checked decryption interface can become a key-recovery oracle. With two shares, one stolen or compromised token is no longer enough, and decryption needs two genuinely independent approvals.',
      catch:
        'It protects only if the two approvals really are independent: a crafted request sent to one token returned that token’s whole share, so one application holding both approvals gets both shares. Flooding the shares for third parties still fails at the default parameters.',
    },
    actors: [
      {
        id: 'client',
        label: 'Data owner + combiner',
        sub: 'Mac',
        kind: 'client',
        zone: 'owner',
      },
      {
        id: 'hsmA',
        label: 'Token A',
        sub: 'MX95 · one share',
        kind: 'hsm',
        holdsSecret: true,
        zone: 'party',
      },
      {
        id: 'hsmB',
        label: 'Token B',
        sub: 'MX95 Pro · one share',
        kind: 'hsm',
        holdsSecret: true,
        zone: 'party',
      },
      { id: 'cloud', label: 'FHE server', sub: 'untrusted compute', kind: 'cloud', zone: 'third' },
    ],
    steps: [
      {
        id: 'token-a-makes-share',
        from: 'hsmA',
        to: 'hsmA',
        label: 'share s_A',
        api: 'KeyGen() (share)',
        deployment: true,
        title: 'Token A makes its share',
        engineNote: SHARED_ENGINE,
        detail:
          'Token A derives a random ternary share of the secret from its own seed; the secret is the sum of the two shares and nobody ever holds it. Measured: the sum has about 384 non-zero coefficients, against 192 for a single secret, and bootstrapping with the joint keys still works. Each token also holds a sparse share for the bootstrapping keys; its weight (16 and 32 were tried, both bootstrap) is a security parameter still to be settled.',
        link: 'fhe',
      },
      {
        id: 'token-b-makes-share',
        from: 'hsmB',
        to: 'hsmB',
        label: 'share s_B',
        api: 'KeyGen() (share)',
        deployment: true,
        title: 'Token B makes its share',
        engineNote: SHARED_ENGINE,
        detail:
          'The same on the second board, from its own seed. Neither token learns the other’s share.',
        link: 'fhe',
      },
      {
        id: 'token-a-streams-key-share',
        from: 'hsmA',
        to: 'client',
        label: '4.10 GB key shares',
        api: 'multiparty.*KeyGenProtocol.GenShare',
        deployment: true,
        title: 'Token A streams its share of the key set',
        verdict: 'warn',
        engineNote: SHARED_ENGINE,
        detail:
          'A share of a public key, Galois key or sparse switch has the same formula as today’s key chunk, with the token’s share in place of the secret, so it fits the same chunk format: 50 of the 51 keys. The relinearization key needs two rounds: the token streams round 1, downloads the sum of both tokens’ round 1 (157,289,056 B) and then streams round 2. Measured size: 4,098,431,336 B per token against 3,941,073,029 B for one token. The time on the boards is not measured.',
        link: 'sig',
      },
      {
        id: 'token-b-streams-key-share',
        from: 'hsmB',
        to: 'client',
        label: '4.10 GB key shares',
        api: 'multiparty.*KeyGenProtocol.GenShare',
        deployment: true,
        title: 'Token B streams its share of the key set',
        verdict: 'warn',
        engineNote: SHARED_ENGINE,
        detail:
          'The same from the second board, in parallel. Each token signs its own manifest over its share; the combiner checks both.',
        link: 'sig',
      },
      {
        id: 'combiner-joins-key-shares',
        from: 'client',
        to: 'client',
        label: 'add shares → joint keys',
        api: 'AggregateShares · GenRelinearizationKey',
        title: 'The combiner adds the shares into one joint key set',
        detail:
          'Shares of public keys are random-looking samples, so an untrusted machine can add them limb by limb. The result is the same 7.87 GB joint set a single token would give. Measured: the joint keys bootstrap at 24.3–24.5 bits against 24.9 for one party. The protocol has no protection against a malicious token that streams a wrong share; the signatures show who produced a share, not that it is correct.',
        link: 'fhe',
      },
      {
        id: 'owner-encrypts-and-uploads',
        from: 'client',
        to: 'cloud',
        label: 'FHE(data) + joint keys',
        api: 'Encryptor with the joint public key',
        title: 'The owner encrypts and uploads',
        detail:
          'The data owner encrypts under the joint public key on its own device and sends the ciphertexts and the joint evaluation keys to the FHE server. No single token can decrypt them.',
        link: 'tls',
      },
      {
        id: 'compute-ciphertexts',
        from: 'cloud',
        to: 'cloud',
        label: 'f( ) on ciphertexts',
        api: 'Evaluator, bootstrapping with the joint keys',
        title: 'Compute on ciphertexts',
        detail:
          'The server computes unchanged: one joint public key and one evaluation-key set, with the same sizes and costs as for one token.',
        link: 'fhe',
      },
      {
        id: 'return-encrypted-result',
        from: 'cloud',
        to: 'client',
        label: 'FHE(result) → owner',
        title: 'Return the encrypted result',
        detail: 'The server returns the result still encrypted.',
        link: 'tls',
      },
      {
        id: 'token-a-partial-decrypt',
        from: 'client',
        to: 'hsmA',
        label: 'result → A: share',
        api: 'multiparty.KeySwitchProtocol.GenShare (or PublicKeySwitchProtocol)',
        deployment: true,
        title: 'Token A returns its decryption share',
        engineNote: SHARED_ENGINE,
        detail:
          'Under its own approval, token A returns a decryption share of the result: 524,304 B at level 0, or 1,048,894 B when switched to the owner’s public key, so that whoever combines the shares does not learn the plaintext. Measured: 1.9 ms on a Mac. A crafted request sent to one token returns that token’s whole share (65,536 of 65,536 coefficients, even with flooding), so each token needs its own, independent approval.',
        link: 'tls',
      },
      {
        id: 'token-b-partial-decrypt',
        from: 'client',
        to: 'hsmB',
        label: 'result → B: share',
        api: 'multiparty.KeySwitchProtocol.GenShare (or PublicKeySwitchProtocol)',
        deployment: true,
        title: 'Token B returns its decryption share',
        engineNote: SHARED_ENGINE,
        detail:
          'The same on the second board, under a second approval by a different person or system. Each token floods at the full width, because it must protect itself against the receiver colluding with the other token. At the default parameters a flood of 2^31.6 leaves −1.6 to −1.9 bits, and the corrected width is wider.',
        link: 'tls',
      },
      {
        id: 'combine-shares',
        from: 'client',
        to: 'client',
        label: 'combine shares',
        api: 'multiparty.*.AggregateShares · DecryptNew',
        title: 'The shares are combined',
        detail:
          'Both shares together give the result; one share alone gives −27.8 bits, noise. The policy checks on the plaintext (slot count, range, rounding) cannot run inside a token that only produces a share, because it never sees the plaintext. Two designs are open: shares re-encrypted to the owner, with policy limited to authorization, counters and flooding, or one combining token that applies the full policy.',
      },
    ],
    hsmDoes:
      'Each token makes its own share, streams its share of the key set, and returns a decryption share under its own approval, budget and audit.',
    staysSecret:
      'Each token’s share. The secret is the sum of the two shares and exists nowhere. One share alone decrypts nothing.',
    watchOut: `It does not stop a crafted request sent to one token (it returns that token’s whole share), so the two approvals must be independent. Flooding for third parties still fails at the default parameters. More than two parties (t-of-N) is not recommended: key-recovery attacks are reported on that scheme (IACR ePrint 2026/031, a preprint) (not sourced in the Library). No token or board run of shared decryption exists yet.`,
    measured: [
      { label: 'threshold study (Mac, Lattigo prototype)', of: 'threshold' },
      { label: 'one-party baseline', of: 'sizes' },
    ],
  },
]

const P = (...p: Phase[]) => p
const D = (...d: DataState[]) => d

export const KEY_LIFECYCLE_META: Record<LifecycleFlowId, { phase: Phase[]; data: DataState[] }> = {
  'ckks-key-rotation': {
    phase: P('setup', 'setup', 'setup', 'compute', 'compute', 'decrypt', 'retire', 'retire'),
    data: D('keys', 'keys', 'keys', 'encrypted', 'encrypted', 'decrypting', 'keys', 'keys'),
  },
  'ckks-shared-decrypt': {
    phase: P(
      'setup',
      'setup',
      'setup',
      'setup',
      'setup',
      'encrypt',
      'compute',
      'compute',
      'decrypt',
      'decrypt',
      'decrypt'
    ),
    data: D(
      'keys',
      'keys',
      'keys',
      'keys',
      'keys',
      'encrypted',
      'encrypted',
      'encrypted',
      'encrypted',
      'decrypting',
      'result'
    ),
  },
}

const c = (
  dataLevel: StepCost['dataLevel'],
  dataShort: string,
  computeLevel: StepCost['computeLevel'],
  computeShort: string,
  where: string,
  note: string
): StepCost => ({ dataLevel, dataShort, computeLevel, computeShort, where, note })

export const KEY_LIFECYCLE_COSTS: Record<LifecycleFlowId, StepCost[]> = {
  'ckks-key-rotation': [
    c(
      1,
      '≤ KB',
      1,
      '~ms',
      'HSM',
      'A session check and a request naming two lineages; no key work happens before every rule has been checked.'
    ),
    c(1, '32 B seed', 1, '~ms', 'HSM', 'One DRBG call, as for any new FHE seed.'),
    c(
      2,
      '15.7 MB',
      2,
      '0.14 s',
      'HSM, streamed',
      'The rotation key is 31,457,872 B at N = 2¹⁶; the token streams its b half, 15,728,640 B, in 4 calls of 8 limbs and signs a 15,006 B manifest. Measured with the software token in a container on a Mac: 0.14 s, token peak 51.4 MiB. On the boards it is not measured; the study extrapolates about 0.9 s on one MX95 core and 0.3 s on six MX95 Pro cores.'
    ),
    c(
      2,
      '~MB / ct',
      2,
      '10–37 ms',
      'FHE server',
      'Measured on a Mac (M5 Max, one container): 36.5 ms for a ciphertext at the top level and 10.1 ms at level 0. Precision 28.7 → 27.1 bits and 28.6 → 27.3 bits.'
    ),
    c(2, '~MB / ct', 0, '—', 'network', 'The switched ciphertext is the same size as before.'),
    c(
      1,
      '~1 MB in',
      2,
      '15 ms',
      'HSM',
      'Decrypting a switched level-0 ciphertext under the new seed and releasing it rounded to 20 bits took 0.015 s and kept 20.99 bits. Under the old key a switched ciphertext gives −27.8 bits at level 0 and −387.8 bits at level 9.'
    ),
    c(
      1,
      '≤ KB',
      1,
      '~ms',
      'HSM',
      'The signed retirement record is committed first, then the old seed is destroyed and the caches and session ledgers that name it are cleared.'
    ),
    c(0, '—', 1, '~ms', 'FHE server', 'The server deletes the 31.5 MB key.'),
  ],
  'ckks-shared-decrypt': [
    c(
      1,
      '32 B seed',
      1,
      '~ms',
      'HSM',
      'Each token derives its main share and its sparse share from its own seed under new key-derivation labels.'
    ),
    c(1, '32 B seed', 1, '~ms', 'HSM', 'The same on the second board.'),
    c(
      4,
      '4.10 GB',
      4,
      'not measured',
      'HSM, streamed',
      '4,098,431,336 B per token (measured size), against 3,941,073,029 B for one token, plus a 157,289,056 B download for the second relinearization round. The time on the boards is not measured; the study extrapolates about 222 s on one MX95 core and 75–87 s on six MX95 Pro cores.'
    ),
    c(
      4,
      '4.10 GB',
      4,
      'not measured',
      'HSM, streamed',
      'The same on the second board; the two tokens stream in parallel.'
    ),
    c(
      4,
      '8.2 GB in',
      3,
      '27 s (proto)',
      'Mac (combiner)',
      'The combiner receives 8.20 GB and outputs the same 7.87 GB joint set. In the prototype, with both parties in one process, the whole 2-party set took 27.3–27.8 s with a Go heap of 15.7–17.1 GB on a Mac; the addition alone was not timed.'
    ),
    c(
      4,
      '7.87 GB',
      0,
      '—',
      'network',
      'The joint evaluation-key set (7.87 GB, measured) goes to the FHE server once; ciphertexts are several MB each.'
    ),
    c(
      4,
      '~GB keys',
      4,
      'sec–min',
      'cloud GPU/CPU',
      'Unchanged from one token. The joint keys bootstrap at 24.3–24.5 bits against 24.9 for one party (measured, Lattigo on a Mac).'
    ),
    c(
      2,
      '~1 MB',
      0,
      '—',
      'network',
      'After computation the result sits at a low level, about 1 MB.'
    ),
    c(
      2,
      '0.5 MB',
      1,
      '~2 ms',
      'HSM',
      'A decryption share at level 0 is 524,304 B, or 1,048,894 B when switched to the owner’s public key; one partial decryption took 1.9 ms per party on a Mac.'
    ),
    c(2, '0.5 MB', 1, '~2 ms', 'HSM', 'The same on the second board, under a second approval.'),
    c(
      1,
      '≤ KB',
      1,
      '~ms',
      'Mac (combiner)',
      'Adding the two shares gives the result. One share alone gives −27.8 bits. Without flooding the result keeps 24.2–24.5 bits; flooded at 2^31.6 it keeps −1.6 to −1.9 bits at the default parameters.'
    ),
  ],
}

export const KEY_LIFECYCLE_KEYS: Record<LifecycleFlowId, KeyId[][]> = {
  'ckks-key-rotation': [
    [],
    ['fhe-seed'],
    ['rotation-key', 'mldsa65'],
    ['rotation-key'],
    [],
    ['fhe-sk'],
    ['fhe-seed', 'mldsa65'],
    ['rotation-key'],
  ],
  'ckks-shared-decrypt': [
    ['fhe-seed'],
    ['fhe-seed'],
    ['ckks-share-keyset', 'mldsa65'],
    ['ckks-share-keyset', 'mldsa65'],
    ['eval-set'],
    ['eval-set', 'fhe-pk'],
    ['eval-set'],
    [],
    ['ckks-dec-share'],
    ['ckks-dec-share'],
    [],
  ],
}

const io = (input: string, kind: StepIO['kind'], computation: string, output: string): StepIO => ({
  input,
  kind,
  computation,
  output,
})

export const KEY_LIFECYCLE_IO: Record<LifecycleFlowId, StepIO[]> = {
  'ckks-key-rotation': [
    io(
      'A security-officer session on the token and the lineage identifiers of the old and the new seed.',
      'transfer',
      'The token checks the session first (user session: CKR_USER_TYPE_INVALID; public session: CKR_USER_NOT_LOGGED_IN), then the parameter set, that the seeds differ, that the token made the new seed, the decryption policy, the direction and the number of targets. The caller sees only the return code; the reason goes to the audit log.',
      'A rotation descriptor naming both lineages, and a rotation ledger for the session. The old seed is marked with its target.'
    ),
    io(
      'Nothing from outside: the token’s entropy source.',
      'keygen',
      'The DRBG draws a 32-byte seed and the secret is derived from it inside the mechanism, as for any FHE seed. The token records that it generated this seed.',
      'A new seed in the same parameter set, under a decryption policy at least as strict as the old seed’s. It never leaves the token.'
    ),
    io(
      'The two seeds, inside the token, and the levels stored ciphertexts use.',
      'streamed',
      'Compute the key-switching key from the old secret to the new one: b = −a·s_new + P·s_old + e at the residual levels, 2 digits × 15 limbs, and send the b half in 4 bounded calls. Hash each piece; once every digit has been sent exactly once, sign the manifest of hashes with ML-DSA-65.',
      '15,728,640 B of b limbs and a signed manifest (15,006 B). The receiver re-expands a from the descriptor and checks each piece. Byte-identical to Lattigo’s rebuild (30 of 30 limbs).'
    ),
    io(
      'The stored ciphertexts under the old key and the rotation key.',
      'homomorphic',
      'Decompose the second component of each ciphertext into gadget digits and take the inner product with the rotation key (key switching). No plaintext appears and no secret is needed.',
      'Each ciphertext now decrypts under the new secret, with about 1.3–1.6 bits less precision.'
    ),
    io(
      'A switched ciphertext at the server.',
      'transfer',
      'Send it back over TLS. The server never held a key that could open it.',
      'The switched ciphertext at the owner.'
    ),
    io(
      'The switched ciphertext and the owner’s authenticated request, under the new seed’s policy.',
      'decrypt',
      'Policy gate, then decryption with the new secret, decoding and rounding to 20 bits. The same ciphertext under the old secret decodes to noise.',
      'The released values, 20.99 bits of precision. Under the old key: −27.8 bits (level 0).'
    ),
    io(
      'A signed rotation manifest, and the report of the server that every stored ciphertext was switched.',
      'sign',
      'The security officer calls the retirement. The token acts only on a seed whose rotation manifest was signed. It commits a signed retirement record (both lineages, the parameter hash, the token time and the hash of the rotation descriptor), then destroys the old seed and clears every cache and session ledger that names it.',
      'A public, immutable retirement record linked to the rotation manifest, and no old seed.'
    ),
    io(
      'The rotation key held at the server.',
      'transfer',
      'Delete the key. With the new secret it would reveal the old one.',
      'No rotation key anywhere.'
    ),
  ],
  'ckks-shared-decrypt': [
    io(
      'The token’s entropy source and the group parameters (the common public randomness, the party index).',
      'keygen',
      'Derive a random ternary main share and a sparse share from the token’s own seed.',
      'A share inside the token. The secret is the sum of the shares and exists nowhere.'
    ),
    io(
      'The same on the second board.',
      'keygen',
      'The same derivation from the second token’s own seed.',
      'A second share. Neither token learns the other’s.'
    ),
    io(
      'The share and the common public randomness.',
      'streamed',
      'For each key, compute the token’s share limb by limb with the same formula as a single-token key chunk, the share in place of the secret, and stream it in bounded calls. The relinearization key takes two rounds.',
      '4.10 GB of key shares and a signed manifest; 157 MB of aggregated round 1 comes back for round 2.'
    ),
    io(
      'The same on the second board.',
      'streamed',
      'The same streaming from the second token, in parallel.',
      '4.10 GB of key shares and its own signed manifest.'
    ),
    io(
      'Both streams of shares and both manifests.',
      'combine',
      'Check both manifests, then add the two b limbs modulo each prime at the same position. Shares of public keys are random-looking samples, so an untrusted machine can do this.',
      'One joint public key and evaluation-key set, 7.87 GB; the joint keys bootstrap at 24.3–24.5 bits.'
    ),
    io(
      'The data and the joint public key.',
      'encrypt',
      'Encode and encrypt under the joint public key on the owner’s device, then upload with the joint evaluation keys.',
      'Ciphertexts and the joint evaluation keys at the FHE server.'
    ),
    io(
      'Ciphertexts and the joint evaluation keys.',
      'homomorphic',
      'Add, multiply with relinearization, rotate and bootstrap, all with public keys. The same as for one token.',
      'The encrypted result.'
    ),
    io(
      'The encrypted result at the server.',
      'transfer',
      'Send it back over TLS.',
      'The encrypted result at the owner.'
    ),
    io(
      'The result ciphertext and token A’s own approval.',
      'decrypt',
      'Compute a decryption share with the token’s share of the secret, flooded, optionally switched to the owner’s public key. A crafted request here returns the token’s whole share.',
      'A share: 524,304 B (1,048,894 B to the owner’s key).'
    ),
    io(
      'The result ciphertext and token B’s own approval.',
      'decrypt',
      'The same with token B’s share, under a second approval.',
      'A second share.'
    ),
    io(
      'Both decryption shares.',
      'combine',
      'Add the shares and decode. One share alone decodes to noise.',
      'The result values; −27.8 bits from one share alone.'
    ),
  ],
}

const p = (
  item: Placement['item'],
  at: string,
  mode: Placement['mode'],
  from: number,
  extra: Partial<Placement> = {}
): Placement => ({ item, at, mode, from, ...extra })

const atRest = (item: Placement['item'], from: number, until?: number): Placement =>
  p(item, 'datacenter', 'rest-plain', from, {
    persisted: true,
    ...(until !== undefined ? { until } : {}),
  })

export const KEY_LIFECYCLE_MAP: Record<LifecycleFlowId, Placement[]> = {
  'ckks-key-rotation': [
    p('ct-data', 'cloud', 'memory', 0, { until: 2 }),
    atRest('ct-data', 0, 2),
    p('old-seed', 'hsm', 'hsm', 0, { until: 5 }),
    p('new-seed', 'hsm', 'hsm', 1),
    p('rotation-key', 'cloud', 'memory', 2, { until: 6 }),
    p('ct-switched', 'cloud', 'memory', 3),
    atRest('ct-switched', 3),
    p('ct-switched', 'client', 'memory', 4),
    p('ct-switched', 'hsm', 'hsm', 5, { until: 5 }),
    p('plain-result', 'hsm', 'hsm', 5, { until: 5 }),
    p('plain-result', 'client', 'memory', 5),
    p('retire-record', 'hsm', 'hsm', 6),
  ],
  'ckks-shared-decrypt': [
    p('plain-data', 'client', 'memory', 0),
    p('sk-share', 'hsmA', 'shared', 0),
    p('sk-share', 'hsmB', 'shared', 1),
    p('eval-keys', 'client', 'memory', 4, { until: 5 }),
    p('fhe-pk', 'client', 'memory', 4),
    p('eval-keys', 'cloud', 'memory', 5),
    atRest('eval-keys', 5),
    p('ct-data', 'cloud', 'memory', 5),
    atRest('ct-data', 5),
    p('ct-result', 'cloud', 'memory', 6),
    atRest('ct-result', 6),
    p('ct-result', 'client', 'memory', 7, { until: 9 }),
    p('ct-result', 'hsmA', 'hsm', 8, { until: 8 }),
    p('ct-result', 'hsmB', 'hsm', 9, { until: 9 }),
    p('shares-out', 'client', 'memory', 8),
    p('plain-result', 'client', 'memory', 10),
  ],
}
