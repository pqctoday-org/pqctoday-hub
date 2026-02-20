import React, { useState, useEffect } from 'react'
import { Shield, Loader2, Info, X } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { openSSLService } from '../../../../services/crypto/OpenSSLService'
import { useModuleStore } from '../../../../store/useModuleStore'
import { useOpenSSLStore } from '../../../OpenSSLStudio/store'
import { KNOWN_OIDS } from '../../../../services/crypto/oidMapping'

import { useCertProfile } from '../../../../hooks/useCertProfile'
import { AttributeTable } from '../../common/AttributeTable'
import type { X509Attribute } from '../../common/types'

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
    name: 'ML-DSA-87 (Dilithium)',
    group: 'Quantum-Safe',
    genCommand: 'openssl genpkey -algorithm ml-dsa-87',
    keySizeLabel: 'Category 5',
  },
  {
    id: 'slhdsa256s',
    name: 'SLH-DSA-SHA2-256s (SPHINCS+)',
    group: 'Quantum-Safe',
    genCommand: 'openssl genpkey -algorithm slh-dsa-sha2-256s',
    keySizeLabel: 'Category 5 (small sig)',
  },
  {
    id: 'slhdsa256f',
    name: 'SLH-DSA-SHA2-256f (SPHINCS+)',
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

export const RootCAGenerator: React.FC<RootCAGeneratorProps> = ({ onComplete }) => {
  const [selectedKeyId, setSelectedKeyId] = useState<string>(`new-${ALGORITHMS[0].id}`)
  const [isGenerating, setIsGenerating] = useState(false)
  const [output, setOutput] = useState('')
  const [caCert, setCaCert] = useState<string | null>(null)
  const [showProfileInfo, setShowProfileInfo] = useState(false)
  const [profileDocContent, setProfileDocContent] = useState<string>('')

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

  const handleGenerate = async () => {
    setIsGenerating(true)
    setOutput('')
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
          keySize: parseInt(currentAlgo.keySizeLabel) || 0,
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
      }
      setOutput(
        (prev) =>
          prev +
          `  basicConstraints = critical,CA:TRUE\n` +
          `    Marks this certificate as a Certificate Authority.\n` +
          `    "critical" means any system that doesn't understand this extension must reject the certificate.\n\n`
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
            `  Note: default_md = sha256 is set for OpenSSL compatibility, but ${algoObj?.name || 'this PQC algorithm'} uses its own internal hash function. SHA-256 is NOT the signature hash for this algorithm.\n\n`
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

        addCertificate({
          id: `root-cert-${Date.now()}`,
          name: certName,
          pem: certContent,
          created: Date.now(),
          metadata: {
            subject: subj,
            issuer: subj, // Self-signed
            serial: '01', // Default
            notBefore: Date.now(),
            notAfter: Date.now() + 3650 * 24 * 60 * 60 * 1000,
          },
          tags: ['root', 'ca', algoName],
          keyPairId: keyFile?.name === keyFilename ? keyId : undefined, // Link to the generated key
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

        setOutput((prev) => prev + 'Root CA certificate generated and saved successfully!\n')
        onComplete()
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setOutput((prev) => prev + `Error: ${errorMessage}\n`)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Row 1: Step 1 & Step 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Step 1: Key Configuration */}
        <div className="glass-panel p-5 border border-white/10">
          <div className="mb-4 border-b border-white/10 pb-3">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-3">
              <span className="text-primary font-mono text-xl">01</span>
              <span className="text-foreground/80">|</span>
              ROOT CA KEY
            </h3>
            <p className="text-xs text-muted-foreground mt-1 ml-11">
              Generate strong keypair • Select algorithm • Long-term security
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="key-type-select" className="text-sm text-muted-foreground">
                Key Type
              </label>
              <select
                id="key-type-select"
                value={selectedKeyId}
                onChange={(e) => setSelectedKeyId(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-foreground text-sm focus:outline-none focus:border-primary/50"
              >
                <optgroup label="Generate New Key">
                  {ALGORITHMS.map((algo) => (
                    <option key={`new-${algo.id}`} value={`new-${algo.id}`}>
                      {algo.name} ({algo.keySizeLabel})
                    </option>
                  ))}
                </optgroup>
                {availableKeys.length > 0 && (
                  <optgroup label="Existing Keys">
                    {availableKeys.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.name} ({k.algorithm})
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
            <p className="text-xs text-muted-foreground">
              Root CAs typically use larger key sizes for long-term security.
            </p>
          </div>
        </div>

        {/* Step 2: Profile Selection */}
        <div className="glass-panel p-5 border border-white/10">
          <div className="mb-4 border-b border-white/10 pb-3">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-3">
              <span className="text-primary font-mono text-xl">02</span>
              <span className="text-foreground/80">|</span>
              SELECT PROFILE
            </h3>
            <p className="text-xs text-muted-foreground mt-1 ml-11">
              Load CA template • Apply policies • Set constraints
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="profile-select" className="text-sm text-muted-foreground">
                  Certificate Profile
                </label>
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
              <select
                id="profile-select"
                value={selectedProfile}
                onChange={(e) => handleProfileSelect(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-foreground text-sm focus:outline-none focus:border-primary/50"
              >
                <option value="">-- Select a Profile --</option>
                {availableProfiles.map((profile) => (
                  <option key={profile} value={profile}>
                    {profile.replace('Cert-', '').replace('.csv', '')}
                  </option>
                ))}
              </select>
            </div>

            {profileMetadata && (
              <div className="text-xs space-y-2 p-3 bg-black/20 rounded border border-white/5">
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
      <div className="glass-panel p-5 border border-white/10">
        <div className="mb-4 border-b border-white/10 pb-3">
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
        <div className="glass-panel p-5 border border-white/10 h-fit">
          <div className="mb-4 border-b border-white/10 pb-3">
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

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-black font-bold rounded hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isGenerating ? <Loader2 className="animate-spin" /> : <Shield />}
            Generate Root CA
          </button>
        </div>

        {/* Output Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Console Output</h3>
          <div className="bg-black/40 rounded-lg p-4 font-mono text-xs h-[300px] overflow-y-auto custom-scrollbar border border-white/10">
            <pre className="text-accent-foreground whitespace-pre-wrap break-all break-words max-w-full">
              {output}
            </pre>
            {caCert && (
              <div className="mt-4 pt-4 border-t border-white/10">
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
          className="fixed inset-0 bg-black/80 flex items-start justify-center z-50 pt-8"
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
