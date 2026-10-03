// SPDX-License-Identifier: GPL-3.0-only

// ── FHE × HSM usage flows — data for the "FHE + HSM Flows" workshop step ──
// Each scenario is a sequence of steps between actors. A step may carry a
// `link` kind; the quantum overlay renders that link either as what a typical
// deployment uses today (classical) or as its PQC replacement.

export type FheFlowId =
  | 'single-hsm'
  | 'tfhe-single-hsm'
  | 'openfhe-threshold'
  | 'lattigo-threshold'
  | 'hsm-compute-limits'
  | 'tfhe-transciphering'

export type ActorKind = 'client' | 'cloud' | 'hsm' | 'gpu'

export interface FlowActor {
  id: string
  label: string
  sub: string
  kind: ActorKind
  /** Holds (part of) the FHE secret — drawn with a lock and a secret boundary. */
  holdsSecret?: boolean
  /** Trust zone: the data owner's side, the untrusted third party, or an independent key holder. */
  zone: TrustZone
}

export type TrustZone = 'owner' | 'third' | 'party'

export const ZONE_LABELS: Record<TrustZone, string> = {
  owner: 'Data owner’s side (trusted)',
  third: 'Third party (untrusted compute)',
  party: 'Independent key holders',
}

/** The FHE life cycle every flow walks through, shown as bands down the diagram. */
export type Phase = 'setup' | 'encrypt' | 'compute' | 'decrypt' | 'backup'

export const PHASE_LABELS: Record<Phase, string> = {
  setup: 'Key setup',
  encrypt: 'Encrypt',
  compute: 'Compute on encrypted data',
  decrypt: 'Decrypt',
  backup: 'Backup',
}

/** What state the data itself is in at a step (keys-only steps carry no data). */
export type DataState = 'keys' | 'clear' | 'encrypting' | 'encrypted' | 'decrypting' | 'result'

export const DATA_STATE_LABELS: Record<DataState, string> = {
  keys: 'keys only',
  clear: 'data in clear',
  encrypting: 'clear → encrypted',
  encrypted: 'encrypted',
  decrypting: 'encrypted → clear',
  result: 'result in clear',
}

/** Crypto carried by a step, for the quantum overlay. `fhe` is lattice-based and never flagged. */
export type LinkKind = 'tls' | 'sig' | 'wrap' | 'stream' | 'fhe'

export type StepVerdict = 'ok' | 'warn' | 'no'

/**
 * What the pqctoday-hsm engine can do for a step today. Checked against the
 * engine source at commit ceddd554 (2026-10-02). The PKCS#11 reference is the
 * v3.2 OASIS Standard plus pqctoday vendor mechanisms; no FHE mechanism exists
 * yet, so no HSM step of these flows is `engine` today.
 * - engine:  every PKCS#11 v3.2 call the step needs exists now
 * - planned: needs a vendor mechanism or engine fix from the FHE wrapper plan
 * - refused: the planned engine refuses it by design (size check before allocation)
 * - outside: runs outside the HSM, in the scenario's named library
 */
export type EngineStatus = 'engine' | 'planned' | 'refused' | 'outside'

export const ENGINE_STATUS_LABELS: Record<EngineStatus, { short: string; long: string }> = {
  engine: { short: 'in engine today', long: 'Runs in pqctoday-hsm today' },
  planned: {
    short: 'planned',
    long: 'Planned: needs a PKCS#11 v3.2 vendor mechanism or an engine fix',
  },
  refused: {
    short: 'refused by design',
    long: 'The planned engine refuses this before allocating',
  },
  outside: { short: 'outside the HSM', long: 'Runs outside the HSM, in the named library' },
}

export interface FlowStep {
  /** Stable step id, unique within its flow; evidence records point at it. Never reuse or rename. */
  id: string
  /** Library call(s) this step maps to in the scenario's baseline implementation. */
  api?: string
  /** HSM-specific step: a deployment choice, not part of the FHE library or paper. */
  deployment?: boolean
  from: string
  /** Same as `from` for an action performed inside one actor. */
  to: string
  /** Short label drawn on the arrow / action box. */
  label: string
  title: string
  detail: string
  link?: LinkKind
  /** Used by the compute-limits scenario: does this operation belong in the HSM? */
  verdict?: StepVerdict
  /** Overrides the derived engine status (see `engineStatusOf`). */
  engine?: EngineStatus
  /** For HSM steps: which building blocks exist in the engine today and what is missing. */
  engineNote?: string
  /** Release step: the third party that also gets the clear result when the owner's policy allows it. */
  shareWith?: string
}

export interface FheFlow {
  id: FheFlowId
  label: string
  tagline: string
  tileHint: string
  colorClass: string
  borderClass: string
  bgClass: string
  /** The public implementation + paper every library step traces to. */
  baseline: { implementation: string; codeUrl: string; paper: string; paperUrl: string }
  /** Engine status for every HSM step of a flow the engine will never run (e.g. CKKS). */
  engineDefault?: { status: EngineStatus; note: string }
  /** Validation the FHE wrapper plan targets. Nothing is validated yet. */
  validation: { target: string; reference: string }
  /** Shown as a banner: does this model fit inside an HSM? */
  scaling?: { verdict: 'scales' | 'does-not-scale'; note: string }
  layman: { analogy: string; whatsDifferent: string; catch: string }
  actors: FlowActor[]
  steps: FlowStep[]
  hsmDoes: string
  staysSecret: string
  watchOut: string
}

/** Engine status of a step: explicit, else refused / planned when it touches an HSM, else outside. */
export function engineStatusOf(flow: FheFlow, step: FlowStep): EngineStatus {
  if (step.engine) return step.engine
  if (flow.engineDefault) {
    const touchesHsm = [step.from, step.to].some(
      (id) => flow.actors.find((a) => a.id === id)?.kind === 'hsm'
    )
    if (touchesHsm) return flow.engineDefault.status
  }
  const isHsm = (id: string) => flow.actors.find((a) => a.id === id)?.kind === 'hsm'
  if (!isHsm(step.from) && !isHsm(step.to)) return 'outside'
  return step.verdict === 'no' ? 'refused' : 'planned'
}

export const LINK_LABELS: Record<
  LinkKind,
  { classical: string; pqc: string; threat: string | null; safeNote?: string }
> = {
  tls: {
    classical: 'TLS · ECDHE',
    pqc: 'TLS · X25519MLKEM768',
    threat: 'Shor: harvest now, decrypt later',
  },
  sig: { classical: 'ECDSA signature', pqc: 'ML-DSA-65 signature', threat: 'Shor: forgeable' },
  wrap: {
    classical: 'RSA-OAEP wrap',
    pqc: 'ML-KEM-768 + ML-DSA-65 replication package',
    threat: 'Shor: HNDL on the key backup',
  },
  stream: {
    classical: 'Kreyvium (128-bit key)',
    pqc: 'Kreyvium (128-bit key)',
    threat: null,
    safeNote: 'symmetric 128-bit key; Grover leaves ~64-bit quantum work, accepted like AES-128',
  },
  fhe: {
    classical: 'FHE (RLWE)',
    pqc: 'FHE (RLWE)',
    threat: null,
    safeNote: 'lattice-based, no known quantum break',
  },
}

