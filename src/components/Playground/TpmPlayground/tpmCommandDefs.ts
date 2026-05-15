export type TpmPhase = 'startup' | 'explore' | 'create' | 'use'

export interface TpmParamDef {
  name: string
  tpmType: string
  value: string
  description: string
}

export interface TpmRespFieldDef {
  name: string
  tpmType: string
  byteOffset: number
  byteSize: number // 0 = variable length
  description: string
}

export interface TpmCommandDef {
  key: string
  cc: number
  name: string
  section: string
  phase: TpmPhase
  description: string
  why: string
  showAlgorithm: boolean
  requiresKem?: boolean
  requiresDsa?: boolean
  params: (algorithm: string) => TpmParamDef[]
  respFields: (algorithm: string) => TpmRespFieldDef[]
}

// ── RC table ─────────────────────────────────────────────────────────────────

// RC codes per TCG TPM2.0 Library Specification Part 2 Table 16 (Format-0)
// and IBM TPM reference implementation (RC_VER1 = 0x100 base).
export const TPM_RC_TABLE: Record<number, { name: string; description: string }> = {
  0x00000000: {
    name: 'TPM_RC_SUCCESS',
    description: 'Command completed successfully.',
  },
  0x00000100: {
    name: 'TPM_RC_INITIALIZE',
    description:
      'TPM already initialized. TPM2_Startup was called when the TPM was already running. This is expected — the WASM module calls Startup automatically at load time.',
  },
  0x00000101: {
    name: 'TPM_RC_FAILURE',
    description:
      'General failure. The TPM encountered an unrecoverable error — possibly an internal assertion, missing algorithm support, or entropy failure.',
  },
  0x00000103: {
    name: 'TPM_RC_SEQUENCE',
    description: 'Improper use of a sequence handle.',
  },
  0x0000010b: {
    name: 'TPM_RC_PRIVATE',
    description: 'Private key material was not found or could not be decrypted.',
  },
  0x00000120: {
    name: 'TPM_RC_DISABLED',
    description: 'This command is disabled in the current TPM configuration or command set.',
  },
  0x00000131: {
    name: 'TPM_RC_UNBALANCED',
    description:
      'The context can only be loaded if: 1) both the EK and the HMK are loaded; or 2) neither is loaded.',
  },
  0x00000142: {
    name: 'TPM_RC_COMMAND_SIZE',
    description: 'The commandSize value does not match the actual size of the command.',
  },
  0x00000143: {
    name: 'TPM_RC_COMMAND_CODE',
    description:
      'Command code not supported. This command code is not enabled in the current runtime profile.',
  },
  0x00000144: {
    name: 'TPM_RC_AUTHSIZE',
    description:
      'The value of authorizationSize is out of range or the number of octets in the Authorization Area is greater than required.',
  },
  0x00000145: {
    name: 'TPM_RC_AUTH_CONTEXT',
    description:
      'Use of an authorization session with a context command or another command that cannot have an authorization session.',
  },
  0x00000150: {
    name: 'TPM_RC_BAD_CONTEXT',
    description: 'A context identifier is not valid.',
  },
  0x00000152: {
    name: 'TPM_RC_PARENT',
    description: 'The parent object is not correct for this operation (wrong hierarchy or type).',
  },
  0x00000154: {
    name: 'TPM_RC_NO_RESULT',
    description: 'The TPM was unable to marshal a response back for this command.',
  },
  0x00000185: {
    name: 'TPM_RC_ATTRIBUTES',
    description: 'Object attributes are inconsistent or invalid for this operation.',
  },
  0x00000184: {
    name: 'TPM_RC_SCHEME',
    description: 'The scheme is not acceptable for the key type or usage.',
  },
  0x0000018b: {
    name: 'TPM_RC_KEY',
    description: 'Key type is not correct for the requested operation.',
  },
}

export function getRcInfo(rc: number): { name: string; description: string } {
  return (
    TPM_RC_TABLE[rc] ?? {
      name: `0x${rc.toString(16).padStart(8, '0')}`,
      description:
        'Unrecognized return code. Check TCG Part 2 §6.6 for format-specific error encoding (parameter/session/handle qualifiers in bits 6-8).',
    }
  )
}

// ── Algorithm helpers ─────────────────────────────────────────────────────────

interface AlgParams {
  algId: number
  paramSet: number
  isKem: boolean
}

const ALG_PARAM_MAP: Record<string, AlgParams> = {
  'MLKEM-512': { algId: 0x00a0, paramSet: 0x0001, isKem: true },
  'MLKEM-768': { algId: 0x00a0, paramSet: 0x0002, isKem: true },
  'MLKEM-1024': { algId: 0x00a0, paramSet: 0x0003, isKem: true },
  'MLDSA-44': { algId: 0x00a1, paramSet: 0x0001, isKem: false },
  'MLDSA-65': { algId: 0x00a1, paramSet: 0x0002, isKem: false },
  'MLDSA-87': { algId: 0x00a1, paramSet: 0x0003, isKem: false },
}

const KEM_PK_SIZES: Record<string, number> = {
  'MLKEM-512': 800,
  'MLKEM-768': 1184,
  'MLKEM-1024': 1568,
}
const DSA_PK_SIZES: Record<string, number> = {
  'MLDSA-44': 1312,
  'MLDSA-65': 1952,
  'MLDSA-87': 2592,
}

export function getAlgParams(algorithm: string): AlgParams {
  return ALG_PARAM_MAP[algorithm] ?? ALG_PARAM_MAP['MLKEM-768']
}

export function getPkSize(algorithm: string): number {
  return KEM_PK_SIZES[algorithm] ?? DSA_PK_SIZES[algorithm] ?? 1184
}

