// SPDX-License-Identifier: AGPL-3.0-only
import { Link, useNavigate } from 'react-router'
import { Compass, Unlock, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePersonaStore } from '@/store/usePersonaStore'
import { logExploreTileClick, logExploreUnlock } from '@/utils/analytics'
import { PERSONA_RECOMMENDED_PATHS } from '@/data/personaConfig'
import { PERSONAS } from '@/data/learningPersonas'
import { TILES, type ExploreTile } from '@/data/exploreTiles'
import { PYTHON_SIGNATURE_EXERCISE_PATH } from '@/data/pythonWorkbench'
import { PersonaPageNote } from '@/components/shared/PersonaPageNote'

export function ExploreView({
  simEmbed = false,
  onLeave,
}: {
  /** Rendered inside the simulation. Every tile is another hub page, so each
   *  one says it leaves the simulation instead of pretending to open in place. */
  simEmbed?: boolean
  /** Called before a tile navigates away (the sim marks where to resume). */
  onLeave?: () => void
} = {}) {
  const navigate = useNavigate()
  const { selectedPersona, experienceLevel, viewAccess, setViewAccess } = usePersonaStore()
  const isCurious = selectedPersona === 'curious' || experienceLevel === 'curious'
  const isGated = isCurious && viewAccess !== 'unlocked'
  const showUnlockPrompt = isGated

  // A tile is "recommended" for the current (non-curious) persona when its path
  // appears in that persona's PERSONA_RECOMMENDED_PATHS — the same config that
  // drives "Recommended" badges elsewhere on the site, so this page can't drift
  // from it the way a hand-maintained per-tile list did.
  const isTileRecommended = (tile: ExploreTile) =>
    selectedPersona != null &&
    selectedPersona !== 'curious' &&
    // eslint-disable-next-line security/detect-object-injection
    PERSONA_RECOMMENDED_PATHS[selectedPersona].includes(tile.path)

  // Surface each viewer's own recommended tiles first (stable sort preserves the
  // authored order within each group). For curious / no-persona users nothing is
  // recommended, so the display order is unchanged.
  const orderedTiles = [...TILES].sort(
    (a, b) => Number(isTileRecommended(b)) - Number(isTileRecommended(a))
  )

  // '/learn' is the one tile whose time is a real figure rather than an
  // estimate: every persona carries `essentialsMinutes` for its own essentials
  // track. Quoting the authored 2 minutes next to a page that opens on a
  // several-hour path would be the kind of small dishonesty that costs a
  // reader's trust in every other number on the page.
  const tileMinutes = (tile: ExploreTile): number =>
    tile.path === '/learn' && selectedPersona
      ? // eslint-disable-next-line security/detect-object-injection -- typed PersonaId union
        PERSONAS[selectedPersona].essentialsMinutes
      : tile.firstLookMinutes
  // UX batch 2 (2026-09-19): the number was already honest; the label was not —
  // "~380 min for a first look" read as absurd because a whole essentials track
  // is not a first look. Name what the figure is.
  const tileMinutesLabel = (tile: ExploreTile): string =>
    tile.path === '/learn' && selectedPersona ? 'for your essentials track' : 'for a first look'

  return (
    <div className="max-w-5xl mx-auto py-4 md:py-8 px-2">
      {/* Header */}
      <div className={`text-center mb-8 md:mb-12 ${simEmbed ? 'hidden' : ''}`}>
        <h1 className="text-xl md:text-4xl font-bold font-display text-heading flex items-center justify-center gap-2 md:gap-3 mb-3 font-display text-heading">
          <Compass className="w-5 h-5 md:w-9 md:h-9 text-primary shrink-0" aria-hidden="true" />
          Explore PQC Today
        </h1>
        <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
          Post-quantum cryptography is changing how the world secures data. Pick a topic to start
          exploring — no background required.
        </p>
      </div>

      {!simEmbed && (
        <>
          <PersonaPageNote route="/explore" className="mb-6 text-left" />
          <nav aria-label="Try a specific task" className="mb-8 flex flex-wrap gap-3">
            {!isGated && (
              <Link
                to={PYTHON_SIGNATURE_EXERCISE_PATH}
                onClick={() => logExploreTileClick(PYTHON_SIGNATURE_EXERCISE_PATH)}
                className="inline-flex min-h-11 items-center rounded-lg border border-border bg-card px-3 text-sm text-primary underline"
              >
                Edit and run a Python signature check
              </Link>
            )}
            <Link
              to="/playground/hybrid-certs"
              onClick={() => logExploreTileClick('/playground/hybrid-certs')}
              className="inline-flex min-h-11 items-center rounded-lg border border-border bg-card px-3 text-sm text-primary underline"
            >
              Compare TLS certificates and key exchange
            </Link>
            <Link
              to="/compliance?tab=requirements"
              onClick={() => logExploreTileClick('/compliance?tab=requirements')}
              className="inline-flex min-h-11 items-center rounded-lg border border-border bg-card px-3 text-sm text-primary underline"
            >
              Look up a requirement and its source
            </Link>
          </nav>
        </>
      )}
      {simEmbed && (
        <p className="mb-4 text-sm text-muted-foreground" data-testid="explore-sim-note">
          Each area below is its own hub page. Opening one leaves the simulation; your run is saved
          and the simulation offers to resume when you come back.
        </p>
      )}

      {/* Tile grid — max-w-5xl prevents stretching on ultrawide */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
        {orderedTiles.map((tile) => {
          const Icon = tile.icon
          const destination = isGated && tile.gatedPath ? tile.gatedPath : tile.path
          const isRecommended = isTileRecommended(tile)
          return (
            <Button
              key={tile.path}
              variant="ghost"
              onClick={() => {
                logExploreTileClick(destination)
                onLeave?.()
                navigate(destination)
              }}
              className={`glass-panel h-auto p-5 flex-col items-start text-left whitespace-normal hover:bg-transparent hover:border-primary/40 group relative ${isRecommended ? 'border-primary/30' : ''}`}
            >
              {isRecommended && (
                <span className="absolute top-2.5 right-2.5 flex items-center gap-1 text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                  <Sparkles size={9} aria-hidden="true" />
                  For you
                </span>
              )}
              <div className={`p-2.5 rounded-lg mb-3 ${tile.accent}`}>
                <Icon size={20} aria-hidden="true" />
              </div>
              <span className="text-base font-semibold text-foreground mb-1.5 group-hover:text-primary transition-colors">
                {tile.title}
              </span>
              <span className="text-sm text-muted-foreground leading-relaxed">
                {tile.description}
              </span>
              <span className="mt-2 text-[11px] font-mono text-muted-foreground/80">
                ~{tileMinutes(tile)} min {tileMinutesLabel(tile)}
              </span>
              {simEmbed && (
                <span className="mt-1 text-[11px] font-mono text-primary">
                  opens the full page · leaves the simulation ↗
                </span>
              )}
            </Button>
          )
        })}
      </div>

      {/* Advanced unlock prompt for curious persona */}
      {showUnlockPrompt && (
        <div className="glass-panel mt-8 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="p-2.5 rounded-lg bg-primary/10 shrink-0">
            <Unlock size={20} className="text-primary" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground mb-0.5">Ready to go deeper?</p>
            <p className="text-xs text-muted-foreground">
              Every page is already open. This shows the controls simplified for you: the full
              algorithm tables, the Playground&apos;s workbench tabs (engine choice, ACVP and
              conformance suites, KMIP developer tools), and no more simplified-view notices.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              logExploreUnlock()
              setViewAccess('unlocked')
            }}
            className="shrink-0"
          >
            Show advanced controls everywhere
          </Button>
        </div>
      )}

      {/* Soft CTA */}
      <div className="mt-8 text-center">
        <p className="text-xs text-muted-foreground">
          Want a personalized experience?{' '}
          <Button
            variant="link"
            className="text-xs text-primary p-0 h-auto"
            onClick={() => navigate('/')}
          >
            Choose your role on the home page →
          </Button>
        </p>
      </div>
    </div>
  )
}
