// SPDX-License-Identifier: AGPL-3.0-only
import { Link, Outlet, useLocation } from 'react-router'
import { playgroundCatalogReturn } from '@/hooks/usePlaygroundCatalogState'
import { PlaygroundProvider } from './PlaygroundProvider'

/**
 * Persistent context boundary for all /playground/* routes.
 * PlaygroundProvider stays mounted across sub-route transitions so WASM
 * modules and the key store survive navigation between tools.
 */
export function PlaygroundShell() {
  const location = useLocation()
  const catalogReturn =
    location.pathname === '/playground/cacp' ? playgroundCatalogReturn(location.state) : null
  return (
    <PlaygroundProvider>
      {catalogReturn && (
        <Link
          to={catalogReturn.to}
          state={catalogReturn.state}
          replace
          className="mb-3 inline-flex min-h-11 items-center text-sm text-primary underline"
        >
          Back to tool results
        </Link>
      )}
      <Outlet />
    </PlaygroundProvider>
  )
}
