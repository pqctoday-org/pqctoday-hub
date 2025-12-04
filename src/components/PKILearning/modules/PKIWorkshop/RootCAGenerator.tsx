import React, { useState, useEffect } from 'react'
import { Shield, Loader2, Key, FileText } from 'lucide-react'
import { openSSLService } from '../../../../services/crypto/OpenSSLService'
import { useModuleStore } from '../../../../store/useModuleStore'
import { useOpenSSLStore } from '../../../OpenSSLStudio/store'
import { KNOWN_OIDS } from '../../../../services/crypto/oidMapping'

// Import Cert profiles using Vite's glob import
const certProfiles = import.meta.glob('../../../../data/x509_profiles/Cert*.csv', {
  query: '?raw',
  import: 'default',
})

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

interface ProfileConstraint {
  name: string
  value: string
  description: string
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
  const [selectedProfile, setSelectedProfile] = useState<string>('')
  const [availableProfiles, setAvailableProfiles] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [output, setOutput] = useState('')
  const [caCert, setCaCert] = useState<string | null>(null)
  const [attributes, setAttributes] = useState<X509Attribute[]>(INITIAL_ATTRIBUTES)
  const [profileMetadata, setProfileMetadata] = useState<ProfileMetadata | null>(null)
  const [profileConstraints, setProfileConstraints] = useState<ProfileConstraint[]>([])

  const { artifacts, addKey, addCertificate } = useModuleStore()
  const { addFile } = useOpenSSLStore()

  // Filter for existing private keys
  const availableKeys = artifacts.keys.filter((k) => k.privateKey)

  useEffect(() => {
    // Extract filenames from the glob import
    const profiles = Object.keys(certProfiles)
      .map((path) => {
        // Extract filename from path
        return path.split('/').pop() || ''
      })
      .filter((name) => name.startsWith('Cert-RootCA') && name.endsWith('.csv'))
    setAvailableProfiles(profiles)
  }, [])

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
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
      setOutput(`Loading profile: ${filename}...\n`)

      const path = Object.keys(certProfiles).find((p) => p.endsWith(filename))
      if (!path) throw new Error('Profile path not found')

      const loadProfile = certProfiles[path] as () => Promise<string>
      const content = await loadProfile()

      const lines = content.split('\n').filter((line) => line.trim() !== '')
      if (lines.length < 2) throw new Error('Invalid CSV format')

      // Parse Header
      const headers = parseCSVLine(lines[0])
      const colMap = new Map<string, number>()
      headers.forEach((h, i) => colMap.set(h.trim(), i))

      const getVal = (row: string[], colName: string) => {
        const idx = colMap.get(colName)
        return idx !== undefined && idx < row.length ? row[idx] : ''
      }

      // Parse Metadata
      const firstRow = parseCSVLine(lines[1])
      const industry = getVal(firstRow, 'Industry')
      const standard = getVal(firstRow, 'Standard')
      const date = getVal(firstRow, 'StandardDate')

      setProfileMetadata({ industry, standard, date })

      // Parse Attributes
      const newAttributes: X509Attribute[] = []
      const newConstraints: ProfileConstraint[] = []

      for (let i = 1; i < lines.length; i++) {
        const row = parseCSVLine(lines[i])
        const elementType = getVal(row, 'ElementType')

        if (elementType === 'SubjectRDN' || elementType === 'Extension') {
          const name = getVal(row, 'Name')
          const example = getVal(row, 'ExampleValue')
          const description = getVal(row, 'AllowedValuesOrUsage')

          // Separate constraint fields to display them in profile section
          if (name.toLowerCase().includes('constraints')) {
            newConstraints.push({
              name: name,
              value: example,
              description: description,
            })
            continue
          }

          const oid = getVal(row, 'OID')

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

          const label = name
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
            value: example,
            enabled: critical,
            placeholder: `e.g., ${example}`,
            description: description,
            elementType: elementType,
          })
        }
      }

      setAttributes(newAttributes)
      setProfileConstraints(newConstraints)
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
    } catch (error: any) {
      setOutput((prev) => prev + `Error: ${error.message}\n`)
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

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-muted text-xs uppercase tracking-wider">
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
                      className={`border-b border-white/5 hover:bg-white/5 transition-colors ${!attr.enabled ? 'opacity-50' : ''}`}
                    >
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={attr.enabled}
                          disabled={attr.status === 'mandatory'}
                          onChange={(e) =>
                            handleAttributeChange(attr.id, 'enabled', e.target.checked)
                          }
                          className="rounded border-white/20 bg-black/40 text-primary focus:ring-primary cursor-pointer w-4 h-4"
                        />
                      </td>
                      <td className="p-3 text-muted text-xs">{attr.elementType}</td>
                      <td className="p-3 text-white font-medium text-sm">
                        <div className="flex flex-col">
                          <span>{attr.label}</span>
                          <div className="flex gap-1 mt-1">
                            {attr.status === 'mandatory' && (
                              <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded w-fit">
                                Mandatory
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <input
                          type="text"
                          value={attr.value}
                          onChange={(e) => handleAttributeChange(attr.id, 'value', e.target.value)}
                          placeholder={attr.placeholder}
                          disabled={!attr.enabled}
                          className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-sm text-white focus:border-primary/50 outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </td>
                      <td className="p-3 text-muted text-xs max-w-[200px]">{attr.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
            <pre className="text-green-400 whitespace-pre-wrap">{output}</pre>
            {caCert && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-muted mb-2">Generated Root Certificate:</p>
                <pre className="text-blue-300 whitespace-pre-wrap">{caCert}</pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
