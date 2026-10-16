// SPDX-License-Identifier: AGPL-3.0-only
//
// Quick run — the three-step first win on the Migration tab: create a signing
// key behind a label under the classical policy, switch the policy, then use
// the key by label and watch the engine rekey it. This file holds the pure
// parts (the record shape and its copyable summary) so they can be tested
// without booting the WASM engine.

/** Label the quick run uses. It matches the classical policy's `firmware-*`
 * signing rule, but is distinct from the estate card's
 * `firmware-release-signing`, so the two never pick up each other's keys. */
export const QUICK_RUN_LABEL = 'firmware-quickrun-signing'

export const QUICK_RUN_MESSAGE = 'approve release 1.0.0'

/** One key as observed on the engine at a point in the run. */
export interface QuickRunKey {
  uid: string
  algorithm: string
  state: string
  quantumSafe: boolean | null
}

export interface QuickRunRecord {
  label: string
  message: string
  policyBefore: string
  policyAfter: string
  /** Key and signature produced in step 1, under the classical policy. */
  before: QuickRunKey
  signatureBytesBefore: number
  /** Active key under the same label after step 3. */
  after: QuickRunKey
  /** State of the step-1 key after step 3 (expected `Deactivated`). */
  beforeStateAfterRun: string
  /** Whether the step-1 key now points at the step-3 key as its successor. */
  successorLinked: boolean
  signatureBytesAfter: number
  /** Verification of the step-3 signature with the new public key. */
  verified: boolean
  /** One `op: event types` line per request the run made, in order. */
  events: string[]
  appVersion: string | null
  buildCommit: string | null
  /** ISO timestamp of step 3. */
  ranAt: string
}

const LIMITATIONS = [
  'Runs on an in-browser software token (SoftHSM compiled to WebAssembly). There is no hardware boundary, and it is not a FIPS 140-3 validated module.',
  'The protocol is KMIP 3.0 Committee Specification Draft 02 (an OASIS draft, not a ratified standard).',
  'The application kept working because it looks the key up by its label. The new key has a new UniqueIdentifier, so a client that stores the identifier, the public key or a certificate must change too.',
  'Signature size changed (see above). Callers with fixed-size buffers, database columns or message limits must be checked.',
]

const yesNo = (v: boolean | null) => (v === null ? 'unknown' : v ? 'yes' : 'no')

/** The copyable Markdown summary of a completed quick run. */
export function buildQuickRunSummary(r: QuickRunRecord): string {
  const keyRow = (name: string, k: QuickRunKey, sigBytes: number, state = k.state) =>
    `| ${name} | \`${k.uid}\` | ${k.algorithm} | ${state} | ${yesNo(k.quantumSafe)} | ${sigBytes} |`

  const lines = [
    '# KMIP quick run: policy-driven rekey',
    '',
    `- Key label: \`${r.label}\``,
    `- Policy: \`${r.policyBefore}\` → \`${r.policyAfter}\``,
    `- Message signed: "${r.message}"`,
    `- Run at: ${r.ranAt}`,
    `- Site version: ${r.appVersion ?? 'unknown'}${r.buildCommit ? ` (commit ${r.buildCommit})` : ''}`,
    '',
    '## Result',
    '',
    '| Key | UniqueIdentifier | Algorithm | State | Quantum-safe | Signature bytes |',
    '|---|---|---|---|---|---|',
    keyRow('Before (step 1)', r.before, r.signatureBytesBefore, r.beforeStateAfterRun),
    keyRow('After (step 3)', r.after, r.signatureBytesAfter),
    '',
    `- Same label, new identifier: ${r.before.uid !== r.after.uid ? 'yes' : 'no'}`,
    `- Old key points to its successor: ${r.successorLinked ? 'yes' : 'no'}`,
    `- New signature verifies with the new public key: ${r.verified ? 'yes' : 'no'}`,
    '',
    '## Audit events',
    '',
    ...(r.events.length > 0 ? r.events.map((e) => `- ${e}`) : ['- (none recorded)']),
    '',
    '## Limitations',
    '',
    ...LIMITATIONS.map((l) => `- ${l}`),
    '',
  ]
  return lines.join('\n')
}
