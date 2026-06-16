// SPDX-License-Identifier: GPL-3.0-only
import type { FC } from 'react'
import { useCallback, useState } from 'react'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import manifest from './manifest'
import { WORKSHOP_STEPS } from './constants'
import { EnrollmentIntroduction } from './components/EnrollmentIntroduction'
import { KeyGenStep } from './workshop/KeyGenStep'
import { CmpInitialReq } from './workshop/CmpInitialReq'
import { EstSimpleEnroll } from './workshop/EstSimpleEnroll'
import { CmpKemKeyUpdate } from './workshop/CmpKemKeyUpdate'
import { CompositeEnroll } from './workshop/CompositeEnroll'
import { CertViewer } from './workshop/CertViewer'

export const PKIEnrollmentProtocolsModule: FC = () => {
  // Cross-step state — the keypair (Step 1) and issued cert (Steps 2/3) flow
  // through the workshop sequence. Held in the module FC; the original Reset
  // cleared all three, hence the onReset slot.
  const [eeKeyPem, setEeKeyPem] = useState<Uint8Array | null>(null)
  const [eeKeyAlgorithm, setEeKeyAlgorithm] = useState<string | null>(null)
  const [eeCertPem, setEeCertPem] = useState<Uint8Array | null>(null)

  const handleKeyReady = useCallback((algorithm: string, keyPem: Uint8Array) => {
    setEeKeyAlgorithm(algorithm)
    setEeKeyPem(keyPem)
  }, [])

  return (
    <ModuleShell
      manifest={manifest}
      description="RFC 7030 (EST) and RFC 9810 (CMP, KEM update) — hands-on PQC certificate enrollment with real OpenSSL 3.6 WASM crypto + an in-browser mock CA."
      learn={(api) => <EnrollmentIntroduction onNavigateToWorkshop={() => api.goToWorkshop()} />}
      workshopParts={WORKSHOP_STEPS as WorkshopPart[]}
      onReset={() => {
        setEeKeyPem(null)
        setEeKeyAlgorithm(null)
        setEeCertPem(null)
      }}
      renderWorkshopStep={(index) => {
        switch (index) {
          case 0:
            return <KeyGenStep onKeyReady={handleKeyReady} />
          case 1:
            return (
              <CmpInitialReq
                eeKeyPem={eeKeyPem}
                eeKeyAlgorithm={eeKeyAlgorithm}
                onCertIssued={setEeCertPem}
              />
            )
          case 2:
            return (
              <EstSimpleEnroll
                eeKeyPem={eeKeyPem}
                eeKeyAlgorithm={eeKeyAlgorithm}
                onCertIssued={setEeCertPem}
              />
            )
          case 3:
            return <CmpKemKeyUpdate />
          case 4:
            return <CompositeEnroll eeMlDsaCertPem={eeCertPem} />
          case 5:
            return <CertViewer eeCertPem={eeCertPem} />
          default:
            return null
        }
      }}
    />
  )
}
