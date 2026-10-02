// SPDX-License-Identifier: GPL-3.0-only

// ── Per-step Input → Computation → Output for the FHE + HSM flows ─────────
// Aligned by index with each flow's `steps` (checked by fheHsmCosts.test.ts).
// Notation: s = FHE secret key, (b, a) = public key, ct = (c0, c1) ciphertext,
// e = small error, u = small random polynomial. CKKS for the single-HSM and
// compute-limits flows, TFHE for the TFHE flows, BFV / BGV for the threshold flows.

import type { FheFlowId } from './fheHsmFlows'

export type ComputeKind =
  | 'keygen'
  | 'sign'
  | 'encrypt'
  | 'homomorphic'
  | 'decrypt'
  | 'wrap'
  | 'transfer'
  | 'symmetric'
  | 'combine'
  | 'rejected'

export interface StepIO {
  input: string
  kind: ComputeKind
  computation: string
  output: string
}

export const COMPUTE_KIND_LABELS: Record<ComputeKind, string> = {
  keygen: 'Key generation',
  sign: 'Signing',
  encrypt: 'Encode + encrypt',
  homomorphic: 'Homomorphic evaluation',
  decrypt: 'Decryption',
  wrap: 'Key wrapping',
  transfer: 'Transfer only',
  symmetric: 'Symmetric crypto',
  combine: 'Share combination',
  rejected: 'Rejected: does not fit',
}

const io = (input: string, kind: ComputeKind, computation: string, output: string): StepIO => ({
  input,
  kind,
  computation,
  output,
})

