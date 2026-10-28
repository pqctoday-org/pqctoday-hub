// SPDX-License-Identifier: AGPL-3.0-only

import { MIGRATION_EDUCATION } from '@/data/migrationEducation'

export function MigrationEducationScope({ compact = false }: { compact?: boolean }) {
  return (
    <aside className="rounded-xl border border-primary/25 bg-primary/5 p-3 text-xs leading-relaxed text-muted-foreground">
      <p className="font-semibold text-foreground">{MIGRATION_EDUCATION.heading}</p>
      <p className={compact ? 'mt-1' : 'mt-1.5'}>{MIGRATION_EDUCATION.boundary}</p>
      {!compact && (
        <p className="mt-1.5">
          <a
            className="text-primary underline underline-offset-2"
            href={MIGRATION_EDUCATION.nistUrl}
            target="_blank"
            rel="noreferrer"
          >
            NIST IR 8547
          </a>{' '}
          is NIST&apos;s final transition guidance (October 2026).{' '}
          <a
            className="text-primary underline underline-offset-2"
            href={MIGRATION_EDUCATION.cnsaUrl}
            target="_blank"
            rel="noreferrer"
          >
            CNSA 2.0 FAQ v2.2
          </a>{' '}
          applies primarily to National Security Systems and gives programme milestones for 2027,
          2030 and 2031—not a separate deadline for each asset shown here.
        </p>
      )}
    </aside>
  )
}
