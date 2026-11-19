// SPDX-License-Identifier: AGPL-3.0-only
import { useState } from 'react'
import { HYBRID_TLS_KEY_SHARES } from '../utils/hybridKeyShareSizes'

const GROUPS = Object.keys(HYBRID_TLS_KEY_SHARES) as (keyof typeof HYBRID_TLS_KEY_SHARES)[]

function validCapacity(value: string) {
  return /^\d+$/.test(value) && Number(value) <= 65535
}

export function TLSKeyShareBudget() {
  const [group, setGroup] = useState<keyof typeof HYBRID_TLS_KEY_SHARES>('X25519MLKEM768')
  const [clientCapacity, setClientCapacity] = useState('1250')
  const [serverCapacity, setServerCapacity] = useState('1130')
  const share = HYBRID_TLS_KEY_SHARES[group]

  const valid = validCapacity(clientCapacity) && validCapacity(serverCapacity)
  const clientFits = Number(clientCapacity) >= share.client
  const serverFits = Number(serverCapacity) >= share.server

  return (
    <section aria-labelledby="tls-share-fit" className="glass-panel mt-4 space-y-3 p-4">
      <h3 id="tls-share-fit" className="text-sm font-bold">
        Check the TLS key-share field capacity
      </h3>
      <p className="text-sm text-muted-foreground">
        A sample parser reserves separate buffers for the client and server
        <code className="mx-1">key_exchange</code> fields. Predict which buffer needs to grow when
        the group changes.
      </p>
      <label className="block text-sm">
        Hybrid group
        {/* eslint-disable-next-line no-restricted-syntax -- Native <select> preserved for form semantics and Playwright combobox/selectOption tests */}
        <select
          className="mt-1 block rounded border border-border bg-background p-2"
          value={group}
          onChange={(event) => {
            const nextGroup = GROUPS.find((candidate) => candidate === event.target.value)
            if (nextGroup) setGroup(nextGroup)
          }}
        >
          {GROUPS.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      </label>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="block text-sm">
          Client share capacity (bytes)
          <input
            className="mt-1 block w-full rounded border border-border bg-background p-2"
            type="number"
            min={0}
            max={65535}
            value={clientCapacity}
            onChange={(event) => setClientCapacity(event.target.value)}
          />
        </label>
        <label className="block text-sm">
          Server share capacity (bytes)
          <input
            className="mt-1 block w-full rounded border border-border bg-background p-2"
            type="number"
            min={0}
            max={65535}
            value={serverCapacity}
            onChange={(event) => setServerCapacity(event.target.value)}
          />
        </label>
      </div>
      <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
        <div>
          <dt>Client field</dt>
          <dd className="font-bold">{share.client.toLocaleString('en-US')} bytes</dd>
        </div>
        <div>
          <dt>Server field</dt>
          <dd className="font-bold">{share.server.toLocaleString('en-US')} bytes</dd>
        </div>
        <div>
          <dt>Shared secret input to TLS HKDF</dt>
          <dd className="font-bold">{share.scheduleInput} bytes</dd>
        </div>
      </dl>
      <p role="status" aria-label="TLS share capacity result" className="text-sm font-semibold">
        {!valid
          ? 'Enter whole capacities from 0 to 65,535 bytes.'
          : clientFits && serverFits
            ? 'Both field sizes fit their sample buffers.'
            : `The ${clientFits ? 'server share' : serverFits ? 'client share' : 'client and server shares'} exceed${clientFits || serverFits ? 's' : ''} the selected capacity.`}
      </p>
      <p className="text-xs text-muted-foreground">
        The shares are field payloads. A full handshake also carries headers and other messages. TLS
        derives its traffic keys from the combined secret through HKDF.
      </p>
      <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
        <a
          className="text-primary underline"
          href="https://www.rfc-editor.org/rfc/rfc10024.html#section-4"
        >
          RFC 10024 negotiated groups
        </a>
        <a
          className="text-primary underline"
          href="https://www.ietf.org/ietf-ftp/rfc/rfc9846.html#section-7.1"
        >
          TLS 1.3 key schedule
        </a>
      </p>
    </section>
  )
}
