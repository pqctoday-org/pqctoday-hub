// SPDX-License-Identifier: GPL-3.0-only

// ── Homomorphic Encryption (FHE) — data for the Learn section ───────────
// Scope rule (2026-10-02): only schemes defined in ISO/IEC 28033 and only
// open-source implementations of them; commercial products are named, not
// covered. Key sizes are orders of magnitude — they depend on parameters and
// compression and must not be read as measured figures.

export interface FheScheme {
  id: string
  name: string
  year: number
  dataType: string
  bestFor: string
  bootstrapping: string
  isoPart: string
}

export const FHE_SCHEMES: FheScheme[] = [
  {
    id: 'bgv',
    name: 'BGV',
    year: 2012,
    dataType: 'Exact integers mod t, SIMD-packed',
    bestFor: 'Exact batched arithmetic (counts, matching)',
    bootstrapping: 'Possible but slow — usually run leveled',
    isoPart: 'ISO/IEC DIS 28033-2',
  },
  {
    id: 'bfv',
    name: 'BFV',
    year: 2012,
    dataType: 'Exact integers mod t, SIMD-packed',
    bestFor: 'Same as BGV, scale-invariant variant',
    bootstrapping: 'Possible but slow — usually run leveled',
    isoPart: 'ISO/IEC DIS 28033-2',
  },
  {
    id: 'ckks',
    name: 'CKKS',
    year: 2017,
    dataType: 'Approximate real / complex vectors',
    bestFor: 'Machine learning, statistics, signal processing',
    bootstrapping: 'Yes (approximate)',
    isoPart: 'ISO/IEC DIS 28033-3',
  },
  {
    id: 'tfhe',
    name: 'TFHE / CGGI (and FHEW)',
    year: 2016,
    dataType: 'Bits and small integers',
    bestFor: 'Arbitrary functions via lookup tables, comparisons, branching logic',
    bootstrapping:
      'Programmable bootstrapping after every gate (boolean API) or nonlinear operation (integer API)',
    isoPart: 'ISO/IEC FDIS 28033-4',
  },
]

export interface FheKey {
  id: string
  name: string
  secret: boolean
  what: string
  sizeOrder: string
}

export const FHE_KEYS: FheKey[] = [
  {
    id: 'sk',
    name: 'Secret key',
    secret: true,
    what: 'A polynomial with tiny coefficients ({-1, 0, 1} or small Gaussian) in Z_q[X]/(X^N+1). TFHE adds a short binary LWE key.',
    sizeOrder:
      '~16 KB packed at N = 2¹⁶, ~16 MB expanded in NTT/RNS form (estimate); regenerable from a 32-byte seed. TFHE: a few hundred bytes of key bits, ~24 KB as stored',
  },
  {
    id: 'pk',
    name: 'Public (encryption) key',
    secret: false,
    what: 'An RLWE sample (b = −a·s + e, a). Anyone holding it can encrypt.',
    sizeOrder: '~15–30 MB for CKKS/BFV at N = 2¹⁶ (estimate); TFHE compact key tens of KB',
  },
  {
    id: 'relin',
    name: 'Relinearization key',
    secret: false,
    what: 'Key-switching key from s² back to s — needed after every ciphertext × ciphertext multiply (BGV/BFV/CKKS).',
    sizeOrder: 'Tens to hundreds of MB',
  },
  {
    id: 'rot',
    name: 'Rotation (Galois) keys',
    secret: false,
    what: 'One key-switching key per slot rotation you want to allow, plus conjugation for CKKS.',
    sizeOrder: 'Each ≈ a relin key; a CKKS bootstrapping set reaches GBs',
  },
  {
    id: 'bsk',
    name: 'Bootstrapping key (TFHE)',
    secret: false,
    what: 'Every bit of the secret key encrypted under a second key — lets the server refresh noise without decrypting.',
    sizeOrder: 'Tens to hundreds of MB (compressed forms are smaller)',
  },
]

export interface FheOperation {
  name: string
  runBy: 'client' | 'server' | 'key holder'
  needs: string
  note: string
}

export const FHE_OPERATIONS: FheOperation[] = [
  {
    name: 'Encode / Encrypt',
    runBy: 'client',
    needs: 'public key',
    note: 'Fresh ciphertext, small noise',
  },
  { name: 'Add', runBy: 'server', needs: '—', note: 'Noise adds — cheap' },
  {
    name: 'Multiply + Relinearize',
    runBy: 'server',
    needs: 'relin key',
    note: 'Noise grows fast — this is what limits depth',
  },
  {
    name: 'Rescale / Mod-switch',
    runBy: 'server',
    needs: '—',
    note: 'Drops one modulus level to keep noise and scale in check',
  },
  {
    name: 'Rotate',
    runBy: 'server',
    needs: 'rotation key',
    note: 'Moves values between SIMD slots',
  },
  {
    name: 'Bootstrap',
    runBy: 'server',
    needs: 'bootstrapping / rotation keys',
    note: 'Refreshes noise so computation can continue — the expensive step',
  },
  {
    name: 'Decrypt / Decode',
    runBy: 'key holder',
    needs: 'secret key',
    note: 'The only evaluation-time operation that needs the secret (key generation needs it too) — the HSM’s job',
  },
]

