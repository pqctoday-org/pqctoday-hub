// SPDX-License-Identifier: GPL-3.0-only
import React, { useMemo, useState } from 'react'
import type { Step } from '../components/StepWizard'
import { StepWizard } from '../components/StepWizard'
import { openSSLService } from '@/services/crypto/OpenSSLService'
import { entropyToMnemonic, mnemonicToSeedSync } from '@scure/bip39'
import { wordlist } from '@scure/bip39/wordlists/english.js'
import { HDKey } from '@scure/bip32'
import { secp256k1 } from '@noble/curves/secp256k1.js'
import { ed25519 } from '@noble/curves/ed25519.js'
import { sha256, sha512 } from '@noble/hashes/sha2.js'
import { hmac } from '@noble/hashes/hmac.js'
import { ripemd160 } from '@noble/hashes/legacy.js'
import { keccak_256 } from '@noble/hashes/sha3.js'
import { createBase58check, base58 } from '@scure/base'
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js'
import { toChecksumAddress } from './ethereum/utils'
import { useStepWizard } from '../hooks/useStepWizard'
import { DIGITAL_ASSETS_CONSTANTS } from '../constants'
import { HARDENED_DERIVATION } from '../utils/cryptoConstants'

import { LiveHSMToggle } from '@/components/shared/LiveHSMToggle'
import { Pkcs11LogPanel } from '@/components/shared/Pkcs11LogPanel'
import { HsmKeyInspector } from '@/components/shared/HsmKeyInspector'
import { useHSM } from '@/hooks/useHSM'
import {
  hsm_importGenericSecret,
  hsm_extractKeyValue,
  hsm_generateRandom,
  hsm_pbkdf2,
} from '@/wasm/softhsm'
import { hsm_bip32MasterDerive, hsm_bip32ChildDerive } from '@/wasm/softhsm/classical'
import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'
import { HDWalletFlowDiagram } from '../components/CryptoFlowDiagram'
import { AlertTriangle } from 'lucide-react'

function derivePathWasm(
  M: SoftHSMModule,
  hSession: number,
  hMaster: number,
  path: string,
  curve: 'secp256k1' | 'ed25519'
): number {
  const segments = path.split('/').slice(1)
  let currentHandle = hMaster
  for (const s of segments) {
    const hardened = s.endsWith("'")
    const index = parseInt(s.replace("'", ''), 10)
    currentHandle = hsm_bip32ChildDerive(M, hSession, currentHandle, index, hardened, curve, true)
  }
  return currentHandle
}

// SLIP-0010 Ed25519 Derivation (Hardened only)
// https://github.com/satoshilabs/slips/blob/master/slip-0010.md
function deriveSLIP0010(seed: Uint8Array, path: string): Uint8Array {
  // 1. Master Key Generation
  const ED25519_SEED = new TextEncoder().encode('ed25519 seed')
  const I = hmac(sha512, ED25519_SEED, seed)
  let privateKey = I.slice(0, 32)
  let chainCode = I.slice(32)

  // 2. Child Key Derivation
  const segments = path
    .split('/')
    .slice(1)
    .map((s) => {
      const hardened = s.endsWith("'")
      const index = parseInt(s.replace("'", ''), 10)
      return hardened ? index + 0x80000000 : index
    })

  for (const index of segments) {
    if (index < 0x80000000) throw new Error('Ed25519 only supports hardened keys')

    // Data = 0x00 || ser256(kpar) || ser32(i)
    const data = new Uint8Array(1 + 32 + 4)
    data[0] = 0x00
    data.set(privateKey, 1)
    new DataView(data.buffer).setUint32(33, index, false) // Big-endian

    const I = hmac(sha512, chainCode, data)
    privateKey = I.slice(0, 32)
    chainCode = I.slice(32)
  }

  return privateKey
}

// ──────────────────────────────────────────────────────────────────────────────
// Key Derivation Tree — inline visualization after Step 4
// ──────────────────────────────────────────────────────────────────────────────

interface DerivedLeaf {
  chain: 'bitcoin' | 'ethereum' | 'solana'
  path: string
  address: string
}

interface KeyDerivationTreeProps {
  leaves: DerivedLeaf[]
}

