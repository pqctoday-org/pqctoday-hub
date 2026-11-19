// SPDX-License-Identifier: AGPL-3.0-only
import { useId, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'

type WrappingVersion = 'v1' | 'v2'

interface EncryptedRecord {
  ciphertext: ArrayBuffer
  iv: Uint8Array<ArrayBuffer>
  wrapper: ArrayBuffer
  version: WrappingVersion
}

interface Sample {
  v1: CryptoKey
  v2: CryptoKey
  active: EncryptedRecord
  backup: EncryptedRecord
  oldKeyAvailable: boolean
}

const cipher = { name: 'AES-GCM', length: 256 }
const wrapper = { name: 'AES-KW', length: 256 }
const encode = new TextEncoder()
const decode = new TextDecoder()

async function encryptRecord(text: string, key: CryptoKey): Promise<EncryptedRecord> {
  const dataKey = await crypto.subtle.generateKey(cipher, true, ['encrypt', 'decrypt'])
  const iv = crypto.getRandomValues(new Uint8Array(12))
  return {
    ciphertext: await crypto.subtle.encrypt(
      { name: cipher.name, iv },
      dataKey,
      encode.encode(text)
    ),
    iv,
    wrapper: await crypto.subtle.wrapKey('raw', dataKey, key, wrapper.name),
    version: 'v1',
  }
}

function unwrap(record: EncryptedRecord, key: CryptoKey, forRewrap: boolean) {
  return crypto.subtle.unwrapKey('raw', record.wrapper, key, wrapper.name, cipher, forRewrap, [
    'decrypt',
  ])
}

async function moveWrapper(record: EncryptedRecord, sample: Sample): Promise<EncryptedRecord> {
  const dataKey = await unwrap(record, sample.v1, true)
  return {
    ...record,
    wrapper: await crypto.subtle.wrapKey('raw', dataKey, sample.v2, wrapper.name),
    version: 'v2',
  }
}

export function BackupWrappingExercise() {
  const id = useId()
  const [sample, setSample] = useState<Sample | null>(null)
  const [working, setWorking] = useState(false)
  const [status, setStatus] = useState('')
  const [failed, setFailed] = useState(false)
  const running = useRef(false)

  const run = async (operation: () => Promise<void>) => {
    if (running.current) return
    running.current = true
    setWorking(true)
    setFailed(false)
    setStatus('')
    try {
      await operation()
    } catch {
      setFailed(true)
      setStatus('The browser could not complete the operation. Try again.')
    } finally {
      running.current = false
      setWorking(false)
    }
  }

  const startSample = () =>
    run(async () => {
      const [v1, v2] = await Promise.all([
        crypto.subtle.generateKey(wrapper, false, ['wrapKey', 'unwrapKey']),
        crypto.subtle.generateKey(wrapper, false, ['wrapKey', 'unwrapKey']),
      ])
      const [active, backup] = await Promise.all([
        encryptRecord('Sample inventory, current count: 27', v1),
        encryptRecord('Sample inventory, archived count: 19', v1),
      ])
      setSample({ v1, v2, active, backup, oldKeyAvailable: true })
      setStatus('Both encrypted records now depend on wrapping key v1.')
    })

  const makeOldKeyAvailable = (current: Sample, available: boolean) => {
    if (running.current) return
    setSample({ ...current, oldKeyAvailable: available })
    setFailed(false)
    setStatus(available ? 'Wrapping key v1 is available again.' : 'Wrapping key v1 is unavailable.')
  }

  const rewrap = (current: Sample, target: 'active' | 'backup') =>
    run(async () => {
      const rewrapped = await moveWrapper(current[target], current)
      setSample({ ...current, [target]: rewrapped })
      setStatus(
        target === 'active'
          ? 'Active data key rewrapped with v2. The encrypted record uses the same ciphertext.'
          : 'Backup data key rewrapped with v2. The encrypted backup uses the same ciphertext.'
      )
    })

  const readRecord = (current: Sample, target: 'active' | 'backup') =>
    run(async () => {
      const record = current[target]
      if (record.version === 'v1' && !current.oldKeyAvailable) {
        setFailed(true)
        setStatus(
          target === 'active'
            ? 'Active record could not be read. Its data key is wrapped with v1.'
            : 'Backup restore blocked. Its data key is wrapped with v1, which is unavailable.'
        )
        return
      }
      const dataKey = await unwrap(record, current[record.version], false)
      const plaintext = await crypto.subtle.decrypt(
        { name: cipher.name, iv: record.iv },
        dataKey,
        record.ciphertext
      )
      const label = target === 'active' ? 'Active record read' : 'Backup restored'
      setStatus(`${label} using ${record.version}. ${decode.decode(plaintext)}.`)
    })

  return (
    <section aria-labelledby={id} className="space-y-3 rounded-lg border border-border p-4">
      <h3 id={id} className="font-semibold text-foreground">
        Rotate a wrapping key and restore a backup
      </h3>
      <p className="text-sm text-muted-foreground">
        Rewrap the active record’s data key under v2. Then make v1 unavailable and try restoring the
        older backup. Compare which wrapping key each record still needs.
      </p>
      {sample ? (
        <>
          <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
            <div>
              <dt>Active data key wrapped by</dt>
              <dd className="font-mono">{sample.active.version}</dd>
            </div>
            <div>
              <dt>Backup data key wrapped by</dt>
              <dd className="font-mono">{sample.backup.version}</dd>
            </div>
            <div>
              <dt>Wrapping key v1</dt>
              <dd>{sample.oldKeyAvailable ? 'Available' : 'Unavailable'}</dd>
            </div>
          </dl>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => void rewrap(sample, 'active')}
              disabled={working || !sample.oldKeyAvailable || sample.active.version === 'v2'}
              className="h-auto min-h-10 whitespace-normal"
            >
              Rewrap active data key with v2
            </Button>
            <Button
              variant="outline"
              onClick={() => void readRecord(sample, 'active')}
              disabled={working}
            >
              Read active record
            </Button>
            <Button
              variant="outline"
              onClick={() => makeOldKeyAvailable(sample, !sample.oldKeyAvailable)}
              disabled={working}
            >
              {sample.oldKeyAvailable ? 'Simulate losing v1 access' : 'Restore v1 access'}
            </Button>
            <Button
              variant="outline"
              onClick={() => void readRecord(sample, 'backup')}
              disabled={working}
            >
              Restore backup
            </Button>
            <Button
              variant="outline"
              onClick={() => void rewrap(sample, 'backup')}
              disabled={working || !sample.oldKeyAvailable || sample.backup.version === 'v2'}
              className="h-auto min-h-10 whitespace-normal"
            >
              Rewrap backup data key with v2
            </Button>
            <Button variant="ghost" onClick={() => void startSample()} disabled={working}>
              Start over
            </Button>
          </div>
        </>
      ) : (
        <Button onClick={() => void startSample()} disabled={working}>
          Prepare encrypted sample
        </Button>
      )}
      <p
        role="status"
        aria-label="Database recovery result"
        className={failed ? 'text-sm text-status-error' : 'text-sm'}
      >
        {working ? 'Working on the encrypted sample…' : status}
      </p>
      <p className="text-xs text-muted-foreground">
        This browser sample uses AES-256-GCM for data and AES Key Wrap for data keys. Before
        retiring a production key, prove that every required backup can be restored and follow the
        applicable retention policy.{' '}
        <a
          href="https://csrc.nist.gov/pubs/sp/800/38/f/final"
          className="text-primary underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          NIST SP 800-38F
        </a>
      </p>
    </section>
  )
}
