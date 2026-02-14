import React, { useState } from 'react'
import type { Step } from '../components/StepWizard'
import { StepWizard } from '../components/StepWizard'
import { openSSLService } from '../../../../../services/crypto/OpenSSLService'
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
import { HDWalletFlowDiagram } from '../components/CryptoFlowDiagram'

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
    title: 'Generate Mnemonic',
    description: 'Generate 256-bit entropy using OpenSSL and convert to BIP39 mnemonic.',
    code: `// 1. Generate Entropy (OpenSSL)\n${DIGITAL_ASSETS_CONSTANTS.COMMANDS.COMMON.GEN_ENTROPY}\n\n// 2. Convert to Mnemonic (JS)\nconst mnemonic = bip39.entropyToMnemonic(entropy, wordlist);\nconsole.log(mnemonic);`,
    language: 'javascript',
    actionLabel: 'Generate Mnemonic',
    diagram: <HDWalletFlowDiagram />,
  },
  {
    id: 'seed',
    title: 'Derive Seed',
    description: 'Convert the mnemonic phrase into a 512-bit binary seed using PBKDF2.',
    code: `// PBKDF2 Derivation (JS)\nconst seed = bip39.mnemonicToSeedSync(mnemonic);\nconsole.log('Seed:', bytesToHex(seed));`,
    language: 'javascript',
    actionLabel: 'Derive Seed',
  },
  {
    id: 'derive',
    title: 'Derive Addresses',
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
  const [mnemonic, setMnemonic] = useState<string>('')
  const [seed, setSeed] = useState<Uint8Array | null>(null)

  const executeStep = async () => {
    const step = steps[wizard.currentStep]
    let result = ''

    if (step.id === 'mnemonic') {
      // Use OpenSSL for entropy
      const res = await openSSLService.execute(DIGITAL_ASSETS_CONSTANTS.COMMANDS.COMMON.GEN_ENTROPY)
      if (res.error) throw new Error(res.error)

      const entropyHex = res.stdout.trim()
      const entropy = hexToBytes(entropyHex)

      // Generate mnemonic from entropy
      const newMnemonic = entropyToMnemonic(entropy, wordlist)
      setMnemonic(newMnemonic)

      result = `Entropy (OpenSSL):\n${entropyHex}\n\nBIP39 Mnemonic (24 words): ${newMnemonic}`
    } else if (step.id === 'seed') {
      if (!mnemonic) throw new Error('Mnemonic not found')

      const newSeed = mnemonicToSeedSync(mnemonic)
      setSeed(newSeed)

      result = `Seed (512-bit hex): ${bytesToHex(newSeed)}\n\nLength: ${newSeed.length} bytes`
    } else if (step.id === 'derive') {
      if (!seed) throw new Error('Seed not found')

      let output = 'Derived Accounts:\n\n'

      // 1. Bitcoin (m/44'/0'/0'/0/0)
      const btcMaster = HDKey.fromMasterSeed(seed)
      const btcPath = DIGITAL_ASSETS_CONSTANTS.DERIVATION_PATHS.BITCOIN
      const btcKey = btcMaster.derive(btcPath)

      // BTC Address
      const btcHash160 = ripemd160(sha256(btcKey.publicKey!))
      const base58check = createBase58check(sha256)
      const btcAddr = base58check.encode(Uint8Array.from([0x00, ...btcHash160]))

      output += `Bitcoin (Legacy P2PKH)\n`
      output += `Path: ${btcPath}\n`
      output += `Address: ${btcAddr}\n\n`

      // 2. Ethereum (m/44'/60'/0'/0/0)
      const ethPath = DIGITAL_ASSETS_CONSTANTS.DERIVATION_PATHS.ETHEREUM
      const ethKey = btcMaster.derive(ethPath)
      const ethPubKey = secp256k1.getPublicKey(ethKey.privateKey!, false).slice(1)
      const ethHash = keccak_256(ethPubKey)
      const ethAddrBytes = ethHash.slice(-20)
      const ethAddrHex = bytesToHex(ethAddrBytes)
      const ethAddr = toChecksumAddress(ethAddrHex)

      output += `Ethereum\n`
      output += `Path: ${ethPath}\n`
      output += `Address: ${ethAddr}\n\n`

      // 3. Solana (m/44'/501'/0'/0') - SLIP-0010
      const solPath = DIGITAL_ASSETS_CONSTANTS.DERIVATION_PATHS.SOLANA
      const solPrivKey = deriveSLIP0010(seed, solPath)
      const solPubKey = ed25519.getPublicKey(solPrivKey)
      const solAddr = base58.encode(solPubKey)

      output += `Solana\n`
      output += `Path: ${solPath}\n`
      output += `Address: ${solAddr}`

      result = output
    }

    return result
  }

  const wizard = useStepWizard({
    steps,
    onBack,
  })

  return (
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
  )
}