// Hybrid Labeled-KEM algorithm-string parser. Strings have the shape
// "HYBRID:MLKEM-768+X25519". Anything we can't parse defaults to MLKEM-768 +
// X25519 so the params table never crashes.
export interface HybridAlgoParts {
  mlkem: 'MLKEM-512' | 'MLKEM-768' | 'MLKEM-1024'
  classical: 'X25519' | 'P-256'
}
export function parseHybridAlgo(algorithm: string): HybridAlgoParts {
  // Accept both 'HYBRID:MLKEM-768+X25519' and the raw 'MLKEM-768+X25519' shape.
  const body = algorithm.startsWith('HYBRID:') ? algorithm.slice('HYBRID:'.length) : algorithm
  const [mlkem, classical] = body.split('+')
  const validMlkem: HybridAlgoParts['mlkem'][] = ['MLKEM-512', 'MLKEM-768', 'MLKEM-1024']
  const validClassical: HybridAlgoParts['classical'][] = ['X25519', 'P-256']
  return {
    mlkem: validMlkem.includes(mlkem as HybridAlgoParts['mlkem'])
      ? (mlkem as HybridAlgoParts['mlkem'])
      : 'MLKEM-768',
    classical: validClassical.includes(classical as HybridAlgoParts['classical'])
      ? (classical as HybridAlgoParts['classical'])
      : 'X25519',
  }
}

// ── Command definitions ──────────────────────────────────────────────────────

