// SPDX-License-Identifier: GPL-3.0-only
//
// Glossary widget that surfaces NIST CSWP 39's primary crypto-agility definition
// alongside the alternative definitions catalogued in Appendix B (p.41). Mounted
// once on the Command Center landing so users encountering the term in-app can
// quickly see how the wider literature frames it. Uses semantic <details> /
// <summary> so the accordion works without JS.
import { ChevronDown, BookOpen, ExternalLink } from 'lucide-react'
import { CSWP39_PRIMARY_DEFINITION, CSWP39_APPENDIX_B_DEFINITIONS } from '@/data/cswp39AppendixB'

function ExternalSourceLink({ url, label }: { url: string; label: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
    >
      {label}
      <ExternalLink size={10} aria-hidden />
    </a>
  )
}

export function CryptoAgilityDefinitions() {
  return (
    <details className="glass-panel group [&[open]>summary>svg.chev]:rotate-180">
      <summary className="flex items-start gap-3 p-4 cursor-pointer list-none select-none">
        <BookOpen size={18} className="text-primary shrink-0 mt-0.5" aria-hidden />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-foreground">
            How does NIST CSWP 39 define crypto agility? How do other frameworks define it?
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Primary-source definitions from NIST CSWP 39 and the alternative frameworks it cites in
            Appendix B (FS-ISAC, ATIS, ETSI, CARAF, and a 2016 NIST workshop).
          </p>
        </div>
        <ChevronDown
          size={18}
          className="chev text-muted-foreground shrink-0 mt-0.5 transition-transform"
          aria-hidden
        />
      </summary>

      <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
        {/* Primary NIST CSWP 39 definition - highlighted */}
        <section
          className="rounded-md border border-primary/40 bg-primary/5 p-3 space-y-1.5"
          aria-label="Primary definition from NIST CSWP 39"
        >
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-primary">
              Primary: {CSWP39_PRIMARY_DEFINITION.source}
            </div>
            {CSWP39_PRIMARY_DEFINITION.url && (
              <ExternalSourceLink url={CSWP39_PRIMARY_DEFINITION.url} label="View source" />
            )}
          </div>
          <p className="text-sm text-foreground leading-relaxed">
            {CSWP39_PRIMARY_DEFINITION.definition}
          </p>
          <p className="text-[11px] text-muted-foreground">{CSWP39_PRIMARY_DEFINITION.citation}</p>
        </section>

        {/* Alternative definitions */}
        <section className="space-y-3" aria-label="Alternative definitions from other literature">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Alternative definitions (CSWP 39 Appendix B)
          </div>
          <ul className="space-y-3">
            {CSWP39_APPENDIX_B_DEFINITIONS.map((entry) => (
              <li
                key={entry.source}
                className="rounded-md border border-border bg-muted/40 p-3 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="text-xs font-semibold text-foreground">{entry.source}</div>
                  {entry.url && <ExternalSourceLink url={entry.url} label="View source" />}
                </div>
                <p className="text-sm text-foreground leading-relaxed">{entry.definition}</p>
                <p className="text-[11px] text-muted-foreground">{entry.citation}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </details>
  )
}
