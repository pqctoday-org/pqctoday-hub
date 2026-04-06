// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useRef } from 'react'
import type { Step } from '../DigitalAssets/components/StepWizard'
import { StepWizard } from '../DigitalAssets/components/StepWizard'
import { useStepWizard } from '../DigitalAssets/hooks/useStepWizard'
import { FIVE_G_CONSTANTS } from './constants'
import { FiveGDiagram } from './components/FiveGDiagram'
import { fiveGService } from './services/FiveGService'
import { Shield, Radio, Info } from 'lucide-react'
import clsx from 'clsx'
import { useHSM } from '@/hooks/useHSM'
import { LiveHSMToggle } from '@/components/shared/LiveHSMToggle'
import { Pkcs11LogPanel } from '@/components/shared/Pkcs11LogPanel'
import { HsmKeyInspector } from '@/components/shared/HsmKeyInspector'
import { KatValidationPanel } from '@/components/shared/KatValidationPanel'
import gsmaVectors from '@/data/kat/gsma_suci_ts33501_annex_c.json'

import type { KatTestSpec } from '@/utils/katRunner'

const FIVEG_KAT_SPECS: KatTestSpec[] = [
  {
    id: '5g-suci-encap',
    useCase: 'SUCI subscriber concealment',
    standard: '3GPP TR 33.841 + FIPS 203',
    referenceUrl: 'https://csrc.nist.gov/pubs/fips/203/final',
    kind: { type: 'mlkem-encap-roundtrip', variant: 768 },
  },
  {
    id: '5g-gnb-decap',
    useCase: 'gNB session key derivation',
    standard: '3GPP TR 33.841 + FIPS 203 ACVP',
    referenceUrl:
      'https://github.com/usnistgov/ACVP-Server/tree/master/gen-val/json-files/ML-KEM-encapDecap-FIPS203',
    kind: { type: 'mlkem-decap', variant: 768 },
  },
  {
    id: '5g-nas-sigver',
    useCase: 'NAS/RRC control plane integrity',
    standard: '3GPP TR 33.841 + FIPS 204 ACVP',
    referenceUrl:
      'https://github.com/usnistgov/ACVP-Server/tree/master/gen-val/json-files/ML-DSA-sigGen-FIPS204',
    kind: { type: 'mldsa-sigver', variant: 65 },
  },
  {
    id: '5g-suci-ecdh',
    useCase: 'SUCI Profile A ECIES key agreement',
    standard: '3GPP TS 33.501 + NIST SP 800-56A',
    referenceUrl: 'https://csrc.nist.gov/pubs/sp/800/56/a/r3/final',
    kind: { type: 'ecdh-derive', curve: 'P-256' },
  },
  {
    id: '5g-nas-hkdf',
    useCase: 'NAS key derivation (HKDF-SHA256)',
    standard: '3GPP TS 33.501 + RFC 5869',
    referenceUrl: 'https://www.rfc-editor.org/rfc/rfc5869',
    kind: { type: 'hkdf-derive' },
  },
]
import {
  hsm_generateECKeyPair,
  hsm_generateAESKey,
  hsm_generateHMACKey,
  hsm_generateMLKEMKeyPair,
  hsm_pqcEncap,
  hsm_pqcDecap,
  hsm_aesEncrypt,
  hsm_hmac,
  hsm_extractKeyValue,
  hsm_extractECPoint,
  hsm_ecdhDerive,
  hsm_hkdf,
  CKM_SHA256,
} from '@/wasm/softhsm'

const SUCI_LIVE_OPERATIONS = [
  'C_GenerateKeyPair',
  'C_GetAttributeValue',
  'C_DeriveKey',
  'C_GenerateKey',
  'C_EncryptInit',
  'C_Encrypt',
  'C_SignInit',
  'C_Sign',
]

interface SuciFlowProps {
  onBack: () => void
  initialProfile?: 'A' | 'B' | 'C'
  initialPqcMode?: 'hybrid' | 'pure'
}

type Profile = 'A' | 'B' | 'C'

