// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link, useInRouterContext } from 'react-router'
import FocusLock from 'react-focus-lock'
import { useOverlayEscape } from '@/hooks/useOverlayEscape'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
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
import type { ComplianceRecord, ComplianceStatus, EsvEntropyClaim } from './types'
import clsx from 'clsx'
import {
  cavpValidationUrl,
  EMPTY_ENTROPY_INDEX,
  euccEnisaListing,
  formatIsoDate,
  isPqcApplicable,
  isSecurityTargetType,
  NOT_ON_ENISA_LIST_LABEL,
  pqcCoverageState,
  pqcUnknownReason,
  pqcEvidenceLabel,
  pqcNames,
  recordPath,
  recordTypeDescription,
  recordTypeLabel,
  safeHttpUrl,
  schemeCertificateId,
  statusBadgeClass,
  statusTone,
  type EntropyIndex,
} from './recordSemantics'
import { AskAssistantButton } from '../ui/AskAssistantButton'
import { EndorseButton } from '../ui/EndorseButton'
import { FlagButton } from '../ui/FlagButton'
import { ItemShareButton, itemShareTitle } from '@/components/common/ItemShareButton'
import { buildRecordEndorsementUrl, buildRecordFlagUrl, recordLabel } from './complianceEndorsement'
import { useIsEmbedded } from '../../embed/EmbedProvider'
import { useModalPosition } from '../../hooks/useModalPosition'
import { Button } from '@/components/ui/button'
import { EnisaCertificateLink } from './EnisaCertificateLink'

