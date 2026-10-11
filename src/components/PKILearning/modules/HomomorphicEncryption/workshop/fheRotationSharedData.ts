// SPDX-License-Identifier: GPL-3.0-only
import type { CkksEvidenceKey } from '../data/fheCkksEvidence'

/**
 * Data and rules behind the two key-lifecycle views of the FHE workshop (2026-10-11): key
 * rotation without decrypting stored data, and shared (2-of-2) decryption by two tokens.
 *
 * Every measured number names the evidence record it comes from (CKKS_EVIDENCE key):
 *  - rotation: ckks-rotation-key-m5max-ab8b1c3 (rotation-check.json, rotate.json, e2e-check.json);
 *  - shared decryption: ckks-threshold-2of2-lattigo-m5max-8beec58 (n16threshold-*.json,
 *    sizes2.json, tdecrypt2.json); the one-party bootstrap (24.9 bits) comes from
 *    ckks-keyset-sizes-m5max-7de154b.
 * The rules of the refusals are the token's, as merged in pqctoday-hsm #353 and #354: module
 * comment of rust/src/replication/fhe_ckks/rotation.rs and docs/proposals/
 * pkcs11-ckm-pqctoday-fhe-proposal.md §6.7. Nothing here is interpolated.
 */

/** The two key-lifecycle views, and the two places each one lives in the workshop. */
export type LifecycleView = 'rotation' | 'shared'
export type LifecycleFamily = 'concepts' | 'flows'
export type OpenLifecycleView = (view: LifecycleView, family: LifecycleFamily) => void

/** Workshop step index of each family (manifest workshopSteps order). */
export const LIFECYCLE_STEP: Record<LifecycleFamily, number> = { flows: 0, concepts: 1 }

/** Flow-scenario id of each view in the FHE + HSM Flows step. */
export const LIFECYCLE_FLOW_ID = {
  rotation: 'ckks-key-rotation',
  shared: 'ckks-shared-decrypt',
} as const

/* ------------------------------------------------------------------ */
/*  Key rotation                                                       */
/* ------------------------------------------------------------------ */

export const ROTATION_MEASURED = {
  /** Both halves of the old → new switching key at N = 2^16 (rotation-check.json). */
  keyBytes: 31_457_872,
  /** The b halves the token streams (rotate.json). */
  streamedBytes: 15_728_640,
  streamCalls: 4,
  limbsPerCall: 8,
  /** Limbs compared with Lattigo's own rebuild, mismatches (rotation-check.json). */
  limbsCompared: 30,
  mismatches: 0,
  /** Signed rotation manifest (rotate.json). */
  manifestBytes: 15_006,
  top: { level: 9, before: '28.7', after: '27.1', switchMs: '36.5', oldKey: '−387.8' },
  bottom: { level: 0, before: '28.6', after: '27.3', switchMs: '10.1', oldKey: '−27.8' },
  /** The new seed decrypts a switched level-0 ciphertext under its policy (e2e-check.json). */
  newKeyReleaseBits: '20.99',
  releasePrecisionBitsSetting: 20,
  /** What a bootstrapping-level key would cost instead (plan figure, corrected). */
  bootstrappingLevelKeyBytes: 157_289_056,
  evidence: 'rotation' as CkksEvidenceKey,
}

export interface RotationStep {
  id: string
  actor: string
  title: string
  body: string
  /** State of the five things the view tracks after this step. */
  state: {
    oldSecret: string
    newSecret: string
    rotationKey: string
    storedCiphertexts: string
    signedRecords: string
  }
  numbers?: { label: string; value: string }[]
}

const fmt = (n: number) => n.toLocaleString('en-US')

