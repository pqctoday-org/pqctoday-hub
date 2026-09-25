// SPDX-License-Identifier: GPL-3.0-only
import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import FocusLock from 'react-focus-lock'
import {
  ExternalLink,
  Calendar,
  FileText,
  Database,
  Shield,
  ShieldCheck,
  ShieldAlert,
  X,
} from 'lucide-react'
import type { ComplianceRecord, ComplianceStatus } from './types'
import clsx from 'clsx'
import {
  cavpValidationUrl,
  formatIsoDate,
  isSecurityTargetType,
  pqcCoverageState,
  pqcEvidenceLabel,
  pqcNames,
  recordTypeDescription,
  recordTypeLabel,
  statusBadgeClass,
  statusTone,
} from './recordSemantics'
import { AskAssistantButton } from '../ui/AskAssistantButton'
import { EndorseButton } from '../ui/EndorseButton'
import { FlagButton } from '../ui/FlagButton'
import { buildRecordEndorsementUrl, buildRecordFlagUrl, recordLabel } from './complianceEndorsement'
import { useIsEmbedded } from '../../embed/EmbedProvider'
import { useModalPosition } from '../../hooks/useModalPosition'
import { Button } from '@/components/ui/button'

interface ComplianceDetailPopoverProps {
  isOpen: boolean
  onClose: () => void
  record: ComplianceRecord | null
}

/** Status verbatim from the source; unknown strings render as-is, styled as not current. */
const StatusBadge = ({ status }: { status: ComplianceStatus }) => {
  const tone = statusTone(status)
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border gap-1',
        statusBadgeClass(status)
      )}
    >
      {tone === 'current' && <ShieldCheck size={10} />}
      {tone === 'revoked' && <ShieldAlert size={10} />}
      {tone === 'pending' && <Shield size={10} />}
      {status || 'No status'}
    </span>
  )
}

const FieldLabel = ({ children }: { children: ReactNode }) => (
  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
    {children}
  </h4>
)

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="space-y-1">
    <FieldLabel>{label}</FieldLabel>
    <div className="text-sm text-foreground whitespace-normal break-words">{children}</div>
  </div>
)

const ExtLink = ({ href, children }: { href: string; children: ReactNode }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-1 text-primary hover:underline"
  >
    {children}
    <ExternalLink size={10} className="shrink-0 opacity-60" aria-hidden="true" />
  </a>
)

