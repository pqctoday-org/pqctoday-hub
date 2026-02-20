import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, waitFor, act } from '@testing-library/react'
import { Workbench } from './Workbench'
import { useOpenSSLStore } from './store'

vi.mock('./store', () => ({
  useOpenSSLStore: vi.fn(),
}))

vi.mock('./components/WorkbenchToolbar', () => ({
  WorkbenchToolbar: () => <div data-testid="toolbar" />,
}))

vi.mock('./components/WorkbenchHeader', () => ({
  WorkbenchHeader: () => <div data-testid="header" />,
}))

vi.mock('./components/WorkbenchPreview', () => ({
  WorkbenchPreview: () => <div data-testid="preview" />,
}))

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock capture
let capturedProps: any = null
vi.mock('./components/WorkbenchConfig', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock
  WorkbenchConfig: (props: any) => {
    capturedProps = props
    return <div data-testid="config" />
  },
}))

describe('Workbench', () => {
  const mockSetCommand = vi.fn()
  const mockStore = {
    setCommand: mockSetCommand,
    files: [
      { name: 'test.sig', timestamp: 1000 },
      { name: 'newer.sig', timestamp: 2000 },
    ],
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock
    vi.mocked(useOpenSSLStore).mockReturnValue(mockStore as any)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock
    ;(useOpenSSLStore as any).getState = vi.fn().mockReturnValue(mockStore)
    capturedProps = null
  })

  it('renders correctly for non-files category', () => {
    render(<Workbench category="genpkey" setCategory={vi.fn()} />)
    expect(capturedProps).toBeTruthy()
    expect(mockSetCommand).toHaveBeenCalledWith(expect.stringContaining('genpkey'))
  })

  it('handles files category without rendering config', () => {
    render(<Workbench category="files" setCategory={vi.fn()} />)
    expect(capturedProps).toBeNull()
  })

  it('handles genpkey with various algorithms', async () => {
    render(<Workbench category="genpkey" setCategory={vi.fn()} />)
    expect(capturedProps).toBeTruthy()

    act(() => {
      capturedProps.setKeyAlgo('rsa')
      capturedProps.setKeyBits('4096')
    })
    await waitFor(() =>
      expect(mockSetCommand).toHaveBeenCalledWith(expect.stringContaining('rsa_keygen_bits:4096'))
    )

    act(() => {
      capturedProps.setKeyAlgo('ec')
      capturedProps.setCurve('P-384')
    })
    await waitFor(() =>
      expect(mockSetCommand).toHaveBeenCalledWith(
        expect.stringContaining('ec_paramgen_curve:P-384')
      )
    )

    act(() => {
      capturedProps.setKeyAlgo('mlkem768')
    })
    await waitFor(() =>
      expect(mockSetCommand).toHaveBeenCalledWith(expect.stringContaining('ML-KEM-768'))
    )

    act(() => {
      capturedProps.setKeyAlgo('mldsa44')
    })
    await waitFor(() =>
      expect(mockSetCommand).toHaveBeenCalledWith(expect.stringContaining('ML-DSA-44'))
    )

    act(() => {
      capturedProps.setKeyAlgo('slhdsa128s')
      capturedProps.setCipher('aes-256-cbc')
    })
    await waitFor(() =>
      expect(mockSetCommand).toHaveBeenCalledWith(expect.stringContaining('SLH-DSA-SHA2-128s'))
    )

    act(() => {
      capturedProps.setKeyAlgo('ed25519')
    })
    await waitFor(() =>
      expect(mockSetCommand).toHaveBeenCalledWith(expect.stringContaining('ed25519'))
    )
  })

  it('handles req and x509 commands', async () => {
    const { rerender } = render(<Workbench category="req" setCategory={vi.fn()} />)

    act(() => {
      capturedProps.setSelectedCsrKeyFile('test-key.key')
    })
    await waitFor(() =>
      expect(mockSetCommand).toHaveBeenCalledWith(
        expect.stringContaining('req -new -key test-key.key')
      )
    )

    rerender(<Workbench category="x509" setCategory={vi.fn()} />)
    await waitFor(() =>
      expect(mockSetCommand).toHaveBeenCalledWith(expect.stringContaining('req -x509 -new'))
    )
  })

  it('handles dgst commands for classic and PQC', async () => {
    render(<Workbench category="dgst" setCategory={vi.fn()} />)

    act(() => {
      capturedProps.setSelectedKeyFile('rsa.key')
      capturedProps.setSignAction('sign')
      capturedProps.setSigHashAlgo('sha512')
    })
    await waitFor(() =>
      expect(mockSetCommand).toHaveBeenCalledWith(
        expect.stringContaining('dgst -sha512 -sign rsa.key')
      )
    )

    act(() => {
      capturedProps.setSigHashAlgo('raw')
      capturedProps.setUseRawIn(true)
    })
    await waitFor(() =>
      expect(mockSetCommand).toHaveBeenCalledWith(
        expect.stringContaining('pkeyutl -sign -inkey rsa.key -in manual_input.bin')
      )
    )
    await waitFor(() =>
      expect(mockSetCommand).toHaveBeenCalledWith(expect.stringContaining('-rawin'))
    )

    act(() => {
      capturedProps.setSignAction('verify')
      capturedProps.setSigHashAlgo('sha256')
    })
    await waitFor(() =>
      expect(mockSetCommand).toHaveBeenCalledWith(
        expect.stringContaining('dgst -sha256 -verify rsa.key')
      )
    )

    act(() => {
      capturedProps.setSigHashAlgo('raw')
    })
    await waitFor(() =>
      expect(mockSetCommand).toHaveBeenCalledWith(
        expect.stringContaining('pkeyutl -verify -pubin -inkey rsa.key -in manual_input.bin')
      )
    )

    act(() => {
      capturedProps.setSelectedKeyFile('mldsa44.key')
      capturedProps.setSignAction('sign')
    })
    await waitFor(() =>
      expect(mockSetCommand).toHaveBeenCalledWith(
        expect.stringContaining('pkeyutl -sign -inkey mldsa44.key')
      )
    )

    act(() => {
      capturedProps.setSignAction('verify')
    })
    await waitFor(() =>
      expect(mockSetCommand).toHaveBeenCalledWith(
        expect.stringContaining('pkeyutl -verify -pubin -inkey mldsa44.key')
      )
    )
  })

  it('handles manual hash parsing in dgst raw mode', async () => {
    render(<Workbench category="dgst" setCategory={vi.fn()} />)
    act(() => {
      capturedProps.setSigHashAlgo('raw')
      capturedProps.setManualHashHex('0x1234')
    })
    await waitFor(() => {
      act(() => {
        capturedProps.setManualHashHex('invalid-hex')
      })
    })
  })

  it('handles rand command', async () => {
    render(<Workbench category="rand" setCategory={vi.fn()} />)
    act(() => {
      capturedProps.setRandHex(true)
      capturedProps.setRandBytes('64')
    })
    await waitFor(() =>
      expect(mockSetCommand).toHaveBeenCalledWith(expect.stringContaining('rand -hex -out'))
    )

    act(() => {
      capturedProps.setRandHex(false)
    })
    await waitFor(() =>
      expect(mockSetCommand).toHaveBeenCalledWith(expect.stringContaining('rand -out'))
    )
  })

  it('handles version and configutl', async () => {
    const { rerender } = render(<Workbench category="version" setCategory={vi.fn()} />)
    await waitFor(() =>
      expect(mockSetCommand).toHaveBeenCalledWith(expect.stringContaining('version -a'))
    )

    rerender(<Workbench category="configutl" setCategory={vi.fn()} />)
    act(() => {
      capturedProps.setConfigUtlInFile('my.cnf')
      capturedProps.setConfigUtlOutFile('out.cnf')
    })
    await waitFor(() =>
      expect(mockSetCommand).toHaveBeenCalledWith(
        expect.stringContaining('configutl -config my.cnf -dump -out out.cnf')
      )
    )
  })

  it('handles enc command', async () => {
    render(<Workbench category="enc" setCategory={vi.fn()} />)
    act(() => {
      capturedProps.setEncAction('encrypt')
      capturedProps.setEncShowIV(true)
      capturedProps.setEncCustomIV('001122')
    })
    await waitFor(() =>
      expect(mockSetCommand).toHaveBeenCalledWith(
        expect.stringContaining('enc -aes-256-cbc -p -iv 001122')
      )
    )

    act(() => {
      capturedProps.setEncAction('decrypt')
      capturedProps.setEncInFile('file.enc')
    })
    await waitFor(() =>
      expect(mockSetCommand).toHaveBeenCalledWith(
        expect.stringContaining('enc -aes-256-cbc -d -p -iv 001122 -in file.enc')
      )
    )
  })

  it('handles hash command', async () => {
    render(<Workbench category="hash" setCategory={vi.fn()} />)
    act(() => {
      capturedProps.setHashAlgo('sha3-256')
      capturedProps.setHashBinary(true)
    })
    await waitFor(() =>
      expect(mockSetCommand).toHaveBeenCalledWith(expect.stringContaining('dgst -sha3-256 -binary'))
    )
  })

  it('handles kem command', async () => {
    render(<Workbench category="kem" setCategory={vi.fn()} />)
    act(() => {
      capturedProps.setKemAction('encap')
    })
    await waitFor(() =>
      expect(mockSetCommand).toHaveBeenCalledWith(
        expect.stringContaining('pkeyutl -encap -inkey public.key')
      )
    )

    act(() => {
      capturedProps.setKemAction('decap')
    })
    await waitFor(() =>
      expect(mockSetCommand).toHaveBeenCalledWith(
        expect.stringContaining('pkeyutl -decap -inkey private.key')
      )
    )
  })

  it('handles pkcs12 command', async () => {
    render(<Workbench category="pkcs12" setCategory={vi.fn()} />)
    act(() => {
      capturedProps.setP12Action('export')
    })
    await waitFor(() =>
      expect(mockSetCommand).toHaveBeenCalledWith(
        expect.stringContaining('pkcs12 -export -in cert.crt')
      )
    )

    act(() => {
      capturedProps.setP12Action('import')
    })
    await waitFor(() =>
      expect(mockSetCommand).toHaveBeenCalledWith(
        expect.stringContaining('pkcs12 -in bundle.p12 -out restored.pem')
      )
    )
  })

  it('handles lms pseudo-commands', async () => {
    render(<Workbench category="lms" setCategory={vi.fn()} />)
    act(() => {
      capturedProps.setLmsMode('verify')
      capturedProps.setLmsSigFile('test.sig')
    })
    await waitFor(() =>
      expect(mockSetCommand).toHaveBeenCalledWith(
        expect.stringContaining('pkeyutl -verify -in data.txt -sigfile test.sig')
      )
    )

    act(() => {
      capturedProps.setLmsMode('sign')
    })
    await waitFor(() =>
      expect(mockSetCommand).toHaveBeenCalledWith(
        expect.stringContaining('pkeyutl -sign -inkey lms.key')
      )
    )

    act(() => {
      capturedProps.setLmsMode('generate')
    })
    await waitFor(() =>
      expect(mockSetCommand).toHaveBeenCalledWith(
        expect.stringContaining('Generate keypair (WASM-only operation)')
      )
    )
  })

  it('handles kdf commands', async () => {
    render(<Workbench category="kdf" setCategory={vi.fn()} />)

    act(() => {
      capturedProps.setKdfBinary(true)
      capturedProps.setKdfOutFile('out.bin')
    })

    // HKDF
    act(() => {
      capturedProps.setKdfAlgo('HKDF')
      capturedProps.setKdfSecret('sec')
      capturedProps.setKdfInfo('inf')
      capturedProps.setKdfSalt('slt')
    })
    await waitFor(() =>
      expect(mockSetCommand).toHaveBeenCalledWith(
        expect.stringContaining(
          'kdf -keylen 32 -out out.bin -binary -kdfopt digest:SHA256 -kdfopt salt:slt -kdfopt key:sec -kdfopt info:inf HKDF'
        )
      )
    )

    // PBKDF2
    act(() => {
      capturedProps.setKdfAlgo('PBKDF2')
      capturedProps.setKdfPass('pwd')
      capturedProps.setKdfIter('2000')
    })
    await waitFor(() =>
      expect(mockSetCommand).toHaveBeenCalledWith(
        expect.stringContaining('-kdfopt pass:pwd -kdfopt iter:2000 PBKDF2')
      )
    )

    // SCRYPT
    act(() => {
      capturedProps.setKdfAlgo('SCRYPT')
      capturedProps.setKdfScryptN('2048')
      capturedProps.setKdfScryptR('16')
      capturedProps.setKdfScryptP('2')
    })
    await waitFor(() =>
      expect(mockSetCommand).toHaveBeenCalledWith(
        expect.stringContaining('-kdfopt N:2048 -kdfopt r:16 -kdfopt p:2 SCRYPT')
      )
    )

    // SSKDF
    act(() => {
      capturedProps.setKdfAlgo('SSKDF')
    })
    await waitFor(() =>
      expect(mockSetCommand).toHaveBeenCalledWith(expect.stringContaining('SSKDF'))
    )
  })
})