export const ROTATION_STEPS: RotationStep[] = [
  {
    id: 'so-starts',
    actor: 'Security officer',
    title: 'The security officer starts the rotation',
    body: 'Only a security-officer session may run a rotation. The token checks the session first, before it looks at any key, and a user session or a public session is refused. The security officer names the two seeds by lineage and never holds a handle to either.',
    state: {
      oldSecret: 'held by the token',
      newSecret: 'not made yet',
      rotationKey: 'not made yet',
      storedCiphertexts: 'under the old key, at the server',
      signedRecords: 'none',
    },
  },
  {
    id: 'token-makes-new',
    actor: 'Token',
    title: 'The token generates the new secret itself',
    body: 'The new seed is made inside the token, never supplied or imported by the caller. A switching key toward a secret the caller knows would hand over the old secret, so a seed that was imported, or copied from another token, is refused as the new secret.',
    state: {
      oldSecret: 'held by the token',
      newSecret: 'made by the token (stays in the token)',
      rotationKey: 'not made yet',
      storedCiphertexts: 'under the old key, at the server',
      signedRecords: 'none',
    },
  },
  {
    id: 'stream-key',
    actor: 'Token → server',
    title: 'The rotation key is streamed with a signed manifest',
    body: 'One key-switching key from the old secret to the new one, at the lower levels stored ciphertexts use. The token streams it in bounded calls and signs a manifest of the pieces once every digit has been sent exactly once. It is byte-identical to the key Lattigo rebuilds from the two seeds.',
    state: {
      oldSecret: 'held by the token',
      newSecret: 'held by the token',
      rotationKey: 'streamed to the server',
      storedCiphertexts: 'under the old key, at the server',
      signedRecords: 'signed rotation manifest',
    },
    numbers: [
      { label: 'Rotation key', value: `${fmt(ROTATION_MEASURED.keyBytes)} B` },
      {
        label: 'Streamed',
        value: `${fmt(ROTATION_MEASURED.streamedBytes)} B in ${ROTATION_MEASURED.streamCalls} calls of ${ROTATION_MEASURED.limbsPerCall} limbs`,
      },
      {
        label: 'Compared with Lattigo',
        value: `${ROTATION_MEASURED.limbsCompared} limbs, ${ROTATION_MEASURED.mismatches} mismatches`,
      },
    ],
  },
  {
    id: 'server-switches',
    actor: 'FHE server',
    title: 'The server switches each stored ciphertext',
    body: 'No plaintext appears: the server applies the key to each ciphertext and the result decrypts under the new secret. Switching costs about 1.3–1.6 bits of precision.',
    state: {
      oldSecret: 'held by the token',
      newSecret: 'held by the token',
      rotationKey: 'at the server, in use',
      storedCiphertexts: 'switched, now under the new key',
      signedRecords: 'signed rotation manifest',
    },
    numbers: [
      {
        label: `Top level (${ROTATION_MEASURED.top.level})`,
        value: `${ROTATION_MEASURED.top.switchMs} ms; ${ROTATION_MEASURED.top.before} → ${ROTATION_MEASURED.top.after} bits`,
      },
      {
        label: `Level ${ROTATION_MEASURED.bottom.level}`,
        value: `${ROTATION_MEASURED.bottom.switchMs} ms; ${ROTATION_MEASURED.bottom.before} → ${ROTATION_MEASURED.bottom.after} bits`,
      },
    ],
  },
  {
    id: 'old-key-fails',
    actor: 'Token',
    title: 'The old key no longer decrypts the result',
    body: 'A switched ciphertext decrypts under the new secret (released rounded to 20 bits it keeps 20.99 bits) and gives noise under the old one. Whether someone who holds the old secret could read a switched ciphertext without having kept the original is not established.',
    state: {
      oldSecret: 'held by the token, no longer decrypts the result',
      newSecret: 'held by the token, decrypts the result',
      rotationKey: 'at the server, in use',
      storedCiphertexts: 'switched, now under the new key',
      signedRecords: 'signed rotation manifest',
    },
    numbers: [
      {
        label: 'Old key on a switched ciphertext',
        value: `${ROTATION_MEASURED.top.oldKey} bits (level ${ROTATION_MEASURED.top.level}), ${ROTATION_MEASURED.bottom.oldKey} bits (level ${ROTATION_MEASURED.bottom.level})`,
      },
      { label: 'New key, rounded release', value: `${ROTATION_MEASURED.newKeyReleaseBits} bits` },
    ],
  },
  {
    id: 'so-retires',
    actor: 'Security officer + token',
    title: 'The security officer retires the old secret',
    body: 'Only after the rotation manifest was signed, and after the server reports every stored ciphertext switched; the token cannot check that itself. The token first commits a signed retirement record, a public object nobody can change or delete, and only then destroys the old seed.',
    state: {
      oldSecret: 'destroyed',
      newSecret: 'held by the token',
      rotationKey: 'at the server, in use',
      storedCiphertexts: 'under the new key',
      signedRecords: 'signed rotation manifest, then signed retirement record',
    },
  },
  {
    id: 'server-deletes',
    actor: 'FHE server',
    title: 'The server deletes the rotation key',
    body: 'Whoever holds the new secret and the rotation key can compute the old secret, so the key is used once and deleted. The new key set (3.94 GB) must still be streamed; the rotation key moves stored data, it does not replace it. Rotation does not repair past exposure: copies of old ciphertexts held by someone who already knows the old secret stay readable.',
    state: {
      oldSecret: 'destroyed',
      newSecret: 'held by the token',
      rotationKey: 'deleted',
      storedCiphertexts: 'under the new key',
      signedRecords: 'signed rotation manifest, then signed retirement record',
    },
  },
]

