import React, { useState, useEffect } from 'react'
import { PenTool, Loader2 } from 'lucide-react'
import { openSSLService } from '../../../../services/crypto/OpenSSLService'
import { useModuleStore } from '../../../../store/useModuleStore'
import { useOpenSSLStore } from '../../../OpenSSLStudio/store'
import { KNOWN_OIDS } from '../../../../services/crypto/oidMapping'

import { useCertProfile } from '../../../../hooks/useCertProfile'
import { AttributeTable } from '../../common/AttributeTable'
import type { X509Attribute } from '../../common/types'

interface CertSignerProps {
  onComplete: () => void
}

const INITIAL_ATTRIBUTES: X509Attribute[] = [
  {
    id: 'CN',
    label: 'Common Name',
    oid: 'CN',
    status: 'mandatory',
    value: '',
    enabled: true,
    placeholder: 'e.g., example.com',
    description: 'The fully qualified domain name (FQDN) of your server.',
    elementType: 'SubjectRDN',
  },
]

export const CertSigner: React.FC<CertSignerProps> = ({ onComplete }) => {
  const { artifacts, addCertificate } = useModuleStore()
  const { addFile } = useOpenSSLStore()
  const [selectedCsrId, setSelectedCsrId] = useState('')
  const [selectedKeyId, setSelectedKeyId] = useState('')
  const [validityDays, setValidityDays] = useState('365')
  const [isSigning, setIsSigning] = useState(false)
  const [output, setOutput] = useState('')
  const [signedCert, setSignedCert] = useState<string | null>(null)

  const {
    selectedProfile,
    availableProfiles,
    attributes,
    setAttributes,
    profileMetadata,
    profileConstraints,
    handleProfileSelect,
    handleAttributeChange,
    log: profileLog,
    setLog: setProfileLog,
  } = useCertProfile({
    initialAttributes: INITIAL_ATTRIBUTES,
  })

  // Sync profile log to main output
  useEffect(() => {
    if (profileLog) {
      setOutput((prev) => prev + profileLog)
      setProfileLog('') // Clear after syncing
    }
  }, [profileLog, setProfileLog])

  // Filter artifacts
  const csrs = artifacts.csrs
  const rootCAs = artifacts.certificates.filter(
    (c) => c.tags.includes('root') && c.tags.includes('ca')
  )
  const rootKeys = artifacts.keys.filter((k) => k.description === 'Root CA Private Key')

  // Profile handling is now managed by useCertProfile hook

  const importCsrValues = async (csrId: string, currentAttributes: X509Attribute[]) => {
    const csr = csrs.find((c) => c.id === csrId)
    if (!csr) return

    try {
      setOutput((prev) => prev + `Importing values from CSR: ${csr.name}...\n`)

      const csrFile = { name: 'temp.csr', data: new TextEncoder().encode(csr.pem) }

      // Parse Subject
      const subjCmd = `openssl req -in temp.csr -noout -subject -nameopt RFC2253`
      const subjResult = await openSSLService.execute(subjCmd, [csrFile])

      if (!subjResult.error) {
        // Output format: subject=CN=example.com,O=My Org,C=US
        // RFC2253 usually gives comma separated
        // Filter stdout to find the line starting with "subject=" to avoid debug logs
        const lines = subjResult.stdout.split('\n')
        const subjectLineRaw = lines.find((l) => l.trim().startsWith('subject='))

        if (!subjectLineRaw) {
          console.warn('Could not find subject line in CSR output')
          return
        }

        const subjectLine = subjectLineRaw.replace('subject=', '').trim()

        // Simple parser for RFC2253 style DN (comma separated)
        // Note: This is a basic parser and might fail on complex DNs with escaped commas
        const parts = subjectLine.split(',')

        // Create a deep copy to avoid direct state mutation
        const newAttributes = currentAttributes.map((attr) => ({ ...attr }))

        parts.forEach((part: string) => {
          const [key, val] = part.trim().split('=')
          if (key && val) {
            // eslint-disable-next-line security/detect-object-injection
            const attr = newAttributes.find((a) => a.id === key || a.oid === key)
            if (attr) {
              attr.value = val
              attr.enabled = true
              attr.source = 'CSR'
            }
          }
        })

        setAttributes(newAttributes)
        setOutput((prev) => prev + `Imported Subject DN values.\n`)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setOutput((prev) => prev + `Warning: Failed to import CSR values: ${errorMessage}\n`)
    }
  }

  const handleCsrSelect = async (csrId: string) => {
    setSelectedCsrId(csrId)
    if (csrId) {
      await importCsrValues(csrId, attributes)
    }
  }

  // Attribute change handling is now managed by useCertProfile hook

  const handleSign = async () => {
    if (!selectedCsrId || !selectedKeyId) return

    setIsSigning(true)
    setOutput('')
    setSignedCert(null)

    try {
      const csr = csrs.find((c) => c.id === selectedCsrId)
      const caKey = rootKeys.find((k) => k.id === selectedKeyId)

      setOutput((prev) => prev + `Selected CSR: ${csr?.name || 'None'}\n`)
      setOutput((prev) => prev + `Selected CA Key: ${caKey?.name || 'None'}\n`)

      // Find the certificate associated with this key
      // We look for a certificate that has this keyPairId, OR fall back to name matching for old data
      const caCert =
        rootCAs.find((c) => c.keyPairId === selectedKeyId) ||
        rootCAs.find((c) => c.name === caKey?.name.replace(' Key', ''))

      if (caCert) {
        setOutput((prev) => prev + `Found CA Certificate: ${caCert.name}\n`)
      } else {
        setOutput((prev) => prev + `Error: No Root CA Certificate found for this key.\n`)
        setOutput(
          (prev) => prev + `Tip: Go back to Step 2 and generate a Root CA using "${caKey?.name}".\n`
        )
      }

      if (!csr || !caCert || !caKey) {
        throw new Error('Cannot proceed without CSR, CA Key, and CA Certificate.')
      }

      // Prepare files using actual names
      const csrFileName = csr.name
      const caCertFileName = caCert.name
      const caKeyFileName = caKey.name // This might be '...key', ensure it matches

      const csrFile = { name: csrFileName, data: new TextEncoder().encode(csr.pem) }
      const caCertFile = { name: caCertFileName, data: new TextEncoder().encode(caCert.pem) }
      const caKeyFile = { name: caKeyFileName, data: new TextEncoder().encode(caKey.privateKey!) }

      // Generate Config for Extensions
      let extContent = `
[ v3_ca ]
`
      // Check if basicConstraints is already provided by the profile
      const hasBasicConstraints = attributes.some(
        (a) => a.enabled && (a.id === 'basicConstraints' || a.label === 'basicConstraints')
      )
      if (!hasBasicConstraints) {
        extContent += `basicConstraints = CA:FALSE\n`
      }

      // Check if keyUsage is already provided
      const hasKeyUsage = attributes.some(
        (a) => a.enabled && (a.id === 'keyUsage' || a.label === 'keyUsage')
      )
      if (!hasKeyUsage) {
        extContent += `keyUsage = digitalSignature, keyEncipherment\n`
      }

      // Add extensions from attributes
      attributes
        .filter((a) => a.enabled && a.elementType === 'Extension')
        .forEach((a) => {
          extContent += `${a.label} = ${a.value}\n`
        })

      const extFile = { name: 'ext.conf', data: new TextEncoder().encode(extContent) }

      // ... (inside handleSign)

      // Construct Subject DN
      const subjectParts: string[] = []
      attributes
        .filter((a) => a.enabled && a.elementType === 'SubjectRDN')
        .forEach((a) => {
          const key = KNOWN_OIDS[a.id] || a.id
          subjectParts.push(`/${key}=${a.value}`)
        })
      const subjArg = subjectParts.join('')

      // openssl x509 -req ...
      let cmd = `openssl x509 -req -in ${csrFileName} -CA ${caCertFileName} -CAkey ${caKeyFileName} -CAcreateserial -out pkiworkshopcert.pem -days ${validityDays} -sha256`

      if (subjArg) {
        cmd += ` -subj "${subjArg}"`
      }

      // Use -extfile to add extensions
      cmd += ` -extfile ext.conf -extensions v3_ca`

      setOutput((prev) => prev + `Command: ${cmd}\n\n`)

      const result = await openSSLService.execute(cmd, [csrFile, caCertFile, caKeyFile, extFile])

      if (result.error) {
        setOutput((prev) => prev + `Error: ${result.stderr}\n`)
        throw new Error('Failed to generate Signed Certificate')
      }

      setOutput((prev) => prev + `Success!\n${result.stdout}\n`)

      // Find the generated certificate
      const certFile = result.files.find((f) => f.name === 'pkiworkshopcert.pem')

      if (!certFile) {
        throw new Error('Certificate file not found in output')
      }

      const certContent = new TextDecoder().decode(certFile.data)
      setSignedCert(certContent)

      const timestamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 14)
      const certName = `pkiworkshop_cert_${timestamp}.pem`

      addCertificate({
        id: `cert-${Date.now()}`,
        name: certName,
        pem: certContent,
        created: Date.now(),
        metadata: {
          subject: subjArg || 'Extracted from CSR',
          issuer: caCert.name,
          serial: 'Generated',
          notBefore: Date.now(),
          notAfter: Date.now() + parseInt(validityDays) * 24 * 60 * 60 * 1000,
        },
        tags: ['end-entity'],
      })

      // Sync to OpenSSL Studio
      addFile({
        name: certName,
        type: 'cert',
        content: certContent,
        size: certContent.length,
        timestamp: Date.now(),
      })

      setOutput((prev) => prev + 'Certificate signed successfully!\n')
      onComplete()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setOutput((prev) => prev + `Error: ${errorMessage}\n`)
    } finally {
      setIsSigning(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Row 1: Step 1 & Step 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Step 1: CSR Selection */}
        <div className="glass-panel p-5 border border-white/10">
          <div className="mb-4 border-b border-white/10 pb-3">
            <h3 className="text-lg font-bold text-white flex items-center gap-3">
              <span className="text-primary font-mono text-xl">01</span>
              <span className="text-white/80">|</span>
              RECEIVE & VALIDATE
            </h3>
            <p className="text-xs text-muted mt-1 ml-11">
              Verify CSR signature • Validate subject identity • Extract public key
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="csr-select" className="text-sm text-muted">
              Certificate Signing Request
            </label>
            <select
              id="csr-select"
              value={selectedCsrId}
              onChange={(e) => handleCsrSelect(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-primary/50"
            >
              <option value="">-- Select CSR --</option>
              {csrs.map((csr) => (
                <option key={csr.id} value={csr.id}>
                  {csr.name}
                </option>
              ))}
            </select>
            {csrs.length === 0 && (
              <p className="text-xs text-red-400">No CSRs found. Generate one in Step 1.</p>
            )}
          </div>
        </div>

        {/* Step 2: Profile Selection */}
        <div className="glass-panel p-5 border border-white/10">
          <div className="mb-4 border-b border-white/10 pb-3">
            <h3 className="text-lg font-bold text-white flex items-center gap-3">
              <span className="text-primary font-mono text-xl">02</span>
              <span className="text-white/80">|</span>
              SELECT PROFILE
            </h3>
            <p className="text-xs text-muted mt-1 ml-11">
              Match certificate type • Check validation level • Apply policies
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="profile-select" className="text-sm text-muted">
                Certificate Profile
              </label>
              <select
                id="profile-select"
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
            </div>

            {profileMetadata && (
              <div className="text-xs space-y-2 p-3 bg-black/20 rounded border border-white/5">
                <div className="flex justify-between">
                  <span className="text-muted">Industry:</span>
                  <span className="text-white">{profileMetadata.industry}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Standard:</span>
                  <span className="text-white">{profileMetadata.standard}</span>
                </div>
                <div className="pt-2 border-t border-white/5">
                  <span className="text-muted block mb-1">Constraints:</span>
                  <span className="text-white block leading-relaxed">
                    {profileConstraints.length > 0
                      ? profileConstraints.map((c) => `${c.name}=${c.value}`).join(' | ')
                      : '-'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Step 3 (Attributes) */}
      <div className="glass-panel p-5 border border-white/10">
        <div className="mb-4 border-b border-white/10 pb-3">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold">
              3
            </span>
            BUILD CERTIFICATE
          </h3>
          <p className="text-xs text-muted mt-1 ml-8">
            Combine Key & Subject • Generate Serial & Validity • Prepare TBSCertificate
          </p>
        </div>

        <AttributeTable
          attributes={attributes}
          onAttributeChange={handleAttributeChange}
          showSource={true}
        />
      </div>

      {/* Row 3: Step 4 & Output */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Step 4: Signing */}
        <div className="glass-panel p-5 border border-white/10 h-fit">
          <div className="mb-4 border-b border-white/10 pb-3">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold">
                4
              </span>
              SIGN WITH CA KEY
            </h3>
            <p className="text-xs text-muted mt-1 ml-8">
              Hash TBSCertificate • Sign with CA Private Key • Append Signature
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="ca-key-select" className="text-sm text-muted">
                Signing CA Key
              </label>
              <select
                id="ca-key-select"
                value={selectedKeyId}
                onChange={(e) => setSelectedKeyId(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-primary/50"
              >
                <option value="">-- Select CA Key --</option>
                {rootKeys.map((key) => (
                  <option key={key.id} value={key.id}>
                    {key.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="validity-input" className="text-sm text-muted">
                Validity (Days)
              </label>
              <input
                id="validity-input"
                type="number"
                value={validityDays}
                onChange={(e) => setValidityDays(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-primary/50"
              />
            </div>
            <button
              onClick={handleSign}
              disabled={isSigning || !selectedCsrId || !selectedKeyId}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-black font-bold rounded hover:bg-primary/90 transition-colors disabled:opacity-50 mt-4"
            >
              {isSigning ? <Loader2 className="animate-spin" /> : <PenTool />}
              Sign Certificate
            </button>
          </div>
        </div>

        {/* Output Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Console Output</h3>
          <div className="bg-black/40 rounded-lg p-4 font-mono text-xs h-[300px] overflow-y-auto custom-scrollbar border border-white/10">
            <pre className="text-green-400 whitespace-pre-wrap">{output}</pre>
            {signedCert && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-muted mb-2">Signed Certificate:</p>
                <pre className="text-blue-300 whitespace-pre-wrap">{signedCert}</pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
