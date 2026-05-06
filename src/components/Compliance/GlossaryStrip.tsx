// SPDX-License-Identifier: GPL-3.0-only
/**
 * GlossaryStrip — always-visible four-chip legend that defines the four
 * primary kinds of artefact on the Compliance page (Body / Standard /
 * Certification / Regulation).
 *
 * Replaces the disclosure-style glossary that was hidden inside the
 * Certification Schemes tab. The colour codes match `LandscapeTypeFacet`,
 * so the facet is also a legend.
 */

interface ChipProps {
  name: string
  swatch: string
  def: string
}

function Chip({ name, swatch, def }: ChipProps) {
  return (
    <div className="p-2.5 rounded-lg border border-border bg-card">
      <div className="flex items-center gap-1.5">
        <span
          aria-hidden="true"
          className="inline-block w-2 h-2 rounded-full"
          style={{ background: swatch }}
        />
        <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-foreground">
          {name}
        </span>
      </div>
      <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{def}</p>
    </div>
  )
}

/**
 * Colours are hard-coded (not Tailwind tokens) so they can be referenced
 * verbatim from the type-facet swatch. If your design tokens change, edit
 * both this file and `LandscapeTypeFacet.tsx`.
 */
export const TYPE_COLOURS = {
  bodies: '#c79bff',
  standards: '#7aa2ff',
  certifications: '#5fd49a',
  regulations: '#f3b760',
} as const

export function GlossaryStrip() {
  return (
    <div
      role="region"
      aria-label="Compliance glossary"
      className="grid grid-cols-2 md:grid-cols-4 gap-2"
    >
      <Chip
        name="Body"
        swatch={TYPE_COLOURS.bodies}
        def="Defines algorithms & protocols. NIST, IETF, ETSI, ISO/IEC."
      />
      <Chip
        name="Standard"
        swatch={TYPE_COLOURS.standards}
        def="A published specification. FIPS 203, RFC 9180, NIST IR 8547."
      />
      <Chip
        name="Certification"
        swatch={TYPE_COLOURS.certifications}
        def="A scheme that validates products against a standard. FIPS 140-3, Common Criteria."
      />
      <Chip
        name="Regulation"
        swatch={TYPE_COLOURS.regulations}
        def="A legal or contractual mandate. CNSA 2.0, eIDAS 2.0, CCCS Canada."
      />
    </div>
  )
}
