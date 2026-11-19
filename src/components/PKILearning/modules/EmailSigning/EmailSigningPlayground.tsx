// SPDX-License-Identifier: AGPL-3.0-only
import React, { useId, useState } from 'react'
import { Link } from 'react-router'
import { ExternalLink, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button-variants'
import { SMIMECertViewer } from './workshop/SMIMECertViewer'
import { CMSSigningDemo } from './workshop/CMSSigningDemo'
import { CMSEncryptionDemo } from './workshop/CMSEncryptionDemo'
import { LiveHSMProvider } from './workshop/LiveHSMProvider'
import { clampStep } from '@/utils/clampStep'

const SECTIONS = [
  {
    id: 'smime-certs',
    title: 'Step 1 — S/MIME Certificates',
    description: 'X.509 certificate structure and S/MIME signing trust model',
  },
  {
    id: 'cms-signing',
    title: 'Step 2 — CMS Signing Protocol',
    description: 'How CMS SignedData wraps and signs message content',
  },
  {
    id: 'cms-encryption',
    title: 'Step 3 — CMS Encryption Protocol',
    description: 'CMS AuthEnvelopedData with KEMRecipientInfo key transport',
  },
  {
    id: 'live-hsm',
    title: 'Step 4 — Live HSM Demos (ML-DSA · ML-KEM · Dual-Sign)',
    description:
      'Real OpenSSL 3.6 WASM sign+verify and encrypt+decrypt with optional softhsmv3 PKCS#11 HSM routing. Provider init banner gates the HSM toggle.',
  },
]

export const EmailSigningPlayground: React.FC<{ initialStep?: number }> = ({ initialStep }) => {
  const namespace = useId()
  // A ?step=N link opens just that section; without one the usual sections open.
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    initialStep === undefined
      ? {
          'smime-certs': false,
          'cms-signing': false,
          'cms-encryption': false,
          'live-hsm': true,
        }
      : Object.fromEntries(
          SECTIONS.map((s, i) => [s.id, i === clampStep(initialStep, SECTIONS.length)])
        )
  )

  const toggle = (id: string) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-sm text-foreground/80">
        Full S/MIME &amp; CMS workshop — real OpenSSL 3.6 WASM sign+verify and encrypt+decrypt with
        optional softhsmv3 PKCS#11 HSM routing.{' '}
        <Link
          to="/learn/email-signing?tab=workshop"
          className="text-primary underline underline-offset-2"
        >
          Open the full learn module for guided walkthroughs and quizzes.
        </Link>
      </div>

      <div className="space-y-3">
        {SECTIONS.map(({ id, title, description }) => (
          <div key={id} className="rounded-lg border border-border bg-card">
            <Button
              variant="ghost"
              id={`${namespace}-${id}-trigger`}
              aria-expanded={Boolean(expanded[id])}
              aria-controls={`${namespace}-${id}-panel`}
              onClick={() => toggle(id)}
              className="flex w-full items-center justify-start gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors rounded-lg h-auto whitespace-normal"
            >
              {expanded[id] ? (
                <ChevronDown size={16} className="shrink-0 text-primary" />
              ) : (
                <ChevronRight size={16} className="shrink-0 text-muted-foreground" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
            </Button>
            <div
              id={`${namespace}-${id}-panel`}
              role="region"
              aria-labelledby={`${namespace}-${id}-trigger`}
              hidden={!expanded[id]}
              className="border-t border-border px-4 pb-4 pt-3"
            >
              {expanded[id] && id === 'smime-certs' && <SMIMECertViewer />}
              {expanded[id] && id === 'cms-signing' && <CMSSigningDemo />}
              {expanded[id] && id === 'cms-encryption' && <CMSEncryptionDemo />}
              {expanded[id] && id === 'live-hsm' && <LiveHSMProvider />}
            </div>
          </div>
        ))}
      </div>

      <div className="pt-2 border-t border-border">
        <Link
          to="/learn/email-signing"
          className={buttonVariants({ variant: 'outline', className: 'gap-1' })}
        >
          Open full module <ExternalLink size={14} aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}