/** FIPS 140-3: what the NIST CMVP certificate page states. */
const FipsDetails = ({ record }: { record: ComplianceRecord }) => {
  const observed = formatIsoDate(record.cmvpDetailsFetchedAt)
  const sunset = formatIsoDate(record.sunsetDate ?? undefined)
  const algos = record.cmvpApprovedAlgorithms ?? []
  const envs = record.operationalEnvironments ?? []
  return (
    <div className="space-y-3 pt-2 border-t border-border" data-testid="fips-details">
      <FieldLabel>NIST CMVP certificate</FieldLabel>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {record.cmvpStandard && <Field label="Standard">{record.cmvpStandard}</Field>}
        <Field label="Status">
          {record.cmvpStatus || record.status || 'Not stated'}
          {observed && (
            <span className="block text-xs text-muted-foreground">status observed {observed}</span>
          )}
        </Field>
        {record.cmvpHistoricalReason && (
          <Field label="Historical reason">{record.cmvpHistoricalReason}</Field>
        )}
        {sunset && <Field label="Sunset date">{sunset}</Field>}
        {record.overallLevel != null && (
          <Field label="Overall level">{String(record.overallLevel)}</Field>
        )}
        {record.moduleType && <Field label="Module type">{record.moduleType}</Field>}
        {record.embodiment && <Field label="Embodiment">{record.embodiment}</Field>}
        {record.caveat && <Field label="Caveat">{record.caveat}</Field>}
        {envs.length > 0 && (
          <Field label="Operational environments">
            <ul className="list-disc pl-4 text-xs">
              {envs.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </Field>
        )}
      </div>
      {algos.length > 0 && (
        <div className="space-y-1">
          <FieldLabel>Approved Algorithms (certificate page)</FieldLabel>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 text-xs">
            {algos.map((a, i) => (
              <li key={`${a.name}-${i}`} className="flex flex-wrap items-baseline gap-1">
                <span className="text-foreground">{a.name}</span>
                {(a.cavpRefs ?? []).map((ref) => (
                  <ExtLink key={ref} href={cavpValidationUrl(ref)}>
                    <span className="font-mono">{ref}</span>
                  </ExtLink>
                ))}
              </li>
            ))}
          </ul>
        </div>
      )}
      {record.link && <ExtLink href={record.link}>NIST CMVP certificate #{record.id}</ExtLink>}
    </div>
  )
}

/** NIST CAVP: what the validation details page states. */
const CavpDetails = ({ record }: { record: ComplianceRecord }) => {
  const firstValidated = formatIsoDate(record.cavpFirstValidated)
  const caps = record.cavpCapabilities ?? []
  const productUrl = record.cavpProductUrl || record.link
  return (
    <div className="space-y-3 pt-2 border-t border-border" data-testid="cavp-details">
      <FieldLabel>NIST CAVP algorithm validation</FieldLabel>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {firstValidated && <Field label="First validated">{firstValidated}</Field>}
        {record.cavpImplementationVersion && (
          <Field label="Implementation version">{record.cavpImplementationVersion}</Field>
        )}
        {record.cavpImplementationType && (
          <Field label="Implementation type">{record.cavpImplementationType}</Field>
        )}
      </div>
      {caps.length > 0 && (
        <div className="space-y-1">
          <FieldLabel>Capabilities</FieldLabel>
          <div className="overflow-x-auto rounded border border-border">
            <table className="w-full text-xs">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-2 py-1 text-left font-semibold">Algorithm</th>
                  <th className="px-2 py-1 text-left font-semibold">Parameter sets</th>
                  <th className="px-2 py-1 text-left font-semibold">Functions</th>
                  <th className="px-2 py-1 text-left font-semibold">Operating environment</th>
                </tr>
              </thead>
              <tbody>
                {caps.map((c, i) => (
                  <tr key={`${c.algorithm}-${i}`} className="border-t border-border align-top">
                    <td className="px-2 py-1 text-foreground">{c.algorithm}</td>
                    <td className="px-2 py-1">{(c.parameterSets ?? []).join(', ') || '—'}</td>
                    <td className="px-2 py-1">{(c.functions ?? []).join(', ') || '—'}</td>
                    <td className="px-2 py-1">{c.operatingEnvironment || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {productUrl && <ExtLink href={productUrl}>NIST CAVP product page</ExtLink>}
    </div>
  )
}

const PqcSection = ({ record }: { record: ComplianceRecord }) => {
  const state = pqcCoverageState(record.pqcCoverage)
  const fromSt = isSecurityTargetType(record.type)
  if (state === 'none') return null
  if (state === 'not-read') {
    return (
      <div className="space-y-1">
        <FieldLabel>PQC mechanisms</FieldLabel>
        <p className="text-sm text-muted-foreground italic">
          {record.type === 'FIPS 140-3'
            ? "Not read — the certificate page's Approved Algorithms list could not be read, so PQC status is unknown."
            : 'Not read — PQC status is unknown.'}
        </p>
      </div>
    )
  }
  const names = pqcNames(record.pqcCoverage)
  return (
    <div className="space-y-1">
      <h4
        className={clsx(
          'text-xs font-semibold uppercase tracking-wider',
          fromSt ? 'text-muted-foreground' : 'text-tertiary'
        )}
      >
        {state === 'named'
          ? `PQC — ${pqcEvidenceLabel(record.type).toLowerCase()}`
          : 'PQC mechanisms'}
      </h4>
      <p className="text-sm text-foreground">
        {typeof record.pqcCoverage === 'boolean'
          ? 'PQC indicated (no algorithm names recorded).'
          : names.length > 0
            ? names.join(', ')
            : String(record.pqcCoverage)}
      </p>
      {fromSt && state === 'named' && (
        <p className="text-xs text-muted-foreground">
          A claim in the evaluated Security Target, not a validation of PQC support.
          {record.securityTargetUrls?.[0] && (
            <>
              {' '}
              <ExtLink href={record.securityTargetUrls[0]}>Open the Security Target</ExtLink>
            </>
          )}
        </p>
      )}
    </div>
  )
}

export const ComplianceDetailPopover = ({
  isOpen,
  onClose,
  record,
}: ComplianceDetailPopoverProps) => {
  const popoverRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const isEmbedded = useIsEmbedded()
  const positionStyle = useModalPosition(isEmbedded)

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  // Move focus into modal when it opens
  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus()
    }
  }, [isOpen])

  if (!isOpen || !record) return null

  const content = (
    <>
      {/* Backdrop */}
      <div
        className={`${isEmbedded ? 'absolute' : 'fixed'} inset-0 z-overlay bg-black/60 backdrop-blur-sm embed-backdrop`}
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Centering wrapper (standalone only) */}
      <div
        className={clsx(!isEmbedded && 'fixed inset-0 flex items-center justify-center p-4')}
        style={!isEmbedded ? { zIndex: 9999 } : undefined}
      >
        <FocusLock returnFocus>
          <div
            ref={popoverRef}
            className="w-[92vw] md:w-[60vw] max-w-[800px] max-h-[85dvh] border border-border rounded-xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col bg-popover text-popover-foreground shadow-2xl"
            style={isEmbedded ? { zIndex: 9999, ...positionStyle } : undefined}
            role="dialog"
            aria-modal="true"
            aria-labelledby="popover-title"
          >
            {/* Header */}
            <div className="p-4 border-b border-border bg-muted/20 flex justify-between items-start gap-4">
              <div className="space-y-1 w-full">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={record.status} />
                    <span className="text-xs text-muted-foreground font-mono">{record.id}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <AskAssistantButton
                      question={`What PQC compliance requirements does ${record.productName}${record.vendor ? ` by ${record.vendor}` : ''} enforce under ${recordTypeLabel(record.type)}${record.source ? ` (${record.source})` : ''}${record.certificationLevel ? `, level: ${record.certificationLevel}` : ''}?`}
                    />
                    <EndorseButton
                      endorseUrl={buildRecordEndorsementUrl(record)}
                      resourceLabel={recordLabel(record)}
                      resourceType="Compliance Record"
                    />
                    <FlagButton
                      flagUrl={buildRecordFlagUrl(record)}
                      resourceLabel={recordLabel(record)}
                      resourceType="Compliance Record"
                    />
                    <Button
                      variant="ghost"
                      ref={closeButtonRef}
                      onClick={onClose}
                      className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
                      aria-label="Close"
                    >
                      <X size={16} />
                    </Button>
                  </div>
                </div>
                <h3
                  id="popover-title"
                  className="text-lg font-bold text-foreground leading-tight pr-8"
                >
                  {record.productName}
                </h3>
                <div className="text-xs text-muted-foreground">{record.vendor}</div>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto space-y-6">
              {/* Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                {/* Type */}
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Type
                  </h4>
                  <p className="text-sm text-foreground">{recordTypeDescription(record.type)}</p>
                </div>

                {/* Category */}
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Category
                  </h4>
                  <p className="text-sm text-foreground">{record.productCategory}</p>
                </div>

                {/* Lab */}
                {record.lab && (
                  <div className="space-y-1">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Evaluation Lab
                    </h4>
                    <p className="text-sm text-foreground">{record.lab}</p>
                  </div>
                )}

                {/* Cert Level */}
                {record.certificationLevel && (
                  <div className="space-y-1">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Certification Level
                    </h4>
                    <p className="text-sm text-foreground whitespace-normal break-words">
                      {record.certificationLevel}
                    </p>
                  </div>
                )}

                {/* Date */}
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Certification Date
                  </h4>
                  <div className="flex items-center gap-1.5 text-foreground text-sm">
                    <Calendar className="w-3 h-3 text-muted-foreground shrink-0" />
                    <span>{record.date}</span>
                  </div>
                </div>

                {/* CC Portal archived-list date */}
                {record.ccArchivedDate && (
                  <div className="space-y-1">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Archived
                    </h4>
                    <p className="text-sm text-foreground">
                      {formatIsoDate(record.ccArchivedDate)}
                    </p>
                  </div>
                )}

                {/* Source */}
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Source
                  </h4>
                  <div className="flex items-center gap-1.5 text-foreground text-sm">
                    <Database className="w-3 h-3 text-muted-foreground shrink-0" />
                    <span>{record.source}</span>
                  </div>
                </div>
              </div>

              {/* Algorithms Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                {/* PQC Section — says where the names come from; '' = not read */}
                <PqcSection record={record} />

                {/* Classical Algorithms Section */}
                {record.classicalAlgorithms && (
                  <div className="space-y-1">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Classical Algorithms
                    </h4>
                    <p className="text-sm text-muted-foreground">{record.classicalAlgorithms}</p>
                  </div>
                )}
              </div>

              {record.type === 'FIPS 140-3' && <FipsDetails record={record} />}
              {record.type === 'ACVP' && <CavpDetails record={record} />}

              {/* Documents Section */}
              {(record.certificationReportUrls ||
                record.securityTargetUrls ||
                record.additionalDocuments) && (
                <div className="space-y-3 pt-2 border-t border-border">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Documentation
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {record.certificationReportUrls?.map((url, idx) => (
                      <a
                        key={`report-${idx}`}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 rounded bg-muted/50 hover:bg-muted transition-colors border border-border text-xs text-primary"
                      >
                        <FileText size={14} className="shrink-0" />
                        <span className="truncate flex-1">Certification Report {idx + 1}</span>
                        <ExternalLink size={10} className="shrink-0 opacity-50" />
                      </a>
                    ))}
                    {record.securityTargetUrls?.map((url, idx) => (
                      <a
                        key={`target-${idx}`}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 rounded bg-muted/50 hover:bg-muted transition-colors border border-border text-xs text-primary"
                      >
                        <FileText size={14} className="shrink-0" />
                        <span className="truncate flex-1">Security Target {idx + 1}</span>
                        <ExternalLink size={10} className="shrink-0 opacity-50" />
                      </a>
                    ))}
                    {record.additionalDocuments?.map((doc, idx) => (
                      <a
                        key={`doc-${idx}`}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 rounded bg-muted/50 hover:bg-muted transition-colors border border-border text-xs text-primary"
                      >
                        <FileText size={14} className="shrink-0" />
                        <span className="truncate flex-1">{doc.name}</span>
                        <ExternalLink size={10} className="shrink-0 opacity-50" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer: Official Source */}
              {record.link && (
                <div className="pt-2 border-t border-border mt-2">
                  <a
                    href={record.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors text-sm font-medium"
                  >
                    <ExternalLink size={14} />
                    {record.link.includes('?expand#')
                      ? 'View Product Details'
                      : record.type === 'FIPS 140-3'
                        ? 'View the NIST CMVP certificate page'
                        : record.type === 'ACVP'
                          ? 'View the NIST CAVP validation page'
                          : 'View Official Record Source'}
                  </a>
                </div>
              )}
            </div>
          </div>
        </FocusLock>
      </div>
    </>
  )

  return createPortal(content, document.body)
}
