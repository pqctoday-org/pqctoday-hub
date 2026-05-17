// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import {
  Loader2,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Info,
  FileText,
} from 'lucide-react'
import { openSSLService } from '@/services/crypto/OpenSSLService'
import { Button } from '@/components/ui/button'
import { ensureMockCA } from '../mock-ca/mockCA'
import { CA_ROOT_CERT_PATH, CA_ROOT_KEY_PATH } from '../constants'

interface CompositeEnrollProps {
  /** ML-DSA-65 cert issued in Step 2 (CMP IR). May be null if Step 2 wasn't run. */
  eeMlDsaCertPem: Uint8Array | null
}

interface ParallelResult {
  ecdsaKeyPem: string
  ecdsaCertPem: string
  ecdsaCertText: string
  ecdsaVerifyOut: string
  mlDsaCertText?: string
  mlDsaVerifyOut?: string
}

/**
 * Parallel-certs hybrid PKI demo.
 *
 * True composite signatures (single cert containing both ML-DSA + ECDSA public
 * keys + a length-prefixed concatenated signature, draft-ietf-lamps-pq-composite-sigs-19)
 * need composite OIDs registered in an OpenSSL provider — oqs-provider, our
 * pkcs11-provider with composite-sig extensions, or Bouncy Castle. OpenSSL
 * 3.6.2 doesn't ship them, so a "real" composite cert would be an opaque blob
 * no other tool could parse.
 *
 * What this step demonstrates instead is the DEPLOYMENT PATTERN actually used
 * in production hybrid PKI today: two parallel cert chains for the same
 * end-entity, one PQC (ML-DSA-65) + one classical (ECDSA-P256), both anchored
 * at the same CA. That's what Cloudflare, AWS KMS, and other 2026 hybrid
 * rollouts ship.
 */
