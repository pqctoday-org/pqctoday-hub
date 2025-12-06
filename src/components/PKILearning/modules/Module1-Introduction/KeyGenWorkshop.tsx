import React, { useState } from 'react'
import { Play, Check, Loader2 } from 'lucide-react'
import { openSSLService } from '../../../../services/crypto/OpenSSLService'

interface KeyGenWorkshopProps {
  onComplete: () => void
}

export const KeyGenWorkshop: React.FC<KeyGenWorkshopProps> = ({ onComplete }) => {
  const [algorithm, setAlgorithm] = useState('RSA')
  const [keySize, setKeySize] = useState('2048')
  const [output, setOutput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedKey, setGeneratedKey] = useState<string | null>(null)

  const handleGenerate = async () => {
    setIsGenerating(true)
    setOutput('')
    setGeneratedKey(null)

    try {
      let command = ''
      if (algorithm === 'RSA') {
        command = `openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:${keySize} -out private.key`
      } else if (algorithm === 'EC') {
        command = `openssl genpkey -algorithm EC -pkeyopt ec_paramgen_curve:${keySize} -out private.key`
      } else if (algorithm === 'ED25519') {
        command = `openssl genpkey -algorithm ED25519 -out private.key`
      }

      setOutput(`$ ${command}\n`)

      const result = await openSSLService.execute(command)

      if (result.error) {
        setOutput((prev) => prev + `Error: ${result.error}\n`)
        return
      }

      setOutput((prev) => prev + result.stdout + result.stderr + '\nKey generated successfully!\n')

      // Get the key content
      const keyFile = result.files.find((f) => f.name === 'private.key')
      if (keyFile) {
        const keyContent = new TextDecoder().decode(keyFile.data)
        setGeneratedKey(keyContent)

        // Also generate public key for display
        const pubCmd = `openssl pkey -in private.key -pubout -out public.key`
        setOutput((prev) => prev + `\n$ ${pubCmd}\n`)

        // We need to pass the private key file to the next command
        const pubResult = await openSSLService.execute(pubCmd, [keyFile])
        const pubFile = pubResult.files.find((f) => f.name === 'public.key')

        if (pubFile) {
          const pubContent = new TextDecoder().decode(pubFile.data)
          setOutput((prev) => prev + pubContent)
        }

        onComplete()
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setOutput((prev) => prev + `System Error: ${errorMessage}\n`)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Configuration</h3>

          <div>
            <label htmlFor="algo-select" className="block text-sm text-muted-foreground mb-1">
              Algorithm
            </label>
            <select
              id="algo-select"
              value={algorithm}
              onChange={(e) => {
                setAlgorithm(e.target.value)
                if (e.target.value === 'EC') setKeySize('P-256')
                else if (e.target.value === 'RSA') setKeySize('2048')
              }}
              className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-foreground"
            >
              <option value="RSA">RSA (Classic)</option>
              <option value="EC">Elliptic Curve (Modern)</option>
              <option value="ED25519">Ed25519 (Fast & Secure)</option>
            </select>
          </div>

          {algorithm !== 'ED25519' && (
            <div>
              <label htmlFor="size-select" className="block text-sm text-muted-foreground mb-1">
                {algorithm === 'RSA' ? 'Key Size (bits)' : 'Curve'}
              </label>
              <select
                id="size-select"
                value={keySize}
                onChange={(e) => setKeySize(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-foreground"
              >
                {algorithm === 'RSA' ? (
                  <>
                    <option value="2048">2048 (Standard)</option>
                    <option value="4096">4096 (High Security)</option>
                  </>
                ) : (
                  <>
                    <option value="P-256">P-256 (NIST)</option>
                    <option value="P-384">P-384 (NIST)</option>
                  </>
                )}
              </select>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-black font-bold rounded hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isGenerating ? <Loader2 className="animate-spin" /> : <Play size={16} />}
            Generate Key Pair
          </button>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Output</h3>
          <div className="bg-black/40 rounded-lg p-4 font-mono text-sm h-[300px] overflow-y-auto custom-scrollbar border border-white/10">
            <pre className="text-green-400 whitespace-pre-wrap">{output}</pre>
          </div>
        </div>
      </div>

      {generatedKey && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex items-start gap-3">
          <Check className="text-green-400 shrink-0 mt-1" />
          <div>
            <h4 className="font-bold text-green-400">Success!</h4>
            <p className="text-sm text-green-300/80">
              You have successfully generated a {algorithm} key pair using OpenSSL. The private key
              is kept secure, and the public key can be shared.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
