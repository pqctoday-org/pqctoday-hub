// SPDX-License-Identifier: GPL-3.0-only
/**
 * Cryptographic Discovery / Inventory — Report section.
 *
 * Closes a real content gap: the report covers WHICH algorithm families a user
 * selected, but never addresses "where is my crypto" — discovery, the
 * standard first pillar of any PQC migration. `currentCryptoCategories` was
 * previously reduced to a bare "N selected" count in the Assessment Profile.
 *
 * Deliberately does NOT link `cryptoEstate.ts` — that file is an explicitly
 * fictional sample dataset for the CBOM Learn module / Inventory Lifecycle
 * Simulator, unrelated to any real user. Showing it here would present a
 * stranger's made-up estate as if it were the viewer's own. This section uses
 * ONLY the user's self-reported answers, and links to the CBOM Learn module
 * conceptually (as a place to learn discovery techniques), never as a data
 * source.
 */
import { Search, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CollapsibleSection } from '../ReportContent'

interface DiscoverySectionProps {
  algorithmsSelected: string[]
  algorithmCategories?: string[]
  algorithmUnknown: boolean
  defaultOpen?: boolean
}

export function DiscoverySection({
  algorithmsSelected,
  algorithmCategories,
  algorithmUnknown,
  defaultOpen = false,
}: DiscoverySectionProps) {
  const specific = algorithmsSelected.length > 0 ? algorithmsSelected : null
  const categories =
    !specific && algorithmCategories && algorithmCategories.length > 0
      ? algorithmCategories
      : null

  return (
    <CollapsibleSection
      id="report-section-discovery"
      title="Cryptographic Discovery"
      icon={<Search className="text-primary" size={20} />}
      defaultOpen={defaultOpen}
      infoTip="discovery"
    >
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Before you can migrate your cryptography, you have to know where it
          lives. This is the standard first pillar of a PQC migration — often
          called a Cryptographic Bill of Materials (CBOM) — and it usually
          turns up more than teams expect: hard-coded algorithms, forgotten
          libraries, third-party dependencies.
        </p>

        {algorithmUnknown ? (
          <div className="glass-panel p-3 border-l-4 border-l-warning">
            <p className="text-sm text-foreground font-medium">
              You told us your cryptography isn&apos;t inventoried yet.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              That&apos;s exactly the gap this section is about — a real
              discovery pass is your highest-value next step, before any
              migration planning.
            </p>
          </div>
        ) : (
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-2">
              Your starting inventory
            </h4>
            {specific || categories ? (
              <>
                <div className="flex flex-wrap gap-1.5">
                  {(specific ?? categories ?? []).map((item) => (
                    <span
                      key={item}
                      className="text-xs px-2 py-1 rounded-full bg-muted/30 text-foreground border border-border"
                    >
                      {item}
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground/70 mt-2 italic">
                  {specific
                    ? 'A self-reported starting point — the algorithms you told us you use. Not a scan of your actual codebase or infrastructure.'
                    : 'Coarse crypto families you told us you use — not a scan of your actual codebase or infrastructure.'}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                No cryptography was declared in this assessment.
              </p>
            )}
          </div>
        )}

        <div className="pt-2 border-t border-border flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <Link
            to="/learn/cbom"
            className="flex items-center gap-1.5 text-xs text-primary hover:underline print:hidden"
          >
            <ArrowRight size={12} />
            Learn how to run a real crypto discovery pass (CBOM)
          </Link>
          <Link
            to="/migrate"
            className="flex items-center gap-1.5 text-xs text-primary hover:underline print:hidden"
          >
            <ArrowRight size={12} />
            Explore discovery &amp; inventory tooling
          </Link>
        </div>
      </div>
    </CollapsibleSection>
  )
}
