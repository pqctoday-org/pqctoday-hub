import React, { useState } from 'react'
import { PenTool, Loader2 } from 'lucide-react'
import { openSSLService } from '../../../../services/crypto/OpenSSLService'

interface SignatureDemoProps {
  onComplete: () => void
}

export const SignatureDemo: React.FC<SignatureDemoProps> = ({ onComplete }) => {
  const [message, setMessage] = useState('Hello, PKI World!')
  const [signature, setSignature] = useState<string | null>(null)
  const [isSigning, setIsSigning] = useState(false)

  const handleSign = async () => {
    setIsSigning(true)

    try {
      // 1. Generate a temporary key for signing
      const keyResult = await openSSLService.execute(
        'openssl genpkey -algorithm ED25519 -out sign.key'
      )
      const keyFile = keyResult.files.find((f) => f.name === 'sign.key')

      if (!keyFile) throw new Error('Failed to generate signing key')

      // 2. Create message file
      const msgFile = { name: 'message.txt', data: new TextEncoder().encode(message) }

      // 3. Sign the message
      // openssl pkeyutl -sign -inkey sign.key -rawin -in message.txt -out signature.bin
      const signCmd =
        'openssl pkeyutl -sign -inkey sign.key -rawin -in message.txt -out signature.bin'
      const signResult = await openSSLService.execute(signCmd, [keyFile, msgFile])

      const sigFile = signResult.files.find((f) => f.name === 'signature.bin')
      if (sigFile) {
        // Convert binary signature to hex for display
        const hexSig = Array.from(sigFile.data)
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')
        setSignature(hexSig)
        onComplete()
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsSigning(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">1. Create Message</h3>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full h-32 bg-black/20 border border-white/10 rounded p-3 text-white resize-none"
            placeholder="Enter a message to sign..."
          />

          <button
            onClick={handleSign}
            disabled={isSigning || !message}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-black font-bold rounded hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isSigning ? <Loader2 className="animate-spin" /> : <PenTool size={16} />}
            Sign Message
          </button>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">2. Digital Signature</h3>
          <div className="bg-black/40 rounded-lg p-4 border border-white/10 h-32 overflow-y-auto custom-scrollbar">
            {signature ? (
              <code className="text-xs text-blue-300 break-all">{signature}</code>
            ) : (
              <p className="text-muted text-sm italic">Signature will appear here...</p>
            )}
          </div>

          {signature && (
            <div className="text-sm text-muted">
              <p>This unique signature proves that:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>The message came from you (Authentication)</li>
                <li>The message hasn't been changed (Integrity)</li>
                <li>You cannot deny signing it (Non-repudiation)</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
