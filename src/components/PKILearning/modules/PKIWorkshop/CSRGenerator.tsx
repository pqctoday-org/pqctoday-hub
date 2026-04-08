// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useEffect } from 'react'
import { FileSignature, Loader2, Info, X, CheckCircle2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { openSSLService } from '@/services/crypto/OpenSSLService'
import { useModuleStore } from '@/store/useModuleStore'
import { useOpenSSLStore } from '@/components/OpenSSLStudio/store'
import { KNOWN_OIDS } from '@/services/crypto/oidMapping'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { Input } from '@/components/ui/input'

// Import CSR profiles using Vite's glob import
const csrProfiles = import.meta.glob('../../../../data/x509_profiles/CSR*.csv', {
  query: '?raw',
  import: 'default',
})

// Import profile documentation
const profileDocs = import.meta.glob('../../../../data/x509_profiles/*_Overview.md', {
  query: '?raw',
  import: 'default',
})

// Profile to markdown mapping
const PROFILE_DOC_MAP: Record<string, string> = {
  'CSR-Financial_ETSI_EN319412-2_2025.csv':
    '../../../../data/x509_profiles/ETSI_EN_319_412-2_Certificate_Overview.md',
  'CSR-GeneralIT_CABF_TLSBR_2025.csv':
    '../../../../data/x509_profiles/CAB_Forum_TLS_Baseline_Requirements_Overview.md',
  'CSR-Telecom_3GPP_TS33310_2025.csv':
    '../../../../data/x509_profiles/3GPP_TS_33.310_NDS_AF_Certificate_Overview.md',
  'CSR-Telecom_3GPP_TS33310_04072026.csv':
    '../../../../data/x509_profiles/3GPP_TS_33.310_NDS_AF_Certificate_Overview.md',
}

interface CSRGeneratorProps {
  onComplete: () => void
}

interface AlgorithmOption {
  id: string
  name: string
  group: 'Classic' | 'Quantum-Safe'
  genCommand: string
  keySizeLabel: string
}

interface X509Attribute {
  id: string // e.g., 'CN', 'O'
  label: string
  oid: string // OpenSSL config name, e.g., 'commonName'
  status: 'mandatory' | 'recommended' | 'optional'
  value: string
  enabled: boolean
  placeholder: string
  description: string
  elementType: string
}

interface ProfileMetadata {
  industry: string
  standard: string
  date: string
}

// Parse numeric key size from label; returns 0 for non-numeric labels (e.g. "Category 2")
const parseKeySize = (label: string): number => {
  const n = parseInt(label, 10)
  return isNaN(n) ? 0 : n
}

const ALGORITHMS: AlgorithmOption[] = [
  {
    id: 'rsa',
    name: 'RSA (2048 bits)',
    group: 'Classic',
    genCommand: 'openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048',
    keySizeLabel: '2048 bits',
  },
  {
    id: 'ecdsa',
    name: 'ECDSA (P-256)',
    group: 'Classic',
    genCommand: 'openssl genpkey -algorithm EC -pkeyopt ec_paramgen_curve:P-256',
    keySizeLabel: '256 bits',
  },
  {
    id: 'eddsa',
    name: 'EdDSA (Ed25519)',
    group: 'Classic',
    genCommand: 'openssl genpkey -algorithm ED25519',
    keySizeLabel: '256 bits',
  },
  {
    id: 'mldsa',
    name: 'ML-DSA-44 (FIPS 204)',
    group: 'Quantum-Safe',
    genCommand: 'openssl genpkey -algorithm ml-dsa-44',
    keySizeLabel: 'Category 2',
  },
  {
    id: 'mldsa65',
    name: 'ML-DSA-65 (FIPS 204)',
    group: 'Quantum-Safe',
    genCommand: 'openssl genpkey -algorithm ml-dsa-65',
    keySizeLabel: 'Category 3',
  },
  {
    id: 'slhdsa128s',
    name: 'SLH-DSA-SHA2-128s (FIPS 205)',
    group: 'Quantum-Safe',
    genCommand: 'openssl genpkey -algorithm slh-dsa-sha2-128s',
    keySizeLabel: 'Category 1 (small sig)',
  },
  {
    id: 'slhdsa128f',
    name: 'SLH-DSA-SHA2-128f (FIPS 205)',
    group: 'Quantum-Safe',
    genCommand: 'openssl genpkey -algorithm slh-dsa-sha2-128f',
    keySizeLabel: 'Category 1 (fast sign)',
  },
  {
    id: 'slhdsa192s',
    name: 'SLH-DSA-SHA2-192s (FIPS 205)',
    group: 'Quantum-Safe',
    genCommand: 'openssl genpkey -algorithm slh-dsa-sha2-192s',
    keySizeLabel: 'Category 3 (small sig)',
  },
  {
    id: 'slhdsa192f',
    name: 'SLH-DSA-SHA2-192f (FIPS 205)',
    group: 'Quantum-Safe',
    genCommand: 'openssl genpkey -algorithm slh-dsa-sha2-192f',
    keySizeLabel: 'Category 3 (fast sign)',
  },
]

const INITIAL_ATTRIBUTES: X509Attribute[] = [
  {
    id: 'CN',
    label: 'Common Name',
    oid: 'CN',
    status: 'mandatory',
    value: 'example.com',
    enabled: true,
    placeholder: 'e.g., example.com',
    description: 'The fully qualified domain name (FQDN) of your server.',
    elementType: 'SubjectRDN',
  },
  {
    id: 'O',
    label: 'Organization',
    oid: 'O',
    status: 'recommended',
    value: 'Example Org',
    enabled: true,
    placeholder: 'e.g., Example Corp',
    description: 'Legal name of the organisation requesting the certificate.',
    elementType: 'SubjectRDN',
  },
  {
    id: 'C',
    label: 'Country',
    oid: 'C',
    status: 'recommended',
    value: 'US',
    enabled: true,
    placeholder: 'ISO 3166-1 alpha-2, e.g., US',
    description: 'Two-letter ISO 3166-1 country code of the organisation.',
    elementType: 'SubjectRDN',
  },
]

export const CSRGenerator: React.FC<CSRGeneratorProps> = ({ onComplete }) => {
  const { artifacts, addKey, addCSR } = useModuleStore()
  const { addFile } = useOpenSSLStore()

  const [attributes, setAttributes] = useState<X509Attribute[]>(INITIAL_ATTRIBUTES)
  // const [selectedAlgoId, setSelectedAlgoId] = useState<string>('rsa');
  const [selectedKeyId, setSelectedKeyId] = useState<string>(`new-${ALGORITHMS[0].id}`)
  const [isGenerating, setIsGenerating] = useState(false)
  const [output, setOutput] = useState('')
  const [csr, setCsr] = useState<string | null>(null)
  const [selectedProfile, setSelectedProfile] = useState<string>('')
  const [availableProfiles, setAvailableProfiles] = useState<string[]>([])
  const [profileMetadata, setProfileMetadata] = useState<ProfileMetadata | null>(null)
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

  // Filter keys based on selected algorithm if not 'new'
  const availableKeys = artifacts.keys

  useEffect(() => {
    // Extract filenames from the glob import
    const profiles = Object.keys(csrProfiles)
      .map((path) => {
        // Extract filename from path: ../../../../data/x509_profiles/CSR-Financial.csv -> CSR-Financial.csv
        return path.split('/').pop() || ''
      })
      .filter((name) => name.startsWith('CSR') && name.endsWith('.csv'))
    setAvailableProfiles(profiles)
  }, [])

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      // eslint-disable-next-line security/detect-object-injection
      const char = line[i]

      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim())
    return result
  }

  const handleProfileSelect = async (filename: string) => {
    setSelectedProfile(filename)
    setProfileMetadata(null)
    if (!filename) return

    try {
      setOutput((prev) => prev + `Loading profile: ${filename}...\n`)

      // Find the path matching the filename
      const path = Object.keys(csrProfiles).find((p) => p.endsWith(filename))
      if (!path) throw new Error('Profile path not found')

      // Load content
      // eslint-disable-next-line security/detect-object-injection
      const loadProfile = csrProfiles[path] as () => Promise<string>
      const content = await loadProfile()

      const lines = content.split('\n').filter((line) => line.trim() !== '')
      if (lines.length < 2) throw new Error('Invalid CSV format')

      // Parse Header to find column indices
      const headers = parseCSVLine(lines[0])
      const colMap = new Map<string, number>()
      headers.forEach((h, i) => colMap.set(h.trim(), i))

      // Helper to get value by column name
      const getVal = (row: string[], colName: string) => {
        const idx = colMap.get(colName)
        // eslint-disable-next-line security/detect-object-injection
        return idx !== undefined && idx < row.length ? row[idx] : ''
      }

      // Parse metadata
      const industry = getVal(parseCSVLine(lines[1]), 'Industry') || 'Unknown'
      const standard = getVal(parseCSVLine(lines[1]), 'Standard') || 'Unknown'
      const date = getVal(parseCSVLine(lines[1]), 'StandardDate') || 'Unknown'
      setProfileMetadata({ industry, standard, date })

      // Parse Attributes
      const newAttributes: X509Attribute[] = []

      // Skip header
      for (let i = 1; i < lines.length; i++) {
        // eslint-disable-next-line security/detect-object-injection
        const row = parseCSVLine(lines[i])
        const elementType = getVal(row, 'ElementType')

        // Only process SubjectRDN and Extension for now as editable attributes
        if (elementType === 'SubjectRDN' || elementType === 'Extension') {
          const name = getVal(row, 'Name')
          const example = getVal(row, 'ExampleValue')
          const description = getVal(row, 'AllowedValuesOrUsage')

          const oid = getVal(row, 'OID') // Using OID column for ID/OID mapping
          // Some rows might use 'name' as the OID alias (e.g. commonName)
          const id =
            name === 'commonName'
              ? 'CN'
              : name === 'countryName'
                ? 'C'
                : name === 'organizationName'
                  ? 'O'
                  : name === 'organizationalUnitName'
                    ? 'OU'
                    : name === 'stateOrProvinceName'
                      ? 'ST'
                      : name === 'localityName'
                        ? 'L'
                        : name === 'emailAddress'
                          ? 'emailAddress'
                          : oid

          const label = name // Use Name column as label
          const criticalVal = getVal(row, 'Critical').toUpperCase()
          const critical =
            elementType === 'SubjectRDN'
              ? criticalVal === '' || criticalVal === 'TRUE'
              : criticalVal === 'TRUE'

          newAttributes.push({
            id: id,
            label: label,
            oid: oid,
            status: critical ? 'mandatory' : 'optional',
            value: example, // Default value from profile
            enabled: critical,
            placeholder: `e.g., ${example}`,
            description: description,
            elementType: elementType,
          })
        }
      }

      setAttributes(newAttributes)
      setOutput((prev) => prev + `Profile loaded: ${industry} - ${standard} (${date})\n`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setOutput((prev) => prev + `Error loading profile: ${errorMessage}\n`)
    }
  }

  const handleAttributeChange = (
    id: string,
    field: keyof X509Attribute,
    value: string | boolean
  ) => {
    setAttributes((prev) =>
      prev.map((attr) => {
        if (attr.id === id) {
          return { ...attr, [field]: value }
        }
        return attr
      })
    )
  }

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

  // Sanitize attribute values for OpenSSL config file interpolation
  const escapeConfigValue = (value: string): string => {
    return value.replace(/\\/g, '\\\\').replace(/\n/g, '').replace(/\r/g, '')
  }

  const handleKeySourceSelect = async (id: string) => {
    setSelectedKeyId(id)
    setGeneratedKeyInfo(null)
    if (!id.startsWith('new-')) return

    const algoId = id.replace('new-', '')
    const algo = ALGORITHMS.find((a) => a.id === algoId)
    if (!algo) return

    setIsKeyGenerating(true)
    const timestamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 14)
    const keyName = `pkiworkshop_priv_${timestamp}.key`
    const keyCmd = algo.genCommand + ` -out ${keyName}`
    setOutput(`$ ${keyCmd}\n`)

    try {
      const keyResult = await openSSLService.execute(keyCmd)
      if (keyResult.error) throw new Error(keyResult.error)

      const generatedKeyFile = keyResult.files.find((f) => f.name === keyName)
      if (!generatedKeyFile) throw new Error('Failed to generate private key')

      const keyContent = new TextDecoder().decode(generatedKeyFile.data)
      const keyId = `key-${Date.now()}`

      addKey({
        id: keyId,
        name: keyName,
        algorithm: algo.name,
        keySize: parseKeySize(algo.keySizeLabel),
        created: Date.now(),
        publicKey: '',
        privateKey: keyContent,
      })

      addFile({
        name: keyName,
        type: 'key',
        content: generatedKeyFile.data,
        size: generatedKeyFile.data.length,
        timestamp: Date.now(),
      })

      setOutput((prev) => prev + 'Private key generated and saved.\n')
      setSelectedKeyId(keyId)
      setGeneratedKeyInfo({
        id: keyId,
        name: keyName,
        algorithm: algo.name,
        log: `$ ${keyCmd}\nPrivate key generated and saved.`,
      })
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error'
      setOutput((prev) => prev + `Error generating key: ${msg}\n`)
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
    setOutput((prev) => (prev ? prev + '\n--- Generating CSR ---\n' : ''))
    setCsr(null)

    try {
      let keyId = selectedKeyId
      let keyContent = ''
      let keyFile: { name: string; data: Uint8Array } | undefined

      // 1. Get or Generate Private Key
      if (selectedKeyId.startsWith('new-')) {
        const algoId = selectedKeyId.replace('new-', '')
        const currentAlgo = ALGORITHMS.find((a) => a.id === algoId)

        if (!currentAlgo) throw new Error('Invalid algorithm selected')

        const timestamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 14)
        const keyName = `pkiworkshop_priv_${timestamp}.key`

        const keyCmd = currentAlgo.genCommand + ` -out ${keyName}`
        setOutput(`$ ${keyCmd}\n`)

        const keyResult = await openSSLService.execute(keyCmd)
        if (keyResult.error) throw new Error(keyResult.error)

        const generatedKeyFile = keyResult.files.find((f) => f.name === keyName)
        if (!generatedKeyFile) throw new Error('Failed to generate private key')

        keyContent = new TextDecoder().decode(generatedKeyFile.data)
        keyId = `key-${Date.now()}`

        addKey({
          id: keyId,
          name: keyName,
          algorithm: currentAlgo.name,
          keySize: parseKeySize(currentAlgo.keySizeLabel),
          created: Date.now(),
          publicKey: '',
          privateKey: keyContent,
        })

        setOutput((prev) => prev + 'Private key generated and saved.\n')
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
        const existingKey = availableKeys.find((k) => k.id === selectedKeyId)
        if (!existingKey || !existingKey.privateKey) throw new Error('Selected key not found')

        keyContent = existingKey.privateKey
        setOutput((prev) => prev + `Using existing private key: ${existingKey.name}\n`)

        keyFile = {
          name: existingKey.name,
          data: new TextEncoder().encode(keyContent),
        }
      }

      if (!keyFile) throw new Error('Key file preparation failed')

      // 2. Generate CSR using Config File
      // We need to construct an OpenSSL config file to properly handle extensions and RDNs

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

      let configContent = `
[ req ]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
`

      if (customOids.length > 0) {
        configContent += `oid_section = new_oids\n`
      }

      // Add req_extensions if there are any extensions enabled
      const hasExtensions = attributes.some((a) => a.enabled && a.elementType === 'Extension')
      if (hasExtensions) {
        configContent += `req_extensions = req_ext\n`
      }

      if (customOids.length > 0) {
        configContent += `\n[ new_oids ]\n`
        customOids.forEach((o) => {
          configContent += `${o.name} = ${o.oid}\n`
        })
      }

      configContent += `\n[ dn ]\n`

      // Add Subject RDNs
      attributes
        .filter((a) => a.enabled && a.elementType === 'SubjectRDN')
        .forEach((a) => {
          const safeValue = escapeConfigValue(a.value)
          if (KNOWN_OIDS[a.id]) {
            // Known OID: use the standard name (e.g. organizationIdentifier)
            configContent += `${KNOWN_OIDS[a.id]} = ${safeValue}\n`
            // eslint-disable-next-line security/detect-unsafe-regex
          } else if (/^\d+(\.\d+)+$/.test(a.id)) {
            // Custom numeric OID: use the alias defined in new_oids
            const custom = customOids.find((o) => o.oid === a.id)
            if (custom) {
              configContent += `${custom.name} = ${safeValue}\n`
            }
          } else {
            // Standard name (CN, O, etc.)
            configContent += `${a.id} = ${safeValue}\n`
          }
        })

      if (hasExtensions) {
        configContent += `\n[ req_ext ]\n`
        attributes
          .filter((a) => a.enabled && a.elementType === 'Extension')
          .forEach((a) => {
            configContent += `${a.label} = ${escapeConfigValue(a.value)}\n`
          })
      }

      const configFile = {
        name: 'csr.conf',
        data: new TextEncoder().encode(configContent),
      }

      setOutput((prev) => prev + `Generated Config:\n${configContent}\n`)

      // Detect PQC algorithm and add educational note about default_md
      // Works for both freshly generated keys and existing keys selected from artifacts
      let isPqcAlgo = false
      let pqcAlgoName = ''
      if (selectedKeyId.startsWith('new-')) {
        const algoId = selectedKeyId.replace('new-', '')
        isPqcAlgo = algoId.startsWith('mldsa') || algoId.startsWith('slhdsa')
        const algoObj = ALGORITHMS.find((a) => a.id === algoId)
        pqcAlgoName = algoObj?.name || 'this PQC algorithm'
      } else {
        const existingKey = availableKeys.find((k) => k.id === selectedKeyId)
        if (existingKey) {
          const algoLower = existingKey.algorithm.toLowerCase()
          isPqcAlgo = algoLower.includes('ml-dsa') || algoLower.includes('slh-dsa')
          pqcAlgoName = existingKey.algorithm
        }
      }
      if (isPqcAlgo) {
        setOutput(
          (prev) =>
            prev +
            `  Note: default_md is ignored by PQC algorithms. ${pqcAlgoName} uses its own internal hash function (SHAKE256 for ML-DSA, SHA2/SHAKE for SLH-DSA variants) defined within the algorithm specification. The config value has no effect on the actual signature.\n\n`
        )
      }

      const timestamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 14)
      const csrName = `pkiworkshop_${timestamp}.csr`
      const keyFilename = keyFile?.name || 'private.key'

      if (keyFile.data.length === 0) {
        throw new Error('Generated private key is empty')
      }

      const csrCmd = `openssl req -new -key ${keyFilename} -out ${csrName} -config csr.conf`

      setOutput((prev) => prev + `$ ${csrCmd}\n`)

      // Add 30s timeout
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('OpenSSL operation timed out (30s)')), 30000)
      )

      const csrResult = await Promise.race([
        openSSLService.execute(csrCmd, [keyFile, configFile]),
        timeoutPromise,
      ])
      if (csrResult.error) throw new Error(csrResult.error)

      const csrFile = csrResult.files.find((f) => f.name === csrName)

      if (!csrFile) {
        throw new Error(
          `Failed to generate CSR file: ${csrName}. Check console for OpenSSL output.`
        )
      }

      if (csrFile) {
        const csrContent = new TextDecoder().decode(csrFile.data)
        setCsr(csrContent)

        addCSR({
          id: `csr-${Date.now()}`,
          name: csrName,
          pem: csrContent,
          created: Date.now(),
          keyPairId: keyId,
        })

        // Sync to OpenSSL Studio
        addFile({
          name: csrName,
          type: 'csr',
          content: csrContent,
          size: csrContent.length,
          timestamp: Date.now(),
        })

        // Also sync the config file
        addFile({
          name: 'csr.conf', // Maybe rename to unique?
          type: 'config',
          content: configFile.data,
          size: configFile.data.length,
          timestamp: Date.now(),
        })

        setOutput((prev) => prev + 'CSR generated and saved successfully!\n')
        onComplete()
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setOutput((prev) => prev + `Error: ${errorMessage}\n`)
    } finally {
      setIsGenerating(false)
    }
  }

  // Set default selection to the first algorithm
  useEffect(() => {
    if (selectedKeyId === 'new') {
      setSelectedKeyId(`new-${ALGORITHMS[0].id}`)
    }
  }, [selectedKeyId])

  return (
    <div className="space-y-8">
      {/* Row 1: Step 1 & Step 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Step 1: Key Configuration */}
        <div className="bg-card/80 border border-border rounded-2xl p-5">
          <div className="mb-4 border-b border-border pb-3">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-3">
              <span className="text-primary font-mono text-xl">01</span>
              <span className="text-foreground/80">|</span>
              KEY CONFIGURATION
            </h3>
            <p className="text-xs text-muted-foreground mt-1 ml-11">
              Generate new keypair • Select algorithm • Choose key size
            </p>
          </div>

          <div className="space-y-2">
            <FilterDropdown
              label="Private Key Source"
              items={[
                ...ALGORITHMS.map((algo) => ({
                  id: `new-${algo.id}`,
                  label: `Generate New ${algo.name}`,
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
          {(() => {
            // Show NIST level for new PQC keys; also hint for existing PQC keys
            let label = ''
            let tradeoff = ''
            if (selectedKeyId.startsWith('new-')) {
              const algoId = selectedKeyId.replace('new-', '')
              const algo = ALGORITHMS.find((a) => a.id === algoId)
              if (!algo || algo.group !== 'Quantum-Safe') return null
              const levelMap: Record<string, string> = {
                '1': 'NIST Level 1 (~AES-128 security)',
                '2': 'NIST Level 2 (~AES-128 target, Category 2)',
                '3': 'NIST Level 3 (~AES-192 security)',
                '5': 'NIST Level 5 (~AES-256 security)',
              }
              const catMatch = algo.keySizeLabel.match(/Category (\d)/)
              label = catMatch ? (levelMap[catMatch[1]] ?? '') : ''
              if (!label) return null
              // SLH-DSA tradeoff hint
              if (algo.keySizeLabel.includes('small sig')) {
                tradeoff = 'Small signature, slower signing'
              } else if (algo.keySizeLabel.includes('fast sign')) {
                tradeoff = 'Larger signature, faster signing'
              }
            } else {
              const existingKey = availableKeys.find((k) => k.id === selectedKeyId)
              if (!existingKey) return null
              const algoLower = existingKey.algorithm.toLowerCase()
              if (!algoLower.includes('ml-dsa') && !algoLower.includes('slh-dsa')) return null
              // Derive level from algorithm name
              if (algoLower.includes('-44')) label = 'NIST Level 2 (~AES-128 target, Category 2)'
              else if (algoLower.includes('-65')) label = 'NIST Level 3 (~AES-192 security)'
              else if (algoLower.includes('-87')) label = 'NIST Level 5 (~AES-256 security)'
              else if (algoLower.includes('128')) label = 'NIST Level 1 (~AES-128 security)'
              else if (algoLower.includes('192')) label = 'NIST Level 3 (~AES-192 security)'
              else if (algoLower.includes('256')) label = 'NIST Level 5 (~AES-256 security)'
              if (!label) return null
            }
            return (
              <div className="mt-2 space-y-0.5">
                <p className="text-xs text-muted-foreground">
                  Security: <span className="text-primary font-medium">{label}</span>
                </p>
                {tradeoff && <p className="text-xs text-muted-foreground italic">{tradeoff}</p>}
              </div>
            )
          })()}
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
        </div>

        {/* Step 2: Profile Selection */}
        <div className="bg-card/80 border border-border rounded-2xl p-5">
          <div className="mb-4 border-b border-border pb-3">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-3">
              <span className="text-primary font-mono text-xl">02</span>
              <span className="text-foreground/80">|</span>
              SELECT PROFILE
            </h3>
            <p className="text-xs text-muted-foreground mt-1 ml-11">
              Load industry template • Apply standards • Set constraints
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">CSR Profile</span>
                {selectedProfile && (
                  <button
                    type="button"
                    onClick={handleShowProfileInfo}
                    className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                    title="View profile documentation"
                  >
                    <Info size={16} />
                    Info
                  </button>
                )}
              </div>
              <FilterDropdown
                items={availableProfiles.map((profile) => ({
                  id: profile,
                  label: profile
                    .replace('CSR-', '')
                    .replace(/_\d{8}/, '')
                    .replace('.csv', ''),
                }))}
                selectedId={selectedProfile}
                onSelect={handleProfileSelect}
                defaultLabel="-- Select a Profile (optional) --"
                noContainer
                className="w-full"
              />
              {!selectedProfile && (
                <p className="text-xs text-muted-foreground mt-1">
                  Without a profile the CSR will contain only the Subject DN — no extensions (SAN,
                  EKU, keyUsage). Modern CAs require a subjectAltName per CAB Forum BR. Select a
                  profile to inject the correct extensions for your use case.
                </p>
              )}
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
            BUILD CSR ATTRIBUTES
          </h3>
          <p className="text-xs text-muted-foreground mt-1 ml-8">
            Define Subject DN • Add Extensions • Configure Request
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                <th className="p-3 w-10 text-center">Use</th>
                <th className="p-3">Type</th>
                <th className="p-3">Name</th>
                <th className="p-3 w-1/3">Value</th>
                <th className="p-3">Rec. / Desc.</th>
              </tr>
            </thead>
            <tbody>
              {attributes.map((attr) => (
                <tr
                  key={attr.id}
                  className={`border-b border-border/30 hover:bg-muted/50 transition-colors ${!attr.enabled ? 'opacity-50' : ''}`}
                >
                  <td className="p-3 text-center">
                    <input
                      type="checkbox"
                      checked={attr.enabled}
                      disabled={attr.status === 'mandatory'}
                      onChange={(e) => handleAttributeChange(attr.id, 'enabled', e.target.checked)}
                      className="rounded border-border bg-muted text-primary focus:ring-primary cursor-pointer w-4 h-4"
                    />
                  </td>
                  <td className="p-3 text-muted-foreground text-xs">{attr.elementType}</td>
                  <td className="p-3 text-foreground font-medium text-sm">
                    <div className="flex flex-col">
                      <span>{attr.label}</span>
                      <div className="flex gap-1 mt-1">
                        {attr.status === 'mandatory' && (
                          <span className="text-[10px] bg-status-error text-status-error px-1.5 py-0.5 rounded w-fit">
                            Mandatory
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <Input
                      type="text"
                      value={attr.value}
                      onChange={(e) => handleAttributeChange(attr.id, 'value', e.target.value)}
                      placeholder={attr.placeholder}
                      disabled={!attr.enabled}
                    />
                  </td>
                  <td className="p-3 text-muted-foreground text-xs max-w-[200px]">
                    {attr.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SAN callout — shown when no profile selected and no subjectAltName in attributes */}
      {!selectedProfile && !attributes.some((a) => a.label === 'subjectAltName' && a.enabled) && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-status-warning/10 border border-status-warning/30 text-status-warning text-sm">
          <Info className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>
            <strong>No SAN loaded.</strong> Modern TLS certificates require a{' '}
            <code className="font-mono text-xs bg-muted px-1 rounded">subjectAltName</code> (SAN)
            extension per CAB Forum Baseline Requirements. The{' '}
            <code className="font-mono text-xs bg-muted px-1 rounded">CN</code> alone has been
            deprecated for TLS hostname validation since 2017. Select a profile above to load SAN
            and other required extensions automatically.
          </span>
        </div>
      )}

      {/* Row 3: Step 4 & Output */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Step 4: Generate */}
        <div className="bg-card/80 border border-border rounded-2xl p-5 h-fit">
          <div className="mb-4 border-b border-border pb-3">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold">
                4
              </span>
              SIGN & CREATE CSR
            </h3>
            <p className="text-xs text-muted-foreground mt-1 ml-8">
              Hash request data • Sign with private key • Encode to PEM
            </p>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-black font-bold rounded hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isGenerating ? <Loader2 className="animate-spin" /> : <FileSignature />}
            Generate CSR
          </button>
        </div>

        {/* Output Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Console Output</h3>
          <div className="bg-muted rounded-lg p-4 font-mono text-xs h-[300px] overflow-y-auto custom-scrollbar border border-border">
            <pre className="text-foreground whitespace-pre-wrap break-all break-words max-w-full">
              {output}
            </pre>
            {csr && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-muted-foreground mb-2">Generated CSR:</p>
                <pre className="text-foreground whitespace-pre-wrap break-all break-words max-w-full">
                  {csr}
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
          className="fixed inset-0 bg-background/80 flex items-start justify-center z-50 pt-8"
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
              <button
                onClick={() => setShowProfileInfo(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>
            <div className="text-sm max-w-none flex-1 overflow-y-auto">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{profileDocContent}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
