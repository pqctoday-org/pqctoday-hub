// SPDX-License-Identifier: GPL-3.0-only
//
// Persistent acronym glossary for the Product Records tab. Replaces the
// hidden "Glossary" toggle — these six terms gate comprehension of the whole
// page, so they stay on-screen. Each chip carries its full definition in a
// title tooltip.
import { RECORDS_GLOSSARY } from '@/data/recordsGlossary'

export function RecordsGlossaryStrip() {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-muted/20 px-3.5 py-2.5">
      <span className="text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">
        Glossary
      </span>
      {RECORDS_GLOSSARY.map((t) => (
        <span
          key={t.term}
          title={t.def}
          className="inline-flex cursor-help items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1 text-[10.5px]"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          <span className="font-semibold text-foreground">{t.term}</span>
          <span className="text-muted-foreground">{t.short}</span>
        </span>
      ))}
    </div>
  )
}