interface GsmaProfileB {
  hn_pub_hex: string
  eph_pub_hex: string
  shared_secret_z_hex?: string
  Z_hex?: string
  k_enc_hex?: string
  K_enc_hex?: string
  k_mac_hex?: string
  K_mac_hex?: string
  cipher_msin_hex?: string
  encrypted_msin_hex?: string
  mac_tag_hex?: string
}
function getGsmaVector(profile: 'A' | 'B' | 'C', stepId: string) {
  const vectors = gsmaVectors as { profiles?: { B?: GsmaProfileB } }
  if (profile !== 'B' || !vectors.profiles?.B) return ''
  const b = vectors.profiles.B
  switch (stepId) {
    case 'init_network_key':
      return 'HN Public Key: ' + b.hn_pub_hex
    case 'gen_ephemeral_key':
      return 'Ephemeral Public Key: ' + b.eph_pub_hex
    case 'ecdh':
      return 'Shared Secret (Z): ' + b.shared_secret_z_hex
    case 'kdf':
      return 'K_enc: ' + b.k_enc_hex + '\nK_mac: ' + b.k_mac_hex
    case 'encrypt_msin':
      return 'Ciphertext: ' + b.cipher_msin_hex || b.encrypted_msin_hex // Fixed to use cipher_msin_hex from json
    case 'compute_mac':
      return 'MAC: ' + b.mac_tag_hex
    default:
      return ''
  }
}

