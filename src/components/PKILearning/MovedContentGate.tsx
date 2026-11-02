// SPDX-License-Identifier: AGPL-3.0-only
import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import {
  resolveMovedContentRedirect,
  resolveReorderedStepRedirect,
} from './manifest/moduleRedirects'

/**
 * Wraps the route of a module that is still live but gave content to another
 * module (see MOVED_CONTENT_REDIRECTS). An old URL that pointed at the moved
 * content is replaced with the new module's URL; any other URL renders the
 * module as usual. It also rewrites an old-order workshop link of a module whose
 * workshop steps were reordered (see REORDERED_WORKSHOP_STEPS).
 */
export const MovedContentGate = ({ from, children }: { from: string; children: ReactNode }) => {
  const { search, hash } = useLocation()
  const to =
    resolveMovedContentRedirect(from, search, hash) ??
    resolveReorderedStepRedirect(from, search, hash)
  return to ? <Navigate to={to} replace /> : <>{children}</>
}
