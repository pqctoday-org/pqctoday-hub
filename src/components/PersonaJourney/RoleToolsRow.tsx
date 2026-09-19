// SPDX-License-Identifier: GPL-3.0-only
/**
 * Round 9, wave 1.3 (2026-09-19) — "Tools for this role", under the board's
 * track strip: every playground and business tool the role can reach, from
 * `src/data/roleTools.ts`. The first six show inline (Start-here picks and the
 * role's business sequence first); the rest sit behind a disclosure so the
 * board stays a board and not a catalogue.
 */
import { useState } from 'react'
import { Link } from 'react-router'
import { Wrench, Briefcase } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toolsForRole } from '@/data/roleTools'
import type { PersonaId } from '@/data/personaIds'

const INLINE = 6

interface RoleToolsRowProps {
  personaId: PersonaId
}

export function RoleToolsRow({ personaId }: RoleToolsRowProps) {
  const [open, setOpen] = useState(false)
  const { playground, business } = toolsForRole(personaId)
  const all = [
    ...playground.map((t) => ({
      key: `pg-${t.id}`,
      to: `/playground/${t.id}`,
      name: t.name,
      kind: 'Playground',
    })),
    ...business.map((t) => ({
      key: `bt-${t.id}`,
      to: `/business/tools/${t.id}`,
      name: t.name,
      kind: 'Command Center',
    })),
  ]
  if (all.length === 0) return null
  const shown = open ? all : all.slice(0, INLINE)
  const hidden = all.length - INLINE
  return (
    <section
      aria-labelledby="role-tools-title"
      data-testid="role-tools-row"
      className="mt-8 border-t border-border pt-6"
    >
      <h2
        id="role-tools-title"
        className="text-xs font-bold uppercase tracking-wide text-muted-foreground"
      >
        Tools for this role
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        {playground.length} Playground {playground.length === 1 ? 'tool' : 'tools'} and{' '}
        {business.length} Command Center {business.length === 1 ? 'tool' : 'tools'} name this role.
      </p>
      <ul className="mt-3 flex flex-wrap gap-2" aria-label="Tools for this role">
        {shown.map((t) => (
          <li key={t.key}>
            <Link
              to={t.to}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/30 px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              {t.kind === 'Playground' ? (
                <Wrench size={12} aria-hidden="true" />
              ) : (
                <Briefcase size={12} aria-hidden="true" />
              )}
              <span>{t.name}</span>
              <span className="sr-only"> ({t.kind})</span>
            </Link>
          </li>
        ))}
      </ul>
      {hidden > 0 && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="mt-2 h-auto px-2 py-1 text-xs"
        >
          {open ? 'Show fewer' : `Show all ${all.length} tools`}
        </Button>
      )}
    </section>
  )
}
