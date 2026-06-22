// SPDX-License-Identifier: GPL-3.0-only
import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { GraduationCap, Compass, ListChecks } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/common/PageHeader'
import { useIsEmbedded } from '@/embed/EmbedProvider'
import { usePersonaStore } from '@/store/usePersonaStore'
import { PERSONAS, type PersonaId } from '@/data/learningPersonas'
import { usePersonaPathItems } from '../usePersonaPathItems'
import { WhereToStartTree } from '../WhereToStartTree'
import { MyPathView } from './MyPathView'
import { BrowseAllView } from './BrowseAllView'
import {
  PERSONA_ORDER,
  personaIcon,
  TOTAL_MODULE_COUNT,
  TRACK_COUNT,
} from './learnRedesign.helpers'

type Mode = 'path' | 'browse'

/**
 * Redesigned /learn surface. Two modes anchored by a persistent persona lens:
 *  - My Path   → "what should I do next?" (persona journey, reused spine)
 *  - Browse all → "where's that one module?" (full catalog + Advanced tray)
 *
 * Everything is computed from the persona path + the module manifest. Replaces
 * the old five-mode Dashboard (kept at /learn/legacy).
 */
export const LearnRedesignView = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const deepLinkNice = searchParams.get('view') === 'nice'

  const isEmbed = useIsEmbedded()

  const selectedPersona = usePersonaStore((s) => s.selectedPersona)
  const setPersona = usePersonaStore((s) => s.setPersona)

  // First open defaults to "My Path" — the page's headline ("one guided path …
  // tuned to your role"). With no role yet, My Path shows the cold-start prompt to
  // pick a role; landing on the dense Browse catalog instead read as "off". Only
  // the ?view=nice deep-link opens straight into Browse (the workforce lens).
  const [mode, setMode] = useState<Mode>(() => (deepLinkNice ? 'browse' : 'path'))
  const [showRouter, setShowRouter] = useState(false)

  const pathSummary = usePersonaPathItems(selectedPersona)

  const metaLine = useMemo(() => {
    if (mode === 'path' && selectedPersona && pathSummary) {
      const hours = Math.max(1, Math.round(pathSummary.estimatedMinutes / 60))
      return `${PERSONAS[selectedPersona].label} · ${pathSummary.moduleCount} modules · ~${hours}h`
    }
    return `${TOTAL_MODULE_COUNT} modules · ${TRACK_COUNT} tracks`
  }, [mode, selectedPersona, pathSummary])

  return (
    <div className="space-y-4">
      {/* Header — shared PageHeader, identical to /compliance and every other
          data page (centered icon + title + description + one action cluster).
          The always-available Quiz entry rides in that cluster via `actions`
          rather than floating in a bespoke row. Suppressed when embedded. */}
      {!isEmbed && (
        <PageHeader
          icon={GraduationCap}
          pageId="learn"
          title="Learn"
          description="One guided path through post-quantum cryptography — tuned to your role."
          dataSource={`${TOTAL_MODULE_COUNT} modules · ${TRACK_COUNT} tracks`}
          testId="learn-page-header"
          actions={
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/learn/quiz')}
              className="gap-1.5"
            >
              <ListChecks size={14} aria-hidden="true" />
              Quiz
            </Button>
          }
        />
      )}

      {/* Persona lens */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Viewing as
        </span>
        {PERSONA_ORDER.map((id) => {
          const Icon = personaIcon(id)
          const active = selectedPersona === id
          return (
            <Button
              key={id}
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => {
                setPersona(id)
                setShowRouter(false)
                setMode('path')
              }}
              aria-pressed={active}
              className={`h-auto inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                active
                  ? 'border-primary/50 text-primary bg-primary/10'
                  : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon size={13} aria-hidden="true" />
              {PERSONAS[id].label}
            </Button>
          )
        })}
        <span className="w-px h-5 bg-border" aria-hidden="true" />
        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={() => setShowRouter((v) => !v)}
          aria-pressed={showRouter}
          className="h-auto inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-accent/30 text-accent bg-accent/5 hover:bg-accent/10 transition-colors"
        >
          <Compass size={13} aria-hidden="true" />
          Not sure? Guided routing
        </Button>
      </div>

      {/* Guided routing tree (cold-start helper) */}
      {showRouter && <WhereToStartTree defaultOpen />}

      {/* Mode toggle */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="inline-flex items-center bg-muted/30 border border-border rounded-xl p-1">
          <Button
            variant="ghost"
            size="sm"
            aria-pressed={mode === 'path'}
            onClick={() => setMode('path')}
            className={`text-xs rounded-lg ${
              mode === 'path'
                ? 'bg-gradient-to-br from-primary to-accent text-background font-bold'
                : 'text-muted-foreground'
            }`}
          >
            My Path
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-pressed={mode === 'browse'}
            onClick={() => setMode('browse')}
            className={`text-xs rounded-lg ${
              mode === 'browse'
                ? 'bg-gradient-to-br from-primary to-accent text-background font-bold'
                : 'text-muted-foreground'
            }`}
          >
            Browse all {TOTAL_MODULE_COUNT}
          </Button>
        </div>
        <span className="text-xs text-muted-foreground">{metaLine}</span>
      </div>

      {/* Body */}
      {mode === 'path' ? (
        selectedPersona ? (
          <MyPathView
            personaId={selectedPersona as PersonaId}
            onOpenCatalog={() => setMode('browse')}
          />
        ) : (
          <div className="space-y-3">
            <div className="glass-panel flex flex-wrap items-center justify-center gap-x-2.5 gap-y-2 rounded-xl px-4 py-3 text-center">
              <span className="text-sm text-muted-foreground">
                Pick a role above for a guided path — or
              </span>
              <Button variant="outline" size="sm" onClick={() => setMode('browse')}>
                Browse all {TOTAL_MODULE_COUNT} modules
              </Button>
            </div>
            <WhereToStartTree defaultOpen />
          </div>
        )
      ) : (
        <BrowseAllView personaId={selectedPersona} initialNiceMode={deepLinkNice} />
      )}
    </div>
  )
}
