// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { JWTInspector } from './workshop/JWTInspector'
import { PQCJWTSigning } from './workshop/PQCJWTSigning'
import { HybridJWT } from './workshop/HybridJWT'
import { JWEEncryption } from './workshop/JWEEncryption'
import { TokenSizeAnalyzer } from './workshop/TokenSizeAnalyzer'
import { JOSEProtocolMatrixAudit } from './workshop/JOSEProtocolMatrixAudit'

const SECTIONS = [
  {
    id: 'jwt-inspector',
    title: 'Step 1 — JWT Inspector',
    description: 'Decode and inspect JWT structure, header, payload, and algorithm choices',
  },
  {
    id: 'pqc-signing',
    title: 'Step 2 — PQC JWT Signing',
    description:
      'Sign JWTs with ML-DSA-44/65/87 and SLH-DSA via @noble/post-quantum or softhsmv3 PKCS#11; IETF KAT vectors verified in-browser',
  },
  {
    id: 'hybrid-jwt',
    title: 'Step 3 — Hybrid JWT',
    description:
      'Composite ML-DSA-65+Ed25519 JWT per draft-ietf-jose-pq-composite-sigs-01; dual-signature migration pattern',
  },
  {
    id: 'jwe-encryption',
    title: 'Step 4 — JWE Encryption',
    description:
      'ML-KEM-768 JWE encryption per draft-ietf-jose-pqc-kem; KMAC256-based CEK derivation (FIPS 203)',
  },
  {
    id: 'token-size',
    title: 'Step 5 — Token Size Analyzer',
    description: 'Compare JWT payload and signature sizes across classical and PQC algorithms',
  },
  {
    id: 'matrix-audit',
    title: 'Step 6 — JOSE Protocol Matrix Audit',
    description:
      'Live KAT suite validating IETF cose-dilithium-11 vectors and composite pinned snapshots',
  },
]

export const APISecurityJWTPlayground: React.FC = () => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    'jwt-inspector': false,
    'pqc-signing': true,
    'hybrid-jwt': true,
    'jwe-encryption': true,
    'token-size': false,
    'matrix-audit': false,
  })

  const toggle = (id: string) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-sm text-foreground/80">
        Full API Security &amp; JWT workshop — real PQC signing (ML-DSA, SLH-DSA, composite) and
        ML-KEM-768 JWE encryption, with optional softhsmv3 PKCS#11 routing.{' '}
        <Link to="/learn/api-security-jwt?tab=workshop" className="text-primary hover:underline">
          Open the full learn module for guided walkthroughs and quizzes.
        </Link>
      </div>

      <div className="space-y-3">
        {SECTIONS.map(({ id, title, description }) => (
          <div key={id} className="rounded-lg border border-border bg-card">
            <Button
              variant="ghost"
              onClick={() => toggle(id)}
              className="flex w-full items-center justify-start gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors rounded-lg h-auto"
            >
              {expanded[id] ? (
                <ChevronDown size={16} className="shrink-0 text-primary" />
              ) : (
                <ChevronRight size={16} className="shrink-0 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
            </Button>
            {expanded[id] && (
              <div className="border-t border-border px-4 pb-4 pt-3">
                {id === 'jwt-inspector' && <JWTInspector />}
                {id === 'pqc-signing' && <PQCJWTSigning />}
                {id === 'hybrid-jwt' && <HybridJWT />}
                {id === 'jwe-encryption' && <JWEEncryption />}
                {id === 'token-size' && <TokenSizeAnalyzer />}
                {id === 'matrix-audit' && <JOSEProtocolMatrixAudit />}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="pt-2 border-t border-border">
        <Link to="/learn/api-security-jwt?tab=workshop">
          <Button variant="outline" className="gap-1">
            Open full module <ExternalLink size={14} />
          </Button>
        </Link>
      </div>
    </div>
  )
}