export const SuciFlow: React.FC<SuciFlowProps> = ({ onBack, initialProfile, initialPqcMode }) => {
  const [profile, setProfile] = useState<Profile>(initialProfile ?? 'A')
  const [pqcMode, setPqcMode] = useState<'hybrid' | 'pure'>(initialPqcMode ?? 'hybrid')
  const [customSupi, setCustomSupi] = useState('310260123456789')
  const hsm = useHSM()

  // Track HSM key handles and derived key bytes across steps
  const hsmHandlesRef = useRef<{
    ciphertext?: Uint8Array
    hnPubHandle?: number
    hnPrivHandle?: number
    ephPubHandle?: number
    ephPrivHandle?: number
    sharedSecretHandle?: number
    kEncBytes?: Uint8Array
    kMacBytes?: Uint8Array
  }>({})

  // Wrap setters to also clear crypto state when switching profiles/modes
  const changeProfile = (p: Profile) => {
    fiveGService.cleanup()
    setArtifacts({})
    hsmHandlesRef.current = {}
    setProfile(p)
  }
  const changePqcMode = (m: 'hybrid' | 'pure') => {
    fiveGService.cleanup()
    setArtifacts({})
    hsmHandlesRef.current = {}
    setPqcMode(m)
  }

  // Select steps based on profile
  const rawSteps = profile === 'C' ? FIVE_G_CONSTANTS.SUCI_STEPS_C : FIVE_G_CONSTANTS.SUCI_STEPS_A

  // Map to Step interface
  const steps: Step[] = rawSteps.map((step, index) => ({
    id: step.id,
    title: step.title,
    description: step.description,
    code: step.code,
    language: 'bash',
    actionLabel: 'Execute Step',
    explanationTable: step.explanationTable,
    // Pass custom diagram that knows about current step and profile
    diagram: <FiveGDiagram step={index} profile={profile} />,
  }))

  // State to hold generated artifacts (simulated persistence)
  const [artifacts, setArtifacts] = useState<{
    hnPubFile?: string
    hnPrivFile?: string
    ephPrivKey?: string
    ephPubKey?: string
  }>({})

  const buildDualEngineResult = (hsmRes: string, osslRes: string, stepId: string) => {
    const gsmaText = getGsmaVector(profile, stepId)
    let enhancedGsma = gsmaText
    if (gsmaText) {
      const isMatch = hsmRes
        .toLowerCase()
        .includes(gsmaText.split(':')[1]?.trim().toLowerCase() || 'XXXXX')
      enhancedGsma =
        gsmaText +
        '\n\n' +
        (isMatch
          ? '[SUCCESS] SoftHSM3 Output matches GSMA Reference precisely.'
          : '[WARNING] Compare manually vs generator output.')
    }
    const r: Record<string, string> = {
      'SoftHSM3 (KAT)': hsmRes,
      'OpenSSL Engine': osslRes,
    }
    if (enhancedGsma) r['GSMA Vector Validation'] = enhancedGsma
    return r
  }
  const executeStep = async () => {
    const stepData = rawSteps[wizard.currentStep]
    fiveGService.state.supi = customSupi || '310260123456789'
    let result: string | Record<string, string> = ''

    try {
      if (stepData.id === 'init_network_key') {
        const hsmActive = hsm.isReady && hsm.moduleRef.current && hsm.hSessionRef.current
        let hsmResult = ''
        if (hsmActive) {
          if (profile === 'C') {
            const M = hsm.moduleRef.current!
            const hSession = hsm.hSessionRef.current!
            const { pubHandle, privHandle } = hsm_generateMLKEMKeyPair(
              M,
              hSession,
              768,
              false,
              '5G HN Key (ML-KEM)'
            )
            hsmHandlesRef.current.hnPubHandle = pubHandle
            hsmHandlesRef.current.hnPrivHandle = privHandle
            hsm.addKey({
              handle: pubHandle,
              label: 'HN Key (ML-KEM-768)',
              family: 'ml-kem',
              role: 'public',
              generatedAt: new Date().toISOString(),
            })
            hsm.addKey({
              handle: privHandle,
              label: 'HN Key (ML-KEM-768)',
              family: 'ml-kem',
              role: 'private',
              generatedAt: new Date().toISOString(),
            })
            hsmResult = `Public key handle:  ${pubHandle}\nPrivate key handle: ${privHandle}\n\nHome Network key pair generated via SoftHSM3 WASM.\n\nDetailed C-level traces are captured in the PKCS#11 Call Log.`
          } else {
            const M = hsm.moduleRef.current!
            const hSession = hsm.hSessionRef.current!
            const curve = (profile === 'A' ? 'X25519' : 'P-256') as 'X25519' | 'P-256'
            const { pubHandle, privHandle } = hsm_generateECKeyPair(
              M,
              hSession,
              curve,
              false,
              '5G Home Network Key (Telecom)'
            )
            hsmHandlesRef.current.hnPubHandle = pubHandle
            hsmHandlesRef.current.hnPrivHandle = privHandle
            hsm.addKey({
              handle: pubHandle,
              label: `HN Key (${curve})`,
              family: 'ecdsa',
              role: 'public',
              generatedAt: new Date().toISOString(),
            })
            hsm.addKey({
              handle: privHandle,
              label: `HN Key (${curve})`,
              family: 'ecdsa',
              role: 'private',
              generatedAt: new Date().toISOString(),
            })
            hsmResult = `Public key handle:  ${pubHandle}\nPrivate key handle: ${privHandle}\n\nHome Network key pair generated via SoftHSM3 WASM.\n\nDetailed C-level traces are captured in the PKCS#11 Call Log.`
          }
        }

        const res = await fiveGService.generateNetworkKey(profile, pqcMode)
        setArtifacts((prev) => ({
          ...prev,
          hnPubFile: res.pubKeyFile,
          hnPrivFile: res.privKeyFile,
        }))

        if (hsmActive) {
          result = buildDualEngineResult(hsmResult, res.output, stepData.id)
        } else {
          result = res.output
        }
      } else if (stepData.id === 'encrypt_msin') {
        const hsmActive = hsm.isReady && hsm.moduleRef.current && hsm.hSessionRef.current
        let hsmResult = ''
        if (hsmActive) {
          const M = hsm.moduleRef.current!
          const hSession = hsm.hSessionRef.current!
          const aesHandle = hsm_generateAESKey(
            M,
            hSession,
            profile === 'C' ? 256 : 128,
            true,
            false,
            false,
            false,
            false,
            false,
            '5G MSIN Encryption Key'
          )
          hsm.addKey({
            handle: aesHandle,
            label: `MSIN Enc Key (AES-${profile === 'C' ? 256 : 128})`,
            family: 'aes',
            role: 'secret',
            purpose: 'application',
            generatedAt: new Date().toISOString(),
          })
          const supiStr = customSupi || '310260123456789'
          const msinString = supiStr.length > 6 ? supiStr.slice(6) : supiStr
          const msin = new TextEncoder().encode(msinString)
          // CTR not yet in hsm_aesEncrypt; GCM is the closest (stream, no padding)
          const ct = hsm_aesEncrypt(M, hSession, aesHandle, msin, 'gcm')
          // Store ciphertext + IV concatenated so sidf_decryption can round-trip
          const combined = new Uint8Array(ct.iv.length + ct.ciphertext.length)
          combined.set(ct.iv, 0)
          combined.set(ct.ciphertext, ct.iv.length)
          hsmHandlesRef.current.ciphertext = combined
          const ctHex = Array.from(ct.ciphertext)
            .map((b: number) => b.toString(16).padStart(2, '0'))
            .join('')
          hsmResult = `MSIN plaintext:  ${msinString}\nCiphertext (hex): ${ctHex}\n\nMSIN encrypted via SoftHSM3 WASM (AES-GCM; CTR not yet in bridge). (Completed)\n\nDetailed C-level traces are captured in the PKCS#11 Call Log.`
        }

        const osslResult = await fiveGService.encryptMSIN()

        if (hsmActive) {
          result = buildDualEngineResult(hsmResult, osslResult, stepData.id)
        } else {
          result = osslResult
        }
      } else if (stepData.id === 'compute_mac') {
        const hsmActive = hsm.isReady && hsm.moduleRef.current && hsm.hSessionRef.current
        let hsmResult = ''
        if (hsmActive) {
          const M = hsm.moduleRef.current!
          const hSession = hsm.hSessionRef.current!
          const hmacHandle = hsm_generateHMACKey(M, hSession, 32)
          hsm.addKey({
            handle: hmacHandle,
            label: 'MAC Key (HMAC-SHA256)',
            family: 'hmac',
            role: 'secret',
            purpose: 'application',
            generatedAt: new Date().toISOString(),
          })
          const data = new TextEncoder().encode('suci-mac-input-data')
          const mac = hsm_hmac(M, hSession, hmacHandle, data)
          const macHex = Array.from(mac)
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('')
          hsmResult = `MAC tag (hex): ${macHex}\n\nMAC computed via SoftHSM3 WASM. (Completed)\n\nDetailed C-level traces are captured in the PKCS#11 Call Log.`
        }

        const osslResult = await fiveGService.computeMAC()

        if (hsmActive) {
          result = buildDualEngineResult(hsmResult, osslResult, stepData.id)
        } else {
          result = osslResult
        }
      } else if (stepData.id === 'provision_usim') {
        const hsmActive =
          hsm.isReady &&
          hsm.moduleRef.current &&
          hsm.hSessionRef.current &&
          hsmHandlesRef.current.hnPubHandle
        let hsmResult = ''
        if (hsmActive) {
          const curve = profile === 'A' ? 'X25519' : profile === 'B' ? 'P-256' : 'ML-KEM-768'
          hsmResult = `HN Public Key Handle:  ${hsmHandlesRef.current.hnPubHandle}\nHN Private Key Handle: ${hsmHandlesRef.current.hnPrivHandle}\nKey type: ${curve}\n\nHome Network public key provisioned to USIM via PKCS#11 handle.\nKey available for ECDH/KEM operations in subsequent steps.`
        }

        const targetFile = artifacts.hnPubFile || 'sim_hn_pub.key'
        const osslResult = await fiveGService.provisionUSIM(targetFile)

        if (hsmActive) {
          result = buildDualEngineResult(hsmResult, osslResult, stepData.id)
        } else {
          result = osslResult
        }
      } else if (stepData.id === 'retrieve_key') {
        const hsmActive =
          hsm.isReady &&
          hsm.moduleRef.current &&
          hsm.hSessionRef.current &&
          hsmHandlesRef.current.hnPubHandle
        let hsmResult = ''
        if (hsmActive) {
          const curve = profile === 'A' ? 'X25519' : profile === 'B' ? 'P-256' : 'ML-KEM-768'
          hsmResult = `HN Public Key Handle: ${hsmHandlesRef.current.hnPubHandle}\nKey type: ${curve}\n\nUE retrieved HN public key from USIM (HSM-backed). Key ready for ${profile === 'C' ? 'ML-KEM encapsulation' : 'ECDH key agreement'}. (Completed)`
        }

        const targetFile = artifacts.hnPubFile || 'sim_hn_pub.key'
        const osslResult = await fiveGService.retrieveKey(targetFile, profile)

        if (hsmActive) {
          result = buildDualEngineResult(hsmResult, osslResult, stepData.id)
        } else {
          result = osslResult
        }
      } else if (stepData.id === 'gen_ephemeral_key') {
        const hsmActive = hsm.isReady && hsm.moduleRef.current && hsm.hSessionRef.current
        let hsmResult = ''
        if (hsmActive && profile === 'C' && pqcMode === 'pure') {
          hsmResult =
            'In Pure ML-KEM mode, ephemeral keys are generated dynamically during encapsulation.\n\n(Skipped)'
        } else if (hsmActive) {
          const M = hsm.moduleRef.current!
          const hSession = hsm.hSessionRef.current!
          const curve = (profile === 'A' ? 'X25519' : 'P-256') as 'X25519' | 'P-256'
          const { pubHandle, privHandle } = hsm_generateECKeyPair(
            M,
            hSession,
            curve,
            false,
            '5G UE Ephemeral Key'
          )
          hsmHandlesRef.current.ephPubHandle = pubHandle
          hsmHandlesRef.current.ephPrivHandle = privHandle
          hsm.addKey({
            handle: pubHandle,
            label: `Eph Key (${curve})`,
            family: 'ecdh',
            role: 'public',
            purpose: 'tls',
            generatedAt: new Date().toISOString(),
          })
          hsm.addKey({
            handle: privHandle,
            label: `Eph Key (${curve})`,
            family: 'ecdh',
            role: 'private',
            purpose: 'tls',
            generatedAt: new Date().toISOString(),
          })
          hsmResult = `→ Ephemeral pub handle:  ${pubHandle}\n→ Ephemeral priv handle: ${privHandle}\nKey type: ${curve}\n\nEphemeral key pair generated via SoftHSM3 WASM.\nKey handles ready for ECDH in next step.\n\nDetailed C-level traces are captured in the PKCS#11 Call Log.`
        }

        const res = await fiveGService.generateEphemeralKey(profile, pqcMode)
        setArtifacts((prev) => ({
          ...prev,
          ephPrivKey: res.privKey,
          ephPubKey: res.pubKey,
        }))

        if (hsmActive) {
          result = buildDualEngineResult(hsmResult, res.output, stepData.id)
        } else {
          result = res.output
        }
      } else if (stepData.id === 'compute_shared_secret') {
        const hsmActive =
          hsm.isReady &&
          hsm.moduleRef.current &&
          hsm.hSessionRef.current &&
          hsmHandlesRef.current.hnPubHandle
        let hsmResult = ''
        if (hsmActive) {
          const M = hsm.moduleRef.current!
          const hSession = hsm.hSessionRef.current!
          if (profile === 'C') {
            const { ciphertextBytes, secretHandle } = hsm_pqcEncap(
              M,
              hSession,
              hsmHandlesRef.current.hnPubHandle!,
              'ML-KEM-768'
            )
            hsmHandlesRef.current.sharedSecretHandle = secretHandle
            hsmHandlesRef.current.ciphertext = ciphertextBytes
            hsm.addKey({
              handle: secretHandle,
              label: 'Shared Secret (Z)',
              family: 'aes',
              role: 'secret',
              purpose: 'application',
              generatedAt: new Date().toISOString(),
            })
            const sharedBytes = hsm_extractKeyValue(M, hSession, secretHandle)
            const sharedHex = Array.from(sharedBytes)
              .map((b) => b.toString(16).padStart(2, '0'))
              .join('')
            hsmResult = `hnPub handle: ${hsmHandlesRef.current.hnPubHandle}\n→ Ciphertext length: ${ciphertextBytes.length} bytes\n→ Shared secret handle: ${secretHandle}\n→ Z (hex): ${sharedHex.slice(0, 64)}...\n\nML-KEM Encapsulation executed via SoftHSM3 WASM. (Encapsulated)`
          } else {
            const M = hsm.moduleRef.current!
            const hSession = hsm.hSessionRef.current!
            const hnPubBytes = hsm_extractECPoint(M, hSession, hsmHandlesRef.current.hnPubHandle!)
            const derivedHandle = hsm_ecdhDerive(
              M,
              hSession,
              hsmHandlesRef.current.ephPrivHandle!,
              hnPubBytes,
              undefined,
              undefined,
              { keyLen: 32, derive: true, extractable: true }
            )
            hsmHandlesRef.current.sharedSecretHandle = derivedHandle
            hsm.addKey({
              handle: derivedHandle,
              label: 'Shared Secret (Z)',
              family: 'aes',
              role: 'secret',
              purpose: 'application',
              generatedAt: new Date().toISOString(),
            })
            const sharedBytes = hsm_extractKeyValue(M, hSession, derivedHandle)
            const sharedHex = Array.from(sharedBytes)
              .map((b: number) => b.toString(16).padStart(2, '0'))
              .join('')
            hsmResult = `ephPriv handle: ${hsmHandlesRef.current.ephPrivHandle}\nhnPub bytes: ${hnPubBytes.length}\n→ Shared secret handle: ${derivedHandle}\n→ Z (hex): ${sharedHex.slice(0, 64)}...\n\nECDH shared secret computed via SoftHSM3 WASM. (Derived)`
          }
        }

        const ephPriv = artifacts.ephPrivKey || 'sim_eph_priv.key'
        const hnPub = artifacts.hnPubFile || 'sim_hn_pub.key'
        const osslResult = await fiveGService.computeSharedSecret(profile, ephPriv, hnPub, pqcMode)

        if (hsmActive) {
          result = buildDualEngineResult(hsmResult, osslResult, stepData.id)
        } else {
          result = osslResult
        }
      } else if (stepData.id === 'derive_keys') {
        const hsmActive =
          hsm.isReady &&
          hsm.moduleRef.current &&
          hsm.hSessionRef.current &&
          hsmHandlesRef.current.sharedSecretHandle
        let hsmResult = ''
        if (hsmActive) {
          const M = hsm.moduleRef.current!
          const hSession = hsm.hSessionRef.current!
          const salt = new TextEncoder().encode('5G-SUCI-KDF-salt')
          const infoEnc = new TextEncoder().encode('encryption-key')
          const infoMac = new TextEncoder().encode('mac-key')
          const kEnc = hsm_hkdf(
            M,
            hSession,
            hsmHandlesRef.current.sharedSecretHandle!,
            CKM_SHA256,
            true,
            true,
            salt,
            infoEnc,
            16
          )
          const kMac = hsm_hkdf(
            M,
            hSession,
            hsmHandlesRef.current.sharedSecretHandle!,
            CKM_SHA256,
            true,
            true,
            salt,
            infoMac,
            32
          )
          const kEncHex = Array.from(kEnc)
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('')
          const kMacHex = Array.from(kMac)
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('')
          hsmResult = `Base key handle: ${hsmHandlesRef.current.sharedSecretHandle}\n→ K_enc (${kEnc.length} bytes): ${kEncHex}\n→ K_mac (${kMac.length} bytes): ${kMacHex}\n\nEncryption + MAC keys derived via SoftHSM3 WASM. (Derived)`
        }

        const osslResult = await fiveGService.deriveKeys(profile)

        if (hsmActive) {
          result = buildDualEngineResult(hsmResult, osslResult, stepData.id)
        } else {
          result = osslResult
        }
      } else if (stepData.id === 'sidf_decryption') {
        const hsmActive =
          hsm.isReady &&
          hsm.moduleRef.current &&
          hsm.hSessionRef.current &&
          hsmHandlesRef.current.hnPrivHandle
        let hsmResult = ''
        if (hsmActive && profile === 'C' && hsmHandlesRef.current.ciphertext) {
          const M = hsm.moduleRef.current!
          const hSession = hsm.hSessionRef.current!
          const secretHandle = hsm_pqcDecap(
            M,
            hSession,
            hsmHandlesRef.current.hnPrivHandle!,
            hsmHandlesRef.current.ciphertext!,
            'ML-KEM-768'
          )
          hsm.addKey({
            handle: secretHandle,
            label: 'Decapsulated Z',
            family: 'aes',
            role: 'secret',
            purpose: 'application',
            generatedAt: new Date().toISOString(),
          })
          const sharedBytes = hsm_extractKeyValue(M, hSession, secretHandle)
          const sharedHex = Array.from(sharedBytes)
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('')
          hsmResult = `Ciphertext length: ${hsmHandlesRef.current.ciphertext.length} bytes\n→ Decapsulated Secret Handle: ${secretHandle}\n→ Z (hex): ${sharedHex.slice(0, 64)}...\n\nML-KEM Decapsulation executed via SoftHSM3 WASM.`
        } else if (hsmActive && hsmHandlesRef.current.ephPubHandle) {
          const M = hsm.moduleRef.current!
          const hSession = hsm.hSessionRef.current!
          // SIDF uses the HN private key + UE ephemeral public key to re-derive Z
          const ephPubBytes = hsm_extractECPoint(M, hSession, hsmHandlesRef.current.ephPubHandle!)
          const sidfSecretHandle = hsm_ecdhDerive(
            M,
            hSession,
            hsmHandlesRef.current.hnPrivHandle!,
            ephPubBytes,
            undefined,
            undefined,
            { keyLen: 32, derive: true, extractable: true }
          )
          hsm.addKey({
            handle: sidfSecretHandle,
            label: 'SIDF Z (ECDH)',
            family: 'aes',
            role: 'secret',
            purpose: 'application',
            generatedAt: new Date().toISOString(),
          })
          const sidfSecretBytes = hsm_extractKeyValue(M, hSession, sidfSecretHandle)
          const sidfSecretHex = Array.from(sidfSecretBytes)
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('')
          // Re-derive K_enc from shared secret (mirrors derive_keys step)
          const salt = new TextEncoder().encode('5G-SUCI-KDF-salt')
          const infoEnc = new TextEncoder().encode('encryption-key')
          const kEncSidf = hsm_hkdf(
            M,
            hSession,
            sidfSecretHandle,
            CKM_SHA256,
            true,
            true,
            salt,
            infoEnc,
            16
          )
          const kEncHex = Array.from(kEncSidf)
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('')
          hsmResult = `hnPriv handle: ${hsmHandlesRef.current.hnPrivHandle}\nephPub bytes: ${ephPubBytes.length}\n→ SIDF Shared Secret Handle: ${sidfSecretHandle}\n→ Z (hex): ${sidfSecretHex.slice(0, 64)}...\n→ K_enc re-derived (hex): ${kEncHex}\n\nSIDF ECDH executed via SoftHSM3 WASM.\nMSIN would be decrypted with K_enc above.\n\nDetailed C-level traces are captured in the PKCS#11 Call Log.`
        }

        const osslResult = await fiveGService.sidfDecrypt(profile)
        if (hsmActive) {
          result = buildDualEngineResult(hsmResult, osslResult, stepData.id)
        } else {
          result = osslResult
        }
      } else if (stepData.id === 'visualize_suci') {
        result = await fiveGService.visualizeStructure()
      } else if (stepData.id === 'assemble_suci') {
        result = await fiveGService.assembleSUCI(profile)
      } else {
        await new Promise((resolve) => setTimeout(resolve, 600))
        result = stepData.output
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      throw new Error(msg || 'Execution Failed')
    }

    return result
  }

  const wizard = useStepWizard({
    steps,
    onBack,
  })

  return (
    <div className="space-y-6">
      <div className="bg-muted/50 p-4 rounded-lg border border-border">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-bold text-foreground">
            Subscriber Permanent Identifier (SUPI)
          </span>
          <span className="text-xs text-muted-foreground">
            Adjust the 15-digit IMSI below to verify dynamic cryptography execution.
          </span>
          <input
            type="text"
            value={customSupi}
            onChange={(e) => {
              setCustomSupi(e.target.value.replace(/\D/g, '').slice(0, 15))
            }}
            className="bg-background border border-border rounded p-2 text-sm font-mono mt-1 focus:outline-none focus:border-primary max-w-sm"
            placeholder="310260123456789"
          />
        </label>
      </div>

      {/* Profile Selector */}
      <div className="bg-muted/50 p-4 rounded-lg border border-border">
        <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground uppercase tracking-wider font-bold">
          <Shield size={14} />
          Select Protection Scheme
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <button
            data-testid="profile-a-btn"
            onClick={() => changeProfile('A')}
            className={clsx(
              'flex-1 p-3 rounded border text-left transition-all hover:bg-muted',
              profile === 'A'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground'
            )}
          >
            <div className="font-bold flex items-center gap-2">
              <Radio size={16} className={profile === 'A' ? 'fill-primary' : ''} />
              Profile A
            </div>
            <div className="text-xs opacity-70 mt-1">Curve25519 (X25519) + AES-128</div>
          </button>

          <button
            data-testid="profile-b-btn"
            onClick={() => changeProfile('B')}
            className={clsx(
              'flex-1 p-3 rounded border text-left transition-all hover:bg-muted',
              profile === 'B'
                ? 'border-secondary bg-secondary/10 text-secondary'
                : 'border-border text-muted-foreground'
            )}
          >
            <div className="font-bold flex items-center gap-2">
              <Radio size={16} className={profile === 'B' ? 'fill-secondary' : ''} />
              Profile B
            </div>
            <div className="text-xs opacity-70 mt-1">NIST P-256 + AES-128</div>
          </button>

          <button
            data-testid="profile-c-btn"
            onClick={() => changeProfile('C')}
            className={clsx(
              'flex-1 p-3 rounded border text-left transition-all hover:bg-muted',
              profile === 'C'
                ? 'border-tertiary bg-tertiary/10 text-tertiary'
                : 'border-border text-muted-foreground'
            )}
          >
            <div className="font-bold flex items-center gap-2">
              <Radio size={16} className={profile === 'C' ? 'fill-tertiary' : ''} />
              Profile C (PQC)
            </div>
            <div className="text-xs opacity-70 mt-1">ML-KEM (Kyber) + AES-256</div>
            <div className="text-xs italic text-muted-foreground mt-1">
              Under 3GPP SA3 study (TR 33.841) — Not yet standardized
            </div>
          </button>
        </div>
      </div>

      {/* Profile C Mode Selector */}
      {profile === 'C' && (
        <div className="bg-tertiary/5 p-4 rounded-lg border border-tertiary/20 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 mb-1 text-sm text-tertiary uppercase tracking-wider font-bold">
            <Shield size={14} />
            PQC Mode Configuration
          </div>
          <p className="text-xs italic text-muted-foreground mb-3">
            Educational preview of proposed Profile C
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => changePqcMode('hybrid')}
              className={clsx(
                'flex-1 p-3 rounded border text-left transition-all',
                pqcMode === 'hybrid'
                  ? 'border-tertiary bg-tertiary/20 text-tertiary-foreground'
                  : 'border-border text-muted-foreground hover:bg-muted'
              )}
            >
              <div className="font-bold">Hybrid (Transition)</div>
              <div className="text-xs opacity-70">X25519 + ML-KEM-768</div>
            </button>
            <button
              onClick={() => changePqcMode('pure')}
              className={clsx(
                'flex-1 p-3 rounded border text-left transition-all',
                pqcMode === 'pure'
                  ? 'border-tertiary bg-tertiary/20 text-tertiary-foreground'
                  : 'border-border text-muted-foreground hover:bg-muted'
              )}
            >
              <div className="font-bold">Pure PQC (Target)</div>
              <div className="text-xs opacity-70">ML-KEM-768 Only</div>
            </button>
          </div>
        </div>
      )}

      <LiveHSMToggle hsm={hsm} operations={SUCI_LIVE_OPERATIONS} />

      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-muted/40 text-xs text-muted-foreground">
        <Info size={13} className="shrink-0" />
        <span>
          All keys and identifiers generated here are for <strong>educational use only</strong> —
          not for production systems.
        </span>
      </div>

      <StepWizard
        key={`${profile}-${pqcMode}`} // Force re-mount on profile or mode change
        steps={steps}
        currentStepIndex={wizard.currentStep}
        onExecute={() => wizard.execute(executeStep)}
        output={wizard.output}
        isExecuting={wizard.isExecuting}
        error={wizard.error}
        isStepComplete={wizard.isStepComplete}
        onNext={wizard.handleNext}
        onBack={wizard.handleBack}
        onComplete={() => {
          if (profile === 'A') {
            changeProfile('B')
          } else if (profile === 'B') {
            changeProfile('C')
            changePqcMode('hybrid')
          } else if (profile === 'C' && pqcMode === 'hybrid') {
            changePqcMode('pure')
          } else {
            onBack()
          }
        }}
        completeLabel={
          profile === 'A'
            ? 'Proceed to Profile B (P-256)'
            : profile === 'B'
              ? 'Proceed to Hybrid (PQC + ECC)'
              : profile === 'C' && pqcMode === 'hybrid'
                ? 'Proceed to Pure PQC Target'
                : 'Finish & View Dashboard'
        }
      />

      <KatValidationPanel
        specs={FIVEG_KAT_SPECS}
        label="5G PQC Known Answer Tests"
        authorityNote="3GPP TR 33.841 · NIST FIPS 203/204"
      />

      {hsm.isReady && (
        <div className="space-y-4">
          <Pkcs11LogPanel
            log={hsm.log}
            onClear={hsm.clearLog}
            title="PKCS#11 Call Log — SUCI Construction"
            emptyMessage="Execute a step to see live PKCS#11 operations."
            filterFns={SUCI_LIVE_OPERATIONS}
          />
          {hsm.keys.length > 0 && (
            <HsmKeyInspector
              keys={hsm.keys}
              moduleRef={hsm.moduleRef}
              hSessionRef={hsm.hSessionRef}
              onRemoveKey={hsm.removeKey}
            />
          )}
        </div>
      )}
    </div>
  )
}
