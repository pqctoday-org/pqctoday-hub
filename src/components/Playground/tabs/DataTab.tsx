import React from 'react'
import { Database, FileSignature, Lock, Key as KeyIcon } from 'lucide-react'
import { DataInput } from '../DataInput'
import { useOperationsContext } from '../contexts/OperationsContext'

export const DataTab: React.FC = () => {
  const {
    dataToSign,
    setDataToSign,
    signature,
    setSignature,
    dataToEncrypt,
    setDataToEncrypt,
    decryptedData,
    setDecryptedData,
    sharedSecret,
  } = useOperationsContext()

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <h4 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border pb-2 mb-6">
        <Database size={18} className="text-accent" /> Data Management
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Signing Section */}
        <div className="space-y-6">
          <h5 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <FileSignature size={14} /> Signing & Verification
          </h5>
          <DataInput
            label="Data to Sign / Verify"
            value={dataToSign}
            onChange={setDataToSign}
            placeholder="Enter message to sign..."
          />
          <DataInput
            label="Signature"
            value={signature}
            onChange={setSignature}
            placeholder="Signature will appear here..."
            inputType="binary"
          />
        </div>

        {/* Encryption Section */}
        <div className="space-y-6">
          <h5 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Lock size={14} /> Encryption & Decryption
          </h5>
          <DataInput
            label="Data to Encrypt"
            value={dataToEncrypt}
            onChange={setDataToEncrypt}
            placeholder="Enter message to encrypt..."
          />
          <DataInput
            label="Decrypted Data"
            value={decryptedData}
            onChange={setDecryptedData}
            placeholder="Decrypted message will appear here..."
            readOnly={true}
          />
        </div>
      </div>

      {/* Shared Secret */}
      <div className="mt-8 pt-6 border-t border-border">
        <h5 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2 mb-4">
          <KeyIcon size={14} /> Shared Secret (ML-KEM)
        </h5>
        <DataInput
          label="Established Shared Secret"
          value={sharedSecret}
          onChange={() => {}} // Read-only mostly
          readOnly={true}
          placeholder="Shared secret will appear here after encapsulation..."
          height="h-16"
          inputType="binary"
        />
      </div>
    </div>
  )
}
