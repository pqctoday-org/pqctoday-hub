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

// ── Command definitions ──────────────────────────────────────────────────────

export const COMMAND_DEFS: TpmCommandDef[] = [
  {
    key: 'TPM2_Startup',
    cc: 0x00000144,
    name: 'TPM2_Startup',
    section: 'TCG Part 3 §12.1',
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
    section: 'TCG Part 3 §11.4',
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
    section: 'TCG Part 3 §30.2',
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
    section: 'TCG Part 3 §16.1',
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
    section: 'TCG Part 3 §24.1',
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
            ? `${algorithm}: Security level 3 (192-bit). Public key = ${pkSize} B. TCG V1.85 §11.2.6 Table 204.`
            : `${algorithm}: Security level 3 (128-bit). Public key = ${pkSize} B. TCG V1.85 §11.2.7 Table 207.`,
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
    section: 'TCG Part 3 §26.1 (V1.85)',
    phase: 'use',
    requiresKem: true,
    showAlgorithm: false,
    description:
      'Generate a shared secret and a ciphertext (encapsulation) using an ML-KEM public key. The holder of the corresponding private key can run Decapsulate to recover the identical shared secret. With the PQC bridge active, this performs real ML-KEM-768 encapsulation via SoftHSMv3.',
    why: 'Post-quantum key agreement replaces ECDH/RSA-OAEP. The shared secret feeds a KDF (HKDF-SHA256) to derive symmetric keys for AES-GCM or ChaCha20, creating a quantum-safe encrypted channel.',
    params: () => [
      {
        name: 'keyHandle',
        tpmType: 'TPMI_DH_OBJECT',
        value: 'ML-KEM handle (see TPM State)',
        description:
          'Handle returned by TPM2_CreatePrimary with ML-KEM key. Must have the decrypt attribute set.',
      },
    ],
    respFields: () => [
      {
        name: 'tag',
        tpmType: 'TPM_ST',
        byteOffset: 0,
        byteSize: 2,
        description:
          '0x8001 = TPM_ST_NO_SESSIONS (encapsulation uses public key only — no auth needed)',
      },
      {
        name: 'size',
        tpmType: 'UINT32',
        byteOffset: 2,
        byteSize: 4,
        description: 'Total response size',
      },
      {
        name: 'responseCode',
        tpmType: 'TPM_RC',
        byteOffset: 6,
        byteSize: 4,
        description: '0x00000000 = shared secret and ciphertext generated',
      },
      {
        name: 'outSharedKey.size',
        tpmType: 'UINT16',
        byteOffset: 10,
        byteSize: 2,
        description: 'Shared secret length (32 bytes for ML-KEM-768 → matches AES-256)',
      },
      {
        name: 'outSharedKey.buffer',
        tpmType: 'BYTE[]',
        byteOffset: 12,
        byteSize: 0,
        description:
          'The derived shared secret. Feed into HKDF to produce symmetric encryption keys.',
      },
    ],
  },

  {
    key: 'TPM2_Decapsulate',
    cc: 0x000001a8,
    name: 'TPM2_Decapsulate',
    section: 'TCG Part 3 §26.2 (V1.85)',
    phase: 'use',
    requiresKem: true,
    showAlgorithm: false,
    description:
      "Recover the shared secret from an ML-KEM ciphertext using the private key held inside the TPM. The private key never leaves the TPM boundary. With the PQC bridge active, the recovered shared secret matches the encapsulator's secret byte-for-byte.",
    why: 'Post-quantum key establishment from the receiver side. The TPM is the decapsulation oracle — private key material stays in protected storage while the agreed shared secret is returned for symmetric cipher use.',
    params: () => [
      {
        name: 'keyHandle',
        tpmType: 'TPMI_DH_OBJECT',
        value: 'ML-KEM handle (see TPM State)',
        description: 'Same ML-KEM key used during the encapsulation step on the sender side.',
      },
      {
        name: 'inEncapsulation.size',
        tpmType: 'UINT16',
        value: `1088 B (ML-KEM-768)`,
        description:
          'Ciphertext length for ML-KEM-768: 1088 bytes (FIPS 203 §7). For ML-KEM-1024: 1568 bytes.',
      },
      {
        name: 'inEncapsulation.buffer',
        tpmType: 'BYTE[]',
        value: 'Real ciphertext from Encapsulate (PQC bridge)',
        description:
          'Ciphertext produced by TPM2_Encapsulate. With the PQC bridge active, the compliance suite captures and reuses the actual ciphertext for a true round-trip validation.',
      },
    ],
    respFields: () => [
      {
        name: 'tag',
        tpmType: 'TPM_ST',
        byteOffset: 0,
        byteSize: 2,
        description: '0x8002',
      },
      {
        name: 'size',
        tpmType: 'UINT32',
        byteOffset: 2,
        byteSize: 4,
        description: 'Total response size',
      },
      {
        name: 'responseCode',
        tpmType: 'TPM_RC',
        byteOffset: 6,
        byteSize: 4,
        description: '0x00000000 = success',
      },
      {
        name: 'outSharedKey.size',
        tpmType: 'UINT16',
        byteOffset: 10,
        byteSize: 2,
        description: 'Size of the recovered shared secret',
      },
      {
        name: 'outSharedKey.buffer',
        tpmType: 'BYTE[]',
        byteOffset: 12,
        byteSize: 0,
        description:
          'The recovered shared secret. Must match the value returned by the corresponding Encapsulate call.',
      },
    ],
  },

  {
    key: 'TPM2_SignDigest',
    cc: 0x000001a6,
    name: 'TPM2_SignDigest',
    section: 'TCG Part 3 §20.1 (V1.85)',
    phase: 'use',
    requiresDsa: true,
    showAlgorithm: false,
    description:
      'Sign a pre-hashed message digest using an ML-DSA key stored in the TPM. The private key never leaves the TPM. With the PQC bridge active, this produces a cryptographically valid 3309-byte ML-DSA-65 signature via SoftHSMv3.',
    why: "Post-quantum attestation and code signing. ML-DSA-65 signatures are lattice-based and resist Shor's algorithm, replacing ECDSA/RSA-PSS for firmware signing, certificate issuance, and platform attestation.",
    params: () => [
      {
        name: 'keyHandle',
        tpmType: 'TPMI_DH_OBJECT',
        value: 'ML-DSA handle (see TPM State)',
        description:
          'Handle returned by TPM2_CreatePrimary with ML-DSA key. Must have the sign attribute set.',
      },
      {
        name: 'digest.size',
        tpmType: 'UINT16',
        value: '0x0020 (32)',
        description: '32 bytes = SHA-256 hash of the message to sign.',
      },
      {
        name: 'digest.buffer',
        tpmType: 'BYTE[]',
        value: '0xBB × 32 (SHA-256 digest)',
        description:
          'In production: SHA-256 hash of the firmware image, certificate, or message to be signed. With the PQC bridge active, this produces a real ML-DSA-65 signature verifiable against the public key.',
      },
    ],
    respFields: () => [
      {
        name: 'tag',
        tpmType: 'TPM_ST',
        byteOffset: 0,
        byteSize: 2,
        description: '0x8002',
      },
      {
        name: 'size',
        tpmType: 'UINT32',
        byteOffset: 2,
        byteSize: 4,
        description: 'Total response size (> 3300 bytes for ML-DSA-65 signature)',
      },
      {
        name: 'responseCode',
        tpmType: 'TPM_RC',
        byteOffset: 6,
        byteSize: 4,
        description: '0x00000000 = signature generated',
      },
      {
        name: 'signature.sigAlg',
        tpmType: 'TPM_ALG_ID',
        byteOffset: 10,
        byteSize: 2,
        description: '0x00A1 = TPM_ALG_MLDSA',
      },
      {
        name: 'signature.parameterSet',
        tpmType: 'UINT16',
        byteOffset: 12,
        byteSize: 2,
        description: '0x0002 = ML-DSA-65',
      },
      {
        name: 'signature.sig.size',
        tpmType: 'UINT16',
        byteOffset: 14,
        byteSize: 2,
        description: 'Signature length in bytes (ML-DSA-65 produces up to 3309 bytes)',
      },
      {
        name: 'signature.sig.buffer',
        tpmType: 'BYTE[]',
        byteOffset: 16,
        byteSize: 0,
        description: 'The ML-DSA-65 signature bytes. Distribute with the message for verification.',
      },
    ],
  },
]

export function getCommandDef(key: string): TpmCommandDef | undefined {
  return COMMAND_DEFS.find((c) => c.key === key)
}
