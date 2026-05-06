// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { ArrowRight, ShieldCheck, Server, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const IdentityProxySimulator: React.FC = () => {
  const [proxyEnabled, setProxyEnabled] = useState(false)
  const [simulationState, setSimulationState] = useState<'idle' | 'running' | 'success' | 'failed'>(
    'idle'
  )

  const runSimulation = () => {
    setSimulationState('running')
    setTimeout(() => {
      if (proxyEnabled) {
        setSimulationState('success')
      } else {
        setSimulationState('failed')
      }
    }, 1500)
  }

  return (
    <div className="space-y-6">
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-foreground">Identity Proxy Simulator</h2>
        <p className="text-muted-foreground mt-2">
          Migrating a central Identity Provider (IdP) to PQC can break legacy downstream Service
          Providers (SPs) that do not understand ML-DSA signatures. Use an Identity Proxy to
          translate PQC SAML assertions into Classical RSA assertions for legacy applications.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center bg-muted/20 p-6 rounded-xl border border-border">
        {/* Modern IdP */}
        <div className="flex flex-col items-center gap-4 p-4 glass-panel rounded-lg border-primary/20 bg-primary/5">
          <ShieldCheck size={48} className="text-primary" />
          <h3 className="font-bold">Modern IdP</h3>
          <div className="text-sm text-center">
            <span className="bg-primary/20 text-primary px-2 py-1 rounded text-xs">
              PQC Enabled
            </span>
            <p className="mt-2 text-muted-foreground text-xs">
              Signs SAML with ML-DSA-65 (3.3KB signature)
            </p>
          </div>
        </div>

        {/* Identity Proxy */}
        <div className="flex flex-col items-center gap-4">
          <div
            className={`p-4 rounded-lg border w-full flex flex-col items-center transition-all ${proxyEnabled ? 'border-success bg-success/10' : 'border-dashed border-muted-foreground/50 bg-background'}`}
          >
            <h3 className="font-bold mb-2">Identity Proxy</h3>
            <Button
              variant={proxyEnabled ? 'success' : 'secondary'}
              onClick={() => setProxyEnabled(!proxyEnabled)}
              className="px-4 py-2"
            >
              {proxyEnabled ? 'Proxy Active: Translating' : 'Proxy Disabled: Pass-through'}
            </Button>
            {proxyEnabled && (
              <p className="mt-2 text-xs text-center text-muted-foreground">
                Translating ML-DSA-65 to RSA-2048
              </p>
            )}
          </div>
        </div>

        {/* Legacy SP */}
        <div className="flex flex-col items-center gap-4 p-4 glass-panel rounded-lg border-warning/20 bg-warning/5">
          <Server size={48} className="text-warning" />
          <h3 className="font-bold">Legacy App (SP)</h3>
          <div className="text-sm text-center">
            <span className="bg-warning/20 text-warning-foreground px-2 py-1 rounded text-xs">
              Classical Only
            </span>
            <p className="mt-2 text-muted-foreground text-xs">
              Only understands RSA/SHA-256 signatures
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-center mt-8">
        <Button
          onClick={runSimulation}
          disabled={simulationState === 'running'}
          className="flex items-center gap-2 px-8 py-3"
        >
          {simulationState === 'running' ? 'Authenticating...' : 'Test Authentication Flow'}
          <ArrowRight size={20} />
        </Button>
      </div>

      {simulationState === 'success' && (
        <div className="mt-6 p-4 bg-success/10 border border-success/30 rounded-lg flex items-start gap-3 animate-fade-in">
          <ShieldCheck className="text-success shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-success">Authentication Successful!</h4>
            <p className="text-sm text-muted-foreground mt-1">
              The Identity Proxy successfully validated the ML-DSA-65 signature from the IdP,
              stripped it, and re-signed the SAML assertion with an RSA-2048 key. The legacy
              application authenticated the user without needing a software update.
            </p>
          </div>
        </div>
      )}

      {simulationState === 'failed' && (
        <div className="mt-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg flex items-start gap-3 animate-fade-in">
          <AlertTriangle className="text-destructive shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-destructive">Authentication Failed</h4>
            <p className="text-sm text-muted-foreground mt-1">
              The legacy application received an assertion signed with an unknown Object Identifier
              (OID) for ML-DSA-65. The XML parser crashed, and access was denied. Enable the
              Identity Proxy to translate the signature.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
