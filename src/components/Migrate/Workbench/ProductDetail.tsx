// SPDX-License-Identifier: GPL-3.0-only
//
// Expanded per-product detail for the workbench — reuses the same data +
// components as the existing /migrate SoftwareTable expanded row, so nothing
// is lost in the redesign: vendor PQC roadmap, certifications, validation
// proof, evidence flags, capability text, vendor + repo links.

import { ExternalLink, FileText } from 'lucide-react'
import type { SoftwareItem } from '@/types/MigrateTypes'
import { certsByProduct } from '@/data/certificationXrefData'
import { roadmapByVendorId } from '@/data/vendorRoadmapData'
import { enrichmentByVendorId } from '@/data/vendorRoadmapEnrichmentData'
import { vendorMap } from '@/data/migrateData'
import { VendorRoadmapPanel } from '../VendorRoadmapPanel'
import { CertBadges, EvidenceWarnings } from '../migrateHelpers'

export function ProductDetail({ product }: { product: SoftwareItem }) {
  const certs = certsByProduct.get(product.softwareName) ?? []
  const roadmap = product.vendorId ? roadmapByVendorId.get(product.vendorId) : undefined
  const enrichment = product.vendorId ? enrichmentByVendorId.get(product.vendorId) : undefined
  const vendor = product.vendorId ? vendorMap.get(product.vendorId) : undefined

  // The pqcSupport string carries the concise capability detail
  // (e.g. "Yes (ACVP: ML-DSA, ML-KEM, SLH-DSA)"). Strip the leading Yes/No.
  const supportDetail = (product.pqcSupport || '')
    .replace(/^\s*(yes|no|partial)\b[\s:,-]*/i, '')
    .replace(/^\(|\)$/g, '')
    .trim()

  return (
    <div className="flex flex-col gap-3 border-t border-border bg-muted/20 px-3 py-3 text-xs">
      {(supportDetail || product.pqcCapabilityDescription) && (
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
        </div>
      )}

      {certs.length > 0 && (
        <div>
          <p className="mb-1 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
            Certifications
          </p>
          <CertBadges certs={certs} />
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
      </div>

      {product.proofRelevantInfo && (
        <p className="rounded-md border border-border bg-card p-2 leading-relaxed text-muted-foreground">
          {product.proofRelevantInfo}
        </p>
      )}
    </div>
  )
}
