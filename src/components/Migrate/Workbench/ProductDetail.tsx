// SPDX-License-Identifier: GPL-3.0-only
//
// Expanded per-product detail for the workbench — reuses the same data +
// components as the existing /migrate SoftwareTable expanded row, so nothing
// is lost in the redesign: vendor PQC roadmap, certifications, validation
// proof, evidence flags, capability text, vendor + repo links.

import { useState } from 'react'
import { Link } from 'react-router'
import { ExternalLink, FileText, BookOpen, Newspaper, BookText } from 'lucide-react'
import type { SoftwareItem } from '@/types/MigrateTypes'
import { getCertsForProduct } from '@/data/certificationXrefData'
import { cpeByProduct } from '@/data/cpeXrefData'
import { purlByProduct } from '@/data/purlXrefData'
import { roadmapByVendorId } from '@/data/vendorRoadmapData'
import { enrichmentByVendorId } from '@/data/vendorRoadmapEnrichmentData'
import { vendorMap } from '@/data/migrateData'
import { MODULE_CATALOG } from '@/components/PKILearning/moduleData'
import { VendorRoadmapPanel } from '../VendorRoadmapPanel'
import { CertBadges, EvidenceWarnings } from '../migrateHelpers'
import { EndorseButton } from '@/components/ui/EndorseButton'
import { FlagButton } from '@/components/ui/FlagButton'
import { buildEndorsementUrl, buildFlagUrl } from '@/utils/endorsement'
import { Pill } from './workbenchUi'
import { productVerificationBadge } from './productStatus'
// ADDED 2026-08-01: migrate-catalog had 907/907 active rows carrying a
// trusted_source_id and real revision entries in revisions.jsonl, but no
// page on the app displayed either — TrustScoreBadge/ReviewedBadge are
// mounted everywhere else (threats, algorithms, library, compliance,
// timeline) but not here. TrustScoreBadge keys migrate scores by
// softwareName (trustScoreData.ts); ReviewedBadge's revision entries key by
// productId (the slug form, e.g. "ibm-hyper-protect-crypto") — different
// identifier spaces, both wired correctly below.
import { TrustScoreBadge } from '@/components/ui/TrustScoreBadge'
import { ReviewedBadge } from '@/components/ui/ReviewedBadge'
import { RevisionDrilldownPanel } from '@/components/ui/RevisionDrilldownPanel'
import { useRevisions, byRecord } from '@/hooks/useRevisions'

