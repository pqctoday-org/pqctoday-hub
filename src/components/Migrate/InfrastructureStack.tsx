import React from 'react'
import { Server, Monitor, Database, Laptop, Cloud, ShieldCheck, Network } from 'lucide-react'
import { logMigrateAction } from '../../utils/analytics'

export type InfrastructureLayerType =
  | 'All'
  | 'Hardware'
  | 'OS'
  | 'Security Stack'
  | 'Database'
  | 'Application'
  | 'Network'
  | 'Cloud'

interface InfrastructureStackProps {
  activeLayer: InfrastructureLayerType
  onSelectLayer: (layer: InfrastructureLayerType) => void
  subCategories?: string[]
  activeSubCategory?: string
  onSelectSubCategory?: (cat: string) => void
  expandedContent?: React.ReactNode
  layerProductCounts?: Partial<Record<InfrastructureLayerType, number>>
  layerHiddenCounts?: Partial<Record<InfrastructureLayerType, number>>
  onRestoreLayer?: (keysToRestore: string[]) => void
  layerProductKeys?: Partial<Record<InfrastructureLayerType, string[]>>
}

export const LAYERS = [
  {
    id: 'Cloud',
    label: 'Cloud',
    icon: Cloud,
    description:
      'Cloud KMS, Cloud HSM, Encryption Gateways, Crypto Agility, KMS, IAM, Crypto Discovery, Digital Identity',
    color: 'from-blue-500/20 to-cyan-500/20',
    borderColor: 'border-blue-500/50',
    activeColor: 'bg-card border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)]',
    iconColor: 'text-primary',
  },
  {
    id: 'Network',
    label: 'Network',
    icon: Network,
    description:
      'VPN, IPsec, Network Security, Network Encryptors, Protocol Analyzers, 5G & Telecom',
    color: 'from-sky-500/20 to-indigo-500/20',
    borderColor: 'border-sky-500/50',
    activeColor: 'bg-card border-sky-400 shadow-[0_0_15px_rgba(14,165,233,0.5)]',
    iconColor: 'text-primary',
  },
  {
    id: 'Application',
    label: 'Application Servers & Software',
    icon: Laptop,
    description:
      'TLS/SSL, SSH, Web Browsers, App Servers, Email, Messaging, Signatures, Code Signing, API Security, Crypto & PQC Libraries, Blockchain, Payment, Remote Access, Disk Encryption, CI/CD, Digital Identity, 5G',
    color: 'from-purple-500/20 to-pink-500/20',
    borderColor: 'border-purple-500/50',
    activeColor: 'bg-card border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.5)]',
    iconColor: 'text-secondary',
  },
  {
    id: 'Database',
    label: 'Database',
    icon: Database,
    description: 'Database Encryption Software',
    color: 'from-emerald-500/20 to-teal-500/20',
    borderColor: 'border-emerald-500/50',
    activeColor: 'bg-card border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]',
    iconColor: 'text-accent',
  },
  {
    id: 'Security Stack',
    label: 'Security Stack',
    icon: ShieldCheck,
    description:
      'KMS, PKI, Crypto & PQC Libraries, CLM, Secrets, IAM, CIAM, Data Protection, Crypto Discovery, TLS/SSL, Digital Identity',
    color: 'from-rose-500/20 to-red-500/20',
    borderColor: 'border-rose-500/50',
    activeColor: 'bg-card border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.5)]',
    iconColor: 'text-destructive',
  },
  {
    id: 'OS',
    label: 'Operating System',
    icon: Monitor,
    description: 'Operating Systems, Network OS, Disk & File Encryption',
    color: 'from-warning/20 to-warning/10',
    borderColor: 'border-orange-500/50',
    activeColor: 'bg-card border-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.5)]',
    iconColor: 'text-warning',
  },
  {
    id: 'Hardware',
    label: 'Hardware & Secure Elements',
    icon: Server,
    description:
      'HSMs, Smart Cards, Secure Boot, Semiconductors, QRNG, QKD, Confidential Computing, 5G & Telecom',
    color: 'from-slate-500/20 to-gray-400/20',
    borderColor: 'border-slate-500/50',
    activeColor: 'bg-card border-slate-400 shadow-[0_0_15px_rgba(100,116,139,0.5)]',
    iconColor: 'text-muted-foreground',
  },
]

