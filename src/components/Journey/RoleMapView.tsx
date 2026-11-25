// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Your journey › Role map (UX handoff 6.6, design note section 8). The role's modules, computed from
 * the lessons data file and never stored: the ten most role-specific lessons in the learning order,
 * the rest under "more for this role", and the same lessons by stage and by NICE area, each linking
 * to the Learn filters. Industry and region change emphasis, never hide a branch. Nothing is hidden.
 */
import { useId, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import {
  Chip,
  Eyebrow,
  StatusChip,
  StickerCard,
  StoryButton,
  StoryRow,
  storyButtonVariants,
} from '@/components/storybook'
import { BeltScoreMount } from './mountPoints'
import { RoleSwitchDialog, roleLabel } from './RoleSwitch'
import { usePersonaStore, type Region } from '@/store/usePersonaStore'
import { useIsDone } from '@/hooks/useJourney'
import { allOnPath, rolePathForPersona } from '@/services/journey/rolePaths'
import { resolvePreviewRole } from '@/services/journey/previewRole'
import { startHere } from '@/services/journey/levels'
import { STAGES, type TreeLesson } from '@/services/journey/lessons'
import { NICE_COMPETENCY_AREAS, type NiceProficiencyTier } from '@/data/niceFramework'

const REGION_WORD: Record<Region, string> = {
  americas: 'Americas',
  eu: 'EU',
  mena: 'Middle East and Africa',
  apac: 'Asia-Pacific',
  global: 'Global',
}

const TIER_WORD: Record<NiceProficiencyTier, string> = {
  awareness: 'Awareness',
  practitioner: 'Practitioner',
  expert: 'Expert',
}

function LessonRow({ lesson, here, done }: { lesson: TreeLesson; here: boolean; done: boolean }) {
  return (
    <StoryRow
      as="li"
      tone={here ? 'highlight' : 'default'}
      className="flex flex-wrap items-center justify-between gap-2"
      data-testid="role-map-row"
    >
      <span className="min-w-0 text-sm">
        <Link
          to={`/learn/${lesson.id}`}
          state={{ journeyOrigin: 'journey' }}
          className="font-bold text-primary-legible underline underline-offset-4"
        >
          {lesson.title}
        </Link>{' '}
        <span className="text-muted-foreground">
          · Module · Stage {lesson.stage} · {lesson.durationMin} min
        </span>
      </span>
      <span className="flex items-center gap-2">
        {here ? <Chip>Start here</Chip> : null}
        {done ? <StatusChip status="completed" /> : null}
      </span>
    </StoryRow>
  )
}

export function RoleMapView() {
  const persona = usePersonaStore((s) => s.selectedPersona)
  const level = usePersonaStore((s) => s.experienceLevel)
  const tier = usePersonaStore((s) => s.niceTier)
  const region = usePersonaStore((s) => s.selectedRegion)
  const industry = usePersonaStore((s) => s.selectedIndustry)
  const isDone = useIsDone()
  const [switchOpen, setSwitchOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const moreId = useId()

  const [params, setParams] = useSearchParams()
  // ?role=<persona or work-role id>: look at that role's path without switching the learner's own role.
  const preview = useMemo(() => resolvePreviewRole(params.get('role')), [params])
  const path = useMemo(() => preview?.path ?? rolePathForPersona(persona), [preview, persona])
  const everything = useMemo(() => (path ? allOnPath(path) : []), [path])
  const here = path ? startHere(path.parts, level, isDone) : null

  const byStage = useMemo(
    () =>
      STAGES.map(({ stage, name }) => {
        const inStage = everything.filter((l) => l.stage === stage)
        return {
          stage,
          name,
          total: inStage.length,
          done: inStage.filter((l) => isDone(l.lmId)).length,
        }
      }).filter((s) => s.total > 0),
    [everything, isDone]
  )
  const byArea = useMemo(() => {
    const areas = new Map<string, { id: string; title: string; total: number; done: number }>()
    for (const l of everything) {
      for (const id of l.niceCompetencyAreas) {
        const area = areas.get(id) ?? {
          id,
          title: NICE_COMPETENCY_AREAS[id].title,
          total: 0,
          done: 0,
        }
        area.total += 1
        if (isDone(l.lmId)) area.done += 1
        areas.set(id, area)
      }
    }
    return [...areas.values()].sort((a, b) => b.total - a.total || a.title.localeCompare(b.title))
  }, [everything, isDone])

  const shownDone = path ? path.parts.filter((l) => isDone(l.lmId)).length : 0

  return (
    <div className="space-y-5" data-testid="role-map">
      <BeltScoreMount />
      {preview ? (
        <div
          role="status"
          data-testid="role-preview"
          className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border-2 border-ink bg-highlight px-4 py-3 text-heading"
        >
          <p className="text-sm font-bold">
            Viewing the path for {preview.label}.{' '}
            <span className="font-normal">This does not change your own role.</span>
          </p>
          <StoryButton
            variant="secondary"
            onClick={() =>
              setParams(
                (p) => {
                  const next = new URLSearchParams(p)
                  next.delete('role')
                  return next
                },
                { replace: true }
              )
            }
          >
            {persona ? `Back to my role (${roleLabel(persona)})` : 'Back to Your journey'}
          </StoryButton>
        </div>
      ) : null}
      <StickerCard as="section" aria-label="Role summary" className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
            <div>
              <dt className="font-bold text-heading">Role</dt>
              <dd>{persona ? roleLabel(persona) : 'Not chosen'}</dd>
            </div>
            <div>
              <dt className="font-bold text-heading">Industry</dt>
              <dd>{industry ?? 'Not set'}</dd>
            </div>
            <div>
              <dt className="font-bold text-heading">Region</dt>
              <dd>{region ? REGION_WORD[region] : 'Not set'}</dd>
            </div>
            <div>
              <dt className="font-bold text-heading">Level</dt>
              <dd>{persona ? TIER_WORD[tier] : 'Not set'}</dd>
            </div>
          </dl>
          <StoryButton variant="secondary" onClick={() => setSwitchOpen(true)}>
            {persona ? 'Change role' : 'Choose a role'}
          </StoryButton>
        </div>
        <p className="text-sm text-muted-foreground">
          Everything mapped to your role. Industry and region change emphasis, never hide a branch.
        </p>
      </StickerCard>

      {!path ? (
        <StickerCard as="section" aria-label="No role chosen">
          <p className="text-sm">
            Choose a role to see its path. Nothing is hidden without one: every module is in All
            modules.
          </p>
        </StickerCard>
      ) : (
        <>
          <section aria-label="Your path" className="space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <Eyebrow>
                {path.kind === 'common-ground'
                  ? 'The common-ground lessons'
                  : preview
                    ? `Path for ${preview.label}`
                    : 'Your path'}{' '}
                · {shownDone} of {path.parts.length} done
              </Eyebrow>
              {path.lengthStatement ? (
                <span className="text-sm font-bold text-heading" data-testid="path-length">
                  {path.lengthStatement}
                </span>
              ) : null}
            </div>
            {here ? (
              <p className="text-sm">
                Start here:{' '}
                <Link
                  to={`/learn/${here.id}`}
                  state={{ journeyOrigin: 'journey' }}
                  className="font-bold text-primary-legible underline underline-offset-4"
                >
                  {here.title}
                </Link>
                {level ? ` (stage ${here.stage}, from your level)` : ''}
              </p>
            ) : (
              <p className="text-sm">Every module on this path is done.</p>
            )}
            <ol className="space-y-2">
              {path.parts.map((l) => (
                <LessonRow
                  key={l.lmId}
                  lesson={l}
                  here={l.lmId === here?.lmId}
                  done={isDone(l.lmId)}
                />
              ))}
              {path.outside.map((o) => (
                <StoryRow as="li" key={o.id} className="text-sm">
                  <Link
                    to={o.to}
                    className="font-bold text-primary-legible underline underline-offset-4"
                  >
                    {o.title}
                  </Link>{' '}
                  <span className="text-muted-foreground">
                    · Practice quiz, outside the learning order
                  </span>
                </StoryRow>
              ))}
            </ol>

            {path.more.length > 0 ? (
              <div>
                <StoryButton
                  variant="secondary"
                  aria-expanded={moreOpen}
                  aria-controls={moreId}
                  onClick={() => setMoreOpen((v) => !v)}
                >
                  {moreOpen ? 'Hide' : 'Show'} more for this role ({path.more.length})
                </StoryButton>
                {moreOpen ? (
                  <ol id={moreId} className="mt-3 space-y-2" aria-label="More for this role">
                    {path.more.map((l) => (
                      <LessonRow key={l.lmId} lesson={l} here={false} done={isDone(l.lmId)} />
                    ))}
                  </ol>
                ) : null}
              </div>
            ) : null}
          </section>

          <section aria-label="Your path by stage" className="space-y-2">
            <Eyebrow>By stage</Eyebrow>
            <ul className="flex flex-wrap gap-2">
              {byStage.map((s) => (
                <li key={s.stage}>
                  <Link
                    to={`/learn?stage=${s.stage}`}
                    className={storyButtonVariants({ variant: 'secondary' })}
                    aria-label={`Stage ${s.stage}, ${s.name}: ${s.done} of ${s.total} of your modules done. Open the stage in All modules`}
                  >
                    Stage {s.stage} · {s.name} · {s.done}/{s.total}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section aria-label="Your path by NICE area" className="space-y-2">
            <Eyebrow>By NICE area</Eyebrow>
            <ul className="flex flex-wrap gap-2">
              {byArea.map((a) => (
                <li key={a.id}>
                  <Link
                    to={`/learn?area=${a.id}`}
                    className={storyButtonVariants({ variant: 'secondary' })}
                    aria-label={`${a.title}: ${a.done} of ${a.total} of your modules done. Open the area in All modules`}
                  >
                    {a.title} · {a.done}/{a.total}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      <RoleSwitchDialog open={switchOpen} onClose={() => setSwitchOpen(false)} />
    </div>
  )
}
