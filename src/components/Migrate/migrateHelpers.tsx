// SPDX-License-Identifier: GPL-3.0-only
import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, CheckCircle, ExternalLink, ShieldAlert } from 'lucide-react'
import type { CertificationXref } from '../../types/MigrateTypes'
import { Button } from '../ui/button'

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

type PopoverPosition = { top: number; left: number } | { bottom: number; left: number }

/** Computed from the trigger's `getBoundingClientRect()` at click time (not
 *  in an effect — an effect that calls setState synchronously on every
 *  render is a react-hooks/set-state-in-effect violation, and the position
 *  only ever needs to be computed once, when the popover opens). */
function computePopoverPosition(rect: DOMRect): PopoverPosition {
  const halfW = 130
  const clampedLeft = Math.max(halfW + 8, Math.min(rect.left, window.innerWidth - halfW - 8))
  if (window.innerHeight - rect.bottom >= 180) {
    return { top: rect.bottom + 6, left: clampedLeft }
  }
  return { bottom: window.innerHeight - rect.top + 6, left: clampedLeft }
}

/**
 * Floating panel listing every cert of one type. Click-to-open (not
 * hover — hover-only wouldn't work on touch devices), dismisses on
 * Escape, outside click, or scroll. Position is computed once by the
 * caller (at click time) and passed in, not recomputed here.
 *
 * Kept local to this file rather than extracted as a shared `ui/Popover`
 * primitive: it has exactly one consumer today (`CertTypeBadge` below).
 * Extract only if a second, unrelated popover need shows up.
 */
const CertTypePopover: React.FC<{
  certs: CertificationXref[]
  position: PopoverPosition
  onClose: () => void
  anchorRef: React.MutableRefObject<HTMLButtonElement | null>
}> = ({ certs, position, onClose, anchorRef }) => {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    const handleOutsideTap = (e: MouseEvent) => {
      if (
        anchorRef.current?.contains(e.target as Node) ||
        panelRef.current?.contains(e.target as Node)
      )
        return
      onClose()
    }
    const handleScroll = () => onClose()
    document.addEventListener('keydown', handleKey)
    document.addEventListener('mousedown', handleOutsideTap)
    window.addEventListener('scroll', handleScroll, { capture: true })
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.removeEventListener('mousedown', handleOutsideTap)
      window.removeEventListener('scroll', handleScroll, { capture: true })
    }
  }, [onClose, anchorRef])

  return createPortal(
    <div
      ref={panelRef}
      role="menu"
      style={{ position: 'fixed', zIndex: 9999, ...position }}
      className="w-64 space-y-1 rounded-lg border border-border bg-background p-2 shadow-lg"
    >
      {certs.map((cert) => {
        const hasPqc = cert.pqcAlgorithms && !cert.pqcAlgorithms.startsWith('No ')
        return (
          <a
            key={cert.certId}
            href={cert.certLink}
            target="_blank"
            rel="noopener noreferrer"
            role="menuitem"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-between gap-2 rounded px-2 py-1.5 text-xs hover:bg-muted/60"
          >
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-foreground">{cert.certDate || 'Undated'}</span>
              {hasPqc && (
                <span className="truncate text-[10px] text-muted-foreground">
                  PQC: {cert.pqcAlgorithms}
                </span>
              )}
            </span>
            <ExternalLink size={10} className="shrink-0 opacity-60" />
          </a>
        )
      })}
    </div>,
    document.body
  )
}

/** One cert-type badge. A single cert stays a plain link (fewest clicks for
 *  the common case); more than one opens a popover listing all of them —
 *  today only the newest was reachable, the rest were invisible past a
 *  `(N)` count. */
const CertTypeBadge: React.FC<{
  type: string
  certsOfType: CertificationXref[]
}> = ({ type, certsOfType }) => {
  const config = CERT_TYPE_CONFIG[type]
  const [popoverPosition, setPopoverPosition] = useState<PopoverPosition | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const newest = certsOfType[0]
  const count = certsOfType.length
  const hasPqc = newest.pqcAlgorithms && !newest.pqcAlgorithms.startsWith('No ')
  const badgeClass = `inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded border font-semibold hover:opacity-80 transition-opacity ${config.className}`

  if (count <= 1) {
    return (
      <a
        href={newest.certLink}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        title={`${count} ${config.label} cert${hasPqc ? ` — PQC: ${newest.pqcAlgorithms}` : ''}`}
        className={badgeClass}
      >
        {config.label}
        <ExternalLink size={8} className="opacity-50" />
      </a>
    )
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        ref={triggerRef}
        aria-haspopup="true"
        aria-expanded={popoverPosition !== null}
        aria-label={`${count} ${config.label} certificates — view all`}
        onClick={(e) => {
          e.stopPropagation()
          setPopoverPosition((cur) => {
            if (cur) return null
            const rect = triggerRef.current?.getBoundingClientRect()
            return rect ? computePopoverPosition(rect) : null
          })
        }}
        title={`${count} ${config.label} certs${hasPqc ? ` — PQC: ${newest.pqcAlgorithms}` : ''}`}
        className={`h-auto ${badgeClass}`}
      >
        {config.label}
        <span className="font-normal opacity-70">({count})</span>
        <ExternalLink size={8} className="opacity-50" />
      </Button>
      {popoverPosition && (
        <CertTypePopover
          certs={certsOfType}
          position={popoverPosition}
          onClose={() => setPopoverPosition(null)}
          anchorRef={triggerRef}
        />
      )}
    </>
  )
}

/**
 * Compact clickable cert badges — one per cert type (FIPS, ACVP, CC).
 * A type with multiple certs opens a popover listing all of them.
 */
export const CertBadges: React.FC<{ certs: CertificationXref[] }> = ({ certs }) => {
  if (!certs || certs.length === 0) return null

  // Group by cert type, newest first within each type
  const byType = new Map<string, CertificationXref[]>()
  for (const cert of certs) {
    const list = byType.get(cert.certType)
    if (list) list.push(cert)
    else byType.set(cert.certType, [cert])
  }
  for (const list of byType.values()) {
    list.sort((a, b) => (a.certDate < b.certDate ? 1 : a.certDate > b.certDate ? -1 : 0))
  }

  return (
    <>
      {['FIPS 140-3', 'ACVP', 'Common Criteria'].map((type) => {
        const certsOfType = byType.get(type)
        if (!certsOfType || certsOfType.length === 0) return null
        return <CertTypeBadge key={type} type={type} certsOfType={certsOfType} />
      })}
    </>
  )
}
