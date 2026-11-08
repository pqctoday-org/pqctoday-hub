// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { Workbench } from './Workbench'

const { staleStore, execute, analytics, copy } = vi.hoisted(() => ({
  staleStore: {
    command: 'openssl rand -hex 999',
    files: [],
    setCommand: vi.fn(),
    isReady: true,
    isProcessing: false,
    loadError: null,
  },
  execute: vi.fn(async () => {}),
  analytics: vi.fn(),
  copy: vi.fn(async () => {}),
}))
vi.mock('./store', () => ({ useOpenSSLStore: () => staleStore }))
vi.mock('../../utils/analytics', () => ({ logEvent: analytics }))
vi.mock('./components/WorkbenchHeader', () => ({ WorkbenchHeader: () => null }))
vi.mock('./components/WorkbenchToolbar', () => ({ WorkbenchToolbar: () => null }))
vi.mock('./components/WorkbenchPresets', () => ({ WorkbenchPresets: () => null }))

const props = {
  setCategory: vi.fn(),
  executeCommand: execute,
  executeSkey: vi.fn(),
  retryLoad: vi.fn(),
  hsmKeygen: vi.fn(async () => ({ uri: 'unused' })),
}
const set = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } })
const preview = () => screen.getByText((_text, element) => element?.tagName === 'CODE')
const run = () => screen.getByRole('button', { name: 'Run Command' })
function choose(algo: string) {
  fireEvent.click(screen.getByRole('button', { name: 'HKDF' }))
  fireEvent.click(screen.getByRole('option', { name: algo }))
}

describe('KDF input byte preservation and current-command ownership', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    staleStore.isReady = true
    staleStore.isProcessing = false
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: copy },
    })
  })

  it('uses the same current byte command for preview, docs, copy and Run despite a stale stored command', () => {
    render(<Workbench category="kdf" {...props} />)
    set('Secret / Key (hex)', '001122')
    set('Salt (hex)', '000102')
    set('Info (hex)', 'aAbB')
    const expected =
      'openssl kdf -keylen 32 -kdfopt digest:SHA256 -kdfopt hexsalt:000102 -kdfopt hexkey:001122 -kdfopt hexinfo:aAbB HKDF'
    expect(preview()).toHaveTextContent(expected)
    expect(preview()).not.toHaveTextContent('rand -hex 999')
    expect(screen.getByTitle('View OpenSSL Documentation')).toHaveAttribute(
      'href',
      expect.stringContaining('openssl-kdf')
    )
    fireEvent.click(screen.getByTitle('Copy to clipboard'))
    expect(copy).toHaveBeenCalledExactlyOnceWith(expected)
    fireEvent.click(run())
    expect(execute).toHaveBeenCalledExactlyOnceWith(expected)
    expect(analytics).toHaveBeenCalledOnce()
    // Publication intentionally does not update this fixture: Run must not fall back to it.
    expect(staleStore.command).toBe('openssl rand -hex 999')
  })

  it('rejects incomplete/nonhex drafts without throwing, exposing or executing the previous valid command, then recovers', () => {
    render(<Workbench category="kdf" {...props} />)
    set('Secret / Key (hex)', '001122')
    for (const invalid of ['0', 'gg', '00 11', '0x11']) {
      expect(() => set('Secret / Key (hex)', invalid)).not.toThrow()
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Secret / Key must contain complete hex byte pairs'
      )
      expect(preview()).not.toHaveTextContent('openssl')
      expect(run()).toBeDisabled()
      fireEvent.click(run())
    }
    expect(execute).not.toHaveBeenCalled()
    expect(analytics).not.toHaveBeenCalled()
    expect(staleStore.setCommand).toHaveBeenLastCalledWith('')
    set('Secret / Key (hex)', 'ff00')
    expect(screen.queryByRole('alert')).toBeNull()
    fireEvent.click(run())
    expect(execute).toHaveBeenCalledExactlyOnceWith(
      'openssl kdf -keylen 32 -kdfopt digest:SHA256 -kdfopt hexkey:ff00 HKDF'
    )
  })

  it('validates every emitted byte field but omits empty optional values', () => {
    render(<Workbench category="kdf" {...props} />)
    expect(preview()).toHaveTextContent('openssl kdf -keylen 32 -kdfopt digest:SHA256 HKDF')
    expect(preview()).not.toHaveTextContent('hexsalt:')
    set('Salt (hex)', 'abz0')
    expect(screen.getByRole('alert')).toHaveTextContent('Salt must contain')
    set('Salt (hex)', '')
    set('Info (hex)', 'a')
    expect(screen.getByRole('alert')).toHaveTextContent('Info must contain')
    set('Info (hex)', '')
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('preserves password text and ignores invalid hidden HKDF fields for PBKDF2 and SCRYPT', () => {
    const view = render(<Workbench category="kdf" {...props} />)
    set('Secret / Key (hex)', 'not-hex')
    set('Info (hex)', 'f')
    choose('PBKDF2')
    expect(screen.queryByRole('alert')).toBeNull()
    set('Password', 'password001122')
    set('Salt (hex)', '000102')
    fireEvent.click(run())
    expect(execute).toHaveBeenLastCalledWith(
      'openssl kdf -keylen 32 -kdfopt digest:SHA256 -kdfopt hexsalt:000102 -kdfopt pass:password001122 -kdfopt iter:1000 PBKDF2'
    )
    fireEvent.click(screen.getByRole('button', { name: 'PBKDF2' }))
    fireEvent.click(screen.getByRole('option', { name: 'SCRYPT' }))
    fireEvent.click(run())
    expect(execute).toHaveBeenLastCalledWith(
      'openssl kdf -keylen 32 -kdfopt hexsalt:000102 -kdfopt pass:password001122 -kdfopt n:1024 -kdfopt r:8 -kdfopt p:1 SCRYPT'
    )
    view.unmount()
  })

  it('uses byte options for SSKDF and preserves non-KDF stored-command behavior', () => {
    const view = render(<Workbench category="kdf" {...props} />)
    set('Secret / Key (hex)', '001122')
    set('Info (hex)', 'aabb')
    choose('SSKDF')
    fireEvent.click(run())
    expect(execute).toHaveBeenLastCalledWith(
      'openssl kdf -keylen 32 -kdfopt digest:SHA256 -kdfopt hexkey:001122 -kdfopt hexinfo:aabb SSKDF'
    )
    view.rerender(<Workbench category="rand" {...props} />)
    expect(preview()).toHaveTextContent(staleStore.command)
    fireEvent.click(run())
    expect(execute).toHaveBeenLastCalledWith(staleStore.command)
  })
})
