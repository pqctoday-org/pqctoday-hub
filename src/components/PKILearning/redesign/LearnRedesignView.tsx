// SPDX-License-Identifier: GPL-3.0-only
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { GraduationCap, Compass, ListChecks } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/common/PageHeader'
import { usePageActionsStore } from '@/store/usePageActionsStore'
import { useIsEmbedded } from '@/embed/EmbedProvider'
import { usePersonaStore } from '@/store/usePersonaStore'
import { PERSONAS, type PersonaId } from '@/data/learningPersonas'
import { useIsMobileShell } from '@/hooks/useIsMobileShell'
import { usePersonaPathItems } from '../usePersonaPathItems'
import { WhereToStartTree } from '../WhereToStartTree'
import { MyPathView } from './MyPathView'
import { BrowseAllView } from './BrowseAllView'
import { PERSONA_ORDER, TOTAL_MODULE_COUNT, TRACK_COUNT } from './learnRedesign.helpers'
import { MobileLearnScreen } from '@/components/Mobile/screens/MobileLearnScreen'

/** 2026-08-02: 'guided' promoted from a separate `showRouter` toggle button
 *  into a real third mode, so the page offers one row of three peers —
 *  My Path / Browse all / Guided routing — instead of a mode pair plus a
 *  floating toggle that rendered the same tree above them. */
type Mode = 'path' | 'browse' | 'guided'

/**
 * Redesigned /learn surface. Two modes anchored by a persistent persona lens:
 *  - My Path   → "what should I do next?" (persona journey, reused spine)
 *  - Browse all → "where's that one module?" (full catalog + Advanced tray)
 *
 * Everything is computed from the persona path + the module manifest. Replaces
 * the old five-mode Dashboard, retired at /learn/legacy (now redirects here).
 */
