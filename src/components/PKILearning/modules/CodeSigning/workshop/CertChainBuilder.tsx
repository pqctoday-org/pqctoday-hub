// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useCallback } from 'react'
import { ShieldCheck, ArrowDown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CERT_CHAIN_TEMPLATE, type CertTemplate } from '../constants'

interface GeneratedCert extends CertTemplate {
  serialNumber: string
  notBefore: string
  notAfter: string
  publicKeyHex: string
  signatureHex: string
  fingerprint: string
}

/** Generate realistic-looking hex string */
function generateHex(bytes: number): string {
  const chars = '0123456789abcdef'
  let result = ''
  for (let i = 0; i < bytes * 2; i++) {
    result += chars[Math.floor(Math.random() * 16)]
  }
  return result
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

function generateCertificates(): GeneratedCert[] {
  const now = new Date()

  return CERT_CHAIN_TEMPLATE.map((template) => {
    const notBefore = now
    const notAfter = new Date(now)

    if (template.validity === '20 years') {
      notAfter.setFullYear(notAfter.getFullYear() + 20)
    } else if (template.validity === '10 years') {
      notAfter.setFullYear(notAfter.getFullYear() + 10)
    } else {
      notAfter.setFullYear(notAfter.getFullYear() + 1)
    }

    return {
      ...template,
      serialNumber: `${template.serialPrefix}:${generateHex(8).match(/.{2}/g)?.join(':') ?? ''}`,
      notBefore: formatDate(notBefore),
      notAfter: formatDate(notAfter),
      publicKeyHex: generateHex(template.keySize),
      signatureHex: generateHex(template.sigSize),
      fingerprint: generateHex(32),
    }
  })
}

const LEVEL_COLORS: Record<string, { border: string; bg: string; text: string }> = {
  'Root CA': {
    border: 'border-primary/50',
    bg: 'bg-primary/5',
    text: 'text-primary',
  },
  'Intermediate CA': {
    border: 'border-secondary/50',
    bg: 'bg-secondary/5',
    text: 'text-secondary',
  },
  'Code Signing': {
    border: 'border-success/50',
    bg: 'bg-success/5',
    text: 'text-success',
  },
}

export const CertChainBuilder: React.FC = () => {
  const [certificates, setCertificates] = useState<GeneratedCert[] | null>(null)
  const [isBuilding, setIsBuilding] = useState(false)
  const [expandedCert, setExpandedCert] = useState<number | null>(null)

  const handleBuildChain = useCallback(async () => {
    setIsBuilding(true)
    setCertificates(null)
    setExpandedCert(null)

    // Simulate chain generation delay
    await new Promise((resolve) => setTimeout(resolve, 1200))

    setCertificates(generateCertificates())
    setIsBuilding(false)
  }, [])

  const truncateHex = (hex: string, maxChars: number = 64): string => {
    if (hex.length <= maxChars) return hex
    return `${hex.slice(0, maxChars / 2)}...${hex.slice(-maxChars / 2)}`
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">
          PQC Code Signing Certificate Chain
        </h3>
        <p className="text-sm text-muted-foreground">
          Build a 3-level certificate chain using ML-DSA at each level. Root CA uses ML-DSA-87 for
          maximum security, Intermediate uses ML-DSA-65, and the end-entity Code Signing certificate
          uses ML-DSA-44.
        </p>
      </div>

      {/* Build Button */}
      <div className="flex justify-center">
        <Button
          variant="gradient"
          onClick={handleBuildChain}
          disabled={isBuilding}
          className="text-sm px-6"
        >
          {isBuilding ? (
            <>
              <Loader2 size={14} className="animate-spin mr-2" /> Building Chain...
            </>
          ) : (
            <>
              <ShieldCheck size={14} className="mr-2" /> Build Chain
            </>
          )}
        </Button>
      </div>

      {/* Chain Template (before building) */}
      {!certificates && !isBuilding && (
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-foreground">Chain Structure (click Build above)</h4>
          {CERT_CHAIN_TEMPLATE.map((template, idx) => {
            const colors = LEVEL_COLORS[template.level] ?? {
              border: 'border-border',
              bg: 'bg-muted/50',
              text: 'text-foreground',
            }
            return (
              <React.Fragment key={template.level}>
                {idx > 0 && (
                  <div className="flex justify-center">
                    <ArrowDown size={20} className="text-muted-foreground" />
                  </div>
                )}
                <div className={`rounded-lg p-4 border ${colors.border} ${colors.bg}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck size={16} className={colors.text} />
                    <span className={`text-sm font-bold ${colors.text}`}>{template.level}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {template.algorithm}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div>
                      <strong>Subject:</strong> {template.subject}
                    </div>
                    <div>
                      <strong>Issuer:</strong> {template.issuer}
                    </div>
                    <div>
                      <strong>Key Size:</strong> {template.keySize.toLocaleString()} bytes
                    </div>
                    <div>
                      <strong>Sig Size:</strong> {template.sigSize.toLocaleString()} bytes
                    </div>
                    <div>
                      <strong>Validity:</strong> {template.validity}
                    </div>
                    {template.ekuOid && (
                      <div>
                        <strong>EKU:</strong> {template.eku} ({template.ekuOid})
                      </div>
                    )}
                  </div>
                </div>
              </React.Fragment>
            )
          })}
        </div>
      )}

      {/* Loading State */}
      {isBuilding && (
        <div className="text-center py-12">
          <Loader2 size={32} className="animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            Generating ML-DSA keypairs and signing certificates...
          </p>
        </div>
      )}

      {/* Generated Chain */}
      {certificates && (
        <div className="space-y-3 animate-fade-in">
          <h4 className="text-sm font-bold text-foreground">Generated Certificate Chain</h4>

          {certificates.map((cert, idx) => {
            const colors = LEVEL_COLORS[cert.level] ?? {
              border: 'border-border',
              bg: 'bg-muted/50',
              text: 'text-foreground',
            }
            const isExpanded = expandedCert === idx

            return (
              <React.Fragment key={cert.level}>
                {idx > 0 && (
                  <div className="flex justify-center">
                    <div className="flex flex-col items-center">
                      <ArrowDown size={20} className="text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">signs</span>
                    </div>
                  </div>
                )}
                <div className={`rounded-lg border ${colors.border} ${colors.bg} overflow-hidden`}>
                  <Button
                    variant="ghost"
                    onClick={() => setExpandedCert(isExpanded ? null : idx)}
                    className="w-full p-4 text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={16} className={colors.text} />
                        <span className={`text-sm font-bold ${colors.text}`}>{cert.level}</span>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {cert.algorithm}
                        </span>
                        {cert.ekuOid && (
                          <span className="text-[10px] px-2 py-0.5 rounded border font-bold bg-success/20 text-success border-success/50">
                            Code Signing
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {isExpanded ? 'Collapse' : 'Expand'}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      <span className="font-mono">S: {cert.subject}</span>
                    </div>
                  </Button>

                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-3 animate-fade-in border-t border-border/50 pt-3">
                      {/* ASN.1-style Info */}
                      <div className="bg-background rounded-lg p-3 border border-border font-mono text-[11px] text-foreground space-y-1">
                        <div>
                          <span className="text-muted-foreground">Version:</span> v3
                        </div>
                        <div>
                          <span className="text-muted-foreground">Serial Number:</span>{' '}
                          {cert.serialNumber}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Signature Algorithm:</span>{' '}
                          {cert.algorithm}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Issuer:</span> {cert.issuer}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Validity:</span>
                        </div>
                        <div className="ml-4">
                          <span className="text-muted-foreground">Not Before:</span>{' '}
                          {cert.notBefore}
                        </div>
                        <div className="ml-4">
                          <span className="text-muted-foreground">Not After:</span> {cert.notAfter}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Subject:</span> {cert.subject}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Public Key Algorithm:</span>{' '}
                          {cert.algorithm}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Public Key:</span>{' '}
                          {cert.keySize.toLocaleString()} bytes
                        </div>
                        <div className="ml-4 text-[10px] text-muted-foreground break-all">
                          {truncateHex(cert.publicKeyHex, 80)}
                        </div>
                        <div className="mt-2 font-bold text-foreground">Extensions:</div>
                        <div className="ml-4">
                          <span className="text-muted-foreground">Basic Constraints:</span>{' '}
                          {cert.level === 'Code Signing' ? 'CA:FALSE' : 'CA:TRUE'}
                          {cert.level === 'Root CA' ? '' : ', pathlen:0'}
                        </div>
                        <div className="ml-4">
                          <span className="text-muted-foreground">Key Usage:</span>{' '}
                          {cert.level === 'Code Signing'
                            ? 'Digital Signature'
                            : 'Certificate Sign, CRL Sign'}
                        </div>
                        {cert.ekuOid && (
                          <div className="ml-4">
                            <span className="text-muted-foreground">Extended Key Usage:</span>{' '}
                            {cert.eku} ({cert.ekuOid})
                          </div>
                        )}
                        <div className="ml-4">
                          <span className="text-muted-foreground">Subject Key Identifier:</span>{' '}
                          {generateHex(20).match(/.{2}/g)?.join(':')}
                        </div>
                        <div className="mt-2">
                          <span className="text-muted-foreground">Signature:</span>{' '}
                          {cert.sigSize.toLocaleString()} bytes
                        </div>
                        <div className="ml-4 text-[10px] text-muted-foreground break-all">
                          {truncateHex(cert.signatureHex, 80)}
                        </div>
                        <div className="mt-1">
                          <span className="text-muted-foreground">SHA-256 Fingerprint:</span>
                        </div>
                        <div className="ml-4 text-[10px] text-muted-foreground">
                          {cert.fingerprint.match(/.{2}/g)?.join(':')}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </React.Fragment>
            )
          })}
        </div>
      )}

      {/* Chain Summary */}
      {certificates && (
        <div className="glass-panel p-4">
          <h4 className="text-sm font-bold text-foreground mb-3">Chain Summary</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2 text-muted-foreground font-medium">Level</th>
                  <th className="text-left p-2 text-muted-foreground font-medium">Algorithm</th>
                  <th className="text-right p-2 text-muted-foreground font-medium">Key Size</th>
                  <th className="text-right p-2 text-muted-foreground font-medium">Sig Size</th>
                  <th className="text-left p-2 text-muted-foreground font-medium">Validity</th>
                </tr>
              </thead>
              <tbody>
                {certificates.map((cert) => (
                  <tr key={cert.level} className="border-b border-border/50">
                    <td className="p-2 font-medium text-foreground">{cert.level}</td>
                    <td className="p-2 font-mono text-xs text-foreground">{cert.algorithm}</td>
                    <td className="p-2 text-right font-mono text-xs text-foreground">
                      {cert.keySize.toLocaleString()} B
                    </td>
                    <td className="p-2 text-right font-mono text-xs text-foreground">
                      {cert.sigSize.toLocaleString()} B
                    </td>
                    <td className="p-2 text-xs text-muted-foreground">{cert.validity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            Total chain overhead: ~
            {certificates.reduce((sum, c) => sum + c.keySize + c.sigSize, 0).toLocaleString()} bytes
            (keys + signatures). A classical RSA-2048 chain would be ~1,536 bytes total.
          </p>
        </div>
      )}

      {/* Educational note */}
      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <p className="text-xs text-muted-foreground">
          <strong>Note:</strong> All certificates are simulated with realistic field structures
          matching X.509v3 format. In production, code signing certificates are issued by publicly
          trusted CAs (e.g., DigiCert, GlobalSign) and must include the Code Signing Extended Key
          Usage OID (1.3.6.1.5.5.7.3.3). Generated certificates are for educational purposes only.
        </p>
      </div>
    </div>
  )
}
