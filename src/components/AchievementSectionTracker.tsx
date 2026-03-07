// SPDX-License-Identifier: GPL-3.0-only
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAchievementStore } from '@/store/useAchievementStore'

const SECTION_MAP: Record<string, string> = {
  '/timeline': 'timeline',
  '/algorithms': 'algorithms',
  '/playground': 'playground',
  '/openssl': 'openssl',
  '/threats': 'threats',
  '/library': 'library',
  '/leaders': 'leaders',
  '/compliance': 'compliance',
  '/migrate': 'migrate',
  '/assess': 'assess',
  '/report': 'report',
}

export function AchievementSectionTracker() {
  const { pathname } = useLocation()
  const recordSectionVisit = useAchievementStore((s) => s.recordSectionVisit)

  useEffect(() => {
    const section = SECTION_MAP[pathname] ?? (pathname.startsWith('/learn') ? 'learn' : null)
    if (section) {
      recordSectionVisit(section)
    }
  }, [pathname, recordSectionVisit])

  return null
}
