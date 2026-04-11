// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useEffect } from 'react'
import { PenTool, Loader2, Info, X, Check } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { openSSLService } from '@/services/crypto/OpenSSLService'
import { useModuleStore } from '@/store/useModuleStore'
import { useOpenSSLStore } from '@/components/OpenSSLStudio/store'
import { useCertProfile } from '@/hooks/useCertProfile'
import { AttributeTable } from '../../common/AttributeTable'
import type { X509Attribute } from '../../common/types'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

// Import profile documentation
const profileDocs = import.meta.glob('../../../../data/x509_profiles/*_Overview.md', {
  query: '?raw',
  import: 'default',
})

// Profile to markdown mapping
const PROFILE_DOC_MAP: Record<string, string> = {
  'Cert-Financial_ETSI_EN319412-2_2025.csv':
    '../../../../data/x509_profiles/ETSI_EN_319_412-2_Certificate_Overview.md',
  'Cert-Financial_ETSI_EN319412-2_04072026.csv':
    '../../../../data/x509_profiles/ETSI_EN_319_412-2_Certificate_Overview.md',
  'Cert-GeneralIT_CABF_TLSBR_2025.csv':
    '../../../../data/x509_profiles/CAB_Forum_TLS_Baseline_Requirements_Overview.md',
  'Cert-Telecom_3GPP_TS33310_2025.csv':
    '../../../../data/x509_profiles/3GPP_TS_33.310_NDS_AF_Certificate_Overview.md',
  'Cert-Telecom_3GPP_TS33310_04072026.csv':
    '../../../../data/x509_profiles/3GPP_TS_33.310_NDS_AF_Certificate_Overview.md',
}

interface CertSignerProps {
  onComplete: () => void
}

