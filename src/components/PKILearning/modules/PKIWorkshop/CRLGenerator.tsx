// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { ShieldAlert, Loader2, Plus, Trash2, Check, AlertTriangle } from 'lucide-react'
import { openSSLService } from '@/services/crypto/OpenSSLService'
import { useModuleStore } from '@/store/useModuleStore'
import { useOpenSSLStore } from '@/components/OpenSSLStudio/store'
import { FilterDropdown } from '@/components/common/FilterDropdown'

interface CRLGeneratorProps {
  onComplete: () => void
}

// RFC 5280 §5.3.1 revocation reason codes
const REVOCATION_REASONS = [
  { id: 'unspecified', label: 'unspecified (0)' },
  { id: 'keyCompromise', label: 'keyCompromise (1) — private key compromised' },
  { id: 'cACompromise', label: 'cACompromise (2) — CA private key compromised' },
  { id: 'affiliationChanged', label: 'affiliationChanged (3) — subject moved/left org' },
  { id: 'superseded', label: 'superseded (4) — replaced by a new certificate' },
  { id: 'cessationOfOperation', label: 'cessationOfOperation (5) — service decommissioned' },
  { id: 'certificateHold', label: 'certificateHold (6) — temporary suspension' },
  { id: 'removeFromCRL', label: 'removeFromCRL (8) — un-hold (delta CRL only)' },
]

// Format a Date as ASN.1 UTCTime: exactly YYMMDDHHMMSSZ (13 chars total per RFC 5280 §4.1.2.5.1)
const formatUtcTime = (date: Date = new Date()): string => {
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    pad(date.getUTCFullYear() % 100) +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    'Z'
  )
}

interface RevokedEntry {
  certId: string
  certName: string
  serial: string
  revocationDate: string
  reason: string
}