export const FHE_HSM_FLOWS: FheFlow[] = [
  {
    id: 'single-hsm',
    baseline: {
      implementation:
        'OpenFHE CKKS (KeyGen, EvalMultKeyGen, EvalRotateKeyGen, EvalBootstrapKeyGen, NOISE_FLOODING_DECRYPT)',
      codeUrl: 'https://github.com/openfheorg/openfhe-development/tree/v1.6.0',
      paper:
        'Cheon, Kim, Kim, Song: Homomorphic Encryption for Arithmetic of Approximate Numbers (ASIACRYPT 2017); OpenFHE design paper (IACR ePrint 2022/915)',
      paperUrl: 'https://eprint.iacr.org/2022/915',
    },
    engineDefault: {
      status: 'refused',
      note: 'No CKKS mechanism is planned for pqctoday-hsm; this scenario is reference-only in OpenFHE.',
    },
    validation: {
      target:
        'Reference only: evaluation-key sizes measured with OpenFHE CKKS. The planned engine refuses the evaluation-key export by design.',
      reference: 'OpenFHE CKKS, pinned in pqctoday-sandbox',
    },
    label: 'CKKS single-HSM custody',
    tagline: 'The HSM keeps the FHE secret; the cloud computes on ciphertexts it can never open.',
    tileHint: 'DOES NOT SCALE: GB EVAL KEYS',
    scaling: {
      verdict: 'does-not-scale',
      note: 'Kept as a counter-example. The custody idea is sound, but CKKS bootstrapping needs ~1.5–5 GB of evaluation keys even with seeded compression (3–10 GB raw, estimated), and only the secret-key holder can generate them. At these estimated sizes that is beyond what one HSM can hold, compute or return through PKCS#11, so the planned engine refuses it; measured OpenFHE sizes will replace the estimates. Compare with the TFHE scenario, or with Lattigo’s interactive refresh (threshold scenario), which needs no bootstrapping keys at all.',
    },
    colorClass: 'text-primary',
    borderClass: 'border-primary/40',
    bgClass: 'bg-primary/10',
    layman: {
      analogy:
        'Think of a sealed glovebox. The cloud can reach in and work on your data through the gloves, but it cannot see inside. The only key that opens the box sits in a vault: the HSM.',
      whatsDifferent:
        'With a TEE you trust the chip the computation runs on. Here the cloud is untrusted by design, and the HSM never computes on your data. It only creates the key and opens the final result.',
      catch:
        'The HSM becomes the one place that can decrypt anything. If it decrypts whatever it is sent, an attacker can use it as an oracle to learn the key, so decryption needs a policy.',
    },
    actors: [
      { id: 'client', label: 'Data owner', sub: 'app / analyst', kind: 'client', zone: 'owner' },
      {
        id: 'hsm',
        label: 'HSM',
        sub: 'FHE key custodian',
        kind: 'hsm',
        holdsSecret: true,
        zone: 'owner',
      },
      { id: 'dr', label: 'Peer / backup HSM', sub: 'same trust chain', kind: 'hsm', zone: 'owner' },
      { id: 'cloud', label: 'FHE cloud', sub: 'untrusted compute', kind: 'cloud', zone: 'third' },
    ],
    steps: [
      {
        id: 'generate-fhe-secret',
        from: 'hsm',
        to: 'hsm',
        label: 'seed → sk',
        api: 'KeyGen()',
        deployment: true,
        title: 'Generate the FHE secret inside the HSM',
        detail:
          'The HSM DRBG produces a 32-byte seed, stored as a non-extractable key: it leaves only through the vendor replication capability, to an authenticated peer or an enrolled backup HSM. The FHE secret key s (a small polynomial) is derived from it inside the mechanism with an SP 800-108 KDF and never leaves the HSM.',
        link: 'fhe',
      },
      {
        id: 'export-evaluation-keys',
        from: 'hsm',
        to: 'cloud',
        label: 'GB eval keys + sig',
        api: 'EvalMultKeyGen · EvalRotateKeyGen · EvalBootstrapKeyGen',
        deployment: true,
        title: 'Export the evaluation keys: where this model breaks',
        detail:
          'The relinearization, rotation and bootstrapping keys are public, but each one encrypts something derived from s, so only the HSM can make them. A bootstrappable set is GBs. That is beyond HSM memory, minutes or more of HSM CPU, and far more than PKCS#11 is built to return (estimated sizes, to be measured with OpenFHE).',
        verdict: 'no',
        engineNote:
          'The planned engine computes the output size first and refuses before allocating anything: a bootstrappable set is far above the per-object cap.',
        link: 'sig',
      },
      {
        id: 'publish-public-key',
        from: 'hsm',
        to: 'client',
        label: 'pk + sig',
        api: 'KeyGen() → publicKey',
        deployment: true,
        title: 'Give the data owner the public key',
        detail:
          'The client checks the HSM signature before trusting the public key. A swapped public key would let an attacker read everything encrypted under it.',
        link: 'sig',
      },
      {
        id: 'owner-encrypts-locally',
        from: 'client',
        to: 'client',
        label: 'encrypt locally',
        api: 'MakeCKKSPackedPlaintext · Encrypt',
        title: 'The data owner encrypts on its own device',
        detail:
          'The data owner encodes its values and encrypts them with the FHE public key on its own device. No secret is needed to encrypt. From here on the data never leaves the data owner in the clear.',
        link: 'fhe',
      },
      {
        id: 'upload-ciphertexts',
        from: 'client',
        to: 'cloud',
        label: 'FHE(data)',
        title: 'Upload ciphertexts to the third party',
        detail:
          'Only ciphertexts leave the data owner. The third party stores and computes on them but cannot read them. The FHE layer is post-quantum; the TLS session around it often is not.',
        link: 'tls',
      },
      {
        id: 'compute-ciphertexts',
        from: 'cloud',
        to: 'cloud',
        label: 'f( ) on ciphertexts',
        api: 'EvalAdd · EvalMult · EvalRotate · EvalBootstrap',
        title: 'Compute on ciphertexts',
        detail:
          'Add, multiply plus relinearize, rotate and bootstrap, all with public evaluation keys. The cloud never holds the secret key, and the data stays encrypted throughout.',
        link: 'fhe',
      },
      {
        id: 'return-encrypted-result',
        from: 'cloud',
        to: 'client',
        label: 'FHE(result) → owner',
        title: 'Return the encrypted result to the data owner',
        detail:
          'The third party sends the result back still encrypted. It never held a key that could open it.',
        link: 'tls',
      },
      {
        id: 'owner-requests-decrypt',
        from: 'client',
        to: 'hsm',
        label: 'decrypt request',
        title: 'The data owner asks its HSM to decrypt',
        detail:
          'The data owner (or its authorized application) sends the encrypted result to its own HSM over an authenticated channel. Only the data owner can ask; the third party has no access to the HSM.',
        link: 'tls',
      },
      {
        id: 'decrypt-under-policy',
        from: 'hsm',
        to: 'hsm',
        label: 'policy · shape · decrypt',
        api: 'Decrypt with DecryptionNoiseMode NOISE_FLOODING_DECRYPT',
        deployment: true,
        title: 'Decrypt under policy',
        detail:
          'Policy first, then decryption. This policy is not defined by ISO/IEC 28033 or by OpenFHE; it is the HSM’s deployment layer. (1) Only the data owner’s authenticated session may ask. (2) The HSM checks the ciphertext’s metadata (slot count, level, scale) against an allowed result shape before decrypting; this limits how much one release can reveal, not where the ciphertext came from. (3) It decrypts inside the HSM, adds noise flooding (OpenFHE NOISE_FLOODING_DECRYPT) so the approximate output does not leak the key, and releases the value only if it fits the allowed range; a refusal still counts against the rate limit. (4) Rate limit and audit. The HSM cannot verify which computation produced a ciphertext.',
      },
      {
        id: 'release-result',
        from: 'hsm',
        to: 'client',
        label: 'result',
        title: 'Release the result',
        detail: 'Only the authorized party gets the plaintext result.',
        link: 'tls',
        shareWith: 'cloud',
      },
      {
        id: 'live-clone-peer-hsm',
        from: 'hsm',
        to: 'dr',
        label: 'live clone → peer',
        api: 'vendor replication capability: live clone (planned; names fixed in P0B)',
        deployment: true,
        title: 'Live cloning to an authenticated peer HSM',
        detail:
          'Ordinary PKCS#11 wrapping refuses the seed: it is non-extractable. Instead both HSMs prove who they are with a manufacturing → device → function certificate chain (FIPS 204 ML-DSA-65) and fresh attestation evidence (draft-ietf-rats-pkix-key-attestation). The source seals the seed and its recovery descriptor to the peer’s FIPS 203 ML-KEM-768 recipient certificate and signs the package with ML-DSA-65. The peer checks everything, installs the seed atomically and returns a signed receipt. The source keeps its copy.',
        engineNote:
          'Planned. In the engine today: ML-KEM-768, ML-DSA-65 and HPKE, which this flow uses only inside the HSM. Missing: the vendor replication capability, the manufacturing → device → function certificate hierarchy, and attestation evidence.',
        link: 'wrap',
      },
      {
        id: 'offline-backup-restore',
        from: 'hsm',
        to: 'dr',
        label: 'offline backup → restore',
        api: 'vendor replication capability: offline backup package, restored by the enrolled backup HSM (planned)',
        deployment: true,
        title: 'Offline backup, restored by the enrolled backup HSM',
        detail:
          'The same checks, but the package is sealed to an enrolled backup HSM’s ML-KEM-768 recovery key and stored offline. After the source is lost, that backup HSM verifies the package and restores the seed inside itself, or clones it on to an authorized replacement. No plaintext crosses the host. Only the seed is replicated, never the GB of evaluation keys. Classical deployments wrap backups with RSA-OAEP, which a future quantum computer can open from a harvested copy.',
        engineNote:
          'Planned. In the engine today: ML-KEM-768, ML-DSA-65 and HPKE, which this flow uses only inside the HSM. Missing: the vendor replication capability, the manufacturing → device → function certificate hierarchy, and attestation evidence.',
        link: 'wrap',
      },
    ],
    hsmDoes:
      'Generates the seed, derives the secret, signs the public material, decrypts under policy, backs up the seed.',
    staysSecret: 'One 32-byte seed. Everything the cloud holds is either public or ciphertext.',
    watchOut:
      'A raw decryption oracle leaks the key (IND-CPA-D). Enforce result-shape policy and noise flooding.',
  },
  {
    id: 'tfhe-single-hsm',
    baseline: {
      implementation:
        'TFHE-rs high-level API (ClientKey, CompressedServerKey, CompactPublicKey, FheUint)',
      codeUrl: 'https://github.com/zama-ai/tfhe-rs',
      paper:
        'Chillotti, Gama, Georgieva, Izabachène: TFHE: Fast Fully Homomorphic Encryption over the Torus (Journal of Cryptology, 2020)',
      paperUrl: 'https://eprint.iacr.org/2018/421',
    },
    validation: {
      target:
        'Token-validated: every HSM step through PKCS#11 v3.2 vendor mechanisms in pqctoday-hsm, plus reference-validated with TFHE-rs.',
      reference: 'TFHE-rs, pinned release',
    },
    label: 'TFHE single-HSM custody',
    tagline:
      'Same custody model with TFHE: every key the HSM creates is KB to tens of MB, so keygen, signing and decryption all stay inside it.',
    tileHint: 'KB KEYS · MB SERVER KEY · µs DECRYPT',
    colorClass: 'text-status-success',
    borderClass: 'border-success/40',
    bgClass: 'bg-success/10',
    scaling: {
      verdict: 'scales',
      note: 'Fits an HSM. The secret is a few hundred bytes of key bits (tens of KB as stored), the server key is tens of MB compressed and generated in seconds, and decryption is a dot product. The trade-off is that TFHE computes on bits and small integers, so heavy numeric workloads run slower than with CKKS.',
    },
    layman: {
      analogy:
        'Same vault, smaller tools. With TFHE the "instruction manual" the cloud needs (the server key) fits on a USB stick instead of a hard-drive shelf, so the vault can write it itself.',
      whatsDifferent:
        'CKKS packs thousands of numbers per ciphertext and needs GB of rotation keys to move them around. TFHE encrypts small integers one block at a time and refreshes them with a single bootstrapping key, so there are no rotation keys at all.',
      catch:
        'Each TFHE operation is a bootstrap, so wide arithmetic (64-bit multiplies, big matrix maths) is slower than CKKS. It suits comparisons, lookups and business logic, not large-scale ML training.',
    },
    actors: [
      { id: 'client', label: 'Data owner', sub: 'app / analyst', kind: 'client', zone: 'owner' },
      {
        id: 'hsm',
        label: 'HSM',
        sub: 'TFHE key custodian',
        kind: 'hsm',
        holdsSecret: true,
        zone: 'owner',
      },
      { id: 'dr', label: 'Peer / backup HSM', sub: 'same trust chain', kind: 'hsm', zone: 'owner' },
      { id: 'cloud', label: 'FHE cloud', sub: 'untrusted compute', kind: 'cloud', zone: 'third' },
    ],
    steps: [
      {
        id: 'generate-client-key',
        from: 'hsm',
        to: 'hsm',
        label: 'seed → client key',
        api: 'ClientKey::generate_with_seed(config, Seed)',
        deployment: true,
        title: 'Generate the TFHE client key inside the HSM',
        detail:
          'The HSM keeps a 32-byte seed. A KDF inside the mechanism derives TFHE-rs’s 128-bit Seed from it, which expands into two binary secrets: an LWE key (918 bits) and a GLWE key (2,048 bits). That is a few hundred bytes of key bits, tens of KB as TFHE-rs stores them: an ordinary HSM-sized object.',
        verdict: 'ok',
        link: 'fhe',
      },
      {
        id: 'generate-server-key',
        from: 'hsm',
        to: 'hsm',
        label: 'server key',
        api: 'CompressedServerKey::new(&client_key)',
        deployment: true,
        title: 'Generate the server key inside the HSM',
        detail:
          'The bootstrapping key is about 1,800 GLWE encryptions of the LWE key bits; the key-switching key is about 8,200 small LWE encryptions (2,048 coefficients × 4 levels). That is seconds of work and tens of MB, returned in one size-checked export (PKCS#11 asks for the length, then fills the buffer) and hashed for the signed manifest. The token does not store it.',
        verdict: 'ok',
      },
      {
        id: 'export-server-key',
        from: 'hsm',
        to: 'cloud',
        label: 'server key + sig',
        api: 'CompressedServerKey → decompress() on the server',
        deployment: true,
        title: 'Export the compressed server key, signed',
        detail:
          'Seeded compression sends only the "body" of each encryption, about 30 MB in total. The HSM signs its hash so the cloud can detect a substituted key.',
        verdict: 'ok',
        link: 'sig',
      },
      {
        id: 'publish-compact-public-key',
        from: 'hsm',
        to: 'client',
        label: 'public key + sig',
        api: 'CompactPublicKey::new(&client_key)',
        deployment: true,
        title: 'Give the data owner a compact public key',
        detail:
          'A compact public key of tens of KB lets clients encrypt without ever seeing the secret.',
        link: 'sig',
      },
      {
        id: 'owner-encrypts-locally',
        from: 'client',
        to: 'client',
        label: 'encrypt locally',
        api: 'CompactCiphertextList::builder(&public_key)',
        title: 'The data owner encrypts on its own device',
        detail:
          'The data owner splits each integer into small blocks and encrypts them with the compact public key on its own device. No secret is needed to encrypt. From here on the data never leaves the data owner in the clear.',
        link: 'fhe',
      },
      {
        id: 'upload-ciphertexts',
        from: 'client',
        to: 'cloud',
        label: 'FHE(values)',
        title: 'Upload ciphertexts to the third party',
        detail:
          'Only ciphertexts leave the data owner. The third party stores and computes on them but cannot read them. The FHE layer is post-quantum; the TLS session around it often is not.',
        link: 'tls',
      },
      {
        id: 'compute-with-pbs',
        from: 'cloud',
        to: 'cloud',
        label: 'PBS on every op',
        api: 'set_server_key · FheUint64 arithmetic and comparisons',
        title: 'Compute with programmable bootstrapping',
        detail:
          'Every gate or integer operation ends in a programmable bootstrap, which refreshes noise and applies any lookup table. Comparisons, branches and table lookups are natural; there is no depth limit.',
        link: 'fhe',
      },
      {
        id: 'return-encrypted-result',
        from: 'cloud',
        to: 'client',
        label: 'FHE(result) → owner',
        title: 'Return the encrypted result to the data owner',
        detail:
          'The third party sends the result back still encrypted. It never held a key that could open it.',
        link: 'tls',
      },
      {
        id: 'owner-requests-decrypt',
        from: 'client',
        to: 'hsm',
        label: 'decrypt request',
        title: 'The data owner asks its HSM to decrypt',
        detail:
          'The data owner (or its authorized application) sends the encrypted result to its own HSM over an authenticated channel. Only the data owner can ask; the third party has no access to the HSM.',
        link: 'tls',
      },
      {
        id: 'decrypt-under-policy',
        from: 'hsm',
        to: 'hsm',
        label: 'policy · type · decrypt',
        api: 'FheUint64::decrypt(&client_key)',
        deployment: true,
        title: 'Decrypt under policy',
        detail:
          'Policy first, then decryption. This policy is not defined by ISO/IEC 28033 or by TFHE-rs; it is the HSM’s deployment layer built on TFHE-rs building blocks. The serialized ciphertext carries no access-control metadata (no owner, purpose or recipient, and nothing in it is authenticated), so control comes from the HSM’s policy object and the requester. (1) Only the data owner’s authenticated session may ask. (2) A conformance-checked type gate (TFHE-rs safe_deserialize_conformant) refuses a ciphertext whose type, block count or parameter set is not an allowed result type, before decrypting. Marking input types as never releasable stops a raw input being released whole, but not a slice of it: the HSM limits how many bits each release can reveal, and the rate limit caps the total. (3) After decrypting inside the HSM, the value must fit the allowed shape (a yes/no, a score from 0 to 100) or nothing is released; a refusal still counts against the rate limit, because refusing is itself an answer. (4) Rate limit and audit. Decryption itself is a 2,048-term dot product per block: microseconds. The HSM cannot verify which computation produced a ciphertext; only verifiable-computation proofs could, and those are research.',
        verdict: 'ok',
      },
      {
        id: 'release-result',
        from: 'hsm',
        to: 'client',
        label: 'result',
        title: 'Release the result',
        detail: 'Only the authorized party gets the plaintext.',
        link: 'tls',
        shareWith: 'cloud',
      },
      {
        id: 'live-clone-peer-hsm',
        from: 'hsm',
        to: 'dr',
        label: 'live clone → peer',
        api: 'vendor replication capability: live clone (planned; names fixed in P0B)',
        deployment: true,
        title: 'Live cloning to an authenticated peer HSM',
        detail:
          'Ordinary PKCS#11 wrapping refuses the seed: it is non-extractable. Instead both HSMs prove who they are with a manufacturing → device → function certificate chain (FIPS 204 ML-DSA-65) and fresh attestation evidence (draft-ietf-rats-pkix-key-attestation). The source seals the seed and its recovery descriptor to the peer’s FIPS 203 ML-KEM-768 recipient certificate and signs the package with ML-DSA-65. The peer checks everything, installs the seed atomically and returns a signed receipt. The source keeps its copy.',
        engineNote:
          'Planned. In the engine today: ML-KEM-768, ML-DSA-65 and HPKE, which this flow uses only inside the HSM. Missing: the vendor replication capability, the manufacturing → device → function certificate hierarchy, and attestation evidence.',
        link: 'wrap',
      },
      {
        id: 'offline-backup-restore',
        from: 'hsm',
        to: 'dr',
        label: 'offline backup → restore',
        api: 'vendor replication capability: offline backup package, restored by the enrolled backup HSM (planned)',
        deployment: true,
        title: 'Offline backup, restored by the enrolled backup HSM',
        detail:
          'The same checks, but the package is sealed to an enrolled backup HSM’s ML-KEM-768 recovery key and stored offline. After the source is lost, that backup HSM verifies the package and restores the seed inside itself, or clones it on to an authorized replacement. No plaintext crosses the host. Recovery rebuilds the identical client key from the seed (generate_with_seed). TFHE-rs has no seeded server-key generation, so the server and public keys are generated fresh and re-signed: different bytes, equally valid, and old ciphertexts still decrypt. Classical deployments wrap backups with RSA-OAEP, which a future quantum computer can open from a harvested copy.',
        engineNote:
          'Planned. In the engine today: ML-KEM-768, ML-DSA-65 and HPKE, which this flow uses only inside the HSM. Missing: the vendor replication capability, the manufacturing → device → function certificate hierarchy, and attestation evidence.',
        link: 'wrap',
      },
    ],
    hsmDoes:
      'Everything key-related: seed, client key, server-key generation and signing, decryption, backup. No secret leaves except the seed, replicated only to an authenticated peer or an enrolled backup HSM.',
    staysSecret:
      'The 32-byte seed and the few-KB client key derived from it. Only the seed is backed up; recovery rebuilds the same client key and issues a fresh server key.',
    watchOut:
      'TFHE trades capacity for size. Wide arithmetic is slow, so check the workload fits before choosing it over CKKS. Use parameter sets with negligible failure probability.',
  },
  {
    id: 'openfhe-threshold',
    baseline: {
      implementation:
        'OpenFHE threshold FHE, BFV run of src/pke/examples/threshold-fhe.cpp (2 parties), extended to 3 parties as in threshold-fhe-5p.cpp: MultipartyKeyGen, MultiKeySwitchGen, MultiAddEvalKeys, MultiMultEvalKey, MultiAddEvalMultKeys, MultiEvalSumKeyGen, MultipartyDecryptLead / Main / Fusion',
      codeUrl:
        'https://github.com/openfheorg/openfhe-development/blob/v1.6.0/src/pke/examples/threshold-fhe.cpp',
      paper: 'OpenFHE design paper (IACR ePrint 2022/915), threshold FHE extension',
      paperUrl: 'https://eprint.iacr.org/2022/915',
    },
    validation: {
      target:
        'Reference-validated with OpenFHE BFV. A PKCS#11 path through a Rust BFV backend (fhe.rs multiparty) only if its feasibility and independent-review gates pass.',
      reference: 'OpenFHE BFV, pinned in pqctoday-sandbox',
    },
    label: 'Threshold: OpenFHE BFV (3-of-3)',
    tagline:
      'OpenFHE’s threshold extension with BFV: additive key shares, chained key generation, and every party must contribute a partial decryption.',
    tileHint: 'N-OF-N · LEAD / MAIN / FUSION',
    colorClass: 'text-status-success',
    borderClass: 'border-success/40',
    bgClass: 'bg-success/10',
    layman: {
      analogy:
        'Three keyholders each own a slice of one key. The lock only opens when all three turn their slice: any one of them alone, or any two, can do nothing.',
      whatsDifferent:
        'Nobody, not even an HSM, ever holds the whole secret. Each party’s HSM keeps only its own slice and produces a partial decryption; the data owner fuses them.',
      catch:
        'N-of-N means every party must be online for every decryption: one unavailable HSM blocks everything. OpenFHE’s example uses leveled evaluation (no bootstrapping keys).',
    },
    actors: [
      { id: 'client', label: 'Data owner', sub: 'fuses result', kind: 'client', zone: 'owner' },
      { id: 'cloud', label: 'FHE cloud', sub: 'untrusted compute', kind: 'cloud', zone: 'third' },
      {
        id: 'hsmA',
        label: 'Party A',
        sub: 'HSM · lead',
        kind: 'hsm',
        holdsSecret: true,
        zone: 'party',
      },
      {
        id: 'hsmB',
        label: 'Party B',
        sub: 'HSM · share s₂',
        kind: 'hsm',
        holdsSecret: true,
        zone: 'party',
      },
      {
        id: 'hsmC',
        label: 'Party C',
        sub: 'HSM · share s₃',
        kind: 'hsm',
        holdsSecret: true,
        zone: 'party',
      },
    ],
    steps: [
      {
        id: 'party-a-keygen',
        from: 'hsmA',
        to: 'hsmA',
        label: 'KeyGen',
        title: 'Party A generates the first key pair',
        detail:
          'The lead party runs an ordinary KeyGen. Its secret share s₁ stays inside Party A’s HSM; its public key starts the chain.',
        api: 'KeyGen()',
        deployment: true,
      },
      {
        id: 'party-b-multiparty-keygen',
        from: 'hsmA',
        to: 'hsmB',
        label: 'pk₁ → MultipartyKeyGen',
        title: 'Party B extends the public key',
        detail:
          'Party B receives pk₁ and runs MultipartyKeyGen, adding its own share s₂. The resulting public key is under s₁ + s₂.',
        api: 'MultipartyKeyGen(pk₁)',
        link: 'tls',
      },
      {
        id: 'party-c-multiparty-keygen',
        from: 'hsmB',
        to: 'hsmC',
        label: 'pk₁₂ → MultipartyKeyGen',
        title: 'Party C completes the joint public key',
        detail:
          'Party C does the same with s₃. The final joint public key encrypts under s = s₁ + s₂ + s₃, which no party ever holds.',
        api: 'MultipartyKeyGen(pk₁₂)',
        link: 'tls',
      },
      {
        id: 'build-joint-relinearization-key',
        from: 'hsmA',
        to: 'hsmC',
        label: 'joint relin key (multi-round)',
        title: 'Build the joint relinearization key',
        detail:
          'Each party contributes a key-switching share; the shares are added, multiplied by each party’s secret in turn, and added again to give one joint evaluation-multiplication key.',
        api: 'KeySwitchGen · MultiKeySwitchGen · MultiAddEvalKeys · MultiMultEvalKey · MultiAddEvalMultKeys',
        link: 'tls',
      },
      {
        id: 'publish-eval-keys',
        from: 'hsmC',
        to: 'cloud',
        label: 'joint eval keys + sig',
        title: 'Build the summation keys and publish',
        detail:
          'Rotation-for-summation keys are built the same way (EvalSumKeyGen, then MultiEvalSumKeyGen per party, then MultiAddEvalSumKeys). The joint keys go to the cloud; signing them is a deployment choice.',
        api: 'EvalSumKeyGen · MultiEvalSumKeyGen · MultiAddEvalSumKeys',
        link: 'sig',
      },
      {
        id: 'owner-encrypts-locally',
        from: 'client',
        to: 'client',
        label: 'encrypt locally',
        api: 'Encrypt(jointPublicKey, plaintext)',
        title: 'The data owner encrypts on its own device',
        detail:
          'The data owner encrypts its data with the joint public key on its own device. No single party can decrypt it.',
        link: 'fhe',
      },
      {
        id: 'upload-ciphertexts',
        from: 'client',
        to: 'cloud',
        label: 'FHE(data)',
        title: 'Upload ciphertexts to the third party',
        detail:
          'Only ciphertexts leave the data owner. The third party stores and computes on them but cannot read them. The FHE layer is post-quantum; the TLS session around it often is not.',
        link: 'tls',
      },
      {
        id: 'compute-ciphertexts',
        from: 'cloud',
        to: 'cloud',
        label: 'EvalAdd · EvalMult · EvalSum',
        title: 'Compute on ciphertexts',
        detail: 'Leveled evaluation with the joint keys, as in OpenFHE’s threshold example.',
        api: 'EvalAdd · EvalMult · EvalSum',
        link: 'fhe',
      },
      {
        id: 'return-encrypted-result',
        from: 'cloud',
        to: 'client',
        label: 'FHE(result) → owner',
        title: 'Return the encrypted result to the data owner',
        detail:
          'The third party sends the result back still encrypted. It never held a key that could open it.',
        link: 'tls',
      },
      {
        id: 'owner-requests-partials',
        from: 'client',
        to: 'hsmC',
        label: 'FHE(result) → A, B, C',
        title: 'The data owner asks the three parties for partial decryptions',
        detail:
          'The data owner sends the encrypted result to all three parties over authenticated channels and asks each for its partial decryption. Only the data owner can fuse them.',
        link: 'tls',
      },
      {
        id: 'party-a-partial-decrypt',
        from: 'hsmA',
        to: 'client',
        label: 'partial (Lead)',
        title: 'Party A: lead partial decryption',
        detail: 'Party A’s HSM computes the lead partial decryption with s₁.',
        api: 'MultipartyDecryptLead({ct}, s₁)',
        deployment: true,
        link: 'tls',
      },
      {
        id: 'party-b-partial-decrypt',
        from: 'hsmB',
        to: 'client',
        label: 'partial (Main)',
        title: 'Party B: main partial decryption',
        detail: 'Party B’s HSM computes its partial decryption with s₂.',
        api: 'MultipartyDecryptMain({ct}, s₂)',
        deployment: true,
        link: 'tls',
      },
      {
        id: 'party-c-partial-decrypt',
        from: 'hsmC',
        to: 'client',
        label: 'partial (Main)',
        title: 'Party C: main partial decryption',
        detail: 'Party C’s HSM computes its partial decryption with s₃.',
        api: 'MultipartyDecryptMain({ct}, s₃)',
        deployment: true,
        link: 'tls',
      },
      {
        id: 'owner-fuses-partials',
        from: 'client',
        to: 'client',
        label: 'Fusion',
        title: 'Fuse the partial decryptions',
        detail: 'The data owner combines all three partials into the plaintext.',
        api: 'MultipartyDecryptFusion({partials})',
      },
    ],
    hsmDoes:
      'Deployment choice: each party keeps its secret share in its own HSM and runs its key-generation and partial-decryption calls there.',
    staysSecret: 'Each share sᵢ. The joint secret s = s₁ + s₂ + s₃ is never assembled.',
    watchOut:
      'All N parties are needed for every decryption. Key-generation rounds and partials travel between organisations, so those channels need post-quantum TLS.',
  },
  {
    id: 'lattigo-threshold',
    baseline: {
      implementation:
        'Lattigo v6.2.0 multiparty + mpbgv over schemes/bgv (one implementation of BGV and BFV): Thresholdizer / Combiner, PublicKeyGenProtocol, RelinearizationKeyGenProtocol, GaloisKeyGenProtocol, mpbgv.RefreshProtocol, PublicKeySwitchProtocol',
      codeUrl: 'https://pkg.go.dev/github.com/tuneinsight/lattigo/v6/multiparty',
      paper:
        'Mouchet, Troncoso-Pastoriza, Bossuat, Hubaux: Multiparty Homomorphic Encryption from Ring-Learning-with-Errors (PoPETs 2021)',
      paperUrl: 'https://petsymposium.org/popets/2021/popets-2021-0071.php',
    },
    validation: {
      target:
        'Token-validated through a Rust port of Lattigo’s protocols behind PKCS#11 v3.2 vendor mechanisms, only if its feasibility and review gates pass. The port is tested against Lattigo itself in Go (byte-exact fixtures, mixed Rust and Go parties) and needs an independent review.',
      reference: 'Lattigo v6.2.0 (Go), the test oracle',
    },
    label: 'Threshold: Lattigo BGV (2-of-3)',
    tagline:
      'Lattigo’s multiparty protocols with BGV: t-of-N shares, collective key generation, interactive refresh instead of bootstrapping keys, and re-encryption to the data owner.',
    tileHint: 'T-OF-N · REFRESH · NO BOOTSTRAP KEYS',
    colorClass: 'text-status-success',
    borderClass: 'border-success/40',
    bgClass: 'bg-success/10',
    scaling: {
      verdict: 'scales',
      note: 'Bootstrapping is replaced by an interactive refresh among the key holders (RefreshProtocol), so no GB-scale bootstrapping keys are generated. Each party still produces a full-size share of every Galois key the application itself needs.',
    },
    layman: {
      analogy:
        'Three keyholders, any two of whom can act. Instead of giving the cloud a giant manual for "refreshing" ciphertexts on its own, the cloud simply asks two keyholders to help each time.',
      whatsDifferent:
        'Compared with OpenFHE’s N-of-N example, one party can be offline. And the result is never decrypted by the parties: they re-encrypt it directly to the data owner’s own public key.',
      catch:
        'Every refresh is a round-trip to the key holders, so latency depends on them being online. Lattigo’s protocols assume honest-but-curious parties.',
    },
    actors: [
      { id: 'client', label: 'Data owner', sub: 'own key pair', kind: 'client', zone: 'owner' },
      {
        id: 'cloud',
        label: 'FHE cloud',
        sub: 'aggregator · compute',
        kind: 'cloud',
        zone: 'third',
      },
      {
        id: 'hsmA',
        label: 'Party A',
        sub: 'HSM · share',
        kind: 'hsm',
        holdsSecret: true,
        zone: 'party',
      },
      {
        id: 'hsmB',
        label: 'Party B',
        sub: 'HSM · share',
        kind: 'hsm',
        holdsSecret: true,
        zone: 'party',
      },
      {
        id: 'hsmC',
        label: 'Party C',
        sub: 'HSM · share',
        kind: 'hsm',
        holdsSecret: true,
        zone: 'party',
      },
    ],
    steps: [
      {
        id: 'shamir-share-secret',
        from: 'hsmA',
        to: 'hsmC',
        label: 'Shamir shares (2-of-3)',
        title: 'Turn the secret into a 2-of-3 sharing',
        detail:
          'Each party samples its secret, then the Thresholdizer re-shares it with Shamir polynomials so that any 2 of the 3 parties can act. Before each protocol, the active parties convert to additive shares with the Combiner.',
        api: 'Thresholdizer.GenShamirPolynomial · GenShamirSecretShare · Combiner.GenAdditiveShare',
        engineNote:
          'Planned. Dealing runs through the vendor MP_SHARE mechanism, which returns a recipient-bound encrypted message; the ML-KEM-768 and AES-GCM processing stays inside the HSM. Its transport is reviewed on its own, separately from seed cloning.',
        link: 'tls',
      },
      {
        id: 'collective-public-key',
        from: 'hsmA',
        to: 'cloud',
        label: 'CKG shares',
        title: 'Collective public-key generation',
        detail:
          'From a common random polynomial, each party sends a public-key share; the aggregator adds them into the joint public key.',
        api: 'PublicKeyGenProtocol.GenShare · AggregateShares · GenPublicKey',
        link: 'tls',
      },
      {
        id: 'collective-relinearization-key',
        from: 'hsmB',
        to: 'cloud',
        label: 'RKG shares (2 rounds)',
        title: 'Collective relinearization key',
        detail:
          'The only two-round protocol in the package: two rounds of shares give the joint relinearization key. Round 1’s temporary secret stays inside each HSM until round 2 uses it up.',
        api: 'RelinearizationKeyGenProtocol (round 1 + round 2)',
        link: 'tls',
      },
      {
        id: 'collective-galois-keys',
        from: 'hsmC',
        to: 'cloud',
        label: 'GKG shares',
        title: 'Collective Galois (rotation) keys',
        detail:
          'One protocol run per rotation the application needs. Each party’s share is the size of a full rotation key, which is the main output an HSM must produce here.',
        api: 'GaloisKeyGenProtocol (one run per automorphism)',
        link: 'tls',
      },
      {
        id: 'owner-encrypts-locally',
        from: 'client',
        to: 'client',
        label: 'encrypt locally',
        api: 'rlwe Encryptor (bgv.Parameters) with the collective public key',
        title: 'The data owner encrypts on its own device',
        detail:
          'The data owner encrypts its data with the collective public key on its own device. No single key holder can decrypt it.',
        link: 'fhe',
      },
      {
        id: 'upload-ciphertexts',
        from: 'client',
        to: 'cloud',
        label: 'FHE(data)',
        title: 'Upload ciphertexts to the third party',
        detail:
          'Only ciphertexts leave the data owner. The third party stores and computes on them but cannot read them. The FHE layer is post-quantum; the TLS session around it often is not.',
        link: 'tls',
      },
      {
        id: 'compute-ciphertexts',
        from: 'cloud',
        to: 'cloud',
        label: 'f( ) on ciphertexts',
        title: 'Compute on ciphertexts',
        detail:
          'Additions, multiplications, relinearization and rotations with the collective keys.',
        api: 'bgv Evaluator',
        link: 'fhe',
      },
      {
        id: 'interactive-refresh',
        from: 'cloud',
        to: 'hsmB',
        label: 'refresh request → A, B',
        title: 'Interactive refresh instead of bootstrapping',
        detail:
          'When the ciphertext runs out of levels, two parties each compute a refresh share for it, with noise flooding so the share does not leak their secret. No bootstrapping keys exist in this model.',
        api: 'mpbgv.RefreshProtocol.GenShare (noise flooding set in NewRefreshProtocol)',
        deployment: true,
        link: 'tls',
      },
      {
        id: 'aggregate-refresh-shares',
        from: 'cloud',
        to: 'cloud',
        label: 'aggregate → fresh ct',
        title: 'Aggregate the refresh shares',
        detail:
          'The aggregator combines the shares into a ciphertext at full level and computation continues.',
        api: 'RefreshProtocol.AggregateShares · Finalize',
        link: 'fhe',
      },
      {
        id: 'key-switch-to-owner',
        from: 'hsmA',
        to: 'cloud',
        label: 'PCKS shares (A, B)',
        title: 'Re-encrypt the result to the data owner',
        detail:
          'Two parties produce public-key-switch shares that move the result from the joint secret to the data owner’s own public key, without decrypting it.',
        api: 'PublicKeySwitchProtocol.GenShare (target: owner public key)',
        deployment: true,
        link: 'tls',
      },
      {
        id: 'deliver-result-to-owner',
        from: 'cloud',
        to: 'client',
        label: 'ct under owner key',
        title: 'Deliver the re-encrypted result',
        detail: 'The aggregated key-switch yields a ciphertext only the data owner can decrypt.',
        api: 'PublicKeySwitchProtocol.AggregateShares · KeySwitch',
        link: 'tls',
      },
      {
        id: 'owner-decrypts-locally',
        from: 'client',
        to: 'client',
        label: 'decrypt (own key)',
        title: 'The data owner decrypts locally',
        detail: 'An ordinary single-party decryption with the owner’s own secret key.',
        api: 'rlwe Decryptor',
      },
    ],
    hsmDoes:
      'Deployment choice: each party’s HSM holds its share and runs its protocol shares: key generation, refresh and key switching.',
    staysSecret:
      'Each party’s share. The joint secret is never assembled, and the result is only ever decryptable by the data owner.',
    watchOut:
      'The protocols assume honest-but-curious parties. Each Galois key the application needs still costs every party a full-size share.',
  },
  {
    id: 'hsm-compute-limits',
    baseline: {
      implementation: 'OpenFHE / Lattigo CKKS key and operation types (sizes are estimates)',
      codeUrl: 'https://github.com/openfheorg/openfhe-development/tree/v1.6.0',
      paper: 'OpenFHE design paper (IACR ePrint 2022/915)',
      paperUrl: 'https://eprint.iacr.org/2022/915',
    },
    validation: {
      target: 'Evidence-scoped measurements only; no absolute claims.',
      reference: 'OpenFHE / Lattigo sizes, measured in pqctoday-sandbox',
    },
    label: 'What can run in the HSM?',
    tagline: 'Keygen and decrypt belong in the HSM. Homomorphic evaluation belongs on GPUs.',
    tileHint: 'FITS · STREAMS · DOES NOT FIT',
    colorClass: 'text-status-warning',
    borderClass: 'border-warning/40',
    bgClass: 'bg-warning/10',
    layman: {
      analogy:
        'An HSM is a safe with a small calculator inside. It is perfect for minting and using a key. FHE evaluation is more like a factory floor that needs warehouse-sized key tables and racks of GPUs.',
      whatsDifferent:
        'For RSA or ML-DSA the HSM runs the whole operation. FHE splits the work: the secret-key part is tiny, and the heavy part only needs public keys, so it can run anywhere.',
      catch:
        'Even "public" evaluation-key generation needs the secret, so it has to happen inside the HSM. The output is huge and must be streamed out.',
    },
    actors: [
      { id: 'app', label: 'Application', sub: 'requests ops', kind: 'client', zone: 'owner' },
      {
        id: 'hsm',
        label: 'HSM',
        sub: 'small RAM, modest CPU',
        kind: 'hsm',
        holdsSecret: true,
        zone: 'owner',
      },
      {
        id: 'gpu',
        label: 'GPU / FPGA cluster',
        sub: 'FHE accelerator',
        kind: 'gpu',
        zone: 'third',
      },
    ],
    steps: [
      {
        id: 'key-generation-fits',
        from: 'hsm',
        to: 'hsm',
        label: 'seed + sk',
        api: 'KeyGen()',
        deployment: true,
        title: 'Key generation: fits',
        detail:
          'A seed and one small polynomial take kilobytes and milliseconds. This is exactly what an HSM is for.',
        verdict: 'ok',
      },
      {
        id: 'eval-keygen-in-hsm',
        from: 'hsm',
        to: 'gpu',
        label: 'GB eval keys?',
        api: 'EvalRotateKeyGen · EvalBootstrapKeyGen',
        deployment: true,
        title: 'CKKS evaluation-key generation: does not scale',
        detail:
          'The math (NTTs, polynomial multiplication) is fine, but a CKKS bootstrapping key set is GBs. At the estimated sizes that is beyond HSM memory and throughput, and beyond what PKCS#11 can return. Either switch to TFHE, whose server key is tens of MB, or to a threshold scheme with interactive refresh (Lattigo), which needs no bootstrapping keys. The seed itself never leaves the HSM.',
        verdict: 'no',
        link: 'sig',
      },
      {
        id: 'evaluation-in-hsm',
        from: 'app',
        to: 'hsm',
        label: 'evaluate f( )?',
        api: 'EvalBootstrap',
        deployment: true,
        title: 'Homomorphic evaluation in the HSM: does not fit',
        detail:
          'Bootstrapping needs GBs of evaluation keys in memory and GPU-class throughput. An HSM has neither. Running it there would also make the HSM the trusted party FHE exists to remove.',
        verdict: 'no',
      },
      {
        id: 'evaluation-on-accelerators',
        from: 'app',
        to: 'gpu',
        label: 'evaluate f( )',
        api: 'EvalAdd · EvalMult · EvalBootstrap',
        title: 'Evaluation runs on accelerators',
        detail:
          'The cluster needs only public evaluation keys and ciphertexts, so it can sit outside the trust boundary.',
        verdict: 'ok',
        link: 'fhe',
      },
      {
        id: 'return-encrypted-result',
        from: 'gpu',
        to: 'app',
        label: 'FHE(result) → owner',
        title: 'Return the encrypted result to the data owner',
        detail:
          'The third party sends the result back still encrypted. It never held a key that could open it.',
        link: 'tls',
      },
      {
        id: 'app-requests-decrypt',
        from: 'app',
        to: 'hsm',
        label: 'decrypt request',
        title: 'The application asks the HSM to decrypt',
        detail:
          'The application, acting for the data owner, sends the encrypted result to the HSM over an authenticated channel. The accelerators have no access to the HSM.',
        link: 'tls',
      },
      {
        id: 'decrypt-in-hsm',
        from: 'hsm',
        to: 'hsm',
        label: 'decrypt',
        api: 'Decrypt',
        deployment: true,
        title: 'Decryption: fits',
        detail:
          'Decryption fits easily: microseconds to milliseconds. The policy around it matters more: only the application’s authenticated session may ask, only allowed result types or shapes are decrypted, and the plaintext must fit the allowed form before release.',
        verdict: 'ok',
      },
      {
        id: 'release-result',
        from: 'hsm',
        to: 'app',
        label: 'result',
        title: 'Release under policy',
        detail: 'Same policy and noise-flooding rules as single-HSM custody.',
        link: 'tls',
        shareWith: 'gpu',
      },
    ],
    hsmDoes:
      'Keygen and decrypt. CKKS bootstrapping-key generation is refused by design (estimated GBs).',
    staysSecret: 'The seed and secret key. Evaluation keys leave the HSM, so they must be signed.',
    watchOut:
      'No PKCS#11 v3.2 or KMIP mechanism exists for FHE yet, so these are vendor-defined operations today.',
  },
  {
    id: 'tfhe-transciphering',
    baseline: {
      implementation:
        'TFHE-rs apps/trivium: KreyviumStream / TriviumStream and the TransCiphering trait (trans_decrypt_64); transciphering input mechanism in TFHE-rs 1.8',
      codeUrl: 'https://github.com/zama-ai/tfhe-rs/tree/main/apps/trivium',
      paper: 'Balenbois, Orfila, Smart: Trivial Transciphering With Trivium and TFHE (WAHC 2023)',
      paperUrl: 'https://dl.acm.org/doi/10.1145/3605759.3625255',
    },
    validation: {
      target:
        'HSM steps token-validated as in TFHE custody; server steps reference-validated with TFHE-rs apps/trivium.',
      reference: 'TFHE-rs apps/trivium, pinned release',
    },
    label: 'Transciphering: TFHE-rs Kreyvium',
    tagline:
      'Upload at plaintext size: data is encrypted with the Kreyvium stream cipher, and the server converts it into TFHE ciphertexts without decrypting.',
    tileHint: 'KREYVIUM · trans_decrypt_64',
    colorClass: 'text-secondary',
    borderClass: 'border-secondary/40',
    bgClass: 'bg-secondary/10',
    scaling: {
      verdict: 'scales',
      note: 'Built on TFHE, so every key the HSM handles is KB to tens of MB. The public baseline uses Trivium or Kreyvium; TFHE-rs also ships AES-128-CTR transciphering (tfhe::transciphering); this flow shows Kreyvium, the cheaper option.',
    },
    layman: {
      analogy:
        'Ship each item in a light padlocked box (a stream cipher) and send the padlock key once inside an armoured crate (FHE). The server opens the light boxes inside the crate without ever seeing what is inside.',
      whatsDifferent:
        'Uploads stay the size of the data. The cost moves to the server, which runs the Kreyvium keystream homomorphically.',
      catch:
        'The paper reports under 300 ms per 64-bit block, so bulk data costs real server time. Trivium’s 80-bit key is too short for long-lived data; use Kreyvium’s 128-bit key.',
    },
    actors: [
      { id: 'client', label: 'Data owner', sub: 'light device', kind: 'client', zone: 'owner' },
      {
        id: 'hsm',
        label: 'HSM',
        sub: 'TFHE client key',
        kind: 'hsm',
        holdsSecret: true,
        zone: 'owner',
      },
      { id: 'cloud', label: 'FHE server', sub: 'untrusted compute', kind: 'cloud', zone: 'third' },
    ],
    steps: [
      {
        id: 'tfhe-keys-from-hsm',
        from: 'hsm',
        to: 'cloud',
        label: 'server key + sig',
        title: 'TFHE keys from the HSM',
        detail:
          'As in TFHE single-HSM custody: the client key stays in the HSM, and the server key goes to the server.',
        api: 'generate_keys(config) → (ClientKey, ServerKey)',
        deployment: true,
        link: 'sig',
      },
      {
        id: 'owner-kreyvium-setup',
        from: 'client',
        to: 'client',
        label: 'Kreyvium key k + IV',
        title: 'The data owner sets up a Kreyvium stream',
        detail: 'A random 128-bit key and 128-bit IV initialise the stream cipher in the clear.',
        api: 'KreyviumStream::<bool>::new(key, iv)',
        link: 'stream',
      },
      {
        id: 'send-encrypted-stream-key',
        from: 'client',
        to: 'cloud',
        label: 'FHE(k), once',
        title: 'Send the stream key encrypted under TFHE',
        detail: 'The 128-bit key is encrypted as 16 FheUint8 bytes, once per key.',
        api: '[FheUint8; 16] encrypted under the TFHE public key (KreyviumStreamByte::<FheUint8>::new)',
        link: 'fhe',
      },
      {
        id: 'upload-kreyvium-data',
        from: 'client',
        to: 'cloud',
        label: 'data ⊕ keystream',
        title: 'Upload data at plaintext size',
        detail:
          'Each 64-bit block is XORed with the Kreyvium keystream. The upload is the same size as the data.',
        api: 'KreyviumStream::<bool>::next_64',
        link: 'stream',
      },
      {
        id: 'transcipher',
        from: 'cloud',
        to: 'cloud',
        label: 'trans_decrypt_64',
        title: 'Transcipher into TFHE ciphertexts',
        detail:
          'The server runs the Kreyvium keystream under FHE from FHE(k) and the public IV, then XORs it with each block, giving FheUint64 ciphertexts of the data.',
        api: 'KreyviumStreamByte::<FheUint8>::new(FHE(k), iv, &server_key) · trans_decrypt_64',
        link: 'fhe',
      },
      {
        id: 'compute-ciphertexts',
        from: 'cloud',
        to: 'cloud',
        label: 'f( ) on FheUint64',
        title: 'Compute on the data',
        detail: 'Ordinary TFHE-rs integer operations.',
        api: 'set_server_key · FheUint64 operations',
        link: 'fhe',
      },
      {
        id: 'return-encrypted-result',
        from: 'cloud',
        to: 'client',
        label: 'FHE(result) → owner',
        title: 'Return the encrypted result to the data owner',
        detail:
          'The third party sends the result back still encrypted. It never held a key that could open it.',
        link: 'tls',
      },
      {
        id: 'owner-requests-decrypt',
        from: 'client',
        to: 'hsm',
        label: 'decrypt request',
        title: 'The data owner asks its HSM to decrypt',
        detail:
          'The data owner (or its authorized application) sends the encrypted result to its own HSM over an authenticated channel. Only the data owner can ask; the third party has no access to the HSM.',
        link: 'tls',
      },
      {
        id: 'decrypt-under-policy',
        from: 'hsm',
        to: 'hsm',
        label: 'policy · type · decrypt',
        title: 'Decrypt under policy',
        detail:
          'Policy first, then decryption. This policy is not defined by ISO/IEC 28033 or by TFHE-rs; it is the HSM’s deployment layer built on TFHE-rs building blocks. The serialized ciphertext carries no access-control metadata (no owner, purpose or recipient, and nothing in it is authenticated), so control comes from the HSM’s policy object and the requester. (1) Only the data owner’s authenticated session may ask. (2) A conformance-checked type gate (TFHE-rs safe_deserialize_conformant) refuses a ciphertext whose type, block count or parameter set is not an allowed result type, before decrypting. Marking input types as never releasable stops a raw input being released whole, but not a slice of it: the HSM limits how many bits each release can reveal, and the rate limit caps the total. (3) After decrypting inside the HSM, the value must fit the allowed shape (a yes/no, a score from 0 to 100) or nothing is released; a refusal still counts against the rate limit, because refusing is itself an answer. (4) Rate limit and audit. Decryption itself is a 2,048-term dot product per block: microseconds. The HSM cannot verify which computation produced a ciphertext; only verifiable-computation proofs could, and those are research.',
        api: 'FheUint64::decrypt(&client_key)',
        deployment: true,
        verdict: 'ok',
      },
      {
        id: 'release-result',
        from: 'hsm',
        to: 'client',
        label: 'result',
        title: 'Release the result',
        detail: 'Only the authorized party gets the plaintext.',
        link: 'tls',
        shareWith: 'cloud',
      },
    ],
    hsmDoes:
      'Deployment choice: holds the TFHE client key, issues the server key and decrypts results.',
    staysSecret:
      'The TFHE client key (in the HSM) and the Kreyvium key k (only in the clear on the data owner’s device).',
    watchOut:
      'Use Kreyvium (128-bit key), not Trivium (80-bit), for data that must stay confidential for years. AES-128-CTR transciphering is available in TFHE-rs but costs more than Kreyvium.',
  },
]

