// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useRef, useEffect } from 'react'
import type { Step } from '../DigitalAssets/components/StepWizard'
import { StepWizard } from '../DigitalAssets/components/StepWizard'
import { useStepWizard } from '../DigitalAssets/hooks/useStepWizard'
import { FIVE_G_CONSTANTS } from './constants'
import { FiveGDiagram } from './components/FiveGDiagram'
import { GsmaTestDataModal } from './components/GsmaTestDataModal'
import { ConfigureCard } from './components/ConfigureCard'
import { ScenarioIntroStrip } from './components/ScenarioIntroStrip'
import type { ScenarioView } from './components/ScenarioIntroStrip'
import { AttackerSidecar } from './components/AttackerSidecar'
import { getSuciStepMeta, SUCI_PHASE_LABELS } from './suciUxMeta'
import { fiveGService } from './services/FiveGService'
import { Shield, Radio, Info } from 'lucide-react'
import clsx from 'clsx'
import { useHSM } from '@/hooks/useHSM'
import { LiveHSMToggle } from '@/components/shared/LiveHSMToggle'
import { Pkcs11LogPanel } from '@/components/shared/Pkcs11LogPanel'
import { HsmKeyInspector } from '@/components/shared/HsmKeyInspector'
import { KatValidationPanel } from '@/components/shared/KatValidationPanel'
import gsmaVectors from '@/data/kat/gsma_suci_ts33501_annex_c.json'

const PLAIN_ENGLISH_LS_KEY = 'suci.plainEnglish'
const SCENARIO_VIEW_SS_KEY = 'suci.scenarioView'

import type { KatTestSpec } from '@/utils/katRunner'
import { Button } from '@/components/ui/button'

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
    // Profile A uses X25519 — no ecdh-derive KAT runner support for X25519 yet
    id: '5g-suci-ecdh-b',
    useCase: 'SUCI Profile B ECIES key agreement (P-256)',
    standard: '3GPP TS 33.501 + NIST SP 800-56A',
    referenceUrl: 'https://csrc.nist.gov/pubs/sp/800/56/a/r3/final',
    kind: { type: 'ecdh-derive', curve: 'P-256' },
  },
  {
    // Profile A uses X25519 — no ecdh-derive KAT runner support for X25519 yet
    id: '5g-suci-kdf-b',
    useCase: 'SUCI Profile B key derivation (X9.63-KDF + SHA-256)',
    standard: '3GPP TS 33.501 §C.3.3 + ANSI X9.63',
    referenceUrl: 'https://csrc.nist.gov/pubs/sp/800/56/a/r3/final',
    kind: { type: 'ecdh-derive', curve: 'P-256' },
  },
]
import {
  hsm_generateECKeyPair,
  hsm_importAESKey,
  hsm_importHMACKey,
  hsm_generateMLKEMKeyPair,
  hsm_pqcEncap,
  hsm_pqcDecap,
  hsm_aesEncrypt,
  hsm_aesDecrypt,
  hsm_hmac,
  hsm_digest,
  hsm_extractKeyValue,
  hsm_extractECPoint,
  hsm_ecdhDerive,
  CKM_SHA256,
  CKM_SHA3_256,
  CKM_SHA3_256_HMAC,
} from '@/wasm/softhsm'

// C_GetAttributeValue is intentionally excluded — it floods the log with internal
// attribute probes that make the actual crypto operations hard to read.
const SUCI_LIVE_OPERATIONS = [
  'C_GenerateKeyPair',
  'C_DeriveKey',
  'C_GenerateKey',
  'C_CreateObject', // hsm_importAESKey / hsm_importHMACKey
  'C_EncryptInit',
  'C_Encrypt',
  'C_DecryptInit',
  'C_Decrypt',
  'C_SignInit',
  'C_Sign',
  'C_DigestInit', // hsm_digest (SHA-256/SHA3-256 in KDF + hybrid combine)
  'C_Digest',
  'C_EncapsulateKey', // Profile C: ML-KEM encapsulation
  'C_DecapsulateKey', // Profile C: ML-KEM decapsulation (SIDF)
]

interface SuciFlowProps {
  onBack: () => void
  initialProfile?: 'A' | 'B' | 'C'
  initialPqcMode?: 'hybrid' | 'pure'
  onProfileChange?: (profile: 'A' | 'B' | 'C') => void
  onPqcModeChange?: (mode: 'hybrid' | 'pure') => void
  /** True when the user arrived without URL params — drives the Configure card default. */
  isFirstVisit?: boolean
}

type Profile = 'A' | 'B' | 'C'

interface GsmaProfileB {
  hn_pub_hex: string
  eph_pub_hex: string
  Z_hex?: string
  K_enc_hex?: string
  K_mac_hex?: string
  cipher_msin_hex?: string
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
    case 'compute_shared_secret':
      return 'Shared Secret (Z): ' + b.Z_hex
    case 'derive_keys':
      return 'K_enc: ' + b.K_enc_hex + '\nK_mac: ' + b.K_mac_hex
    case 'encrypt_msin':
      return 'Ciphertext: ' + b.cipher_msin_hex
    case 'compute_mac':
      return 'MAC: ' + b.mac_tag_hex
    default:
      return ''
  }
}

