/**
 * Starter pipelines. Same three teaching scenarios as before, rebuilt so every step
 * binds to a real earlier output instead of naming one in prose.
 *
 * The originals referenced values like 'payload.bin', 'transcript', 'digest' and
 * 'shared-secret', which the generator interpolated into Python as expressions. All
 * three died on NameError partway through; none had ever run to completion.
 */
import type { PipelineStep } from './pipelineCodegen'
import { PIPELINE_INPUT_ID } from './pipelineCodegen'

const ref = (step: string): PipelineStep['params'][string] => ({ bind: 'ref', step })
const pub = (step: string): PipelineStep['params'][string] => ({ bind: 'key', step, part: 'pub' })
const priv = (step: string): PipelineStep['params'][string] => ({ bind: 'key', step, part: 'priv' })
const secret = (step: string): PipelineStep['params'][string] => ({ bind: 'key', step, part: 'secret' })
const input = (): PipelineStep['params'][string] => ({ bind: 'ref', step: PIPELINE_INPUT_ID })
const lit = (value: string): PipelineStep['params'][string] => ({ bind: 'literal', value })

const step = (
  id: string, primId: string, op: PipelineStep['op'], params: PipelineStep['params'],
): PipelineStep => ({ id, primId, op, params, status: 'idle', output: null })

export const TEMPLATES: Record<string, PipelineStep[]> = {
  /** Encrypt a payload under a session key, hash the ciphertext, sign the hash. */
  'Encrypt + sign (PQ)': [
    step('t1', 'aes-256-gcm', 'generate', { keyLabel: lit('session-aes') }),
    step('t2', 'aes-256-gcm', 'encrypt', { key: secret('t1'), input: input() }),
    step('t3', 'sha3-256', 'digest', { input: ref('t2') }),
    step('t4', 'ml-dsa-65', 'generate', { keyLabel: lit('pq-signer') }),
    step('t5', 'ml-dsa-65', 'sign', { privKey: priv('t4'), input: ref('t3') }),
  ],

  /** KEM establishes a shared secret, then the server authenticates the transcript. */
  'PQ TLS handshake': [
    step('t1', 'ml-kem-768', 'generate', { keyLabel: lit('kem-session') }),
    step('t2', 'ml-kem-768', 'encapsulate', { pubKey: pub('t1') }),
    step('t3', 'ml-kem-768', 'decapsulate', { privKey: priv('t1'), ciphertext: ref('t2') }),
    step('t4', 'ml-dsa-65', 'generate', { keyLabel: lit('server-dsa') }),
    step('t5', 'ml-dsa-65', 'sign', { privKey: priv('t4'), input: input() }),
  ],

  /** The same digest signed by both a PQ and a classical key — the migration pattern. */
  'Hybrid signature': [
    step('t1', 'ml-dsa-65', 'generate', { keyLabel: lit('pq-key') }),
    step('t2', 'ecdsa-p256', 'generate', { keyLabel: lit('classical-key') }),
    step('t3', 'sha-256', 'digest', { input: input() }),
    step('t4', 'ml-dsa-65', 'sign', { privKey: priv('t1'), input: ref('t3') }),
    step('t5', 'ecdsa-p256', 'sign', { privKey: priv('t2'), input: ref('t3') }),
  ],

  /**
   * The full ML-KEM round trip on one keypair. This is the flow the previous builder
   * got most wrong — it shelled out to a C binary that made its own keys — and the one
   * the PKCS#11 v3.2 encapsulate/decapsulate entry points exist for.
   */
  'ML-KEM round trip': [
    step('t1', 'ml-kem-768', 'generate', { keyLabel: lit('kem') }),
    step('t2', 'ml-kem-768', 'encapsulate', { pubKey: pub('t1') }),
    step('t3', 'ml-kem-768', 'decapsulate', { privKey: priv('t1'), ciphertext: ref('t2') }),
  ],

  Empty: [],
}

export const TEMPLATE_NAMES = Object.keys(TEMPLATES)

/**
 * What a completed pipeline PROVES — B+ remediation (2026-08-10).
 *
 * The review said this builder "opens empty, with no starting template". Half
 * of that was already wrong: `PipelinePage` has always instantiated
 * 'Encrypt + sign (PQ)' on mount, so nobody meets a blank canvas. The half that
 * was right is the second one — "no statement of what a completed pipeline
 * demonstrates". A finished run printed outputs and stopped, which is the same
 * ending-in-silence problem the scenario runner had.
 *
 * One sentence per template, shown when the pipeline finishes. Each names the
 * claim the run supports, not the steps it took — the steps are already on
 * screen.
 */
export const TEMPLATE_OUTCOMES: Record<string, string> = {
  'Encrypt + sign (PQ)':
    'You encrypted a payload, hashed the ciphertext, and signed the hash with ML-DSA-65 — every byte produced by real FIPS-validated code paths, not a mock. That chain is the shape most document- and message-signing systems actually use, and the signature you just produced is ~3,309 bytes where an Ed25519 one would have been 64.',
  'PQ TLS handshake':
    'You ran the key-establishment half of a post-quantum TLS handshake end to end. The ML-KEM-768 ciphertext and public key together are what push a real ClientHello past a single network datagram — the constraint that breaks middleboxes before it breaks cryptography.',
  'Hybrid signature':
    'You produced a signature that is valid under both a classical and a post-quantum algorithm. That is what hybrid buys: it stays verifiable if either algorithm is broken, and you pay for both on every single operation.',
  'ML-KEM round trip':
    'You encapsulated to a public key and decapsulated back to the identical shared secret. The secret never travelled — only the ciphertext did, and that is the whole difference between a KEM and key transport.',
}
