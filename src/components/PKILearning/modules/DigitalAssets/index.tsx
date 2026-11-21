// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState } from 'react'
import { Trash2, Bitcoin, Hexagon, Zap, GitBranch, ShieldAlert, Landmark } from 'lucide-react'
import { useModuleStore } from '@/store/useModuleStore'
import { getModuleDeepLink } from '@/hooks/useModuleDeepLink'
import { BlockchainCryptoIntroduction } from './components/BlockchainCryptoIntroduction'
import { BlockchainExercises } from './components/BlockchainExercises'
import { BitcoinFlow } from './flows/BitcoinFlow'
import { EthereumFlow } from './flows/EthereumFlow'
import { SolanaFlow } from './flows/SolanaFlow'
import { HDWalletFlow } from './flows/HDWalletFlow'
import { PQCMigrationFlow } from './flows/PQCMigrationFlow'
import { CustodyArchitectureFlow } from './flows/CustodyArchitectureFlow'
import { ModuleShell, type ModuleSlotApi } from '@/components/PKILearning/common/ModuleShell'
import { Button } from '@/components/ui/button'
import manifest from './manifest'

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
  {
    id: 'pqc-migration',
    label: 'PQC Defense',
    description: 'Migration proposals & initiatives',
    icon: <ShieldAlert size={24} />,
  },
  {
    id: 'custody-architecture',
    label: 'Custody Architecture',
    description: 'Wallet tiers / HSM / MPC / PQC threats',
    icon: <Landmark size={24} />,
  },
]

export const DigitalAssetsModule: React.FC = () => {
  const markStepComplete = useModuleStore((s) => s.markStepComplete)
  const resetModuleProgress = useModuleStore((s) => s.resetModuleProgress)
  const completedSteps = useModuleStore((s) => s.modules[MODULE_ID]?.completedSteps)

  // The workshop is a bespoke chain-selector (not a generic stepper), so it
  // rides the ModuleShell `workshop` slot. ModuleShell owns tabs, header, time
  // tracking; this component owns the selected-chain state. Inbound `?flow=`
  // deep-links still land on a chain (read once); the shell owns the URL after.
  // `?step=N` (the manifest's workshop step order, the same order as CHAINS)
  // opens that chain too, so step links land like every other module's.
  const [activeChain, setActiveChain] = useState<string | null>(() => {
    const dl = getModuleDeepLink({ maxStep: CHAINS.length - 1 })
    return dl.initialFlow ?? (dl.stepGiven ? (CHAINS[dl.initialStep]?.id ?? null) : null)
  })
  const [configKey, setConfigKey] = useState(0)

  const selectChain = (chain: string) => {
    setActiveChain(chain)
    setConfigKey((prev) => prev + 1)
  }

  const backToSelection = () => setActiveChain(null)

  const completeChain = () => {
    if (activeChain) markStepComplete(MODULE_ID, activeChain)
    backToSelection()
  }

  // From Learn/Exercises CTAs: optionally pre-select a chain, or route the
  // "learn more about PQC" scenario back to the Learn tab.
  const navigateToWorkshop = (api: ModuleSlotApi, chain?: string) => {
    if (chain === 'learn-pqc') {
      api.goToTab('learn')
      return
    }
    api.goToWorkshop()
    if (chain) selectChain(chain)
  }

  const handleReset = () => {
    if (confirm('Reset this module’s learning progress and clear the active exercise?')) {
      resetModuleProgress(MODULE_ID)
      setActiveChain(null)
      setConfigKey((prev) => prev + 1)
    }
  }

  const workshopContent = (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Reset button */}
      <div className="flex justify-end">
        <Button
          variant="ghost"
          onClick={handleReset}
          className="flex items-center gap-2 px-3 py-2 bg-destructive/10 text-status-error rounded hover:bg-destructive/20 transition-colors text-sm border border-destructive/20"
        >
          <Trash2 size={16} />
          Reset module progress
        </Button>
      </div>

      {!activeChain ? (
        <>
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-xl font-bold text-foreground mb-2">Choose a Blockchain</h2>
            <p className="text-muted-foreground text-sm">
              Select a blockchain to explore its cryptographic primitives hands-on. Each flow walks
              you through key generation, address derivation, transaction formatting, and digital
              signing using real cryptographic operations.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CHAINS.map((chain) => (
              <Button
                variant="ghost"
                key={chain.id}
                onClick={() => selectChain(chain.id)}
                className={`bg-card border border-border rounded-xl p-6 h-auto w-full min-w-0 flex flex-col items-start whitespace-normal text-left transition-colors group ${
                  chain.id === 'pqc-migration'
                    ? 'hover:border-destructive/50 border-destructive/20'
                    : chain.id === 'custody-architecture'
                      ? 'hover:border-accent/50 border-accent/20'
                      : 'hover:border-primary/50'
                }`}
              >
                <div
                  className={`mb-3 group-hover:scale-110 transition-transform ${
                    chain.id === 'pqc-migration'
                      ? 'text-destructive'
                      : chain.id === 'custody-architecture'
                        ? 'text-accent'
                        : 'text-primary'
                  }`}
                >
                  {chain.icon}
                </div>
                <h3 className="text-lg font-bold text-foreground mb-1">{chain.label}</h3>
                <p className="max-w-full break-words text-xs text-muted-foreground font-mono">
                  {chain.description}
                </p>
                {completedSteps?.includes(chain.id) && (
                  <span className="text-xs text-status-success">Completed</span>
                )}
              </Button>
            ))}
          </div>
        </>
      ) : (
        <div data-workshop-step={activeChain}>
          <Button
            variant="ghost"
            onClick={backToSelection}
            className="mb-4 px-4 py-2 rounded-lg border border-border hover:bg-muted/50 transition-colors text-sm text-foreground"
          >
            &larr; Back to Chain Selection
          </Button>
          {activeChain === 'bitcoin' && (
            <BitcoinFlow
              key={`bitcoin-${configKey}`}
              onBack={backToSelection}
              onComplete={completeChain}
            />
          )}
          {activeChain === 'ethereum' && (
            <EthereumFlow
              key={`ethereum-${configKey}`}
              onBack={backToSelection}
              onComplete={completeChain}
            />
          )}
          {activeChain === 'solana' && (
            <SolanaFlow
              key={`solana-${configKey}`}
              onBack={backToSelection}
              onComplete={completeChain}
            />
          )}
          {activeChain === 'hd-wallet' && (
            <HDWalletFlow
              key={`hdwallet-${configKey}`}
              onBack={backToSelection}
              onComplete={completeChain}
            />
          )}
          {activeChain === 'pqc-migration' && (
            <PQCMigrationFlow
              key={`pqc-${configKey}`}
              onBack={backToSelection}
              onComplete={completeChain}
            />
          )}
          {activeChain === 'custody-architecture' && (
            <CustodyArchitectureFlow
              key={`custody-${configKey}`}
              onBack={backToSelection}
              onComplete={completeChain}
            />
          )}
        </div>
      )}
    </div>
  )

  return (
    <ModuleShell
      manifest={manifest}
      title="Blockchain Cryptography"
      description="Master the cryptographic primitives of major blockchains and understand quantum threats."
      learn={(api) => (
        <BlockchainCryptoIntroduction onNavigateToWorkshop={() => api.goToWorkshop()} />
      )}
      workshop={workshopContent}
      exercises={(api) => (
        <BlockchainExercises onNavigateToWorkshop={(chain) => navigateToWorkshop(api, chain)} />
      )}
    />
  )
}
