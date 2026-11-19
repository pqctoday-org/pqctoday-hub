// SPDX-License-Identifier: AGPL-3.0-only
import { useState } from 'react'

export function OsTlsPolicyEvidence() {
  const [hostHybrid, setHostHybrid] = useState(false)
  const [appHybrid, setAppHybrid] = useState(false)
  const hostGroup = hostHybrid ? 'X25519MLKEM768' : 'X25519'
  const appGroup = appHybrid ? 'X25519MLKEM768' : 'X25519'

  return (
    <section aria-labelledby="os-tls-policy-evidence" className="glass-panel space-y-3 p-4">
      <h3 id="os-tls-policy-evidence" className="text-sm font-bold">
        Check which clients follow the host TLS policy
      </h3>
      <p className="text-sm text-muted-foreground">
        The fictional updates service needs hybrid key exchange from both clients. Replay recorded
        TLS 1.3 connections to the same local test peer, which accepts both groups. Both clients
        verified the same RSA certificate for <code>updates.example.test</code>.
      </p>
      <fieldset className="space-y-2 text-sm">
        <legend className="mb-2 font-semibold">Change the sample configuration</legend>
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={hostHybrid}
            onChange={(event) => setHostHybrid(event.target.checked)}
          />
          Require the hybrid group in the host OpenSSL config
        </label>
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={appHybrid}
            onChange={(event) => setAppHybrid(event.target.checked)}
          />
          Require the hybrid group in the bundled Go client
        </label>
      </fieldset>
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div className="space-y-1 rounded-md border border-border p-3">
          <dt className="font-semibold">Host OpenSSL client</dt>
          <dd>
            OpenSSL 3.6.3 used <code>system_default</code> without a per-client group override.
          </dd>
          <dd>
            Observed group <code>{hostGroup}</code>
          </dd>
        </div>
        <div className="space-y-1 rounded-md border border-border p-3">
          <dt className="font-semibold">Bundled Go client</dt>
          <dd>
            Go 1.26.5 used the application&apos;s <code>tls.Config.CurvePreferences</code> and the
            same host configuration environment.
          </dd>
          <dd>
            Observed group <code>{appGroup}</code>
          </dd>
        </div>
      </dl>
      <p role="status" className="text-sm font-semibold">
        {hostHybrid && appHybrid
          ? 'Both observed connections satisfy the sample hybrid key exchange policy.'
          : hostHybrid
            ? 'The bundled Go client still negotiates classical X25519.'
            : appHybrid
              ? 'The host OpenSSL client still negotiates classical X25519.'
              : 'Both clients negotiate classical X25519.'}
      </p>
      <p className="text-xs text-muted-foreground">
        For an installed client, check its actual TLS backend, application overrides and negotiated
        group. This exercise replays local observations. Certificate authentication stays RSA
        throughout.
      </p>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
        <li>
          <a className="text-primary underline" href="https://docs.openssl.org/3.5/man5/config/">
            OpenSSL configuration reference
          </a>
        </li>
        <li>
          <a className="text-primary underline" href="https://go.dev/doc/go1.24#crypto/tls">
            Go 1.24 TLS release notes
          </a>
        </li>
      </ul>
    </section>
  )
}
