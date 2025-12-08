import React from 'react'
import { GenPkeyConfig } from './configs/GenPkeyConfig'
import { RandConfig } from './configs/RandConfig'
import { EncConfig } from './configs/EncConfig'
import { KemConfig } from './configs/KemConfig'
import { Pkcs12Config } from './configs/Pkcs12Config'
import { ReqConfig } from './configs/ReqConfig'
import { X509Config } from './configs/X509Config'
import { DgstConfig } from './configs/DgstConfig'

interface WorkbenchConfigProps {
  category: string
  // State props
  keyAlgo: string
  setKeyAlgo: (value: string) => void
  keyBits: string
  setKeyBits: (value: string) => void
  curve: string
  setCurve: (value: string) => void
  cipher: string
  setCipher: (value: string) => void
  passphrase: string
  setPassphrase: (value: string) => void
  randBytes: string
  setRandBytes: (value: string) => void
  randHex: boolean
  setRandHex: (value: boolean) => void
  encAction: 'encrypt' | 'decrypt'
  setEncAction: (value: 'encrypt' | 'decrypt') => void
  encCipher: string
  setEncCipher: (value: string) => void
  encInFile: string
  setEncInFile: (value: string) => void
  encOutFile: string
  setEncOutFile: (value: string) => void
  encShowIV: boolean
  setEncShowIV: (value: boolean) => void
  encCustomIV: string
  setEncCustomIV: (value: string) => void
  kemAction: 'encap' | 'decap'
  setKemAction: (value: 'encap' | 'decap') => void
  kemKeyFile: string
  setKemKeyFile: (value: string) => void
  kemInFile: string
  setKemInFile: (value: string) => void
  kemOutFile: string
  setKemOutFile: (value: string) => void
  p12Action: 'export' | 'import'
  setP12Action: (value: 'export' | 'import') => void
  p12CertFile: string
  setP12CertFile: (value: string) => void
  p12KeyFile: string
  setP12KeyFile: (value: string) => void
  p12File: string
  setP12File: (value: string) => void
  p12Pass: string
  setP12Pass: (value: string) => void
  selectedCsrKeyFile: string
  setSelectedCsrKeyFile: (value: string) => void
  digestAlgo: string
  setDigestAlgo: (value: string) => void
  commonName: string
  setCommonName: (value: string) => void
  org: string
  setOrg: (value: string) => void
  country: string
  setCountry: (value: string) => void
  certDays: string
  setCertDays: (value: string) => void
  signAction: 'sign' | 'verify'
  setSignAction: (value: 'sign' | 'verify') => void
  sigHashAlgo: string
  setSigHashAlgo: (value: string) => void
  selectedKeyFile: string
  setSelectedKeyFile: (value: string) => void
  selectedDataFile: string
  setSelectedDataFile: (value: string) => void
  selectedSigFile: string
  setSelectedSigFile: (value: string) => void
  // Advanced Signing Options
  manualHashHex: string
  setManualHashHex: (value: string) => void
  useRawIn: boolean
  setUseRawIn: (value: boolean) => void
}

export const WorkbenchConfig: React.FC<WorkbenchConfigProps> = (props) => {
  const { category } = props

  switch (category) {
    case 'genpkey':
      return (
        <GenPkeyConfig
          keyAlgo={props.keyAlgo}
          setKeyAlgo={props.setKeyAlgo}
          keyBits={props.keyBits}
          setKeyBits={props.setKeyBits}
          curve={props.curve}
          setCurve={props.setCurve}
          cipher={props.cipher}
          setCipher={props.setCipher}
          passphrase={props.passphrase}
          setPassphrase={props.setPassphrase}
        />
      )
    case 'rand':
      return (
        <RandConfig
          randBytes={props.randBytes}
          setRandBytes={props.setRandBytes}
          randHex={props.randHex}
          setRandHex={props.setRandHex}
        />
      )
    case 'enc':
      return (
        <EncConfig
          encAction={props.encAction}
          setEncAction={props.setEncAction}
          encCipher={props.encCipher}
          setEncCipher={props.setEncCipher}
          encInFile={props.encInFile}
          setEncInFile={props.setEncInFile}
          encOutFile={props.encOutFile}
          setEncOutFile={props.setEncOutFile}
          encShowIV={props.encShowIV}
          setEncShowIV={props.setEncShowIV}
          encCustomIV={props.encCustomIV}
          setEncCustomIV={props.setEncCustomIV}
          passphrase={props.passphrase}
          setPassphrase={props.setPassphrase}
        />
      )
    case 'kem':
      return (
        <KemConfig
          kemAction={props.kemAction}
          setKemAction={props.setKemAction}
          kemKeyFile={props.kemKeyFile}
          setKemKeyFile={props.setKemKeyFile}
          kemInFile={props.kemInFile}
          setKemInFile={props.setKemInFile}
          kemOutFile={props.kemOutFile}
          setKemOutFile={props.setKemOutFile}
        />
      )
    case 'pkcs12':
      return (
        <Pkcs12Config
          p12Action={props.p12Action}
          setP12Action={props.setP12Action}
          p12CertFile={props.p12CertFile}
          setP12CertFile={props.setP12CertFile}
          p12KeyFile={props.p12KeyFile}
          setP12KeyFile={props.setP12KeyFile}
          p12File={props.p12File}
          setP12File={props.setP12File}
          p12Pass={props.p12Pass}
          setP12Pass={props.setP12Pass}
        />
      )
    case 'req':
      return (
        <ReqConfig
          selectedCsrKeyFile={props.selectedCsrKeyFile}
          setSelectedCsrKeyFile={props.setSelectedCsrKeyFile}
          digestAlgo={props.digestAlgo}
          setDigestAlgo={props.setDigestAlgo}
          commonName={props.commonName}
          setCommonName={props.setCommonName}
          org={props.org}
          setOrg={props.setOrg}
          country={props.country}
          setCountry={props.setCountry}
        />
      )
    case 'x509':
      return (
        <X509Config
          selectedCsrKeyFile={props.selectedCsrKeyFile}
          setSelectedCsrKeyFile={props.setSelectedCsrKeyFile}
          certDays={props.certDays}
          setCertDays={props.setCertDays}
          digestAlgo={props.digestAlgo}
          setDigestAlgo={props.setDigestAlgo}
          commonName={props.commonName}
          setCommonName={props.setCommonName}
          org={props.org}
          setOrg={props.setOrg}
          country={props.country}
          setCountry={props.setCountry}
        />
      )
    case 'dgst':
      return (
        <DgstConfig
          signAction={props.signAction}
          setSignAction={props.setSignAction}
          sigHashAlgo={props.sigHashAlgo}
          setSigHashAlgo={props.setSigHashAlgo}
          selectedKeyFile={props.selectedKeyFile}
          setSelectedKeyFile={props.setSelectedKeyFile}
          selectedDataFile={props.selectedDataFile}
          setSelectedDataFile={props.setSelectedDataFile}
          selectedSigFile={props.selectedSigFile}
          setSelectedSigFile={props.setSelectedSigFile}
          manualHashHex={props.manualHashHex}
          setManualHashHex={props.setManualHashHex}
          useRawIn={props.useRawIn}
          setUseRawIn={props.setUseRawIn}
        />
      )
    case 'version':
      return (
        <div className="space-y-4 animate-fade-in">
          <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider block">
            2. Configuration
          </span>
          <div className="text-sm text-muted-foreground">
            No configuration needed. This command displays detailed version information about the
            OpenSSL build.
          </div>
        </div>
      )
    default:
      return null
  }
}
