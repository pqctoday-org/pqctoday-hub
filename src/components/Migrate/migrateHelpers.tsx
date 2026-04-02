// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { AlertTriangle, CheckCircle, ExternalLink, ShieldAlert } from 'lucide-react'
import type { CertificationXref } from '../../types/MigrateTypes'

/** Human-readable labels for machine-readable evidence flags in the CSV. */
export const EVIDENCE_FLAG_LABELS: Record<string, string> = {
  'pre-standard-date':
    'Release predates FIPS 203/204/205 finalization (Aug 2024); may reference draft algorithms',
  'fips-classical-only':
    'FIPS 140-3 certification covers classical algorithms only; PQC not in scope',
  'no-vendor-docs': 'No vendor documentation downloaded for independent verification',
  'no-cert-backing':
    'Claims PQC support but has no matching FIPS, ACVP, or Common Criteria certification',
  'openssl-version-mismatch':
    'Claimed OpenSSL version does not include the referenced PQC algorithms (ML-KEM added in 3.5)',
}

/** Compact evidence-flag warning list for expanded rows. */
export const EvidenceWarnings: React.FC<{ flags?: string[] }> = ({ flags }) => {
  if (!flags || flags.length === 0) return null
  return (
    <div className="mt-3 rounded-lg border border-status-warning/30 bg-status-warning/5 px-3 py-2">
      <h4 className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-status-warning">
        <AlertTriangle size={12} /> Evidence Notices ({flags.length})
      </h4>
      <ul className="space-y-0.5 text-xs text-muted-foreground">
        {flags.map((flag) => (
          <li key={flag} className="flex items-start gap-1.5">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-status-warning" />
            {EVIDENCE_FLAG_LABELS[flag] || flag}
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Three-tier FIPS badge: Validated (green), Partial (amber), No (gray) */
export const renderFipsStatus = (status: string): React.ReactElement => {
  const lower = (status || '').toLowerCase()
  const isFipsCertified = lower.includes('fips 140') || lower.includes('fips 203')
  const isPartial = !isFipsCertified && lower.startsWith('yes')

  if (isFipsCertified) {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-status-success text-status-success">
        <CheckCircle size={10} /> Validated
      </span>
    )
  }
  if (isPartial) {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-status-warning text-status-warning">
        <ShieldAlert size={10} /> Partial
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground border border-border">
      <span className="w-2 h-2 rounded-full bg-muted-foreground/50" /> No
    </span>
  )
}

/** PQC Support badge with level-specific colors */
export const renderPqcSupport = (support: string): React.ReactElement => {
  const lower = (support || '').toLowerCase()
  let badgeClass: string
  if (lower.startsWith('yes')) {
    badgeClass = 'bg-status-success text-status-success'
  } else if (lower.startsWith('partial') || lower.startsWith('limited')) {
    badgeClass = 'bg-status-warning text-status-warning'
  } else if (lower.startsWith('planned') || lower.startsWith('in progress')) {
    badgeClass = 'bg-primary/10 text-primary border-primary/20'
  } else if (lower.startsWith('no')) {
    badgeClass = 'bg-destructive/10 text-destructive border-destructive/20'
  } else {
    badgeClass = 'bg-muted/50 text-muted-foreground border-border'
  }
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${badgeClass}`}
    >
      {support || 'Unknown'}
    </span>
  )
}

export const renderQuantumTech = (quantumTech: string | undefined): React.ReactElement | null => {
  if (!quantumTech) return null
  return (
    <span
      className="text-[10px] px-1.5 py-0.5 rounded-full font-bold border bg-status-info/10 text-status-info border-status-info/20"
      title="Quantum hardware technology"
    >
      {quantumTech}
    </span>
  )
}

const CERT_TYPE_CONFIG: Record<string, { label: string; className: string }> = {
  'FIPS 140-3': {
    label: 'FIPS',
    className: 'bg-status-success text-status-success',
  },
  ACVP: {
    label: 'ACVP',
    className: 'bg-primary/10 text-primary border-primary/20',
  },
  'Common Criteria': {
    label: 'CC',
    className: 'bg-status-warning text-status-warning',
  },
}

/**
 * Compact clickable cert badges — one per cert type (FIPS, ACVP, CC).
 * Links to the most recent cert of each type for the product.
 */
export const CertBadges: React.FC<{ certs: CertificationXref[] }> = ({ certs }) => {
  if (!certs || certs.length === 0) return null

  // Group by cert type, pick the most recent cert per type
  const byType = new Map<string, CertificationXref>()
  for (const cert of certs) {
    const existing = byType.get(cert.certType)
    if (!existing || cert.certDate > existing.certDate) {
      byType.set(cert.certType, cert)
    }
  }

  // Count certs per type for tooltip
  const countByType = new Map<string, number>()
  for (const cert of certs) {
    countByType.set(cert.certType, (countByType.get(cert.certType) || 0) + 1)
  }

  return (
    <>
      {['FIPS 140-3', 'ACVP', 'Common Criteria'].map((type) => {
        const cert = byType.get(type)
        if (!cert) return null
        const config = CERT_TYPE_CONFIG[type]
        const count = countByType.get(type) || 0
        const hasPqc = cert.pqcAlgorithms && !cert.pqcAlgorithms.startsWith('No ')
        return (
          <a
            key={type}
            href={cert.certLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title={`${count} ${config.label} cert${count > 1 ? 's' : ''}${hasPqc ? ` — PQC: ${cert.pqcAlgorithms}` : ''}`}
            className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded border font-semibold hover:opacity-80 transition-opacity ${config.className}`}
          >
            {config.label}
            {count > 1 && <span className="font-normal opacity-70">({count})</span>}
            <ExternalLink size={8} className="opacity-50" />
          </a>
        )
      })}
    </>
  )
}