export interface FheQuantumExposure {
  id: string
  component: string
  typical: string
  broken: boolean
  fix: string
}

export const FHE_QUANTUM_EXPOSURE: FheQuantumExposure[] = [
  {
    id: 'fhe-core',
    component: 'The FHE scheme itself (BGV/BFV/CKKS/TFHE)',
    typical: 'Ring/Module-LWE lattices',
    broken: false,
    fix: 'No known quantum break — same (Ring-)LWE family as ML-KEM (FIPS 203); FHE schemes are not NIST-standardized, so pick parameters for a stated PQ level',
  },
  {
    id: 'phe',
    component: 'Additively homomorphic layer (e-voting, private sums, threshold-ECDSA wallets)',
    typical: 'Paillier / exponential ElGamal',
    broken: true,
    fix: 'Replace with a lattice scheme (BFV/BGV)',
  },
  {
    id: 'channel',
    component: 'Channel carrying ciphertexts and evaluation keys',
    typical: 'TLS 1.3 with ECDHE',
    broken: true,
    fix: 'Hybrid key exchange (X25519MLKEM768)',
  },
  {
    id: 'integrity',
    component: 'Integrity of evaluation keys and results (FHE is malleable)',
    typical: 'ECDSA / RSA signatures',
    broken: true,
    fix: 'ML-DSA or SLH-DSA signatures',
  },
  {
    id: 'backup',
    component: 'Secret-key backup and escrow',
    typical: 'RSA-OAEP or ECDH key wrap',
    broken: true,
    fix: 'A non-extractable seed replicated only HSM to HSM: FIPS 203 ML-KEM-768 to the recipient’s certificate, signed with FIPS 204 ML-DSA-65',
  },
  {
    id: 'stream',
    component: 'Transciphering stream cipher (TFHE-rs)',
    typical: 'Trivium (80-bit key)',
    broken: true,
    fix: 'Kreyvium (128-bit key), also in TFHE-rs; Grover leaves 80-bit keys too short',
  },
]

export interface FheImplementation {
  id: string
  name: string
  maintainer: string
  license: string
  schemes: string
  wasm: string
  caveat?: string
  url: string
}

export const FHE_IMPLEMENTATIONS: FheImplementation[] = [
  {
    id: 'lattigo',
    name: 'Lattigo',
    maintainer: 'Tune Insight',
    license: 'Apache-2.0',
    schemes: 'BGV, BFV, CKKS, multiparty (threshold)',
    wasm: 'Pure Go — compiles to WebAssembly with the standard Go toolchain',
    url: 'https://github.com/tuneinsight/lattigo',
  },
  {
    id: 'openfhe',
    name: 'OpenFHE',
    maintainer: 'OpenFHE consortium',
    license: 'BSD-2-Clause',
    schemes: 'BGV, BFV, CKKS, CGGI/FHEW, scheme switching, threshold, proxy re-encryption',
    wasm: 'Official openfhe-wasm port (Emscripten)',
    caveat: 'WASM port is work in progress — a subset of BGV/BFV/CKKS, no FHEW/TFHE',
    url: 'https://github.com/openfheorg/openfhe-development',
  },
  {
    id: 'seal',
    name: 'Microsoft SEAL',
    maintainer: 'Microsoft Research',
    license: 'MIT',
    schemes: 'BFV, BGV, CKKS (no bootstrapping)',
    wasm: 'node-seal (community Emscripten build)',
    caveat: 'node-seal tracks SEAL 4.1.2, behind upstream',
    url: 'https://github.com/microsoft/SEAL',
  },
  {
    id: 'tfhe-rs',
    name: 'TFHE-rs',
    maintainer: 'Zama',
    license: 'BSD-3-Clause-Clear',
    schemes: 'TFHE / CGGI (integers, booleans)',
    wasm: 'Official npm package “tfhe” — client-side keygen, encrypt, decrypt',
    caveat: 'Zama states commercial use requires a separate patent licence',
    url: 'https://github.com/zama-ai/tfhe-rs',
  },
]

export const FHE_COMMERCIAL_NAMES = [
  'Duality Platform (built on OpenFHE)',
  'Zama commercial licences and hardware',
  'DataKrypto FHE Module',
  'FHE hardware accelerators (Niobium, Optalysys, Intel)',
]
