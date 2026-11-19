// SPDX-License-Identifier: AGPL-3.0-only
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { openSSLService } from '@/services/crypto/OpenSSLService'
import {
  certificateTlsConfig,
  type ExerciseFile,
} from '../../HybridCrypto/services/certificateTlsExercise'
import { parseTLSSimulationResult } from '../../TLSBasics/utils/parseTLSSimulationResult'

const HYBRID_GROUP = 'X25519MLKEM768'
const CLASSICAL_GROUP = 'X25519'
const SIGNATURE = 'rsa_pss_rsae_sha256'

type LegResult = {
  state: 'established' | 'rejected' | 'unconfirmed'
  group?: string
  signature?: string
  detail?: string
}

async function runTlsLeg(
  files: ExerciseFile[],
  clientGroups: string,
  serverGroups: string
): Promise<LegResult> {
  const result = parseTLSSimulationResult(
    await openSSLService.simulateTLS(
      certificateTlsConfig(clientGroups, SIGNATURE, true),
      certificateTlsConfig(serverGroups, SIGNATURE, false),
      files,
      ['CLIENT_SEND: gateway TLS sample', 'SERVER_SEND: sample response', 'CLIENT_DISCONNECT']
    )
  )

  if (result.status !== 'success') {
    const detail =
      result.trace
        .filter((event) => event.event === 'error')
        .map((event) => event.details)
        .join(' ') || result.error
    return { state: result.status === 'failed' ? 'rejected' : 'unconfirmed', detail }
  }

  const group = result.trace
    .find((event) => event.event === 'key_exchange')
    ?.details.replace(/^Key Exchange: /, '')
    .toUpperCase()
  const signature = result.trace
    .find((event) => event.event === 'signature_algorithm')
    ?.details.replace(/^Peer Signature Algorithm: /i, '')
  if (!group || !signature) {
    return { state: 'unconfirmed', detail: 'OpenSSL did not report both handshake properties.' }
  }
  return { state: 'established', group, signature }
}

function gatewayDecision(ingress: LegResult, origin: LegResult): string {
  if (ingress.group !== HYBRID_GROUP) return 'The requested ingress protection was not confirmed.'
  if (origin.group === HYBRID_GROUP) return 'Both legs established hybrid key exchange.'
  if (origin.group === CLASSICAL_GROUP) {
    return 'The origin leg established classical X25519. Hybrid protection stops at the edge.'
  }
  if (origin.state === 'rejected')
    return 'Ingress succeeded, but OpenSSL refused the origin handshake.'
  return 'Ingress succeeded. The origin group could not be confirmed.'
}

export function GatewayTlsLegs() {
  const [originHybrid, setOriginHybrid] = useState(true)
  const [allowFallback, setAllowFallback] = useState(true)
  const [running, setRunning] = useState(false)
  const runInProgress = useRef(false)
  const [result, setResult] = useState<{ ingress: LegResult; origin: LegResult } | null>(null)
  const [error, setError] = useState('')

  async function run() {
    if (runInProgress.current) return
    runInProgress.current = true
    setRunning(true)
    setResult(null)
    setError('')
    const sampleName = `gateway-${crypto.randomUUID()}`
    const certificate = `${sampleName}.pem`
    const privateKey = `${sampleName}.key`
    try {
      const issued = await openSSLService.execute(
        `openssl req -x509 -newkey rsa:2048 -noenc -keyout ${privateKey} -out ${certificate} -days 1 -subj "/CN=gateway.example.test" -addext "subjectAltName=DNS:gateway.example.test"`
      )
      const findFile = (name: string) =>
        issued.files.find((file) => file.name.replace(/^\//, '') === name)?.data
      const cert = findFile(certificate)
      const key = findFile(privateKey)
      if (issued.error || !cert || !key)
        throw new Error('OpenSSL did not issue the sample identity.')
      const files = [
        { name: 'ssl/server.crt', data: cert },
        { name: 'ssl/server.key', data: key },
        { name: 'ssl/client-ca.crt', data: cert },
      ]
      const ingress = await runTlsLeg(files, HYBRID_GROUP, HYBRID_GROUP)
      const origin = await runTlsLeg(
        files,
        allowFallback ? `${HYBRID_GROUP}:${CLASSICAL_GROUP}` : HYBRID_GROUP,
        originHybrid ? HYBRID_GROUP : CLASSICAL_GROUP
      )
      setResult({ ingress, origin })
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'OpenSSL could not run this exercise.')
    } finally {
      await Promise.allSettled(
        [certificate, privateKey].map((name) => openSSLService.deleteFile(name))
      )
      runInProgress.current = false
      setRunning(false)
    }
  }

  const legs = result && [
    { label: 'Client to edge', ...result.ingress },
    { label: 'Edge to origin', ...result.origin },
  ]

  return (
    <section aria-labelledby="gateway-tls-legs" className="glass-panel space-y-3 p-4">
      <h3 id="gateway-tls-legs" className="text-lg font-bold">
        Check both TLS legs of a re-encrypting gateway
      </h3>
      <p className="text-sm text-muted-foreground">
        OpenSSL runs two local TLS 1.3 handshakes using the same explicitly trusted, fresh RSA
        identity. Each in-browser peer pair represents one leg. A deployed proxy terminates the
        client connection and forwards requests over a separate origin connection.
      </p>
      <fieldset className="space-y-2 text-sm" disabled={running}>
        <legend className="mb-2 font-semibold">Origin-leg configuration</legend>
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={originHybrid}
            onChange={(event) => {
              setOriginHybrid(event.target.checked)
              setResult(null)
              setError('')
            }}
          />
          Origin peer supports X25519MLKEM768
        </label>
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={allowFallback}
            onChange={(event) => {
              setAllowFallback(event.target.checked)
              setResult(null)
              setError('')
            }}
          />
          Gateway permits classical fallback on the origin leg
        </label>
      </fieldset>
      <Button disabled={running} onClick={() => void run()}>
        Run both TLS handshakes
      </Button>
      {error && <p role="alert">{error}</p>}
      <p role="status" aria-label="Gateway TLS decision" className="text-sm font-semibold">
        {running
          ? 'Running the two handshakes…'
          : result && gatewayDecision(result.ingress, result.origin)}
      </p>
      {legs && (
        <table className="w-full text-left text-xs">
          <thead>
            <tr>
              <th scope="col">TLS leg</th>
              <th scope="col">Observed key exchange</th>
              <th scope="col">Handshake signature</th>
            </tr>
          </thead>
          <tbody>
            {legs.map((leg) => (
              <tr key={leg.label} className="border-t border-border align-top">
                <th scope="row" className="py-2 pr-2 font-medium">
                  {leg.label}
                </th>
                <td className="py-2 pr-2 break-all">
                  {leg.group ?? (leg.state === 'rejected' ? 'Rejected' : 'Unconfirmed')}
                </td>
                <td className="py-2 break-all">{leg.signature ?? 'Unavailable'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {result?.origin.detail && (
        <p className="break-words text-xs text-muted-foreground">{result.origin.detail}</p>
      )}
    </section>
  )
}
