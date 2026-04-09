// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useEmbed } from './EmbedProvider'
import { matchesAllowedRoute, getFirstAllowedRoute } from './routePresets'

export function EmbedRouteGuard({ children }: { children: React.ReactNode }) {
  const { allowedRoutes } = useEmbed()
  const location = useLocation()

  // useLocation returns the full pathname including the /embed prefix.
  // Strip it before checking against allowedRoutes (which use bare paths like /learn).
  const strippedPath = location.pathname.replace(/^\/embed/, '') || '/'

  if (!matchesAllowedRoute(strippedPath, allowedRoutes)) {
    const fallbackPath = getFirstAllowedRoute(allowedRoutes)
    return <Navigate to={fallbackPath} replace />
  }

  return <>{children}</>
}