export const LearnRedesignView = () => {
  const navigate = useNavigate()
  const isMobileShell = useIsMobileShell()
  const [searchParams, setSearchParams] = useSearchParams()
  const deepLinkNice = searchParams.get('view') === 'nice'
  // ?track= presets the Browse catalog filter (restored from the legacy dashboard).
  const deepLinkTrack = searchParams.get('track') ?? undefined

  const isEmbed = useIsEmbedded()

  const selectedPersona = usePersonaStore((s) => s.selectedPersona)
  const setPersona = usePersonaStore((s) => s.setPersona)

  // ?persona= presets the persona lens (restored from the legacy dashboard so
  // chatbot/corpus "learn as <role>" deep-links work again). Applied once.
  const personaHydratedRef = useRef(false)
  useEffect(() => {
    if (personaHydratedRef.current) return
    const p = searchParams.get('persona')
    if (p && (PERSONA_ORDER as readonly string[]).includes(p)) {
      personaHydratedRef.current = true
      setPersona(p as PersonaId)
    }
  }, [searchParams, setPersona])

  // First open defaults to "My Path" — the page's headline ("one guided path …
  // tuned to your role"). With no role yet, My Path shows the cold-start prompt to
  // pick a role; landing on the dense Browse catalog instead read as "off". The
  // ?mode= deep-link (mypath|browse) — and the legacy ?view=nice — open Browse.
  const [mode, setMode] = useState<Mode>(() => {
    const m = searchParams.get('mode')
    if (m === 'browse') return 'browse'
    if (m === 'guided') return 'guided'
    if (m === 'mypath') return 'path'
    return deepLinkNice ? 'browse' : 'path'
  })

  // Toggle mode and reflect it in ?mode= so the active mode is shareable/
  // restorable. Skip the URL write when embedded (don't touch /simulation).
  const selectMode = useCallback(
    (next: Mode) => {
      setMode(next)
      if (isEmbed) return
      setSearchParams(
        (sp) => {
          const params = new URLSearchParams(sp)
          params.set('mode', next === 'path' ? 'mypath' : next)
          return params
        },
        { replace: true }
      )
    },
    [isEmbed, setSearchParams]
  )

  const pathSummary = usePersonaPathItems(selectedPersona)

  const metaLine = useMemo(() => {
    if (mode === 'path' && selectedPersona && pathSummary) {
      const hours = Math.max(1, Math.round(pathSummary.estimatedMinutes / 60))
      return `${PERSONAS[selectedPersona].label} · ${pathSummary.moduleCount} modules · ~${hours}h`
    }
    return `${TOTAL_MODULE_COUNT} modules · ${TRACK_COUNT} tracks`
  }, [mode, selectedPersona, pathSummary])

  // Register this page's actions with the global top bar (page-action-strip
  // rollout, 2026-08-01) — the info/dataSource indicator renders there now,
  // not as a row on the page itself. Mirrors TimelineView.tsx's pattern.
  // Gated on `!isEmbed`, same as the PageHeader render below. The `actions`
  // Quiz button stays on PageHeader itself — it's out of scope for this
  // rollout (only dataSource/onExport/endorse/flag move to the store).
  useEffect(() => {
    if (isEmbed) return
    const { setPageActions, clearPageActions } = usePageActionsStore.getState()
    setPageActions({
      title: 'Learn',
      dataSource: `${TOTAL_MODULE_COUNT} modules · ${TRACK_COUNT} tracks`,
    })
    return () => clearPageActions()
  }, [isEmbed])

  if (isMobileShell) return <MobileLearnScreen />

  return (
    <div className="space-y-4">
      {/* Header — shared PageHeader, identical to /compliance and every other
          data page (centered icon + title + description + one action cluster).
          The always-available Quiz entry rides in that cluster via `actions`
          rather than floating in a bespoke row. Suppressed when embedded. */}
      {!isEmbed && (
        <PageHeader
          icon={GraduationCap}
          title="Learn"
          description="One guided path through post-quantum cryptography — tuned to your role."
          testId="learn-page-header"
          // Quiz sits beside the description rather than in its own row — it is
          // this page's only action, so the row cost a full band of vertical
          // space for one button (2026-08-02).
          actionsInline
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

      {/* Mode toggle — My Path / Browse all / Guided routing.
          The "Viewing as" persona row that used to sit above this was removed
          on 2026-08-02: persona selection already lives in the top bar, so this
          was a second control for the same state on the page most likely to be
          entered with a persona already chosen. Guided routing was NOT part of
          that duplication (it asks where to start, not who you are), so rather
          than being removed with the row it became the third mode here. */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="inline-flex items-center bg-muted/30 border border-border rounded-xl p-1">
          <Button
            variant="ghost"
            size="sm"
            aria-pressed={mode === 'path'}
            onClick={() => selectMode('path')}
            className={`text-xs rounded-lg min-h-[44px] md:min-h-0 ${
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
            onClick={() => selectMode('browse')}
            className={`text-xs rounded-lg min-h-[44px] md:min-h-0 ${
              mode === 'browse'
                ? 'bg-gradient-to-br from-primary to-accent text-background font-bold'
                : 'text-muted-foreground'
            }`}
          >
            Browse all {TOTAL_MODULE_COUNT}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-pressed={mode === 'guided'}
            onClick={() => selectMode('guided')}
            className={`text-xs rounded-lg min-h-[44px] md:min-h-0 inline-flex items-center gap-1.5 ${
              mode === 'guided'
                ? 'bg-gradient-to-br from-primary to-accent text-background font-bold'
                : 'text-muted-foreground'
            }`}
          >
            <Compass size={13} aria-hidden="true" />
            Guided routing
          </Button>
        </div>
        <span className="text-xs text-muted-foreground">{metaLine}</span>
      </div>

      {/* Body */}
      {mode === 'guided' ? (
        <WhereToStartTree defaultOpen />
      ) : mode === 'path' ? (
        selectedPersona ? (
          <MyPathView
            personaId={selectedPersona as PersonaId}
            onOpenCatalog={() => selectMode('browse')}
          />
        ) : (
          <div className="space-y-3">
            <div className="glass-panel flex flex-wrap items-center justify-center gap-x-2.5 gap-y-2 rounded-xl px-4 py-3 text-center">
              {/* "Pick a role above" until 2026-08-02, when the page-local
                  persona row was removed as a duplicate of the top bar's. The
                  role picker is still one click away, just no longer on this
                  page — so name where it actually is. */}
              <span className="text-sm text-muted-foreground">
                Pick a role in the top bar for a guided path — or
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => selectMode('browse')}
                className="min-h-[44px] md:min-h-0"
              >
                Browse all {TOTAL_MODULE_COUNT} modules
              </Button>
            </div>
            <WhereToStartTree defaultOpen />
          </div>
        )
      ) : (
        <BrowseAllView
          personaId={selectedPersona}
          initialNiceMode={deepLinkNice}
          initialTrack={deepLinkTrack}
        />
      )}
    </div>
  )
}