export const ROTATION_STATE_ROWS: { key: keyof RotationStep['state']; label: string }[] = [
  { key: 'oldSecret', label: 'Old secret' },
  { key: 'newSecret', label: 'New secret' },
  { key: 'rotationKey', label: 'Rotation key' },
  { key: 'storedCiphertexts', label: 'Stored ciphertexts' },
  { key: 'signedRecords', label: 'Signed records' },
]

export type RotationSession = 'so' | 'user' | 'public'
export type RotationNewSecret =
  | 'token-made'
  | 'same-seed'
  | 'other-set'
  | 'replica'
  | 'rotate-back'
  | 'second-target'
  | 'looser-policy'

export const ROTATION_SESSIONS: { id: RotationSession; label: string }[] = [
  { id: 'so', label: 'Security officer' },
  { id: 'user', label: 'User session' },
  { id: 'public', label: 'Public session (nobody logged in)' },
]

export const ROTATION_NEW_SECRETS: { id: RotationNewSecret; label: string }[] = [
  { id: 'token-made', label: 'A new seed the token generated' },
  { id: 'same-seed', label: 'The same seed as the old one' },
  { id: 'other-set', label: 'A seed of a different parameter set' },
  { id: 'replica', label: 'A copy of a token-made key (not made by this token)' },
  { id: 'rotate-back', label: 'Going back: new → old' },
  { id: 'second-target', label: 'A second target for the same old secret' },
  { id: 'looser-policy', label: 'A new seed with a looser decryption policy' },
]

export interface RotationOutcome {
  allowed: boolean
  /** PKCS#11 return code the caller sees; null when allowed. */
  code: string | null
  /** The rule behind it; the caller sees only the code, the reason goes to the audit log. */
  rule: string
}

/**
 * What the token does, in the order it checks (rotation.rs, `rotation_seeds`): the session
 * first, whatever the seeds; then the parameter set; the same seed; whether this token made the
 * new seed; the decryption policy; the direction; one target only.
 */