export const InfrastructureStack: React.FC<InfrastructureStackProps> = ({
  activeLayer,
  onSelectLayer,
  subCategories,
  activeSubCategory,
  onSelectSubCategory,
  expandedContent,
  layerProductCounts,
  layerHiddenCounts,
  onRestoreLayer,
  layerProductKeys,
}) => {
  const handleSelect = (layerId: InfrastructureLayerType) => {
    // Toggle off if clicking the already active layer
    const newLayer = activeLayer === layerId ? 'All' : layerId
    onSelectLayer(newLayer)
    if (newLayer !== 'All') {
      logMigrateAction('Select Infrastructure Layer', layerId)
    }
  }

  return (
    <div className="w-full mb-10">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Enterprise Infrastructure Stack
        </h3>
        <p className="text-sm text-muted-foreground">
          Select a layer to view post-quantum cryptographic software options.
        </p>
      </div>

      <div className="flex flex-col gap-3 p-6 bg-card border border-border rounded-2xl shadow-2xl relative">
        {/* Connection Line */}
        <div className="absolute left-1/2 top-10 bottom-10 w-px bg-gradient-to-b from-primary/20 via-primary/20 to-muted-foreground/20 -translate-x-1/2 z-0 hidden md:block" />

        {LAYERS.map((layer, index) => {
          const isActive = activeLayer === layer.id
          const isFaded = activeLayer !== 'All' && !isActive
          const IconInfo = layer.icon

          return (
            <button
              key={layer.id}
              onClick={() => handleSelect(layer.id as InfrastructureLayerType)}
              className={`
                group relative z-10 w-full flex flex-col items-stretch p-4 md:px-8 rounded-xl
                transition-all duration-300 ease-in-out cursor-pointer
                ${
                  isActive
                    ? layer.activeColor
                    : `bg-gradient-to-r ${layer.color} border ${layer.borderColor} hover:scale-[1.01] hover:brightness-110`
                }
                ${isFaded ? 'opacity-40 grayscale-[0.5]' : 'opacity-100'}
              `}
              style={{
                transformOrigin: 'center',
                zIndex: isActive ? LAYERS.length + 10 : LAYERS.length - index,
              }}
            >
              {/* Shine effect — isolated so it doesn't clip expandedContent */}
              <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
                <div className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/5 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
              </div>

              {/* Row 1: Icon + label + status badge */}
              <div className="flex flex-col md:flex-row items-center justify-between w-full">
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div
                    className={`p-3 rounded-lg bg-background/50 backdrop-blur border border-border/30 shadow-inner transition-colors ${
                      isActive
                        ? layer.iconColor
                        : 'text-muted-foreground group-hover:text-foreground'
                    }`}
                  >
                    <IconInfo size={24} className={isActive ? 'animate-pulse' : ''} />
                  </div>
                  <div className="text-left">
                    <h4
                      className={`font-bold transition-colors ${
                        isActive
                          ? 'text-foreground'
                          : 'text-foreground/80 group-hover:text-foreground'
                      }`}
                    >
                      {layer.label}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5 hidden md:block">
                      {layer.description}
                    </p>
                  </div>
                </div>

                {/* Mobile description */}
                <p className="text-xs text-muted-foreground mt-3 md:hidden w-full text-center">
                  {layer.description}
                </p>

                {/* Product count + hidden badge + status */}
                <div className="hidden md:flex items-center gap-2 flex-shrink-0">
                  {layerProductCounts !== undefined && (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-background/50 text-muted-foreground border border-border/40 tabular-nums">
                      {layerProductCounts[layer.id as InfrastructureLayerType] ?? 0} products
                    </span>
                  )}
                  {(layerHiddenCounts?.[layer.id as InfrastructureLayerType] ?? 0) > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        const keys = layerProductKeys?.[layer.id as InfrastructureLayerType] ?? []
                        onRestoreLayer?.(keys)
                      }}
                      className="text-xs px-2.5 py-1 rounded-full bg-status-warning/10 text-status-warning border border-status-warning/30 hover:bg-status-warning/20 transition-colors"
                    >
                      {layerHiddenCounts?.[layer.id as InfrastructureLayerType]} hidden · Restore
                    </button>
                  )}
                  <div
                    className={`flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full border transition-colors ${
                      isActive
                        ? 'bg-background/80 text-foreground border-border'
                        : 'bg-background/40 text-muted-foreground border-transparent group-hover:border-border/50 group-hover:text-foreground/80'
                    }`}
                  >
                    {isActive ? 'Filtered' : 'Click to filter'}
                  </div>
                </div>
              </div>

              {/* Row 2: Sub-category chips (only when active and sub-categories available) */}
              {isActive && subCategories && subCategories.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-3 mt-3 w-full border-t border-border/30">
                  {['All', ...subCategories].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectSubCategory?.(cat)
                      }}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                        (activeSubCategory ?? 'All') === cat
                          ? 'bg-background text-foreground border-border font-semibold'
                          : 'bg-background/30 text-muted-foreground border-border/30 hover:border-border/60 hover:text-foreground'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}

              {/* Row 3: Inline product table (only when active and content provided) */}
              {isActive && expandedContent && (
                <div
                  role="presentation"
                  className="mt-3 pt-3 w-full border-t border-border/30"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <div className="bg-card rounded-lg border border-border">{expandedContent}</div>
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
