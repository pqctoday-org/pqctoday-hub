// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { FileSearch, Loader2, AlertTriangle } from 'lucide-react'
import { openSSLService } from '@/services/crypto/OpenSSLService'
import { Button } from '@/components/ui/button'
import { EE_CERT_PATH, CA_ROOT_CERT_PATH } from '../constants'
import { ensureMockCA, caInputFiles } from '../mock-ca/mockCA'

interface CertViewerProps {
  /** PEM bytes of a previously-issued cert (e.g. from CMP IR). May be null. */
  eeCertPem: Uint8Array | null
}

export const CertViewer: React.FC<CertViewerProps> = ({ eeCertPem }) => {
  const [decoded, setDecoded] = useState<string | null>(null)
  const [verifyOut, setVerifyOut] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDecode = async () => {
    if (!eeCertPem) {
      setError('No certificate available — run CMP IR or EST simpleenroll first.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const fileName = EE_CERT_PATH.replace(/^\//, '')
      const out = await openSSLService.execute(`openssl x509 -in ${EE_CERT_PATH} -text -noout`, [
        { name: fileName, data: eeCertPem },
      ])
      setDecoded(out.stdout || out.stderr || '(no output)')

      const ca = await ensureMockCA()
      const verify = await openSSLService.execute(
        `openssl verify -CAfile ${CA_ROOT_CERT_PATH} ${EE_CERT_PATH}`,
        [...caInputFiles(ca), { name: fileName, data: eeCertPem }]
      )
      setVerifyOut(
        (verify.stdout || '') + (verify.stderr ? '\n' + verify.stderr : '') ||
          '(no verifier output)'
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <Button
        variant="gradient"
        onClick={handleDecode}
        disabled={busy || !eeCertPem}
        className="flex items-center gap-2"
      >
        {busy ? <Loader2 className="animate-spin" size={16} /> : <FileSearch size={16} />}
        {busy ? 'Decoding…' : 'Decode + verify issued certificate'}
      </Button>

      {error && (
        <div className="rounded border border-status-error/30 bg-status-error/10 p-3 text-sm text-status-error flex items-start gap-2">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {decoded && (
        <details open className="rounded border border-border bg-muted/30 p-3">
          <summary className="cursor-pointer text-sm font-medium text-foreground">
            Decoded certificate
          </summary>
          <pre className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap break-all font-mono text-[10px] text-muted-foreground">
            {decoded}
          </pre>
        </details>
      )}

      {verifyOut && (
        <div className="rounded border border-border bg-muted/30 p-3">
          <div className="text-sm font-medium text-foreground mb-1">Chain verification</div>
          <pre className="whitespace-pre-wrap font-mono text-xs text-muted-foreground">
            {verifyOut}
          </pre>
        </div>
      )}
    </div>
  )
}
