// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect } from 'react'
import { useTLSStore } from '@/store/tls-learning.store'
import { freshSampleIdentities, sampleCaForCertificate } from './sampleTrust'

/** Shared selection behavior for both existing TLS entry points; no trust inference. */
export function useSampleTrustDefaults(): void {
  const { clientConfig, serverConfig, setClientConfig, setServerConfig } = useTLSStore()
  useEffect(() => {
    const fresh = freshSampleIdentities(clientConfig, serverConfig)
    if (fresh) {
      setClientConfig({ certificates: fresh.client })
      setServerConfig({ certificates: fresh.server })
      return
    }
    const clientCa = sampleCaForCertificate(serverConfig.certificates.certPem) ?? ''
    if (
      clientConfig.trustSelection === 'sample-default' &&
      (clientConfig.certificates.caPem ?? '') !== clientCa
    ) {
      setClientConfig({ certificates: { ...clientConfig.certificates, caPem: clientCa } })
    }
    const serverCa = sampleCaForCertificate(clientConfig.certificates.certPem) ?? ''
    if (
      serverConfig.trustSelection === 'sample-default' &&
      (serverConfig.certificates.caPem ?? '') !== serverCa
    ) {
      setServerConfig({ certificates: { ...serverConfig.certificates, caPem: serverCa } })
    }
  }, [clientConfig, serverConfig, setClientConfig, setServerConfig])
}
