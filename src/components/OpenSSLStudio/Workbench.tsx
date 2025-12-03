import { useState, useEffect } from 'react'
import { useOpenSSLStore } from './store'
import { useOpenSSL } from './hooks/useOpenSSL'
import {
  Play,
  Settings,
  Key,
  FileText,
  Shield,
  Info,
  Download,
  Trash2,
  Edit2,
  ArrowUpDown,
  FileKey,
  Lock,
  FileArchive,
  Database,
  Archive,
  Upload,
  Plus,
} from 'lucide-react'
import {
  sanitizeCountryCode,
  sanitizeOrganization,
  sanitizeCommonName,
} from '../../utils/inputValidation'
import { logEvent } from '../../utils/analytics'
import clsx from 'clsx'
import JSZip from 'jszip'

export const Workbench = () => {
  const { setCommand, isProcessing, addLog } = useOpenSSLStore()
  const { executeCommand } = useOpenSSL()
  const [category, setCategory] = useState<
    'genpkey' | 'req' | 'x509' | 'enc' | 'dgst' | 'rand' | 'version' | 'files' | 'kem' | 'pkcs12'
  >('genpkey')

  // Key Gen State
  const [keyAlgo, setKeyAlgo] = useState('rsa')
  const [keyBits, setKeyBits] = useState('2048')
  const [curve, setCurve] = useState('P-256')
  const [cipher, setCipher] = useState('none')
  const [passphrase, setPassphrase] = useState('password123')

  // Certificate / CSR State
  const [certDays, setCertDays] = useState('365')
  const [commonName, setCommonName] = useState('example.com')
  const [org, setOrg] = useState('My Organization')
  const [country, setCountry] = useState('US')
  const [digestAlgo, setDigestAlgo] = useState('sha256')

  // Sign/Verify State
  const [signAction, setSignAction] = useState<'sign' | 'verify'>('sign')
  const [sigHashAlgo, setSigHashAlgo] = useState('sha256')
  const [selectedKeyFile, setSelectedKeyFile] = useState('')
  const [selectedDataFile, setSelectedDataFile] = useState('')
  const [selectedSigFile, setSelectedSigFile] = useState('')

  // CSR/Cert State - selected private key
  const [selectedCsrKeyFile, setSelectedCsrKeyFile] = useState('')

  // Random Data State
  const [randBytes, setRandBytes] = useState('32')
  const [randHex, setRandHex] = useState(true)

  // File Manager State
  const [sortBy, setSortBy] = useState<'timestamp' | 'type' | 'name'>('timestamp')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Encryption State
  const [encAction, setEncAction] = useState<'encrypt' | 'decrypt'>('encrypt')
  const [encCipher, setEncCipher] = useState('aes-256-cbc')
  const [encInFile, setEncInFile] = useState('')
  const [encOutFile, setEncOutFile] = useState('')
  const [encShowIV, setEncShowIV] = useState(false)
  const [encCustomIV, setEncCustomIV] = useState('')

  // KEM State
  const [kemAction, setKemAction] = useState<'encap' | 'decap'>('encap')
  const [kemKeyFile, setKemKeyFile] = useState('')
  const [kemInFile, setKemInFile] = useState('') // For decap (ciphertext)
  const [kemOutFile, setKemOutFile] = useState('') // For encap (ciphertext) or decap (secret)

  // PKCS#12 State
  const [p12Action, setP12Action] = useState<'export' | 'import'>('export')
  const [p12CertFile, setP12CertFile] = useState('')
  const [p12KeyFile, setP12KeyFile] = useState('')
  const [p12File, setP12File] = useState('')
  const [p12Pass, setP12Pass] = useState('')

  // Auto-select latest signature file when switching to verify or when files change
  // Auto-select latest signature file when switching to verify or when files change
  const files = useOpenSSLStore.getState().files
  useEffect(() => {
    if (category === 'dgst' && signAction === 'verify') {
      const sigFiles = files
        .filter((f) => f.name.endsWith('.sig'))
        .sort((a, b) => b.timestamp - a.timestamp)

      if (sigFiles.length > 0) {
        // Only auto-select if nothing is selected or the selected file no longer exists
        const currentFileExists = sigFiles.some((f) => f.name === selectedSigFile)
        if (!selectedSigFile || !currentFileExists) {
          setSelectedSigFile(sigFiles[0].name)
        }
      }
    }
  }, [category, signAction, files, selectedSigFile])

  // Effect to update command preview
  useEffect(() => {
    let cmd = 'openssl'

    // Sanitize inputs to prevent command injection
    const sanitizedCountry = sanitizeCountryCode(country)
    const sanitizedOrg = sanitizeOrganization(org)
    const sanitizedCN = sanitizeCommonName(commonName)

    // Helper to build Subject DN string
    const subj = `/ C=${sanitizedCountry} /O=${sanitizedOrg}/CN = ${sanitizedCN} `

    if (category === 'genpkey') {
      // Generate descriptive filename with algorithm, variant, and timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5) // Format: 2025-11-28T21-23-45
      let keyName = ''

      if (keyAlgo === 'rsa') {
        keyName = `rsa - ${keyBits} -${timestamp}.key`
        cmd += ` genpkey - algorithm RSA - pkeyopt rsa_keygen_bits:${keyBits} `
      } else if (keyAlgo === 'ec') {
        keyName = `ec - ${curve} -${timestamp}.key`
        cmd += ` genpkey - algorithm EC - pkeyopt ec_paramgen_curve:${curve} `
      } else if (keyAlgo.startsWith('mlkem')) {
        const kemVariant = keyAlgo.replace('mlkem', '')
        keyName = `mlkem - ${kemVariant} -${timestamp}.key`
        cmd += ` genpkey - algorithm ML - KEM - ${kemVariant} `
      } else if (keyAlgo.startsWith('mldsa')) {
        const dsaVariant = keyAlgo.replace('mldsa', '')
        keyName = `mldsa - ${dsaVariant} -${timestamp}.key`
        cmd += ` genpkey - algorithm ML - DSA - ${dsaVariant} `
      } else if (keyAlgo.startsWith('slhdsa')) {
        const slhVariantMap: Record<string, string> = {
          slhdsa256f: 'SLH-DSA-SHA2-256f',
        }
        keyName = `slhdsa-${keyAlgo.replace('slhdsa', '')}-${timestamp}.key`
        // eslint-disable-next-line security/detect-object-injection
        cmd += ` genpkey -algorithm ${slhVariantMap[keyAlgo]} `
      } else {
        keyName = `${keyAlgo}-${timestamp}.key`
        cmd += ` genpkey -algorithm ${keyAlgo} `
      }

      if (cipher !== 'none') {
        cmd += ` -${cipher} -pass pass:${passphrase} `
      }
      cmd += ` -out ${keyName} `
    } else if (category === 'req') {
      const keyFile = selectedCsrKeyFile || 'private.key'
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
      const keyPrefix = keyFile.split('-')[0] // Extract algorithm prefix
      const csrFile = `${keyPrefix}-csr-${timestamp}.csr`
      cmd += ` req -new -key ${keyFile} -out ${csrFile} -${digestAlgo} -subj "${subj}"`
    } else if (category === 'x509') {
      const keyFile = selectedCsrKeyFile || 'private.key'
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
      const keyPrefix = keyFile.split('-')[0] // Extract algorithm prefix
      const certFile = `${keyPrefix}-cert-${timestamp}.crt`
      cmd += ` req -x509 -new -key ${keyFile} -out ${certFile} -days ${certDays} -${digestAlgo} -subj "${subj}"`
    } else if (category === 'dgst') {
      const keyFile = selectedKeyFile || (signAction === 'sign' ? 'private.key' : 'public.key')
      const dataFile = selectedDataFile || 'data.txt'

      // Generate descriptive signature filename based on key and timestamp
      let sigFile = selectedSigFile
      if (!sigFile && signAction === 'sign' && keyFile) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
        // Extract algorithm prefix from key filename
        const keyPrefix = keyFile.split('-')[0] // e.g., "mldsa", "slhdsa", "ed25519"
        sigFile = `${keyPrefix} -sig - ${timestamp}.sig`
      } else if (!sigFile) {
        sigFile = 'data.sig'
      }

      // Check if this is a PQC key (ML-DSA, SLH-DSA) - they use pkeyutl, not dgst
      const isPQCKey = keyFile.includes('mldsa') || keyFile.includes('slhdsa')

      if (isPQCKey) {
        // PQC signatures use pkeyutl (built-in hashing)
        if (signAction === 'sign') {
          cmd += ` pkeyutl - sign - inkey ${keyFile} -in ${dataFile} -out ${sigFile} `
          cmd += ` pkeyutl -sign -inkey ${keyFile} -in ${dataFile} -out ${sigFile} `
        } else {
          cmd += ` pkeyutl -verify -pubin -inkey ${keyFile} -in ${dataFile} -sigfile ${sigFile} `
        }
      } else {
        // Classical signatures use dgst with explicit hash
        cmd += ` dgst -${sigHashAlgo} `
        if (signAction === 'sign') {
          cmd += ` -sign ${keyFile} -out ${sigFile} ${dataFile} `
        } else {
          cmd += ` -verify ${keyFile} -signature ${sigFile} ${dataFile} `
        }
      }
    } else if (category === 'rand') {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
      const extension = randHex ? 'txt' : 'bin'
      const randFile = `random - ${randBytes} bytes - ${timestamp}.${extension} `
      cmd += ` rand`
      if (randHex) cmd += ` -hex`
      cmd += ` -out ${randFile} ${randBytes} `
    } else if (category === 'version') {
      cmd += ` version -a`
    } else if (category === 'enc') {
      const inFile = encInFile || 'data.txt'
      const defaultOutFile =
        encAction === 'encrypt'
          ? `${inFile}.enc`
          : inFile.endsWith('.enc')
            ? inFile.slice(0, -4)
            : `${inFile}.dec`
      const outFile = encOutFile || defaultOutFile

      cmd += ` enc -${encCipher} `
      if (encAction === 'decrypt') cmd += ` -d`
      if (encShowIV) cmd += ` -p`
      if (encCustomIV) cmd += ` -iv ${encCustomIV} `
      cmd += ` -in ${inFile} -out ${outFile} -pass pass:${passphrase} `
    } else if (category === 'kem') {
      const key = kemKeyFile || (kemAction === 'encap' ? 'public.key' : 'private.key')

      if (kemAction === 'encap') {
        const ctFile = kemOutFile || 'ciphertext.bin'
        cmd += ` pkeyutl - encap - inkey ${key} -pubin - out ${ctFile} -secret secret.bin`
      } else {
        const inFile = kemInFile || 'ciphertext.bin'
        const outFile = kemOutFile || 'secret.bin'
        cmd += ` pkeyutl - decap - inkey ${key} -in ${inFile} -out ${outFile} `
      }
    } else if (category === 'pkcs12') {
      if (p12Action === 'export') {
        const cert = p12CertFile || 'cert.crt'
        const key = p12KeyFile || 'private.key'
        const out = p12File || 'bundle.p12'
        cmd += ` pkcs12 -export -in ${cert} -inkey ${key} -out ${out} -passout pass:${p12Pass} `
      } else {
        const inP12 = p12File || 'bundle.p12'
        const outPem = 'restored.pem'
        cmd += ` pkcs12 -in ${inP12} -out ${outPem} -passin pass:${p12Pass} -nodes`
      }
    }

    setCommand(cmd)
  }, [
    category,
    keyAlgo,
    keyBits,
    curve,
    cipher,
    passphrase,
    certDays,
    commonName,
    org,
    country,
    digestAlgo,
    signAction,
    sigHashAlgo,
    randBytes,
    randHex,
    selectedKeyFile,
    selectedDataFile,
    selectedSigFile,
    selectedCsrKeyFile,
    selectedCsrKeyFile,
    encAction,
    encCipher,
    encInFile,
    encOutFile,
    encShowIV,
    encCustomIV,
    kemAction,
    kemKeyFile,
    kemInFile,
    kemOutFile,
    p12Action,
    p12CertFile,
    p12KeyFile,
    p12File,
    p12Pass,
    setCommand,
  ])

  const handleRun = () => {
    executeCommand(useOpenSSLStore.getState().command)
    logEvent('OpenSSL Studio', 'Run Command', category)
  }

  const handleExtractPublicKey = (privateKeyFile: string) => {
    if (!privateKeyFile.endsWith('.key') && !privateKeyFile.endsWith('.pem')) {
      addLog(
        'error',
        `Cannot extract public key: '${privateKeyFile}' does not appear to be a private key file(.key or.pem).`
      )
      return
    }

    // Replace extension or append .pub
    let publicKeyFile = privateKeyFile.replace(/\.(key|pem)$/, '') + '.pub'
    if (publicKeyFile === privateKeyFile + '.pub' && !privateKeyFile.includes('.')) {
      publicKeyFile = privateKeyFile + '.pub'
    }

    const command = `openssl pkey -in ${privateKeyFile} -pubout - out ${publicKeyFile} `
    executeCommand(command)
    logEvent('OpenSSL Studio', 'Extract Public Key')
  }

  const handleBackupAllFiles = async () => {
    const files = useOpenSSLStore.getState().files
    if (files.length === 0) {
      addLog('error', 'No files to backup.')
      return
    }

    try {
      const zip = new JSZip()

      // Add all files to the zip
      files.forEach((file) => {
        zip.file(file.name, file.content)
      })

      // Generate the zip file
      const blob = await zip.generateAsync({ type: 'blob' })

      // Create download link
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `openssl - studio - backup - ${new Date().toISOString().slice(0, 10)}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      addLog('info', `Backed up ${files.length} file(s) to ${a.download} `)
      logEvent('OpenSSL Studio', 'Backup All Files', files.length.toString())
    } catch (error) {
      addLog('error', `Failed to create backup: ${error} `)
    }
  }

  const handleImportFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const zip = new JSZip()
      const contents = await zip.loadAsync(file)

      let importedCount = 0
      const promises: Promise<void>[] = []

      contents.forEach((relativePath, zipEntry) => {
        if (!zipEntry.dir) {
          promises.push(
            zipEntry.async('uint8array').then((content) => {
              useOpenSSLStore.getState().addFile({
                name: relativePath,
                type:
                  relativePath.endsWith('.key') || relativePath.endsWith('.pem')
                    ? 'key'
                    : relativePath.endsWith('.crt') || relativePath.endsWith('.cert')
                      ? 'cert'
                      : relativePath.endsWith('.csr')
                        ? 'csr'
                        : 'binary',
                content,
                size: content.length,
                timestamp: Date.now(),
              })
              importedCount++
            })
          )
        }
      })

      await Promise.all(promises)
      addLog('info', `Imported ${importedCount} file(s) from ${file.name} `)
      logEvent('OpenSSL Studio', 'Import Files', importedCount.toString())

      // Reset the input so the same file can be imported again if needed
      event.target.value = ''
    } catch (error) {
      addLog('error', `Failed to import files: ${error} `)
    }
  }

  return (
    <div className="h-full flex flex-col gap-6 p-4">
      <div className="space-y-4">
        <span className="text-sm font-bold text-muted uppercase tracking-wider block">
          0. Configuration
        </span>
        <button
          onClick={() => {
            const configFile = useOpenSSLStore
              .getState()
              .files.find((f) => f.name === 'openssl.cnf')
            if (configFile) {
              useOpenSSLStore.getState().setEditingFile(configFile)
            } else {
              // If not found (e.g. not loaded yet), maybe show a toast or just nothing
              console.warn('openssl.cnf not found in memory yet')
            }
          }}
          className="w-full p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-muted hover:text-white transition-colors flex items-center gap-2 text-sm"
        >
          <Settings size={16} /> Edit OpenSSL Config (openssl.cnf)
        </button>
      </div>

      <div className="space-y-4">
        <span className="text-sm font-bold text-muted uppercase tracking-wider block">
          1. Select Operation
        </span>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              setCategory('genpkey')
              useOpenSSLStore.getState().setActiveTab('terminal')
              logEvent('OpenSSL Studio', 'Select Category', 'Key Generation')
            }}
            className={clsx(
              'p-3 rounded-lg border text-left transition-colors flex items-center gap-2',
              category === 'genpkey'
                ? 'bg-primary/20 border-primary text-primary'
                : 'bg-white/5 border-white/10 hover:bg-white/10 text-muted'
            )}
          >
            <Key size={16} /> Key Generation
          </button>
          <button
            onClick={() => {
              setCategory('files')
              useOpenSSLStore.getState().setActiveTab('terminal')
              logEvent('OpenSSL Studio', 'Select Category', 'Key Files')
            }}
            className={clsx(
              'p-3 rounded-lg border text-left transition-colors flex items-center gap-2',
              category === 'files'
                ? 'bg-primary/20 border-primary text-primary'
                : 'bg-white/5 border-white/10 hover:bg-white/10 text-muted'
            )}
          >
            <FileKey size={16} /> Key Files
          </button>
          <button
            onClick={() => {
              setCategory('req')
              useOpenSSLStore.getState().setActiveTab('terminal')
              logEvent('OpenSSL Studio', 'Select Category', 'CSR')
            }}
            className={clsx(
              'p-3 rounded-lg border text-left transition-colors flex items-center gap-2',
              category === 'req'
                ? 'bg-primary/20 border-primary text-primary'
                : 'bg-white/5 border-white/10 hover:bg-white/10 text-muted'
            )}
          >
            <FileText size={16} /> CSR (Request)
          </button>
          <button
            onClick={() => {
              setCategory('x509')
              useOpenSSLStore.getState().setActiveTab('terminal')
              logEvent('OpenSSL Studio', 'Select Category', 'Certificate')
            }}
            className={clsx(
              'p-3 rounded-lg border text-left transition-colors flex items-center gap-2',
              category === 'x509'
                ? 'bg-primary/20 border-primary text-primary'
                : 'bg-white/5 border-white/10 hover:bg-white/10 text-muted'
            )}
          >
            <Shield size={16} /> Certificate
          </button>
          <button
            onClick={() => {
              setCategory('dgst')
              useOpenSSLStore.getState().setActiveTab('terminal')
              logEvent('OpenSSL Studio', 'Select Category', 'Sign/Verify')
            }}
            className={clsx(
              'p-3 rounded-lg border text-left transition-colors flex items-center gap-2',
              category === 'dgst'
                ? 'bg-primary/20 border-primary text-primary'
                : 'bg-white/5 border-white/10 hover:bg-white/10 text-muted'
            )}
          >
            <Settings size={16} /> Sign / Verify
          </button>
          <button
            onClick={() => {
              setCategory('rand')
              useOpenSSLStore.getState().setActiveTab('terminal')
              logEvent('OpenSSL Studio', 'Select Category', 'Random Data')
            }}
            className={clsx(
              'p-3 rounded-lg border text-left transition-colors flex items-center gap-2',
              category === 'rand'
                ? 'bg-primary/20 border-primary text-primary'
                : 'bg-white/5 border-white/10 hover:bg-white/10 text-muted'
            )}
          >
            <Shield size={16} /> Random Data
          </button>
          <button
            onClick={() => {
              setCategory('enc')
              useOpenSSLStore.getState().setActiveTab('terminal')
              logEvent('OpenSSL Studio', 'Select Category', 'Encryption')
            }}
            className={clsx(
              'p-3 rounded-lg border text-left transition-colors flex items-center gap-2',
              category === 'enc'
                ? 'bg-primary/20 border-primary text-primary'
                : 'bg-white/5 border-white/10 hover:bg-white/10 text-muted'
            )}
          >
            <Lock size={16} /> Encryption
          </button>
          <button
            onClick={() => {
              setCategory('kem')
              useOpenSSLStore.getState().setActiveTab('terminal')
              logEvent('OpenSSL Studio', 'Select Category', 'KEM')
            }}
            className={clsx(
              'p-3 rounded-lg border text-left transition-colors flex items-center gap-2',
              category === 'kem'
                ? 'bg-primary/20 border-primary text-primary'
                : 'bg-white/5 border-white/10 hover:bg-white/10 text-muted'
            )}
          >
            <Database size={16} /> Key Encap (KEM)
          </button>
          <button
            onClick={() => {
              setCategory('pkcs12')
              useOpenSSLStore.getState().setActiveTab('terminal')
              logEvent('OpenSSL Studio', 'Select Category', 'PKCS#12')
            }}
            className={clsx(
              'p-3 rounded-lg border text-left transition-colors flex items-center gap-2',
              category === 'pkcs12'
                ? 'bg-primary/20 border-primary text-primary'
                : 'bg-white/5 border-white/10 hover:bg-white/10 text-muted'
            )}
          >
            <FileArchive size={16} /> PKCS#12 Bundle
          </button>
          <button
            onClick={() => {
              setCategory('version')
              useOpenSSLStore.getState().setActiveTab('terminal')
              logEvent('OpenSSL Studio', 'Select Category', 'Version Info')
            }}
            className={clsx(
              'p-3 rounded-lg border text-left transition-colors flex items-center gap-2',
              category === 'version'
                ? 'bg-primary/20 border-primary text-primary'
                : 'bg-white/5 border-white/10 hover:bg-white/10 text-muted'
            )}
          >
            <Info size={16} /> Version Info
          </button>
          <button
            onClick={() => {
              useOpenSSLStore.getState().setActiveTab('logs')
              logEvent('OpenSSL Studio', 'Select Category', 'Logs')
            }}
            className={clsx(
              'p-3 rounded-lg border text-left transition-colors flex items-center gap-2',
              useOpenSSLStore.getState().activeTab === 'logs'
                ? 'bg-primary/20 border-primary text-primary'
                : 'bg-white/5 border-white/10 hover:bg-white/10 text-muted'
            )}
          >
            <FileText size={16} /> Operation Logs
          </button>
        </div>
      </div>

      {category === 'rand' && (
        <div className="space-y-4 animate-fade-in">
          <span className="text-sm font-bold text-muted uppercase tracking-wider block">
            2. Configuration
          </span>

          <div className="space-y-3">
            <label htmlFor="rand-bytes-input" className="text-xs text-muted block">
              Number of Bytes
            </label>
            <input
              id="rand-bytes-input"
              type="number"
              value={randBytes}
              onChange={(e) => setRandBytes(e.target.value)}
              className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary"
              min="1"
              max="4096"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="randHex"
              checked={randHex}
              onChange={(e) => setRandHex(e.target.checked)}
              className="rounded border-white/20 bg-black/40 text-primary focus:ring-primary"
            />
            <label htmlFor="randHex" className="text-sm text-white cursor-pointer select-none">
              Output as Hex String
            </label>
          </div>
        </div>
      )}

      {category === 'version' && (
        <div className="space-y-4 animate-fade-in">
          <span className="text-sm font-bold text-muted uppercase tracking-wider block">
            2. Configuration
          </span>
          <div className="text-sm text-muted">
            No configuration needed. This command displays detailed version information about the
            OpenSSL build.
          </div>
        </div>
      )}

      {category === 'enc' && (
        <div className="space-y-4 animate-fade-in">
          <span className="text-sm font-bold text-muted uppercase tracking-wider block">
            2. Configuration
          </span>

          <div className="space-y-3">
            <span className="text-xs text-muted block">Action</span>
            <div className="flex bg-black/40 rounded-lg p-1 border border-white/20">
              <button
                onClick={() => setEncAction('encrypt')}
                className={clsx(
                  'flex-1 py-1.5 rounded text-sm font-medium transition-colors',
                  encAction === 'encrypt' ? 'bg-primary text-white' : 'text-muted hover:text-white'
                )}
              >
                Encrypt
              </button>
              <button
                onClick={() => setEncAction('decrypt')}
                className={clsx(
                  'flex-1 py-1.5 rounded text-sm font-medium transition-colors',
                  encAction === 'decrypt' ? 'bg-primary text-white' : 'text-muted hover:text-white'
                )}
              >
                Decrypt
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <label htmlFor="enc-cipher-select" className="text-xs text-muted block">
              Cipher
            </label>
            <select
              id="enc-cipher-select"
              value={encCipher}
              onChange={(e) => setEncCipher(e.target.value)}
              className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary"
            >
              <option value="aes-128-cbc">AES-128-CBC</option>
              <option value="aes-192-cbc">AES-192-CBC</option>
              <option value="aes-256-cbc">AES-256-CBC</option>
              <option value="aes-128-ctr">AES-128-CTR</option>
              <option value="aes-192-ctr">AES-192-CTR</option>
              <option value="aes-256-ctr">AES-256-CTR</option>
            </select>
          </div>

          <div className="space-y-3">
            <label htmlFor="enc-infile-select" className="text-xs text-muted block">
              Input File
            </label>
            <select
              id="enc-infile-select"
              value={encInFile}
              onChange={(e) => setEncInFile(e.target.value)}
              className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary"
            >
              <option value="">Select a file...</option>
              {useOpenSSLStore.getState().files.map((f) => (
                <option key={f.name} value={f.name}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <label htmlFor="enc-pass-input" className="text-xs text-muted block">
              Passphrase
            </label>
            <input
              id="enc-pass-input"
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary"
              placeholder="Enter encryption password"
            />
          </div>

          <div className="space-y-3">
            <label htmlFor="enc-outfile-input" className="text-xs text-muted block">
              Output File (Optional)
            </label>
            <input
              id="enc-outfile-input"
              type="text"
              value={encOutFile}
              onChange={(e) => setEncOutFile(e.target.value)}
              className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary"
              placeholder={encAction === 'encrypt' ? 'data.enc' : 'data.dec.txt'}
            />
          </div>

          <div className="space-y-3 pt-2 border-t border-white/10">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={encShowIV}
                onChange={(e) => setEncShowIV(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-black/40 text-primary focus:ring-0 focus:ring-offset-0"
              />
              <span className="text-sm text-white">Show Derived Key & IV (-p)</span>
            </label>
          </div>

          <div className="space-y-3">
            <label htmlFor="enc-iv-input" className="text-xs text-muted block">
              Custom IV (Hex, Optional)
            </label>
            <input
              id="enc-iv-input"
              type="text"
              value={encCustomIV}
              onChange={(e) => setEncCustomIV(e.target.value)}
              className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary"
              placeholder="e.g. 0102030405060708..."
            />
          </div>
        </div>
      )}

      {category === 'kem' && (
        <div className="space-y-4 animate-fade-in">
          <span className="text-sm font-bold text-muted uppercase tracking-wider block">
            2. Configuration
          </span>

          <div className="space-y-3">
            <span className="text-xs text-muted block">Action</span>
            <div className="flex bg-black/40 rounded-lg p-1 border border-white/20">
              <button
                onClick={() => setKemAction('encap')}
                className={clsx(
                  'flex-1 py-1.5 rounded text-sm font-medium transition-colors',
                  kemAction === 'encap' ? 'bg-primary text-white' : 'text-muted hover:text-white'
                )}
              >
                Encapsulate
              </button>
              <button
                onClick={() => setKemAction('decap')}
                className={clsx(
                  'flex-1 py-1.5 rounded text-sm font-medium transition-colors',
                  kemAction === 'decap' ? 'bg-primary text-white' : 'text-muted hover:text-white'
                )}
              >
                Decapsulate
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <label htmlFor="kem-key-select" className="text-xs text-muted block">
              {kemAction === 'encap' ? 'Public Key (Recipient)' : 'Private Key (Recipient)'}
            </label>
            <select
              id="kem-key-select"
              value={kemKeyFile}
              onChange={(e) => setKemKeyFile(e.target.value)}
              className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary"
            >
              <option value="">Select a key...</option>
              {useOpenSSLStore
                .getState()
                .files.filter((f) => {
                  if (kemAction === 'encap')
                    return (
                      f.name.endsWith('.pub') || f.name.endsWith('.pem') || f.name.endsWith('.crt')
                    )
                  return f.name.endsWith('.key') || f.name.endsWith('.pem')
                })
                .map((f) => (
                  <option key={f.name} value={f.name}>
                    {f.name}
                  </option>
                ))}
            </select>
          </div>

          {kemAction === 'decap' && (
            <div className="space-y-3">
              <label htmlFor="kem-infile-select" className="text-xs text-muted block">
                Ciphertext File
              </label>
              <select
                id="kem-infile-select"
                value={kemInFile}
                onChange={(e) => setKemInFile(e.target.value)}
                className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary"
              >
                <option value="">Select ciphertext file...</option>
                {useOpenSSLStore.getState().files.map((f) => (
                  <option key={f.name} value={f.name}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-3">
            <label htmlFor="kem-outfile-input" className="text-xs text-muted block">
              Output File (Optional)
            </label>
            <input
              id="kem-outfile-input"
              type="text"
              value={kemOutFile}
              onChange={(e) => setKemOutFile(e.target.value)}
              className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary"
              placeholder={kemAction === 'encap' ? 'ciphertext.bin' : 'secret.bin'}
            />
          </div>
        </div>
      )}

      {category === 'pkcs12' && (
        <div className="space-y-4 animate-fade-in">
          <span className="text-sm font-bold text-muted uppercase tracking-wider block">
            2. Configuration
          </span>

          <div className="space-y-3">
            <span className="text-xs text-muted block">Action</span>
            <div className="flex bg-black/40 rounded-lg p-1 border border-white/20">
              <button
                onClick={() => setP12Action('export')}
                className={clsx(
                  'flex-1 py-1.5 rounded text-sm font-medium transition-colors',
                  p12Action === 'export' ? 'bg-primary text-white' : 'text-muted hover:text-white'
                )}
              >
                Export (.p12)
              </button>
              <button
                onClick={() => setP12Action('import')}
                className={clsx(
                  'flex-1 py-1.5 rounded text-sm font-medium transition-colors',
                  p12Action === 'import' ? 'bg-primary text-white' : 'text-muted hover:text-white'
                )}
              >
                Import (to .pem)
              </button>
            </div>
          </div>

          {p12Action === 'export' ? (
            <>
              <div className="space-y-3">
                <label htmlFor="p12-cert-select" className="text-xs text-muted block">
                  Certificate File
                </label>
                <select
                  id="p12-cert-select"
                  value={p12CertFile}
                  onChange={(e) => setP12CertFile(e.target.value)}
                  className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary"
                >
                  <option value="">Select certificate...</option>
                  {useOpenSSLStore
                    .getState()
                    .files.filter((f) => f.name.endsWith('.crt'))
                    .map((f) => (
                      <option key={f.name} value={f.name}>
                        {f.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="space-y-3">
                <label htmlFor="p12-key-select" className="text-xs text-muted block">
                  Private Key File
                </label>
                <select
                  id="p12-key-select"
                  value={p12KeyFile}
                  onChange={(e) => setP12KeyFile(e.target.value)}
                  className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary"
                >
                  <option value="">Select private key...</option>
                  {useOpenSSLStore
                    .getState()
                    .files.filter((f) => f.name.endsWith('.key') || f.name.endsWith('.pem'))
                    .map((f) => (
                      <option key={f.name} value={f.name}>
                        {f.name}
                      </option>
                    ))}
                </select>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <label htmlFor="p12-file-select" className="text-xs text-muted block">
                PKCS#12 File (.p12)
              </label>
              <select
                id="p12-file-select"
                value={p12File}
                onChange={(e) => setP12File(e.target.value)}
                className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary"
              >
                <option value="">Select .p12 file...</option>
                {useOpenSSLStore
                  .getState()
                  .files.filter((f) => f.name.endsWith('.p12'))
                  .map((f) => (
                    <option key={f.name} value={f.name}>
                      {f.name}
                    </option>
                  ))}
              </select>
            </div>
          )}

          <div className="space-y-3">
            <label htmlFor="p12-pass-input" className="text-xs text-muted block">
              Password
            </label>
            <input
              id="p12-pass-input"
              type="password"
              value={p12Pass}
              onChange={(e) => setP12Pass(e.target.value)}
              className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary"
              placeholder="Enter export/import password"
            />
          </div>
        </div>
      )}

      {category === 'genpkey' && (
        <div className="space-y-4 animate-fade-in">
          <span className="text-sm font-bold text-muted uppercase tracking-wider block">
            2. Configuration
          </span>

          <div className="space-y-3">
            <label htmlFor="key-algo-select" className="text-xs text-muted block">
              Algorithm
            </label>
            <select
              id="key-algo-select"
              value={keyAlgo}
              onChange={(e) => setKeyAlgo(e.target.value)}
              className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary"
            >
              <optgroup label="Classical Algorithms">
                <option value="rsa">RSA (Rivest–Shamir–Adleman)</option>
                <option value="ec">EC (Elliptic Curve)</option>
                <option value="ed25519">Ed25519 (Edwards-curve DSA)</option>
                <option value="x25519">X25519 (Curve25519)</option>
                <option value="ed448">Ed448 (Edwards-curve DSA)</option>
                <option value="x448">X448 (Curve448)</option>
              </optgroup>
              <optgroup label="Post-Quantum Algorithms (KEM)">
                <option value="mlkem512">ML-KEM-512 (FIPS 203)</option>
                <option value="mlkem768">ML-KEM-768 (FIPS 203)</option>
                <option value="mlkem1024">ML-KEM-1024 (FIPS 203)</option>
              </optgroup>
              <optgroup label="Post-Quantum Algorithms (Signature)">
                <option value="mldsa44">ML-DSA-44 (FIPS 204)</option>
                <option value="mldsa65">ML-DSA-65 (FIPS 204)</option>
                <option value="mldsa87">ML-DSA-87 (FIPS 204)</option>
                <option value="slhdsa128s">SLH-DSA-SHA2-128s (FIPS 205)</option>
                <option value="slhdsa128f">SLH-DSA-SHA2-128f (FIPS 205)</option>
                <option value="slhdsa192s">SLH-DSA-SHA2-192s (FIPS 205)</option>
                <option value="slhdsa192f">SLH-DSA-SHA2-192f (FIPS 205)</option>
                <option value="slhdsa256s">SLH-DSA-SHA2-256s (FIPS 205)</option>
                <option value="slhdsa256f">SLH-DSA-SHA2-256f (FIPS 205)</option>
              </optgroup>
            </select>
          </div>

          {keyAlgo === 'rsa' && (
            <div className="space-y-3">
              <label htmlFor="key-bits-select" className="text-xs text-muted block">
                Key Size (Bits)
              </label>
              <select
                id="key-bits-select"
                value={keyBits}
                onChange={(e) => setKeyBits(e.target.value)}
                className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary"
              >
                <option value="2048">2048 bits</option>
                <option value="3072">3072 bits</option>
                <option value="4096">4096 bits</option>
                <option value="8192">8192 bits</option>
              </select>
            </div>
          )}

          {keyAlgo === 'ec' && (
            <div className="space-y-3">
              <label htmlFor="curve-select" className="text-xs text-muted block">
                Elliptic Curve
              </label>
              <select
                id="curve-select"
                value={curve}
                onChange={(e) => setCurve(e.target.value)}
                className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary"
              >
                <option value="P-256">P-256 (prime256v1)</option>
                <option value="P-384">P-384 (secp384r1)</option>
                <option value="P-521">P-521 (secp521r1)</option>
                <option value="secp256k1">secp256k1 (Bitcoin)</option>
              </select>
            </div>
          )}

          <div className="space-y-3">
            <label htmlFor="cipher-select" className="text-xs text-muted block">
              Encryption (Passphrase)
            </label>
            <select
              id="cipher-select"
              value={cipher}
              onChange={(e) => setCipher(e.target.value)}
              className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary"
            >
              <option value="none">None (Unencrypted)</option>
              <option value="aes-256-cbc">AES-256-CBC</option>
              <option value="aes-128-cbc">AES-128-CBC</option>
              <option value="aria-256-cbc">ARIA-256-CBC</option>
              <option value="camellia-256-cbc">Camellia-256-CBC</option>
            </select>
          </div>

          {cipher !== 'none' && (
            <div className="space-y-3 animate-fade-in">
              <label htmlFor="passphrase-input" className="text-xs text-muted block">
                Passphrase
              </label>
              <input
                id="passphrase-input"
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary"
                placeholder="Enter passphrase"
              />
            </div>
          )}
        </div>
      )}

      {(category === 'req' || category === 'x509') && (
        <div className="space-y-4 animate-fade-in">
          <span className="text-sm font-bold text-muted uppercase tracking-wider block">
            2. Subject Information
          </span>

          <div className="space-y-3">
            <label htmlFor="common-name-input" className="text-xs text-muted block">
              Common Name (CN)
            </label>
            <input
              id="common-name-input"
              type="text"
              value={commonName}
              onChange={(e) => setCommonName(e.target.value)}
              className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary"
              placeholder="e.g. example.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-3">
              <label htmlFor="org-input" className="text-xs text-muted block">
                Organization (O)
              </label>
              <input
                id="org-input"
                type="text"
                value={org}
                onChange={(e) => setOrg(e.target.value)}
                className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary"
              />
            </div>
            <div className="space-y-3">
              <label htmlFor="country-input" className="text-xs text-muted block">
                Country (C)
              </label>
              <input
                id="country-input"
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                maxLength={2}
                className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label htmlFor="digest-algo-select" className="text-xs text-muted block">
              Digest Algorithm
            </label>
            <select
              id="digest-algo-select"
              value={digestAlgo}
              onChange={(e) => setDigestAlgo(e.target.value)}
              className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary"
            >
              <option value="sha256">SHA-256</option>
              <option value="sha384">SHA-384</option>
              <option value="sha512">SHA-512</option>
              <option value="sha3-256">SHA3-256</option>
              <option value="sha3-512">SHA3-512</option>
            </select>
          </div>

          <div className="space-y-3 pt-2 border-t border-white/10">
            <label htmlFor="csr-key-select" className="text-xs text-muted block">
              Private Key File
            </label>
            <select
              id="csr-key-select"
              value={selectedCsrKeyFile}
              onChange={(e) => setSelectedCsrKeyFile(e.target.value)}
              className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary"
            >
              <option value="">Select a private key...</option>
              {useOpenSSLStore
                .getState()
                .files.filter((f) => f.name.endsWith('.key'))
                .map((f) => (
                  <option key={f.name} value={f.name}>
                    {f.name}
                  </option>
                ))}
            </select>
            <p className="text-xs text-muted/60">
              Generate a key first using "Key Generation" if you don't have one.
            </p>
          </div>

          {category === 'x509' && (
            <div className="space-y-3 pt-2 border-t border-white/10">
              <label htmlFor="cert-days-input" className="text-xs text-muted block">
                Validity (Days)
              </label>
              <input
                id="cert-days-input"
                type="number"
                value={certDays}
                onChange={(e) => setCertDays(e.target.value)}
                className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary"
              />
            </div>
          )}
        </div>
      )}

      {category === 'dgst' && (
        <div className="space-y-4 animate-fade-in">
          <span className="text-sm font-bold text-muted uppercase tracking-wider block">
            2. Configuration
          </span>

          <div className="space-y-3">
            <span className="text-xs text-muted block">Action</span>
            <div className="flex bg-black/40 rounded-lg p-1 border border-white/20">
              <button
                onClick={() => setSignAction('sign')}
                className={clsx(
                  'flex-1 py-1.5 rounded text-sm font-medium transition-colors',
                  signAction === 'sign' ? 'bg-primary text-white' : 'text-muted hover:text-white'
                )}
              >
                Sign
              </button>
              <button
                onClick={() => setSignAction('verify')}
                className={clsx(
                  'flex-1 py-1.5 rounded text-sm font-medium transition-colors',
                  signAction === 'verify' ? 'bg-primary text-white' : 'text-muted hover:text-white'
                )}
              >
                Verify
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs text-muted block">
              {signAction === 'sign' ? 'Private Key File' : 'Public Key File'}
            </label>
            <select
              value={selectedKeyFile}
              onChange={(e) => setSelectedKeyFile(e.target.value)}
              className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary"
            >
              <option value="">Select a key file...</option>
              {useOpenSSLStore
                .getState()
                .files.filter((f) => {
                  // For signing: only private keys (.key, not .pub), exclude KEM keys
                  if (signAction === 'sign') {
                    return (
                      (f.name.endsWith('.key') || f.name.endsWith('.pem')) &&
                      !f.name.endsWith('.pub') &&
                      !f.name.includes('mlkem') &&
                      !f.name.includes('x25519') &&
                      !f.name.includes('x448.') && // Exclude x448 (KEM)
                      !f.name.includes('_x448')
                    ) // Exclude x448 (KEM)
                  }
                  // For verification: only public keys (.pub), exclude KEM keys
                  return (
                    (f.name.endsWith('.pub') ||
                      f.name.endsWith('.pem') ||
                      f.name.endsWith('.crt')) &&
                    !f.name.includes('mlkem') &&
                    !f.name.includes('x25519') &&
                    !f.name.includes('x448.') && // Exclude x448 (KEM)
                    !f.name.includes('_x448')
                  ) // Exclude x448 (KEM)
                })
                .map((f) => (
                  <option key={f.name} value={f.name}>
                    {f.name}
                  </option>
                ))}
            </select>
            {signAction === 'sign' && (
              <p className="text-xs text-muted/60">
                Only signature keys shown (ML-DSA, SLH-DSA, Ed25519, Ed448, RSA, EC)
              </p>
            )}
          </div>

          {/* Show hash algorithm selector only for classical keys */}
          {selectedKeyFile &&
          !selectedKeyFile.includes('mldsa') &&
          !selectedKeyFile.includes('slhdsa') ? (
            <div className="space-y-3">
              <label htmlFor="sig-hash-algo-select" className="text-xs text-muted block">
                Hash Algorithm
              </label>
              <select
                id="sig-hash-algo-select"
                value={sigHashAlgo}
                onChange={(e) => setSigHashAlgo(e.target.value)}
                className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary"
              >
                <option value="sha256">SHA-256</option>
                <option value="sha384">SHA-384</option>
                <option value="sha512">SHA-512</option>
                <option value="sha3-256">SHA3-256</option>
                <option value="sha3-384">SHA3-384</option>
                <option value="sha3-512">SHA3-512</option>
                <option value="shake128">SHAKE-128</option>
                <option value="shake256">SHAKE-256</option>
                <option value="blake2s256">BLAKE2s-256</option>
                <option value="blake2b512">BLAKE2b-512</option>
              </select>
            </div>
          ) : selectedKeyFile &&
            (selectedKeyFile.includes('mldsa') || selectedKeyFile.includes('slhdsa')) ? (
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-xs text-blue-200">
                <strong>ℹ️ PQC Signature Algorithm</strong>
                <br />
                {selectedKeyFile.includes('mldsa') ? 'ML-DSA' : 'SLH-DSA'} uses built-in hashing
                (SHAKE-256). No external hash algorithm selection needed.
              </p>
            </div>
          ) : null}

          <div className="space-y-3">
            <label className="text-xs text-muted block">
              Data File to {signAction === 'sign' ? 'Sign' : 'Verify'}
            </label>
            <select
              value={selectedDataFile}
              onChange={(e) => setSelectedDataFile(e.target.value)}
              className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary"
            >
              <option value="">Select a data file...</option>
              {useOpenSSLStore
                .getState()
                .files.filter((f) => f.name.endsWith('.txt') || f.name.endsWith('.bin'))
                .map((f) => (
                  <option key={f.name} value={f.name}>
                    {f.name}
                  </option>
                ))}
            </select>
          </div>

          {signAction === 'verify' && (
            <div className="space-y-3">
              <label htmlFor="sig-file-select" className="text-xs text-muted block">
                Signature File
              </label>
              <select
                id="sig-file-select"
                value={selectedSigFile}
                onChange={(e) => setSelectedSigFile(e.target.value)}
                className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary"
              >
                <option value="">Select a signature file...</option>
                {useOpenSSLStore
                  .getState()
                  .files.filter((f) => f.name.endsWith('.sig'))
                  .map((f) => (
                    <option key={f.name} value={f.name}>
                      {f.name}
                    </option>
                  ))}
              </select>
            </div>
          )}

          <button
            onClick={() => {
              const testData = new TextEncoder().encode(
                'Hello, Post-Quantum World! This is test data for signing.'
              )
              useOpenSSLStore.getState().addFile({
                name: 'data.txt',
                type: 'text',
                content: testData,
                size: testData.length,
                timestamp: Date.now(),
              })
              useOpenSSLStore.getState().addLog('info', 'File created: data.txt')
            }}
            className="w-full p-2 rounded-lg border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary text-sm transition-colors"
          >
            Create Test Data File (data.txt)
          </button>
        </div>
      )}

      {category === 'files' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-muted uppercase tracking-wider block">
              File Manager
            </span>
            <div className="flex gap-2">
              <label className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded text-xs font-medium text-white cursor-pointer transition-colors flex items-center gap-2">
                <Plus size={14} /> Add File
                <input
                  type="file"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return

                    try {
                      const content = new Uint8Array(await file.arrayBuffer())
                      useOpenSSLStore.getState().addFile({
                        name: file.name,
                        type: 'binary',
                        content,
                        size: content.length,
                        timestamp: Date.now(),
                      })
                      useOpenSSLStore.getState().addLog('info', `File uploaded: ${file.name} `)
                      useOpenSSLStore.getState().addStructuredLog({
                        command: 'upload',
                        operationType: 'Other',
                        details: `Uploaded file: ${file.name}`,
                        fileName: file.name,
                        fileSize: content.length,
                        executionTime: 0,
                      })
                      // Reset input
                      e.target.value = ''
                    } catch (error) {
                      console.error('Failed to upload file:', error)
                      useOpenSSLStore
                        .getState()
                        .addLog('error', `Failed to upload file: ${file.name} `)
                    }
                  }}
                  className="hidden"
                />
              </label>
              <button
                onClick={handleBackupAllFiles}
                disabled={useOpenSSLStore.getState().files.length === 0}
                className="px-3 py-1.5 bg-primary/20 hover:bg-primary/30 disabled:bg-white/5 disabled:text-white/20 border border-primary/40 disabled:border-white/10 rounded text-xs font-medium text-primary disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                title="Backup all files to ZIP"
              >
                <Archive size={14} /> Backup All
              </button>
              <label className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded text-xs font-medium text-white cursor-pointer transition-colors flex items-center gap-2">
                <Upload size={14} /> Import ZIP
                <input type="file" accept=".zip" onChange={handleImportFiles} className="hidden" />
              </label>
            </div>
          </div>

          {useOpenSSLStore.getState().files.length === 0 ? (
            <div className="text-center py-12 text-white/20 text-sm">
              No files generated yet.
              <br />
              Generate keys, CSRs, or certificates to see them here.
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-white/10">
              <table className="w-full text-sm">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th
                      className="text-left p-3 text-xs font-bold text-muted uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors"
                      onClick={() => {
                        if (sortBy === 'timestamp') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                        } else {
                          setSortBy('timestamp')
                          setSortOrder('desc')
                        }
                      }}
                    >
                      <div className="flex items-center gap-2">
                        Timestamp <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th
                      className="text-left p-3 text-xs font-bold text-muted uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors"
                      onClick={() => {
                        if (sortBy === 'type') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                        } else {
                          setSortBy('type')
                          setSortOrder('asc')
                        }
                      }}
                    >
                      <div className="flex items-center gap-2">
                        Type <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th
                      className="text-left p-3 text-xs font-bold text-muted uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors"
                      onClick={() => {
                        if (sortBy === 'name') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                        } else {
                          setSortBy('name')
                          setSortOrder('asc')
                        }
                      }}
                    >
                      <div className="flex items-center gap-2">
                        Filename <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th className="text-right p-3 text-xs font-bold text-muted uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {useOpenSSLStore
                    .getState()
                    .files.slice()
                    .sort((a, b) => {
                      let comparison = 0
                      if (sortBy === 'timestamp') {
                        comparison = a.timestamp - b.timestamp
                      } else if (sortBy === 'type') {
                        comparison = a.type.localeCompare(b.type)
                      } else {
                        comparison = a.name.localeCompare(b.name)
                      }
                      return sortOrder === 'asc' ? comparison : -comparison
                    })
                    .map((file) => (
                      <tr
                        key={file.name}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                      >
                        <td className="p-3 text-white/70 font-mono text-xs">
                          {new Date(file.timestamp).toLocaleString()}
                        </td>
                        <td className="p-3">
                          <span
                            className={clsx(
                              'px-2 py-1 rounded text-xs font-medium',
                              file.type === 'key'
                                ? 'bg-amber-500/20 text-amber-200'
                                : file.type === 'cert'
                                  ? 'bg-blue-500/20 text-blue-200'
                                  : file.type === 'csr'
                                    ? 'bg-purple-500/20 text-purple-200'
                                    : 'bg-gray-500/20 text-gray-200'
                            )}
                          >
                            {file.type.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3 text-white font-mono text-sm">{file.name}</td>
                        <td className="p-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => useOpenSSLStore.getState().setEditingFile(file)}
                              className="p-1.5 hover:bg-white/10 rounded text-muted hover:text-white transition-colors"
                              title="View/Edit"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => {
                                const content = file.content
                                const blobPart =
                                  typeof content === 'string' ? content : (content as Uint8Array)
                                const blob = new Blob([blobPart as unknown as BlobPart], {
                                  type: 'application/octet-stream',
                                })
                                const url = URL.createObjectURL(blob)
                                const a = document.createElement('a')
                                a.href = url
                                a.download = file.name
                                document.body.appendChild(a)
                                a.click()
                                document.body.removeChild(a)
                                URL.revokeObjectURL(url)
                                logEvent('OpenSSL Studio', 'Download File', file.type)
                              }}
                              className="p-1.5 hover:bg-white/10 rounded text-muted hover:text-white transition-colors"
                              title="Download"
                            >
                              <Download size={14} />
                            </button>
                            {(file.name.endsWith('.key') || file.name.endsWith('.pem')) && (
                              <button
                                onClick={() => handleExtractPublicKey(file.name)}
                                className="p-1.5 hover:bg-primary/20 rounded text-muted hover:text-primary transition-colors"
                                title="Extract Public Key"
                              >
                                <FileKey size={14} />
                              </button>
                            )}
                            <button
                              onClick={() => {
                                useOpenSSLStore.getState().removeFile(file.name)
                                logEvent('OpenSSL Studio', 'Delete File', file.type)
                              }}
                              className="p-1.5 hover:bg-red-500/20 rounded text-muted hover:text-red-400 transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {category !== 'files' && (
        <div className="mt-auto pt-6">
          <button
            onClick={handleRun}
            disabled={isProcessing}
            className="w-full btn-primary flex items-center justify-center gap-2 py-3 text-lg font-bold shadow-lg shadow-primary/20"
          >
            {isProcessing ? <Settings className="animate-spin" /> : <Play fill="currentColor" />}
            Run Command
          </button>
        </div>
      )}
    </div>
  )
}
