// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useEffect, useRef } from 'react'
import { Shield, Loader2, Info, X, CheckCircle2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { openSSLService } from '@/services/crypto/OpenSSLService'
import { useModuleStore } from '@/store/useModuleStore'
import { useOpenSSLStore } from '@/components/OpenSSLStudio/store'
import { KNOWN_OIDS } from '@/services/crypto/oidMapping'

import { useCertProfile } from '@/hooks/useCertProfile'
import { AttributeTable } from '../../common/AttributeTable'
import type { X509Attribute } from '../../common/types'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { useHSM } from '@/hooks/useHSM'
import { LiveHSMToggle } from '@/components/shared/LiveHSMToggle'
import { Pkcs11LogPanel } from '@/components/shared/Pkcs11LogPanel'
import { HsmKeyInspector } from '@/components/shared/HsmKeyInspector'
import {
  hsm_generateMLDSAKeyPair,
  hsm_generateRSAKeyPair,
  hsm_generateECKeyPair,
  hsm_generateEdDSAKeyPair,
  hsm_generateSLHDSAKeyPair,
  hsm_extractKeyValue,
  hsm_sign,
  hsm_rsaSign,
  hsm_ecdsaSign,
  hsm_eddsaSign,
  hsm_slhdsaSign,
  CKP_SLH_DSA_SHA2_256S,
  CKP_SLH_DSA_SHA2_256F,
} from '@/wasm/softhsm'
import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'
import { Button } from '@/components/ui/button'
import { getCryptoErrorHint } from '@/utils/cryptoErrorHint'

// Import profile documentation
const profileDocs = import.meta.glob('../../../../data/x509_profiles/*_Overview.md', {
  query: '?raw',
  import: 'default',
})

// Profile to markdown mapping
const PROFILE_DOC_MAP: Record<string, string> = {
  'Cert-RootCA-Financial_ETSI_EN319412-2_2025.csv':
    '../../../../data/x509_profiles/ETSI_EN_319_412-2_Certificate_Overview.md',
  'Cert-RootCA-GeneralIT_CABF_TLSBR_2025.csv':
    '../../../../data/x509_profiles/CAB_Forum_TLS_Baseline_Requirements_Overview.md',
  'Cert-RootCA-Telecom_3GPP_TS33310_2025.csv':
    '../../../../data/x509_profiles/3GPP_TS_33.310_NDS_AF_Certificate_Overview.md',
}

interface RootCAGeneratorProps {
  onComplete: () => void
}

interface AlgorithmOption {
  id: string
  name: string
  group: 'Classic' | 'Quantum-Safe'
  genCommand: string
  keySizeLabel: string
}

// Parse numeric key size from label; returns 0 for non-numeric labels (e.g. "Category 5")
const parseKeySize = (label: string): number => {
  const n = parseInt(label, 10)
  return isNaN(n) ? 0 : n
}

// Derive NIST security level label from algorithm id and keySizeLabel
const getNistLevelLabel = (algoId: string, keySizeLabel: string): string | null => {
  const levelMap: Record<string, string> = {
    '1': 'NIST Level 1 (~AES-128 security)',
    '2': 'NIST Level 2 (~AES-128 target, Category 2)',
    '3': 'NIST Level 3 (~AES-192 security)',
    '5': 'NIST Level 5 (~AES-256 security)',
  }
  const catMatch = keySizeLabel.match(/Category (\d)/)
  if (catMatch) return levelMap[catMatch[1]] ?? null
  // Fallback from algo id
  if (algoId.includes('mldsa')) return 'NIST Level 5 (~AES-256 security)' // ML-DSA-87
  if (algoId.includes('slhdsa256')) return 'NIST Level 5 (~AES-256 security)'
  return null
}

const ALGORITHMS: AlgorithmOption[] = [
  {
    id: 'rsa',
    name: 'RSA',
    group: 'Classic',
    genCommand: 'openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:4096',
    keySizeLabel: '4096 bits',
  },
  {
    id: 'ecdsa',
    name: 'ECDSA (P-521)',
    group: 'Classic',
    genCommand: 'openssl genpkey -algorithm EC -pkeyopt ec_paramgen_curve:P-521',
    keySizeLabel: '521 bits',
  },
  {
    id: 'eddsa',
    name: 'EdDSA (Ed448)',
    group: 'Classic',
    genCommand: 'openssl genpkey -algorithm ED448',
    keySizeLabel: '448-bit curve',
  },
  {
    id: 'mldsa',
    name: 'ML-DSA-87 (FIPS 204)',
    group: 'Quantum-Safe',
    genCommand: 'openssl genpkey -algorithm ml-dsa-87',
    keySizeLabel: 'Category 5',
  },
  {
    id: 'slhdsa256s',
    name: 'SLH-DSA-SHA2-256s (FIPS 205)',
    group: 'Quantum-Safe',
    genCommand: 'openssl genpkey -algorithm slh-dsa-sha2-256s',
    keySizeLabel: 'Category 5 (small sig)',
  },
  {
    id: 'slhdsa256f',
    name: 'SLH-DSA-SHA2-256f (FIPS 205)',
    group: 'Quantum-Safe',
    genCommand: 'openssl genpkey -algorithm slh-dsa-sha2-256f',
    keySizeLabel: 'Category 5 (fast sign)',
  },
]

const INITIAL_ATTRIBUTES: X509Attribute[] = [
  {
    id: 'CN',
    label: 'Common Name',
    oid: 'CN',
    status: 'mandatory',
    value: '',
    enabled: true,
    placeholder: 'e.g., Root CA',
    description: 'The name of the Root CA.',
    elementType: 'SubjectRDN',
  },
]

const LIVE_OPERATIONS = [
  'C_GenerateKeyPair',
  'C_GetAttributeValue',
  'C_MessageSignInit',
  'C_SignMessage',
  'C_MessageSignFinal',
]

export const RootCAGenerator: React.FC<RootCAGeneratorProps> = ({ onComplete }) => {
  const [selectedKeyId, setSelectedKeyId] = useState<string>(`new-${ALGORITHMS[0].id}`)
  const [isGenerating, setIsGenerating] = useState(false)
  const [output, setOutput] = useState('')
  const [caCert, setCaCert] = useState<string | null>(null)
  const [showProfileInfo, setShowProfileInfo] = useState(false)
  const [profileDocContent, setProfileDocContent] = useState<string>('')
  const [isKeyGenerating, setIsKeyGenerating] = useState(false)
  const [generatedKeyInfo, setGeneratedKeyInfo] = useState<{
    id: string
    name: string
    algorithm: string
    log: string
    error?: boolean
  } | null>(null)

  // Live HSM mode — parallel PKCS#11 demonstration
  const hsm = useHSM()
  const liveKeyRef = useRef<{ pubHandle: number; privHandle: number } | null>(null)

  const filterProfileName = React.useCallback((name: string) => name.startsWith('Cert-RootCA'), [])

  const {
    selectedProfile,
    availableProfiles,
    attributes,
    profileMetadata,
    handleProfileSelect,
    handleAttributeChange,
    log: profileLog,
    setLog: setProfileLog,
  } = useCertProfile({
    initialAttributes: INITIAL_ATTRIBUTES,
    filterProfileName,
  })

  // Sync profile log to main output
  useEffect(() => {
    if (profileLog) {
      setOutput((prev) => prev + profileLog)
      setProfileLog('') // Clear after syncing
    }
  }, [profileLog, setProfileLog])

  const { artifacts, addKey, addCertificate } = useModuleStore()
  const { addFile } = useOpenSSLStore()

  // Filter for existing private keys
  const availableKeys = artifacts.keys.filter((k) => k.privateKey)

  // Profile handling is now managed by useCertProfile hook

  // Attribute change handling is now managed by useCertProfile hook

  const handleShowProfileInfo = async () => {
    if (!selectedProfile) return

    // eslint-disable-next-line security/detect-object-injection
    const docPath = PROFILE_DOC_MAP[selectedProfile]
    if (!docPath) {
      setProfileDocContent('No documentation available for this profile.')
      setShowProfileInfo(true)
      return
    }

    try {
      // eslint-disable-next-line security/detect-object-injection
      const loadDoc = profileDocs[docPath] as () => Promise<string>
      const content = await loadDoc()
      setProfileDocContent(content)
      setShowProfileInfo(true)
    } catch {
      setProfileDocContent('Error loading documentation.')
      setShowProfileInfo(true)
    }
  }

  const handleKeySourceSelect = async (id: string) => {
    setSelectedKeyId(id)
    setGeneratedKeyInfo(null)
    liveKeyRef.current = null
    if (!id.startsWith('new-')) return

    const algoId = id.replace('new-', '')
    const algo = ALGORITHMS.find((a) => a.id === algoId)
    if (!algo) return

    setIsKeyGenerating(true)
    const timestamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 14)
    const keyName = `pkiworkshop_ca_${timestamp}.key`
    const keyCmd = algo.genCommand + ` -out ${keyName}`
    setOutput(`$ ${keyCmd}\n`)

    try {
      const keyResult = await openSSLService.execute(keyCmd)
      if (keyResult.error) throw new Error(keyResult.error)

      const generatedKeyFile = keyResult.files.find((f) => f.name === keyName)
      if (!generatedKeyFile) throw new Error('Failed to generate root CA key')

      const keyContent = new TextDecoder().decode(generatedKeyFile.data)
      const keyId = `root-key-${Date.now()}`

      addKey({
        id: keyId,
        name: keyName,
        algorithm: algo.name,
        keySize: parseKeySize(algo.keySizeLabel),
        created: Date.now(),
        publicKey: '',
        privateKey: keyContent,
        description: 'Root CA Private Key',
      })

      addFile({
        name: keyName,
        type: 'key',
        content: generatedKeyFile.data,
        size: generatedKeyFile.data.length,
        timestamp: Date.now(),
      })

      setOutput((prev) => prev + 'Root CA private key generated and saved.\n')
      setSelectedKeyId(keyId)
      setGeneratedKeyInfo({
        id: keyId,
        name: keyName,
        algorithm: algo.name,
        log: `$ ${keyCmd}\nRoot CA private key generated and saved.`,
      })

      // HSM demo — parallel PKCS#11 key generation for all supported algorithms
      if (hsm.isReady && hsm.moduleRef.current) {
        try {
          const M = hsm.moduleRef.current as unknown as SoftHSMModule
          const hSession = hsm.hSessionRef.current
          let handles: { pubHandle: number; privHandle: number } | null = null
          let mechLabel = ''

          if (algoId === 'rsa') {
            handles = hsm_generateRSAKeyPair(M, hSession, 4096, false, 'sign')
            mechLabel = 'CKM_RSA_PKCS_KEY_PAIR_GEN, 4096-bit'
          } else if (algoId === 'ecdsa') {
            handles = hsm_generateECKeyPair(M, hSession, 'P-521', false, 'sign')
            mechLabel = 'CKM_EC_KEY_PAIR_GEN, P-521'
          } else if (algoId === 'eddsa') {
            handles = hsm_generateEdDSAKeyPair(M, hSession, 'Ed448')
            mechLabel = 'CKM_EC_EDWARDS_KEY_PAIR_GEN, Ed448'
          } else if (algoId === 'mldsa') {
            handles = hsm_generateMLDSAKeyPair(M, hSession, 87)
            mechLabel = 'CKM_ML_DSA_KEY_PAIR_GEN, CKP_ML_DSA_87'
          } else if (algoId === 'slhdsa256s') {
            handles = hsm_generateSLHDSAKeyPair(M, hSession, CKP_SLH_DSA_SHA2_256S)
            mechLabel = 'CKM_SLH_DSA_KEY_PAIR_GEN, CKP_SLH_DSA_SHA2_256S'
          } else if (algoId === 'slhdsa256f') {
            handles = hsm_generateSLHDSAKeyPair(M, hSession, CKP_SLH_DSA_SHA2_256F)
            mechLabel = 'CKM_SLH_DSA_KEY_PAIR_GEN, CKP_SLH_DSA_SHA2_256F'
          }

          if (handles) {
            liveKeyRef.current = handles
            const pubKeyBytes = hsm_extractKeyValue(M, hSession, handles.pubHandle)
            const algoFamily = algoId.startsWith('mldsa')
              ? 'ml-dsa'
              : algoId.startsWith('slh')
                ? 'slh-dsa'
                : algoId === 'rsa'
                  ? 'rsa'
                  : 'ecdsa'

            hsm.addKey({
              handle: handles.pubHandle,
              family: algoFamily,
              role: 'public',
              label: `${algo.name} Root Public`,
              generatedAt: new Date().toLocaleTimeString('en-US', { hour12: false }),
            })
            hsm.addKey({
              handle: handles.privHandle,
              family: algoFamily,
              role: 'private',
              label: `${algo.name} Root Private`,
              generatedAt: new Date().toLocaleTimeString('en-US', { hour12: false }),
            })

            setOutput(
              (prev) =>
                prev +
                `\n[PKCS#11] ${algo.name} key pair generated in SoftHSM3 WASM:\n` +
                `  C_GenerateKeyPair(${mechLabel})\n` +
                `  pubHandle=0x${handles.pubHandle.toString(16).padStart(8, '0')} · ${pubKeyBytes.length} bytes (CKA_VALUE)\n` +
                `  privHandle=0x${handles.privHandle.toString(16).padStart(8, '0')} · CKA_EXTRACTABLE=FALSE\n`
            )
          }
        } catch {
          // Non-fatal — log captured by createLoggingProxy
        }
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error'
      const hint = getCryptoErrorHint(msg)?.summary
      setOutput((prev) => prev + `Error generating key: ${msg}\n${hint ? `  → ${hint}\n` : ''}`)
      setGeneratedKeyInfo({
        id: '',
        name: keyName,
        algorithm: algo.name,
        log: `$ ${keyCmd}\nError: ${msg}`,
        error: true,
      })
    } finally {
      setIsKeyGenerating(false)
    }
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    setOutput((prev) => (prev ? prev + '\n--- Generating Root CA Certificate ---\n' : ''))
    setCaCert(null)

    try {
      let keyContent = ''
      let keyFile: { name: string; data: Uint8Array } | undefined
      let algoName = 'RSA'

      let keyId = ''
      let keyFilename = ''

      // 1. Generate Root Key
      if (selectedKeyId.startsWith('new-')) {
        const algoId = selectedKeyId.replace('new-', '')
        const currentAlgo = ALGORITHMS.find((a) => a.id === algoId)

        if (!currentAlgo) throw new Error('Invalid algorithm selected')
        algoName = currentAlgo.name

        const timestamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 14)
        const keyName = `pkiworkshop_ca_${timestamp}.key`
        keyFilename = keyName

        const keyCmd = currentAlgo.genCommand + ` -out ${keyName}`
        setOutput(`$ ${keyCmd}\n`)

        const keyResult = await openSSLService.execute(keyCmd)
        if (keyResult.error) throw new Error(keyResult.error)

        const generatedKeyFile = keyResult.files.find((f) => f.name === keyName)
        if (!generatedKeyFile) throw new Error('Failed to generate root key')

        keyContent = new TextDecoder().decode(generatedKeyFile.data)
        keyId = `root-key-${Date.now()}`

        addKey({
          id: keyId,
          name: keyName,
          algorithm: currentAlgo.name,
          keySize: parseKeySize(currentAlgo.keySizeLabel),
          created: Date.now(),
          publicKey: '',
          privateKey: keyContent,
          description: 'Root CA Private Key',
        })

        setOutput((prev) => prev + 'Root CA private key generated and saved.\n')
        keyFile = generatedKeyFile

        // Sync to OpenSSL Studio
        addFile({
          name: keyName,
          type: 'key',
          content: generatedKeyFile.data,
          size: generatedKeyFile.data.length,
          timestamp: Date.now(),
        })
      } else {
        // Using an existing key
        const existingKey = artifacts.keys.find((k) => k.id === selectedKeyId)
        if (!existingKey) throw new Error('Selected existing key not found.')

        keyContent = existingKey.privateKey || ''
        keyId = existingKey.id
        keyFilename = existingKey.name
        algoName = existingKey.algorithm

        setOutput((prev) => prev + `Using existing private key: ${existingKey.name}\n`)
        keyFile = { name: existingKey.name, data: new TextEncoder().encode(keyContent) }
      }

      if (!keyFile) throw new Error('Key file preparation failed')

      // Identify custom OIDs (numeric OIDs that are NOT in the known list)
      const customOids = attributes
        .filter(
          (a) =>
            a.enabled &&
            a.elementType === 'SubjectRDN' &&
            // eslint-disable-next-line security/detect-unsafe-regex
            /^\d+(\.\d+)+$/.test(a.id) &&
            !KNOWN_OIDS[a.id]
        )
        .map((a, index) => ({
          oid: a.id,
          name: `custom_oid_${index}`,
          value: a.value,
        }))

      // 2. Generate Self-Signed Root Certificate using Config
      let configContent = `
[ req ]
default_bits = 4096
prompt = no
default_md = sha256
distinguished_name = dn
x509_extensions = v3_ca
`

      if (customOids.length > 0) {
        configContent += `oid_section = new_oids\n`
      }

      const hasExtensions = attributes.some((a) => a.enabled && a.elementType === 'Extension')
      if (hasExtensions) {
        configContent += `req_extensions = v3_ca\n`
      }

      if (customOids.length > 0) {
        configContent += `\n[ new_oids ]\n`
        customOids.forEach((o) => {
          configContent += `${o.name} = ${o.oid}\n`
        })
      }

      // Sanitize attribute values for OpenSSL config interpolation
      const escapeConfigValue = (value: string): string => {
        return value.replace(/\\/g, '\\\\').replace(/\n/g, '').replace(/\r/g, '')
      }

      configContent += `\n[ dn ]\n`
      attributes
        .filter((a) => a.enabled && a.elementType === 'SubjectRDN')
        .forEach((a) => {
          const safeValue = escapeConfigValue(a.value)
          if (KNOWN_OIDS[a.id]) {
            configContent += `${KNOWN_OIDS[a.id]} = ${safeValue}\n`
            // eslint-disable-next-line security/detect-unsafe-regex
          } else if (/^\d+(\.\d+)+$/.test(a.id)) {
            const custom = customOids.find((o) => o.oid === a.id)
            if (custom) {
              configContent += `${custom.name} = ${safeValue}\n`
            }
          } else {
            configContent += `${a.id} = ${safeValue}\n`
          }
        })

      configContent += `\n[ v3_ca ]\n`
      // Ensure basic constraints for CA are present if not in profile, but usually profile handles it.
      // If profile is used, we trust the profile's extensions.
      // However, for a Root CA, we MUST have BasicConstraints=CA:TRUE.
      // Let's check if it's in the attributes.
      // Check if basicConstraints is already provided by the profile (checking label or id)
      const hasBasicConstraints = attributes.some(
        (a) => a.enabled && (a.id === 'basicConstraints' || a.label === 'basicConstraints')
      )
      if (!hasBasicConstraints) {
        configContent += `basicConstraints = critical,CA:TRUE\n`
        configContent += `keyUsage = critical, keyCertSign, cRLSign\n`
        configContent += `subjectKeyIdentifier = hash\n`
        configContent += `authorityKeyIdentifier = keyid:always\n`
      }
      setOutput(
        (prev) =>
          prev +
          `  basicConstraints = critical,CA:TRUE  (RFC 5280 §4.2.1.9)\n` +
          `    CA:TRUE marks this certificate as a Certificate Authority allowed to sign other certs.\n` +
          `    "critical" means any X.509 implementation that does not understand this extension MUST reject\n` +
          `    the certificate — it cannot be silently ignored. This prevents a non-CA cert from being\n` +
          `    misused as a trust anchor by an older or non-compliant implementation.\n` +
          `    Note: end-entity certificates set basicConstraints CA:FALSE but do NOT mark it critical.\n` +
          `    Marking CA:FALSE as critical would force all validators to understand the extension,\n` +
          `    which adds no security benefit and can break interoperability with older clients.\n\n` +
          (!hasBasicConstraints
            ? `  keyUsage = critical, keyCertSign, cRLSign\n` +
              `    keyCertSign: this CA is authorised to sign X.509 certificates.\n` +
              `    cRLSign: this CA is authorised to sign Certificate Revocation Lists (CRLs).\n\n` +
              `  subjectKeyIdentifier = hash\n` +
              `    A hash of this CA's public key, used by issued certs as authorityKeyIdentifier (AKI) to chain back to this CA.\n\n` +
              `  authorityKeyIdentifier = keyid:always\n` +
              `    For self-signed roots, AKI points to the root's own SKI. Required by RFC 5280 §4.2.1.1 and expected by many validators.\n\n`
            : '')
      )

      attributes
        .filter((a) => a.enabled && a.elementType === 'Extension')
        .forEach((a) => {
          configContent += `${a.label} = ${escapeConfigValue(a.value)}\n`
        })

      const configFile = {
        name: 'rootca.conf',
        data: new TextEncoder().encode(configContent),
      }

      setOutput((prev) => prev + `Generated Config:\n${configContent}\n`)

      // Educational note: Root CA key strength rationale
      setOutput(
        (prev) =>
          prev +
          `  Root CAs use stronger keys (RSA-4096, P-521, ML-DSA-87) because they have longer lifetimes and are harder to replace than end-entity certificates.\n\n`
      )

      // Detect PQC algorithm and add educational note about default_md
      const currentAlgoId = selectedKeyId.startsWith('new-')
        ? selectedKeyId.replace('new-', '')
        : ''
      const isPqcAlgo = currentAlgoId.startsWith('mldsa') || currentAlgoId.startsWith('slhdsa')
      if (isPqcAlgo) {
        const algoObj = ALGORITHMS.find((a) => a.id === currentAlgoId)
        setOutput(
          (prev) =>
            prev +
            `  Note: default_md is ignored by PQC algorithms. ${algoObj?.name || 'This PQC algorithm'} uses its own internal hash function (SHAKE256 for ML-DSA, SHA2/SHAKE for SLH-DSA variants) defined within the algorithm specification. The config value has no effect on the actual signature.\n\n`
        )
      }

      // We need to use the same timestamp for the cert if we want them to match, or generate a new one?
      // Usually they are generated together. Let's reuse the timestamp if we generated a key, or generate new if using existing?
      // But here we are in the flow where we just generated the key (if selectedKeyId starts with new).
      // If we used an existing key, we didn't generate a timestamp yet.

      // Wait, if we used an existing key, keyName is not defined in this scope?
      // keyName is defined inside the if block.
      // We need to handle the filename for the key in the cert command.

      const timestamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 14)
      const certName = `pkiworkshop_ca_${timestamp}.crt`

      const certCmd = `openssl req -x509 -new -nodes -key ${keyFilename} -sha256 -days 3650 -out ${certName} -config rootca.conf`

      setOutput((prev) => prev + `$ ${certCmd}\n`)

      // Validity note (S2-F): explain why 3650 days is used for roots
      setOutput(
        (prev) =>
          prev +
          `  Validity: 3650 days (~10 years). Root CAs intentionally have long lifetimes because\n` +
          `  replacing them requires re-issuing all subordinate CAs and end-entity certs that chain to them.\n` +
          `  Offline/air-gapped roots may run 20–30 years. Online issuing CAs are typically 3–10 years.\n\n`
      )

      // PQC note about -sha256 (S2-E): placed after the command so context is clear
      if (isPqcAlgo) {
        setOutput(
          (prev) =>
            prev +
            `  Note: -sha256 in the command above is ignored for PQC algorithms. The hash function is\n` +
            `  defined within the algorithm spec itself and cannot be overridden by OpenSSL flags.\n\n`
        )
      }

      // Add 30s timeout
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('OpenSSL operation timed out (30s)')), 30000)
      )

      const certResult = await Promise.race([
        openSSLService.execute(certCmd, [keyFile, configFile]),
        timeoutPromise,
      ])
      if (certResult.error) throw new Error(certResult.error)

      const certFile = certResult.files.find((f) => f.name === certName)
      if (!certFile) {
        throw new Error(`Failed to generate Root CA Certificate: ${certName}`)
      }

      if (certFile) {
        const certContent = new TextDecoder().decode(certFile.data)
        setCaCert(certContent)

        const cn = attributes.find((a) => a.id === 'CN')?.value || 'Unknown'
        const subj = `/CN=${cn}` // Simplified for metadata

        // Extract actual serial number from the generated certificate
        let actualSerial = '01'
        const serialResult = await openSSLService.execute(
          `openssl x509 -in ${certName} -serial -noout`,
          [{ name: certName, data: certFile.data }]
        )
        if (!serialResult.error) {
          const serialMatch = serialResult.stdout.match(/serial=([0-9A-Fa-f]+)/i)
          if (serialMatch) actualSerial = serialMatch[1].toUpperCase()
        }

        addCertificate({
          id: `root-cert-${Date.now()}`,
          name: certName,
          pem: certContent,
          created: Date.now(),
          metadata: {
            subject: subj,
            issuer: subj, // Self-signed
            serial: actualSerial,
            notBefore: Date.now(),
            notAfter: Date.now() + 3650 * 24 * 60 * 60 * 1000,
          },
          tags: ['root', 'ca', algoName],
          // keyPairId links this certificate to its signing key so Step 3 (CertSigner) can
          // automatically find the correct CA certificate when you select the CA key.
          // Always generate the Root CA key and certificate together in this step.
          keyPairId: keyFile?.name === keyFilename ? keyId : undefined,
        })

        // Sync to OpenSSL Studio
        addFile({
          name: certName,
          type: 'cert',
          content: certContent,
          size: certContent.length,
          timestamp: Date.now(),
        })

        // Also sync the config file
        addFile({
          name: 'rootca.conf',
          type: 'config',
          content: configFile.data,
          size: configFile.data.length,
          timestamp: Date.now(),
        })

        setOutput(
          (prev) =>
            prev +
            'Root CA certificate generated and saved successfully!\n' +
            '  The certificate and its signing key are now linked internally (keyPairId).\n' +
            '  In Step 3, select this CA key and the matching certificate will be found automatically.\n'
        )

        // HSM demo — certificate signing via PKCS#11 when live mode active
        if (hsm.isReady && hsm.moduleRef.current && liveKeyRef.current) {
          try {
            const M = hsm.moduleRef.current as unknown as SoftHSMModule
            const hSession = hsm.hSessionRef.current
            const cn = attributes.find((a) => a.id === 'CN')?.value || 'Root CA'
            const tbsPayload = `TBSCertificate(subject=CN=${cn},algorithm=${algoName})`

            // Dispatch to the correct signing function based on algorithm
            const currentAlgoId = selectedKeyId.startsWith('new-')
              ? selectedKeyId.replace('new-', '')
              : ''
            let sigBytes: Uint8Array
            let mechLabel: string

            if (currentAlgoId === 'rsa') {
              sigBytes = hsm_rsaSign(M, hSession, liveKeyRef.current.privHandle, tbsPayload)
              mechLabel = 'CKM_SHA256_RSA_PKCS'
            } else if (currentAlgoId === 'ecdsa') {
              sigBytes = hsm_ecdsaSign(M, hSession, liveKeyRef.current.privHandle, tbsPayload)
              mechLabel = 'CKM_ECDSA_SHA256'
            } else if (currentAlgoId === 'eddsa') {
              sigBytes = hsm_eddsaSign(M, hSession, liveKeyRef.current.privHandle, tbsPayload)
              mechLabel = 'CKM_EDDSA'
            } else if (currentAlgoId === 'slhdsa256s' || currentAlgoId === 'slhdsa256f') {
              sigBytes = hsm_slhdsaSign(M, hSession, liveKeyRef.current.privHandle, tbsPayload)
              mechLabel = 'CKM_SLH_DSA'
            } else {
              // ML-DSA (default)
              sigBytes = hsm_sign(M, hSession, liveKeyRef.current.privHandle, tbsPayload)
              mechLabel = 'CKM_ML_DSA'
            }

            setOutput(
              (prev) =>
                prev +
                `\n[PKCS#11] CA certificate signing demonstrated via SoftHSM3:\n` +
                `  SignInit(${mechLabel})\n` +
                `  Sign("${cn}") → ${sigBytes.length} bytes\n` +
                `  (In production: signs the DER-encoded TBSCertificate bytes)\n`
            )
          } catch {
            // Non-fatal — log captured by createLoggingProxy
          }
        }

        onComplete()
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const hint = getCryptoErrorHint(errorMessage)?.summary
      setOutput((prev) => prev + `Error: ${errorMessage}\n${hint ? `  → ${hint}\n` : ''}`)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Live HSM Toggle */}
      <LiveHSMToggle hsm={hsm} operations={LIVE_OPERATIONS} className="mb-4" />

      {/* Row 1: Step 1 & Step 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Step 1: Key Configuration */}
        <div className="bg-card/80 border border-border rounded-2xl p-5">
          <div className="mb-4 border-b border-border pb-3">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-3">
              <span className="text-primary font-mono text-xl">01</span>
              <span className="text-muted-foreground">|</span>
              ROOT CA KEY
            </h3>
            <p className="text-xs text-muted-foreground mt-1 ml-11">
              Generate strong keypair • Select algorithm • Long-term security
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <FilterDropdown
                label="Key Type"
                items={[
                  ...ALGORITHMS.map((algo) => ({
                    id: `new-${algo.id}`,
                    label: `${algo.name} (${algo.keySizeLabel})`,
                  })),
                  ...availableKeys.map((k) => ({
                    id: k.id,
                    label: `${k.name} (${k.algorithm})`,
                  })),
                ]}
                selectedId={selectedKeyId}
                onSelect={handleKeySourceSelect}
                noContainer
                className="w-full"
              />
            </div>

            {isKeyGenerating && (
              <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                <Loader2 size={14} className="animate-spin text-primary" />
                Generating key…
              </div>
            )}
            {generatedKeyInfo && !isKeyGenerating && (
              <div className="mt-3 p-3 bg-muted/30 rounded-lg border border-border/30 text-xs space-y-2">
                <div
                  className={`flex items-center gap-2 font-medium ${generatedKeyInfo.error ? 'text-status-error' : 'text-status-success'}`}
                >
                  <CheckCircle2 size={14} />{' '}
                  {generatedKeyInfo.error ? 'Key generation failed' : 'Key ready'}
                </div>
                <pre className="text-muted-foreground font-mono whitespace-pre-wrap break-all">
                  {generatedKeyInfo.log}
                </pre>
              </div>
            )}

            {(() => {
              if (!selectedKeyId.startsWith('new-')) return null
              const algoId = selectedKeyId.replace('new-', '')
              const algo = ALGORITHMS.find((a) => a.id === algoId)
              if (!algo || algo.group !== 'Quantum-Safe') return null
              const level = getNistLevelLabel(algo.id, algo.keySizeLabel)
              if (!level) return null
              return (
                <p className="text-xs text-muted-foreground mt-1">
                  Security: <span className="text-primary font-medium">{level}</span>
                </p>
              )
            })()}

            <p className="text-xs text-muted-foreground">
              Root CAs use larger key sizes (RSA-4096, P-521, ML-DSA-87) because they have longer
              lifetimes and are harder to replace than end-entity certificates.
            </p>
          </div>
        </div>

        {/* Step 2: Profile Selection */}
        <div className="bg-card/80 border border-border rounded-2xl p-5">
          <div className="mb-4 border-b border-border pb-3">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-3">
              <span className="text-primary font-mono text-xl">02</span>
              <span className="text-muted-foreground">|</span>
              SELECT PROFILE
            </h3>
            <p className="text-xs text-muted-foreground mt-1 ml-11">
              Load CA template • Apply policies • Set constraints
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Certificate Profile</span>
                {selectedProfile && (
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={handleShowProfileInfo}
                    className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                    title="View profile documentation"
                  >
                    <Info size={16} />
                    Info
                  </Button>
                )}
              </div>
              <FilterDropdown
                items={availableProfiles.map((profile) => ({
                  id: profile,
                  label: profile
                    .replace('Cert-', '')
                    .replace(/_\d{8}/, '')
                    .replace('.csv', ''),
                }))}
                selectedId={selectedProfile}
                onSelect={handleProfileSelect}
                defaultLabel="-- Select a Profile (optional) --"
                noContainer
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Profiles define end-entity certificate attributes (TLS Server, IoT, etc.). Root CAs
                are self-signed trust anchors — leaving the profile blank is correct for most Root
                CA use cases. Only load a profile if your PKI policy mandates specific Root CA
                extensions.
              </p>
            </div>

            {profileMetadata && (
              <div className="text-xs space-y-2 p-3 bg-muted/30 rounded border border-border/30">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Industry:</span>
                  <span className="text-foreground">{profileMetadata.industry}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Standard:</span>
                  <span className="text-foreground">{profileMetadata.standard}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Step 3 (Attributes) */}
      <div className="bg-card/80 border border-border rounded-2xl p-5">
        <div className="mb-4 border-b border-border pb-3">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold">
              3
            </span>
            BUILD CERTIFICATE
          </h3>
          <p className="text-xs text-muted-foreground mt-1 ml-8">
            Define Subject DN • Add Extensions • Configure Root CA
          </p>
        </div>

        <AttributeTable
          attributes={attributes}
          onAttributeChange={handleAttributeChange}
          showSource={false}
        />
      </div>

      {/* Row 3: Step 4 & Output */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Step 4: Generate */}
        <div className="bg-card/80 border border-border rounded-2xl p-5 h-fit">
          <div className="mb-4 border-b border-border pb-3">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold">
                4
              </span>
              SELF-SIGN ROOT CA
            </h3>
            <p className="text-xs text-muted-foreground mt-1 ml-8">
              Create self-signed cert • Set validity period • Establish trust anchor
            </p>
          </div>

          <Button
            variant="gradient"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 font-bold rounded transition-colors disabled:opacity-50"
          >
            {isGenerating ? <Loader2 className="animate-spin" /> : <Shield />}
            Generate Root CA
          </Button>
        </div>

        {/* Output Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Console Output</h3>
          <div className="bg-muted rounded-lg p-4 font-mono text-xs h-[300px] overflow-y-auto custom-scrollbar border border-border">
            <pre className="text-foreground whitespace-pre-wrap break-all break-words max-w-full">
              {output}
            </pre>
            {caCert && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-muted-foreground mb-2">Generated Root Certificate:</p>
                <pre className="text-foreground whitespace-pre-wrap break-all break-words max-w-full">
                  {caCert}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile Info Modal */}
      {showProfileInfo && (
        // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="profile-doc-title"
          className="fixed inset-0 embed-backdrop bg-background/80 flex items-start justify-center z-50 pt-8"
          onClick={() => setShowProfileInfo(false)}
          onKeyDown={(e) => e.key === 'Escape' && setShowProfileInfo(false)}
        >
          {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
          <div
            role="document"
            tabIndex={-1}
            className="glass-panel p-4 max-w-4xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar flex flex-col"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.key === 'Escape' && setShowProfileInfo(false)}
          >
            <div className="flex items-center justify-between mb-3 flex-shrink-0">
              <h3 id="profile-doc-title" className="text-lg font-bold flex items-center gap-2">
                <Info className="text-primary" size={20} />
                Profile Documentation
              </h3>
              <Button
                variant="ghost"
                onClick={() => setShowProfileInfo(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Close"
              >
                <X size={20} />
              </Button>
            </div>
            <div className="text-sm max-w-none flex-1 overflow-y-auto">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{profileDocContent}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}

      {hsm.isReady && (
        <div className="space-y-4">
          <Pkcs11LogPanel
            log={hsm.log}
            onClear={hsm.clearLog}
            defaultOpen={true}
            title="PKCS#11 Call Log — CA Key & Signing Operations"
            emptyMessage="Run key generation or certificate creation to see PKCS#11 calls."
            filterFns={LIVE_OPERATIONS}
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
