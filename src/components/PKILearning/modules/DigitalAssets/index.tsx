import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Trash2, Bitcoin, Hexagon, Zap, GitBranch } from 'lucide-react'
import { useModuleStore } from '../../../../store/useModuleStore'
import { useOpenSSLStore } from '../../../OpenSSLStudio/store'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { BlockchainCryptoIntroduction } from './components/BlockchainCryptoIntroduction'
import { BlockchainExercises } from './components/BlockchainExercises'
import { BitcoinFlow } from './flows/BitcoinFlow'
import { EthereumFlow } from './flows/EthereumFlow'
import { SolanaFlow } from './flows/SolanaFlow'
import { HDWalletFlow } from './flows/HDWalletFlow'

const MODULE_ID = 'digital-assets'

interface ChainOption {
  id: string
  label: string
  description: string
  icon: React.ReactNode
}

const CHAINS: ChainOption[] = [
  {
    id: 'bitcoin',
    label: 'Bitcoin',
    description: 'secp256k1 / ECDSA / SHA-256',
    icon: <Bitcoin size={24} />,
  },
  {
    id: 'ethereum',
    label: 'Ethereum',
    description: 'secp256k1 / ECDSA / Keccak-256',
    icon: <Hexagon size={24} />,
  },
  {
    id: 'solana',
    label: 'Solana',
    description: 'Ed25519 / EdDSA / Base58',
    icon: <Zap size={24} />,
  },
  {
    id: 'hd-wallet',
    label: 'HD Wallet',
    description: 'BIP32 / BIP39 / BIP44',
    icon: <GitBranch size={24} />,
  },
]

export const DigitalAssetsModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState('learn')
  const [activeChain, setActiveChain] = useState<string | null>(null)
  const startTimeRef = useRef(0)
  const { updateModuleProgress, markStepComplete, resetModuleProgress } = useModuleStore()
  const { resetStore } = useOpenSSLStore()

  // Module progress tracking
  useEffect(() => {
    startTimeRef.current = Date.now()
    updateModuleProgress(MODULE_ID, {
      status: 'in-progress',
      lastVisited: Date.now(),
    })

    return () => {
      const elapsedMs = Date.now() - startTimeRef.current
      const elapsedMins = elapsedMs / 60000
      if (elapsedMins > 0) {
        const current = useModuleStore.getState().modules[MODULE_ID]
        updateModuleProgress(MODULE_ID, {
          timeSpent: (current?.timeSpent || 0) + elapsedMins,
        })
      }
    }
  }, [updateModuleProgress])

  // Track tab visits as completed steps
  const handleTabChange = useCallback(
    (tab: string) => {
      markStepComplete(MODULE_ID, activeTab)
      setActiveTab(tab)
    },
    [activeTab, markStepComplete]
  )

  const navigateToWorkshop = useCallback(
    (chain?: string) => {
      markStepComplete(MODULE_ID, activeTab)
      if (chain === 'learn-pqc') {
        // Navigate to Learn tab for PQC content
        setActiveTab('learn')
      } else {
        setActiveTab('workshop')
        if (chain) {
          setActiveChain(chain)
        }
      }
    },
    [activeTab, markStepComplete]
  )

  const handleReset = () => {
    if (
      confirm(
        'Are you sure you want to reset the module? This will clear all generated keys and transactions.'
      )
    ) {
      resetModuleProgress(MODULE_ID)
      resetStore()
      setActiveTab('learn')
      setActiveChain(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Blockchain Cryptography</h1>
          <p className="text-muted-foreground mt-2">
            Master the cryptographic primitives of major blockchains and understand quantum threats.
          </p>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-3 py-2 bg-destructive/10 text-destructive rounded hover:bg-destructive/20 transition-colors text-sm border border-destructive/20"
        >
          <Trash2 size={16} />
          Reset Module
        </button>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="learn">Learn</TabsTrigger>
          <TabsTrigger value="workshop">Workshop</TabsTrigger>
          <TabsTrigger value="exercises">Exercises</TabsTrigger>
        </TabsList>

        {/* Learn Tab */}
        <TabsContent value="learn">
          <BlockchainCryptoIntroduction onNavigateToWorkshop={() => navigateToWorkshop()} />
        </TabsContent>

        {/* Workshop Tab */}
        <TabsContent value="workshop">
          <div className="space-y-6">
            {!activeChain ? (
              <>
                <div className="glass-panel p-6">
                  <h2 className="text-xl font-bold text-gradient mb-2">Choose a Blockchain</h2>
                  <p className="text-muted-foreground text-sm">
                    Select a blockchain to explore its cryptographic primitives hands-on. Each flow
                    walks you through key generation, address derivation, transaction formatting,
                    and digital signing using real cryptographic operations.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {CHAINS.map((chain) => (
                    <button
                      key={chain.id}
                      onClick={() => setActiveChain(chain.id)}
                      className="glass-panel p-6 text-left hover:border-primary/50 transition-colors group"
                    >
                      <div className="text-primary mb-3 group-hover:scale-110 transition-transform">
                        {chain.icon}
                      </div>
                      <h3 className="text-lg font-bold text-foreground mb-1">{chain.label}</h3>
                      <p className="text-xs text-muted-foreground font-mono">{chain.description}</p>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div>
                <button
                  onClick={() => setActiveChain(null)}
                  className="mb-4 px-4 py-2 rounded-lg border border-border hover:bg-muted/50 transition-colors text-sm text-foreground"
                >
                  &larr; Back to Chain Selection
                </button>
                {activeChain === 'bitcoin' && <BitcoinFlow onBack={() => setActiveChain(null)} />}
                {activeChain === 'ethereum' && <EthereumFlow onBack={() => setActiveChain(null)} />}
                {activeChain === 'solana' && <SolanaFlow onBack={() => setActiveChain(null)} />}
                {activeChain === 'hd-wallet' && (
                  <HDWalletFlow onBack={() => setActiveChain(null)} />
                )}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Exercises Tab */}
        <TabsContent value="exercises">
          <BlockchainExercises onNavigateToWorkshop={navigateToWorkshop} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
