import React from 'react'
import {
    Key,
    KeyRound,
    Hash,
    Binary,
    Wallet,
    Scissors,
    CheckCircle,
    Dices,
    FileText,
    Sprout,
    GitBranch,
    ArrowRight,
} from 'lucide-react'
import type { FlowStep } from '../utils/cryptoConstants'
import {
    BITCOIN_FLOW_STEPS,
    ETHEREUM_FLOW_STEPS,
    SOLANA_FLOW_STEPS,
    HD_WALLET_FLOW_STEPS,
} from '../utils/cryptoConstants'

const iconMap = {
    Key,
    KeyRound,
    Hash,
    Binary,
    Wallet,
    Scissors,
    CheckCircle,
    Dices,
    FileText,
    Sprout,
    GitBranch,
}

interface FlowDiagramProps {
    steps: FlowStep[]
    className?: string
}

const FlowDiagram: React.FC<FlowDiagramProps> = ({ steps, className = '' }) => {
    return (
        <div className={`my-4 ${className}`}>
            {/* Desktop: Horizontal Layout */}
            <div className="hidden lg:flex items-center justify-center gap-3">
                {steps.map((step, index) => {
                    const Icon = iconMap[step.icon as keyof typeof iconMap] || Hash

                    return (
                        <React.Fragment key={step.id}>
                            <div className="flex flex-col items-center gap-2 min-w-[100px]">
                                <div
                                    className={`w-14 h-14 rounded-full bg-muted/20 border-2 border-border flex items-center justify-center ${step.color}`}
                                >
                                    <Icon size={20} />
                                </div>
                                <div className="text-center">
                                    <div className="text-xs font-bold text-foreground whitespace-nowrap">{step.label}</div>
                                    <div className="text-xs text-muted-foreground whitespace-nowrap">{step.description}</div>
                                </div>
                            </div>

                            {index < steps.length - 1 && (
                                <div className="flex items-center justify-center shrink-0 pb-8">
                                    <ArrowRight className="text-muted-foreground" size={20} />
                                </div>
                            )}
                        </React.Fragment>
                    )
                })}
            </div>

            {/* Mobile: Vertical Layout */}
            <div className="flex lg:hidden flex-col gap-2">
                {steps.map((step, index) => {
                    const Icon = iconMap[step.icon as keyof typeof iconMap] || Hash

                    return (
                        <React.Fragment key={step.id}>
                            <div className="flex items-center gap-3">
                                <div
                                    className={`w-12 h-12 rounded-full bg-muted/20 border-2 border-border flex items-center justify-center shrink-0 ${step.color}`}
                                >
                                    <Icon size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-bold text-foreground truncate">{step.label}</div>
                                    <div className="text-xs text-muted-foreground truncate">{step.description}</div>
                                </div>
                            </div>

                            {index < steps.length - 1 && (
                                <div className="flex justify-center">
                                    <div className="w-px h-4 bg-border" />
                                </div>
                            )}
                        </React.Fragment>
                    )
                })}
            </div>
        </div>
    )
}

export const BitcoinFlowDiagram: React.FC<{ className?: string }> = ({ className }) => (
    <FlowDiagram steps={BITCOIN_FLOW_STEPS} className={className} />
)

export const EthereumFlowDiagram: React.FC<{ className?: string }> = ({ className }) => (
    <FlowDiagram steps={ETHEREUM_FLOW_STEPS} className={className} />
)

export const SolanaFlowDiagram: React.FC<{ className?: string }> = ({ className }) => (
    <FlowDiagram steps={SOLANA_FLOW_STEPS} className={className} />
)

export const HDWalletFlowDiagram: React.FC<{ className?: string }> = ({ className }) => (
    <FlowDiagram steps={HD_WALLET_FLOW_STEPS} className={className} />
)
