// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
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

const steps: Step[] = [
  {
    id: 'mnemonic',
    title: '1. Generate Mnemonic',
    description: 'Generate 256-bit entropy using OpenSSL and convert to BIP39 mnemonic.',
    code: `// 1. Generate Entropy (OpenSSL)\n${DIGITAL_ASSETS_CONSTANTS.COMMANDS.COMMON.GEN_ENTROPY}\n\n// 2. Convert to Mnemonic (JS)\nconst mnemonic = bip39.entropyToMnemonic(entropy, wordlist);\nconsole.log(mnemonic);`,
    language: 'javascript',
    actionLabel: 'Generate Mnemonic',
    diagram: <HDWalletFlowDiagram />,
  },
  {
    id: 'seed',
    title: '2. Derive Seed',
    description: 'Convert the mnemonic phrase into a 512-bit binary seed using PBKDF2.',
    code: `// PBKDF2 Derivation (JS)\nconst seed = bip39.mnemonicToSeedSync(mnemonic);\nconsole.log('Seed:', bytesToHex(seed));`,
    language: 'javascript',
    actionLabel: 'Derive Seed',
  },
  {
    id: 'derive',
    title: '3. Derive Addresses',
    description: 'Derive keys and addresses for Bitcoin, Ethereum, and Solana from the seed.',
    code: `// Bitcoin (BIP32)\nconst btcKey = HDKey.fromMasterSeed(seed).derive("${DIGITAL_ASSETS_CONSTANTS.DERIVATION_PATHS.BITCOIN}");\n\n// Ethereum (BIP32)\nconst ethKey = HDKey.fromMasterSeed(seed).derive("${DIGITAL_ASSETS_CONSTANTS.DERIVATION_PATHS.ETHEREUM}");\n\n// Solana (SLIP-0010)\nconst solKey = deriveSLIP0010(seed, "${DIGITAL_ASSETS_CONSTANTS.DERIVATION_PATHS.SOLANA}");`,
    language: 'javascript',
    actionLabel: 'Derive Accounts',
    diagram: <HDWalletFlowDiagram />,
  },
]

interface HDWalletFlowProps {
  onBack: () => void
}

export const HDWalletFlow: React.FC<HDWalletFlowProps> = ({ onBack }) => {
  // State for flow data
  const hsm = useHSM()
  const [mnemonic, setMnemonic] = useState<string>('')
  const [seed, setSeed] = useState<Uint8Array | null>(null)

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
        hsm.addStepLog('Step 3a — Import Seed')
        const seedHandle = hsm_importGenericSecret(M, hSession, seed)
        hsm.addKey({
          handle: seedHandle,
          family: 'sha',
          role: 'secret',
          label: 'BIP39 Master Seed',
          generatedAt: new Date().toISOString(),
        })

        // secp256k1 master — shared by Bitcoin and Ethereum (same curve, same HMAC key)
        hsm.addStepLog('Step 3b — BIP32 Master (secp256k1) → Bitcoin + Ethereum')
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
        hsm.addStepLog('Step 3c — BIP32 Path Derivation → Bitcoin')
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

        const btcPriv = hsm_extractKeyValue(M, hSession, btcLeafHandle)
        const btcPub = secp256k1.getPublicKey(btcPriv, true)
        const btcHash160 = ripemd160(sha256(btcPub))
        const btcAddrWasm = createBase58check(sha256).encode(Uint8Array.from([0x00, ...btcHash160]))
        hsmOutput += `Bitcoin (Legacy P2PKH)\nPath: ${btcPath}\nHandle: ${btcLeafHandle}\nAddress: ${btcAddrWasm}\n\n`

        // ETHEREUM
        hsm.addStepLog('Step 3d — BIP32 Path Derivation → Ethereum')
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

        const ethPriv = hsm_extractKeyValue(M, hSession, ethLeafHandle)
        const ethPubKey = secp256k1.getPublicKey(ethPriv, false).slice(1)
        const ethAddrWasm = toChecksumAddress(bytesToHex(keccak_256(ethPubKey).slice(-20)))
        hsmOutput += `Ethereum\nPath: ${ethPath}\nHandle: ${ethLeafHandle}\nAddress: ${ethAddrWasm}\n\n`

        // SOLANA
        hsm.addStepLog('Step 3e — SLIP-0010 Master (Ed25519) + Path → Solana')
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

        const solPriv = hsm_extractKeyValue(M, hSession, solLeafHandle)
        const solAddrWasm = base58.encode(ed25519.getPublicKey(solPriv))
        hsmOutput += `Solana\nPath: ${solPath}\nHandle: ${solLeafHandle}\nAddress: ${solAddrWasm}`
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

      if (hsmActive) {
        result = {
          'SoftHSM3 (KAT)': hsmOutput,
          'Software Wallet': output,
        }
      } else {
        result = output
      }
    }

    return result
  }

  const wizard = useStepWizard({
    steps,
    onBack,
  })

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
        onNext={wizard.handleNext}
        onBack={wizard.handleBack}
        onComplete={onBack}
      />

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
