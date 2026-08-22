// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import { FileJson, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  SAMPLE_COMPONENTS,
  SBOM_DOCUMENT_META,
  type SampleComponent,
} from '../data/sampleComponents'

/**
 * SBOM Format Explorer — render a generic software component (not a
 * cryptographic asset — that comparison belongs to the CBOM module's Format
 * Chooser) as SPDX vs CycloneDX, mapping NTIA's seven 2021 minimum elements
 * plus the 2026-update elements with a natural per-component home (hash,
 * license) onto each format's actual fields. The remaining seven 2026
 * additions are document-level SBOM-generation metadata (tool name/version,
 * data format name/version, generation context, author signature) with no
 * per-component representation, so they aren't part of this comparison.
 */

function cycloneDX(c: SampleComponent) {
  return {
    'bom-ref': c.id,
    type: 'library',
    name: c.name,
    version: c.version,
    supplier: { name: c.supplier },
    purl: c.purl,
    licenses: [{ license: { id: c.license } }],
    hashes: [{ alg: 'SHA-256', content: c.hash.replace('sha256:', '') }],
  }
}

function spdx(c: SampleComponent) {
  return {
    SPDXID: `SPDXRef-${c.id}`,
    name: c.name,
    versionInfo: c.version,
    supplier: `Organization: ${c.supplier}`,
    licenseConcluded: c.license,
    externalRefs: [{ referenceType: 'purl', referenceLocator: c.purl }],
    checksums: [{ algorithm: 'SHA256', checksumValue: c.hash.replace('sha256:', '') }],
  }
}

const ELEMENT_MAP: { element: string; cdx: string; spdx: string; addedIn2026?: boolean }[] = [
  { element: 'Supplier Name', cdx: 'component.supplier.name', spdx: 'PackageSupplier' },
  { element: 'Component Name', cdx: 'component.name', spdx: 'PackageName' },
  { element: 'Version', cdx: 'component.version', spdx: 'PackageVersionInfo' },
  { element: 'Other Unique Identifiers', cdx: 'component.purl', spdx: 'ExternalRef (purl)' },
  { element: 'Dependency Relationship', cdx: 'dependencies[]', spdx: 'Relationship' },
  { element: 'Author of SBOM Data', cdx: 'metadata.authors[]', spdx: 'CreationInfo.Creator' },
  { element: 'Timestamp', cdx: 'metadata.timestamp', spdx: 'CreationInfo.Created' },
  {
    element: 'Component Hash',
    cdx: 'component.hashes[]',
    spdx: 'checksums[]',
    addedIn2026: true,
  },
  {
    element: 'Component License',
    cdx: 'component.licenses[]',
    spdx: 'licenseConcluded',
    addedIn2026: true,
  },
]

export function SbomFormatExplorer() {
  const [pick, setPick] = useState(SAMPLE_COMPONENTS[0].id)
  const component = SAMPLE_COMPONENTS.find((c) => c.id === pick) ?? SAMPLE_COMPONENTS[0]

  return (
    <div className="space-y-4">
      <div className="glass-panel p-4">
        <div className="mb-1 flex items-center gap-2">
          <FileJson size={18} className="text-primary" />
          <h3 className="font-semibold text-foreground">
            SPDX vs CycloneDX for a generic component
          </h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Same package, both formats. Neither expresses cryptographic properties — that&apos;s the
          CBOM module&apos;s job, one layer up.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {SAMPLE_COMPONENTS.map((c) => (
            <Button
              key={c.id}
              variant="outline"
              size="sm"
              onClick={() => setPick(c.id)}
              className={pick === c.id ? 'border-primary bg-primary/15 text-primary' : ''}
            >
              {c.name}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-2 lg:grid-cols-2">
        <div className="glass-panel p-3">
          <div className="mb-2 text-xs font-semibold text-status-success">
            CycloneDX component entry
          </div>
          <pre className="overflow-x-auto whitespace-pre-wrap break-words text-[11px] leading-snug text-foreground/90">
            {JSON.stringify(cycloneDX(component), null, 2)}
          </pre>
        </div>
        <div className="glass-panel p-3">
          <div className="mb-2 text-xs font-semibold text-status-info">SPDX package entry</div>
          <pre className="overflow-x-auto whitespace-pre-wrap break-words text-[11px] leading-snug text-foreground/90">
            {JSON.stringify(spdx(component), null, 2)}
          </pre>
        </div>
      </div>

      <div className="glass-panel p-4">
        <h4 className="mb-2 text-sm font-semibold text-foreground">9 minimum elements, mapped</h4>
        <div className="space-y-1">
          {ELEMENT_MAP.map((m) => (
            <div key={m.element} className="flex items-center justify-between text-xs gap-2">
              <span className="text-foreground w-40 shrink-0 flex items-center gap-1.5">
                {m.element}
                {m.addedIn2026 && (
                  <span className="rounded bg-status-info/15 px-1 py-0.5 text-[9px] font-semibold text-status-info">
                    2026
                  </span>
                )}
              </span>
              <span className="flex-1 text-muted-foreground text-right">
                CDX <code>{m.cdx}</code>
              </span>
              <span className="flex-1 text-muted-foreground text-right">
                SPDX <code>{m.spdx}</code>
              </span>
              <Check size={12} className="text-status-success shrink-0" />
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Two elements — <strong>Author of SBOM Data</strong> and <strong>Timestamp</strong> — live
          at the document level, not per component:{' '}
          <code>
            {SBOM_DOCUMENT_META.createdBy}, {SBOM_DOCUMENT_META.created}
          </code>
          . The two <span className="text-status-info">2026</span>-tagged rows show fields the 2026
          update newly requires — both formats already carried them, which is why they show up as
          real fields above rather than gaps. Even with those, neither format has a place for
          algorithm, key size, or quantum-vulnerability status, which is why a crypto inventory
          needs the separate CBOM extension. <X size={12} className="inline text-status-error" />
        </p>
      </div>
    </div>
  )
}
