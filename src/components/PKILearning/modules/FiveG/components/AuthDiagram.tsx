// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { Server, Smartphone, Network } from 'lucide-react'

const ACTIVITY = [
  'Load independent sample credentials',
  'Generate RAND and select network SQN',
  'Home-network MILENAGE computation',
  'Construct sender AUTN',
  'Derive KAUSF, XRES* and HXRES*',
  'UE independently checks MAC, AMF and next SQN',
  'SEAF compares HRES* with HXRES*',
  'AUSF compares RES* with pending XRES*',
]
export const AuthDiagram: React.FC<{ step: number }> = ({ step }) => (
  <div
    className="w-full rounded-lg border border-border bg-card/40 p-3 space-y-3"
    aria-label="Local authentication sample roles"
  >
    <p className="text-xs font-semibold">
      Activity: {ACTIVITY.at(step) ?? 'Unknown sample activity'}
    </p>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center text-xs">
      <div
        className={`rounded-lg border p-3 ${step <= 4 || step === 7 ? 'border-primary bg-primary/10' : 'border-border'}`}
      >
        <Server size={20} className="mx-auto mb-1" />
        <strong>Home network</strong>
        <p>UDM / ARPF / AUSF sample</p>
        <p className="mt-1">Own credentials → vector and expected response</p>
      </div>
      <div
        className={`rounded-lg border p-3 ${step === 5 ? 'border-primary bg-primary/10' : 'border-border'}`}
      >
        <Smartphone size={20} className="mx-auto mb-1" />
        <strong>Subscriber / UE</strong>
        <p>Independent credential copy</p>
        <p className="mt-1">Received RAND + AUTN → checked response</p>
      </div>
      <div
        className={`rounded-lg border p-3 ${step === 6 ? 'border-primary bg-primary/10' : 'border-border'}`}
      >
        <Network size={20} className="mx-auto mb-1" />
        <strong>Serving network</strong>
        <p>SEAF sample</p>
        <p className="mt-1">Received RES* → hash comparison</p>
      </div>
    </div>
    <p className="text-xs text-muted-foreground">
      These roles are local calculations. No radio, NAS messaging, physical USIM or network
      transport is performed; selecting an activity does not mean its check passed.
    </p>
  </div>
)
