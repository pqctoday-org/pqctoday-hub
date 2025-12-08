import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useArtifactManagement } from '../useArtifactManagement'
import { useOpenSSLStore } from '../../../../../OpenSSLStudio/store'

// Mock store
vi.mock('../../../../../OpenSSLStudio/store', () => ({
  useOpenSSLStore: vi.fn(),
}))

describe('useArtifactManagement', () => {
  const addFileMock = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useOpenSSLStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      addFile: addFileMock,
    })
  })

  it('should initialize with empty filenames', () => {
    const { result } = renderHook(() => useArtifactManagement())
    expect(result.current.filenames).toEqual({})
  })

  it('should save transaction artifact', () => {
    const { result } = renderHook(() => useArtifactManagement())
    const data = new Uint8Array([1, 2, 3])

    let filename
    act(() => {
      filename = result.current.saveTransaction('bitcoin', data)
    })

    expect(filename).toMatch(/bitcoin_transdata_\d+\.dat/)
    expect(result.current.filenames.trans).toBe(filename)
    expect(addFileMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: filename,
        type: 'binary',
        content: data,
      })
    )
  })

  it('should save signature artifact', () => {
    const { result } = renderHook(() => useArtifactManagement())
    const data = new Uint8Array([4, 5, 6])

    let filename
    act(() => {
      filename = result.current.saveSignature('ethereum', data)
    })

    expect(filename).toMatch(/ethereum_signdata_\d+\.sig/)
    expect(result.current.filenames.sig).toBe(filename)
  })

  it('should allow registering artifacts manually', () => {
    const { result } = renderHook(() => useArtifactManagement())

    act(() => {
      result.current.registerArtifact('hash', 'manual_hash.dat')
    })

    expect(result.current.filenames.hash).toBe('manual_hash.dat')
    // Should NOT call addFile
    expect(addFileMock).not.toHaveBeenCalled()
  })
})
