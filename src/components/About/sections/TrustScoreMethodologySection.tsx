// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import { ShieldCheck, ChevronDown } from 'lucide-react'

const DIMENSIONS = [
  {
    name: 'Source Credibility',
    weight: '20%',
    description:
      'Evaluates the trustworthiness of the data source using our trusted source registry. Government and standards bodies score highest; industry analysts score lowest. The match method (direct, mapped, inferred) and number of corroborating sources also factor in.',
  },
  {
    name: 'Peer Review',
    weight: '20%',
    description:
      'Whether the resource has undergone formal peer review. FIPS standards, RFCs, and ISO publications score highest. Partial review (e.g., drafts under public comment) scores moderately. This field is populated via GitHub Discussions community vetting and editorial review.',
  },
  {
    name: 'Organizational Vetting',
    weight: '15%',
    description:
      'Whether recognized organizations (NIST, IETF, ETSI, ANSSI, BSI, etc.) have vetted or endorsed the resource. Multiple independent vetting bodies increase the score.',
  },
  {
    name: 'Reference Document',
    weight: '15%',
    description:
      'Whether a local copy of the source document exists and passes quality checks. Downloaded documents with extractable content score 100; restricted-access documents score 50; failed downloads score 20.',
  },
  {
    name: 'Cryptographic Simulation',
    weight: '10%',
    description:
      'Whether the algorithms referenced by the resource can be demonstrated in the interactive Playground (ML-KEM, ML-DSA, SLH-DSA, AES, etc.). Resources referencing demonstrable algorithms score 100.',
  },
  {
    name: 'Temporal Freshness',
    weight: '10%',
    description:
      'How recently the resource was verified or updated. Resources updated within 30 days score 100; over 1 year scores 10. Uses the most recent date from lastVerifiedDate, lastUpdateDate, or releaseDate.',
  },
  {
    name: 'Cross-Reference Density',
    weight: '5%',
    description:
      'How many other resources in the platform reference or are referenced by this resource. Higher interconnectedness indicates broader validation. 7+ cross-references scores 100.',
  },
  {
    name: 'Enrichment Completeness',
    weight: '5%',
    description:
      'For resources with AI-assisted enrichment analysis, measures what percentage of the 18 enrichment dimensions contain substantive data. Applies to library, timeline, and threat resources.',
  },
]

const TIERS = [
  { name: 'Authoritative', range: '85\u2013100', color: 'text-status-success' },
  { name: 'High', range: '70\u201384', color: 'text-primary' },
  { name: 'Moderate', range: '50\u201369', color: 'text-status-warning' },
  { name: 'Low', range: '0\u201349', color: 'text-status-error' },
]

export function TrustScoreMethodologySection() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="glass-panel p-4 md:p-6"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 w-full text-left cursor-pointer"
      >
        <ShieldCheck className="text-primary shrink-0" size={24} />
        <div className="flex-1">
          <h2 className="text-xl font-semibold">Trust Score Methodology</h2>
          <p className="text-xs text-muted-foreground">
            How we assess resource credibility across 8 dimensions
          </p>
        </div>
        <ChevronDown
          size={20}
          className={clsx(
            'text-muted-foreground transition-transform duration-200 shrink-0',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-4">
              <p className="text-muted-foreground text-sm">
                Every resource on PQC Today receives a composite trust score (0&ndash;100) derived
                from 8 weighted dimensions. The score is displayed as a tier badge on cards and
                tables. Hover over any badge to see the full breakdown.
              </p>

              {/* Dimensions table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 pr-3 text-foreground font-semibold">
                        Dimension
                      </th>
                      <th className="text-center py-2 px-3 text-foreground font-semibold w-20">
                        Weight
                      </th>
                      <th className="text-left py-2 pl-3 text-foreground font-semibold">
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {DIMENSIONS.map((d) => (
                      <tr key={d.name} className="border-b border-border/50">
                        <td className="py-2 pr-3 font-medium text-foreground whitespace-nowrap">
                          {d.name}
                        </td>
                        <td className="py-2 px-3 text-center text-primary font-mono">{d.weight}</td>
                        <td className="py-2 pl-3 text-muted-foreground">{d.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Tier thresholds */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">Trust Tiers</h3>
                <div className="flex flex-wrap gap-3">
                  {TIERS.map((t) => (
                    <div
                      key={t.name}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/30 border border-border/50"
                    >
                      <span className={clsx('font-semibold text-sm', t.color)}>{t.name}</span>
                      <span className="text-xs text-muted-foreground font-mono">{t.range}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weight redistribution note */}
              <p className="text-xs text-muted-foreground/70">
                Not all dimensions apply to every resource type. When a dimension does not apply
                (e.g., Cryptographic Simulation for a leader profile), its weight is redistributed
                proportionally among the remaining applicable dimensions so the total always sums to
                100%.
              </p>

              {/* Transparency note */}
              <p className="text-xs text-muted-foreground/70">
                All trust scores are computed client-side from open data. The methodology and source
                code are fully open. The peer review dimension is populated through community
                vetting via GitHub Discussions.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
