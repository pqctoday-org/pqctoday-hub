import React from 'react'
import { HDWalletFlow } from './flows/HDWalletFlow'
import { ArrowLeft } from 'lucide-react'

interface HDWalletImplementationProps {
  onBack: () => void
}

export const HDWalletImplementation: React.FC<HDWalletImplementationProps> = ({ onBack }) => {
  return (
    <div className="space-y-6 text-foreground">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft size={20} />
        Back to Modules
      </button>
      <h2 className="text-2xl font-bold mb-4">Part 6: HD Wallet Implementation</h2>

      <section>
        <h3 className="text-xl font-semibold mb-3">6.1 Hierarchical Deterministic (HD) Overview</h3>
        <div className="bg-black/30 p-4 rounded-lg font-mono text-sm overflow-x-auto mb-6">
          <pre className="whitespace-pre-wrap break-all">{`
BIP32 / BIP39 / BIP44 Standard:

   ┌──────────────┐
   │   Mnemonic   │  (12-24 words)
   └──────────────┘
          │
          ▼
   ┌──────────────┐
   │     Seed     │  (512 bits)
   └──────────────┘
          │
          ▼
   ┌──────────────┐
   │  Master Key  │  (m)
   └──────────────┘
          │
          ├── m/44'/0'/0'/0/0  ──▶ Bitcoin Address 1
          │
          ├── m/44'/60'/0'/0/0 ──▶ Ethereum Address 1
          │
          └── m/44'/501'/0'/0' ──▶ Solana Address 1
          `}</pre>
        </div>
      </section>

      <section>
        <h3 className="text-xl font-semibold mb-3">6.2 Interactive HD Wallet Generator</h3>
        <p className="text-muted-foreground mb-4">
          This interactive tool uses a hybrid approach: <strong>OpenSSL</strong> generates the
          entropy, and <strong>JavaScript</strong> libraries (Scure/Noble) handle the BIP39/BIP32
          derivation which OpenSSL does not support natively.
        </p>

        <HDWalletFlow />
      </section>
    </div>
  )
}
