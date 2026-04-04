// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { VpnSimulationPanel } from '@/components/Playground/hsm/VpnSimulationPanel'
import { PlaygroundProvider } from '@/components/Playground/PlaygroundProvider'
import type { IKEv2Mode } from '../data/ikev2Constants'

interface IKEv2HandshakeSimulatorProps {
  initialMode?: IKEv2Mode
}

export const IKEv2HandshakeSimulator: React.FC<IKEv2HandshakeSimulatorProps> = ({
  initialMode,
}) => {
  return (
    <PlaygroundProvider>
      <VpnSimulationPanel initialMode={initialMode} />
    </PlaygroundProvider>
  )
}
