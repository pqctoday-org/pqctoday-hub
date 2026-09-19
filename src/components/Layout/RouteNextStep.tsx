// SPDX-License-Identifier: GPL-3.0-only
/**
 * Round 9, wave 1.2 (2026-09-19) — the declared exit for the routed PAGES,
 * mounted once in MainLayout after the outlet. Modules, playground tools and
 * business tools render their own NextStepCard inside their content flow, so
 * this renders only for routes listed in PAGE_NEXT_STEP_ROUTES and nothing
 * for everything else (no double card on a tool, nothing on a 404).
 */
import { useLocation } from 'react-router'
import { PAGE_NEXT_STEP_ROUTES } from '@/data/nextSteps'
import { NextStepCard } from '@/components/shared/NextStepCard'
import { MobileNextStepCard } from '@/components/Mobile/MobileNextStepCard'

export function RouteNextStep({ mobile }: { mobile: boolean }) {
  const { pathname } = useLocation()
  const route = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
  if (!PAGE_NEXT_STEP_ROUTES.has(route)) return null
  return mobile ? (
    <div className="px-4 pb-4">
      <MobileNextStepCard route={route} />
    </div>
  ) : (
    <NextStepCard route={route} className="mt-8" />
  )
}
