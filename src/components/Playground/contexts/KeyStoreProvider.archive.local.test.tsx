// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect } from 'react'
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import JSZip from 'jszip'
import { webcrypto } from 'node:crypto'
import { createSampleKeyArchive } from './sampleKeyArchive'
import type { Key } from '@/types'
import { EDUCATION_NOTICE_TEXT, withEducationNoticeComment } from '@/data/educationNotice'
import { KeyStoreProvider } from './KeyStoreProvider'
import { useKeyStoreContext } from './KeyStoreContext'
import type { KeyStoreContextType } from './types'

const settings = vi.hoisted(() => ({ addLog: vi.fn(), setError: vi.fn() }))
vi.mock('./SettingsContext', () => ({
  useSettingsContext: () => ({
    algorithm: 'ML-KEM',
    keySize: '768',
    executionMode: 'wasm',
    wasmLoaded: true,
    classicalAlgorithm: 'AES-256',
    setLoading: vi.fn(),
    ...settings,
  }),
}))
vi.mock('../hooks/useKeyGeneration', () => ({
  useKeyGeneration: () => ({
    generateKeys: vi.fn(),
    generateClassicalKeys: vi.fn(),
    classicalLoading: false,
  }),
}))
let store: KeyStoreContextType
let downloaded: Blob[]
function Probe({ onUpdate }: { onUpdate: (value: KeyStoreContextType) => void }) {
  const context = useKeyStoreContext()
  useEffect(() => onUpdate(context), [context, onUpdate])
  return <input aria-label="Restore archive" type="file" onChange={context.restoreKeys} />
}
function mount() {
  render(
    <KeyStoreProvider>
      <Probe
        onUpdate={(value) => {
          store = value
        }}
      />
    </KeyStoreProvider>
  )
}
const withoutId = (key: Key) =>
  Object.fromEntries(Object.entries(key).filter(([name]) => name !== 'id'))
const sample = (id: string, type: Key['type'] = 'private'): Key => ({
  id,
  name: 'Same display name',
  type,
  algorithm: 'ML-KEM-768',
  value: '0011\n',
  data: new Uint8Array([0, 17]),
  dataType: 'binary',
  timestamp: 123,
})
const readBlob = (blob: Blob) =>
  new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = reject
    reader.readAsArrayBuffer(blob)
  })
async function restore(zip: JSZip) {
  const bytes = await zip.generateAsync({ type: 'uint8array' })
  fireEvent.change(screen.getByLabelText('Restore archive'), {
    target: { files: [new File([new Uint8Array(bytes)], 'sample.zip')] },
  })
}
beforeEach(() => {
  vi.stubGlobal('crypto', webcrypto)
  downloaded = []
  settings.addLog.mockReset()
  settings.setError.mockReset()
  vi.stubGlobal('URL', {
    createObjectURL: (blob: Blob) => {
      downloaded.push(blob)
      return 'blob:sample'
    },
    revokeObjectURL: vi.fn(),
  })
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('Playground sample ZIP backup and atomic restore', () => {
  it('downloads a manifest and unique members for duplicate display names, then preserves existing entries on repeated restore', async () => {
    mount()
    await act(async () => store.setKeyStore([sample('first', 'public'), sample('second')]))
    await act(async () => store.backupAllKeys())
    expect(downloaded).toHaveLength(1)
    const bytes = await readBlob(downloaded[0])
    const zip = await JSZip.loadAsync(bytes)
    const manifest = zip.file('playground-keys.json')
    expect(manifest).not.toBeNull()
    const records = JSON.parse(await manifest!.async('string'))
    expect(records.keys).toHaveLength(2)
    expect(new Set(records.keys.map((k: { valueFile: string }) => k.valueFile)).size).toBe(2)
    await act(async () => store.setKeyStore([sample('existing', 'symmetric')]))
    await restore(zip)
    await waitFor(() => expect(store.keyStore).toHaveLength(3))
    expect(store.keyStore[0].id).toBe('existing')
    expect(store.keyStore.slice(1).map(withoutId)).toEqual(
      [sample('first', 'public'), sample('second')].map(withoutId)
    )
    await restore(zip)
    await waitFor(() => expect(store.keyStore).toHaveLength(5))
    expect(new Set(store.keyStore.map((key) => key.id)).size).toBe(5)
    expect(store.keyStore.some((key) => key.name === 'NOTICE')).toBe(false)
  })
  it('keeps older text ZIP entries unclassified and never imports NOTICE as a key', async () => {
    mount()
    const zip = new JSZip()
    zip.file('NOTICE.txt', EDUCATION_NOTICE_TEXT)
    zip.file('Old_Public_Key.txt', withEducationNoticeComment('aabb', '#'))
    await restore(zip)
    await waitFor(() => expect(store.keyStore).toHaveLength(1))
    expect(store.keyStore[0]).toMatchObject({
      name: 'Old Public Key',
      type: 'unclassified',
      algorithm: 'Unclassified legacy material',
      value: 'aabb',
    })
    expect(store.keyStore[0].data).toBeUndefined()
    expect(settings.addLog).toHaveBeenLastCalledWith(
      expect.objectContaining({ result: expect.stringMatching(/unclassified/i) })
    )
  })
  it('rejects a broken manifest before inserting even an otherwise readable text member', async () => {
    mount()
    await act(async () => store.setKeyStore([sample('existing')]))
    const zip = new JSZip()
    zip.file('playground-keys.json', '{broken')
    zip.file('NOTICE.txt', EDUCATION_NOTICE_TEXT)
    zip.file('readable.txt', 'not an implicit private key')
    await restore(zip)
    await waitFor(() =>
      expect(settings.setError).toHaveBeenCalledWith(expect.stringMatching(/Failed to restore/))
    )
    expect(store.keyStore.map((key) => key.id)).toEqual(['existing'])
    expect(settings.addLog).not.toHaveBeenCalledWith(
      expect.objectContaining({ result: expect.stringMatching(/^Restored/) })
    )
  })
  it('inserts nothing on a missing referenced last member and permits a valid retry', async () => {
    mount()
    await act(async () => store.setKeyStore([sample('existing')]))
    const zip = await JSZip.loadAsync(
      await createSampleKeyArchive([sample('one'), sample('two', 'public')])
    )
    const manifest = JSON.parse(await zip.file('playground-keys.json')!.async('string'))
    const name = manifest.keys[1].valueFile as string,
      text = await zip.file(name)!.async('string')
    zip.remove(name)
    await restore(zip)
    await waitFor(() =>
      expect(settings.setError).toHaveBeenCalledWith(
        expect.stringMatching(/Missing archive member/)
      )
    )
    expect(store.keyStore.map((key) => key.id)).toEqual(['existing'])
    zip.file(name, text)
    await restore(zip)
    await waitFor(() => expect(store.keyStore).toHaveLength(3))
    expect(settings.setError).toHaveBeenLastCalledWith(null)
  })
  it('creates no download when any record contains a nonextractable CryptoKey', async () => {
    mount()
    const data = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 128 }, false, [
      'encrypt',
      'decrypt',
    ])
    await act(async () =>
      store.setKeyStore([
        sample('good'),
        {
          id: 'nonextractable',
          name: 'Unsupported sample',
          type: 'symmetric',
          algorithm: 'AES-GCM',
          value: '',
          timestamp: 2,
          data,
          dataType: 'cryptokey',
        },
      ])
    )
    await act(async () => store.backupAllKeys())
    expect(downloaded).toHaveLength(0)
    expect(settings.setError).toHaveBeenCalledWith(expect.stringMatching(/Nonextractable/))
    expect(store.keyStore).toHaveLength(2)
  })
})
