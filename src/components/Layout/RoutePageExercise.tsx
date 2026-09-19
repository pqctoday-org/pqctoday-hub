// SPDX-License-Identifier: GPL-3.0-only
/**
 * Round 9, wave 2 (2026-09-19) — the "Try it" question for the routed PAGES,
 * mounted once in MainLayout after the outlet (modules and tools render their
 * own exercises inside their content). Renders only for routes listed in
 * src/data/pageExercises.ts.
 */
import { useLocation } from 'react-router'
import { PAGE_EXERCISE_ROUTES } from '@/data/pageExercises'
import { ToolExercise } from '@/components/shared/ToolExercise'
import { MobilePageExercise } from '@/components/Mobile/MobilePageExercise'

export function RoutePageExercise({ mobile }: { mobile: boolean }) {
  const { pathname } = useLocation()
  const route = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
  if (!PAGE_EXERCISE_ROUTES.has(route)) return null
  return mobile ? (
    <div className="px-4 pb-4">
      <MobilePageExercise route={route} />
    </div>
  ) : (
    <ToolExercise toolId={route} family="page" className="mt-8" />
  )
}