const KeyDerivationTree: React.FC<KeyDerivationTreeProps> = ({ leaves }) => {
  if (leaves.length === 0) return null

  const btc = leaves.find((l) => l.chain === 'bitcoin')
  const eth = leaves.find((l) => l.chain === 'ethereum')
  const sol = leaves.find((l) => l.chain === 'solana')

  const addr = (a: string) => `${a.slice(0, 10)}…${a.slice(-8)}`

  return (
    <div className="glass-panel border border-border rounded-xl p-4 mb-4">
      <h3 className="text-sm font-semibold text-foreground mb-3">BIP44 Derivation Tree</h3>
      <pre className="font-mono text-xs leading-relaxed text-muted-foreground overflow-x-auto">
        <span className="text-foreground font-semibold">m</span>
        {' (master — HMAC-SHA512 of seed)\n'}
        {'└── '}
        <span className="text-accent font-semibold">{"m/44'"}</span>
        {' (BIP44 purpose, hardened)\n'}
        {'    ├── '}
        <span className="text-accent">{"m/44'/0'"}</span>
        {' (Bitcoin coin type, hardened)\n'}
        {'    │   └── '}
        <span className="text-accent">{"m/44'/0'/0'"}</span>
        {' (account #0, hardened)\n'}
        {'    │       └── '}
        <span className="text-muted-foreground">{"m/44'/0'/0'/0"}</span>
        {' (external chain)\n'}
        {'    │           └── '}
        <span className="text-primary font-semibold">{"m/44'/0'/0'/0/0"}</span>
        {btc ? (
          <>
            {' → '}
            <span className="text-foreground">{addr(btc.address)}</span>
            {' (P2PKH)\n'}
          </>
        ) : (
          '\n'
        )}
        {'    ├── '}
        <span className="text-accent">{"m/44'/60'"}</span>
        {' (Ethereum coin type, hardened)\n'}
        {'    │   └── '}
        <span className="text-accent">{"m/44'/60'/0'"}</span>
        {' (account #0, hardened)\n'}
        {'    │       └── '}
        <span className="text-muted-foreground">{"m/44'/60'/0'/0"}</span>
        {' (external chain)\n'}
        {'    │           └── '}
        <span className="text-primary font-semibold">{"m/44'/60'/0'/0/0"}</span>
        {eth ? (
          <>
            {' → '}
            <span className="text-foreground">{addr(eth.address)}</span>
            {' (EIP-55)\n'}
          </>
        ) : (
          '\n'
        )}
        {'    └── '}
        <span className="text-accent">{"m/44'/501'"}</span>
        {' (Solana coin type, hardened — SLIP-0010 / Ed25519)\n'}
        {'        └── '}
        <span className="text-accent">{"m/44'/501'/0'"}</span>
        {' (account #0, hardened)\n'}
        {'            └── '}
        <span className="text-primary font-semibold">{"m/44'/501'/0'/0'"}</span>
        {sol ? (
          <>
            {' → '}
            <span className="text-foreground">{addr(sol.address)}</span>
            {' (Base58)\n'}
          </>
        ) : (
          '\n'
        )}
      </pre>
      <p className="text-xs text-muted-foreground mt-2">
        <span className="text-accent font-mono">i'</span> = hardened index (i + 2³¹) — uses parent
        private key in HMAC. <span className="text-muted-foreground font-mono">i</span> =
        non-hardened — uses parent public key.
      </p>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// HDWalletFlow
// ──────────────────────────────────────────────────────────────────────────────

interface HDWalletFlowProps {
  onBack: () => void
}

export const HDWalletFlow: React.FC<HDWalletFlowProps> = ({ onBack }) => {
  const hsm = useHSM()
  const [mnemonic, setMnemonic] = useState<string>('')
  const [seed, setSeed] = useState<Uint8Array | null>(null)
  const [derivedLeaves, setDerivedLeaves] = useState<DerivedLeaf[]>([])

  const steps: Step[] = useMemo(
    () => [
      {
        id: 'mnemonic',
        title: '1. Generate Mnemonic',
        description:
          'Generate 256-bit entropy and convert it to a 24-word BIP39 mnemonic phrase. The mnemonic is the human-readable backup of your wallet — lose it and your funds are gone forever.',
        code: `// 1. Generate Entropy (OpenSSL / SoftHSM3)\n${DIGITAL_ASSETS_CONSTANTS.COMMANDS.COMMON.GEN_ENTROPY}\n\n// 2. Convert to Mnemonic (JS)\nconst mnemonic = bip39.entropyToMnemonic(entropy, wordlist);\nconsole.log(mnemonic);`,
        language: 'javascript',
        actionLabel: 'Generate Mnemonic',
        diagram: <HDWalletFlowDiagram />,
        explanationTable: [
          {
            label: 'Entropy size',
            value: '256 bits (32 bytes)',
            description: 'More entropy → more words (256 bits → 24 words). 128 bits → 12 words.',
          },
          {
            label: 'Entropy source',
            value: 'OpenSSL rand / SoftHSM3 C_GenerateRandom',
            description:
              'Cryptographically secure pseudorandom number generator (CSPRNG). Never use Math.random().',
          },
          {
            label: 'Checksum',
            value: 'SHA-256(entropy)[0:8 bits]',
            description:
              'BIP39 appends 8 bits of SHA-256 checksum to the 256-bit entropy, giving 264 bits → 24 words of 11 bits each.',
          },
          {
            label: 'Wordlist',
            value: '2048 English words',
            description:
              'Each word encodes 11 bits. The wordlist is ordered so the first 4 letters uniquely identify each word.',
          },
          {
            label: 'Output',
            value: '24-word mnemonic phrase',
            description:
              'Example: "abandon abandon … art". Store offline. Never type into any website.',
          },
        ],
      },
      {
        id: 'seed',
        title: '2. Derive Seed (PBKDF2)',
        description:
          'Stretch the mnemonic into a 512-bit binary seed using PBKDF2-HMAC-SHA512. This seed is the root of the entire HD wallet tree.',
        code: `// PBKDF2 Derivation\nconst seed = bip39.mnemonicToSeedSync(mnemonic);\n// PBKDF2-HMAC-SHA512, 2048 iterations, salt = "mnemonic"`,
        language: 'javascript',
        actionLabel: 'Derive Seed',
        explanationTable: [
          {
            label: 'Algorithm',
            value: 'PBKDF2-HMAC-SHA512',
            description:
              'Password-Based Key Derivation Function 2. Iteratively applies HMAC-SHA512 to slow brute-force attacks.',
          },
          {
            label: 'Password',
            value: 'mnemonic phrase (UTF-8)',
            description: 'The 24-word phrase is treated as the password input.',
          },
          {
            label: 'Salt',
            value: '"mnemonic" + optional passphrase',
            description:
              'BIP39 uses the literal string "mnemonic" as salt (concatenated with optional passphrase). This prevents rainbow table attacks.',
          },
          {
            label: 'Iterations',
            value: '2 048',
            description:
              'Each iteration makes brute-force 2048× slower. Low by modern standards but set in the BIP39 spec.',
          },
          {
            label: 'Output',
            value: '512 bits (64 bytes)',
            description:
              'The seed. From this single value the entire tree of keys for Bitcoin, Ethereum, Solana and thousands of other coins is deterministically derived.',
          },
        ],
      },
      {
        id: 'hardened',
        title: '3. Hardened vs Non-Hardened Derivation',
        description: HARDENED_DERIVATION.description,
        code: `// BIP32 child key derivation\n// Hardened (i' = i + 2³¹): uses parent PRIVATE key\nHMAC-SHA512(key=chainCode, data=0x00 || privKey || i+0x80000000)\n// → child private key + child chain code\n\n// Non-Hardened (i): uses parent PUBLIC key\nHMAC-SHA512(key=chainCode, data=pubKey || i)\n// → child private key + child chain code\n// WARNING: If child privKey leaks → parent privKey recoverable!\n\n// Ed25519 (SLIP-0010): HARDENED ONLY\n// Non-hardened derivation is undefined → CKR_MECHANISM_PARAM_INVALID`,
        language: 'javascript',
        actionLabel: 'Demonstrate Derivation',
      },
      {
        id: 'derive',
        title: '4. Derive Wallet Addresses',
        description:
          'Derive keys and addresses for Bitcoin, Ethereum, and Solana from the seed using BIP44 paths. Bitcoin and Ethereum use secp256k1 (BIP32); Solana uses Ed25519 (SLIP-0010, hardened-only).',
        code: `// Bitcoin (BIP32 / secp256k1)\nconst btcKey = HDKey.fromMasterSeed(seed).derive("${DIGITAL_ASSETS_CONSTANTS.DERIVATION_PATHS.BITCOIN}");\n\n// Ethereum (BIP32 / secp256k1, same master)\nconst ethKey = HDKey.fromMasterSeed(seed).derive("${DIGITAL_ASSETS_CONSTANTS.DERIVATION_PATHS.ETHEREUM}");\n\n// Solana (SLIP-0010 / Ed25519, all-hardened)\nconst solKey = deriveSLIP0010(seed, "${DIGITAL_ASSETS_CONSTANTS.DERIVATION_PATHS.SOLANA}");`,
        language: 'javascript',
        actionLabel: 'Derive Accounts',
        diagram:
          derivedLeaves.length > 0 ? (
            <KeyDerivationTree leaves={derivedLeaves} />
          ) : (
            <HDWalletFlowDiagram />
          ),
      },
      {
        id: 'quantum',
        title: '5. Quantum Threat Assessment',
        description:
          "Assess which parts of the HD wallet stack are vulnerable to Shor's algorithm and which symmetric primitives remain quantum-safe.",
        code: '',
        language: 'javascript',
        actionLabel: 'Show Assessment',
        explanationTable: [
          {
            label: 'secp256k1 (BTC / ETH)',
            value: '⚠ QUANTUM VULNERABLE',
            description:
              "Discrete log on elliptic curves is efficiently solved by Shor's algorithm on a CRQC. All Bitcoin and Ethereum public keys exposed on-chain are at risk once Q-Day arrives.",
          },
          {
            label: 'Ed25519 (Solana)',
            value: '⚠ QUANTUM VULNERABLE',
            description:
              "Ed25519 is also based on elliptic curve discrete log and is broken by Shor's algorithm. Solana addresses face the same threat as Bitcoin/Ethereum.",
          },
          {
            label: 'HMAC-SHA512 (BIP32 derivation)',
            value: '✓ Quantum-Safe',
            description:
              "HMAC-SHA512 is a symmetric primitive. Grover's algorithm provides at most a quadratic speedup, reducing effective security from 512 to 256 bits — still adequate.",
          },
          {
            label: 'PBKDF2-HMAC-SHA512 (seed)',
            value: '✓ Quantum-Safe',
            description:
              'Seed derivation is symmetric. Your 24-word mnemonic and the derived 512-bit seed remain safe. The risk is in the asymmetric keys derived FROM the seed.',
          },
          {
            label: 'Migration path',
            value: 'ML-DSA / SLH-DSA',
            description:
              "FIPS 204 (ML-DSA) and FIPS 205 (SLH-DSA) are NIST-standardized post-quantum signature schemes resistant to Shor's algorithm. Both require new address formats at the L1 protocol level.",
          },
          {
            label: 'Bitcoin BIP-360',
            value: 'P2QRH (Pay-to-Quantum-Resistant-Hash)',
            description:
              'Active BIP proposal (2024) introducing a new output type using post-quantum signatures (SPHINCS+/SLH-DSA). Requires a soft-fork.',
          },
          {
            label: 'Ethereum EIP-7932',
            value: 'Account Abstraction + PQC',
            description:
              'EIP-7932 and related ERC-4337 extensions explore replacing ECDSA with ML-DSA or SLH-DSA in smart contract wallets. Native Ethereum accounts still require a hard-fork.',
          },
          {
            label: 'HNDL Threat',
            value: '⚠ Harvest Now, Decrypt Later',
            description:
              'Public keys are permanently recorded on-chain. Adversaries can harvest them today and forge signatures once a CRQC is available. Addresses that have never spent funds (keys not yet revealed) are safer.',
          },
        ],
      },
    ],
    [derivedLeaves]
  )

  const executeStep = async () => {
    const step = steps[wizard.currentStep]
    let result: string | Record<string, string> = ''

    if (step.id === 'mnemonic') {
      const hsmActive = hsm.isReady && hsm.moduleRef.current && hsm.hSessionRef.current
      let entropy
      let entropySource
      if (hsmActive) {
        hsm.addStepLog('Step 1 — Generate Entropy')
        entropy = hsm_generateRandom(hsm.moduleRef.current!, hsm.hSessionRef.current!, 32)
        entropySource = 'SoftHSM3 (C_GenerateRandom)'
      } else {
        const res = await openSSLService.execute(
          DIGITAL_ASSETS_CONSTANTS.COMMANDS.COMMON.GEN_ENTROPY
        )
        if (res.error) throw new Error(res.error)
        entropy = hexToBytes(res.stdout.trim())
        entropySource = 'OpenSSL (rand -hex 32)'
      }

      const entropyHex = bytesToHex(entropy)
      const newMnemonic = entropyToMnemonic(entropy, wordlist)
      setMnemonic(newMnemonic)

      result = `Entropy (${entropySource}):\n${entropyHex}\n\nBIP39 Mnemonic (24 words): ${newMnemonic}`
    } else if (step.id === 'seed') {
      if (!mnemonic) throw new Error('Mnemonic not found')
      const hsmActive = hsm.isReady && hsm.moduleRef.current && hsm.hSessionRef.current

      let newSeed
      let seedSource = 'JS (mnemonicToSeedSync)'
      if (hsmActive) {
        const M = hsm.moduleRef.current!
        const hSession = hsm.hSessionRef.current!
        const passBytes = new TextEncoder().encode(mnemonic)
        const saltBytes = new TextEncoder().encode('mnemonic') // BIP39 base salt

        // PBKDF2-HMAC-SHA512, 2048 iterations, 64 bytes output
        hsm.addStepLog('Step 2 — Derive Seed (PBKDF2-SHA512)')
        newSeed = hsm_pbkdf2(M, hSession, passBytes, saltBytes, 2048, 64)
        seedSource = 'SoftHSM3 (C_DeriveKey PBKDF2-SHA512)'
      } else {
        newSeed = mnemonicToSeedSync(mnemonic)
      }
      setSeed(newSeed)

      result = `Seed (${seedSource}):\n${bytesToHex(newSeed)}\n\nLength: ${newSeed.length} bytes`
    } else if (step.id === 'hardened') {
      if (!seed) throw new Error('Seed not found — complete Step 2 first')

      const hsmActive = hsm.isReady && hsm.moduleRef.current && hsm.hSessionRef.current
      let output = 'Hardened vs Non-Hardened Derivation (secp256k1)\n'
      output += '─'.repeat(50) + '\n\n'

      if (hsmActive) {
        const M = hsm.moduleRef.current!
        const hSession = hsm.hSessionRef.current!

        hsm.addStepLog('Step 3a — Import Seed')
        const seedHandle = hsm_importGenericSecret(M, hSession, seed)

        hsm.addStepLog('Step 3b — secp256k1 Master Key')
        const secpMaster = hsm_bip32MasterDerive(M, hSession, seedHandle, 'secp256k1', true)

        // Hardened child m/0'
        hsm.addStepLog("Step 3c — Hardened child m/0' (secp256k1)")
        const hardenedHandle = hsm_bip32ChildDerive(
          M,
          hSession,
          secpMaster,
          0,
          true,
          'secp256k1',
          true
        )
        const hardenedPriv = hsm_extractKeyValue(M, hSession, hardenedHandle)
        const hardenedPub = secp256k1.getPublicKey(hardenedPriv, true)

        // Non-hardened child m/0
        hsm.addStepLog('Step 3d — Non-hardened child m/0 (secp256k1)')
        const normalHandle = hsm_bip32ChildDerive(
          M,
          hSession,
          secpMaster,
          0,
          false,
          'secp256k1',
          true
        )
        const normalPriv = hsm_extractKeyValue(M, hSession, normalHandle)
        const normalPub = secp256k1.getPublicKey(normalPriv, true)

        output += `secp256k1 m/0' (hardened):\n  Pub: ${bytesToHex(hardenedPub)}\n  Derived using: parent PRIVATE key in HMAC\n\n`
        output += `secp256k1 m/0 (non-hardened):\n  Pub: ${bytesToHex(normalPub)}\n  Derived using: parent PUBLIC key in HMAC\n\n`

        // Ed25519: attempt non-hardened — must fail
        hsm.addStepLog('Step 3e — Ed25519 Master + non-hardened attempt')
        const edMaster = hsm_bip32MasterDerive(M, hSession, seedHandle, 'ed25519', true)
        try {
          hsm_bip32ChildDerive(M, hSession, edMaster, 0, false, 'ed25519', true)
          output += `Ed25519 m/0 (non-hardened): UNEXPECTED SUCCESS — should have failed!\n`
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e)
          output += `Ed25519 m/0 (non-hardened):\n  Error: ${msg}\n  ✓ Expected — SLIP-0010 / Ed25519 requires all indices to be hardened.\n`
        }
      } else {
        // Software path
        const master = HDKey.fromMasterSeed(seed)

        const hardenedKey = master.derive("m/0'")
        const normalKey = master.derive('m/0')

        output += `secp256k1 m/0' (hardened):\n  Pub: ${bytesToHex(hardenedKey.publicKey!)}\n  Derived using: parent PRIVATE key in HMAC\n\n`
        output += `secp256k1 m/0 (non-hardened):\n  Pub: ${bytesToHex(normalKey.publicKey!)}\n  Derived using: parent PUBLIC key in HMAC\n\n`

        // Ed25519: attempt non-hardened derivation via SLIP-0010
        try {
          deriveSLIP0010(seed, 'm/0') // non-hardened → throws
          output += `Ed25519 m/0 (non-hardened): UNEXPECTED SUCCESS — should have failed!\n`
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e)
          output += `Ed25519 m/0 (non-hardened):\n  Error: ${msg}\n  ✓ Expected — SLIP-0010 / Ed25519 requires all indices to be hardened.\n`
        }
      }

      output += '\nKey Insight:\n'
      output +=
        "  • Hardened: compromising m/0' cannot expose siblings or parent — full isolation.\n"
      output +=
        '  • Non-hardened: knowing m/0 privKey + parent chainCode → can compute parent privKey!\n'
      output += '  • BIP44 uses hardened for purpose/coin/account; non-hardened for change/index.\n'
      output += '  • Ed25519 / SLIP-0010 supports hardened derivation ONLY by design.\n'

      result = output
    } else if (step.id === 'derive') {
      if (!seed) throw new Error('Seed not found')

      const hsmActive = hsm.isReady && hsm.moduleRef.current && hsm.hSessionRef.current
      let output = 'Derived Accounts:\n\n'
      let hsmOutput = ''

      if (hsmActive) {
        hsmOutput += 'Hardware Emulation (SoftHSM3):\n\n'
        const M = hsm.moduleRef.current!
        const hSession = hsm.hSessionRef.current!

        // Import seed as generic secret
        hsm.addStepLog('Step 4a — Import Seed')
        const seedHandle = hsm_importGenericSecret(M, hSession, seed)
        hsm.addKey({
          handle: seedHandle,
          family: 'sha',
          role: 'secret',
          label: 'BIP39 Master Seed',
          generatedAt: new Date().toISOString(),
        })

        // secp256k1 master — shared by Bitcoin and Ethereum (same curve, same HMAC key)
        hsm.addStepLog('Step 4b — BIP32 Master (secp256k1) → Bitcoin + Ethereum')
        const secp256k1MasterHandle = hsm_bip32MasterDerive(
          M,
          hSession,
          seedHandle,
          'secp256k1',
          true
        )
        hsm.addKey({
          handle: secp256k1MasterHandle,
          family: 'ecdsa',
          role: 'private',
          label: 'secp256k1 Master (m)',
          generatedAt: new Date().toISOString(),
        })

        // BITCOIN
        hsm.addStepLog('Step 4c — BIP32 Path Derivation → Bitcoin')
        const btcPath = DIGITAL_ASSETS_CONSTANTS.DERIVATION_PATHS.BITCOIN
        const btcLeafHandle = derivePathWasm(
          M,
          hSession,
          secp256k1MasterHandle,
          btcPath,
          'secp256k1'
        )
        hsm.addKey({
          handle: btcLeafHandle,
          family: 'ecdsa',
          role: 'private',
          label: 'BTC Node (m/44/0/0/0/0)',
          generatedAt: new Date().toISOString(),
        })

        hsm.addStepLog(
          'Step 4x: C_GetAttributeValue — extracted BTC private bytes to JS for address derivation'
        )
        const btcPriv = hsm_extractKeyValue(M, hSession, btcLeafHandle)
        const btcPub = secp256k1.getPublicKey(btcPriv, true)
        const btcHash160 = ripemd160(sha256(btcPub))
        const btcAddrWasm = createBase58check(sha256).encode(Uint8Array.from([0x00, ...btcHash160]))
        hsmOutput += `Bitcoin (Legacy P2PKH)\nPath: ${btcPath}\nHandle: ${btcLeafHandle}\nAddress: ${btcAddrWasm}\n\n`

        // ETHEREUM
        hsm.addStepLog('Step 4d — BIP32 Path Derivation → Ethereum')
        const ethPath = DIGITAL_ASSETS_CONSTANTS.DERIVATION_PATHS.ETHEREUM
        const ethLeafHandle = derivePathWasm(
          M,
          hSession,
          secp256k1MasterHandle,
          ethPath,
          'secp256k1'
        )
        hsm.addKey({
          handle: ethLeafHandle,
          family: 'ecdsa',
          role: 'private',
          label: "ETH Node (m/44'/60'/0'/0/0)",
          generatedAt: new Date().toISOString(),
        })

        hsm.addStepLog(
          'Step 4x: C_GetAttributeValue — extracted ETH private bytes to JS for address derivation'
        )
        const ethPriv = hsm_extractKeyValue(M, hSession, ethLeafHandle)
        const ethPubKey = secp256k1.getPublicKey(ethPriv, false).slice(1)
        const ethAddrWasm = toChecksumAddress(bytesToHex(keccak_256(ethPubKey).slice(-20)))
        hsmOutput += `Ethereum\nPath: ${ethPath}\nHandle: ${ethLeafHandle}\nAddress: ${ethAddrWasm}\n\n`

        // SOLANA
        hsm.addStepLog('Step 4e — SLIP-0010 Master (Ed25519) + Path → Solana')
        const solPath = DIGITAL_ASSETS_CONSTANTS.DERIVATION_PATHS.SOLANA
        const solMasterHandle = hsm_bip32MasterDerive(M, hSession, seedHandle, 'ed25519', true)
        hsm.addKey({
          handle: solMasterHandle,
          family: 'eddsa',
          role: 'private',
          label: 'SOL Master (m)',
          generatedAt: new Date().toISOString(),
        })
        const solLeafHandle = derivePathWasm(M, hSession, solMasterHandle, solPath, 'ed25519')
        hsm.addKey({
          handle: solLeafHandle,
          family: 'eddsa',
          role: 'private',
          label: "SOL Node (m/44'/501'/0'/0')",
          generatedAt: new Date().toISOString(),
        })

        hsm.addStepLog(
          'Step 4x: C_GetAttributeValue — extracted SOL private bytes to JS for address derivation'
        )
        const solPriv = hsm_extractKeyValue(M, hSession, solLeafHandle)
        const solAddrWasm = base58.encode(ed25519.getPublicKey(solPriv))
        hsmOutput += `Solana\nPath: ${solPath}\nHandle: ${solLeafHandle}\nAddress: ${solAddrWasm}`

        // Populate the tree
        setDerivedLeaves([
          { chain: 'bitcoin', path: btcPath, address: btcAddrWasm },
          { chain: 'ethereum', path: ethPath, address: ethAddrWasm },
          { chain: 'solana', path: solPath, address: solAddrWasm },
        ])
      }

      // JAVASCRIPT EMULATION
      const btcMaster = HDKey.fromMasterSeed(seed)
      const btcPath = DIGITAL_ASSETS_CONSTANTS.DERIVATION_PATHS.BITCOIN
      const btcKey = btcMaster.derive(btcPath)
      const btcHash160 = ripemd160(sha256(btcKey.publicKey!))
      const btcAddr = createBase58check(sha256).encode(Uint8Array.from([0x00, ...btcHash160]))

      output += `Bitcoin (Legacy P2PKH)\nPath: ${btcPath}\nAddress: ${btcAddr}\n\n`

      const ethPath = DIGITAL_ASSETS_CONSTANTS.DERIVATION_PATHS.ETHEREUM
      const ethKey = btcMaster.derive(ethPath)
      const ethPubKey = secp256k1.getPublicKey(ethKey.privateKey!, false).slice(1)
      const ethAddrHex = bytesToHex(keccak_256(ethPubKey).slice(-20))
      const ethAddr = toChecksumAddress(ethAddrHex)

      output += `Ethereum\nPath: ${ethPath}\nAddress: ${ethAddr}\n\n`

      const solPath = DIGITAL_ASSETS_CONSTANTS.DERIVATION_PATHS.SOLANA
      const solPrivKey = deriveSLIP0010(seed, solPath)
      const solAddr = base58.encode(ed25519.getPublicKey(solPrivKey))

      output += `Solana\nPath: ${solPath}\nAddress: ${solAddr}`

      // Always populate tree (software path)
      if (!hsmActive) {
        setDerivedLeaves([
          { chain: 'bitcoin', path: btcPath, address: btcAddr },
          { chain: 'ethereum', path: ethPath, address: ethAddr },
          { chain: 'solana', path: solPath, address: solAddr },
        ])
      }

      if (hsmActive) {
        result = {
          'SoftHSM3 (KAT)': hsmOutput,
          'Software Wallet': output,
        }
      } else {
        result = output
      }
    } else if (step.id === 'quantum') {
      result =
        'Quantum Threat Summary\n' +
        '─'.repeat(50) +
        '\n\n' +
        '⚠  secp256k1 (Bitcoin, Ethereum) — VULNERABLE\n' +
        "   Shor's algorithm breaks elliptic curve discrete log.\n" +
        '   All on-chain public keys are at risk on Q-Day.\n\n' +
        '⚠  Ed25519 (Solana) — VULNERABLE\n' +
        "   Ed25519 is also an elliptic curve — Shor's applies.\n\n" +
        '✓  HMAC-SHA512 (BIP32 derivation) — Quantum-Safe\n' +
        "   Symmetric primitive. Grover's gives at best 2× speedup.\n\n" +
        '✓  PBKDF2-HMAC-SHA512 (BIP39 seed) — Quantum-Safe\n' +
        '   Your mnemonic and seed are safe; the derived EC keys are not.\n\n' +
        'Migration Path:\n' +
        '  • Bitcoin: BIP-360 (P2QRH) proposes SLH-DSA / SPHINCS+ support.\n' +
        '  • Ethereum: EIP-7932 + ERC-4337 explore ML-DSA in smart contract wallets.\n' +
        '  • Both require protocol-level changes (soft-fork or hard-fork).\n\n' +
        'HNDL Risk (Harvest Now, Decrypt Later):\n' +
        '  • Public keys are permanently on-chain.\n' +
        "  • Addresses that haven't spent (keys unexposed) are safer.\n" +
        '  • Reusing addresses exposes the public key — increases risk.'
    }

    return result
  }

  const wizard = useStepWizard({
    steps,
    onBack,
  })

  const gatedHandleNext = React.useCallback(() => {
    if (!wizard.isStepComplete) {
      wizard.setError(
        `Complete this step first — click "${steps[wizard.currentStep]?.actionLabel ?? 'Execute'}" before advancing.`
      )
      return
    }
    wizard.handleNext()
  }, [wizard, steps])

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-muted/10 mb-6 rounded-t-xl">
        <LiveHSMToggle
          hsm={hsm}
          operations={['C_GenerateRandom', 'C_DeriveKey', 'C_CreateObject']}
        />
      </div>

      <StepWizard
        steps={steps}
        currentStepIndex={wizard.currentStep}
        onExecute={() => wizard.execute(executeStep)}
        output={wizard.output}
        isExecuting={wizard.isExecuting}
        error={wizard.error}
        isStepComplete={wizard.isStepComplete}
        onNext={gatedHandleNext}
        onBack={wizard.handleBack}
        onComplete={onBack}
      />

      {wizard.currentStep === 0 && wizard.isStepComplete && mnemonic && (
        <div className="mt-4 glass-panel p-4 rounded-xl border border-border">
          <p className="text-xs text-muted-foreground mb-2">BIP-39 Mnemonic (24 words):</p>
          <div className="grid grid-cols-4 gap-2">
            {mnemonic.split(' ').map((word, i) => (
              <div key={i} className="flex items-center gap-1.5 rounded bg-muted/40 px-2 py-1">
                <span className="text-[10px] text-muted-foreground font-mono w-4 shrink-0">
                  {i + 1}.
                </span>
                <span className="text-xs font-mono text-foreground font-semibold">{word}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            Word 24 includes checksum bits. Each word encodes 11 bits from the entropy.
          </p>
        </div>
      )}

      {wizard.currentStep === 3 && wizard.isStepComplete && hsm.isReady && (
        <div className="mt-4 flex items-start gap-1.5 rounded border border-warning/20 bg-warning/5 px-3 py-2 text-xs text-muted-foreground">
          <AlertTriangle size={14} className="mt-0.5 shrink-0 text-status-warning" />
          <span>
            <strong>Note:</strong> Private key material was extracted from the HSM into JavaScript
            to derive multi-chain public keys and addresses. In a production HSM, this would not be
            permitted on non-extractable keys.
          </span>
        </div>
      )}

      {derivedLeaves.length > 0 && wizard.currentStep > 3 && (
        <details className="mt-4 glass-panel border border-border p-3 rounded-xl">
          <summary className="text-xs font-medium text-foreground cursor-pointer hover:text-primary transition-colors">
            Show derivation tree from Step 4
          </summary>
          <div className="mt-3">
            <KeyDerivationTree leaves={derivedLeaves} />
          </div>
        </details>
      )}

      {hsm.isReady && (
        <Pkcs11LogPanel
          log={hsm.log}
          onClear={hsm.clearLog}
          title="PKCS#11 Logic traces — HD Wallet"
          emptyMessage="Execute a step to trace cryptographic derivation inside WebAssembly SoftHSM."
          filterFns={['C_GenerateRandom', 'C_DeriveKey', 'C_CreateObject']}
        />
      )}

      {hsm.isReady && (
        <HsmKeyInspector
          keys={hsm.keys}
          moduleRef={hsm.moduleRef}
          hSessionRef={hsm.hSessionRef}
          onRemoveKey={hsm.removeKey}
        />
      )}
    </div>
  )
}