interface ComplianceDetailPopoverProps {
  isOpen: boolean
  onClose: () => void
  record: ComplianceRecord | null
  /** Which modules name which entropy certificate (links between FIPS 140-3 and ESV records). */
  entropy?: EntropyIndex
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

/** A link to another record: in-app when there is a router (the page), a plain link otherwise. */
const RecordLink = ({ to, children }: { to: string; children: ReactNode }) => {
  const inRouter = useInRouterContext()
  const cls = 'inline-flex items-center gap-1 text-primary hover:underline'
  return inRouter ? (
    <Link to={to} className={cls}>
      {children}
    </Link>
  ) : (
    <a href={to} className={cls}>
      {children}
    </a>
  )
}

/**
 * FIPS 140-3: the entropy certificates the module's Security Policy names. A number links to
 * its ESV record only when that record is in the snapshot.
 */
const FipsEntropyCertificates = ({
  record,
  entropy,
}: {
  record: ComplianceRecord
  entropy: EntropyIndex
}) => {
  const ids = record.entropyCertificates ?? []
  if (ids.length === 0) return null
  const src = record.entropyCertificatesSource
  return (
    <div className="space-y-1" data-testid="fips-entropy-certificates">
      <FieldLabel>Entropy certificates (Security Policy)</FieldLabel>
      <ul className="space-y-0.5 text-xs">
        {ids.map((id) => {
          const esv = entropy.esv.get(id)
          return (
            <li key={id} className="flex flex-wrap items-baseline gap-x-2">
              {esv ? (
                <RecordLink to={recordPath(esv)}>
                  <span className="font-mono">{id}</span>
                </RecordLink>
              ) : (
                <span
                  className="font-mono text-foreground"
                  title="Not in this snapshot's list of NIST entropy source validations"
                >
                  {id}
                </span>
              )}
              {esv ? (
                <span className="text-muted-foreground">
                  {esv.productName} · {esv.vendor}
                </span>
              ) : (
                <span className="text-muted-foreground">not in this snapshot&apos;s ESV list</span>
              )}
            </li>
          )
        })}
      </ul>
      {src && (
        <p className="text-xs text-muted-foreground">
          Named in the module&apos;s own Security Policy ({src.table}, PDF page {src.page}):{' '}
          <ExtLink href={src.policyUrl}>Security Policy (PDF)</ExtLink>
        </p>
      )}
    </div>
  )
}

/**
 * EUCC: a certificate ENISA lists as withdrawn. The sentence is ENISA's own, verbatim; a
 * replacement is shown only when ENISA names one. Nothing is shown for a record with neither.
 */
const EuccWithdrawal = ({ record }: { record: ComplianceRecord }) => {
  const note = record.euccWithdrawalNote?.trim()
  const replacedBy = record.euccReplacedBy?.trim()
  if (record.type !== 'EUCC' || (!note && !replacedBy)) return null
  const replacedByUrl = safeHttpUrl(replacedBy)
  return (
    <div
      className="space-y-2 rounded-md border border-border bg-muted/40 p-3"
      data-testid="eucc-withdrawal"
    >
      <FieldLabel>Withdrawn</FieldLabel>
      {note && <p className="text-sm text-foreground whitespace-normal break-words">{note}</p>}
      {replacedBy && (
        <Field label="Replaced by">
          {replacedByUrl ? <ExtLink href={replacedByUrl}>{replacedBy}</ExtLink> : replacedBy}
        </Field>
      )}
      <p className="text-xs text-muted-foreground">Stated by ENISA.</p>
    </div>
  )
}

/** FIPS 140-3: what the NIST CMVP certificate page states. */
const FipsDetails = ({ record, entropy }: { record: ComplianceRecord; entropy: EntropyIndex }) => {
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
      <FipsEntropyCertificates record={record} entropy={entropy} />
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

const claimFacts = (c: EsvEntropyClaim): string[] =>
  [
    c.bitsOfEntropyPerOutput && `Bits of entropy per output: ${c.bitsOfEntropyPerOutput}`,
    c.outputSizeBits && `Output size: ${c.outputSizeBits} bits`,
    c.entropyPerSample && `Entropy per sample: ${c.entropyPerSample}`,
    c.sampleSize && `Sample size: ${c.sampleSize}`,
    c.statedAs,
  ].filter((x): x is string => !!x)

/**
 * NIST entropy source validation: what the certificate page states. The page does not say
 * whether the source is hardware or software — only whether its noise source is physical.
 */
const EsvDetails = ({ record, entropy }: { record: ComplianceRecord; entropy: EntropyIndex }) => {
  const claims = record.esvEntropyClaims ?? []
  const modules = entropy.usedBy.get(record.id) ?? []
  const history = record.esvValidationHistory ?? []
  const first = formatIsoDate(record.esvFirstValidated)
  const observed = formatIsoDate(record.esvDetailsFetchedAt ?? record.esvListObservedAt)
  return (
    <div className="space-y-3 pt-2 border-t border-border" data-testid="esv-details">
      <FieldLabel>NIST entropy source validation</FieldLabel>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {record.esvStandard && <Field label="Standard">{record.esvStandard}</Field>}
        {record.esvVersion && <Field label="Version">{record.esvVersion}</Field>}
        {record.esvNoiseSourceClassification && (
          <Field label="Noise source">
            {record.esvNoiseSourceClassification}
            <span className="block text-xs text-muted-foreground">NIST&apos;s classification</span>
          </Field>
        )}
        {record.esvReuseStatus && <Field label="Reuse status">{record.esvReuseStatus}</Field>}
        {first && <Field label="First validated">{first}</Field>}
        {observed && (
          <Field label="Page read">
            {observed}
            {!record.esvDetailsFetchedAt && (
              <span className="block text-xs text-muted-foreground">
                list entry only — the certificate page could not be read
              </span>
            )}
          </Field>
        )}
      </div>
      {record.esvDescription && record.esvDescription !== record.productName && (
        <Field label="Description">{record.esvDescription}</Field>
      )}
      {claims.length > 0 && (
        <div className="space-y-2">
          <FieldLabel>Entropy claims (certificate page)</FieldLabel>
          {claims.map((c, i) => {
            const envs = c.operatingEnvironments ?? []
            const comps = c.conditioningComponents ?? []
            return (
              <div key={i} className="rounded border border-border p-2 space-y-1.5 text-xs">
                <p className="text-foreground">{claimFacts(c).join(' · ') || '—'}</p>
                {comps.length > 0 && (
                  <p className="flex flex-wrap items-baseline gap-x-2 text-muted-foreground">
                    <span>Vetted conditioning component:</span>
                    {comps.map((k, n) =>
                      k.url ? (
                        <ExtLink key={`${k.cavp}-${n}`} href={k.url}>
                          <span className="font-mono">{k.cavp}</span>
                          {k.algorithm ? ` (${k.algorithm})` : ''}
                        </ExtLink>
                      ) : (
                        <span key={n}>{k.text ?? k.cavp}</span>
                      )
                    )}
                  </p>
                )}
                {envs.length > 0 && (
                  <details>
                    <summary className="cursor-pointer text-muted-foreground">
                      {envs.length} operating environment{envs.length === 1 ? '' : 's'}
                    </summary>
                    <ul className="mt-1 list-disc pl-4">
                      {envs.map((e) => (
                        <li key={e}>{e}</li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            )
          })}
        </div>
      )}
      {history.length > 0 && (
        <div className="space-y-1">
          <FieldLabel>Validation history</FieldLabel>
          <ul className="text-xs space-y-0.5">
            {history.map((h, i) => (
              <li key={`${h.date}-${i}`}>
                <span className="font-mono">{h.date}</span>
                <span className="text-muted-foreground"> — {h.lab}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="space-y-1" data-testid="esv-used-by">
        <FieldLabel>Relied on by FIPS 140-3 modules</FieldLabel>
        {modules.length > 0 ? (
          <ul className="space-y-0.5 text-xs">
            {modules.map((m) => (
              <li key={m.id} className="flex flex-wrap items-baseline gap-x-2">
                <RecordLink to={recordPath(m)}>
                  <span className="font-mono">#{m.id}</span>
                </RecordLink>
                <span className="text-foreground">{m.productName}</span>
                <span className="text-muted-foreground">
                  {[m.vendor, m.certificationLevel, m.status].filter(Boolean).join(' · ')}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">
            No module in this snapshot names this certificate yet. Security Policies are read only
            for modules whose certificate lists a PQC algorithm, so this does not mean no module
            uses it.
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Read from each module&apos;s own Security Policy table, never matched by vendor name.
        </p>
      </div>
      {record.link && <ExtLink href={record.link}>NIST entropy certificate {record.id}</ExtLink>}
    </div>
  )
}

const PqcSection = ({ record }: { record: ComplianceRecord }) => {
  // An entropy certificate says nothing about PQC: no "unknown", no "none" — nothing to show.
  if (!isPqcApplicable(record.type)) return null
  const state = pqcCoverageState(record.pqcCoverage)
  const fromSt = isSecurityTargetType(record.type)
  if (state === 'none') return null
  if (state === 'not-read') {
    return (
      <div className="space-y-1">
        <FieldLabel>PQC mechanisms</FieldLabel>
        <p className="text-sm text-muted-foreground italic">
          {pqcUnknownReason(record) === 'source-lists-none'
            ? 'Unknown — NIST publishes this certificate page without an Approved Algorithms list, so it does not say which algorithms the module approves.'
            : record.type === 'FIPS 140-3'
              ? "Unknown — the certificate page's Approved Algorithms list could not be read."
              : 'Unknown — the source page could not be read.'}
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
  entropy = EMPTY_ENTROPY_INDEX,
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

  // Esc closes only the top overlay (shared stack); page stays put behind.
  useOverlayEscape(isOpen && !!record, onClose, { rootRef: popoverRef })
  useBodyScrollLock(isOpen && !!record)

  // Move focus into modal when it opens
  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus()
    }
  }, [isOpen])

  if (!isOpen || !record) return null

  // A Common Criteria Portal listing's EUCC number, checked against ENISA's certificate list.
  const enisaListing = euccEnisaListing(record)

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
                    {schemeCertificateId(record) && (
                      <span className="text-xs text-muted-foreground font-mono">
                        {enisaListing?.state === 'listed' ? (
                          <EnisaCertificateLink
                            url={enisaListing.url}
                            number={enisaListing.number}
                          />
                        ) : (
                          schemeCertificateId(record)
                        )}
                      </span>
                    )}
                    {enisaListing?.state === 'not-listed' && (
                      <span className="text-xs text-muted-foreground">
                        {NOT_ON_ENISA_LIST_LABEL}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <AskAssistantButton
                      question={
                        record.type === 'ESV'
                          ? `What does NIST entropy certificate ${record.id} (${record.productName}${record.vendor ? ` by ${record.vendor}` : ''}) validate, and how do FIPS 140-3 modules rely on an entropy source like it?`
                          : `What PQC compliance requirements does ${record.productName}${record.vendor ? ` by ${record.vendor}` : ''} enforce under ${recordTypeLabel(record.type)}${record.source ? ` (${record.source})` : ''}${record.certificationLevel ? `, level: ${record.certificationLevel}` : ''}?`
                      }
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
                    <ItemShareButton
                      title={itemShareTitle(record.productName || record.id)}
                      path={`/compliance?cert=${encodeURIComponent(record.id)}`}
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

                {/* Official sources that disagree — both shown, neither chosen */}
                {record.sourceConflicts?.map((conflict) => (
                  <div
                    key={conflict.field}
                    className="space-y-1.5 rounded-md border border-border bg-status-warning/10 p-2"
                  >
                    <h4 className="text-xs font-semibold text-status-warning uppercase tracking-wider">
                      Official sources disagree
                    </h4>
                    <ul className="space-y-1">
                      {conflict.values.map((v) => (
                        <li key={v.source} className="text-sm text-foreground break-words">
                          <span className="font-medium">{v.value}</span>
                          <span className="text-muted-foreground"> — </span>
                          {v.url ? (
                            <a
                              href={v.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary underline underline-offset-2"
                            >
                              {v.source}
                            </a>
                          ) : (
                            <span className="text-muted-foreground">{v.source}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                    {conflict.note && (
                      <p className="text-xs text-muted-foreground">{conflict.note}</p>
                    )}
                  </div>
                ))}

                {/* Date */}
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {record.type === 'ESV' ? 'Latest validation' : 'Certification Date'}
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

              {/* EUCC: ENISA's withdrawal sentence, when the record has one */}
              <EuccWithdrawal record={record} />

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

              {record.type === 'FIPS 140-3' && <FipsDetails record={record} entropy={entropy} />}
              {record.type === 'ACVP' && <CavpDetails record={record} />}
              {record.type === 'ESV' && <EsvDetails record={record} entropy={entropy} />}

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
                          : record.type === 'ESV'
                            ? 'View the NIST entropy certificate page'
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
