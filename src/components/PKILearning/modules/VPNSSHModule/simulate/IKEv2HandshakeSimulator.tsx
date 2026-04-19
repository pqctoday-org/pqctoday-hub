// SPDX-License-Identifier: GPL-3.0-only
import React, { Suspense } from 'react'
import type { IKEv2Mode } from '../data/ikev2Constants'

// Lazy-load Playground components to keep WASM/liboqs out of the learn module's
// static chunk — prevents vite-plugin-top-level-await from wrapping parseGlossary
// exports in its __tla promise, which caused "u is not a function" in production.
const VpnSimulationPanel = React.lazy(() =>
  import('@/components/Playground/hsm/VpnSimulationPanel').then((m) => ({
    default: m.VpnSimulationPanel,
  }))
)
const PlaygroundProvider = React.lazy(() =>
  import('@/components/Playground/PlaygroundProvider').then((m) => ({
    default: m.PlaygroundProvider,
  }))
)

interface IKEv2HandshakeSimulatorProps {
  initialMode?: IKEv2Mode
}

export const IKEv2HandshakeSimulator: React.FC<IKEv2HandshakeSimulatorProps> = ({
  initialMode,
}) => {
  return (
    <Suspense
      fallback={<div className="text-muted-foreground text-sm p-4">Loading simulator…</div>}
    >
      <PlaygroundProvider>
        <VpnSimulationPanel initialMode={initialMode} />
      </PlaygroundProvider>
    </Suspense>
  )
}