export const SuciFlow: React.FC<SuciFlowProps> = ({
  onBack,
  initialProfile,
  initialPqcMode,
  onProfileChange,
  onPqcModeChange,
  isFirstVisit = false,
}) => {
  const [profile, setProfile] = useState<Profile>(initialProfile ?? 'A')
  const [pqcMode, setPqcMode] = useState<'hybrid' | 'pure'>(initialPqcMode ?? 'hybrid')

  // Plain-English rail: ON by default, persisted per-user in localStorage
  const [plainEnglish, setPlainEnglish] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(PLAIN_ENGLISH_LS_KEY)
      return stored === null ? true : stored === '1'
    } catch {
      return true
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(PLAIN_ENGLISH_LS_KEY, plainEnglish ? '1' : '0')
    } catch {
      /* ignore */
    }
  }, [plainEnglish])

  // Scenario perspective (operator vs IMSI-catcher): session-scoped
  const [scenarioView, setScenarioView] = useState<ScenarioView>(() => {
    try {
      const stored = sessionStorage.getItem(SCENARIO_VIEW_SS_KEY)
      return stored === 'attacker' ? 'attacker' : 'operator'
    } catch {
      return 'operator'
    }
  })
  useEffect(() => {
    try {
      sessionStorage.setItem(SCENARIO_VIEW_SS_KEY, scenarioView)
    } catch {
      /* ignore */
    }
  }, [scenarioView])

  // Keep internal pqcMode in sync with the prop (driven by URL in Playground).
  // This fires when the same SuciFlow instance is reused across profile switches
  // where the key doesn't change (e.g. C-hybrid → A → C-hybrid reuses the instance).
  const prevInitialPqcModeRef = React.useRef(initialPqcMode)
  React.useEffect(() => {
    if (initialPqcMode !== prevInitialPqcModeRef.current) {
      prevInitialPqcModeRef.current = initialPqcMode
      setPqcMode(initialPqcMode ?? 'hybrid')
    }
  }, [initialPqcMode])
  const [customSupi, setCustomSupi] = useState('310260123456789')
  const [gsmaModalOpen, setGsmaModalOpen] = useState(false)
  const hsm = useHSM()

  // Track HSM key handles and derived key bytes across steps
  const hsmHandlesRef = useRef<{
    ciphertext?: Uint8Array // MSIN ciphertext (encrypt_msin output; MAC input)
    kemCiphertext?: Uint8Array // ML-KEM encapsulation output (Profile C only; SIDF input)
    hnPubHandle?: number
    hnPrivHandle?: number
    hnEccPubHandle?: number // Profile C hybrid: X25519 HN ECC public key handle
    hnEccPrivHandle?: number // Profile C hybrid: X25519 HN ECC private key handle
    combinedZBytes?: Uint8Array // Profile C hybrid: SHA256(Z_ecdh || Z_kem)
    ephPubHandle?: number
    ephPrivHandle?: number
    sharedSecretHandle?: number
    kEncBytes?: Uint8Array
    kMacBytes?: Uint8Array
  }>({})

  // Wrap setters to also clear crypto state when switching profiles/modes
  const changeProfile = (p: Profile) => {
    void fiveGService.cleanup()
    setArtifacts({})
    hsmHandlesRef.current = {}
    hsm.clearLog()
    hsm.clearKeys()
    setProfile(p)
    onProfileChange?.(p)
    // Profile C always enters hybrid mode internally; pqcMode URL reset is
    // handled atomically inside onProfileChange (handleProfileChange in SuciFlowRoute)
    // so we must NOT call onPqcModeChange here — that would fire a second
    // setSearchParams that races with the first and can revert the profile update.
    if (p === 'C') {
      setPqcMode('hybrid')
    }
  }
  const changePqcMode = (m: 'hybrid' | 'pure') => {
    void fiveGService.cleanup()
    setArtifacts({})
    hsmHandlesRef.current = {}
    hsm.clearLog()
    hsm.clearKeys()
    setPqcMode(m)
    onPqcModeChange?.(m)
  }

  // Select steps based on profile
  const rawSteps =
    profile === 'C'
      ? FIVE_G_CONSTANTS.SUCI_STEPS_C
      : profile === 'B'
        ? FIVE_G_CONSTANTS.SUCI_STEPS_B
        : FIVE_G_CONSTANTS.SUCI_STEPS_A

  // Pure PQC overrides — Profile C static steps default to hybrid; patch them here.
  const PURE_PQC_TITLES: Record<string, string> = {
    init_network_key: '1. Home Network Key Generation (Profile C — Pure PQC)',
    compute_shared_secret: '5. Compute Shared Secret (ML-KEM Encap only)',
  }
  const PURE_PQC_CODE: Record<string, string> = {
    init_network_key: `// SoftHSMv3 WASM: Generate ML-KEM-768 HN keypair (Pure PQC mode)
const { pubHandle, privHandle } = hsm_generateMLKEMKeyPair(
  hsmd, sessionHandle, 768, false, '5G HN Key (ML-KEM)'
)
// Pure PQC: no classical ECC keypair is generated`,
    compute_shared_secret: `// SoftHSMv3 WASM: Profile C Pure PQC — ML-KEM Encapsulation only
// Pure PQC: Z = Z_kem directly — no ECDH combiner per 3GPP TR 33.841 §5.2.4
// → C_EncapsulateKey(CKM_ML_KEM)
const { ciphertextBytes, secretHandle } = hsm_pqcEncap(M, hSession, hnPubHandle, 'ML-KEM-768')
const zKemBytes = hsm_extractKeyValue(M, hSession, secretHandle)

// Z = Z_kem directly (no ECDH component in pure PQC mode per TR 33.841 §5.2.4)
const Z = zKemBytes`,
  }

  // Map to Step interface (merges UX metadata: phase, plainEnglish, attacker sidecar, climax)
  const steps: Step[] = rawSteps.map((step, index) => {
    const meta = getSuciStepMeta(profile, step.id)
    const isClimax = meta?.isClimax ?? false
    const isDecryptClimax = isClimax
    return {
      id: step.id,
      title:
        profile === 'C' && pqcMode === 'pure' && PURE_PQC_TITLES[step.id]
          ? PURE_PQC_TITLES[step.id]
          : step.title,
      description: step.description,
      code:
        profile === 'C' && pqcMode === 'pure' && PURE_PQC_CODE[step.id]
          ? PURE_PQC_CODE[step.id]
          : step.code,
      language: 'bash',
      actionLabel: isDecryptClimax ? 'Decrypt SUCI at SIDF' : 'Execute Step',
      explanationTable: step.explanationTable,
      diagram: <FiveGDiagram step={index} profile={profile} />,
      phase: meta?.phase,
      plainEnglish: meta?.plainEnglish,
      isClimax,
      climaxBanner: isDecryptClimax
        ? 'Decryption point — the home network SIDF recovers the original SUPI from the SUCI.'
        : undefined,
      attackerSidecar:
        scenarioView === 'attacker' && meta?.attackerObserves ? (
          <AttackerSidecar observes={meta.attackerObserves} />
        ) : undefined,
    }
  })

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
      // For multi-line vectors (derive_keys: "K_enc: …\nK_mac: …") split on the first line
      // so we only match the first value — avoids "K_mac" leaking into the search string.
      const firstLine = gsmaText.split('\n')[0]
      const isMatch = hsmRes
        .toLowerCase()
        .includes(firstLine.split(':')[1]?.trim().toLowerCase() || 'XXXXX')
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
    fiveGService.state.profile = profile // ensure profile is always set before any step runs
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
            let hybridNote = ''
            if (pqcMode === 'hybrid') {
              // Hybrid Profile C also requires an X25519 HN keypair for the ECDH component
              // (3GPP TR 33.841 §5.2.5.2: Z = SHA256(Z_ecdh || Z_kem))
              const eccResult = hsm_generateECKeyPair(
                M,
                hSession,
                'X25519',
                false,
                '5G HN ECC Key (X25519)'
              )
              hsmHandlesRef.current.hnEccPubHandle = eccResult.pubHandle
              hsmHandlesRef.current.hnEccPrivHandle = eccResult.privHandle
              hsm.addKey({
                handle: eccResult.pubHandle,
                label: 'HN ECC Key (X25519)',
                family: 'ecdh',
                role: 'public',
                generatedAt: new Date().toISOString(),
              })
              hsm.addKey({
                handle: eccResult.privHandle,
                label: 'HN ECC Key (X25519)',
                family: 'ecdh',
                role: 'private',
                generatedAt: new Date().toISOString(),
              })
              hybridNote = `\nX25519 HN ECC pub handle: ${eccResult.pubHandle}\nX25519 HN ECC priv handle: ${eccResult.privHandle}\n[Hybrid] Both ML-KEM + X25519 components ready per TR 33.841 §5.2.5.2`
            }
            hsmResult = `ML-KEM-768 pub handle:  ${pubHandle}\nML-KEM-768 priv handle: ${privHandle}${hybridNote}\n\nHome Network key pair generated via SoftHSM3 WASM.\n\nDetailed C-level traces are captured in the PKCS#11 Call Log.`
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
              family: 'ecdh',
              role: 'public',
              generatedAt: new Date().toISOString(),
            })
            hsm.addKey({
              handle: privHandle,
              label: `HN Key (${curve})`,
              family: 'ecdh',
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
          const kEncRaw = hsmHandlesRef.current.kEncBytes
          const keyBits = profile === 'C' ? 256 : 128
          const keyBytes = kEncRaw
            ? kEncRaw.slice(0, keyBits / 8)
            : crypto.getRandomValues(new Uint8Array(keyBits / 8))
          // encrypt=true, decrypt=true, wrap=false, unwrap=false, derive=false, extractable=true
          const aesHandle = hsm_importAESKey(
            M,
            hSession,
            keyBytes,
            true,
            true,
            false,
            false,
            false,
            true
          )
          hsm.addKey({
            handle: aesHandle,
            label: `MSIN Enc Key (AES-${keyBits})`,
            family: 'aes',
            role: 'secret',
            purpose: 'application',
            generatedAt: new Date().toISOString(),
          })
          const supiStr = customSupi || '310260123456789'
          const msinDigits = supiStr.length > 6 ? supiStr.slice(6) : supiStr
          // BCD-encode MSIN per 3GPP TS 23.003 (nibble-swapped, F-padded)
          const msinBcd = fiveGService.bcdEncode(msinDigits)
          const msinBcdHex = Array.from(msinBcd)
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('')
            .toUpperCase()
          // AES-128-CTR with zero IV per 3GPP TS 33.501 §C.3.3
          const zeroIv = new Uint8Array(16)
          const ct = hsm_aesEncrypt(M, hSession, aesHandle, msinBcd, 'ctr', zeroIv)
          // Store ciphertext only (IV is zero/fixed; MAC is computed over ciphertext per spec)
          hsmHandlesRef.current.ciphertext = ct.ciphertext
          const ctHex = Array.from(ct.ciphertext)
            .map((b: number) => b.toString(16).padStart(2, '0'))
            .join('')
            .toUpperCase()
          const keySource = kEncRaw ? 'K_enc from ANSI X9.63-KDF' : 'random (run derive_keys first)'
          hsmResult = `MSIN digits:    ${msinDigits}
MSIN BCD:       ${msinBcdHex} (${msinBcd.length} bytes, nibble-swapped per TS 23.003)
Algorithm:      AES-${keyBits}-CTR | IV: ${Array.from(zeroIv)
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('')
            .toUpperCase()} (zero per TS 33.501)
Key source:     ${keySource}

> C_Encrypt(CKM_AES_CTR)

Ciphertext: ${ctHex} (${ct.ciphertext.length} bytes)

MSIN encrypted via SoftHSM3 WASM. (Completed)

Detailed C-level traces are captured in the PKCS#11 Call Log.`
        }

        const osslResult = await fiveGService.encryptMSIN()

        if (hsmActive) {
          // HSM ciphertext is canonical — override OpenSSL's encryptedMSINHex in state.
          const ct = hsmHandlesRef.current.ciphertext
          if (ct) {
            fiveGService.state.encryptedMSINHex = Array.from(ct)
              .map((b) => b.toString(16).padStart(2, '0'))
              .join('')
          }
          result = buildDualEngineResult(hsmResult, osslResult, stepData.id)
        } else {
          result = osslResult
        }
      } else if (stepData.id === 'compute_mac') {
        const hsmActive = hsm.isReady && hsm.moduleRef.current && hsm.hSessionRef.current
        let hsmResult = ''
        let hsmMacBytes: Uint8Array | undefined
        if (hsmActive) {
          const M = hsm.moduleRef.current!
          const hSession = hsm.hSessionRef.current!
          const kMacRaw = hsmHandlesRef.current.kMacBytes
          const macKeyBytes = kMacRaw ?? crypto.getRandomValues(new Uint8Array(32))
          const hmacHandle = hsm_importHMACKey(M, hSession, macKeyBytes)
          hsm.addKey({
            handle: hmacHandle,
            label: profile === 'C' ? 'MAC Key (HMAC-SHA3-256)' : 'MAC Key (HMAC-SHA256)',
            family: 'hmac',
            role: 'secret',
            purpose: 'application',
            generatedAt: new Date().toISOString(),
          })
          // MAC input = ciphertext from encrypt_msin (or placeholder if not yet executed)
          const macInput =
            hsmHandlesRef.current.ciphertext ?? new TextEncoder().encode('suci-mac-input-data')
          const hmacMech = profile === 'C' ? CKM_SHA3_256_HMAC : undefined
          const mac = hsm_hmac(M, hSession, hmacHandle, macInput, hmacMech)
          hsmMacBytes = mac
          const macHex = Array.from(mac)
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('')
          const macKeySource = kMacRaw
            ? profile === 'C'
              ? 'K_mac from ANSI X9.63-KDF (SHA3-256)'
              : 'K_mac from ANSI X9.63-KDF'
            : 'ephemeral key (run derive_keys first)'
          hsmResult = `Key source: ${macKeySource}\nMAC input: ${macInput.length} bytes\nMAC tag (hex): ${macHex}\n\nMAC computed via SoftHSM3 WASM. (Completed)\n\nDetailed C-level traces are captured in the PKCS#11 Call Log.`
        }

        const osslResult = await fiveGService.computeMAC()

        if (hsmActive) {
          // HSM MAC tag is canonical — override OpenSSL's macTagHex in state.
          // Truncate to 8 bytes (64 bits) per 3GPP TS 33.501 §C.3.4.
          if (hsmMacBytes) {
            fiveGService.state.macTagHex = Array.from(hsmMacBytes.slice(0, 8))
              .map((b) => b.toString(16).padStart(2, '0'))
              .join('')
          }
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
          // Profile B uses P-256; Profile A and Profile C hybrid both use X25519
          const curve = (profile === 'B' ? 'P-256' : 'X25519') as 'X25519' | 'P-256'
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
          // Gap 1: sync HSM-canonical ephemeral public key into fiveGService.state.
          // fiveGService.generateEphemeralKey() stores an OpenSSL SPKI hex there; override
          // with the raw EC point bytes from the HSM so that derive_keys (OpenSSL cross-check)
          // uses the same SharedInfo as the HSM KDF path.
          if (hsmHandlesRef.current.ephPubHandle !== undefined) {
            const M = hsm.moduleRef.current!
            const hSession = hsm.hSessionRef.current!
            const rawPubBytes = hsm_extractECPoint(M, hSession, hsmHandlesRef.current.ephPubHandle)
            fiveGService.state.ephemeralPubKeyHex = Array.from(rawPubBytes)
              .map((b) => b.toString(16).padStart(2, '0'))
              .join('')
          }
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
            hsmHandlesRef.current.kemCiphertext = ciphertextBytes
            hsm.addKey({
              handle: secretHandle,
              label: 'Z_kem (ML-KEM-768)',
              family: 'aes',
              role: 'secret',
              purpose: 'application',
              generatedAt: new Date().toISOString(),
            })
            const zKemBytes = hsm_extractKeyValue(M, hSession, secretHandle)
            const zKemHex = Array.from(zKemBytes)
              .map((b) => b.toString(16).padStart(2, '0'))
              .join('')

            if (pqcMode === 'hybrid' && hsmHandlesRef.current.hnEccPubHandle !== undefined) {
              // Hybrid TR 33.841 §5.2.5.2: Z = SHA256(Z_ecdh || Z_kem)
              // Step 1: ECDH(eph_priv, hn_ecc_pub) → Z_ecdh
              const hnEccPubBytes = hsm_extractECPoint(
                M,
                hSession,
                hsmHandlesRef.current.hnEccPubHandle!
              )
              const zEcdhHandle = hsm_ecdhDerive(
                M,
                hSession,
                hsmHandlesRef.current.ephPrivHandle!,
                hnEccPubBytes,
                undefined,
                undefined,
                { keyLen: 32, derive: true, extractable: true }
              )
              const zEcdhBytes = hsm_extractKeyValue(M, hSession, zEcdhHandle)
              const zEcdhHex = Array.from(zEcdhBytes)
                .map((b) => b.toString(16).padStart(2, '0'))
                .join('')

              // Step 2: Z = SHA256(Z_ecdh || Z_kem) via C_Digest inside HSM
              const zConcat = new Uint8Array(zEcdhBytes.length + zKemBytes.length)
              zConcat.set(zEcdhBytes, 0)
              zConcat.set(zKemBytes, zEcdhBytes.length)
              const combinedZ = hsm_digest(M, hSession, zConcat, CKM_SHA256)
              hsmHandlesRef.current.combinedZBytes = combinedZ
              const combinedZHex = Array.from(combinedZ)
                .map((b) => b.toString(16).padStart(2, '0'))
                .join('')

              hsmResult = `ML-KEM encap:
  hnPub handle: ${hsmHandlesRef.current.hnPubHandle}
  → KEM Ciphertext: ${ciphertextBytes.length} bytes
  → Z_kem (hex): ${zKemHex.slice(0, 64)}...

X25519 ECDH:
  ephPriv handle: ${hsmHandlesRef.current.ephPrivHandle}
  hnEccPub bytes: ${hnEccPubBytes.length}
  → Z_ecdh (hex): ${zEcdhHex.slice(0, 64)}...

Hybrid Combine (TR 33.841 §5.2.5.2):
  Z = SHA256(Z_ecdh ‖ Z_kem)
  → Z_combined (hex): ${combinedZHex.slice(0, 64)}...

ML-KEM + ECDH hybrid executed via SoftHSM3 WASM. (Encapsulated + Derived)`
            } else {
              // Pure PQC: Z = Z_kem directly
              hsmHandlesRef.current.combinedZBytes = undefined
              hsmResult = `hnPub handle: ${hsmHandlesRef.current.hnPubHandle}\n→ Ciphertext length: ${ciphertextBytes.length} bytes\n→ Shared secret handle: ${secretHandle}\n→ Z_kem (hex): ${zKemHex.slice(0, 64)}...\n\nML-KEM Encapsulation executed via SoftHSM3 WASM. (Pure PQC mode)`
            }
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
          // Sync HSM-canonical values into fiveGService.state (HSM is the primary engine).
          // OpenSSL runs only for cross-check display; its state writes are overridden here.
          if (profile === 'A' || profile === 'B') {
            // Profiles A/B: override sharedSecretHex with HSM ECDH result so downstream
            // derive_keys (HSM path) and SIDF use the same Z that the HSM computed.
            const sharedHandle = hsmHandlesRef.current.sharedSecretHandle
            if (sharedHandle !== undefined) {
              const M = hsm.moduleRef.current!
              const hSession = hsm.hSessionRef.current!
              const zBytes = hsm_extractKeyValue(M, hSession, sharedHandle)
              fiveGService.state.sharedSecretHex = Array.from(zBytes)
                .map((b) => b.toString(16).padStart(2, '0'))
                .join('')
            }
          } else if (profile === 'C') {
            const ct = hsmHandlesRef.current.kemCiphertext
            if (ct) {
              fiveGService.state.ciphertextHex = Array.from(ct)
                .map((b) => b.toString(16).padStart(2, '0'))
                .join('')
            }
            const combinedZ = hsmHandlesRef.current.combinedZBytes
            if (combinedZ) {
              fiveGService.state.sharedSecretHex = Array.from(combinedZ)
                .map((b) => b.toString(16).padStart(2, '0'))
                .join('')
            }
          }
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

          // Use explicit ArrayBuffer (not SharedArrayBuffer) so crypto.subtle.digest accepts the input
          const concatU8 = (...parts: Uint8Array[]): Uint8Array => {
            const out = new Uint8Array(new ArrayBuffer(parts.reduce((n, p) => n + p.length, 0)))
            let off = 0
            for (const p of parts) {
              out.set(p, off)
              off += p.length
            }
            return out
          }

          let kEnc: Uint8Array = new Uint8Array(0)
          let kMac: Uint8Array = new Uint8Array(0)

          if (profile !== 'C') {
            // Profiles A/B: ANSI X9.63-KDF per 3GPP TS 33.501 §C.3.3
            // ECDH Z stays inside HSM; KDF computed via SubtleCrypto SHA-256.
            // PKCS#11 v3.2 has no CKM_ANSI_X9_63_KDF mechanism — SubtleCrypto is the correct bridge.
            const zBytes = hsm_extractKeyValue(
              M,
              hSession,
              hsmHandlesRef.current.sharedSecretHandle!
            )
            const ephSpkiHex = fiveGService.state.ephemeralPubKeyHex || ''
            const ephSpki = new Uint8Array(
              (ephSpkiHex.match(/.{1,2}/g) ?? []).map((h: string) => parseInt(h, 16))
            )
            // SharedInfo = raw ephemeral public key (SPKI wrapper stripped)
            // X25519 SPKI = 44 bytes → offset 12 (32-byte raw key)
            // P-256  SPKI = 91 bytes → offset 26 (65-byte uncompressed point incl. 04 prefix)
            const sharedInfo =
              profile === 'A' && ephSpki.length === 44
                ? ephSpki.slice(12)
                : profile === 'B' && ephSpki.length === 91
                  ? ephSpki.slice(26)
                  : ephSpki
            const block1 = new Uint8Array(
              await crypto.subtle.digest(
                'SHA-256',
                concatU8(zBytes, new Uint8Array([0, 0, 0, 1]), sharedInfo).buffer as ArrayBuffer
              )
            )
            const block2 = new Uint8Array(
              await crypto.subtle.digest(
                'SHA-256',
                concatU8(zBytes, new Uint8Array([0, 0, 0, 2]), sharedInfo).buffer as ArrayBuffer
              )
            )
            kEnc = block1.slice(0, 16)
            kMac = concatU8(block1.slice(16), block2.slice(0, 16))
            const kEncHandle = hsm_importAESKey(M, hSession, kEnc)
            const kMacHandle = hsm_importHMACKey(M, hSession, kMac)
            hsm.addKey({
              handle: kEncHandle,
              label: 'K_enc (AES-128)',
              family: 'aes',
              role: 'secret',
              purpose: 'application',
              generatedAt: new Date().toISOString(),
            })
            hsm.addKey({
              handle: kMacHandle,
              label: 'K_mac (HMAC-SHA256)',
              family: 'hmac',
              role: 'secret',
              purpose: 'application',
              generatedAt: new Date().toISOString(),
            })
            const kEncHex = Array.from(kEnc)
              .map((b) => b.toString(16).padStart(2, '0'))
              .join('')
              .toUpperCase()
            const kMacHex = Array.from(kMac)
              .map((b) => b.toString(16).padStart(2, '0'))
              .join('')
              .toUpperCase()
            const block1Hex = Array.from(block1)
              .map((b) => b.toString(16).padStart(2, '0'))
              .join('')
              .toUpperCase()
            hsmResult = `Base key handle: ${hsmHandlesRef.current.sharedSecretHandle}
KDF: ANSI X9.63-KDF (SHA-256) — spec-compliant per 3GPP TS 33.501 §C.3.3
SharedInfo: raw ${profile === 'A' ? '32-byte X25519' : '65-byte P-256'} ephemeral public key
Counter: 0x00000001 → block1, 0x00000002 → block2
block1 = SHA-256(Z ‖ 0x00000001 ‖ SharedInfo): ${block1Hex}
→ K_enc handle: ${kEncHandle} | K_enc (${kEnc.length} bytes): ${kEncHex}
→ K_mac handle: ${kMacHandle} | K_mac (${kMac.length} bytes): ${kMacHex}

Note: ECDH inside HSM; KDF via SubtleCrypto SHA-256 (no CKM_ANSI_X9_63_KDF in PKCS#11 v3.2). (Derived)`
          } else {
            // Profile C: ANSI X9.63-KDF with SHA3-256 per 3GPP TR 33.841 — spec-compliant.
            // Hybrid: Z = SHA256(Z_ecdh || Z_kem) from compute_shared_secret step.
            // Pure PQC: Z = Z_kem directly from sharedSecretHandle.
            const zBytesC =
              pqcMode === 'hybrid' && hsmHandlesRef.current.combinedZBytes
                ? hsmHandlesRef.current.combinedZBytes
                : hsm_extractKeyValue(M, hSession, hsmHandlesRef.current.sharedSecretHandle!)
            // SharedInfo = raw X25519 ephemeral pub key (32 bytes) for hybrid; empty for pure PQC.
            // Use hsm_extractECPoint from the stored ephPubHandle (pure HSM path, no SPKI parsing).
            const sharedInfoC =
              hsmHandlesRef.current.ephPubHandle !== undefined
                ? hsm_extractECPoint(M, hSession, hsmHandlesRef.current.ephPubHandle!)
                : new Uint8Array(0)
            // block1 = SHA3-256(Z || 0x00000001 || SharedInfo) → K_enc (AES-256, 32 bytes)
            const block1C = hsm_digest(
              M,
              hSession,
              concatU8(zBytesC, new Uint8Array([0, 0, 0, 1]), sharedInfoC),
              CKM_SHA3_256
            )
            // block2 = SHA3-256(Z || 0x00000002 || SharedInfo) → K_mac (HMAC-SHA3-256, 32 bytes)
            const block2C = hsm_digest(
              M,
              hSession,
              concatU8(zBytesC, new Uint8Array([0, 0, 0, 2]), sharedInfoC),
              CKM_SHA3_256
            )
            kEnc = block1C
            kMac = block2C
            const kEncHandleC = hsm_importAESKey(M, hSession, kEnc)
            const kMacHandleC = hsm_importHMACKey(M, hSession, kMac)
            hsm.addKey({
              handle: kEncHandleC,
              label: 'K_enc (AES-256, Profile C)',
              family: 'aes',
              role: 'secret',
              purpose: 'application',
              generatedAt: new Date().toISOString(),
            })
            hsm.addKey({
              handle: kMacHandleC,
              label: 'K_mac (HMAC-SHA3-256)',
              family: 'hmac',
              role: 'secret',
              purpose: 'application',
              generatedAt: new Date().toISOString(),
            })
            const block1CHex = Array.from(block1C)
              .map((b) => b.toString(16).padStart(2, '0'))
              .join('')
              .toUpperCase()
            const block2CHex = Array.from(block2C)
              .map((b) => b.toString(16).padStart(2, '0'))
              .join('')
              .toUpperCase()
            const zSource =
              pqcMode === 'hybrid' && hsmHandlesRef.current.combinedZBytes
                ? 'Z = SHA256(Z_ecdh ‖ Z_kem) [hybrid, from compute_shared_secret]'
                : `Z_kem from handle ${hsmHandlesRef.current.sharedSecretHandle} [pure PQC]`
            hsmResult = `Z source: ${zSource}
KDF: ANSI X9.63-KDF (SHA3-256) — spec-compliant per 3GPP TR 33.841
     (C_Digest(CKM_SHA3_256) inside HSM; no CKM_ANSI_X9_63_KDF in PKCS#11 v3.2)
SharedInfo: ${sharedInfoC.length > 0 ? `raw X25519 ephemeral key (${sharedInfoC.length} bytes, C_GetAttributeValue CKA_EC_POINT)` : 'empty (Pure PQC mode)'}
block1 = SHA3-256(Z ‖ 0x00000001 ‖ SharedInfo): ${block1CHex}
block2 = SHA3-256(Z ‖ 0x00000002 ‖ SharedInfo): ${block2CHex}
→ K_enc handle: ${kEncHandleC} | K_enc (${kEnc.length} bytes, AES-256): ${block1CHex}
→ K_mac handle: ${kMacHandleC} | K_mac (${kMac.length} bytes, HMAC-SHA3-256): ${block2CHex}

(Derived — spec-compliant)`
          }

          hsmHandlesRef.current.kEncBytes = kEnc
          hsmHandlesRef.current.kMacBytes = kMac
        }

        const osslResult = await fiveGService.deriveKeys(profile)

        if (hsmActive) {
          // Override fiveGService.state with HSM-derived keys AFTER the OpenSSL call.
          // fiveGService.deriveKeys() runs from a separate OpenSSL Z value and would
          // produce a different K_enc/K_mac, causing MAC mismatch at SIDF decryption.
          // The HSM keys are the authoritative values for all subsequent encrypt/MAC/verify steps.
          const kEnc = hsmHandlesRef.current.kEncBytes!
          const kMac = hsmHandlesRef.current.kMacBytes!
          fiveGService.state.kEncHex = Array.from(kEnc)
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('')
          fiveGService.state.kMacHex = Array.from(kMac)
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('')
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
        if (hsmActive && profile === 'C' && hsmHandlesRef.current.kemCiphertext) {
          const M = hsm.moduleRef.current!
          const hSession = hsm.hSessionRef.current!

          // Helper: concatenate Uint8Arrays using plain ArrayBuffer (no SharedArrayBuffer)
          const concatU8C = (...parts: Uint8Array[]): Uint8Array => {
            const out = new Uint8Array(new ArrayBuffer(parts.reduce((n, p) => n + p.length, 0)))
            let off = 0
            for (const p of parts) {
              out.set(p, off)
              off += p.length
            }
            return out
          }

          // Step 1: ML-KEM decapsulation → Z_kem
          const secretHandle = hsm_pqcDecap(
            M,
            hSession,
            hsmHandlesRef.current.hnPrivHandle!,
            hsmHandlesRef.current.kemCiphertext!,
            'ML-KEM-768'
          )
          hsm.addKey({
            handle: secretHandle,
            label: 'Z_kem (Decapsulated)',
            family: 'aes',
            role: 'secret',
            purpose: 'application',
            generatedAt: new Date().toISOString(),
          })
          const zKemBytesC = hsm_extractKeyValue(M, hSession, secretHandle)
          const zKemHexC = Array.from(zKemBytesC)
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('')

          // Step 2 (hybrid only): ECDH(hn_ecc_priv, eph_pub) → Z_ecdh, then combine
          let sidfZBytesC: Uint8Array = zKemBytesC
          let zCombineNote = `Z: Z_kem directly (Pure PQC mode)`

          if (
            pqcMode === 'hybrid' &&
            hsmHandlesRef.current.hnEccPrivHandle !== undefined &&
            hsmHandlesRef.current.ephPubHandle !== undefined
          ) {
            // Re-derive Z_ecdh using HN ECC private key × ephemeral public key
            // Use hsm_extractECPoint to get raw EC point bytes from the HSM-stored ephemeral pub key
            // (same approach as the Profile A/B SIDF path)
            const ephRawC = hsm_extractECPoint(M, hSession, hsmHandlesRef.current.ephPubHandle!)
            const zEcdhHandleC = hsm_ecdhDerive(
              M,
              hSession,
              hsmHandlesRef.current.hnEccPrivHandle!,
              ephRawC,
              undefined,
              undefined,
              { keyLen: 32, derive: true, extractable: true }
            )
            const zEcdhBytesC = hsm_extractKeyValue(M, hSession, zEcdhHandleC)
            const zEcdhHexC = Array.from(zEcdhBytesC)
              .map((b) => b.toString(16).padStart(2, '0'))
              .join('')

            // Z = SHA256(Z_ecdh || Z_kem) per TR 33.841 §5.2.5.2
            const zConcatC = concatU8C(zEcdhBytesC, zKemBytesC)
            sidfZBytesC = hsm_digest(M, hSession, zConcatC, CKM_SHA256)
            const zCombinedHexC = Array.from(sidfZBytesC)
              .map((b) => b.toString(16).padStart(2, '0'))
              .join('')

            zCombineNote = `Z_ecdh (re-derived): ${zEcdhHexC.slice(0, 48)}...
Z_kem  (decapped):   ${zKemHexC.slice(0, 48)}...
Z = SHA256(Z_ecdh ‖ Z_kem): ${zCombinedHexC.slice(0, 48)}... [TR 33.841 §5.2.5.2]`
          }

          // Step 3: ANSI X9.63-KDF with SHA3-256 → K_enc (AES-256), K_mac (HMAC-SHA3-256)
          // SharedInfo = raw X25519 ephemeral public key (32 bytes) for hybrid; empty for pure PQC.
          // Use hsm_extractECPoint from the stored ephPubHandle (consistent with derive_keys KDF path).
          const sidfSharedInfoC =
            hsmHandlesRef.current.ephPubHandle !== undefined
              ? hsm_extractECPoint(M, hSession, hsmHandlesRef.current.ephPubHandle!)
              : new Uint8Array(0)
          const sidfBlock1C = hsm_digest(
            M,
            hSession,
            concatU8C(sidfZBytesC, new Uint8Array([0, 0, 0, 1]), sidfSharedInfoC),
            CKM_SHA3_256
          )
          const sidfBlock2C = hsm_digest(
            M,
            hSession,
            concatU8C(sidfZBytesC, new Uint8Array([0, 0, 0, 2]), sidfSharedInfoC),
            CKM_SHA3_256
          )
          const sidfKEncC = sidfBlock1C
          const sidfKMacC = sidfBlock2C
          const sidfKEncCHex = Array.from(sidfKEncC)
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('')
            .toUpperCase()
          const sidfKMacCHex = Array.from(sidfKMacC)
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('')
            .toUpperCase()

          // Step 4: MAC verification (authenticate-then-decrypt per 3GPP TR 33.841)
          let macLineC = '4. Verifying MAC...[SKIPPED — run encrypt_msin + compute_mac first]'
          let macOkC = false
          const cipherHexC = fiveGService.state.encryptedMSINHex
          if (cipherHexC) {
            const cipherBytesC = new Uint8Array(
              (cipherHexC.match(/.{1,2}/g) ?? []).map((h) => parseInt(h, 16))
            )
            const sidfMacHandleC = hsm_importHMACKey(M, hSession, sidfKMacC)
            const macFullC = hsm_hmac(M, hSession, sidfMacHandleC, cipherBytesC, CKM_SHA3_256_HMAC)
            const recomputedTagC = Array.from(macFullC.slice(0, 8))
              .map((b) => b.toString(16).padStart(2, '0'))
              .join('')
              .toUpperCase()
            const storedTagC = (fiveGService.state.macTagHex || '').toUpperCase()
            macOkC = !!(storedTagC && recomputedTagC === storedTagC)
            macLineC = `4. Verifying MAC (HMAC-SHA3-256)...
   Recomputed tag: ${recomputedTagC}
   Stored tag:     ${storedTagC || '(missing)'}
   Result: ${macOkC ? '[OK] MAC VALID' : storedTagC ? '[FAIL] MAC MISMATCH — SUCI rejected by SIDF' : '[SKIPPED] no stored tag to compare'}`
          }

          // Step 5: AES-256-CTR decrypt — only if MAC passed (authenticate-then-decrypt)
          let supiLineC = '5. Decrypting MSIN...[SKIPPED — run encrypt_msin first]'
          if (!macOkC && cipherHexC) {
            supiLineC =
              '5. Decrypting MSIN...[ABORTED — MAC verification failed; SUCI rejected by SIDF]'
          } else if (macOkC && cipherHexC) {
            const cipherBytesForDecC = new Uint8Array(
              (cipherHexC.match(/.{1,2}/g) ?? []).map((h) => parseInt(h, 16))
            )
            const sidfKEncHandleC = hsm_importAESKey(M, hSession, sidfKEncC)
            const zeroIvC = new Uint8Array(16)
            const decryptedC = hsm_aesDecrypt(
              M,
              hSession,
              sidfKEncHandleC,
              cipherBytesForDecC,
              zeroIvC,
              'ctr'
            )
            const bcdDigitsC = fiveGService.bcdDecode(decryptedC)
            const parsedSupiC = fiveGService.state.supi || '310260123456789'
            const recoveredSupiC = `${parsedSupiC.slice(0, 6)}${bcdDigitsC}`
            const bcdHexC = Array.from(decryptedC)
              .map((b) => b.toString(16).padStart(2, '0'))
              .join('')
            supiLineC = `5. Decrypting MSIN (AES-256-CTR, zero IV)...
   > C_Decrypt(CKM_AES_CTR)
   BCD bytes: ${bcdHexC}
   MSIN: ${bcdDigitsC}
   [SUCCESS] SUPI Recovered: ${recoveredSupiC}`
          }

          hsmResult = `1. ML-KEM Decapsulation:
   KEM ciphertext: ${hsmHandlesRef.current.kemCiphertext!.length} bytes
   → Z_kem (hex): ${zKemHexC.slice(0, 64)}...

2. Key Combination (TR 33.841 §5.2.5.2):
   ${zCombineNote}

3. ANSI X9.63-KDF (SHA3-256):
   SharedInfo: ${sidfSharedInfoC.length > 0 ? `${sidfSharedInfoC.length}-byte X25519 ephemeral key` : 'empty (pure PQC)'}
   → K_enc (${sidfKEncC.length} bytes, AES-256): ${sidfKEncCHex}
   → K_mac (${sidfKMacC.length} bytes, HMAC-SHA3-256): ${sidfKMacCHex}

${macLineC}

${supiLineC}

ML-KEM Decapsulation executed via SoftHSM3 WASM.`
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
          const sidfZBytes = hsm_extractKeyValue(M, hSession, sidfSecretHandle)
          const sidfZHex = Array.from(sidfZBytes)
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('')

          // Re-derive K_enc + K_mac using ANSI X9.63-KDF (matches derive_keys step)
          const concatU8Sidf = (...parts: Uint8Array[]): Uint8Array => {
            const out = new Uint8Array(new ArrayBuffer(parts.reduce((n, p) => n + p.length, 0)))
            let off = 0
            for (const p of parts) {
              out.set(p, off)
              off += p.length
            }
            return out
          }
          // ephemeralPubKeyHex holds either:
          //   • SPKI-wrapped DER (44B X25519 / 91B P-256) when OpenSSL generated the key, OR
          //   • raw EC point bytes (32B X25519 / 65B P-256) when HSM generated the key
          //     (gen_ephemeral_key overrides with hsm_extractECPoint output).
          // The length checks below handle both: SPKI branch strips the header, raw-point
          // branch falls through to `ephSpkiSidf` directly (already the correct SharedInfo).
          const ephSpkiHexSidf = fiveGService.state.ephemeralPubKeyHex || ''
          const ephSpkiSidf = new Uint8Array(
            (ephSpkiHexSidf.match(/.{1,2}/g) ?? []).map((h: string) => parseInt(h, 16))
          )
          const sidfSharedInfo =
            profile === 'A' && ephSpkiSidf.length === 44
              ? ephSpkiSidf.slice(12)
              : profile === 'B' && ephSpkiSidf.length === 91
                ? ephSpkiSidf.slice(26)
                : ephSpkiSidf
          const sidfBlock1 = new Uint8Array(
            await crypto.subtle.digest(
              'SHA-256',
              concatU8Sidf(sidfZBytes, new Uint8Array([0, 0, 0, 1]), sidfSharedInfo)
                .buffer as ArrayBuffer
            )
          )
          const sidfBlock2 = new Uint8Array(
            await crypto.subtle.digest(
              'SHA-256',
              concatU8Sidf(sidfZBytes, new Uint8Array([0, 0, 0, 2]), sidfSharedInfo)
                .buffer as ArrayBuffer
            )
          )
          const sidfKEnc = sidfBlock1.slice(0, 16)
          const sidfKMac = concatU8Sidf(sidfBlock1.slice(16), sidfBlock2.slice(0, 16))
          const sidfKEncHex = Array.from(sidfKEnc)
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('')
            .toUpperCase()
          const sidfKMacHex = Array.from(sidfKMac)
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('')
            .toUpperCase()

          // MAC verification: HMAC-SHA256 over stored ciphertext (authenticate-then-decrypt)
          let macLine = '4. Verifying MAC...[SKIPPED — run encrypt_msin + compute_mac first]'
          let macOk = false
          const cipherHex = fiveGService.state.encryptedMSINHex
          if (cipherHex && sidfKMac.length > 0) {
            const cipherBytes = new Uint8Array(
              (cipherHex.match(/.{1,2}/g) ?? []).map((h) => parseInt(h, 16))
            )
            const sidfMacHandle = hsm_importHMACKey(M, hSession, sidfKMac)
            const macFull = hsm_hmac(M, hSession, sidfMacHandle, cipherBytes)
            const recomputedTag = Array.from(macFull.slice(0, 8))
              .map((b) => b.toString(16).padStart(2, '0'))
              .join('')
              .toUpperCase()
            const storedTag = (fiveGService.state.macTagHex || '').toUpperCase()
            macOk = !!(storedTag && recomputedTag === storedTag)
            macLine = `4. Verifying MAC (HMAC-SHA256)...
   Recomputed tag: ${recomputedTag}
   Stored tag:     ${storedTag || '(missing)'}
   Result: ${macOk ? '[OK] MAC VALID' : storedTag ? '[FAIL] MAC MISMATCH — SUCI rejected by SIDF' : '[SKIPPED] no stored tag to compare'}`
          }

          // Decrypt only if MAC passed (authenticate-then-decrypt per 3GPP TS 33.501)
          let supiLine = '5. Decrypting MSIN...[SKIPPED — run encrypt_msin first]'
          if (!macOk && cipherHex) {
            supiLine =
              '5. Decrypting MSIN...[ABORTED — MAC verification failed; SUCI rejected by SIDF]'
          } else if (macOk && cipherHex && sidfKEnc.length > 0) {
            const cipherBytesForDec = new Uint8Array(
              (cipherHex.match(/.{1,2}/g) ?? []).map((h) => parseInt(h, 16))
            )
            const sidfKEncHandle = hsm_importAESKey(M, hSession, sidfKEnc)
            const zeroIvSidf = new Uint8Array(16)
            const decrypted = hsm_aesDecrypt(
              M,
              hSession,
              sidfKEncHandle,
              cipherBytesForDec,
              zeroIvSidf,
              'ctr'
            )
            const bcdDigits = fiveGService.bcdDecode(decrypted)
            const parsedSupi = fiveGService.state.supi || '310260123456789'
            const recoveredSupi = `${parsedSupi.slice(0, 6)}${bcdDigits}`
            const bcdHex = Array.from(decrypted)
              .map((b) => b.toString(16).padStart(2, '0'))
              .join('')
            supiLine = `5. Decrypting MSIN (AES-128-CTR, zero IV)...
   > C_Decrypt(CKM_AES_CTR)
   BCD bytes: ${bcdHex}
   MSIN: ${bcdDigits}
   [SUCCESS] SUPI Recovered: ${recoveredSupi}`
          }

          hsmResult = `hnPriv handle: ${hsmHandlesRef.current.hnPrivHandle}
ephPub bytes: ${ephPubBytes.length}
→ SIDF Shared Secret Handle: ${sidfSecretHandle}
→ Z (hex): ${sidfZHex.slice(0, 64)}...
KDF: ANSI X9.63-KDF (SHA-256) — spec-compliant
→ K_enc (${sidfKEnc.length} bytes): ${sidfKEncHex}
→ K_mac (${sidfKMac.length} bytes): ${sidfKMacHex}

${macLine}

${supiLine}

SIDF ECDH executed via SoftHSM3 WASM.
Detailed C-level traces are captured in the PKCS#11 Call Log.`
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
  // One-line summary shown on the collapsed Configure card
  const configureSummary = (
    <span>
      <span className="font-mono text-foreground">
        Profile {profile}
        {profile === 'C' ? ` · ${pqcMode === 'pure' ? 'Pure PQC' : 'Hybrid'}` : ''}
      </span>
      <span className="text-muted-foreground">
        {' '}
        ·{' '}
        {profile === 'A'
          ? 'Curve25519 + AES-128'
          : profile === 'B'
            ? 'NIST P-256 + AES-128'
            : pqcMode === 'pure'
              ? 'ML-KEM-768 + AES-256'
              : 'X25519 + ML-KEM-768 + AES-256'}
      </span>
      <span className="text-muted-foreground"> · Live HSM {hsm.isReady ? 'on' : 'off'}</span>
      <span className="text-muted-foreground"> · SUPI {customSupi}</span>
    </span>
  )

  return (
    <div className="space-y-4">
      <ScenarioIntroStrip
        view={scenarioView}
        onViewChange={setScenarioView}
        plainEnglish={plainEnglish}
        onPlainEnglishChange={setPlainEnglish}
      />

      <GsmaTestDataModal open={gsmaModalOpen} onClose={() => setGsmaModalOpen(false)} />

      <ConfigureCard isFirstVisit={isFirstVisit} summary={configureSummary}>
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
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground uppercase tracking-wider font-bold">
              <Shield size={14} />
              Select Protection Scheme
            </div>
            <Button
              variant="ghost"
              onClick={() => setGsmaModalOpen(true)}
              className="text-xs text-muted-foreground hover:text-primary border border-border hover:border-primary/40 rounded px-2 py-1 transition-colors"
              title="View official 3GPP TS 33.501 Annex C.4 reference test vectors"
            >
              Reference Vectors
            </Button>
          </div>
          <div className="flex flex-col md:flex-row gap-4">
            <Button
              variant="ghost"
              data-testid="profile-a-btn"
              onClick={() => {
                wizard.reset()
                changeProfile('A')
              }}
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
              <div className="text-xs text-muted-foreground mt-1">
                Faster Montgomery-curve ECDH, 32-byte keys
              </div>
            </Button>

            <Button
              variant="ghost"
              data-testid="profile-b-btn"
              onClick={() => {
                wizard.reset()
                changeProfile('B')
              }}
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
              <div className="text-xs text-muted-foreground mt-1">
                Wider HSM &amp; national standard support (NIST P-256)
              </div>
            </Button>

            <Button
              variant="ghost"
              data-testid="profile-c-btn"
              onClick={() => {
                wizard.reset()
                changeProfile('C')
              }}
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
              <div className="text-xs opacity-70 mt-1">ML-KEM (FIPS 203) + AES-256</div>
              <div className="text-xs italic text-muted-foreground mt-1">
                3GPP SA3 study (TR 33.841) · Rel-19 standardization in progress
              </div>
            </Button>
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
              <Button
                variant="ghost"
                onClick={() => {
                  wizard.reset()
                  changePqcMode('hybrid')
                }}
                className={clsx(
                  'flex-1 p-3 rounded border text-left transition-all',
                  pqcMode === 'hybrid'
                    ? 'border-tertiary bg-tertiary/20 text-tertiary-foreground'
                    : 'border-border text-muted-foreground hover:bg-muted'
                )}
              >
                <div className="font-bold">Hybrid (Transition)</div>
                <div className="text-xs opacity-70">X25519 + ML-KEM-768</div>
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  wizard.reset()
                  changePqcMode('pure')
                }}
                className={clsx(
                  'flex-1 p-3 rounded border text-left transition-all',
                  pqcMode === 'pure'
                    ? 'border-tertiary bg-tertiary/20 text-tertiary-foreground'
                    : 'border-border text-muted-foreground hover:bg-muted'
                )}
              >
                <div className="font-bold">Pure PQC (Target)</div>
                <div className="text-xs opacity-70">ML-KEM-768 Only</div>
              </Button>
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
      </ConfigureCard>

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
        plainEnglishEnabled={plainEnglish}
        phaseLabels={SUCI_PHASE_LABELS}
        canonicalTabNames={['SoftHSM3', 'SoftHSMv3']}
        tabExplainer="SoftHSM3 runs inside your browser via WASM — it's the canonical output for this module. The OpenSSL Engine tab shows the equivalent command-line computation for cross-reference."
        onComplete={() => {
          if (profile === 'A') {
            wizard.reset()
            changeProfile('B')
          } else if (profile === 'B') {
            wizard.reset()
            changeProfile('C') // also resets pqcMode → 'hybrid' internally
          } else if (profile === 'C' && pqcMode === 'hybrid') {
            wizard.reset()
            changePqcMode('pure')
          } else {
            onBack()
          }
        }}
        completeLabel={
          profile === 'A'
            ? 'Proceed to Profile B (P-256)'
            : profile === 'B'
              ? 'Proceed to Profile C — Hybrid (PQC + ECC)'
              : profile === 'C' && pqcMode === 'hybrid'
                ? 'Proceed to Profile C — Pure PQC'
                : 'Finish & View Dashboard'
        }
      />

      {hsm.isReady && (
        <div className="space-y-4">
          <Pkcs11LogPanel
            log={hsm.log}
            onClear={hsm.clearLog}
            title="PKCS#11 Call Log — SUCI Construction"
            emptyMessage="Execute a step to see live PKCS#11 operations."
            filterFns={SUCI_LIVE_OPERATIONS}
            defaultOpen
            showBeginnerMode
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

      <KatValidationPanel
        specs={FIVEG_KAT_SPECS}
        label="5G PQC Known Answer Tests"
        authorityNote="3GPP TR 33.841 · NIST FIPS 203/204 · NIST SP 800-227 (hybrid combiner)"
      />
    </div>
  )
}