/** Phase and data state of every step, aligned with each flow's `steps` (checked by tests). */
export const FLOW_STEP_META: Record<FheFlowId, { phase: Phase[]; data: DataState[] }> = {
  'single-hsm': {
    phase: [
      'setup',
      'setup',
      'setup',
      'encrypt',
      'encrypt',
      'compute',
      'compute',
      'decrypt',
      'decrypt',
      'decrypt',
      'backup',
      'backup',
    ],
    data: [
      'keys',
      'keys',
      'keys',
      'encrypting',
      'encrypted',
      'encrypted',
      'encrypted',
      'encrypted',
      'decrypting',
      'result',
      'keys',
      'keys',
    ],
  },
  'tfhe-single-hsm': {
    phase: [
      'setup',
      'setup',
      'setup',
      'setup',
      'encrypt',
      'encrypt',
      'compute',
      'compute',
      'decrypt',
      'decrypt',
      'decrypt',
      'backup',
      'backup',
    ],
    data: [
      'keys',
      'keys',
      'keys',
      'keys',
      'encrypting',
      'encrypted',
      'encrypted',
      'encrypted',
      'encrypted',
      'decrypting',
      'result',
      'keys',
      'keys',
    ],
  },
  'openfhe-threshold': {
    phase: [
      'setup',
      'setup',
      'setup',
      'setup',
      'setup',
      'encrypt',
      'encrypt',
      'compute',
      'compute',
      'decrypt',
      'decrypt',
      'decrypt',
      'decrypt',
      'decrypt',
    ],
    data: [
      'keys',
      'keys',
      'keys',
      'keys',
      'keys',
      'encrypting',
      'encrypted',
      'encrypted',
      'encrypted',
      'encrypted',
      'encrypted',
      'encrypted',
      'encrypted',
      'decrypting',
    ],
  },
  'lattigo-threshold': {
    phase: [
      'setup',
      'setup',
      'setup',
      'setup',
      'encrypt',
      'encrypt',
      'compute',
      'compute',
      'compute',
      'decrypt',
      'decrypt',
      'decrypt',
    ],
    data: [
      'keys',
      'keys',
      'keys',
      'keys',
      'encrypting',
      'encrypted',
      'encrypted',
      'encrypted',
      'encrypted',
      'encrypted',
      'encrypted',
      'decrypting',
    ],
  },
  'hsm-compute-limits': {
    phase: ['setup', 'setup', 'compute', 'compute', 'compute', 'decrypt', 'decrypt', 'decrypt'],
    data: [
      'keys',
      'keys',
      'encrypted',
      'encrypted',
      'encrypted',
      'encrypted',
      'decrypting',
      'result',
    ],
  },
  'tfhe-transciphering': {
    phase: [
      'setup',
      'encrypt',
      'encrypt',
      'encrypt',
      'compute',
      'compute',
      'compute',
      'decrypt',
      'decrypt',
      'decrypt',
    ],
    data: [
      'keys',
      'keys',
      'encrypted',
      'encrypting',
      'encrypted',
      'encrypted',
      'encrypted',
      'encrypted',
      'decrypting',
      'result',
    ],
  },
}
