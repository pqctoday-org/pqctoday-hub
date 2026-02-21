import React, { useState } from 'react'
import { ShieldAlert, Loader2 } from 'lucide-react'
import { openSSLService } from '../../../../services/crypto/OpenSSLService'
import { useModuleStore } from '../../../../store/useModuleStore'
import { useOpenSSLStore } from '../../../OpenSSLStudio/store'

interface CRLGeneratorProps {
  onComplete: () => void
}

export const CRLGenerator: React.FC<CRLGeneratorProps> = ({ onComplete }) => {
  const { artifacts } = useModuleStore()
  const { addFile } = useOpenSSLStore()

  const [selectedKeyId, setSelectedKeyId] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [output, setOutput] = useState('')
  const [crlContent, setCrlContent] = useState<string | null>(null)

  const rootCAs = artifacts.certificates.filter(
    (c) => c.tags.includes('root') && c.tags.includes('ca')
  )
  const rootKeys = artifacts.keys.filter((k) => k.description === 'Root CA Private Key')

  const handleGenerate = async () => {
    if (!selectedKeyId) return
    setIsGenerating(true)
    setOutput('')
    setCrlContent(null)

    try {
      const caKey = rootKeys.find((k) => k.id === selectedKeyId)
      const caCert =
        rootCAs.find((c) => c.keyPairId === selectedKeyId) ||
        rootCAs.find((c) => c.name === caKey?.name.replace(' Key', ''))

      if (!caKey || !caCert) {
        throw new Error('Could not find matching Root CA certificate and key.')
      }

      // 1. Prepare index.txt (empty initially, so no revoked certs)
      const indexFile = { name: 'index.txt', data: new TextEncoder().encode('') }

      // 2. Prepare crlnumber file (start with 1000)
      const crlNumberFile = { name: 'crlnumber', data: new TextEncoder().encode('1000\\n') }

      // 3. Prepare config file for CA
      const configContent = `
[ ca ]
default_ca = my_ca

[ my_ca ]
database = index.txt
crlnumber = crlnumber
default_md = sha256
default_crl_days = 30
preserve = no
`
      const configFile = { name: 'crl.conf', data: new TextEncoder().encode(configContent) }

      const keyFile = { name: caKey.name, data: new TextEncoder().encode(caKey.privateKey!) }
      const certFile = { name: caCert.name, data: new TextEncoder().encode(caCert.pem) }

      const timestamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 14)
      const crlName = `pkiworkshop_crl_${timestamp}.crl`

      const cmd = `openssl ca -gencrl -keyfile "${caKey.name}" -cert "${caCert.name}" -out "${crlName}" -config crl.conf`
      setOutput((prev) => prev + `$ ${cmd}\\n\\n`)

      const result = await openSSLService.execute(cmd, [
        keyFile,
        certFile,
        indexFile,
        crlNumberFile,
        configFile,
      ])

      if (result.error || result.stderr.includes('error')) {
        throw new Error(result.error || result.stderr)
      }

      const generatedFile = result.files.find((f) => f.name === crlName)
      if (!generatedFile) {
        throw new Error('CRL file not found in output')
      }

      const crlText = new TextDecoder().decode(generatedFile.data)
      setCrlContent(crlText)

      // Also sync to OpenSSL Studio for parsing
      addFile({
        name: crlName,
        type: 'text',
        content: generatedFile.data,
        size: generatedFile.data.length,
        timestamp: Date.now(),
      })

      setOutput(
        (prev) =>
          prev +
          `CRL Generated successfully!\\nNote: This is an empty CRL (no certificates revoked). To parse it, use "openssl crl -in ${crlName} -text -noout" in the OpenSSL Studio.\\n`
      )

      onComplete()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setOutput((prev) => prev + `Error: ${errorMessage}\\n`)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="glass-panel p-5 border border-white/10">
        <div className="mb-4 border-b border-white/10 pb-3">
          <h3 className="text-lg font-bold text-foreground flex items-center gap-3">
            <span className="text-primary font-mono text-xl">01</span>
            <span className="text-foreground/80">|</span>
            GENERATE REVOCATION LIST (CRL)
          </h3>
          <p className="text-xs text-muted-foreground mt-1 ml-11">
            Create an empty Certificate Revocation List signed by your Root CA
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="ca-key-select" className="text-sm text-muted-foreground">
              Select Root CA Key
            </label>
            <select
              id="ca-key-select"
              value={selectedKeyId}
              onChange={(e) => setSelectedKeyId(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-foreground text-sm focus:outline-none focus:border-primary/50"
            >
              <option value="">-- Select CA Key --</option>
              {rootKeys.map((key) => (
                <option key={key.id} value={key.id}>
                  {key.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !selectedKeyId}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-primary text-black font-bold rounded hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isGenerating ? <Loader2 className="animate-spin" /> : <ShieldAlert />}
            Generate Empty CRL
          </button>
        </div>
      </div>

      {/* Output Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Console Output</h3>
        <div className="bg-black/40 rounded-lg p-4 font-mono text-xs h-[300px] overflow-y-auto custom-scrollbar border border-white/10">
          <pre className="text-accent-foreground whitespace-pre-wrap break-all break-words max-w-full">
            {output}
          </pre>
          {crlContent && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-muted-foreground mb-2">Generated CRL:</p>
              <pre className="text-foreground whitespace-pre-wrap break-all break-words max-w-full">
                {crlContent}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
