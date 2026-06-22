// SPDX-License-Identifier: GPL-3.0-only
import type { FC } from 'react'
import { lazy, Suspense } from 'react'
import { ShieldCheck, PenLine, Lock, FlaskConical } from 'lucide-react'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import manifest from './manifest'
import { EmailSigningIntroduction } from './components/EmailSigningIntroduction'
import { EmailSigningExercises } from './components/EmailSigningExercises'
import { SMIMECertViewer } from './workshop/SMIMECertViewer'
import { CMSSigningDemo } from './workshop/CMSSigningDemo'
import { CMSEncryptionDemo } from './workshop/CMSEncryptionDemo'

const LiveHSMProvider = lazy(() =>
  import('./workshop/LiveHSMProvider').then((m) => ({ default: m.LiveHSMProvider }))
)

const PARTS: WorkshopPart[] = [
  {
    id: 'smime-cert',
    title: 'Step 1: S/MIME Certificates',
    description: 'Compare classical and PQC certificate structures for email signing.',
    icon: ShieldCheck,
  },
  {
    id: 'cms-signing',
    title: 'Step 2: CMS Signing',
    description: 'Walk through the CMS SignedData workflow and ASN.1 structure.',
    icon: PenLine,
  },
  {
    id: 'cms-encryption',
    title: 'Step 3: CMS Encryption',
    description:
      'Compare RSA key transport with KEM-based encryption (RFC 9629) using AuthEnvelopedData.',
    icon: Lock,
  },
  {
    id: 'live-hsm',
    title: 'Step 4: Live HSM Provider',
    description:
      'Phase 1 foundation — load openssl.wasm with pkcs11-provider + softhsmv3 statically linked and register the provider in-process.',
    icon: FlaskConical,
  },
]

export const EmailSigningModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    title="Email & Document Signing (S/MIME, CMS)"
    description="Master CMS structures for email signing and encryption — from classical S/MIME to post-quantum KEMs."
    learn={(api) => <EmailSigningIntroduction onNavigateToWorkshop={() => api.goToWorkshop()} />}
    exercises={(api) => (
      <EmailSigningExercises
        onNavigateToWorkshop={() => api.goToWorkshop()}
        onSetWorkshopConfig={(config) => api.openWorkshopStep(config.step)}
      />
    )}
    workshopParts={PARTS}
    renderWorkshopStep={(index, configKey) => {
      switch (index) {
        case 0:
          return <SMIMECertViewer key={`smime-cert-${configKey}`} />
        case 1:
          return <CMSSigningDemo key={`cms-signing-${configKey}`} />
        case 2:
          return <CMSEncryptionDemo key={`cms-encryption-${configKey}`} />
        case 3:
          return (
            <Suspense
              fallback={
                <div className="text-sm text-muted-foreground">Loading Live HSM Provider…</div>
              }
            >
              <LiveHSMProvider key={`live-hsm-${configKey}`} />
            </Suspense>
          )
        default:
          return null
      }
    }}
  />
)
