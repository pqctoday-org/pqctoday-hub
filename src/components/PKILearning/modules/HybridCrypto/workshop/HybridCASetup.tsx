// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState, useCallback } from 'react'
import { Loader2, Play, CheckCircle2, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react'
import { hybridCryptoService, type CertResult } from '../services/HybridCryptoService'
import { Button } from '@/components/ui/button'

interface CAResult extends CertResult {
  algorithm: string
  label: string
  keyFileData?: { name: string; data: Uint8Array }
}

interface HybridCASetupProps {
  onCAGenerated?: (cas: { classical: CAResult | null; pqc: CAResult | null }) => void
}

export const HybridCASetup: React.FC<HybridCASetupProps> = ({ onCAGenerated }) => {
  const [classicalCA, setClassicalCA] = useState<CAResult | null>(null)
  const [pqcCA, setPqcCA] = useState<CAResult | null>(null)
  const [isGenerating, setIsGenerating] = useState<'classical' | 'pqc' | 'both' | null>(null)
  const [expandedPem, setExpandedPem] = useState<Record<string, boolean>>({})

  const generateCA = useCallback(
    async (type: 'classical' | 'pqc') => {
      setIsGenerating(type)
      const algorithm = type === 'classical' ? 'EC' : 'ML-DSA-65'
      const label = type === 'classical' ? 'Classical ECDSA P-256' : 'PQC ML-DSA-65'

      const result = await hybridCryptoService.generateCACert(algorithm, label)

      const caResult: CAResult = {
        algorithm,
        label,
        ...result,
      }

      if (type === 'classical') {
        setClassicalCA(caResult)
        onCAGenerated?.({ classical: caResult, pqc: pqcCA })
      } else {
        setPqcCA(caResult)
        onCAGenerated?.({ classical: classicalCA, pqc: caResult })
      }
      setIsGenerating(null)
    },
    [classicalCA, pqcCA, onCAGenerated]
  )

  const generateBoth = useCallback(async () => {
    setIsGenerating('both')

    const classicalResult = await hybridCryptoService.generateCACert('EC', 'Classical ECDSA P-256')
    const classical: CAResult = {
      algorithm: 'EC',
      label: 'Classical ECDSA P-256',
      ...classicalResult,
    }
    setClassicalCA(classical)

    const pqcResult = await hybridCryptoService.generateCACert('ML-DSA-65', 'PQC ML-DSA-65')
    const pqc: CAResult = { algorithm: 'ML-DSA-65', label: 'PQC ML-DSA-65', ...pqcResult }
    setPqcCA(pqc)

    onCAGenerated?.({ classical, pqc })
    setIsGenerating(null)
  }, [onCAGenerated])

  const togglePem = (key: string) => {
    setExpandedPem((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const renderCACard = (ca: CAResult | null, type: 'classical' | 'pqc', generating: boolean) => {
    const typeLabel = type === 'classical' ? 'Classical' : 'PQC'
    const badgeClass =
      type === 'classical'
        ? 'bg-warning/10 text-warning border-warning/20'
        : 'bg-success/10 text-success border-success/20'

    return (
      <div className="bg-card/80 border border-border rounded-2xl p-5">
        <div className="mb-4 border-b border-border pb-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-3">
              <span className="text-primary font-mono text-xl">
                {type === 'classical' ? '01' : '02'}
              </span>
              <span className="text-foreground/80">|</span>
              {typeLabel} Root CA
            </h3>
            <span className={`text-xs px-2 py-0.5 rounded border font-bold ${badgeClass}`}>
              {type === 'classical' ? 'ECDSA P-256' : 'ML-DSA-65'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 ml-11">
            {type === 'classical'
              ? 'Traditional elliptic curve CA — quantum-vulnerable'
              : 'Post-quantum lattice-based CA — FIPS 204 standardized'}
          </p>
        </div>

        {!ca && !generating && (
          <Button
            variant="gradient"
            onClick={() => generateCA(type)}
            className="flex items-center gap-2 px-4 py-2 font-bold rounded-lg transition-colors text-sm"
          >
            <Play size={14} fill="currentColor" />
            Generate {typeLabel} CA
          </Button>
        )}

        {generating && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 size={16} className="animate-spin" />
            Generating {typeLabel} root CA key and self-signed certificate...
          </div>
        )}

        {ca && !generating && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              {ca.error ? (
                <>
                  <AlertCircle size={16} className="text-destructive" />
                  <span className="text-destructive">{ca.error}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} className="text-success" />
                  <span className="text-success font-medium">CA ready</span>
                  <span className="text-muted-foreground text-xs ml-2">
                    {ca.timingMs.toFixed(0)}ms
                  </span>
                </>
              )}
            </div>

            {!ca.error && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="text-center bg-muted/50 rounded-lg p-3">
                    <div className="text-lg font-bold text-foreground">{ca.pem.length}</div>
                    <div className="text-[10px] text-muted-foreground">Cert PEM chars</div>
                  </div>
                  <div className="text-center bg-muted/50 rounded-lg p-3">
                    <div className="text-lg font-bold text-primary">{ca.timingMs.toFixed(0)}</div>
                    <div className="text-[10px] text-muted-foreground">Total (ms)</div>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  onClick={() => togglePem(type)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {expandedPem[type] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  {expandedPem[type] ? 'Hide' : 'Show'} parsed certificate
                </Button>

                {expandedPem[type] && (
                  <pre className="text-[10px] bg-background p-3 rounded border border-border overflow-x-auto max-h-60 overflow-y-auto font-mono whitespace-pre-wrap">
                    {ca.parsed.trim()}
                  </pre>
                )}
              </>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">
          Root CA Key &amp; Certificate Setup
        </h3>
        <p className="text-sm text-muted-foreground">
          Generate a classical (ECDSA P-256) and a PQC (ML-DSA-65) root CA. These CAs will be used
          in the next steps to demonstrate the hybrid certificate formats.
        </p>
      </div>

      {/* Generate Both button */}
      <Button
        variant="gradient"
        onClick={generateBoth}
        disabled={isGenerating !== null}
        className="flex items-center gap-2 px-6 py-3 font-bold rounded-lg disabled:opacity-50 transition-colors"
      >
        {isGenerating === 'both' ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Generating Both CAs...
          </>
        ) : (
          <>
            <Play size={18} fill="currentColor" />
            Generate Both CAs
          </>
        )}
      </Button>

      {/* CA Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {renderCACard(
          classicalCA,
          'classical',
          isGenerating === 'classical' || isGenerating === 'both'
        )}
        {renderCACard(pqcCA, 'pqc', isGenerating === 'pqc' || isGenerating === 'both')}
      </div>

      {/* Summary note */}
      {classicalCA && pqcCA && !classicalCA.error && !pqcCA.error && (
        <div className="bg-muted/50 rounded-lg p-4 border border-success/20">
          <p className="text-xs text-muted-foreground">
            <strong className="text-success">Both CAs ready.</strong> You now have the key material
            needed to explore all hybrid certificate approaches in the next step. The classical CA
            represents your existing PKI; the PQC CA represents a quantum-resistant root of trust.
          </p>
        </div>
      )}
    </div>
  )
}
