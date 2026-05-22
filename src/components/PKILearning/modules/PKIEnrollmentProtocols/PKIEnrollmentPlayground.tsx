// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { KeyGenStep } from './workshop/KeyGenStep'
import { CmpInitialReq } from './workshop/CmpInitialReq'
import { EstSimpleEnroll } from './workshop/EstSimpleEnroll'
import { CmpKemKeyUpdate } from './workshop/CmpKemKeyUpdate'

/**
 * Playground-wrapper view for the PKI Enrollment Protocols workshop.
 *
 * Renders just the headline flow (key generation → CMP Initial Request) for
 * users coming from the PQC Protocol Matrix / `/playground/pki-enrollment`
 * route. Links out to the full learn module for the extended walkthrough.
 */
export const PKIEnrollmentPlayground: React.FC = () => {
  const [eeKeyPem, setEeKeyPem] = useState<Uint8Array | null>(null)
  const [eeKeyAlgorithm, setEeKeyAlgorithm] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
        Four-step PKI enrollment showcase — RFC 4210 (CMP) · RFC 7030 (EST) · RFC 9810 (CMP KEM).
        Generate a key, enroll via CMP, enroll the same key via EST, then perform a quantum-safe KEM
        key update.{' '}
        <Link
          to="/learn/pki-enrollment-protocols?tab=workshop"
          className="text-primary hover:underline"
        >
          Open the full module for composite enrollment and cert inspection steps.
        </Link>
      </div>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">Step 1 — Generate end-entity key</h3>
        <KeyGenStep
          onKeyReady={(algorithm, key) => {
            setEeKeyAlgorithm(algorithm)
            setEeKeyPem(key)
          }}
        />
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">
          Step 2 — CMP Initial Request (ML-DSA signed)
        </h3>
        <CmpInitialReq eeKeyPem={eeKeyPem} eeKeyAlgorithm={eeKeyAlgorithm} />
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">
          Step 3 — EST simpleenroll (RFC 7030)
        </h3>
        <EstSimpleEnroll eeKeyPem={eeKeyPem} eeKeyAlgorithm={eeKeyAlgorithm} />
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">
          Step 4 — CMP KEM Key Update (RFC 9810 encrCert POP)
        </h3>
        <CmpKemKeyUpdate />
      </section>

      <div className="pt-4 border-t border-border">
        <Link to="/learn/pki-enrollment-protocols">
          <Button variant="outline" className="gap-1">
            Open full module <ExternalLink size={14} />
          </Button>
        </Link>
      </div>
    </div>
  )
}
