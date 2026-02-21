export interface ArchitectureLayer {
  id: string
  label: string
  description: string
}

export interface AbstractionBackend {
  id: string
  label: string
  algorithm: string
  type: 'classical' | 'pqc' | 'hybrid'
  config: string
  keySize: string
  quantumSafe: boolean
}

export const ABSTRACTION_LAYERS: ArchitectureLayer[] = [
  {
    id: 'application',
    label: 'Application Code',
    description: 'Business logic calls a generic crypto API. No algorithm-specific code.',
  },
  {
    id: 'crypto-api',
    label: 'Crypto Abstraction API',
    description:
      'Unified interface: encrypt(), sign(), verify(), keyExchange(). Algorithm-agnostic.',
  },
  {
    id: 'provider',
    label: 'Provider / Backend',
    description: 'Configurable backend selects the actual algorithm. Changed via config, not code.',
  },
  {
    id: 'algorithm',
    label: 'Algorithm Implementation',
    description: 'The actual cryptographic primitive: RSA, ML-KEM, X25519MLKEM768, etc.',
  },
]

export const ABSTRACTION_BACKENDS: AbstractionBackend[] = [
  {
    id: 'rsa',
    label: 'RSA-2048',
    algorithm: 'RSA-2048',
    type: 'classical',
    config: 'provider: "openssl"\nalgorithm: "RSA-2048"\nmode: "OAEP-SHA256"',
    keySize: '256 bytes public key',
    quantumSafe: false,
  },
  {
    id: 'mlkem',
    label: 'ML-KEM-768',
    algorithm: 'ML-KEM-768',
    type: 'pqc',
    config: 'provider: "openssl"\nalgorithm: "ML-KEM-768"\nmode: "KEM"',
    keySize: '1,184 bytes public key',
    quantumSafe: true,
  },
  {
    id: 'hybrid',
    label: 'X25519MLKEM768',
    algorithm: 'X25519MLKEM768',
    type: 'hybrid',
    config: 'provider: "openssl"\nalgorithm: "X25519MLKEM768"\nmode: "hybrid-KEM"',
    keySize: '1,216 bytes public key',
    quantumSafe: true,
  },
]

export const APP_CODE_SAMPLE = `// Application code — UNCHANGED across all backends
import { cryptoService } from './crypto'

async function establishSession(peerPublicKey: Uint8Array) {
  // This call works identically whether the backend
  // is RSA-2048, ML-KEM-768, or X25519MLKEM768
  const { sharedSecret, ciphertext } =
    await cryptoService.keyExchange(peerPublicKey)

  const sessionKey = await cryptoService.deriveKey(
    sharedSecret,
    'session-v1'
  )

  return sessionKey
}`

export const ANTI_PATTERNS = [
  {
    id: 'hardcoded',
    label: 'Hardcoded Algorithms',
    description:
      'Algorithm names embedded in application code. Changing requires code changes, testing, and redeployment.',
    example: "import { rsaEncrypt } from 'crypto'\nrsaEncrypt(data, key, 'RSA-OAEP')",
    severity: 'critical' as const,
  },
  {
    id: 'no-inventory',
    label: 'No Cryptographic Inventory',
    description:
      "Organization doesn't know which algorithms are used where. Discovery becomes a project itself.",
    example: '// Which of our 200 services use RSA?\n// Nobody knows...',
    severity: 'critical' as const,
  },
  {
    id: 'single-provider',
    label: 'Single Provider Lock-in',
    description:
      "Entire crypto stack depends on one library. If it doesn't support PQC, migration is blocked.",
    example:
      "// Every service imports directly\nimport { encrypt } from 'legacy-crypto-lib'\n// Library abandoned, no PQC support",
    severity: 'warning' as const,
  },
]
