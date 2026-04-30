// SPDX-License-Identifier: GPL-3.0-only
/**
 * Lightweight nav anchors for the four authoritative CSWP.39 document
 * sections (§3 / §4 / §5 / §6). Renders above the strategic plan as a
 * collapsible accordion. Each section card lists its sub-sections and
 * provides quick links to the related Fig 3 zones, so an auditor reading
 * the standard by §-number can find the corresponding artifacts without
 * having to navigate through the 5-step process.
 */
import { useState } from 'react'
import { ChevronDown, ChevronUp, BookOpen, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CSWP39_SECTIONS, CSWP39_SOURCE_METADATA } from '@/components/Compliance/cswp39Data'
import { CSWP39_ZONE_DETAILS, type ZoneId } from '@/data/cswp39ZoneData'

export interface CSWP39SectionsNavProps {
  /** Called when the user clicks a related-zone chip. Should expand that zone. */
  onZoneSelect: (zone: ZoneId) => void
}

export function CSWP39SectionsNav({ onZoneSelect }: CSWP39SectionsNavProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="glass-panel p-0 overflow-hidden">
      <Button
        variant="ghost"
        className="w-full justify-between px-4 py-3 rounded-none"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="cswp39-sections-nav"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <BookOpen size={16} className="text-primary" />
          NIST CSWP.39 — by document section
          <span className="text-[10px] font-normal text-muted-foreground">§3 · §4 · §5 · §6</span>
        </span>
        {open ? (
          <ChevronUp size={16} className="text-muted-foreground" />
        ) : (
          <ChevronDown size={16} className="text-muted-foreground" />
        )}
      </Button>

      {open && (
        <div id="cswp39-sections-nav" className="border-t border-border p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Authoritative section structure of {CSWP39_SOURCE_METADATA.documentLabel} (published{' '}
              {CSWP39_SOURCE_METADATA.publicationDate}). Use these anchors when an auditor cites a
              specific §-number — each links to the related zones in this Command Center.
            </p>
            <a
              href={CSWP39_SOURCE_METADATA.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline inline-flex items-center gap-1 shrink-0"
            >
              Open PDF <ExternalLink size={12} />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {CSWP39_SECTIONS.map((section) => (
              <div
                key={section.id}
                className="rounded-md border border-border p-3 bg-background/40"
              >
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-bold text-primary">{section.ref}</span>
                  <h4 className="text-sm font-semibold text-foreground">{section.title}</h4>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">{section.summary}</p>

                <div className="mt-2 space-y-0.5">
                  {section.subSections.map((sub) => (
                    <div key={sub.ref} className="text-[11px] text-muted-foreground/90">
                      <span className="font-mono text-muted-foreground">{sub.ref}</span> {sub.title}
                    </div>
                  ))}
                </div>

                {section.relatedZoneIds.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-border/50">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                      Related zones
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {section.relatedZoneIds.map((zone) => (
                        <Button
                          key={zone}
                          variant="outline"
                          size="sm"
                          className="h-6 px-2 text-[11px]"
                          onClick={() => onZoneSelect(zone)}
                        >
                          {/* eslint-disable-next-line security/detect-object-injection */}
                          {CSWP39_ZONE_DETAILS[zone].title}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
