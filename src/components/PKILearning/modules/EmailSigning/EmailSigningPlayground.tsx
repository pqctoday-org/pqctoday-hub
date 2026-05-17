// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SMIMECertViewer } from './workshop/SMIMECertViewer'
import { CMSSigningDemo } from './workshop/CMSSigningDemo'
import { CMSEncryptionDemo } from './workshop/CMSEncryptionDemo'
import { LiveHSMProvider } from './workshop/LiveHSMProvider'

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

export const EmailSigningPlayground: React.FC = () => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    'smime-certs': false,
    'cms-signing': false,
    'cms-encryption': false,
    'live-hsm': true,
  })

  const toggle = (id: string) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-sm text-foreground/80">
        Full S/MIME &amp; CMS workshop — real OpenSSL 3.6 WASM sign+verify and encrypt+decrypt with
        optional softhsmv3 PKCS#11 HSM routing.{' '}
        <Link to="/learn/email-signing?tab=workshop" className="text-primary hover:underline">
          Open the full learn module for guided walkthroughs and quizzes.
        </Link>
      </div>

      <div className="space-y-3">
        {SECTIONS.map(({ id, title, description }) => (
          <div key={id} className="rounded-lg border border-border bg-card">
            <Button
              variant="ghost"
              onClick={() => toggle(id)}
              className="flex w-full items-center justify-start gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors rounded-lg h-auto"
            >
              {expanded[id] ? (
                <ChevronDown size={16} className="shrink-0 text-primary" />
              ) : (
                <ChevronRight size={16} className="shrink-0 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
            </Button>
            {expanded[id] && (
              <div className="border-t border-border px-4 pb-4 pt-3">
                {id === 'smime-certs' && <SMIMECertViewer />}
                {id === 'cms-signing' && <CMSSigningDemo />}
                {id === 'cms-encryption' && <CMSEncryptionDemo />}
                {id === 'live-hsm' && <LiveHSMProvider />}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="pt-2 border-t border-border">
        <Link to="/learn/email-signing">
          <Button variant="outline" className="gap-1">
            Open full module <ExternalLink size={14} />
          </Button>
        </Link>
      </div>
    </div>
  )
}