// Map from dotted OID → OpenSSL short name accepted in -subj (S3-C fix)
// KNOWN_OIDS maps OID → long name (e.g. 'organizationName'); -subj needs the short abbrev (e.g. 'O')
const OID_TO_SHORT: Record<string, string> = {
  '2.5.4.3': 'CN',
  '2.5.4.6': 'C',
  '2.5.4.10': 'O',
  '2.5.4.11': 'OU',
  '2.5.4.8': 'ST',
  '2.5.4.7': 'L',
  '2.5.4.9': 'street',
  '2.5.4.5': 'serialNumber',
  '2.5.4.17': 'postalCode',
  '2.5.4.97': 'organizationIdentifier',
  '1.2.840.113549.1.9.1': 'emailAddress',
  '0.9.2342.19200300.100.1.25': 'DC',
  '2.5.4.4': 'SN',
  '2.5.4.42': 'GN',
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
  const [csrVerified, setCsrVerified] = useState(false)
  const [showProfileInfo, setShowProfileInfo] = useState(false)
  const [profileDocContent, setProfileDocContent] = useState<string>('')

  const {
    selectedProfile,
    availableProfiles,
    attributes,
    setAttributes,
    profileMetadata,
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
      // -nameopt RFC2253 is the OpenSSL flag name (kept for compatibility); the current standard is RFC 4514 (2006).
      const subjCmd = `openssl req -in temp.csr -noout -subject -nameopt RFC2253`
      const subjResult = await openSSLService.execute(subjCmd, [csrFile])

      if (!subjResult.error) {
        // Output format: subject=CN=example.com,O=My Org,C=US
        // RFC 4514 (which obsoleted RFC 2253 in 2006) specifies the comma-separated DN string format.
        // Filter stdout to find the line starting with "subject=" to avoid debug logs
        const lines = subjResult.stdout.split('\n')
        const subjectLineRaw = lines.find((l) => l.trim().startsWith('subject='))

        if (!subjectLineRaw) {
          console.warn('Could not find subject line in CSR output')
          return
        }

        const subjectLine = subjectLineRaw.replace('subject=', '').trim()

        // RFC 4514 DN parser: split on commas NOT preceded by a backslash
        // Handles escaped commas like CN=Acme\, Inc.,O=Acme
        const parts = subjectLine.split(/(?<!\\),/)

        // Create a deep copy to avoid direct state mutation
        const newAttributes = currentAttributes.map((attr) => ({ ...attr }))

        parts.forEach((part: string) => {
          const [key, val] = part.trim().split('=')
          if (key && val) {
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
    setCsrVerified(false)
    if (!csrId) return
    await importCsrValues(csrId, attributes)
    // S3-F: Pre-verify CSR self-signature on selection so badge shows before Sign is clicked
    const csr = csrs.find((c) => c.id === csrId)
    if (csr) {
      try {
        const csrFile = { name: csr.name, data: new TextEncoder().encode(csr.pem) }
        const result = await openSSLService.execute(`openssl req -verify -in ${csr.name} -noout`, [
          csrFile,
        ])
        const ok = !result.error && (result.stdout.includes('OK') || result.stderr.includes('OK'))
        setCsrVerified(ok)
      } catch {
        // non-fatal — badge stays false
      }
    }
  }

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

  const handleSign = async () => {
    if (!selectedCsrId || !selectedKeyId) return

    setIsSigning(true)
    setOutput('')
    setSignedCert(null)
    setCsrVerified(false)

    try {
      const csr = csrs.find((c) => c.id === selectedCsrId)
      const caKey = rootKeys.find((k) => k.id === selectedKeyId)

      setOutput((prev) => prev + `Selected CSR: ${csr?.name || 'None'}\n`)
      setOutput((prev) => prev + `Selected CA Key: ${caKey?.name || 'None'}\n`)

      // Find the Root CA certificate that matches the selected key.
      // In Step 2, generating a Root CA links the key and cert via an internal keyPairId.
      // Primary match: keyPairId (reliable — set when key + cert are generated together in Step 2).
      // Fallback: name-based match (for artifacts generated before keyPairId tracking was added).
      // If both fail, it means the CA key and CA certificate were not generated together in Step 2.
      const byKeyPairId = rootCAs.find((c) => c.keyPairId === selectedKeyId)
      const byName = rootCAs.find((c) => c.name === caKey?.name.replace(' Key', ''))
      const caCert = byKeyPairId ?? byName

      if (caCert) {
        setOutput(
          (prev) =>
            prev +
            `Found CA Certificate: ${caCert.name}` +
            (byKeyPairId ? ' (matched by keyPairId)\n' : ' (matched by name fallback)\n')
        )
      } else {
        setOutput(
          (prev) => prev + `Error: No Root CA Certificate found for key "${caKey?.name}".\n`
        )
        if (rootCAs.length > 0) {
          // Diagnostic: show why the match failed so the learner can debug
          setOutput(
            (prev) =>
              prev +
              `  Diagnostic: searched by keyPairId="${selectedKeyId}" — no match.\n` +
              `  Searched by name="${caKey?.name.replace(' Key', '')}" — no match.\n` +
              `  Available Root CAs (name / keyPairId):\n` +
              rootCAs
                .map((c) => `    • ${c.name} / keyPairId=${c.keyPairId ?? 'none'}\n`)
                .join('') +
              `  Tip: The CA key and CA certificate must be generated together in Step 2.\n` +
              `  If you generated the key separately, go back to Step 2 and re-generate the Root CA using that key.\n`
          )
        } else {
          setOutput(
            (prev) =>
              prev + `  No Root CA certificates exist yet. Go to Step 2 and generate one first.\n`
          )
        }
      }

      if (!csr || !caCert || !caKey) {
        throw new Error('Cannot proceed without CSR, CA Key, and CA Certificate.')
      }

      // Step 0: Verify CSR self-signature (proof of possession)
      // A CA must always confirm the applicant controls the private key before issuing.
      setOutput(
        (prev) => prev + `\n[Step 0] Verifying CSR self-signature (proof of possession)...\n`
      )
      const csrVerifyFile = { name: csr.name, data: new TextEncoder().encode(csr.pem) }
      const csrVerifyResult = await openSSLService.execute(
        `openssl req -verify -in ${csr.name} -noout`,
        [csrVerifyFile]
      )
      const csrVerifyOk =
        !csrVerifyResult.error &&
        (csrVerifyResult.stdout.includes('OK') || csrVerifyResult.stderr.includes('OK'))
      if (!csrVerifyOk) {
        setOutput(
          (prev) =>
            prev +
            `  CSR signature verification FAILED: ${csrVerifyResult.stderr || csrVerifyResult.stdout}\n` +
            `  Rejecting — the CSR may have been tampered with or the key does not match the signature.\n`
        )
        throw new Error('CSR self-signature verification failed — cannot proceed')
      }
      setOutput(
        (prev) =>
          prev +
          `  CSR signature verified. The applicant holds the private key matching this public key.\n\n`
      )
      setCsrVerified(true)

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
      setOutput(
        (prev) =>
          prev +
          `  basicConstraints = CA:FALSE\n` +
          `    Marks this as an end-entity certificate (not a CA). It cannot sign other certificates.\n\n`
      )

      // Check if keyUsage is already provided
      const hasKeyUsage = attributes.some(
        (a) => a.enabled && (a.id === 'keyUsage' || a.label === 'keyUsage')
      )
      // S3-A: For RSA keys, TLS 1.2 key exchange requires keyEncipherment in addition to digitalSignature.
      // For ECDSA/EdDSA/PQC, digitalSignature is the correct and only value.
      const caAlgoForKeyUsage = caKey.algorithm.toLowerCase()
      const isRsaCaKey = caAlgoForKeyUsage.includes('rsa')
      if (!hasKeyUsage) {
        extContent += isRsaCaKey
          ? `keyUsage = digitalSignature, keyEncipherment\n`
          : `keyUsage = digitalSignature\n`
      }
      setOutput(
        (prev) =>
          prev +
          (isRsaCaKey
            ? `  keyUsage = digitalSignature, keyEncipherment\n` +
              `    digitalSignature: required for TLS 1.3 (server signs the handshake transcript with its private key).\n` +
              `    keyEncipherment: required only for TLS 1.2 RSA key exchange (client encrypts pre-master secret with server pubkey).\n` +
              `    Note: TLS 1.3 (RFC 8446) removed RSA key exchange — keyEncipherment is a legacy value for TLS 1.2 backward compat only.\n` +
              `    Note: RSA-PSS (RFC 8017) also uses only digitalSignature — keyEncipherment is an RSA PKCS#1 v1.5 concept.\n\n`
            : `  keyUsage = digitalSignature\n` +
              `    ECDSA and PQC algorithms authenticate via signature only — key exchange uses ephemeral ECDH or KEM.\n` +
              `    keyEncipherment is not applicable: it applies only to RSA TLS 1.2 key transport, which was removed in TLS 1.3.\n\n`)
      )

      // Sanitize attribute values for OpenSSL config/command interpolation
      const escapeConfigValue = (value: string): string => {
        return value.replace(/\\/g, '\\\\').replace(/\n/g, '').replace(/\r/g, '')
      }

      // Add extensions from attributes
      const hasExtensions = attributes.some((a) => a.enabled && a.elementType === 'Extension')
      attributes
        .filter((a) => a.enabled && a.elementType === 'Extension')
        .forEach((a) => {
          extContent += `${a.label} = ${escapeConfigValue(a.value)}\n`
        })

      // Inject default TLS extensions when no profile is loaded
      if (!selectedProfile && !hasExtensions) {
        extContent += `subjectAltName = DNS:example.com\n`
        extContent += `extendedKeyUsage = serverAuth\n`
        extContent += `subjectKeyIdentifier = hash\n`
        extContent += `authorityKeyIdentifier = keyid,issuer\n`
        setOutput(
          (prev) =>
            prev +
            `  No profile selected — applying default TLS extensions:\n` +
            `    subjectAltName = DNS:example.com\n` +
            `      Required by CAB Forum BR since 2017. The CN alone is no longer accepted for TLS hostname validation.\n` +
            `    extendedKeyUsage = serverAuth\n` +
            `      Restricts this cert to TLS server authentication (OID 1.3.6.1.5.5.7.3.1).\n` +
            `    subjectKeyIdentifier = hash\n` +
            `      OpenSSL's "hash" method computes a SHA-1 truncation of the SubjectPublicKeyInfo BIT STRING.\n` +
            `      RFC 5280 §4.2.1.2 does not mandate SHA-1 — it allows any method that produces a unique identifier.\n` +
            `      OpenSSL defaults to SHA-1 for historical compatibility; the RFC is algorithm-agnostic at this point.\n` +
            `    authorityKeyIdentifier = keyid,issuer\n` +
            `      Links this cert to its CA via the CA's subjectKeyIdentifier and issuer name.\n\n`
        )
      }

      const extFile = { name: 'ext.conf', data: new TextEncoder().encode(extContent) }

      // Show ext.conf to learner so they can see exactly which extensions are injected
      setOutput((prev) => prev + `[ext.conf — extension configuration]\n${extContent}\n`)

      // Construct Subject DN (S3-C fix)
      // a.id may be a dotted OID (from profile CSV) or a short name (CN, O, C).
      // OpenSSL -subj requires short names (CN, O, C, OU, ST, L ...) NOT long names like 'organizationName'.
      // Priority: OID_TO_SHORT[a.id] → a.id (if already a short name)
      const subjectParts: string[] = []
      attributes
        .filter((a) => a.enabled && a.elementType === 'SubjectRDN')
        .forEach((a) => {
          const key = OID_TO_SHORT[a.id] ?? a.id
          subjectParts.push(`/${key}=${escapeConfigValue(a.value)}`)
        })
      const subjArg = subjectParts.join('')

      // openssl x509 -req ...
      let cmd = `openssl x509 -req -in ${csrFileName} -CA ${caCertFileName} -CAkey ${caKeyFileName} -CAcreateserial -out pkiworkshopcert.pem -days ${validityDays} -sha256`

      if (subjArg) {
        cmd += ` -subj "${subjArg}"`
      }

      // Use -extfile to add extensions
      cmd += ` -extfile ext.conf -extensions v3_ca`

      setOutput(
        (prev) =>
          prev +
          `Command: ${cmd}\n\n` +
          `  -CAcreateserial: creates/updates a .srl file alongside the CA cert, which tracks the\n` +
          `  next serial number to assign. Each signed certificate gets a unique, monotonically\n` +
          `  increasing serial within this CA's namespace — serials are what CRL entries reference.\n\n` +
          `  CAB Forum BR (since 2023): maximum validity is 398 days for publicly-trusted TLS certs.\n` +
          `  This workshop uses ${validityDays} days. Internal/private PKI certs have no mandated limit.\n\n`
      )

      // Note for PQC algorithms: -sha256 is ignored
      const caAlgoLower = caKey.algorithm.toLowerCase()
      const isPqcCaKey =
        caAlgoLower.includes('ml-dsa') ||
        caAlgoLower.includes('slh-dsa') ||
        caAlgoLower.includes('fips 204') ||
        caAlgoLower.includes('fips 205')
      if (isPqcCaKey) {
        setOutput(
          (prev) =>
            prev +
            `  Note: -sha256 is ignored for PQC algorithms (ML-DSA, SLH-DSA). The algorithm defines its own digest internally — the hash flag has no effect on the signature scheme.\n\n`
        )
      }

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

      // Extract real serial number assigned by the CA
      let actualSerial = 'unknown'
      const serialResult = await openSSLService.execute(
        `openssl x509 -in pkiworkshopcert.pem -serial -noout`,
        [certFile]
      )
      if (!serialResult.error) {
        const serialMatch = serialResult.stdout.match(/serial=([0-9A-Fa-f]+)/i)
        if (serialMatch) actualSerial = serialMatch[1].toUpperCase()
      }
      setOutput(
        (prev) =>
          prev +
          `Serial Number: ${actualSerial}\n` +
          `  The CA assigned this serial via -CAcreateserial. It uniquely identifies this certificate within the CA's namespace and is what a CRL entry references.\n\n`
      )

      addCertificate({
        id: `cert-${Date.now()}`,
        name: certName,
        pem: certContent,
        created: Date.now(),
        metadata: {
          subject: subjArg || 'Extracted from CSR',
          issuer: caCert.name,
          serial: actualSerial,
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

      // Get SHA-256 fingerprint for out-of-band verification
      const fpCmd = `openssl x509 -in pkiworkshopcert.pem -fingerprint -sha256 -noout`
      const fpResult = await openSSLService.execute(fpCmd, [certFile])
      if (!fpResult.error) {
        const fpLine = fpResult.stdout.trim()
        setOutput(
          (prev) =>
            prev +
            `SHA-256 Fingerprint (for out-of-band verification):\n  ${fpLine}\n` +
            `  This fingerprint uniquely identifies the certificate. Share it via a separate channel to let relying parties confirm they received the correct certificate.\n\n`
        )
      }

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
        <div className="bg-card/80 border border-border rounded-2xl p-5">
          <div className="mb-4 border-b border-border pb-3">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-3">
              <span className="text-primary font-mono text-xl">01</span>
              <span className="text-foreground/80">|</span>
              RECEIVE & VALIDATE
            </h3>
            <p className="text-xs text-muted-foreground mt-1 ml-11">
              Verify CSR signature • Validate subject identity • Extract public key
            </p>
          </div>

          <div className="space-y-2">
            <FilterDropdown
              label="Certificate Signing Request"
              items={csrs.map((csr) => ({
                id: csr.id,
                label: csr.name,
              }))}
              selectedId={selectedCsrId}
              onSelect={handleCsrSelect}
              defaultLabel="-- Select CSR --"
              noContainer
              className="w-full"
            />
            {csrs.length === 0 && (
              <p className="text-xs text-destructive">No CSRs found. Generate one in Step 1.</p>
            )}
            {csrVerified && (
              <div className="flex items-center gap-1.5 text-xs text-status-success mt-1">
                <Check size={13} />
                <span>CSR self-signature verified — applicant controls the private key</span>
              </div>
            )}
          </div>
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
              Match certificate type • Check validation level • Apply policies
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
                defaultLabel="-- Select a Profile --"
                noContainer
                className="w-full"
              />
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
            Combine Key & Subject • Generate Serial & Validity • Prepare TBSCertificate
          </p>
        </div>

        <AttributeTable
          attributes={attributes}
          onAttributeChange={handleAttributeChange}
          showSource={true}
        />
      </div>

      {/* No profile selected — default TLS extensions banner */}
      {!selectedProfile && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-status-info/10 border border-status-info/30 text-status-info text-sm">
          <Info className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>
            No profile selected — default TLS extensions will be applied:{' '}
            <code className="font-mono text-xs bg-muted px-1 rounded">
              subjectAltName, extendedKeyUsage, subjectKeyIdentifier, authorityKeyIdentifier
            </code>
            . Select a profile above for industry-specific values.
          </span>
        </div>
      )}

      {/* Row 3: Step 4 & Output */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Step 4: Signing */}
        <div className="bg-card/80 border border-border rounded-2xl p-5 h-fit">
          <div className="mb-4 border-b border-border pb-3">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold">
                4
              </span>
              SIGN WITH CA KEY
            </h3>
            <p className="text-xs text-muted-foreground mt-1 ml-8">
              Hash TBSCertificate • Sign with CA Private Key • Append Signature
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <FilterDropdown
                label="Signing CA Key"
                items={rootKeys.map((key) => ({
                  id: key.id,
                  label: key.name,
                }))}
                selectedId={selectedKeyId}
                onSelect={setSelectedKeyId}
                defaultLabel="-- Select CA Key --"
                noContainer
                className="w-full"
              />
              {rootKeys.length === 0 && (
                <p className="text-xs text-status-warning mt-1">
                  No Root CA keys found. Go to Step 2 and generate a Root CA certificate first.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="validity-input" className="text-sm text-muted-foreground">
                Validity (Days)
              </label>
              <Input
                id="validity-input"
                type="number"
                value={validityDays}
                onChange={(e) => setValidityDays(e.target.value)}
              />
            </div>
            <Button
              variant="ghost"
              onClick={handleSign}
              disabled={isSigning || !selectedCsrId || !selectedKeyId}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-black font-bold rounded hover:bg-primary/90 transition-colors disabled:opacity-50 mt-4"
            >
              {isSigning ? <Loader2 className="animate-spin" /> : <PenTool />}
              Sign Certificate
            </Button>
          </div>
        </div>

        {/* Output Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Console Output</h3>
          <div className="bg-muted rounded-lg p-4 font-mono text-xs h-[300px] overflow-y-auto custom-scrollbar border border-border">
            <pre className="text-foreground whitespace-pre-wrap break-all break-words max-w-full">
              {output}
            </pre>
            {signedCert && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-muted-foreground mb-2">Signed Certificate:</p>
                <pre className="text-foreground whitespace-pre-wrap break-all break-words max-w-full">
                  {signedCert}
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
    </div>
  )
}