export function rotationAttempt(
  session: RotationSession,
  newSecret: RotationNewSecret
): RotationOutcome {
  if (session === 'public')
    return {
      allowed: false,
      code: 'CKR_USER_NOT_LOGGED_IN',
      rule: 'A rotation needs a security-officer session; nobody is logged in.',
    }
  if (session === 'user')
    return {
      allowed: false,
      code: 'CKR_USER_TYPE_INVALID',
      rule: 'A user session may not run a rotation; the security officer must.',
    }
  switch (newSecret) {
    case 'other-set':
      return {
        allowed: false,
        code: 'CKR_KEY_TYPE_INCONSISTENT',
        rule: 'Both seeds must belong to the same parameter set.',
      }
    case 'same-seed':
      return {
        allowed: false,
        code: 'CKR_KEY_FUNCTION_NOT_PERMITTED',
        rule: 'The new seed must differ from the old one in value and lineage. (Naming one lineage twice gives CKR_MECHANISM_PARAM_INVALID.)',
      }
    case 'replica':
      return {
        allowed: false,
        code: 'CKR_KEY_FUNCTION_NOT_PERMITTED',
        rule: 'The new seed must have been generated by this token. A copy received from another token is refused even if that token made it: its secret also exists elsewhere, where the rotation rules do not reach.',
      }
    case 'looser-policy':
      return {
        allowed: false,
        code: 'CKR_KEY_FUNCTION_NOT_PERMITTED',
        rule: 'The new seed’s decryption policy must be equal to or stricter than the old one’s: a rotation never widens what may be released.',
      }
    case 'rotate-back':
      return {
        allowed: false,
        code: 'CKR_KEY_FUNCTION_NOT_PERMITTED',
        rule: 'A seed that has been rotated away from can never be a rotation target: one direction only.',
      }
    case 'second-target':
      return {
        allowed: false,
        code: 'CKR_KEY_FUNCTION_NOT_PERMITTED',
        rule: 'An old seed rotates to one target only.',
      }
    default:
      return {
        allowed: true,
        code: null,
        rule: 'Every rule holds: the security officer may stream the rotation key from the old seed to the new one.',
      }
  }
}

/* ------------------------------------------------------------------ */
/*  Shared (2-of-2) decryption                                         */
/* ------------------------------------------------------------------ */

export const SHARED_MEASURED = {
  /** Each token's upload of key shares, and the single-token stream (sizes2.json, keyset sizes). */
  perTokenUploadBytes: 4_098_431_336,
  singleTokenBytes: 3_941_073_029,
  /** Σ relinearization round 1, downloaded by each token before it streams round 2. */
  relinDownloadBytes: 157_289_056,
  /** A decryption share at level 0, and switched to the owner's public key (sizes2.json). */
  shareBytes: 524_304,
  shareToOwnerBytes: 1_048_894,
  shareMs: '1.9',
  jointBootstrapBits: '24.3–24.5',
  oneParty: '24.9',
  oneShareAloneBits: '−27.8',
  jointWeight: '384',
  singleWeight: '192',
  craftedRecovered: '65,536',
  craftedTotal: '65,536',
  /** Threshold decryption after the joint bootstrap, by flood width (record notes). */
  noFloodBits: '24.2–24.5',
  smallFloodBits: '9.8–9.9',
  floodBits: '−1.6 to −1.9',
  evidence: 'threshold' as CkksEvidenceKey,
}

export interface SharedStep {
  id: string
  actor: string
  title: string
  body: string
  numbers?: { label: string; value: string }[]
}

export const SHARED_STEPS: SharedStep[] = [
  {
    id: 'two-shares',
    actor: 'Two tokens',
    title: 'Each board holds one share of the secret',
    body: 'Token A (MX95) and token B (MX95 Pro) each make a random share; the secret is their sum and nobody ever holds it. The sum has about twice as many non-zero coefficients as one secret, and bootstrapping with the joint keys still works (measured).',
    numbers: [
      {
        label: 'Non-zero coefficients, one secret / joint',
        value: `${SHARED_MEASURED.singleWeight} / about ${SHARED_MEASURED.jointWeight}`,
      },
    ],
  },
  {
    id: 'stream-shares',
    actor: 'Tokens → Mac',
    title: 'Each token streams its share of the key set',
    body: 'In the same chunk format as one token, for 50 of the 51 keys. The relinearization key needs two rounds, so each token also downloads the sum of round 1 before it streams round 2.',
    numbers: [
      {
        label: 'Each token uploads',
        value: `${(SHARED_MEASURED.perTokenUploadBytes / 1e9).toFixed(2)} GB (one token: ${(SHARED_MEASURED.singleTokenBytes / 1e9).toFixed(2)} GB)`,
      },
      {
        label: 'Each token downloads',
        value: `${(SHARED_MEASURED.relinDownloadBytes / 1e6).toFixed(0)} MB`,
      },
    ],
  },
  {
    id: 'join-keys',
    actor: 'Mac',
    title: 'The Mac adds the shares into one joint key set',
    body: 'Shares of public keys are random-looking samples, so an untrusted machine can add them. The joint keys bootstrap about half a bit below a single party.',
    numbers: [
      {
        label: 'Bootstrap with the joint keys / one party',
        value: `${SHARED_MEASURED.jointBootstrapBits} / ${SHARED_MEASURED.oneParty} bits`,
      },
    ],
  },
  {
    id: 'ask-both',
    actor: 'Mac → both tokens',
    title: 'To decrypt, both tokens answer, each under its own approval',
    body: 'Each token returns a decryption share of the result. Switched to the owner’s public key, whoever combines the shares does not learn the plaintext.',
    numbers: [
      {
        label: 'Share, level 0',
        value: `${SHARED_MEASURED.shareBytes.toLocaleString('en-US')} B (${SHARED_MEASURED.shareToOwnerBytes.toLocaleString('en-US')} B to the owner’s key), ${SHARED_MEASURED.shareMs} ms`,
      },
    ],
  },
  {
    id: 'combine',
    actor: 'Mac / owner',
    title: 'The shares are combined; one alone decrypts nothing',
    body: 'Both shares together give the result. One share alone gives noise.',
    numbers: [{ label: 'One share alone', value: `${SHARED_MEASURED.oneShareAloneBits} bits` }],
  },
]

