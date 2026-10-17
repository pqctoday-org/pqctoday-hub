// SPDX-License-Identifier: AGPL-3.0-only

const EVIDENCE_CLASSES = [
  {
    label: 'Algorithm validation',
    detail: 'A named algorithm implementation passed CAVP testing, commonly through ACVP.',
  },
  {
    label: 'Module validation',
    detail: 'A defined cryptographic module and configuration holds a FIPS 140 certificate.',
  },
  {
    label: 'Evaluated claim',
    detail: 'An evaluated-product document names PQC; this is not ACVP or FIPS validation.',
  },
  {
    label: 'No reviewed evidence',
    detail: 'The catalogue has not linked a reviewed record for the claim.',
  },
] as const

export function EvidenceClassLegend({ compact = false }: { compact?: boolean }) {
  return (
    <aside
      className="rounded-xl border border-border bg-muted/20 p-3"
      aria-labelledby="evidence-class-legend-heading"
    >
      <h3
        id="evidence-class-legend-heading"
        className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground"
      >
        What the evidence proves
      </h3>
      <div
        className={`mt-2 grid gap-2 ${compact ? 'grid-cols-1' : 'sm:grid-cols-2 xl:grid-cols-4'}`}
      >
        {EVIDENCE_CLASSES.map((item) => (
          <div key={item.label} className="rounded-lg border border-border bg-card/60 p-2.5">
            <p className="text-xs font-semibold text-foreground">{item.label}</p>
            <p className="mt-0.5 text-[10.5px] leading-relaxed text-muted-foreground">
              {item.detail}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[10.5px] text-muted-foreground">
        None of these records, by itself, proves that a deployed system is configured correctly or
        compliant with an organisation&apos;s obligations.
      </p>
    </aside>
  )
}
