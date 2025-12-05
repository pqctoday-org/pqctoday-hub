import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { CircleDollarSign, Hexagon, Zap, Wallet } from 'lucide-react'
import { BitcoinFlow } from './flows/BitcoinFlow'
import { EthereumFlow } from './flows/EthereumFlow'
import { SolanaFlow } from './flows/SolanaFlow'
import { HDWalletImplementation } from './HDWalletImplementation'

type FlowType = 'bitcoin' | 'ethereum' | 'solana' | 'hd-wallet' | null

export const DigitalAssetsModule: React.FC = () => {
  const [activeFlow, setActiveFlow] = useState<FlowType>(null)

  if (activeFlow === 'bitcoin') {
    return <BitcoinFlow onBack={() => setActiveFlow(null)} />
  }

  if (activeFlow === 'ethereum') {
    return <EthereumFlow onBack={() => setActiveFlow(null)} />
  }

  if (activeFlow === 'solana') {
    return <SolanaFlow onBack={() => setActiveFlow(null)} />
  }

  if (activeFlow === 'hd-wallet') {
    return <HDWalletImplementation onBack={() => setActiveFlow(null)} />
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
          Digital Assets Cryptography
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Explore the cryptographic primitives behind the world's leading blockchains. Execute real
          commands in your browser to generate keys, addresses, and signatures.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
        <FlowCard
          title="Bitcoin"
          description="secp256k1, SHA-256, RIPEMD-160, Base58Check"
          icon={<CircleDollarSign size={40} className="text-orange-500" />}
          onClick={() => setActiveFlow('bitcoin')}
          color="hover:border-orange-500/50"
        />
        <FlowCard
          title="Ethereum"
          description="secp256k1, Keccak-256, RLP, EIP-55"
          icon={<Hexagon size={40} className="text-blue-500" />}
          onClick={() => setActiveFlow('ethereum')}
          color="hover:border-blue-500/50"
        />
        <FlowCard
          title="Solana"
          description="Ed25519, EdDSA, Base58"
          icon={<Zap size={40} className="text-purple-500" />}
          onClick={() => setActiveFlow('solana')}
          color="hover:border-purple-500/50"
        />
        <FlowCard
          title="HD Wallet"
          description="BIP39, BIP32, SLIP-0010, Multi-chain"
          icon={<Wallet size={40} className="text-green-500" />}
          onClick={() => setActiveFlow('hd-wallet')}
          color="hover:border-green-500/50"
        />
      </div>
    </div>
  )
}

interface FlowCardProps {
  title: string
  description: string
  icon: React.ReactNode
  onClick: () => void
  color: string
}

const FlowCard: React.FC<FlowCardProps> = ({ title, description, icon, onClick, color }) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`bg-surface-800/50 border border-white/10 rounded-xl p-8 text-left transition-all ${color} group`}
  >
    <div className="mb-6 bg-white/5 w-16 h-16 rounded-full flex items-center justify-center group-hover:bg-white/10 transition-colors">
      {icon}
    </div>
    <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
  </motion.button>
)
