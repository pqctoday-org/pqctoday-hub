// SPDX-License-Identifier: GPL-3.0-only
/**
 * Third-Party & Vendor PQC Risk — Report section.
 *
 * Closes a real content gap: `vendorDependency` drives scoring and ROI but was
 * previously surfaced only as a one-line "Vendor Model" chip in the
 * Assessment Profile. This section:
 *   1. Frames what the assessed vendor model means for migration control.
 *   2. Lists the real, per-product data the report already computes
 *      (`relevantSoftware` — industry/infrastructure-matched Migrate catalog
 *      products) joined to each product's vendor and that vendor's PQC
 *      commitment, via the same `vendorMap` lookup used on the Migrate page.
 *
 * Deliberately does NOT pull from the PKILearning VendorRisk module — that is
 * an interactive learning workshop with no exportable data, not a content
 * source. Every fact shown here traces to the same proof-gated catalog data
 * the rest of the app uses.
 */
import clsx from 'clsx'
import { Building2, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CollapsibleSection } from '../ReportContent'
import { vendorMap } from '@/data/migrateData'
import type { SoftwareItem } from '@/types/MigrateTypes'

type VendorModel = 'heavy-vendor' | 'open-source' | 'mixed' | 'in-house'

const VENDOR_MODEL_COPY: Record<VendorModel, { label: string; framing: string }> = {
  'heavy-vendor': {
    label: 'Heavy vendor dependency',
    framing:
      'Most of your cryptographic implementation sits inside third-party products you don’t control the source of. Your migration timeline is bound by those vendors’ own PQC roadmaps as much as your internal effort — track each vendor’s committed timeline, not just your own.',
  },
  'open-source': {
    label: 'Open-source dependency',
    framing:
      'Your cryptographic stack leans on open-source projects and foundations rather than commercial vendors. You typically get earlier visibility into PQC support through public roadmaps and release notes, but no contractual SLA forces a timeline — track upstream releases directly.',
  },
  mixed: {
    label: 'Mixed vendor / open-source / in-house',
    framing:
      'Your estate blends vendor products, open-source components, and in-house code. Treat each dependency differently: chase vendor roadmaps, track open-source release cadence, and inventory in-house code as your own responsibility.',
  },
  'in-house': {
    label: 'Primarily in-house',
    framing:
      'Most of your cryptographic implementation is code you own directly. That means less waiting on third parties — but the migration work, and the risk of missing something, is entirely yours to plan and execute.',
  },
}

const PQC_COMMITMENT_STYLE: Record<string, { label: string; className: string }> = {
  Active: { label: 'Active PQC support', className: 'text-success' },
  Partial: { label: 'Partial PQC support', className: 'text-warning' },
  Announced: { label: 'PQC roadmap announced', className: 'text-warning' },
  None: { label: 'No PQC commitment yet', className: 'text-destructive' },
  Unknown: { label: 'PQC commitment unknown', className: 'text-muted-foreground' },
}

function isVendorModel(v: string | undefined): v is VendorModel {
  return !!v && v in VENDOR_MODEL_COPY
}

interface VendorRiskSectionProps {
  vendorDependency?: string
  vendorUnknown?: boolean
  relevantSoftware: SoftwareItem[]
  defaultOpen?: boolean
}

export function VendorRiskSection({
  vendorDependency,
  vendorUnknown,
  relevantSoftware,
  defaultOpen = false,
}: VendorRiskSectionProps) {
  const modelCopy =
    !vendorUnknown && isVendorModel(vendorDependency) ? VENDOR_MODEL_COPY[vendorDependency] : null

  return (
    <CollapsibleSection
      id="report-section-vendorRisk"
      title="Third-Party & Vendor PQC Risk"
      icon={<Building2 className="text-primary" size={20} />}
      defaultOpen={defaultOpen}
      infoTip="vendorRisk"
    >
      <div className="space-y-4">
        {modelCopy ? (
          <div>
            <span className="inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase tracking-wide">
              {modelCopy.label}
            </span>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              {modelCopy.framing}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your vendor dependency model wasn&apos;t captured in this assessment — answer the
            infrastructure question in a full run to get tailored guidance on managing third-party
            PQC risk.
          </p>
        )}

        {relevantSoftware.length > 0 ? (
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-2">
              Vendors &amp; products in your estate
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th scope="col" className="py-2 pr-3 text-muted-foreground font-medium">
                      Product
                    </th>
                    <th scope="col" className="py-2 pr-3 text-muted-foreground font-medium">
                      Vendor
                    </th>
                    <th scope="col" className="py-2 text-muted-foreground font-medium">
                      PQC Commitment
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {relevantSoftware.map((item) => {
                    const vendor = item.vendorId ? vendorMap.get(item.vendorId) : undefined
                    const commitment = vendor
                      ? PQC_COMMITMENT_STYLE[vendor.pqcCommitment]
                      : undefined
                    return (
                      <tr key={item.productId} className="border-b border-border/50">
                        <td className="py-2.5 pr-3 font-medium text-foreground">
                          {item.softwareName}
                        </td>
                        <td className="py-2.5 pr-3 text-muted-foreground">
                          {vendor?.vendorDisplayName ?? '—'}
                        </td>
                        <td
                          className={clsx(
                            'py-2.5 text-xs font-semibold',
                            commitment?.className ?? 'text-muted-foreground'
                          )}
                        >
                          {commitment?.label ?? 'Not tracked'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <Link
              to="/migrate"
              className="flex items-center gap-1.5 text-xs text-primary hover:underline mt-3 print:hidden"
            >
              <ArrowRight size={12} />
              Explore the full Migrate catalog
            </Link>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            No catalog products matched your industry and infrastructure yet — add infrastructure
            details in the assessment for tailored vendor matches.
          </p>
        )}
      </div>
    </CollapsibleSection>
  )
}
