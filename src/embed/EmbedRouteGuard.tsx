// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useEmbed } from './EmbedProvider'
import { matchesAllowedRoute, getFirstAllowedRoute } from './routePresets'
import { MODULE_CATALOG } from '../components/PKILearning/moduleData'
import { logEmbedRouteBlocked } from '../utils/analytics'

const DIFFICULTY_ORDER: Record<string, number> = { beginner: 0, intermediate: 1, advanced: 2 }

export function EmbedRouteGuard({ children }: { children: React.ReactNode }) {
  const { allowedRoutes, allowedModules, allowedTools, policy } = useEmbed()
  const location = useLocation()

  // useLocation returns the full pathname including the /embed prefix.
  // Strip it before checking against allowedRoutes (which use bare paths like /learn).
  const strippedPath = location.pathname.replace(/^\/embed/, '') || '/'

  // About is a system-level route — exempt unless vendor explicitly hides it
  if (strippedPath === '/about') {
    if (policy.features.hideAbout) {
      const fallbackPath = getFirstAllowedRoute(allowedRoutes)
      const truePath = fallbackPath === '/' ? '/embed' : `/embed${fallbackPath}`
      logEmbedRouteBlocked(strippedPath, 'route')
      return <Navigate to={truePath} replace />
    }
    return <>{children}</>
  }

  // Route-level guard
  if (!matchesAllowedRoute(strippedPath, allowedRoutes)) {
    const fallbackPath = getFirstAllowedRoute(allowedRoutes)
    const truePath = fallbackPath === '/' ? '/embed' : `/embed${fallbackPath}`
    logEmbedRouteBlocked(strippedPath, 'route')
    return <Navigate to={truePath} replace />
  }

  // Module-level guard — /learn/<moduleId>
  if (allowedModules && strippedPath.startsWith('/learn/')) {
    const moduleId = strippedPath.slice('/learn/'.length).split('/')[0]
    if (moduleId && !allowedModules.includes(moduleId)) {
      const fallbackPath = getFirstAllowedRoute(allowedRoutes)
      const truePath = fallbackPath === '/' ? '/embed' : `/embed${fallbackPath}`
      logEmbedRouteBlocked(strippedPath, 'module')
      return <Navigate to={truePath} replace />
    }
  }

  // Difficulty ceiling guard — only applies when modules are not explicitly restricted
  // (explicit module list already filters by exact ID; difficulty ceiling handles the open case)
  if (!allowedModules && policy.content.maxDifficulty && strippedPath.startsWith('/learn/')) {
    const moduleId = strippedPath.slice('/learn/'.length).split('/')[0]
    const moduleMeta = moduleId
      ? MODULE_CATALOG[moduleId as keyof typeof MODULE_CATALOG]
      : undefined
    if (moduleMeta?.difficulty) {
      const ceiling = DIFFICULTY_ORDER[policy.content.maxDifficulty] ?? 2
      const actual = DIFFICULTY_ORDER[moduleMeta.difficulty] ?? 0
      if (actual > ceiling) {
        const fallbackPath = getFirstAllowedRoute(allowedRoutes)
        const truePath = fallbackPath === '/' ? '/embed' : `/embed${fallbackPath}`
        logEmbedRouteBlocked(strippedPath, 'difficulty')
        return <Navigate to={truePath} replace />
      }
    }
  }

  // Tool-level guard — /playground/<toolId> or /business/tools/<toolId>
  if (allowedTools) {
    let toolId: string | undefined
    if (strippedPath.startsWith('/playground/')) {
      toolId = strippedPath.slice('/playground/'.length).split('/')[0]
    } else if (strippedPath.startsWith('/business/tools/')) {
      toolId = strippedPath.slice('/business/tools/'.length).split('/')[0]
    }
    if (toolId && !allowedTools.includes(toolId)) {
      const fallbackPath = getFirstAllowedRoute(allowedRoutes)
      const truePath = fallbackPath === '/' ? '/embed' : `/embed${fallbackPath}`
      logEmbedRouteBlocked(strippedPath, 'tool')
      return <Navigate to={truePath} replace />
    }
  }

  return <>{children}</>
}
