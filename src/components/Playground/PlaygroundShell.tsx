// SPDX-License-Identifier: GPL-3.0-only
import { Outlet } from 'react-router-dom'
import { PlaygroundProvider } from './PlaygroundProvider'

/**
 * Persistent context boundary for all /playground/* routes.
 * PlaygroundProvider stays mounted across sub-route transitions so WASM
 * modules and the key store survive navigation between tools.
 */
export const PlaygroundShell = () => (
  <PlaygroundProvider>
    <Outlet />
  </PlaygroundProvider>
)
