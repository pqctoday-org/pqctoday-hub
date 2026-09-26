// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection -- keys are manifest module ids */
/**
 * Learn-path hooks (WS-0, 2026-09-24) — the React side of
 * manifest/learnPathScope.ts: which path the learner is on, how to change it,
 * and how module content filters itself by it.
 *
 * Source of truth is the store's per-module `activeLearnPath` (persisted since
 * 2026-07-30). The URL's `?path=` is an input on arrival and an output when the
 * learner picks a path in the LearnPathPicker, so deep links keep working and a
 * picked path is shareable. A bare URL (no `?path=`) does not clear a stored
 * choice — it carries no instruction.
 */
import { createContext, useCallback, useContext, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useModuleStore } from '@/store/useModuleStore'
import { MANIFEST_BY_ID } from '../manifest/registry'
import { filterByLearnPath, resolveLearnPath, validLearnPathId } from '../manifest/learnPathScope'
import type { LearnPath, ModuleManifest, PathScoped } from '../manifest/types'
import { useEmbeddedLearn } from '../embeddedLearnContext'

/**
 * The id of the module being rendered, provided by ModuleShell. Lets module
 * content find its manifest without parsing the URL (which is wrong inside the
 * simulation embed and under /embed/learn/…).
 */
export const LearnModuleContext = createContext<string | undefined>(undefined)

/** Module id from ModuleShell's context, else parsed from `/learn/<id>`. */
export function useLearnModuleId(): string {
  const fromContext = useContext(LearnModuleContext)
  const location = useLocation()
  return fromContext ?? (location.pathname.replace(/^\/learn\/?/, '') || '')
}

/** The learner's active path id for `moduleId`, validated against the
 *  manifest (the given one, else the registry's) — undefined when none is
 *  picked or the stored id is stale. */
export function useActiveLearnPathId(
  moduleId: string,
  manifest?: ModuleManifest
): string | undefined {
  const stored = useModuleStore((s) => s.modules[moduleId]?.activeLearnPath)
  return validLearnPathId(manifest ?? MANIFEST_BY_ID[moduleId], stored)
}

/**
 * Filters a module-authored list (exercises, scenarios, cards…) to the items
 * on the learner's active path. Untagged items are always kept.
 *
 *   const visible = useLearnPathFilter(SCENARIOS)
 */
export function useLearnPathFilter<T extends PathScoped>(
  items: readonly T[],
  moduleId?: string
): T[] {
  const contextId = useLearnModuleId()
  const pathId = useActiveLearnPathId(moduleId ?? contextId)
  return filterByLearnPath(items, pathId)
}

export interface LearnPathSelection {
  paths: LearnPath[]
  activePath: LearnPath | undefined
  /** pick a path, or pass undefined to clear it (all sections) */
  selectPath: (pathId: string | undefined) => void
}

/**
 * Read and change the active path, keeping `?path=` in sync:
 *  - arriving with a valid `?path=` sets the stored path (as useActiveLearnPath
 *    always did);
 *  - picking or clearing a path rewrites `?path=` with a history REPLACE, so
 *    the back button is not polluted and the URL stays shareable.
 * URL writes are skipped inside the simulation embed, whose URL belongs to the
 * simulation (same rule as useSyncDeepLink).
 */
export function useLearnPathSelection(manifest: ModuleManifest): LearnPathSelection {
  const moduleId = manifest.id
  const paths = manifest.learnPaths ?? []
  const setActiveLearnPath = useModuleStore((s) => s.setActiveLearnPath)
  const activePathId = useActiveLearnPathId(moduleId, manifest)
  const location = useLocation()
  const navigate = useNavigate()
  const isEmbed = useEmbeddedLearn()

  const urlPathId = new URLSearchParams(location.search).get('path') ?? ''
  const hasPaths = paths.length > 0

  // Arrival: a valid ?path= wins over whatever was stored.
  useEffect(() => {
    if (!hasPaths || !urlPathId) return
    if (!validLearnPathId(manifest, urlPathId)) return
    setActiveLearnPath(moduleId, urlPathId)
  }, [hasPaths, manifest, moduleId, urlPathId, setActiveLearnPath])

  const selectPath = useCallback(
    (pathId: string | undefined) => {
      const next = validLearnPathId(manifest, pathId) ?? ''
      setActiveLearnPath(moduleId, next)
      if (isEmbed) return
      // window.location, not the router's location: useSyncDeepLink writes
      // ?tab=/?step= with history.replaceState, which the router never sees.
      const params = new URLSearchParams(window.location.search)
      if (next) params.set('path', next)
      else params.delete('path')
      const search = params.toString()
      navigate(
        { pathname: location.pathname, search: search ? `?${search}` : '', hash: location.hash },
        { replace: true }
      )
    },
    [isEmbed, location.hash, location.pathname, manifest, moduleId, navigate, setActiveLearnPath]
  )

  return { paths, activePath: resolveLearnPath(manifest, activePathId), selectPath }
}