export function ProductDetail({ product }: { product: SoftwareItem }) {
  const certs = getCertsForProduct(product.productId, product.softwareName)
  // ADDED (Bug 2 remediation): the CPE/PURL cross-reference join (~915 + 800
  // rows, keyed by softwareName like certsByProduct) was loaded and used for
  // CBOM export + CVE matching elsewhere, but never rendered as a link
  // anywhere in src/components/Migrate. Only surface rows with a real match
  // (never `not_found`) so this never links out with an empty href.
  const cpe = cpeByProduct.get(product.softwareName)
  const hasCpe = !!cpe && (cpe.status === 'matched' || cpe.status === 'partial') && !!cpe.nvdUrl
  const purl = purlByProduct.get(product.softwareName)
  const hasPurl = !!purl && purl.status === 'matched' && !!purl.registryUrl
  const roadmap = product.vendorId ? roadmapByVendorId.get(product.vendorId) : undefined
  const enrichment = product.vendorId ? enrichmentByVendorId.get(product.vendorId) : undefined
  const vendor = product.vendorId ? vendorMap.get(product.vendorId) : undefined
  const { revisions } = useRevisions()
  const [drilldownOpen, setDrilldownOpen] = useState(false)

  // The pqcSupport string carries the concise capability detail
  // (e.g. "Yes (ACVP: ML-DSA, ML-KEM, SLH-DSA)"). Strip the leading Yes/No.
  const supportDetail = (product.pqcSupport || '')
    .replace(/^\s*(yes|no|partial)\b[\s:,-]*/i, '')
    .replace(/^\(|\)$/g, '')
    .trim()

  const verification = productVerificationBadge(product)

  // ADDED (Bug 2 remediation): learningModules was curated on 749/907 catalog
  // rows (semicolon-separated module ids, e.g. "tls-basics;hybrid-crypto")
  // but never rendered anywhere in src/components/Migrate — zero <Link>
  // elements existed in this directory. Every id here is verified to resolve
  // to a real MODULE_CATALOG entry (see migrateData.ts's row.learning_modules
  // sourcing), so this is a safe, real /learn/<id> deep link, not a guess.
  const learningModuleIds = (product.learningModules || '')
    .split(';')
    .map((id) => id.trim())
    .filter(Boolean)

  return (
    <div className="flex flex-col gap-3 border-t border-border bg-muted/20 px-3 py-3 text-xs">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
          Verification status
        </span>
        <Pill tone={verification.tone}>{verification.label}</Pill>
        {product.lastVerifiedDate && (
          <span className="text-[11px] text-muted-foreground">
            as of {product.lastVerifiedDate}
          </span>
        )}
        <TrustScoreBadge resourceType="migrate" resourceId={product.softwareName} size="sm" />
        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
        <span onClick={(e) => e.stopPropagation()}>
          <ReviewedBadge
            domain="migrate"
            entityId={product.productId}
            showUnreviewed={false}
            onOpenDrilldown={() => setDrilldownOpen(true)}
          />
        </span>
        {drilldownOpen && (
          // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
          <div onClick={(e) => e.stopPropagation()}>
            <RevisionDrilldownPanel
              domain="migrate"
              entityId={product.productId}
              entityLabel={product.softwareName}
              revisions={byRecord(revisions, 'migrate', product.productId)}
              onClose={() => setDrilldownOpen(false)}
            />
          </div>
        )}
      </div>

      <div>
        <p className="mb-1 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
          PQC capabilities
        </p>
        {supportDetail && <p className="font-medium text-foreground">{supportDetail}</p>}
        {product.pqcCapabilityDescription && (
          <p className="mt-0.5 leading-relaxed text-foreground/80">
            {product.pqcCapabilityDescription}
          </p>
        )}
        {!supportDetail && !product.pqcCapabilityDescription && (
          <p className="italic text-muted-foreground">
            No PQC capability details documented for this product.
          </p>
        )}
      </div>

      {certs.length > 0 && (
        <div>
          <p className="mb-1 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
            Certifications
          </p>
          <CertBadges certs={certs} />
        </div>
      )}

      {(hasCpe || hasPurl) && (
        <div>
          <p className="mb-1 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
            Identifiers
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {hasCpe && (
              <a
                href={cpe!.nvdUrl}
                target="_blank"
                rel="noopener noreferrer"
                title={cpe!.cpeUri}
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                <ExternalLink size={12} aria-hidden /> CPE: {cpe!.cpeUri}
              </a>
            )}
            {hasPurl && (
              <a
                href={purl!.registryUrl}
                target="_blank"
                rel="noopener noreferrer"
                title={purl!.purl}
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                <ExternalLink size={12} aria-hidden /> PURL: {purl!.purl}
              </a>
            )}
          </div>
        </div>
      )}

      {learningModuleIds.length > 0 && (
        <div>
          <p className="mb-1 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
            Learn this
          </p>
          <ul className="flex flex-wrap gap-1.5">
            {learningModuleIds.map((id) => (
              <li key={id}>
                <Link
                  to={`/learn/${id}`}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-[11px] text-primary hover:underline"
                >
                  <BookOpen size={11} aria-hidden />
                  {MODULE_CATALOG[id]?.title ?? id}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <EvidenceWarnings flags={product.evidenceFlags} />

      {(roadmap || enrichment) && <VendorRoadmapPanel roadmap={roadmap} enrichment={enrichment} />}

      <div className="flex flex-wrap items-center gap-3">
        {vendor?.website && (
          <a
            href={vendor.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            <ExternalLink size={12} aria-hidden /> {vendor.vendorDisplayName || 'Vendor'}
          </a>
        )}
        {product.repositoryUrl && (
          <a
            href={product.repositoryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            <ExternalLink size={12} aria-hidden /> Repository
          </a>
        )}
        {product.proofUrl && (
          <a
            href={product.proofUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-status-success hover:underline"
          >
            <FileText size={12} aria-hidden /> Validation proof
            {product.proofPublicationDate ? ` (${product.proofPublicationDate})` : ''}
          </a>
        )}
        {product.productBriefUrl && (
          <a
            href={product.productBriefUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            <Newspaper size={12} aria-hidden /> Product Brief
          </a>
        )}
        {product.userManualUrl && (
          <a
            href={product.userManualUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            <BookText size={12} aria-hidden /> User Manual
          </a>
        )}
      </div>

      {product.proofRelevantInfo && (
        <p className="rounded-md border border-border bg-card p-2 leading-relaxed text-muted-foreground">
          {product.proofRelevantInfo}
        </p>
      )}

      <div className="flex items-center gap-1 border-t border-border pt-2">
        <EndorseButton
          endorseUrl={buildEndorsementUrl({
            category: 'pqc-tool-endorsement',
            title: `Endorse: ${product.softwareName}`,
            resourceType: 'Product',
            resourceId: product.softwareName,
            resourceDetails: [
              `**Product:** ${product.softwareName}`,
              vendor?.vendorDisplayName ? `**Vendor:** ${vendor.vendorDisplayName}` : '',
              product.pqcSupport ? `**PQC support:** ${product.pqcSupport}` : '',
            ]
              .filter(Boolean)
              .join('\n'),
            pageUrl: `/migrate?product=${encodeURIComponent(product.softwareName)}`,
          })}
          resourceLabel={product.softwareName}
          resourceType="Product"
          variant="text"
        />
        <FlagButton
          flagUrl={buildFlagUrl({
            category: 'pqc-tool-endorsement',
            title: `Flag: ${product.softwareName}`,
            resourceType: 'Product',
            resourceId: product.softwareName,
            resourceDetails: [
              `**Product:** ${product.softwareName}`,
              vendor?.vendorDisplayName ? `**Vendor:** ${vendor.vendorDisplayName}` : '',
              product.pqcSupport ? `**PQC support:** ${product.pqcSupport}` : '',
            ]
              .filter(Boolean)
              .join('\n'),
            pageUrl: `/migrate?product=${encodeURIComponent(product.softwareName)}`,
          })}
          resourceLabel={product.softwareName}
          resourceType="Product"
          variant="text"
        />
      </div>
    </div>
  )
}
