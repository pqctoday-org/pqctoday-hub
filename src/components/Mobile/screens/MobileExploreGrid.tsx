// SPDX-License-Identifier: GPL-3.0-only
import { useNavigate } from 'react-router'
import { Unlock, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePersonaStore } from '@/store/usePersonaStore'
import { logExploreTileClick, logExploreUnlock } from '@/utils/analytics'
import { PERSONA_RECOMMENDED_PATHS } from '@/data/personaConfig'
import { PERSONAS } from '@/data/learningPersonas'
import { TILES, type ExploreTile } from '@/data/exploreTiles'

/**
 * Handoff screen 7 — Explore. Reads the SAME TILES the desktop ExploreView
 * reads (extracted in Phase 2, E-1) and reproduces its three small pieces of
 * derivation logic — recommended-first ordering, and the one real (not
 * estimated) figure: /learn's minutes come from the active persona's
 * essentialsMinutes, exactly as desktop does, not the authored 2-minute
 * placeholder. Not a reuse of ExploreView itself (unlike RoleHomeView) —
 * ExploreView has no hand-authored copy this component would otherwise
 * duplicate (TILES already is the single source for that), and the handoff
 * specifies distinct mobile type sizes (13.5px title / 11.5px body / 10px
 * time) worth honoring precisely rather than inheriting desktop's scale.
 */
export function MobileExploreGrid() {
  const navigate = useNavigate()
  const { selectedPersona, experienceLevel, viewAccess, setViewAccess } = usePersonaStore()
  const isCurious = selectedPersona === 'curious' || experienceLevel === 'curious'
  const isGated = isCurious && viewAccess !== 'unlocked'

  const isTileRecommended = (tile: ExploreTile) =>
    selectedPersona != null &&
    selectedPersona !== 'curious' &&
    // eslint-disable-next-line security/detect-object-injection -- typed PersonaId union
    PERSONA_RECOMMENDED_PATHS[selectedPersona].includes(tile.path)

  const orderedTiles = [...TILES].sort(
    (a, b) => Number(isTileRecommended(b)) - Number(isTileRecommended(a))
  )

  const tileMinutes = (tile: ExploreTile): number =>
    tile.path === '/learn' && selectedPersona
      ? // eslint-disable-next-line security/detect-object-injection -- typed PersonaId union
        PERSONAS[selectedPersona].essentialsMinutes
      : tile.firstLookMinutes

  return (
    <div className="px-4 pb-24 pt-4">
      <div className="mb-5 text-center">
        <h1 className="text-[19px] font-extrabold text-foreground">Explore PQC Today</h1>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
          Pick a topic to start exploring — no background required.
        </p>
      </div>

      <div className="flex flex-col gap-2.5">
        {orderedTiles.map((tile) => {
          const Icon = tile.icon
          const destination = isGated && tile.gatedPath ? tile.gatedPath : tile.path
          const isRecommended = isTileRecommended(tile)
          return (
            <Button
              key={tile.path}
              type="button"
              variant="ghost"
              onClick={() => {
                logExploreTileClick(destination)
                navigate(destination)
              }}
              className={`h-auto flex-col items-start whitespace-normal rounded-xl border p-3.5 text-left ${
                isRecommended ? 'border-primary/40 bg-primary/5' : 'border-border bg-card'
              }`}
            >
              <div className="mb-2 flex w-full items-start justify-between gap-2">
                <div className={`rounded-lg p-2 ${tile.accent}`}>
                  <Icon size={18} aria-hidden="true" />
                </div>
                {/* "For you" and the time estimate share one right-aligned
                    column (stacked, not absolutely positioned) so they can
                    never overlap — an earlier version placed the badge with
                    `absolute right-3 top-3` while the time text sat in this
                    same flex row, and they collided on every recommended
                    tile (found visually inspecting a real WebKit render). */}
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {isRecommended && (
                    <span className="flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold text-primary">
                      <Sparkles size={9} aria-hidden="true" />
                      For you
                    </span>
                  )}
                  <span className="text-[10px] font-mono font-bold text-muted-foreground">
                    ~{tileMinutes(tile)} min
                  </span>
                </div>
              </div>
              <span className="text-[13.5px] font-bold text-foreground">{tile.title}</span>
              <span className="mt-1 text-[11.5px] leading-[1.5] text-muted-foreground">
                {tile.description}
              </span>
            </Button>
          )
        })}
      </div>

      {isGated && (
        <div className="mt-5 flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2.5">
            <div className="shrink-0 rounded-lg bg-primary/10 p-2">
              <Unlock size={18} className="text-primary" aria-hidden="true" />
            </div>
            <p className="text-[12.5px] font-bold text-foreground">Ready to go deeper?</p>
          </div>
          <p className="text-[11.5px] leading-relaxed text-muted-foreground">
            Unlock algorithms, playground tools, and technical documentation when you&apos;re ready
            to explore beyond the basics.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              logExploreUnlock()
              setViewAccess('unlocked')
            }}
            className="h-11 rounded-[10px] border-border text-[12.5px] font-bold text-foreground"
          >
            Unlock Advanced Views
          </Button>
        </div>
      )}

      <div className="mt-6 text-center">
        <p className="text-[11px] text-muted-foreground">
          Want a personalized experience?{' '}
          <Button
            type="button"
            variant="link"
            onClick={() => navigate('/')}
            className="h-auto p-0 text-[11px] font-semibold text-primary"
          >
            Choose your role on the home page →
          </Button>
        </p>
      </div>
    </div>
  )
}
