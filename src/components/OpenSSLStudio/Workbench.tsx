import { useState, useEffect } from 'react'
import { useOpenSSLStore } from './store'
import { WorkbenchToolbar } from './components/WorkbenchToolbar'
import { WorkbenchHeader } from './components/WorkbenchHeader'
import { WorkbenchConfig } from './components/WorkbenchConfig'
import { WorkbenchFileManager } from './components/WorkbenchFileManager'
import { WorkbenchPreview } from './components/WorkbenchPreview'
import {
  sanitizeCountryCode,
  sanitizeOrganization,
  sanitizeCommonName,
} from '../../utils/inputValidation'

export const Workbench = () => {
  const { setCommand, files } = useOpenSSLStore()
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
    const subj = `/C=${sanitizedCountry}/O=${sanitizedOrg}/CN=${sanitizedCN}`

    if (category === 'genpkey') {
      // Generate descriptive filename with algorithm, variant, and timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5) // Format: 2025-11-28T21-23-45
      let keyName = ''

      if (keyAlgo === 'rsa') {
        keyName = `rsa-${keyBits}-${timestamp}.key`
        cmd += ` genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:${keyBits}`
      } else if (keyAlgo === 'ec') {
        keyName = `ec-${curve}-${timestamp}.key`
        cmd += ` genpkey -algorithm EC -pkeyopt ec_paramgen_curve:${curve}`
      } else if (keyAlgo.startsWith('mlkem')) {
        const kemVariant = keyAlgo.replace('mlkem', '')
        keyName = `mlkem-${kemVariant}-${timestamp}.key`
        cmd += ` genpkey -algorithm ML-KEM-${kemVariant}`
      } else if (keyAlgo.startsWith('mldsa')) {
        const dsaVariant = keyAlgo.replace('mldsa', '')
        keyName = `mldsa-${dsaVariant}-${timestamp}.key`
        cmd += ` genpkey -algorithm ML-DSA-${dsaVariant}`
      } else if (keyAlgo.startsWith('slhdsa')) {
        const slhVariantMap: Record<string, string> = {
          slhdsa128s: 'SLH-DSA-SHA2-128s',
          slhdsa128f: 'SLH-DSA-SHA2-128f',
          slhdsa192s: 'SLH-DSA-SHA2-192s',
          slhdsa192f: 'SLH-DSA-SHA2-192f',
          slhdsa256s: 'SLH-DSA-SHA2-256s',
          slhdsa256f: 'SLH-DSA-SHA2-256f',
          slhdsashake128s: 'SLH-DSA-SHAKE-128s',
          slhdsashake128f: 'SLH-DSA-SHAKE-128f',
          slhdsashake192s: 'SLH-DSA-SHAKE-192s',
          slhdsashake192f: 'SLH-DSA-SHAKE-192f',
          slhdsashake256s: 'SLH-DSA-SHAKE-256s',
          slhdsashake256f: 'SLH-DSA-SHAKE-256f',
        }
        keyName = `slhdsa-${keyAlgo.replace('slhdsa', '')}-${timestamp}.key`
        // eslint-disable-next-line security/detect-object-injection
        cmd += ` genpkey -algorithm ${slhVariantMap[keyAlgo]}`
      } else {
        keyName = `${keyAlgo}-${timestamp}.key`
        cmd += ` genpkey -algorithm ${keyAlgo}`
      }

      if (cipher !== 'none') {
        cmd += ` -${cipher} -pass pass:${passphrase}`
      }
      cmd += ` -out ${keyName}`
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
        sigFile = `${keyPrefix}-sig-${timestamp}.sig`
      } else if (!sigFile) {
        sigFile = 'data.sig'
      }

      // Check if this is a PQC key (ML-DSA, SLH-DSA) - they use pkeyutl, not dgst
      const isPQCKey = keyFile.includes('mldsa') || keyFile.includes('slhdsa')

      if (isPQCKey) {
        // PQC signatures use pkeyutl (built-in hashing)
        if (signAction === 'sign') {
          cmd += ` pkeyutl -sign -inkey ${keyFile} -in ${dataFile} -out ${sigFile}`
        } else {
          cmd += ` pkeyutl -verify -pubin -inkey ${keyFile} -in ${dataFile} -sigfile ${sigFile}`
        }
      } else {
        // Classical signatures use dgst with explicit hash
        cmd += ` dgst -${sigHashAlgo}`
        if (signAction === 'sign') {
          cmd += ` -sign ${keyFile} -out ${sigFile} ${dataFile}`
        } else {
          cmd += ` -verify ${keyFile} -signature ${sigFile} ${dataFile}`
        }
      }
    } else if (category === 'rand') {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
      const extension = randHex ? 'txt' : 'bin'
      const randFile = `random-${randBytes}bytes-${timestamp}.${extension}`
      cmd += ` rand`
      if (randHex) cmd += ` -hex`
      cmd += ` -out ${randFile} ${randBytes}`
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

      cmd += ` enc -${encCipher}`
      if (encAction === 'decrypt') cmd += ` -d`
      if (encShowIV) cmd += ` -p`
      if (encCustomIV) cmd += ` -iv ${encCustomIV}`
      cmd += ` -in ${inFile} -out ${outFile} -pass pass:${passphrase}`
    } else if (category === 'kem') {
      const key = kemKeyFile || (kemAction === 'encap' ? 'public.key' : 'private.key')

      if (kemAction === 'encap') {
        const ctFile = kemOutFile || 'ciphertext.bin'
        cmd += ` pkeyutl -encap -inkey ${key} -pubin -out ${ctFile} -secret secret.bin`
      } else {
        const inFile = kemInFile || 'ciphertext.bin'
        const outFile = kemOutFile || 'secret.bin'
        cmd += ` pkeyutl -decap -inkey ${key} -in ${inFile} -out ${outFile}`
      }
    } else if (category === 'pkcs12') {
      if (p12Action === 'export') {
        const cert = p12CertFile || 'cert.crt'
        const key = p12KeyFile || 'private.key'
        const out = p12File || 'bundle.p12'
        cmd += ` pkcs12 -export -in ${cert} -inkey ${key} -out ${out} -passout pass:${p12Pass}`
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

  return (
    <div className="h-full flex flex-col gap-6 p-4">
      <WorkbenchHeader />
      <WorkbenchToolbar category={category} setCategory={setCategory} />

      {category === 'files' ? (
        <WorkbenchFileManager />
      ) : (
        <>
          <WorkbenchConfig
            category={category}
            keyAlgo={keyAlgo}
            setKeyAlgo={setKeyAlgo}
            keyBits={keyBits}
            setKeyBits={setKeyBits}
            curve={curve}
            setCurve={setCurve}
            cipher={cipher}
            setCipher={setCipher}
            passphrase={passphrase}
            setPassphrase={setPassphrase}
            randBytes={randBytes}
            setRandBytes={setRandBytes}
            randHex={randHex}
            setRandHex={setRandHex}
            encAction={encAction}
            setEncAction={setEncAction}
            encCipher={encCipher}
            setEncCipher={setEncCipher}
            encInFile={encInFile}
            setEncInFile={setEncInFile}
            encOutFile={encOutFile}
            setEncOutFile={setEncOutFile}
            encShowIV={encShowIV}
            setEncShowIV={setEncShowIV}
            encCustomIV={encCustomIV}
            setEncCustomIV={setEncCustomIV}
            kemAction={kemAction}
            setKemAction={setKemAction}
            kemKeyFile={kemKeyFile}
            setKemKeyFile={setKemKeyFile}
            kemInFile={kemInFile}
            setKemInFile={setKemInFile}
            kemOutFile={kemOutFile}
            setKemOutFile={setKemOutFile}
            p12Action={p12Action}
            setP12Action={setP12Action}
            p12CertFile={p12CertFile}
            setP12CertFile={setP12CertFile}
            p12KeyFile={p12KeyFile}
            setP12KeyFile={setP12KeyFile}
            p12File={p12File}
            setP12File={setP12File}
            p12Pass={p12Pass}
            setP12Pass={setP12Pass}
            selectedCsrKeyFile={selectedCsrKeyFile}
            setSelectedCsrKeyFile={setSelectedCsrKeyFile}
            digestAlgo={digestAlgo}
            setDigestAlgo={setDigestAlgo}
            commonName={commonName}
            setCommonName={setCommonName}
            org={org}
            setOrg={setOrg}
            country={country}
            setCountry={setCountry}
            certDays={certDays}
            setCertDays={setCertDays}
            signAction={signAction}
            setSignAction={setSignAction}
            sigHashAlgo={sigHashAlgo}
            setSigHashAlgo={setSigHashAlgo}
            selectedKeyFile={selectedKeyFile}
            setSelectedKeyFile={setSelectedKeyFile}
            selectedDataFile={selectedDataFile}
            setSelectedDataFile={setSelectedDataFile}
            selectedSigFile={selectedSigFile}
            setSelectedSigFile={setSelectedSigFile}
          />
          <WorkbenchPreview category={category} />
        </>
      )}
    </div>
  )
}
