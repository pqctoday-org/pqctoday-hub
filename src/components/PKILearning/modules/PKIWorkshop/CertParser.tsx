// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import {
  FileText,
  Search,
  Loader2,
  AlertTriangle,
  Download,
  ArrowRightLeft,
  Check,
  ChevronDown,
  ChevronRight,
  Eye,
  Code,
  ShieldCheck,
} from 'lucide-react'
import { openSSLService } from '@/services/crypto/OpenSSLService'
import { useModuleStore } from '@/store/useModuleStore'
import { useOpenSSLStore } from '../../../OpenSSLStudio/store'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { Button } from '@/components/ui/button'
import { getCryptoErrorHint } from '@/utils/cryptoErrorHint'

interface CertParserProps {
  onComplete: () => void
}

export const CertParser: React.FC<CertParserProps> = ({ onComplete }) => {
  const csrs = useModuleStore((state) => state.artifacts.csrs)
  const allCertificates = useModuleStore((state) => state.artifacts.certificates)

  const rootCAs = allCertificates.filter((c) => c.tags?.includes('root') && c.tags?.includes('ca'))
  const certificates = allCertificates.filter(
    (c) => !(c.tags?.includes('root') && c.tags?.includes('ca'))
  )

  const [certInput, setCertInput] = useState('')
  const [selectedArtifactId, setSelectedArtifactId] = useState('')
  const [selectedArtifactName, setSelectedArtifactName] = useState('')
  const [parsedOutput, setParsedOutput] = useState<string | null>(null)
  const [isParsing, setIsParsing] = useState(false)
  const [isConverting, setIsConverting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conversionResult, setConversionResult] = useState<{
    name: string
    url: string
    format: string
  } | null>(null)
  const [viewMode, setViewMode] = useState<'tree' | 'raw'>('tree')
  const [isVerifying, setIsVerifying] = useState(false)
  const [verifyResult, setVerifyResult] = useState<{
    success: boolean
    message: string
  } | null>(null)
  const [fingerprint, setFingerprint] = useState<string | null>(null)
  const [isFingerprintLoading, setIsFingerprintLoading] = useState(false)
  const [isVerifyingCsr, setIsVerifyingCsr] = useState(false)
  const [csrVerifyResult, setCsrVerifyResult] = useState<{
    success: boolean
    message: string
  } | null>(null)
  const [isVerifyingCrl, setIsVerifyingCrl] = useState(false)
  const [crlVerifyResult, setCrlVerifyResult] = useState<{
    success: boolean
    message: string
  } | null>(null)

  // CRL files from OpenSSL Studio virtual filesystem
  const openSSLFiles = useOpenSSLStore((state) => state.files)
  const crlFiles = openSSLFiles.filter((f) => f.name.endsWith('.crl'))

  // Hybrid cert files pushed by HybridCertFormats workshop
  const hybridCertFiles = openSSLFiles.filter(
    (f) => f.name.startsWith('hybrid-') && f.name.endsWith('.pem')
  )
  const [selectedHybridFile, setSelectedHybridFile] = useState('')

  // Check if selected artifact is a non-Root-CA certificate (eligible for chain verification)
  const selectedIsEndEntity = Boolean(
    selectedArtifactId && certificates.find((c) => c.id === selectedArtifactId)
  )
  const canVerifyChain = selectedIsEndEntity && rootCAs.length > 0
  const canVerifyCrl = selectedIsEndEntity && rootCAs.length > 0 && crlFiles.length > 0
  const isCrlInput = certInput.includes('BEGIN X509 CRL')
  const isCsrInput = certInput.includes('BEGIN CERTIFICATE REQUEST')
  const isCertInput = certInput.includes('BEGIN CERTIFICATE') && !isCrlInput

  const handleVerifyChain = async () => {
    if (!canVerifyChain) return

    setIsVerifying(true)
    setVerifyResult(null)
    setError(null)

    try {
      const cert = certificates.find((c) => c.id === selectedArtifactId)
      if (!cert) return

      // Best-match root CA: find one whose subject matches the cert's issuer (S4-C: run for any count)
      let rootCA = rootCAs[0]
      if (parsedOutput) {
        const issuerMatch = parsedOutput.match(/Issuer:\s*(.+)/i)
        if (issuerMatch) {
          const issuerStr = issuerMatch[1].trim()
          const match = rootCAs.find((ca) => {
            const caSubject = ca.metadata?.subject || ca.name
            return (
              caSubject.includes(issuerStr) ||
              issuerStr.includes(caSubject) ||
              issuerStr.split(',').some((part) => caSubject.includes(part.trim()))
            )
          })
          if (match) rootCA = match
        }
      }

      if (!rootCA) return

      const certFile = { name: 'cert.pem', data: new TextEncoder().encode(cert.pem) }
      const caFile = { name: 'ca.pem', data: new TextEncoder().encode(rootCA.pem) }

      const result = await openSSLService.execute('openssl verify -CAfile ca.pem cert.pem', [
        certFile,
        caFile,
      ])

      if (result.error || result.stdout.includes('error')) {
        setVerifyResult({
          success: false,
          message: `Chain verification failed: ${result.stderr || result.stdout}`,
        })
      } else {
        setVerifyResult({
          success: true,
          message:
            `Chain verified: ${cert.name} is signed by ${rootCA.name}.\n` +
            `Note: openssl verify checks the certificate chain and signature only — it does NOT check CRL or OCSP revocation status.`,
        })
      }
    } catch (err) {
      setVerifyResult({
        success: false,
        message: err instanceof Error ? err.message : 'Verification failed',
      })
    } finally {
      setIsVerifying(false)
    }
  }

  const handleGetFingerprint = async () => {
    if (!certInput.trim() || !isCertInput) return

    setIsFingerprintLoading(true)
    setFingerprint(null)

    try {
      const fileName = selectedArtifactName || 'manual_input.pem'
      const file = { name: fileName, data: new TextEncoder().encode(certInput) }
      const result = await openSSLService.execute(
        `openssl x509 -in ${fileName} -fingerprint -sha256 -noout`,
        [file]
      )
      if (!result.error) {
        setFingerprint(result.stdout.trim())
      } else {
        setFingerprint(`Error: ${result.stderr || result.error}`)
      }
    } catch (err) {
      setFingerprint(err instanceof Error ? err.message : 'Fingerprint failed')
    } finally {
      setIsFingerprintLoading(false)
    }
  }

  const handleVerifyCsr = async () => {
    if (!certInput.trim() || !isCsrInput) return

    setIsVerifyingCsr(true)
    setCsrVerifyResult(null)

    try {
      const fileName = selectedArtifactName || 'manual_input.csr'
      const file = { name: fileName, data: new TextEncoder().encode(certInput) }
      const result = await openSSLService.execute(`openssl req -verify -in ${fileName} -noout`, [
        file,
      ])
      const ok = !result.error && (result.stdout.includes('OK') || result.stderr.includes('OK'))
      setCsrVerifyResult({
        success: ok,
        message: ok
          ? `CSR signature verified. The requester holds the private key matching this CSR's public key.`
          : `CSR signature verification failed: ${result.stderr || result.stdout}`,
      })
    } catch (err) {
      setCsrVerifyResult({
        success: false,
        message: err instanceof Error ? err.message : 'Verification failed',
      })
    } finally {
      setIsVerifyingCsr(false)
    }
  }

  const handleVerifyCrl = async () => {
    if (!canVerifyCrl) return

    setIsVerifyingCrl(true)
    setCrlVerifyResult(null)
    setError(null)

    try {
      const cert = certificates.find((c) => c.id === selectedArtifactId)
      if (!cert) return

      // Best-match root CA (same logic as chain verify — S4-C: run for any count)
      let rootCA = rootCAs[0]
      if (parsedOutput) {
        const issuerMatch = parsedOutput.match(/Issuer:\s*(.+)/i)
        if (issuerMatch) {
          const issuerStr = issuerMatch[1].trim()
          const match = rootCAs.find((ca) => {
            const caSubject = ca.metadata?.subject || ca.name
            return (
              caSubject.includes(issuerStr) ||
              issuerStr.includes(caSubject) ||
              issuerStr.split(',').some((part) => caSubject.includes(part.trim()))
            )
          })
          if (match) rootCA = match
        }
      }

      // Select the best-matching CRL: prefer the one whose name contains the CA name, else use latest.
      // In a real PKI the correct CRL is identified by the issuer DN in the CRL matching the cert's issuer.
      const caName = rootCA.name.toLowerCase().replace(/\s+/g, '')
      const matchedCrl =
        crlFiles.find((f) => f.name.toLowerCase().replace(/\s+/g, '').includes(caName)) ??
        crlFiles[crlFiles.length - 1]
      const latestCrl = matchedCrl
      // S4-B: content can be string or Uint8Array — normalise to Uint8Array
      const crlData: Uint8Array =
        latestCrl.content instanceof Uint8Array
          ? latestCrl.content
          : typeof latestCrl.content === 'string'
            ? new TextEncoder().encode(latestCrl.content)
            : new Uint8Array(latestCrl.content as ArrayBuffer)

      const certFile = { name: 'cert.pem', data: new TextEncoder().encode(cert.pem) }
      const caFile = { name: 'ca.pem', data: new TextEncoder().encode(rootCA.pem) }
      const crlFile = { name: 'crl.crl', data: crlData }

      const result = await openSSLService.execute(
        'openssl verify -CAfile ca.pem -CRLfile crl.crl -crl_check cert.pem',
        [certFile, caFile, crlFile]
      )

      if (result.error || result.stdout.includes('error') || result.stderr.includes('error')) {
        const msg = result.stderr || result.stdout
        const isRevoked = msg.includes('revoked') || msg.includes('CRL')
        setCrlVerifyResult({
          success: false,
          message: isRevoked
            ? `Certificate is REVOKED per CRL (${latestCrl.name}).`
            : `CRL check failed: ${msg}`,
        })
      } else {
        setCrlVerifyResult({
          success: true,
          message: `Certificate is NOT listed in the CRL (${latestCrl.name}) — not revoked as of this CRL's thisUpdate.`,
        })
      }
    } catch (err) {
      setCrlVerifyResult({
        success: false,
        message: err instanceof Error ? err.message : 'CRL verification failed',
      })
    } finally {
      setIsVerifyingCrl(false)
    }
  }

  // Collapsible tree node component
  const TreeNode: React.FC<{
    label: string
    value?: string
    children?: React.ReactNode
    defaultOpen?: boolean
  }> = ({ label, value, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen)
    const hasChildren = !!children

    return (
      <div className="text-xs">
        <div
          role={hasChildren ? 'button' : undefined}
          tabIndex={hasChildren ? 0 : undefined}
          className={`flex items-start gap-1 py-0.5 ${hasChildren ? 'cursor-pointer hover:bg-muted/10' : ''}`}
          onClick={() => hasChildren && setIsOpen(!isOpen)}
          onKeyDown={(e) => {
            if (hasChildren && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault()
              setIsOpen(!isOpen)
            }
          }}
        >
          {hasChildren && (
            <span className="text-muted-foreground mt-0.5">
              {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </span>
          )}
          {!hasChildren && <span className="w-[14px]" />}
          <span className="text-primary font-medium">{label}:</span>
          {value && <span className="text-foreground">{value}</span>}
        </div>
        {hasChildren && isOpen && (
          <div className="ml-4 border-l border-border pl-2">{children}</div>
        )}
      </div>
    )
  }

  // Parse OpenSSL text output into structured data
  type TreeNodeData =
    | { type: 'text'; content: string }
    | { type: 'leaf'; label: string; value: string }
    | { type: 'node'; label: string; value?: string; children: TreeNodeData[] }

  const ParsedCertView: React.FC<{ output: string }> = ({ output }) => {
    const lines = output.split('\n')

    // Enhanced parser to create deeper tree structure
    const parseLines = (
      lines: string[],
      startIdx: number = 0,
      baseIndent: number = 0
    ): { nodes: TreeNodeData[]; endIdx: number } => {
      const nodes: TreeNodeData[] = []
      let i = startIdx

      while (i < lines.length) {
        // eslint-disable-next-line security/detect-object-injection
        const line = lines[i]
        if (!line.trim()) {
          i++
          continue
        }

        // Calculate indentation
        const indent = line.search(/\S/)

        // If less indented than base, we're done with this level
        if (indent < baseIndent && i > startIdx) {
          break
        }

        const trimmed = line.trim()

        // Check for key: value format
        const match = trimmed.match(/^([^:]+):\s*(.*)$/)

        if (match) {
          const key = match[1].trim()
          const value = match[2].trim()

          // Look ahead to see if there are nested items
          let hasNested = false
          if (i + 1 < lines.length) {
            const nextLine = lines[i + 1]
            const nextIndent = nextLine.search(/\S/)
            hasNested = nextIndent > indent && !!nextLine.trim()
          }

          if (hasNested) {
            // Parse nested content
            const { nodes: children, endIdx } = parseLines(lines, i + 1, indent + 1)
            nodes.push({ type: 'node', label: key, value: value || undefined, children })
            i = endIdx
          } else {
            // Simple key-value pair
            nodes.push({ type: 'leaf', label: key, value: value || '(empty)' })
            i++
          }
        } else {
          // Plain text line
          nodes.push({ type: 'text', content: trimmed })
          i++
        }
      }

      return { nodes, endIdx: i }
    }

    const { nodes } = parseLines(lines)

    const renderNode = (node: TreeNodeData, idx: number, depth: number = 0): React.ReactNode => {
      if (node.type === 'text') {
        return (
          <div key={idx} className="text-muted-foreground py-0.5 ml-4">
            {node.content}
          </div>
        )
      }

      if (node.type === 'leaf') {
        return <TreeNode key={idx} label={node.label} value={node.value} />
      }

      if (node.type === 'node') {
        // Top level (depth 0) should always be expanded and non-collapsible
        if (depth === 0) {
          return (
            <div key={idx} className="mb-2">
              <div className="text-xs py-0.5">
                <span className="text-primary font-bold">{node.label}:</span>
                {node.value && <span className="text-foreground ml-1">{node.value}</span>}
              </div>
              <div className="ml-4 border-l border-border pl-2">
                {node.children.map((child, childIdx) => renderNode(child, childIdx, depth + 1))}
              </div>
            </div>
          )
        }

        // Deeper levels are collapsible
        return (
          <TreeNode key={idx} label={node.label} value={node.value} defaultOpen={depth < 3}>
            {node.children.map((child, childIdx) => renderNode(child, childIdx, depth + 1))}
          </TreeNode>
        )
      }

      return null
    }

    return <div className="space-y-1">{nodes.map((node, idx) => renderNode(node, idx, 0))}</div>
  }
  const handleArtifactSelect = (id: string) => {
    setSelectedArtifactId(id)
    setParsedOutput(null)
    setConversionResult(null)
    setVerifyResult(null)
    setError(null)

    if (!id) {
      setCertInput('')
      setSelectedArtifactName('')
      return
    }

    // Search in all collections
    const csr = csrs.find((c) => c.id === id)
    if (csr) {
      setCertInput(csr.pem)
      setSelectedArtifactName(csr.name)
      return
    }

    const rootCA = rootCAs.find((c) => c.id === id)
    if (rootCA) {
      setCertInput(rootCA.pem)
      setSelectedArtifactName(rootCA.name)
      return
    }

    const cert = certificates.find((c) => c.id === id)
    if (cert) {
      setCertInput(cert.pem)
      setSelectedArtifactName(cert.name)
      return
    }
  }

  const handleHybridSelect = (fileName: string) => {
    setSelectedHybridFile(fileName)
    setSelectedArtifactId('')
    setParsedOutput(null)
    setConversionResult(null)
    setVerifyResult(null)
    setFingerprint(null)
    setError(null)

    if (!fileName) {
      setCertInput('')
      setSelectedArtifactName('')
      return
    }

    const file = hybridCertFiles.find((f) => f.name === fileName)
    if (!file) return

    const pem =
      typeof file.content === 'string'
        ? file.content
        : new TextDecoder().decode(file.content as Uint8Array)
    setCertInput(pem)
    setSelectedArtifactName(fileName)
  }

  // Map hybrid file name prefix → educational note
  const HYBRID_FORMAT_NOTES: Record<string, { title: string; note: string }> = {
    'hybrid-pure-pqc.pem': {
      title: 'Pure PQC — ML-DSA-65 (RFC 9881)',
      note: 'Single PQC algorithm only. No classical fallback. Requires a PQC-aware relying party. OpenSSL 3.x will parse the X.509 structure; the signature algorithm OID (2.16.840.1.101.3.4.3.18) is registered in FIPS 204.',
    },
    'hybrid-pure-pqc-slh.pem': {
      title: 'Pure PQC — SLH-DSA-SHA2-128s (RFC 9909)',
      note: 'Stateless hash-based signature scheme. Larger signatures (~8KB) but no algebraic structure assumptions. Algorithm OID 2.16.840.1.101.3.4.3.20 per FIPS 205.',
    },
    'hybrid-composite.pem': {
      title: 'Composite Signature — MLDSA65-ECDSA-P256-SHA512 (draft-ietf-lamps-pq-composite-sigs)',
      note: 'Both ML-DSA-65 and ECDSA-P256 signatures are bound in a single SubjectPublicKeyInfo and SignatureValue — secure as long as either algorithm holds. OID 1.3.6.1.5.5.7.6.45 is draft-assigned (proposed in the IETF LAMPS working group, not yet IANA-registered or in a finalized RFC as of 2025) — do not expect to find this OID in production certificates today. OpenSSL will parse the outer X.509 structure; the inner composite encoding is draft-specific and will appear as an unknown algorithm.',
    },
    'hybrid-alt-sig.pem': {
      title: 'Alternative Signature (Alt-Sig) — ITU-T X.509 §9.8',
      note: 'A classical ECDSA certificate carrying the PQC key and signature in private extensions (OIDs 2.5.29.72/73/74). Backward-compatible: classical verifiers ignore the unknown extensions. PQC-aware verifiers check both. OpenSSL x509 will show the extensions as unrecognized hex.',
    },
    'hybrid-related-certs-0.pem': {
      title: 'Related Certificates — Classical cert (RFC 9763)',
      note: 'Certificate A of a bound pair: ECDSA P-256. Carries a RelatedCertificate extension (OID 1.3.6.1.5.5.7.1.36) pointing to the companion ML-DSA-65 cert. Each cert is individually valid; the binding proves they share the same subject identity.',
    },
    'hybrid-related-certs-1.pem': {
      title: 'Related Certificates — PQC cert (RFC 9763)',
      note: 'Certificate B of a bound pair: ML-DSA-65. Carries a matching RelatedCertificate extension pointing back to the ECDSA cert. Relying parties that support RFC 9763 verify both certs and the binding.',
    },
    'hybrid-chameleon.pem': {
      title: 'Chameleon Certificate (draft-bonnell-lamps-chameleon-certs)',
      note: 'Primary cert uses ML-DSA-65; a delta certificate descriptor extension (OID 2.16.840.1.114027.80.6.1) encodes an ECDSA variant. Same SubjectPublicKeyInfo base, different signature algorithms. Classical verifiers see an ECDSA cert; PQC-aware verifiers reconstruct and verify both. Most experimental of the 6 formats.',
    },
  }

  // eslint-disable-next-line security/detect-object-injection
  const selectedHybridNote = selectedHybridFile ? HYBRID_FORMAT_NOTES[selectedHybridFile] : null

  const handleParse = async () => {
    if (!certInput.trim()) return

    setIsParsing(true)
    setError(null)
    setParsedOutput(null)

    try {
      const isCsrLocal = certInput.includes('BEGIN CERTIFICATE REQUEST')
      const isCrlLocal = certInput.includes('BEGIN X509 CRL')
      // Use selected name or default
      const fileName =
        selectedArtifactName ||
        (isCsrLocal ? 'manual_input.csr' : isCrlLocal ? 'manual_input.crl' : 'manual_input.pem')

      const file = {
        name: fileName,
        data: new TextEncoder().encode(certInput),
      }

      const command = isCsrLocal
        ? `openssl req -in ${fileName} -text -noout`
        : isCrlLocal
          ? `openssl crl -in ${fileName} -text -noout`
          : `openssl x509 -in ${fileName} -text -noout`

      const result = await openSSLService.execute(command, [file])

      if (result.error) {
        setError(result.error)
      } else {
        setParsedOutput(result.stdout)
        onComplete()
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(errorMessage)
    } finally {
      setIsParsing(false)
    }
  }

  const handleConvert = async (format: 'DER' | 'P7B') => {
    if (!certInput.trim()) return

    setIsConverting(true)
    setError(null)
    setConversionResult(null)

    try {
      const isCsr = certInput.includes('BEGIN CERTIFICATE REQUEST')
      const isCrl = certInput.includes('BEGIN X509 CRL')
      const inputName =
        selectedArtifactName ||
        (isCsr ? 'manual_input.csr' : isCrl ? 'manual_input.crl' : 'manual_input.pem')
      const inputFile = {
        name: inputName,
        data: new TextEncoder().encode(certInput),
      }

      let command = ''
      let outputName = ''

      if (format === 'DER') {
        // Preserve base name if possible
        const baseName = inputName.replace(/\.(pem|crt|csr|key)$/, '')
        outputName = `${baseName}.der`

        command = isCsr
          ? `openssl req -in "${inputName}" -outform DER -out "${outputName}"`
          : `openssl x509 -in "${inputName}" -outform DER -out "${outputName}"`
      } else if (format === 'P7B') {
        if (isCsr) throw new Error('CSRs cannot be converted to P7B.')
        const baseName = inputName.replace(/\.(pem|crt|csr|key)$/, '')
        outputName = `${baseName}.p7b`

        // P7B (PKCS#7) usually requires crl2pkcs7 in OpenSSL CLI for simple conversion
        command = `openssl crl2pkcs7 -nocrl -certfile "${inputName}" -out "${outputName}"`
      }

      const result = await openSSLService.execute(command, [inputFile])

      if (result.error) {
        setError(result.stderr || result.error)
      } else {
        const outFile = result.files.find((f) => f.name === outputName)
        if (outFile) {
          const blob = new Blob([outFile.data as unknown as BlobPart], {
            type: 'application/octet-stream',
          })
          const url = URL.createObjectURL(blob)
          setConversionResult({ name: outputName, url, format })

          // Add to OpenSSL Store so it appears in Key Files
          const { addFile } = useOpenSSLStore.getState()
          addFile({
            name: outputName,
            type: 'binary', // DER and P7B are binary/structured
            content: outFile.data,
            size: outFile.data.length,
            timestamp: Date.now(),
          })
        } else {
          const availableFiles = result.files.map((f) => f.name).join(', ')
          throw new Error(
            `Conversion output file '${outputName}' not found. Available: ${availableFiles || 'None'}`
          )
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Conversion failed'
      setError(errorMessage)
    } finally {
      setIsConverting(false)
    }
  }

  const loadExampleCert = () => {
    // Real self-signed certificate (RSA-2048, SHA-256, CN=example.com) — parses successfully with openssl x509
    const example = `-----BEGIN CERTIFICATE-----
MIICpDCCAYwCCQDU+pQ4pHgSpDANBgkqhkiG9w0BAQsFADAUMRIwEAYDVQQDDAle
eGFtcGxlQ0EwHhcNMjMwMTAxMDAwMDAwWhcNMjQwMTAxMDAwMDAwWjAUMRIwEAYD
VQQDDAlleGFtcGxlQ0EwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQC7
o4qne60TB3wolVMDnnq3D6B3tWLvWdqKuOEckWF6VjVbWRidPM7EJcvxLmf/TBZV
IH4xDsGS3BalU/yj5MCsqkfEjWEFl5uSNE3wSAT1JTiCFBs3g7JGaT/OcfnFkSDy
wPHQdPvfbKQXH7BQJX3iVX1oQCRJBPhqt8nKlY7XjQKCTEcBQlKaKN0GPlhY3oa2
xSSb7mCKhVBs6VJTiHSSaqmkrz0YVRG0LsNDrBoQLt8GhGvM8sqhq0dkKV2XTUNR
8c5fACBX4L/uyarphLHfMWU1sUaxv/WkVsMsujqfbq/djSX9Kx6kpNvvLUDHKrJk
VZi0yUxPBMSSyS8vAgMBAAEwDQYJKoZIhvcNAQELBQADggEBAAt0Qdp1g7TS3hTU
v2mSdUMb3dYlnW5YPXKX4jRn5OJh2OkQ1Gj4ZUsevfwmJB4LOqGeMkjf7RNIDW3
WQWB5LFfMAlBGSGQMNK0SV7K5l1pHagXBkJpbqUiYJCJT4ByMJq8aCCSwYi1VwRd
MtVq3i6UFKxK3I36AVFD1LmB6SXy0mPHt3GQXJ0ZEBRlHxjN0AXZvANHaFD+4t3M
rJFaZ0HBgajCN5cLxnj5oJzgEfIW6kJV2mCsYmHVLaEyGQTYH5LkQh1pAHEbMZ5x
8CjRRMsDkzLT2z6C4cMWlF8hbAaD0N5P2JkdmZuKxLsJVNLv7dTn7JT7jy7aFlvM
S8Y=
-----END CERTIFICATE-----`
    setCertInput(example)
    setSelectedArtifactId('')
    setSelectedArtifactName('example_cert.pem')
  }

  return (
    <div className="space-y-6">
      {/* Artifact Selection */}
      <div className="bg-card/80 border border-border rounded-2xl p-5">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Search className="text-primary" size={20} />
          Inspect Generated Artifacts
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <FilterDropdown
              label="Select a Certificate or CSR to inspect"
              items={[
                ...csrs.map((csr) => ({
                  id: csr.id,
                  label: csr.name,
                })),
                ...rootCAs.map((ca) => ({
                  id: ca.id,
                  label: ca.name,
                })),
                ...certificates.map((cert) => ({
                  id: cert.id,
                  label: cert.name,
                })),
              ]}
              selectedId={selectedArtifactId}
              onSelect={handleArtifactSelect}
              defaultLabel="-- Select from Workshop --"
              noContainer
              className="w-full"
            />
          </div>
          <div className="flex items-end">
            <Button
              variant="ghost"
              onClick={loadExampleCert}
              className="text-sm text-primary hover:text-primary/80 underline mb-2"
            >
              Or load example certificate
            </Button>
          </div>
        </div>

        {/* Hybrid cert picker — only shown when certs are available from Playground */}
        {hybridCertFiles.length > 0 && (
          <div className="mt-4 space-y-2">
            <FilterDropdown
              label="Or load a Hybrid / PQC Certificate (from Playground)"
              items={hybridCertFiles.map((f) => ({
                id: f.name,
                label: f.name.replace(/^hybrid-/, '').replace(/\.pem$/, ''),
              }))}
              selectedId={selectedHybridFile}
              onSelect={handleHybridSelect}
              defaultLabel="-- Select hybrid certificate --"
              noContainer
              className="w-full"
            />
            {selectedHybridNote && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs space-y-1">
                <p className="font-semibold text-primary">{selectedHybridNote.title}</p>
                <p className="text-muted-foreground">{selectedHybridNote.note}</p>
              </div>
            )}
          </div>
        )}

        {hybridCertFiles.length === 0 && (
          <p className="mt-3 text-xs text-muted-foreground">
            Hybrid/PQC certificates are optional — this workshop focuses on classical PKI. To
            explore the 6 hybrid formats (Pure PQC, Composite, Alt-Sig, Related Certs, Chameleon),
            generate them in{' '}
            <span className="text-primary font-medium">Playground → Hybrid Certs</span>, then return
            here to parse and compare their X.509 structures.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-foreground">Input Content (PEM)</h3>
          </div>

          <textarea
            value={certInput}
            onChange={(e) => {
              setCertInput(e.target.value)
              setSelectedArtifactId('') // Clear selection on manual edit
              setSelectedArtifactName('')
            }}
            className="w-full h-64 bg-muted/30 border border-border rounded p-3 text-foreground font-mono text-xs resize-none focus:border-primary/50 outline-none"
            placeholder="Paste PEM content here..."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              variant="gradient"
              onClick={handleParse}
              disabled={isParsing || !certInput}
              className="flex items-center justify-center gap-2 px-4 py-2 font-bold rounded transition-colors disabled:opacity-50"
            >
              {isParsing ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
              {isCrlInput ? 'Parse CRL' : 'Parse Details'}
            </Button>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => handleConvert('DER')}
                disabled={isConverting || !certInput || isCrlInput}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-secondary text-secondary-foreground font-medium rounded hover:bg-secondary/80 transition-colors disabled:opacity-50 text-xs"
              >
                {isConverting ? (
                  <Loader2 className="animate-spin" size={14} />
                ) : (
                  <ArrowRightLeft size={14} />
                )}
                To DER
              </Button>
              <Button
                variant="ghost"
                onClick={() => handleConvert('P7B')}
                disabled={isConverting || !certInput || certInput.includes('REQUEST') || isCrlInput}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-secondary text-secondary-foreground font-medium rounded hover:bg-secondary/80 transition-colors disabled:opacity-50 text-xs"
                title="CSRs and CRLs cannot be converted to P7B"
              >
                {isConverting ? (
                  <Loader2 className="animate-spin" size={14} />
                ) : (
                  <ArrowRightLeft size={14} />
                )}
                To P7B
              </Button>
            </div>
          </div>

          {/* Fingerprint button — shown for X.509 certificates */}
          {isCertInput && certInput && (
            <Button
              variant="ghost"
              onClick={handleGetFingerprint}
              disabled={isFingerprintLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground font-medium rounded hover:bg-secondary/80 transition-colors disabled:opacity-50 text-sm"
              title="Compute the SHA-256 fingerprint of this certificate"
            >
              {isFingerprintLoading ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <FileText size={16} />
              )}
              Get SHA-256 Fingerprint
            </Button>
          )}

          {fingerprint && (
            <div className="rounded p-3 bg-muted/30 border border-border text-xs font-mono text-foreground whitespace-pre-wrap break-all">
              <span className="text-muted-foreground">Fingerprint: </span>
              {fingerprint}
            </div>
          )}

          {/* CSR self-signature verify — shown when input is a CSR */}
          {isCsrInput && certInput && (
            <Button
              variant="ghost"
              onClick={handleVerifyCsr}
              disabled={isVerifyingCsr}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground font-medium rounded hover:bg-secondary/80 transition-colors disabled:opacity-50 text-sm"
              title="Verify the CSR's self-signature to confirm the requester holds the private key"
            >
              {isVerifyingCsr ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <ShieldCheck size={16} />
              )}
              Verify CSR Signature
            </Button>
          )}

          {csrVerifyResult && (
            <div
              className={`rounded p-3 flex items-start gap-2 text-sm ${
                csrVerifyResult.success
                  ? 'bg-status-success/10 border border-status-success/30 text-status-success'
                  : 'bg-status-error/10 border border-status-error/30 text-status-error'
              }`}
            >
              {csrVerifyResult.success ? (
                <Check size={16} className="shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              )}
              <span>{csrVerifyResult.message}</span>
            </div>
          )}

          {!canVerifyChain && selectedArtifactId && (
            <p className="text-xs text-muted-foreground">
              {rootCAs.length === 0
                ? 'Chain verification requires a Root CA. Generate one in Step 2, then return here.'
                : 'Select an end-entity certificate (not a Root CA or CSR) to enable chain verification.'}
            </p>
          )}

          {canVerifyChain && (
            <Button
              variant="ghost"
              onClick={handleVerifyChain}
              disabled={isVerifying}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground font-medium rounded hover:bg-secondary/80 transition-colors disabled:opacity-50 text-sm"
              title="Verify this certificate's trust chain against the Root CA"
            >
              {isVerifying ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <ShieldCheck size={16} />
              )}
              Verify Chain Against Root CA
            </Button>
          )}

          {verifyResult && (
            <div
              className={`rounded p-3 flex items-start gap-2 text-sm ${
                verifyResult.success
                  ? 'bg-status-success/10 border border-status-success/30 text-status-success'
                  : 'bg-status-error/10 border border-status-error/30 text-status-error'
              }`}
            >
              {verifyResult.success ? (
                <Check size={16} className="shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              )}
              <span className="whitespace-pre-line">{verifyResult.message}</span>
            </div>
          )}

          {!canVerifyCrl && selectedIsEndEntity && rootCAs.length > 0 && (
            <p className="text-xs text-muted-foreground">
              CRL revocation check requires a CRL. Generate one in Step 5, then return here.
            </p>
          )}

          {canVerifyCrl && (
            <Button
              variant="ghost"
              onClick={handleVerifyCrl}
              disabled={isVerifyingCrl}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground font-medium rounded hover:bg-secondary/80 transition-colors disabled:opacity-50 text-sm"
              title={`Check this certificate against the CRL in the OpenSSL Studio (${crlFiles.length} CRL${crlFiles.length > 1 ? 's' : ''} available)`}
            >
              {isVerifyingCrl ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <ShieldCheck size={16} />
              )}
              Check Revocation Status (CRL)
            </Button>
          )}

          {crlVerifyResult && (
            <div
              className={`rounded p-3 flex items-start gap-2 text-sm ${
                crlVerifyResult.success
                  ? 'bg-status-success/10 border border-status-success/30 text-status-success'
                  : 'bg-status-error/10 border border-status-error/30 text-status-error'
              }`}
            >
              {crlVerifyResult.success ? (
                <Check size={16} className="shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              )}
              <span>{crlVerifyResult.message}</span>
            </div>
          )}

          {error && (
            <div className="space-y-2">
              <div className="bg-destructive/10 border border-destructive/30 rounded p-3 flex items-start gap-2 text-destructive text-sm">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <pre className="whitespace-pre-wrap font-mono">{error}</pre>
              </div>
              {getCryptoErrorHint(error) && (
                <div className="bg-status-info/10 border border-status-info/30 rounded p-3 flex items-start gap-2 text-status-info text-xs">
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  <span>
                    <strong>What this means:</strong> {getCryptoErrorHint(error)}
                  </span>
                </div>
              )}
            </div>
          )}

          {conversionResult && (
            <div className="bg-success/10 border border-success/30 rounded p-3 flex items-center justify-between text-success text-sm">
              <div className="flex items-center gap-2">
                <Check size={16} />
                <span>
                  Converted to {conversionResult.format} successfully:{' '}
                  <strong>{conversionResult.name}</strong>
                </span>
              </div>
              <a
                href={conversionResult.url}
                download={conversionResult.name}
                className="flex items-center gap-1 hover:underline font-bold"
              >
                <Download size={14} />
                Download
              </a>
            </div>
          )}
        </div>

        {/* Output Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Parsed Output</h3>
            {parsedOutput && (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setViewMode('tree')}
                  className={`flex items-center gap-1 px-3 py-1 rounded text-xs font-medium transition-colors ${
                    viewMode === 'tree'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  <Eye size={14} />
                  Tree View
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setViewMode('raw')}
                  className={`flex items-center gap-1 px-3 py-1 rounded text-xs font-medium transition-colors ${
                    viewMode === 'raw'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  <Code size={14} />
                  Raw Text
                </Button>
              </div>
            )}
          </div>
          <div className="bg-muted/30 rounded-lg p-4 font-mono text-xs h-[400px] overflow-y-auto custom-scrollbar border border-border">
            {parsedOutput ? (
              viewMode === 'tree' ? (
                <ParsedCertView output={parsedOutput} />
              ) : (
                <pre className="text-muted-foreground whitespace-pre-wrap break-all break-words max-w-full">
                  {parsedOutput}
                </pre>
              )
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                <FileText size={48} className="mb-4 opacity-20" />
                <p>Parsed details will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
