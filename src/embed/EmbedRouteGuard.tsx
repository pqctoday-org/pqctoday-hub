// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useEmbed } from './EmbedProvider'
import { matchesAllowedRoute, getFirstAllowedRoute } from './routePresets'

export function EmbedRouteGuard({ children }: { children: React.ReactNode }) {
  const { allowedRoutes } = useEmbed()
  const location = useLocation()

  // The router has already stripped the "/embed" prefix by the time we get here,
  // so location.pathname is "/learn" or "/assess" etc.
  if (!matchesAllowedRoute(location.pathname, allowedRoutes)) {
    const fallbackPath = getFirstAllowedRoute(allowedRoutes)
    return <Navigate to={fallbackPath} replace />
  }

  return <>{children}</>
}
