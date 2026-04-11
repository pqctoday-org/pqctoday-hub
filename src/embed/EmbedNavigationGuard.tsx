// SPDX-License-Identifier: GPL-3.0-only

/**
 * EmbedNavigationGuard — escape-prevention safety net.
 *
 * Sits inside <BrowserRouter> and monitors every location change.
 * If the app is in embedded mode and the current pathname ever exits the
 * /embed/* scope (e.g. a component calls navigate('/') internally),
 * this guard immediately redirects back to the first allowed embed route.
 *
 * This is intentionally a last-resort guard. The primary defences are:
 *  - EmbedRouteGuard:  blocks unauthorised routes within /embed/*
 *  - Embed-safe links: components check useIsEmbedded() before navigating
 */

import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useEmbedState } from './EmbedProvider'
import { getFirstAllowedRoute } from './routePresets'

export function EmbedNavigationGuard() {
  const location = useLocation()
  const navigate = useNavigate()
  const embedState = useEmbedState()

  useEffect(() => {
    if (!embedState.isEmbedded) return
    if (location.pathname.startsWith('/embed')) return

    // Escaped — redirect to the first allowed embed route, preserving search params
    const firstPath = getFirstAllowedRoute(embedState.allowedRoutes)
    const target = firstPath === '/' ? '/embed' : `/embed${firstPath}`
    navigate(`${target}${location.search}`, { replace: true })
  }, [location.pathname, embedState, navigate])

  return null
}