export interface SharedOutcome {
  /** Headline for what a compromised requester obtains. */
  requester: { tone: 'ok' | 'bad'; text: string }
  /** What the result looks like to its reader. */
  result: { tone: 'ok' | 'bad'; text: string; bits: string }
  notes: string[]
}

/**
 * Outcome of the two toggles, from the measurements: a crafted request to one token returns that
 * token's whole share (65,536 of 65,536 coefficients), also when flooded; so a requester that can
 * obtain answers from both tokens recovers the joint secret, and one that can reach only one token
 * gets a share that decrypts nothing alone. Flooding at the width 30-bit security needs leaves no
 * correct bits at the default parameters.
 */
export function sharedOutcome(independent: boolean, flooding: boolean): SharedOutcome {
  const m = SHARED_MEASURED
  return {
    requester: independent
      ? {
          tone: 'ok',
          text: `A compromised requester can obtain one share (a crafted request returns the token’s whole share, ${m.craftedRecovered} of ${m.craftedTotal} coefficients), and one share alone decrypts nothing (${m.oneShareAloneBits} bits). It cannot get an answer from the second token without that token’s own approver.`,
        }
      : {
          tone: 'bad',
          text: `One application or person approves both tokens, so a compromised requester can send a crafted request to each: each returns its whole share (${m.craftedRecovered} of ${m.craftedTotal} coefficients) and the two shares add up to the secret. This is back to single-token trust.`,
        },
    result: flooding
      ? {
          tone: 'bad',
          bits: m.floodBits,
          text: `Flooded at the 2^31.6 width of the earlier sizing, the result keeps ${m.floodBits} bits at the default parameters: nothing usable. The corrected width is wider (2^43.1 for one token), so it fails by more. A smaller flood of 2^20 keeps ${m.smallFloodBits} bits but is narrower than 30-bit statistical security over 10,000 releases needs.`,
        }
      : {
          tone: 'bad',
          bits: m.noFloodBits,
          text: `Without flooding the result keeps ${m.noFloodBits} bits, but a partial decryption that is not flooded leaks like a whole key when results are seen by others, so releases to third parties are not safe.`,
        },
    notes: [
      'Each token floods at the full width, because it must protect itself against the receiver colluding with the other token; the total is about half a bit worse than one token.',
      'Two designs are open: shares re-encrypted to the owner’s public key (policy limited to authorization, counters and flooding), or one combining token that applies the full decryption policy and accepts the combiner-plus-requester risk. Both are still open.',
      'More than two parties (for example 2-of-3) is not recommended: key-recovery attacks are reported on the t-of-N threshold decryption of Mouchet et al. (ePrint 2026/031, a preprint). Whether they apply to a fixed 2-of-2 split is not established.',
    ],
  }
}