export const COMMAND_DEFS: TpmCommandDef[] = [
  {
    key: 'TPM2_Startup',
    cc: 0x00000144,
    name: 'TPM2_Startup',
    section: 'TCG Part 3 §9.3 Tables 4-5 (V1.85 RC4)',
    phase: 'startup',
    description:
      'Initialize the TPM and establish its internal state. Must be the first command after power-on. TPM_SU_CLEAR resets all transient objects and sessions while preserving NV data.',
    why: 'The WASM module calls this automatically at load time. Sending it again returns TPM_RC_INITIALIZE (0x100) — that is expected behavior, not a bug. Shown here for educational reference only.',
    showAlgorithm: false,
    params: () => [
      {
        name: 'startupType',
        tpmType: 'TPM_SU',
        value: '0x0000 (TPM_SU_CLEAR)',
        description:
          'Clear all transient state. Transient objects, sessions, and DAA contexts are wiped. NV indices and persistent objects survive.',
      },
    ],
    respFields: () => [
      {
        name: 'tag',
        tpmType: 'TPM_ST',
        byteOffset: 0,
        byteSize: 2,
        description: '0x8001 = TPM_ST_NO_SESSIONS (no authorization session in response)',
      },
      {
        name: 'size',
        tpmType: 'UINT32',
        byteOffset: 2,
        byteSize: 4,
        description: 'Total response size in bytes (10 bytes on success)',
      },
      {
        name: 'responseCode',
        tpmType: 'TPM_RC',
        byteOffset: 6,
        byteSize: 4,
        description: '0x00000000 = success; 0x00000100 = TPM_RC_INITIALIZE (already running)',
      },
    ],
  },

  {
    key: 'TPM2_SelfTest',
    cc: 0x00000143,
    name: 'TPM2_SelfTest',
    section: 'TCG Part 3 §10.2 Tables 8-9 (V1.85 RC4)',
    phase: 'explore',
    description:
      'Instruct the TPM to execute cryptographic self-tests for all or untested algorithms. Returns RC_SUCCESS once all tests pass.',
    why: 'Verify PQC algorithm implementations (ML-KEM, ML-DSA) are operating correctly before creating keys. Required by FIPS 140-3 power-up testing and TCG V1.85 compliance validation.',
    showAlgorithm: false,
    params: () => [
      {
        name: 'fullTest',
        tpmType: 'TPMI_YES_NO',
        value: '0x01 (YES)',
        description:
          'Run tests for ALL implemented algorithms. Set 0x00 (NO) to test only those not yet verified since last startup.',
      },
    ],
    respFields: () => [
      {
        name: 'tag',
        tpmType: 'TPM_ST',
        byteOffset: 0,
        byteSize: 2,
        description: '0x8001 = TPM_ST_NO_SESSIONS',
      },
      {
        name: 'size',
        tpmType: 'UINT32',
        byteOffset: 2,
        byteSize: 4,
        description: 'Total response size (10 bytes for success)',
      },
      {
        name: 'responseCode',
        tpmType: 'TPM_RC',
        byteOffset: 6,
        byteSize: 4,
        description: '0x00000000 = all self-tests passed',
      },
    ],
  },

  {
    key: 'TPM2_GetCapability',
    cc: 0x0000017a,
    name: 'TPM2_GetCapability',
    section: 'TCG Part 3 §30.2 Tables 238-239 (V1.85 RC4)',
    phase: 'explore',
    description:
      'Query the TPM for registered capabilities — algorithm IDs, supported commands, PCR properties, and active handles.',
    why: 'Confirm that ML-KEM (0x00A0) and ML-DSA (0x00A1) are registered before attempting CreatePrimary. If absent, key creation fails with TPM_RC_COMMAND_CODE.',
    showAlgorithm: false,
    params: () => [
      {
        name: 'capability',
        tpmType: 'TPM_CAP',
        value: '0x00000000 (TPM_CAP_ALGS)',
        description: 'Enumerate all registered algorithm IDs and their properties.',
      },
      {
        name: 'property',
        tpmType: 'UINT32',
        value: '0x00000000',
        description: 'First algorithm ID to return. 0 = start from the beginning of the table.',
      },
      {
        name: 'propertyCount',
        tpmType: 'UINT32',
        value: '0x00000100 (256)',
        description:
          'Maximum entries to return. TPM sets moreData=YES if more algorithms exist beyond this count.',
      },
    ],
    respFields: () => [
      {
        name: 'tag',
        tpmType: 'TPM_ST',
        byteOffset: 0,
        byteSize: 2,
        description: '0x8001',
      },
      {
        name: 'size',
        tpmType: 'UINT32',
        byteOffset: 2,
        byteSize: 4,
        description: 'Total response size in bytes',
      },
      {
        name: 'responseCode',
        tpmType: 'TPM_RC',
        byteOffset: 6,
        byteSize: 4,
        description: '0x00000000 = success',
      },
      {
        name: 'moreData',
        tpmType: 'TPMI_YES_NO',
        byteOffset: 10,
        byteSize: 1,
        description:
          '0x00 = all data returned; 0x01 = more available (use property offset to page)',
      },
      {
        name: 'capabilityData.capability',
        tpmType: 'TPM_CAP',
        byteOffset: 11,
        byteSize: 4,
        description: 'Echo of the requested capability type (0 = TPM_CAP_ALGS)',
      },
      {
        name: 'data.algorithms.count',
        tpmType: 'UINT32',
        byteOffset: 15,
        byteSize: 4,
        description: 'Number of TPMS_ALG_PROPERTY entries (each 6 bytes: algID[2] + properties[4])',
      },
      {
        name: 'data.algorithms[0].alg',
        tpmType: 'TPM_ALG_ID',
        byteOffset: 19,
        byteSize: 2,
        description:
          'First algorithm ID. Scan N×6-byte entries for 0x00A0 (ML-KEM) and 0x00A1 (ML-DSA).',
      },
    ],
  },

  {
    key: 'TPM2_GetRandom',
    cc: 0x0000017b,
    name: 'TPM2_GetRandom',
    section: 'TCG Part 3 §16.1 Tables 75-76 (V1.85 RC4)',
    phase: 'explore',
    description:
      'Draw bytes from the TPM internal DRBG (AES-256-CTR, seeded at manufacture). Returns cryptographically strong random bytes isolated from OS-level entropy.',
    why: 'Access hardware entropy for key generation, nonce creation, or attestation challenges. TPM-sourced randomness is isolated and cannot be manipulated by an OS-level attacker.',
    showAlgorithm: false,
    params: () => [
      {
        name: 'bytesRequested',
        tpmType: 'UINT16',
        value: '0x0020 (32)',
        description:
          'Request 32 bytes (256 bits). The TPM may return fewer if the DRBG buffer is low — always check the returned size.',
      },
    ],
    respFields: () => [
      {
        name: 'tag',
        tpmType: 'TPM_ST',
        byteOffset: 0,
        byteSize: 2,
        description: '0x8001',
      },
      {
        name: 'size',
        tpmType: 'UINT32',
        byteOffset: 2,
        byteSize: 4,
        description: 'Total response size in bytes',
      },
      {
        name: 'responseCode',
        tpmType: 'TPM_RC',
        byteOffset: 6,
        byteSize: 4,
        description: '0x00000000 = success',
      },
      {
        name: 'randomBytes.size',
        tpmType: 'UINT16',
        byteOffset: 10,
        byteSize: 2,
        description: 'Actual number of random bytes returned (may be less than requested)',
      },
      {
        name: 'randomBytes.buffer',
        tpmType: 'BYTE[]',
        byteOffset: 12,
        byteSize: 0,
        description:
          'Random bytes from the AES-256-CTR DRBG. Verify non-trivial entropy (not all zeros, not repeating pattern).',
      },
    ],
  },

  {
    key: 'TPM2_CreatePrimary',
    cc: 0x00000131,
    name: 'TPM2_CreatePrimary',
    section: 'TCG Part 3 §24.1 Tables 191-192 (V1.85 RC4)',
    phase: 'create',
    description:
      'Create a primary key in a specified hierarchy and load it into the TPM. Primary keys are derived deterministically from the hierarchy seed and the public template — the same template always reproduces the same key.',
    why: 'Establishes the root of trust for PQC operations. An ML-KEM-768 primary key forms the Endorsement Key (EK) for key encapsulation. An ML-DSA-65 primary key forms the Attestation Key (AK) for platform identity signing.',
    showAlgorithm: true,
    params: (algorithm: string) => {
      const { isKem } = getAlgParams(algorithm)
      const pkSize = getPkSize(algorithm)
      return [
        {
          name: 'primaryHandle',
          tpmType: 'TPMI_RH_HIERARCHY',
          value: isKem ? '0x4000000B (TPM_RH_ENDORSEMENT)' : '0x40000001 (TPM_RH_OWNER)',
          description: isKem
            ? 'Endorsement hierarchy — EK keys identify the platform; certified by the TPM manufacturer.'
            : 'Owner/Storage hierarchy — AK keys are user-controlled and used for attestation.',
        },
        {
          name: 'inPublic.type',
          tpmType: 'TPM_ALG_ID',
          value: isKem
            ? `0x00A0 (TPM_ALG_MLKEM) — ${algorithm}`
            : `0x00A1 (TPM_ALG_MLDSA) — ${algorithm}`,
          description: isKem
            ? 'ML-KEM: Module-Lattice Key Encapsulation Mechanism (FIPS 203). Replaces RSA/ECDH for quantum-safe key agreement.'
            : 'ML-DSA: Module-Lattice Digital Signature Algorithm (FIPS 204). Replaces ECDSA/RSA for quantum-safe signing.',
        },
        {
          name: 'inPublic.parameters.parameterSet',
          tpmType: isKem ? 'TPMI_MLKEM_PARAMETER_SET' : 'TPMI_MLDSA_PARAMETER_SET',
          value: `0x0002 (${algorithm})`,
          description: isKem
            ? `${algorithm}: NIST PQC Category 3 (~192-bit classical security). Public key = ${pkSize} B. TCG V1.85 §11.2.6 Table 204 (TPMI_MLKEM_PARAMETER_SET).`
            : `${algorithm}: NIST PQC Category 3 (~192-bit classical security). Public key = ${pkSize} B. TCG V1.85 §11.2.7 Table 207 (TPMI_MLDSA_PARAMETER_SET).`,
        },
        {
          name: 'inPublic.objectAttributes',
          tpmType: 'TPMA_OBJECT',
          value: isKem
            ? '0x00030072 (fixedTPM | fixedParent | sensitiveDataOrigin | userWithAuth | restricted | decrypt)'
            : '0x00040072 (fixedTPM | fixedParent | sensitiveDataOrigin | userWithAuth | sign)',
          description: isKem
            ? 'Standard EK template from TCG EK Credential Profile §2.1. restricted+decrypt marks this as a KEM Endorsement Key.'
            : 'Standard AK template for unrestricted signing. The sign attribute enables ML-DSA signature operations.',
        },
      ]
    },
    respFields: (algorithm: string) => {
      const { isKem } = getAlgParams(algorithm)
      const pkSize = getPkSize(algorithm)
      // TPMT_PUBLIC starts at byte 20 (after: header[10] + handle[4] + paramSize[4] + TPM2B_PUBLIC.size[2])
      // ML-KEM restricted: type[2]+nameAlg[2]+attrs[4]+policy.size[2]+sym.alg[2]+sym.bits[2]+sym.mode[2]+paramSet[2] = 18 bytes of fields before unique
      // ML-DSA: type[2]+nameAlg[2]+attrs[4]+policy.size[2]+paramSet[2]+allowExternalMu[1] = 13 bytes before unique
      const uniqSizeOffset = isKem ? 38 : 33
      const uniqBufOffset = isKem ? 40 : 35
      return [
        {
          name: 'tag',
          tpmType: 'TPM_ST',
          byteOffset: 0,
          byteSize: 2,
          description: '0x8002 = TPM_ST_SESSIONS (auth session present)',
        },
        {
          name: 'size',
          tpmType: 'UINT32',
          byteOffset: 2,
          byteSize: 4,
          description: `Total response size (typically > ${pkSize + 80} bytes for this key size)`,
        },
        {
          name: 'responseCode',
          tpmType: 'TPM_RC',
          byteOffset: 6,
          byteSize: 4,
          description: '0x00000000 = key created and loaded into TPM',
        },
        {
          name: 'objectHandle',
          tpmType: 'TPM_HANDLE',
          byteOffset: 10,
          byteSize: 4,
          description:
            'Transient handle for the loaded key (e.g. 0x80000000). Pass this to Encapsulate or SignDigest.',
        },
        {
          name: 'paramSize',
          tpmType: 'UINT32',
          byteOffset: 14,
          byteSize: 4,
          description:
            'Size of the out-parameters area (outPublic + creationData + creationHash + creationTicket)',
        },
        {
          name: 'outPublic.size',
          tpmType: 'UINT16',
          byteOffset: 18,
          byteSize: 2,
          description: 'Serialized size of the TPMT_PUBLIC structure',
        },
        {
          name: 'outPublic.type',
          tpmType: 'TPM_ALG_ID',
          byteOffset: 20,
          byteSize: 2,
          description: isKem ? '0x00A0 = ML-KEM' : '0x00A1 = ML-DSA',
        },
        {
          name: 'outPublic.nameAlg',
          tpmType: 'TPM_ALG_ID',
          byteOffset: 22,
          byteSize: 2,
          description: '0x000B = SHA-256 (used to compute the object name for authorization)',
        },
        {
          name: 'outPublic.objectAttributes',
          tpmType: 'TPMA_OBJECT',
          byteOffset: 24,
          byteSize: 4,
          description: 'Confirmed attribute flags matching the creation template',
        },
        {
          name: 'outPublic.unique.size',
          tpmType: 'UINT16',
          byteOffset: uniqSizeOffset,
          byteSize: 2,
          description: `Must equal ${pkSize} for ${algorithm}`,
        },
        {
          name: 'outPublic.unique.buffer',
          tpmType: 'BYTE[]',
          byteOffset: uniqBufOffset,
          byteSize: 0,
          description: `The ${algorithm} public key material (${pkSize} bytes)`,
        },
      ]
    },
  },

  {
    key: 'TPM2_Encapsulate',
    cc: 0x000001a7,
    name: 'TPM2_Encapsulate',
    section: 'TCG Part 3 §14.10 Tables 60-61 (V1.85 RC4)',
    phase: 'use',
    requiresKem: true,
    showAlgorithm: false,
    description:
      'Public-key operation of a Key Encapsulation Mechanism. Generates a random sharedSecret and an accompanying ciphertext that can be decapsulated with the corresponding private key. Per Part 3 §14.10.1, the key referenced by keyHandle shall be a KEM key (TPM_RC_KEY) with restricted CLEAR and decrypt SET (TPM_RC_ATTRIBUTES).',
    why: 'Post-quantum key agreement replaces ECDH/RSA-OAEP. The shared secret feeds a KDF (HKDF-SHA256) to derive symmetric keys for AES-GCM or ChaCha20, creating a quantum-safe encrypted channel.',
    params: () => [
      {
        name: 'keyHandle',
        tpmType: 'TPMI_DH_OBJECT',
        value: 'ML-KEM handle (see TPM State)',
        description:
          'Reference to public portion of KEM key (Part 3 Table 60: Auth Index: None — no authorization). Returned by TPM2_CreatePrimary with ML-KEM key; must have the decrypt attribute set, restricted CLEAR.',
      },
    ],
    respFields: () => [
      {
        name: 'tag',
        tpmType: 'TPM_ST',
        byteOffset: 0,
        byteSize: 2,
        description:
          'Per Table 60: TPM_ST_SESSIONS (0x8002) if an audit or encrypt session is present; otherwise TPM_ST_NO_SESSIONS (0x8001).',
      },
      {
        name: 'responseSize',
        tpmType: 'UINT32',
        byteOffset: 2,
        byteSize: 4,
        description: 'Total response size in bytes.',
      },
      {
        name: 'responseCode',
        tpmType: 'TPM_RC',
        byteOffset: 6,
        byteSize: 4,
        description: '0x00000000 = sharedSecret and ciphertext generated.',
      },
      {
        name: 'sharedSecret.size',
        tpmType: 'UINT16',
        byteOffset: 10,
        byteSize: 2,
        description:
          'Size of the random secret shared between both parties. 0x0020 (32) for ML-KEM per FIPS 203 — all parameter sets share the same 32-byte shared-secret length.',
      },
      {
        name: 'sharedSecret.buffer',
        tpmType: 'BYTE[]',
        byteOffset: 12,
        byteSize: 0,
        description:
          'Random secret shared between both parties (Table 61: TPM2B_SHARED_SECRET). Feed into HKDF to derive symmetric encryption keys.',
      },
      {
        name: 'ciphertext.size',
        tpmType: 'UINT16',
        byteOffset: 0,
        byteSize: 2,
        description:
          'Size of the encapsulated ciphertext. ML-KEM-512: 768 B; ML-KEM-768: 1088 B; ML-KEM-1024: 1568 B (FIPS 203 Table 2).',
      },
      {
        name: 'ciphertext.buffer',
        tpmType: 'BYTE[]',
        byteOffset: 0,
        byteSize: 0,
        description:
          'Encapsulated ciphertext that can be decapsulated with the private key to produce sharedSecret (Table 61: TPM2B_KEM_CIPHERTEXT).',
      },
    ],
  },

  {
    key: 'TPM2_Decapsulate',
    cc: 0x000001a8,
    name: 'TPM2_Decapsulate',
    section: 'TCG Part 3 §14.11 Tables 62-63 (V1.85 RC4)',
    phase: 'use',
    requiresKem: true,
    showAlgorithm: false,
    description:
      'Private-key operation of a KEM. Given a ciphertext from a prior Encapsulate, returns the same sharedSecret produced during the encapsulation. Per §14.11.1, the key referenced by keyHandle shall be a KEM key (TPM_RC_KEY) with restricted CLEAR and decrypt SET (TPM_RC_ATTRIBUTES); private-key access requires authorization.',
    why: 'Post-quantum key establishment from the receiver side. The TPM is the decapsulation oracle — private key material stays in protected storage while the agreed shared secret is returned for symmetric cipher use.',
    params: () => [
      {
        name: '@keyHandle',
        tpmType: 'TPMI_DH_OBJECT',
        value: 'ML-KEM handle (see TPM State)',
        description:
          'Reference to loaded KEM key. Auth Index: 1, Auth Role: USER (Table 62) — requires authorization session for private-key use.',
      },
      {
        name: 'ciphertext.size',
        tpmType: 'UINT16',
        value: `1088 B (ML-KEM-768)`,
        description:
          'ML-KEM-512: 768 B; ML-KEM-768: 1088 B; ML-KEM-1024: 1568 B (FIPS 203 Table 2).',
      },
      {
        name: 'ciphertext.buffer',
        tpmType: 'BYTE[]',
        value: 'Ciphertext from prior TPM2_Encapsulate',
        description:
          'Encapsulated ciphertext (Table 62: TPM2B_KEM_CIPHERTEXT) produced by an earlier Encapsulate. With the PQC bridge active, the compliance suite captures and reuses the actual ciphertext for a round-trip validation.',
      },
    ],
    respFields: () => [
      {
        name: 'tag',
        tpmType: 'TPM_ST',
        byteOffset: 0,
        byteSize: 2,
        description:
          '0x8002 = TPM_ST_SESSIONS (private-key access requires auth — auth session always present in response).',
      },
      {
        name: 'responseSize',
        tpmType: 'UINT32',
        byteOffset: 2,
        byteSize: 4,
        description: 'Total response size in bytes.',
      },
      {
        name: 'responseCode',
        tpmType: 'TPM_RC',
        byteOffset: 6,
        byteSize: 4,
        description: '0x00000000 = success.',
      },
      {
        name: 'sharedSecret.size',
        tpmType: 'UINT16',
        byteOffset: 14,
        byteSize: 2,
        description:
          'Size of the decapsulated shared secret. 0x0020 (32) for ML-KEM (FIPS 203). Offset 14 = header(10) + paramSize(4) because TPM_ST_SESSIONS response carries a paramSize prefix.',
      },
      {
        name: 'sharedSecret.buffer',
        tpmType: 'BYTE[]',
        byteOffset: 16,
        byteSize: 0,
        description:
          'Decapsulated shared secret (Table 63: TPM2B_SHARED_SECRET). Must match the value returned by the corresponding Encapsulate.',
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // Educational construct — TCG v1.85 §11 Labeled KEM does NOT standardize a
  // hybrid mode. These entries demonstrate how a hybrid Labeled-KEM could be
  // composed from a real ML-KEM (via softhsmv3 / TCG v1.85 §11) plus a real
  // classical ECDH (X25519 or P-256) combined under HKDF-SHA256.
  // ──────────────────────────────────────────────────────────────────────────
  {
    key: 'TPM2_LabeledKEM_Hybrid_Encap',
    cc: 0x000001a7,
    name: 'TPM2_LabeledKEM_Hybrid_Encap (educational)',
    section: 'Educational — not in TCG v1.85',
    phase: 'use',
    requiresKem: true,
    showAlgorithm: true,
    description:
      'EDUCATIONAL CONSTRUCT (not a TCG v1.85 command). Composes a real ML-KEM encapsulation (via softhsmv3) with a real classical ECDH (X25519 or P-256, via Web Crypto) and combines the two shared secrets under HKDF-SHA256. TCG v1.85 §11 introduces Labeled KEM but does NOT define a hybrid mode — this is a teaching device for what a hybrid Labeled-KEM could look like.',
    why: 'Hybrid KEMs hedge classical ECDH against quantum attack while keeping classical security under cryptanalytic regression of ML-KEM. The HKDF combiner with a fixed label string provides domain separation. Every primitive here is real — ML-KEM via PKCS#11 v3.2 C_EncapsulateKey, ECDH via WebCrypto deriveBits, HKDF-SHA256 via WebCrypto.',
    params: (algorithm: string) => {
      // algorithm string is "HYBRID:MLKEM-768+X25519" etc.
      const { mlkem, classical } = parseHybridAlgo(algorithm)
      const pkSize = getPkSize(mlkem)
      const classicalPubSize = classical === 'X25519' ? 32 : 65
      const mlkemCtSize = mlkem === 'MLKEM-512' ? 768 : mlkem === 'MLKEM-768' ? 1088 : 1568
      return [
        {
          name: 'mlkemHandle',
          tpmType: 'TPMI_DH_OBJECT',
          value: 'ML-KEM handle (see TPM State)',
          description: `Same softhsm-backed ${mlkem} handle TPM2_Encapsulate would use. Public key size: ${pkSize} B.`,
        },
        {
          name: 'classicalAlg',
          tpmType: 'enum {X25519, P-256}',
          value: classical,
          description:
            classical === 'X25519'
              ? 'Curve25519 (RFC 7748) — 32-byte ephemeral public key, 32-byte shared secret.'
              : 'NIST P-256 (SEC1 uncompressed) — 65-byte ephemeral public key, 32-byte shared secret.',
        },
        {
          name: 'classicalPeerPub',
          tpmType: 'BYTE[]',
          value: `${classicalPubSize} B (peer ephemeral)`,
          description:
            'Peer-side classical public key. The playground generates this on demand via Web Crypto so the hybrid encap has a real recipient.',
        },
        {
          name: 'combiner',
          tpmType: 'KDF',
          value: 'HKDF-SHA256',
          description:
            'salt = "TCG-LabeledKEM-Hybrid-v0", info = "ml-kem || classical", ikm = ss_pqc || ss_classical, L = 32 B (RFC 5869).',
        },
        {
          name: '→ outCt(ML-KEM)',
          tpmType: 'BYTE[]',
          value: `${mlkemCtSize} B`,
          description: `ML-KEM ciphertext from C_EncapsulateKey on the softhsm ${mlkem} key.`,
        },
        {
          name: '→ outCt(classical)',
          tpmType: 'BYTE[]',
          value: `${classicalPubSize} B`,
          description:
            'Ephemeral classical public key (the "ct" in DH-as-KEM framing) generated by Web Crypto.',
        },
        {
          name: '→ combinedSs',
          tpmType: 'BYTE[32]',
          value: '32 B',
          description: 'HKDF-SHA256 output — the actual session key material for AEAD use.',
        },
      ]
    },
    respFields: () => [
      {
        name: 'note',
        tpmType: '—',
        byteOffset: 0,
        byteSize: 0,
        description:
          'No TPM-wire response — this command is composed at the JS layer. The “Send” button invokes the bridge directly. See the playground log for the encap output values.',
      },
    ],
  },
  {
    key: 'TPM2_LabeledKEM_Hybrid_Decap',
    cc: 0x000001a8,
    name: 'TPM2_LabeledKEM_Hybrid_Decap (educational)',
    section: 'Educational — not in TCG v1.85',
    phase: 'use',
    requiresKem: true,
    showAlgorithm: true,
    description:
      'EDUCATIONAL CONSTRUCT (mirror of the hybrid encap). Runs real ML-KEM decapsulation against the softhsm-resident private key and real classical ECDH against the saved local private key, then HKDF-combines the two. Must run AFTER the matching hybrid encap so the playground has the ML-KEM ciphertext + classical ephemeral pub from that step.',
    why: 'Demonstrates the full round-trip: combinedSs from decap MUST equal combinedSs from encap byte-for-byte. The playground log highlights both values for visual comparison.',
    params: (algorithm: string) => {
      const { mlkem, classical } = parseHybridAlgo(algorithm)
      const mlkemCtSize = mlkem === 'MLKEM-512' ? 768 : mlkem === 'MLKEM-768' ? 1088 : 1568
      const classicalPubSize = classical === 'X25519' ? 32 : 65
      return [
        {
          name: 'mlkemHandle',
          tpmType: 'TPMI_DH_OBJECT',
          value: 'ML-KEM handle (see TPM State)',
          description: `softhsm-backed ${mlkem} key. Private key never leaves the HSM boundary.`,
        },
        {
          name: 'mlkemCt',
          tpmType: 'BYTE[]',
          value: `${mlkemCtSize} B (from prior Encap)`,
          description: 'ML-KEM ciphertext captured from the matching hybrid encap step.',
        },
        {
          name: 'classicalEphPub',
          tpmType: 'BYTE[]',
          value: `${classicalPubSize} B (from prior Encap)`,
          description: 'Ephemeral classical public key the encapsulator generated.',
        },
        {
          name: 'classicalAlg',
          tpmType: 'enum {X25519, P-256}',
          value: classical,
          description: 'Classical curve used in the matching encap.',
        },
      ]
    },
    respFields: () => [
      {
        name: 'note',
        tpmType: '—',
        byteOffset: 0,
        byteSize: 0,
        description:
          'No TPM-wire response — this command is composed at the JS layer. The “Send” button invokes the bridge directly. See the playground log for the decap output and the equality check vs the encap output.',
      },
    ],
  },

  {
    key: 'TPM2_SignDigest',
    cc: 0x000001a6,
    name: 'TPM2_SignDigest',
    section: 'TCG Part 3 §20.7 Tables 126-127 (V1.85 RC4)',
    phase: 'use',
    requiresDsa: true,
    showAlgorithm: false,
    description:
      'Sign a pre-hashed message digest (or, for ML-DSA with allowExternalMu=YES, an externally-computed µ value per FIPS 204) using an ML-DSA or HashML-DSA key stored in the TPM. The private key never leaves the TPM. Per §20.7.1, restricted keys are permitted only with a valid TPMT_TK_HASHCHECK — for ML-DSA no valid ticket can be produced, so restricted ML-DSA keys with a NULL ticket return TPM_RC_TICKET on parameter 3.',
    why: "Post-quantum attestation and code signing. ML-DSA signatures are lattice-based and resist Shor's algorithm, replacing ECDSA/RSA-PSS for firmware signing, certificate issuance, and platform attestation.",
    params: () => [
      {
        name: '@keyHandle',
        tpmType: 'TPMI_DH_OBJECT',
        value: 'ML-DSA / HashML-DSA handle (see TPM State)',
        description:
          'Handle of key that will perform signing (Table 126: Auth Index 1, Auth Role USER). Returned by TPM2_CreatePrimary; must have the sign attribute set.',
      },
      {
        name: 'context.size',
        tpmType: 'UINT16',
        value: '0x0000 (empty)',
        description:
          'TPM2B_SIGNATURE_CTX. Length of additional context value used by the signing scheme. Per Table 126: "depending on the scheme, context may be optional, i.e., zero-length."',
      },
      {
        name: 'context.buffer',
        tpmType: 'BYTE[]',
        value: '(empty)',
        description:
          'Optional FIPS 204 §5.2 context string (≤ 255 B). Empty by default. Domain-separates signatures across applications.',
      },
      {
        name: 'digest.size',
        tpmType: 'UINT16',
        value: '0x0020 (32)',
        description: '32 bytes = SHA-256 hash of the message to sign (or 64 B external µ).',
      },
      {
        name: 'digest.buffer',
        tpmType: 'BYTE[]',
        value: '0xBB × 32 (SHA-256 digest)',
        description:
          'TPM2B_DIGEST. In production: SHA-256 hash of the firmware image, certificate, or message to be signed. For ML-DSA with allowExternalMu=YES: 64-byte external µ per FIPS 204.',
      },
      {
        name: 'validation.tag',
        tpmType: 'TPM_ST',
        value: '0x8024 (TPM_ST_HASHCHECK)',
        description:
          'TPMT_TK_HASHCHECK. Per Table 126: "If keyHandle is not a restricted signing key, then this may be a NULL Ticket with tag = TPM_ST_HASHCHECK."',
      },
      {
        name: 'validation.hierarchy',
        tpmType: 'TPMI_RH_HIERARCHY',
        value: '0x40000007 (TPM_RH_NULL)',
        description:
          'NULL hierarchy = NULL Ticket. For ML-DSA, no valid HASHCHECK ticket can exist (§20.7.1 Note), so this is always NULL for ML-DSA SignDigest.',
      },
      {
        name: 'validation.digest.size',
        tpmType: 'UINT16',
        value: '0x0000',
        description: 'Empty TPM2B_DIGEST inside the NULL ticket.',
      },
    ],
    respFields: () => [
      {
        name: 'tag',
        tpmType: 'TPM_ST',
        byteOffset: 0,
        byteSize: 2,
        description: '0x8002 = TPM_ST_SESSIONS (auth session present in response).',
      },
      {
        name: 'responseSize',
        tpmType: 'UINT32',
        byteOffset: 2,
        byteSize: 4,
        description:
          'Total response size in bytes. ML-DSA-65 → ~3329 B (header 10 + paramSize 4 + sigAlg 2 + paramSet 2 + size 2 + 3309 sig + auth).',
      },
      {
        name: 'responseCode',
        tpmType: 'TPM_RC',
        byteOffset: 6,
        byteSize: 4,
        description: '0x00000000 = signature generated.',
      },
      {
        name: 'paramSize',
        tpmType: 'UINT32',
        byteOffset: 10,
        byteSize: 4,
        description:
          'Size of the parameter area (precedes parameters in TPM_ST_SESSIONS responses).',
      },
      {
        name: 'signature.sigAlg',
        tpmType: 'TPM_ALG_ID',
        byteOffset: 14,
        byteSize: 2,
        description: '0x00A1 = TPM_ALG_MLDSA, or 0x00A2 = TPM_ALG_HASH_MLDSA (Part 2 §6.3).',
      },
      {
        name: 'signature.sig.size',
        tpmType: 'UINT16',
        byteOffset: 16,
        byteSize: 2,
        description:
          'TPM2B_SIGNATURE_MLDSA size (Table 216 = {size, buffer}). FIPS 204 Table 3 lengths: 2420 (ML-DSA-44), 3309 (ML-DSA-65), 4627 (ML-DSA-87). Parameter set is implicit from the signing key — TPM2B_SIGNATURE_MLDSA does NOT carry a paramSet field on the wire.',
      },
      {
        name: 'signature.sig.buffer',
        tpmType: 'BYTE[]',
        byteOffset: 18,
        byteSize: 0,
        description:
          'The ML-DSA signature bytes (Table 127: TPMT_SIGNATURE → TPMU_SIGNATURE.mldsa). Distribute with the message for verification.',
      },
    ],
  },

  {
    key: 'TPM2_VerifyDigestSignature',
    cc: 0x000001a5,
    name: 'TPM2_VerifyDigestSignature',
    section: 'TCG Part 3 §20.4 Tables 120-121 (V1.85 RC4)',
    phase: 'use',
    requiresDsa: true,
    showAlgorithm: false,
    description:
      'Verify an ML-DSA or HashML-DSA signature over a pre-computed digest using the public portion of the verification key. On success returns a TPMT_TK_VERIFIED ticket with tag = TPM_ST_DIGEST_VERIFIED.',
    why: 'Closes the post-quantum signature loop. Used by the TPM itself (after Quote/Certify external workflows) and by clients to confirm a signature came from a TPM-attested key without leaving the TPM trust boundary.',
    params: () => [
      {
        name: 'keyHandle',
        tpmType: 'TPMI_DH_OBJECT',
        value: 'ML-DSA / HashML-DSA handle (see TPM State)',
        description:
          'Handle of public key used for validation. Per Table 120: Auth Index None — verification uses public key only, no authorization required.',
      },
      {
        name: 'context.size',
        tpmType: 'UINT16',
        value: '0x0000 (empty)',
        description:
          'TPM2B_SIGNATURE_CTX. Same context value used during signing. Empty when SignDigest used empty context.',
      },
      {
        name: 'context.buffer',
        tpmType: 'BYTE[]',
        value: '(empty)',
        description: 'Domain-separation context bytes (≤ 255 B). Must match what was signed.',
      },
      {
        name: 'digest.size',
        tpmType: 'UINT16',
        value: '0x0020 (32)',
        description: 'Length of the original digest that was signed.',
      },
      {
        name: 'digest.buffer',
        tpmType: 'BYTE[]',
        value: '(digest bytes)',
        description: 'TPM2B_DIGEST — the digest that was signed.',
      },
      {
        name: 'signature.sigAlg',
        tpmType: 'TPM_ALG_ID',
        value: '0x00A1 (TPM_ALG_MLDSA)',
        description: 'Algorithm of the signature being verified.',
      },
      {
        name: 'signature.sig.size',
        tpmType: 'UINT16',
        value: '0x0CED (3309)',
        description: 'Signature length matching the parameter set.',
      },
      {
        name: 'signature.sig.buffer',
        tpmType: 'BYTE[]',
        value: '(signature bytes)',
        description: 'TPMT_SIGNATURE — the signature to be tested (Table 120).',
      },
    ],
    respFields: () => [
      {
        name: 'tag',
        tpmType: 'TPM_ST',
        byteOffset: 0,
        byteSize: 2,
        description:
          'Per Table 120: TPM_ST_SESSIONS (0x8002) if an audit or decrypt session is present; otherwise TPM_ST_NO_SESSIONS (0x8001).',
      },
      {
        name: 'responseSize',
        tpmType: 'UINT32',
        byteOffset: 2,
        byteSize: 4,
        description: 'Total response size in bytes.',
      },
      {
        name: 'responseCode',
        tpmType: 'TPM_RC',
        byteOffset: 6,
        byteSize: 4,
        description:
          '0x00000000 = signature verified; 0x000001D2 = TPM_RC_SCHEME on context; 0x00000182 = TPM_RC_ATTRIBUTES (e.g., allowExternalMu=NO); 0x000001DB = TPM_RC_SIGNATURE.',
      },
      {
        name: 'validation.tag',
        tpmType: 'TPM_ST',
        byteOffset: 10,
        byteSize: 2,
        description:
          '0x8027 = TPM_ST_DIGEST_VERIFIED on success (Table 121: "tag will be TPM_ST_DIGEST_VERIFIED").',
      },
      {
        name: 'validation.hierarchy',
        tpmType: 'TPMI_RH_HIERARCHY',
        byteOffset: 12,
        byteSize: 4,
        description:
          'Hierarchy that owns the verifying key. TPM_RH_NULL (0x40000007) when no HMAC binding (e.g., NULL nameAlg or NULL hierarchy).',
      },
      {
        name: 'validation.metadata.digestVerified',
        tpmType: 'TPM_ALG_ID',
        byteOffset: 16,
        byteSize: 2,
        description:
          'TPMU_TK_VERIFIED_META.digestVerified (Part 2 §10.6.4 Table 110): the hash algorithm of the verified digest. Omitted (0 bytes) for NULL tickets per V1.85 §10.6.5.',
      },
      {
        name: 'validation.hmac.size',
        tpmType: 'UINT16',
        byteOffset: 0,
        byteSize: 2,
        description:
          'Length of the ticket HMAC binding (Part 2 §10.6.5 Table 112). 0 for NULL tickets.',
      },
    ],
  },
]

export function getCommandDef(key: string): TpmCommandDef | undefined {
  return COMMAND_DEFS.find((c) => c.key === key)
}