export const CompositeEnroll: React.FC<CompositeEnrollProps> = ({ eeMlDsaCertPem }) => {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ParallelResult | null>(null)

  const handleRun = async () => {
    setBusy(true)
    setError(null)
    setResult(null)
    try {
      const ca = await ensureMockCA()

      // 1. Generate fresh ECDSA-P256 EE key
      const ecdsaKeyPath = '/ee-ecdsa.key.pem'
      const genResult = await openSSLService.execute(
        `openssl genpkey -algorithm EC -pkeyopt ec_paramgen_curve:P-256 -out ${ecdsaKeyPath}`
      )
      if (genResult.error) {
        throw new Error(`ECDSA keygen failed: ${genResult.error}\n${genResult.stderr}`)
      }
      const ecdsaKeyFile = genResult.files.find((f) => '/' + f.name === ecdsaKeyPath)
      if (!ecdsaKeyFile) throw new Error('ECDSA keygen produced no key file')

      // 2. Run the SAME CMP IR flow against the in-process mock server, this
      //    time enrolling the ECDSA key. The server callback (in cmp_simulation.c)
      //    is key-algorithm-agnostic — it copies whatever public key is in the
      //    CRMF template into the new cert, then signs with the CA's ML-DSA-65
      //    key. So the result is: ECDSA-P256 EE cert chained to an ML-DSA-65
      //    root, issued through the same protocol path as the ML-DSA EE cert
      //    from Step 2.
      const ecdsaCertPath = '/ee-ecdsa.cert.pem'
      const enrollResult = await openSSLService.simulateCmp({
        eeKeyPath: ecdsaKeyPath,
        subjectDn: '/CN=Workshop EE (ECDSA classical leg)/O=PQC Today/C=US',
        reference: 'workshop-ee-ecdsa-001',
        secret: 'workshop-shared-secret',
        caCertPath: CA_ROOT_CERT_PATH,
        caKeyPath: CA_ROOT_KEY_PATH,
        outCertPath: ecdsaCertPath,
        files: [
          { name: CA_ROOT_CERT_PATH.replace(/^\//, ''), data: ca.certPem },
          { name: CA_ROOT_KEY_PATH.replace(/^\//, ''), data: ca.keyPem },
          { name: ecdsaKeyPath.replace(/^\//, ''), data: ecdsaKeyFile.data },
        ],
      })
      if (!enrollResult.ok || !enrollResult.certPem) {
        throw new Error(`ECDSA enrollment failed: ${enrollResult.error || 'unknown'}`)
      }

      // 3. Decode + chain-verify the ECDSA cert
      const ecdsaCertName = ecdsaCertPath.replace(/^\//, '')
      const ecdsaDecode = await openSSLService.execute(
        `openssl x509 -in ${ecdsaCertPath} -text -noout`,
        [{ name: ecdsaCertName, data: enrollResult.certPem }]
      )
      const caCertName = CA_ROOT_CERT_PATH.replace(/^\//, '')
      const ecdsaVerify = await openSSLService.execute(
        `openssl verify -CAfile ${CA_ROOT_CERT_PATH} ${ecdsaCertPath}`,
        [
          { name: caCertName, data: ca.certPem },
          { name: ecdsaCertName, data: enrollResult.certPem },
        ]
      )

      // 4. If the ML-DSA cert from Step 2 is available, decode + verify it too
      //    so they sit side-by-side.
      let mlDsaCertText: string | undefined
      let mlDsaVerifyOut: string | undefined
      if (eeMlDsaCertPem) {
        const mlDsaCertName = 'ee-mldsa.cert.pem'
        const mlDsaDecode = await openSSLService.execute(
          `openssl x509 -in /${mlDsaCertName} -text -noout`,
          [{ name: mlDsaCertName, data: eeMlDsaCertPem }]
        )
        const mlDsaVerify = await openSSLService.execute(
          `openssl verify -CAfile ${CA_ROOT_CERT_PATH} /${mlDsaCertName}`,
          [
            { name: caCertName, data: ca.certPem },
            { name: mlDsaCertName, data: eeMlDsaCertPem },
          ]
        )
        mlDsaCertText = mlDsaDecode.stdout
        mlDsaVerifyOut = (mlDsaVerify.stdout || '') + (mlDsaVerify.stderr || '')
      }

      setResult({
        ecdsaKeyPem: new TextDecoder().decode(ecdsaKeyFile.data),
        ecdsaCertPem: new TextDecoder().decode(enrollResult.certPem),
        ecdsaCertText: ecdsaDecode.stdout,
        ecdsaVerifyOut: (ecdsaVerify.stdout || '') + (ecdsaVerify.stderr || ''),
        mlDsaCertText,
        mlDsaVerifyOut,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-md border border-primary/30 bg-primary/5 p-3 flex items-start gap-3 text-sm">
        <Info size={16} className="mt-0.5 shrink-0 text-primary" />
        <div>
          <div className="font-medium text-foreground">
            Parallel-certs hybrid PKI (the pattern actually shipping in 2026)
          </div>
          <p className="mt-1 text-muted-foreground">
            True composite signatures (one cert, one OID, one signature blob containing both ML-DSA
            + ECDSA outputs per{' '}
            <a
              href="https://datatracker.ietf.org/doc/draft-ietf-lamps-pq-composite-sigs/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              draft-ietf-lamps-pq-composite-sigs-19
            </a>
            ) need composite OIDs in an OpenSSL provider that OpenSSL 3.6 doesn't ship. Until those
            land, the production hybrid pattern is <strong>parallel certs</strong>: two EE
            certificates for the same identity, one PQC, one classical, both anchored at the same
            CA. This step issues both through the same CMP server you used in Step 2 — same
            protocol, same trust anchor, different leaf algorithms.
          </p>
        </div>
      </div>

      <Button
        variant="gradient"
        onClick={handleRun}
        disabled={busy}
        className="flex items-center gap-2"
      >
        {busy ? <Loader2 className="animate-spin" size={16} /> : <Layers size={16} />}
        {busy ? 'Issuing ECDSA leg via CMP…' : 'Issue parallel ECDSA-P256 cert (CMP IR)'}
      </Button>

      {!eeMlDsaCertPem && (
        <div className="rounded border border-status-warning/30 bg-status-warning/10 p-3 text-sm text-status-warning flex items-start gap-2">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>
            Run <strong>Step 2 (CMP Initial Request)</strong> first to also see the ML-DSA-65 leg
            side-by-side. The ECDSA leg works standalone.
          </span>
        </div>
      )}

      {error && (
        <div className="rounded border border-status-error/30 bg-status-error/10 p-3 text-sm text-status-error flex items-start gap-2">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <pre className="whitespace-pre-wrap font-mono text-xs">{error}</pre>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-status-success text-sm">
            <CheckCircle2 size={16} />
            <span>
              <strong>Hybrid pair issued.</strong> Both legs share the same{' '}
              <code>/CN=PQC_Workshop_Mock_CA</code> trust anchor.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* PQC leg */}
            <div className="rounded border border-primary/30 bg-primary/5 p-3">
              <h4 className="text-sm font-bold text-foreground flex items-center gap-2 mb-2">
                <FileText size={14} className="text-primary" /> PQC leg — ML-DSA-65
              </h4>
              {result.mlDsaCertText ? (
                <>
                  <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-all font-mono text-[10px] text-muted-foreground">
                    {result.mlDsaCertText}
                  </pre>
                  <div className="mt-2 pt-2 border-t border-border text-xs">
                    <span className="font-medium text-foreground">Chain verify:</span>{' '}
                    <code className="font-mono text-muted-foreground">
                      {result.mlDsaVerifyOut?.trim() || '(no output)'}
                    </code>
                  </div>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Not run yet — complete Step 2 to populate this side.
                </p>
              )}
            </div>

            {/* Classical leg */}
            <div className="rounded border border-secondary/30 bg-secondary/5 p-3">
              <h4 className="text-sm font-bold text-foreground flex items-center gap-2 mb-2">
                <FileText size={14} className="text-secondary" /> Classical leg — ECDSA-P256
              </h4>
              <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-all font-mono text-[10px] text-muted-foreground">
                {result.ecdsaCertText}
              </pre>
              <div className="mt-2 pt-2 border-t border-border text-xs">
                <span className="font-medium text-foreground">Chain verify:</span>{' '}
                <code className="font-mono text-muted-foreground">
                  {result.ecdsaVerifyOut.trim() || '(no output)'}
                </code>
              </div>
            </div>
          </div>

          <details className="rounded border border-border bg-muted/30 p-3">
            <summary className="cursor-pointer text-sm font-medium text-foreground">
              ECDSA leg: PEM artifacts (key + cert)
            </summary>
            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">Private key</div>
                <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-all font-mono text-[10px] text-muted-foreground">
                  {result.ecdsaKeyPem}
                </pre>
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">Certificate</div>
                <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-all font-mono text-[10px] text-muted-foreground">
                  {result.ecdsaCertPem}
                </pre>
              </div>
            </div>
          </details>
        </div>
      )}

      <div className="pt-3 border-t border-border">
        <p className="text-xs text-muted-foreground mb-2">When true composite ships in our WASM:</p>
        <div className="flex flex-wrap gap-2">
          <a
            href="https://datatracker.ietf.org/doc/draft-ietf-lamps-pq-composite-sigs/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm" className="gap-1">
              draft-composite-sigs-19 <ExternalLink size={12} />
            </Button>
          </a>
          <a
            href="https://datatracker.ietf.org/doc/draft-ietf-lamps-pq-composite-kem/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm" className="gap-1">
              draft-composite-kem-14 <ExternalLink size={12} />
            </Button>
          </a>
          <a
            href="https://github.com/pqctoday-org/pqctoday-hsm"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm" className="gap-1">
              pqctoday-hsm composite-sig branch <ExternalLink size={12} />
            </Button>
          </a>
        </div>
      </div>
    </div>
  )
}
