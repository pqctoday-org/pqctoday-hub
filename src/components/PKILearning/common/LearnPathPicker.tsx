// SPDX-License-Identifier: GPL-3.0-only
/**
 * In-module learn-path picker (WS-0, 2026-09-24) plus the small labels and
 * wrapper module content uses to express path scope.
 *
 * Until this existed a path could only be chosen by arriving with `?path=`
 * (the Industry Landscape's links), so a learner who opened a multi-path
 * module from the catalogue had no way to scope it. ModuleShell renders the
 * picker for every manifest that declares `learnPaths`; modules without paths
 * render nothing new.
 */
import { useId, type ReactNode } from 'react'
import { Route } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  isInLearnPath,
  requiredLearnSectionIds,
  requiredWorkshopStepIds,
} from '../manifest/learnPathScope'
import type { ModuleManifest, PathScoped } from '../manifest/types'
import { useLearnModuleId, useActiveLearnPathId, useLearnPathSelection } from './useLearnPath'

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

interface LearnPathPickerProps {
  manifest: ModuleManifest
  className?: string
  /** drop the explanatory line — used on the Workshop tab, where the shell
   *  already folds header framing to keep the first control above the fold */
  compact?: boolean
}

export const LearnPathPicker = ({ manifest, className, compact = false }: LearnPathPickerProps) => {
  const headingId = `${useId()}-path-heading`
  const { paths, activePath, selectPath } = useLearnPathSelection(manifest)
  if (paths.length === 0) return null

  const sectionCount = requiredLearnSectionIds(manifest, activePath?.id).length
  const stepCount = requiredWorkshopStepIds(manifest, activePath?.id).length
  const scope = [
    sectionCount > 0 ? plural(sectionCount, 'Learn section') : null,
    stepCount > 0 ? plural(stepCount, 'workshop step') : null,
  ]
    .filter(Boolean)
    .join(' and ')

  const option = (active: boolean) =>
    cn(
      'h-auto min-h-[44px] whitespace-normal px-3 py-2 text-left text-sm',
      active
        ? 'border-primary bg-primary/10 text-primary hover:bg-primary/15'
        : 'border-border text-foreground'
    )

  return (
    <section
      aria-labelledby={headingId}
      className={cn('glass-panel p-4', className)}
      data-testid="learn-path-picker"
    >
      <h2 id={headingId} className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Route size={16} className="shrink-0 text-primary" aria-hidden="true" />
        Choose your learning path
      </h2>
      <div role="group" aria-labelledby={headingId} className="mt-3 flex flex-wrap gap-2">
        {paths.map((p) => {
          const active = activePath?.id === p.id
          return (
            <Button
              key={p.id}
              type="button"
              variant="outline"
              aria-pressed={active}
              onClick={() => selectPath(p.id)}
              className={option(active)}
            >
              <span className="font-semibold">{p.label}</span>
              <span className="text-xs text-muted-foreground">· {p.duration}</span>
            </Button>
          )
        })}
        <Button
          type="button"
          variant="outline"
          aria-pressed={!activePath}
          onClick={() => selectPath(undefined)}
          className={option(!activePath)}
        >
          <span className="font-semibold">All sections</span>
        </Button>
      </div>
      <p
        className={cn('mt-2 text-xs text-muted-foreground', compact && 'sr-only')}
        aria-live="polite"
      >
        {activePath ? (
          <>
            {activePath.audience ? (
              <>
                <span className="font-medium text-foreground">For:</span> {activePath.audience}
                .{' '}
              </>
            ) : null}
            This path completes on {scope}. Shared content counts toward every path; optional
            references are never required.
          </>
        ) : (
          <>
            No path selected — every section{stepCount > 0 ? ' and workshop step' : ''} counts
            toward completion. Pick a path to scope the module to one audience.
          </>
        )}
      </p>
    </section>
  )
}

const badge =
  'inline-flex shrink-0 items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide'

/** "Optional reference" label for sections/steps/items marked `optional`. */
export const OptionalReferenceBadge = ({ className }: { className?: string }) => (
  <span className={cn(badge, 'border-border bg-muted text-muted-foreground', className)}>
    Optional reference
    <span className="sr-only"> — not counted toward duration or completion</span>
  </span>
)

/** "Outside the <path> path" label for content not on the active path. */
export const OffPathBadge = ({
  pathLabel,
  className,
}: {
  pathLabel: string
  className?: string
}) => (
  <span className={cn(badge, 'border-border bg-background text-muted-foreground', className)}>
    Outside the {pathLabel} path
  </span>
)

/**
 * Renders `children` only when the tagged content is on the learner's active
 * path (untagged = always). For module content that is not a list — a block
 * inside an exercise or a paragraph inside a shared section.
 *
 *   <PathScopedContent paths={['fips']}>…FIPS-only aside…</PathScopedContent>
 */
export const PathScopedContent = ({
  paths,
  moduleId,
  children,
}: Pick<PathScoped, 'paths'> & { moduleId?: string; children: ReactNode }) => {
  const contextId = useLearnModuleId()
  const pathId = useActiveLearnPathId(moduleId ?? contextId)
  return isInLearnPath({ paths }, pathId) ? <>{children}</> : null
}
