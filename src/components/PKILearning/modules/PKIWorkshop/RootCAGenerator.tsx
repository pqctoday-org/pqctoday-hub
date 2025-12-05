import React, { useState, useEffect } from 'react'
import { Shield, Loader2, Key, FileText } from 'lucide-react'
import { openSSLService } from '../../../../services/crypto/OpenSSLService'
import { useModuleStore } from '../../../../store/useModuleStore'
import { useOpenSSLStore } from '../../../OpenSSLStudio/store'
import { KNOWN_OIDS } from '../../../../services/crypto/oidMapping'

import { useCertProfile } from '../../../../hooks/useCertProfile'
import { AttributeTable } from '../../common/AttributeTable'
import type { X509Attribute } from '../../common/types'

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
    keySizeLabel: '456 bits',
  },
  {
    id: 'mldsa',
    name: 'ML-DSA-87 (Dilithium)',
    group: 'Quantum-Safe',
    genCommand: 'openssl genpkey -algorithm ml-dsa-87',
    keySizeLabel: 'Level 5',
  },
  {
    id: 'slhdsa',
    name: 'SLH-DSA-SHA2-256s (SPHINCS+)',
    group: 'Quantum-Safe',
    genCommand: 'openssl genpkey -algorithm slh-dsa-sha2-256s',
    keySizeLabel: 'Level 5',
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

  const filterProfileName = React.useCallback((name: string) => name.startsWith('Cert-RootCA'), [])

  const {
    selectedProfile,
    availableProfiles,
    attributes,
    profileMetadata,
    profileConstraints,
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

      configContent += `\n[ dn ]\n`
      attributes
        .filter((a) => a.enabled && a.elementType === 'SubjectRDN')
        .forEach((a) => {
          if (KNOWN_OIDS[a.id]) {
            configContent += `${KNOWN_OIDS[a.id]} = ${a.value}\n`
            // eslint-disable-next-line security/detect-unsafe-regex
          } else if (/^\d+(\.\d+)+$/.test(a.id)) {
            const custom = customOids.find((o) => o.oid === a.id)
            if (custom) {
              configContent += `${custom.name} = ${a.value}\n`
            }
          } else {
            configContent += `${a.id} = ${a.value}\n`
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

      attributes
        .filter((a) => a.enabled && a.elementType === 'Extension')
        .forEach((a) => {
          configContent += `${a.label} = ${a.value}\n`
        })

      const configFile = {
        name: 'rootca.conf',
        data: new TextEncoder().encode(configContent),
      }

      setOutput((prev) => prev + `Generated Config:\n${configContent}\n`)

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
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          {/* Key Configuration */}
          <div className="glass-panel p-5 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Key className="text-primary" size={20} />
              Root CA Key
            </h3>

            <div className="space-y-4">
              <table className="w-full text-sm border-collapse">
                <tbody>
                  <tr>
                    <td className="pt-0 pb-3 text-muted w-[180px] align-middle">Key Type</td>
                    <td className="pt-0 pb-3 align-middle">
                      <select
                        value={selectedKeyId}
                        onChange={(e) => setSelectedKeyId(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-primary/50"
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
                    </td>
                  </tr>
                </tbody>
              </table>
              <p className="text-xs text-muted">
                Root CAs typically use larger key sizes for long-term security.
              </p>
            </div>
          </div>

          {/* Profile Selection */}
          <div className="glass-panel p-5 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FileText className="text-primary" size={20} />
              Certificate Profile
            </h3>

            <div className="space-y-4">
              <table className="w-full text-sm border-collapse">
                <tbody>
                  {/* Row 1: Profile Name */}
                  <tr className="border-b border-white/5">
                    <td className="pt-0 pb-3 text-muted w-[180px] align-middle">Profile Name</td>
                    <td className="pt-0 pb-3 align-middle">
                      <select
                        value={selectedProfile}
                        onChange={(e) => handleProfileSelect(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-primary/50"
                      >
                        <option value="">-- Select a Profile --</option>
                        {availableProfiles.map((profile) => (
                          <option key={profile} value={profile}>
                            {profile.replace('Cert-', '').replace('.csv', '')}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>

                  {/* Row 2: Industry */}
                  <tr className="border-b border-white/5">
                    <td className="py-3 text-muted align-middle">Industry</td>
                    <td className="py-3 text-white font-medium align-middle">
                      {profileMetadata?.industry || '-'}
                    </td>
                  </tr>

                  {/* Row 3: Standard */}
                  <tr className="border-b border-white/5">
                    <td className="py-3 text-muted align-middle">Standard</td>
                    <td className="py-3 text-white font-medium align-middle">
                      {profileMetadata?.standard || '-'}
                    </td>
                  </tr>

                  {/* Row 4: Standard Date */}
                  <tr>
                    <td className="py-3 text-muted align-middle">Standard Date</td>
                    <td className="py-3 text-white font-medium align-middle">
                      {profileMetadata?.date || '-'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 text-muted align-middle">Constraints</td>
                    <td className="py-3 text-white font-medium align-middle text-xs leading-relaxed">
                      {profileConstraints.length > 0
                        ? profileConstraints.map((c) => `${c.name}=${c.value}`).join(' | ')
                        : '-'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* X.509 Attributes Section */}
          <div className="glass-panel p-5 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Shield className="text-primary" size={20} />
              X.509 Attributes
            </h3>

            <AttributeTable
              attributes={attributes}
              onAttributeChange={handleAttributeChange}
              showSource={false}
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-black font-bold rounded hover:bg-primary/90 transition-colors disabled:opacity-50 text-lg"
          >
            {isGenerating ? <Loader2 className="animate-spin" /> : <Shield />}
            Generate Root CA
          </button>
        </div>

        {/* Output Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Console Output</h3>
          <div className="bg-black/40 rounded-lg p-4 font-mono text-xs h-[600px] overflow-y-auto custom-scrollbar border border-white/10">
            <pre className="text-green-400 whitespace-pre-wrap break-all break-words max-w-full">{output}</pre>
            {caCert && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-muted mb-2">Generated Root Certificate:</p>
                <pre className="text-blue-300 whitespace-pre-wrap break-all break-words max-w-full">{caCert}</pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
