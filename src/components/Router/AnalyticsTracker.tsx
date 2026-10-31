// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect } from 'react'
import { useLocation } from 'react-router'
import { logPageView } from '@/utils/analytics'

/**
 * Sends one page view per page. Keyed on the path only: pages that keep their search text and
 * filters in the address (Library, Compliance, Algorithms, Timeline…) change the query on every
 * keystroke or click, and keying on the whole location counted each of those as another page view.
 */
export function AnalyticsTracker() {
  const { pathname } = useLocation()

  useEffect(() => {
    logPageView(pathname)
  }, [pathname])

  return null
}