export const FHE_STEP_IO: Record<FheFlowId, StepIO[]> = {
  'single-hsm': [
    io(
      'Nothing from outside: the HSM entropy source plus the agreed parameter set (N = 2¹⁶, modulus chain, scale).',
      'keygen',
      'The DRBG draws a 32-byte seed. A PRNG expands it into the ternary secret polynomial s, which is transformed into NTT form for fast arithmetic.',
      'A seed stored as a non-extractable key object that leaves only by replication to an authenticated HSM. s exists only in HSM memory.'
    ),
    io(
      's (inside the HSM), the parameter set and the list of rotation steps the computation needs.',
      'rejected',
      'For each target (s², and s(X^k) for every rotation k): sample a random a and an error e, then form b = −a·s + e + gadget·target. That is thousands of NTT polynomial multiplications. The finished key set is hashed and the hash signed.',
      'In theory: ~GB of relinearization, rotation and conjugation keys plus a signature. In practice an HSM cannot produce or export this volume, which is why this model does not scale.'
    ),
    io(
      's and the parameter set.',
      'keygen',
      'Sample a (from a seed) and an error e, compute b = −a·s + e, then sign the hash of (b, a).',
      'Public key pk = (b, a), ~15–30 MB at N = 2¹⁶ (estimate), plus its signature, sent to the data owner.'
    ),
    io(
      'Plaintext values (up to 32,768 reals per ciphertext) and the public key, whose signature the client has verified.',
      'encrypt',
      'Encode: scale the values and map them into a polynomial m with an inverse FFT. Encrypt: sample u, e₀, e₁ and set ct = (u·b + e₀ + m, u·a + e₁).',
      'Ciphertexts of ~15–30 MB each at N = 2¹⁶ (estimate), uploaded over TLS.'
    ),
    io(
      'Ciphertexts plus the public evaluation keys. No secret of any kind.',
      'homomorphic',
      'Additions; ct × ct multiplication followed by relinearization (key switching) and rescaling; rotations with Galois keys; bootstrapping once the modulus levels run out.',
      'Result ciphertext(s), still under s. The cloud learns nothing about inputs or result.'
    ),
    io(
      'The result ciphertext.',
      'transfer',
      'Optionally mod-switch to the lowest level to shrink it, then send it over TLS.',
      'A ciphertext of about 1 MB, delivered to the HSM.'
    ),
    io(
      'The result ciphertext plus the request metadata: who is asking and the declared output type. The HSM cannot verify which computation produced it.',
      'decrypt',
      'Check policy (allowed output type, result shape, rate limit). Decrypt m′ = c₀ + c₁·s, add flooding noise (CKKS), decode with an FFT, and write an audit record.',
      'Plaintext result values, rounded and noised, inside the HSM.'
    ),
    io(
      'The plaintext result.',
      'transfer',
      'No cryptographic work beyond the TLS session to the authorized party.',
      'The result, typically a few numbers or a decision, delivered to the data owner.'
    ),
    io(
      'The non-extractable seed and its recovery descriptor, the peer’s certificate chain (manufacturing → device → ML-KEM-768 recipient certificate) and fresh attestation evidence from both HSMs.',
      'wrap',
      'Mutual authentication and authorization under the enrolled policy. Seal the seed and descriptor to the peer’s FIPS 203 ML-KEM-768 recipient key (HPKE inside the engine, AES-256-GCM payload) and sign the package with FIPS 204 ML-DSA-65. Classical deployments wrap with RSA-OAEP, which is harvestable.',
      'A signed package of a few KB (plus certificates), installed atomically by the peer, which returns a signed receipt. Both HSMs now hold the seed.'
    ),
    io(
      'The seed and descriptor, the enrolled backup HSM’s ML-KEM-768 recovery certificate, and the backup authorization.',
      'wrap',
      'The same sealing and ML-DSA-65 signature as a clone, with a separate backup domain label. At restore, the backup HSM checks provenance and certificate validity, then restores the seed internally or clones it to an authorized replacement.',
      'An offline package of a few KB. Restoring it gives back the same seed, and so the same FHE secret.'
    ),
  ],
  'tfhe-single-hsm': [
    io(
      'The HSM entropy source and the TFHE parameter set (TFHE-rs 1.8.1 default: LWE n = 918, GLWE N = 2,048, k = 1).',
      'keygen',
      'The DRBG draws a 32-byte seed. A KDF derives TFHE-rs’s 128-bit Seed, and ClientKey::generate_with_seed expands it into a binary LWE key and a binary GLWE key.',
      'The client key (a few hundred bytes of key bits, ~24 KB as stored), held in the HSM. Only the seed is persisted.'
    ),
    io(
      'The client key (both secrets).',
      'keygen',
      'Bootstrapping key: encrypt each LWE key bit as a GGSW ciphertext under the GLWE key, about 1,800 GLWE encryptions with FFT polynomial products. Key-switching key: encrypt the 2,048 GLWE key coefficients under the LWE key at 4 levels, about 8,200 LWE encryptions. Returned in one size-checked export and hashed; not stored on the token.',
      'The server key, ~30 MB compressed, plus its hash. It fits an HSM workflow.'
    ),
    io(
      'The compressed server key and its hash.',
      'sign',
      'ML-DSA-65 signature over the parameter set and the server-key hash (ECDSA in classical deployments).',
      'The server key and signature, delivered to the cloud.'
    ),
    io(
      'The client key.',
      'keygen',
      'Derive a compact public key and sign it.',
      'A compact public key of tens of KB plus its signature, delivered to the data owner.'
    ),
    io(
      'Plaintext integers and the verified compact public key.',
      'encrypt',
      'Split each integer into small blocks (e.g. 2-bit messages with carry space), then encrypt them as a compact ciphertext list.',
      'A few KB per value, uploaded. The cloud expands it into ~0.5 MB of LWE blocks per 64-bit integer.'
    ),
    io(
      'Ciphertext blocks and the server key. No secret.',
      'homomorphic',
      'Linear operations on blocks, each followed by key switching and a programmable bootstrap that refreshes noise and evaluates a lookup table (carries, comparisons, any function of a block).',
      'Result ciphertext blocks.'
    ),
    io(
      'Result ciphertext blocks.',
      'transfer',
      'Send them over TLS.',
      'About 0.5 MB per FheUint64 unless compressed, delivered to the HSM.'
    ),
    io(
      'Result blocks, the LWE secret key and request metadata.',
      'decrypt',
      'Policy check. Per block: compute body − ⟨mask, s⟩ (one 2,048-term dot product under the big key), round to the message space, then recombine the blocks into integers. Microseconds.',
      'The plaintext result inside the HSM.'
    ),
    io(
      'The plaintext result.',
      'transfer',
      'Release over TLS, with an audit record.',
      'The result, delivered to the data owner.'
    ),
    io(
      'The non-extractable seed and its recovery descriptor, the peer’s certificate chain (manufacturing → device → ML-KEM-768 recipient certificate) and fresh attestation evidence from both HSMs.',
      'wrap',
      'Mutual authentication and authorization under the enrolled policy. Seal the seed and descriptor to the peer’s FIPS 203 ML-KEM-768 recipient key (HPKE inside the engine, AES-256-GCM payload) and sign the package with FIPS 204 ML-DSA-65. Classical deployments wrap with RSA-OAEP, which is harvestable.',
      'A signed package of a few KB (plus certificates), installed atomically by the peer, which returns a signed receipt. Both HSMs now hold the seed.'
    ),
    io(
      'The seed and descriptor, the enrolled backup HSM’s ML-KEM-768 recovery certificate, and the backup authorization.',
      'wrap',
      'The same sealing and ML-DSA-65 signature as a clone, with a separate backup domain label. At restore, the backup HSM checks provenance and certificate validity, then restores the seed internally or clones it to an authorized replacement.',
      'An offline package of a few KB. Recovery rebuilds the identical client key from the seed; the server and public keys are generated fresh and re-signed.'
    ),
  ],
  'openfhe-threshold': [
    io(
      'Party A’s entropy and the shared CryptoContext parameters.',
      'keygen',
      'Ordinary KeyGen for the lead party.',
      'Key pair (pk₁, s₁); s₁ stays in Party A’s HSM.'
    ),
    io(
      'pk₁ and Party B’s entropy.',
      'keygen',
      'MultipartyKeyGen: generate s₂ and extend the public key to s₁ + s₂.',
      'Public key pk₁₂; s₂ stays in Party B’s HSM.'
    ),
    io(
      'pk₁₂ and Party C’s entropy.',
      'keygen',
      'MultipartyKeyGen: generate s₃ and extend the public key to s₁ + s₂ + s₃.',
      'Joint public key; s₃ stays in Party C’s HSM.'
    ),
    io(
      'Each party’s secret share.',
      'keygen',
      'KeySwitchGen (lead), MultiKeySwitchGen (others), MultiAddEvalKeys, then MultiMultEvalKey per party and MultiAddEvalMultKeys.',
      'One joint evaluation-multiplication (relinearization) key.'
    ),
    io(
      'Each party’s secret share.',
      'keygen',
      'EvalSumKeyGen (lead), MultiEvalSumKeyGen (others), MultiAddEvalSumKeys.',
      'Joint summation (rotation) keys, published to the cloud.'
    ),
    io(
      'Plaintext values and the joint public key.',
      'encrypt',
      'Encode and Encrypt.',
      'Ciphertexts under the joint key.'
    ),
    io(
      'Ciphertexts and the joint evaluation keys.',
      'homomorphic',
      'EvalAdd, EvalMult, EvalSum (leveled).',
      'Result ciphertext.'
    ),
    io(
      'The result ciphertext.',
      'transfer',
      'Distribute it to all parties.',
      'One copy per party.'
    ),
    io(
      'The result ciphertext and s₁.',
      'decrypt',
      'MultipartyDecryptLead.',
      'Party A’s partial decryption.'
    ),
    io(
      'The result ciphertext and s₂.',
      'decrypt',
      'MultipartyDecryptMain.',
      'Party B’s partial decryption.'
    ),
    io(
      'The result ciphertext and s₃.',
      'decrypt',
      'MultipartyDecryptMain.',
      'Party C’s partial decryption.'
    ),
    io(
      'All three partial decryptions.',
      'combine',
      'MultipartyDecryptFusion.',
      'The plaintext result.'
    ),
  ],
  'lattigo-threshold': [
    io(
      'Each party’s secret polynomial and the peers’ Shamir public points.',
      'keygen',
      'Thresholdizer: generate a Shamir polynomial and one share per peer; aggregate received shares.',
      'A 2-of-3 Shamir share of the joint secret in each HSM.'
    ),
    io(
      'A common random polynomial and each active party’s additive share (Combiner).',
      'keygen',
      'PublicKeyGenProtocol: each party computes its share; the aggregator adds them.',
      'The collective public key.'
    ),
    io(
      'Common random polynomials and the parties’ shares.',
      'keygen',
      'RelinearizationKeyGenProtocol, two rounds of shares, aggregated.',
      'The collective relinearization key.'
    ),
    io(
      'A common random polynomial per rotation and the parties’ shares.',
      'keygen',
      'GaloisKeyGenProtocol, one run per Galois automorphism, aggregated.',
      'Collective rotation keys.'
    ),
    io(
      'Plaintext values and the collective public key.',
      'encrypt',
      'Encode and encrypt.',
      'Ciphertexts under the joint secret.'
    ),
    io(
      'Ciphertexts and the collective evaluation keys.',
      'homomorphic',
      'Add, multiply, relinearize, rescale, rotate.',
      'A ciphertext at its last level.'
    ),
    io(
      'The low-level ciphertext and each active party’s share.',
      'homomorphic',
      'RefreshProtocol.GenShare: masked decryption-and-re-encryption share.',
      'One refresh share per active party.'
    ),
    io(
      'The refresh shares.',
      'combine',
      'RefreshProtocol.AggregateShares and Finalize.',
      'A ciphertext back at full level, with no bootstrapping keys used.'
    ),
    io(
      'The result ciphertext, each active party’s share and the data owner’s public key.',
      'homomorphic',
      'PublicKeySwitchProtocol.GenShare toward the owner’s public key.',
      'One key-switch share per active party.'
    ),
    io(
      'The key-switch shares.',
      'combine',
      'PublicKeySwitchProtocol.AggregateShares and KeySwitch.',
      'The result re-encrypted under the data owner’s key.'
    ),
    io(
      'The re-encrypted result and the owner’s secret key.',
      'decrypt',
      'Ordinary decryption.',
      'The plaintext result, on the owner’s device only.'
    ),
  ],
  'tfhe-transciphering': [
    io(
      'The TFHE configuration, inside the HSM.',
      'keygen',
      'generate_keys(config); the client key stays in the HSM and the server key is exported.',
      'Server key (plus signature, deployment choice) at the server.'
    ),
    io(
      'Client entropy.',
      'symmetric',
      'Draw a 128-bit Kreyvium key and IV, then initialise KreyviumStream::<bool>.',
      'A clear-text keystream generator on the data owner’s device.'
    ),
    io(
      'The 128 key bits and the TFHE public key.',
      'encrypt',
      'Encrypt the key as 16 FheUint8 bytes.',
      'FHE(k): 128 encrypted bits, uploaded once.'
    ),
    io(
      'Plaintext 64-bit blocks and the keystream.',
      'symmetric',
      'XOR each block with next_64 keystream bits.',
      'Stream-cipher ciphertext, the same size as the data.'
    ),
    io(
      'FHE(k), the public IV, the stream ciphertext and the server key.',
      'homomorphic',
      'Build KreyviumStreamByte::<FheUint8> from FHE(k) and the IV, then call trans_decrypt_64 on each block (as a trivially encrypted FheUint64).',
      'FheUint64 ciphertexts of the data.'
    ),
    io(
      'FheUint64 ciphertexts and the server key.',
      'homomorphic',
      'TFHE-rs integer operations.',
      'FheUint64 result ciphertexts.'
    ),
    io('The result ciphertexts.', 'transfer', 'Send them over TLS.', 'Delivered to the HSM.'),
    io(
      'The result ciphertexts and the client key.',
      'decrypt',
      'FheUint64::decrypt under policy.',
      'The plaintext result inside the HSM.'
    ),
    io(
      'The plaintext result.',
      'transfer',
      'Release over TLS, with an audit record.',
      'The result, delivered to the data owner.'
    ),
  ],
  'hsm-compute-limits': [
    io(
      'The HSM entropy source and the parameter set.',
      'keygen',
      'DRBG seed, PRNG expansion into s, NTT. Kilobytes of state and milliseconds of work.',
      'A seed object and s in HSM memory. Fits comfortably.'
    ),
    io(
      's and the list of rotation steps.',
      'rejected',
      'The same key-switching keygen as above. At the estimated GBs of output, an HSM CPU and PKCS#11 are impractical, so the planned engine refuses it before allocating.',
      'Nothing from the HSM. Alternatives: TFHE (a ~30 MB server key the HSM can make), or threshold refresh (Lattigo), which needs no bootstrapping keys.'
    ),
    io(
      'Would need the ciphertexts plus GBs of evaluation keys resident in HSM memory.',
      'rejected',
      'Bootstrapping is NTT-heavy: millions of modular multiplications per operation. That is far beyond HSM memory and throughput.',
      'Nothing. The request is refused and routed to the accelerator cluster.'
    ),
    io(
      'Ciphertexts plus the public evaluation keys.',
      'homomorphic',
      'Batched NTTs, key switching and bootstrapping on GPU or FPGA, outside the trust boundary.',
      'Result ciphertext(s).'
    ),
    io(
      'The result ciphertext.',
      'transfer',
      'Send it over TLS.',
      'About 1 MB, delivered to the HSM.'
    ),
    io(
      'The result ciphertext and s.',
      'decrypt',
      'm′ = c₀ + c₁·s, flooding noise, FFT decode. One ring multiplication.',
      'Plaintext result inside the HSM. Fits comfortably.'
    ),
    io(
      'The plaintext result plus the policy decision.',
      'transfer',
      'Release over TLS, with an audit record.',
      'The result, delivered to the application.'
    ),
  ],
}
