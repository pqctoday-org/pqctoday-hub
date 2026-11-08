// SPDX-License-Identifier: AGPL-3.0-only
import { useTLSStore } from '@/store/tls-learning.store'
import { sampleCaForCertificate } from '../utils/sampleTrust'
import { Button } from '@/components/ui/button'

export function SampleTrustControls({ side }: { side: 'client' | 'server' }) {
  const { clientConfig, serverConfig, setClientConfig, setServerConfig } = useTLSStore()
  const config = side === 'client' ? clientConfig : serverConfig
  const peer = side === 'client' ? serverConfig : clientConfig
  const setConfig = side === 'client' ? setClientConfig : setServerConfig
  const sampleCa = sampleCaForCertificate(peer.certificates.certPem)
  return (
    <div className="mt-2 space-y-1 text-xs text-muted-foreground">
      <p>
        {config.trustSelection === 'sample-default'
          ? 'Sample-default CA'
          : 'Learner-selected sample CA'}
      </p>
      <p>
        The peer certificate and trusted CA are separate choices. An edited or imported CA stays
        selected until you change it. A sample run does not establish trust in a deployed system.
      </p>
      {!sampleCa && (
        <p>
          No matching bundled CA is known for this peer certificate. Select a sample CA explicitly.
        </p>
      )}
      <Button
        variant="outline"
        size="sm"
        disabled={!sampleCa}
        onClick={() =>
          setConfig({
            trustSelection: 'sample-default',
            certificates: { ...config.certificates, caPem: sampleCa },
          })
        }
      >
        Use matching sample CA
      </Button>
    </div>
  )
}