export const CRLGenerator: React.FC<CRLGeneratorProps> = ({ onComplete }) => {
  const { artifacts } = useModuleStore()
  const { addFile } = useOpenSSLStore()

  const [selectedKeyId, setSelectedKeyId] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [output, setOutput] = useState('')
  const [crlContent, setCrlContent] = useState<string | null>(null)
  const [parsedCrl, setParsedCrl] = useState<string | null>(null)

  // Revocation workflow state
  const [selectedCertToRevoke, setSelectedCertToRevoke] = useState('')
  const [selectedReason, setSelectedReason] = useState('unspecified')
  const [revokedEntries, setRevokedEntries] = useState<RevokedEntry[]>([])
  const [isExtractingSerial, setIsExtractingSerial] = useState(false)

  const rootCAs = artifacts.certificates.filter(
    (c) => c.tags.includes('root') && c.tags.includes('ca')
  )
  const rootKeys = artifacts.keys.filter((k) => k.description === 'Root CA Private Key')
  // End-entity certs that can be revoked
  const endEntityCerts = artifacts.certificates.filter(
    (c) => !(c.tags?.includes('root') && c.tags?.includes('ca'))
  )

  const handleAddToRevocationList = async () => {
    if (!selectedCertToRevoke) return

    const cert = endEntityCerts.find((c) => c.id === selectedCertToRevoke)
    if (!cert) return

    // Check if already queued
    if (revokedEntries.some((e) => e.certId === selectedCertToRevoke)) {
      setOutput((prev) => prev + `Certificate "${cert.name}" is already in the revocation list.\n`)
      return
    }

    setIsExtractingSerial(true)
    setOutput((prev) => prev + `Extracting serial from ${cert.name}...\n`)

    try {
      const certFile = { name: cert.name, data: new TextEncoder().encode(cert.pem) }
      const serialResult = await openSSLService.execute(
        `openssl x509 -in ${cert.name} -serial -noout`,
        [certFile]
      )

      let serial = 'unknown'
      if (!serialResult.error) {
        // Output: "serial=01234567ABCD..."
        const match = serialResult.stdout.match(/serial=([0-9A-Fa-f]+)/)
        if (match) serial = match[1].toUpperCase()
      }

      const revocationDate = formatUtcTime()

      setRevokedEntries((prev) => [
        ...prev,
        {
          certId: selectedCertToRevoke,
          certName: cert.name,
          serial,
          revocationDate,
          reason: selectedReason,
        },
      ])

      setOutput((prev) => prev + `Added "${cert.name}" (serial: ${serial}) to revocation list.\n`)
      setSelectedCertToRevoke('')
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error'
      setOutput((prev) => prev + `Error extracting serial: ${msg}\n`)
    } finally {
      setIsExtractingSerial(false)
    }
  }

  const handleRemoveEntry = (certId: string) => {
    setRevokedEntries((prev) => prev.filter((e) => e.certId !== certId))
  }

  const handleGenerate = async () => {
    if (!selectedKeyId) return
    setIsGenerating(true)
    setOutput((prev) => prev + '\n--- Generating CRL ---\n')
    setCrlContent(null)
    setParsedCrl(null)

    try {
      const caKey = rootKeys.find((k) => k.id === selectedKeyId)
      const caCert =
        rootCAs.find((c) => c.keyPairId === selectedKeyId) ||
        rootCAs.find((c) => c.name === caKey?.name.replace(' Key', ''))

      if (!caKey || !caCert) {
        throw new Error('Could not find matching Root CA certificate and key.')
      }

      // Build index.txt from revokedEntries
      // Format per OpenSSL CA database: R<tab>expiry<tab>revDate[,reason]<tab>serial<tab>unknown<tab>subject
      let indexContent = ''
      if (revokedEntries.length > 0) {
        setOutput(
          (prev) => prev + `Building index.txt with ${revokedEntries.length} revoked entries:\n`
        )
        for (const entry of revokedEntries) {
          // S5-A fix: use formatUtcTime() with a proper Date object (not inline ISO string slicing)
          const expiryDate = new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000)
          const expiry = formatUtcTime(expiryDate) // 13 chars: YYMMDDHHMMSSZ ✓
          const revDate = entry.revocationDate
          const reasonCode = entry.reason !== 'unspecified' ? entry.reason : ''
          const revField = reasonCode ? `${revDate},${reasonCode}` : revDate
          // S5-B fix: use the cert's Subject DN from metadata, not its filename
          const certArtifact = endEntityCerts.find((c) => c.id === entry.certId)
          const subjectDN = certArtifact?.metadata?.subject || `/CN=${entry.certName}`
          indexContent += `R\t${expiry}\t${revField}\t${entry.serial}\tunknown\t${subjectDN}\n`
          setOutput(
            (prev) => prev + `  Serial ${entry.serial}: ${entry.reason} (subject: ${subjectDN})\n`
          )
        }
      } else {
        // S5-C: empty index.txt — add a newline so OpenSSL doesn't fail on empty file
        indexContent = '\n'
        setOutput(
          (prev) =>
            prev +
            `No certificates queued for revocation — generating an empty CRL.\n` +
            `  An empty CRL is valid and serves as proof that no certificates have been revoked.\n` +
            `  Relying parties check CRLs periodically; an empty CRL confirms the CA is operational.\n\n`
        )
      }

      // 1. Prepare index.txt
      const indexFile = { name: 'index.txt', data: new TextEncoder().encode(indexContent) }

      // 2. crlnumber: hex CRL serial per RFC 5280 §5.2.3 (must be monotonically increasing)
      // In a real CA this is persisted and incremented each time; here we use a random base.
      const crlNumberBase = Math.floor(Math.random() * 0xffff)
      const crlNumberHex = crlNumberBase.toString(16).toUpperCase().padStart(4, '0')
      const crlNumberFile = {
        name: 'crlnumber',
        data: new TextEncoder().encode(crlNumberHex + '\n'),
      }

      // 3. Config file for CA — S5-D: include crl_extensions for authorityKeyIdentifier (RFC 5280 §5.2)
      const configContent = `
[ ca ]
default_ca = my_ca

[ my_ca ]
database = index.txt
crlnumber = crlnumber
default_md = sha256
default_crl_days = 30
preserve = no
crl_extensions = crl_ext

[ crl_ext ]
authorityKeyIdentifier = keyid:always
`
      const configFile = { name: 'crl.conf', data: new TextEncoder().encode(configContent) }

      const keyFile = { name: caKey.name, data: new TextEncoder().encode(caKey.privateKey!) }
      const certFile = { name: caCert.name, data: new TextEncoder().encode(caCert.pem) }

      const timestamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 14)
      const crlName = `pkiworkshop_crl_${timestamp}.crl`

      const cmd = `openssl ca -gencrl -keyfile "${caKey.name}" -cert "${caCert.name}" -out "${crlName}" -config crl.conf`
      setOutput((prev) => prev + `$ ${cmd}\n\n`)

      setOutput(
        (prev) =>
          prev +
          `  index.txt: OpenSSL CA database of certificate status (R=Revoked, V=Valid, E=Expired)\n` +
          `    Format: <status>  <expiry>  <revocationDate>[,<reason>]  <serial>  unknown  <subject>\n` +
          `    expiry:         when the certificate itself expires (UTCTime YYMMDDHHMMSSZ, RFC 5280 §4.1.2.5.1)\n` +
          `    revocationDate: when revocation was recorded — different from expiry\n` +
          `    unknown:        placeholder for the cert file path — not used in CRL generation\n` +
          `    UTCTime note:   UTCTime is valid only for dates up to 2049. From 2050 onward, RFC 5280\n` +
          `                    requires GeneralizedTime (YYYYMMDDHHMMSSZ, 15 chars). This workshop\n` +
          `                    uses UTCTime with dates well within the 2049 boundary.\n\n` +
          `  crlnumber: ${crlNumberHex} (${crlNumberBase} decimal)\n` +
          `    RFC 5280 §5.2.3: crlnumber (OID 2.5.29.20) must be monotonically increasing per issuance.\n` +
          `    This workshop uses a random base — a real CA persists and increments this counter.\n\n`
      )

      const result = await openSSLService.execute(cmd, [
        keyFile,
        certFile,
        indexFile,
        crlNumberFile,
        configFile,
      ])

      if (result.error || result.stderr.includes('error')) {
        throw new Error(result.error || result.stderr)
      }

      const generatedFile = result.files.find((f) => f.name === crlName)
      if (!generatedFile) {
        throw new Error('CRL file not found in output')
      }

      const crlText = new TextDecoder().decode(generatedFile.data)
      setCrlContent(crlText)

      // Sync to OpenSSL Studio
      addFile({
        name: crlName,
        type: 'text',
        content: generatedFile.data,
        size: generatedFile.data.length,
        timestamp: Date.now(),
      })

      setOutput(
        (prev) =>
          prev +
          `CRL generated successfully with ${revokedEntries.length} revoked certificate(s).\n\n`
      )

      // Auto-parse the CRL after generation
      setOutput((prev) => prev + `$ openssl crl -in ${crlName} -text -noout\n`)
      const parseResult = await openSSLService.execute(`openssl crl -in ${crlName} -text -noout`, [
        generatedFile,
      ])

      if (!parseResult.error) {
        setParsedCrl(parseResult.stdout)
        setOutput(
          (prev) =>
            prev +
            `  thisUpdate: the time this CRL was issued by the CA\n` +
            `  nextUpdate: the deadline by which the CA will issue a new CRL\n` +
            `    If a relying party holds no CRL newer than nextUpdate, it must treat the CRL as expired and fetch a fresh one.\n` +
            (revokedEntries.length > 0
              ? `  Revoked Certificates: each entry has a serial number, revocation date, and reason code\n` +
                `    This is what a relying party checks: if the cert's serial appears here, reject it.\n\n`
              : '\n') +
            `  How do relying parties find this CRL? (S5-E — CDP & OCSP)\n` +
            `    In production, every issued certificate contains a cRLDistributionPoints (CDP)\n` +
            `    extension (OID 2.5.29.31) that holds one or more URLs where the current CRL is hosted.\n` +
            `    Example CDP URL: http://pki.example.com/crl/root.crl\n` +
            `    Browsers and TLS stacks download the CRL from this URL to check revocation.\n\n` +
            `    OCSP (Online Certificate Status Protocol, RFC 6960) is the modern alternative:\n` +
            `    instead of downloading a full CRL, the client queries an OCSP responder for a\n` +
            `    single certificate's status. The certificate's Authority Information Access (AIA)\n` +
            `    extension (OID 1.3.6.1.5.5.7.48.1) contains the OCSP responder URL.\n` +
            `    OCSP Stapling (RFC 6066) lets the server pre-fetch and cache the OCSP response,\n` +
            `    eliminating the client's need to contact the OCSP responder directly.\n`
        )
      }

      onComplete()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setOutput((prev) => prev + `Error: ${errorMessage}\n`)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Workflow tip: Step 4 ↔ Step 5 ordering */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-status-info/10 border border-status-info/30 text-status-info text-xs">
        <span className="shrink-0 font-bold mt-0.5">Tip</span>
        <span>
          Generate and download the CRL here (Step 5), then return to{' '}
          <strong>Step 4 — Parse Certificates</strong> to verify a certificate&apos;s revocation
          status against it. CRL verification in Step 4 uses the CRL you generate here.
        </span>
      </div>

      {/* Panel 1: Revoke a Certificate */}
      <div className="bg-card/80 border border-border rounded-2xl p-5">
        <div className="mb-4 border-b border-border pb-3">
          <h3 className="text-lg font-bold text-foreground flex items-center gap-3">
            <span className="text-primary font-mono text-xl">01</span>
            <span className="text-foreground/80">|</span>
            REVOKE A CERTIFICATE
          </h3>
          <p className="text-xs text-muted-foreground mt-1 ml-11">
            Select an end-entity certificate • Choose a revocation reason • Queue for CRL
          </p>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FilterDropdown
              label="Certificate to Revoke"
              items={endEntityCerts.map((cert) => ({
                id: cert.id,
                label: cert.name,
              }))}
              selectedId={selectedCertToRevoke}
              onSelect={setSelectedCertToRevoke}
              defaultLabel="-- Select Certificate --"
              noContainer
              className="w-full"
            />

            <FilterDropdown
              label="Revocation Reason (RFC 5280)"
              items={REVOCATION_REASONS.filter((r) => r.id !== 'removeFromCRL')}
              selectedId={selectedReason}
              onSelect={setSelectedReason}
              noContainer
              className="w-full"
            />
            {selectedReason === 'removeFromCRL' && (
              <p className="text-xs text-status-warning mt-1">
                removeFromCRL (8) is only valid in delta CRLs — not applicable in a base CRL.
              </p>
            )}
          </div>

          <button
            onClick={handleAddToRevocationList}
            disabled={isExtractingSerial || !selectedCertToRevoke}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-status-warning/20 text-status-warning border border-status-warning/40 font-medium rounded hover:bg-status-warning/30 transition-colors disabled:opacity-50 text-sm"
          >
            {isExtractingSerial ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Plus size={16} />
            )}
            Add to Revocation List
          </button>

          {endEntityCerts.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No end-entity certificates found. Sign one in Step 3 first.
            </p>
          )}

          {/* Queued revocation entries */}
          {revokedEntries.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-muted-foreground mb-2 font-medium">
                Queued for revocation ({revokedEntries.length}):
              </p>
              <div className="space-y-2">
                {revokedEntries.map((entry) => (
                  <div
                    key={entry.certId}
                    className="flex items-center justify-between p-2 bg-muted/30 rounded border border-border/40 text-xs"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-foreground font-medium">{entry.certName}</span>
                      <span className="text-muted-foreground font-mono">
                        Serial: {entry.serial} &nbsp;·&nbsp; Reason: {entry.reason}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveEntry(entry.certId)}
                      className="text-muted-foreground hover:text-status-error transition-colors ml-3"
                      title="Remove from revocation list"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Panel 2: Generate CRL */}
      <div className="bg-card/80 border border-border rounded-2xl p-5">
        <div className="mb-4 border-b border-border pb-3">
          <h3 className="text-lg font-bold text-foreground flex items-center gap-3">
            <span className="text-primary font-mono text-xl">02</span>
            <span className="text-foreground/80">|</span>
            GENERATE REVOCATION LIST (CRL)
          </h3>
          <p className="text-xs text-muted-foreground mt-1 ml-11">
            Sign CRL with Root CA key • Embed revoked serials • Publish for relying parties
          </p>
        </div>

        <div className="space-y-4">
          <FilterDropdown
            label="Select Root CA Key"
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

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !selectedKeyId}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-primary text-black font-bold rounded hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isGenerating ? <Loader2 className="animate-spin" /> : <ShieldAlert />}
            Generate CRL
            {revokedEntries.length > 0 ? ` (${revokedEntries.length} revoked)` : ' (empty)'}
          </button>
        </div>
      </div>

      {/* Output Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Console Output</h3>
        <div className="bg-muted rounded-lg p-4 font-mono text-xs h-[300px] overflow-y-auto custom-scrollbar border border-border">
          <pre className="text-foreground whitespace-pre-wrap break-all break-words max-w-full">
            {output}
          </pre>
          {crlContent && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-muted-foreground mb-2">Generated CRL (PEM):</p>
              <pre className="text-foreground whitespace-pre-wrap break-all break-words max-w-full">
                {crlContent}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Parsed CRL tree view */}
      {parsedCrl && (
        <div className="bg-card/80 border border-border rounded-2xl p-5">
          <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            {revokedEntries.length > 0 ? (
              <AlertTriangle className="text-status-warning" size={18} />
            ) : (
              <Check className="text-status-success" size={18} />
            )}
            Parsed CRL
          </h3>
          <div className="bg-muted/30 rounded-lg p-4 font-mono text-xs border border-border overflow-y-auto max-h-[300px] custom-scrollbar">
            <pre className="text-foreground whitespace-pre-wrap break-all break-words">
              {parsedCrl}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
