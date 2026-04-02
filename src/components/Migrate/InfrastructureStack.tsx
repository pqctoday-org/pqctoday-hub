// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import {
  Server,
  Monitor,
  Database,
  Code,
  Cloud,
  ShieldCheck,
  Network,
  ChevronUp,
  Laptop,
  Users,
  Globe,
  Activity,
  Share2,
  Phone,
  Keyboard,
  Key,
  Shield,
  CircleHelp,
  ShieldAlert,
} from 'lucide-react'
import { logMigrateAction } from '../../utils/analytics'
import { type PqcStats, CISA_CATEGORIES } from '../../types/MigrateTypes'

export type InfrastructureLayerType =
  | 'All'
  | 'Hardware'
  | 'OS'
  | 'Security Stack'
  | 'Database'
  | 'AppServers'
  | 'Libraries'
  | 'SecSoftware'
  | 'Network'
  | 'Cloud'

interface InfrastructureStackProps {
  activeLayer: string
  onSelectLayer: (layer: string) => void
  subCategories?: string[]
  activeSubCategory?: string
  onSelectSubCategory?: (cat: string) => void
  expandedContent?: React.ReactNode
  layerProductCounts?: Partial<Record<InfrastructureLayerType, number>>
  layerHiddenCounts?: Partial<Record<InfrastructureLayerType, number>>
  onRestoreLayer?: (keysToRestore: string[]) => void
  layerProductKeys?: Partial<Record<InfrastructureLayerType, string[]>>
  /** Count of "My Products" selected per layer */
  layerSelectedCounts?: Partial<Record<InfrastructureLayerType, number>>
  /** When true, layers with 0 products are hidden (useful when a vendor filter is active) */
  hideEmptyLayers?: boolean
  layerPqcStats?: Partial<Record<string, PqcStats>>
  totalPqcStats?: PqcStats
  partitions?: typeof LAYERS
}

export const LAYERS = [
  {
    id: 'Cloud',
    label: 'Cloud',
    icon: Cloud,
    description:
      'Cloud KMS, Cloud HSM, Encryption Gateways, Crypto Agility, KMS, IAM, Crypto Discovery, Digital Identity',
    color: 'from-primary/20 to-info/20',
    borderColor: 'border-primary/50',
    activeColor: 'bg-card border-primary shadow-[0_0_15px_hsl(var(--primary)/0.5)]',
    iconColor: 'text-primary',
  },
  {
    id: 'Network',
    label: 'Network',
    icon: Network,
    description:
      'VPN, IPsec, Network Security, Network Encryptors, Protocol Analyzers, 5G & Telecom, Testing & Validation',
    color: 'from-info/20 to-primary/20',
    borderColor: 'border-info/50',
    activeColor: 'bg-card border-info shadow-[0_0_15px_hsl(var(--info)/0.5)]',
    iconColor: 'text-primary',
  },
  {
    id: 'AppServers',
    label: 'Application Servers',
    icon: Laptop,
    description:
      'TLS/SSL, SSH, Web Browsers, App Servers, Email, Messaging, Blockchain, Payment, VPN, Remote Access, CI/CD',
    color: 'from-secondary/20 to-secondary/10',
    borderColor: 'border-secondary/50',
    activeColor: 'bg-card border-secondary shadow-[0_0_15px_hsl(var(--secondary)/0.5)]',
    iconColor: 'text-secondary',
  },
  {
    id: 'Libraries',
    label: 'Libraries & SDKs',
    icon: Code,
    description:
      'Cryptographic Libraries, PQC Libraries, API Security, Code Signing, Digital Signatures, Disk Encryption, SDKs',
    color: 'from-accent/20 to-accent/10',
    borderColor: 'border-accent/50',
    activeColor: 'bg-card border-accent shadow-[0_0_15px_hsl(var(--accent)/0.5)]',
    iconColor: 'text-accent',
  },
  {
    id: 'SecSoftware',
    label: 'Security Software',
    icon: Server,
    description:
      'Data Protection, Digital Identity, Secrets Management, Security Discovery, IoT/OT, AI/ML Security, Supply Chain',
    color: 'from-tertiary/20 to-tertiary/10',
    borderColor: 'border-tertiary/50',
    activeColor: 'bg-card border-tertiary shadow-[0_0_15px_hsl(var(--tertiary)/0.5)]',
    iconColor: 'text-tertiary',
  },
  {
    id: 'Database',
    label: 'Database',
    icon: Database,
    description: 'Database Encryption Software',
    color: 'from-success/20 to-accent/20',
    borderColor: 'border-success/50',
    activeColor: 'bg-card border-success shadow-[0_0_15px_hsl(var(--success)/0.5)]',
    iconColor: 'text-accent',
  },
  {
    id: 'Security Stack',
    label: 'Security Stack',
    icon: ShieldCheck,
    description:
      'KMS, PKI, Crypto & PQC Libraries, CLM, Secrets, IAM, CIAM, Data Protection, Crypto Discovery, TLS/SSL, Digital Identity',
    color: 'from-destructive/20 to-destructive/10',
    borderColor: 'border-destructive/50',
    activeColor: 'bg-card border-destructive shadow-[0_0_15px_hsl(var(--destructive)/0.5)]',
    iconColor: 'text-destructive',
  },
  {
    id: 'OS',
    label: 'Operating System',
    icon: Monitor,
    description: 'Operating Systems, Network OS, Disk & File Encryption',
    color: 'from-warning/20 to-warning/10',
    borderColor: 'border-warning/50',
    activeColor: 'bg-card border-warning shadow-[0_0_15px_hsl(var(--warning)/0.5)]',
    iconColor: 'text-warning',
  },
  {
    id: 'Hardware',
    label: 'Hardware & Secure Elements',
    icon: Server,
    description:
      'HSMs, Smart Cards, Secure Boot, Semiconductors, QRNG, QKD, Confidential Computing, 5G & Telecom',
    color: 'from-muted/20 to-muted/10',
    borderColor: 'border-muted-foreground/50',
    activeColor:
      'bg-card border-muted-foreground shadow-[0_0_15px_hsl(var(--muted-foreground)/0.5)]',
    iconColor: 'text-muted-foreground',
  },
]

export const CISA_LAYERS = CISA_CATEGORIES.map((cat) => {
  let icon = CircleHelp
  let color = 'from-muted/20 to-muted/10'
  let borderColor = 'border-muted'
  let iconColor = 'text-muted-foreground'
  const activeColor = 'bg-card border-primary shadow-[0_0_15px_hsl(var(--primary)/0.5)]'

  if (cat.includes('Cloud')) {
    icon = Cloud
    color = 'from-primary/20 to-info/20'
    borderColor = 'border-primary/50'
    iconColor = 'text-primary'
  } else if (cat.includes('Collaboration')) {
    icon = Users
    color = 'from-violet-500/20 to-fuchsia-500/20'
    borderColor = 'border-violet-500/50'
    iconColor = 'text-violet-500'
  } else if (cat.includes('Web')) {
    icon = Globe
    color = 'from-blue-500/20 to-cyan-500/20'
    borderColor = 'border-blue-500/50'
    iconColor = 'text-blue-500'
  } else if (cat.includes('Endpoint')) {
    icon = Monitor
    color = 'from-rose-500/20 to-orange-500/20'
    borderColor = 'border-rose-500/50'
    iconColor = 'text-rose-500'
  } else if (cat.includes('Networking Hardware')) {
    icon = Share2
    color = 'from-emerald-500/20 to-teal-500/20'
    borderColor = 'border-emerald-500/50'
    iconColor = 'text-emerald-500'
  } else if (cat.includes('Networking Software')) {
    icon = Activity
    color = 'from-emerald-500/20 to-teal-500/20'
    borderColor = 'border-emerald-500/50'
    iconColor = 'text-emerald-500'
  } else if (cat.includes('Telecom')) {
    icon = Phone
    color = 'from-indigo-500/20 to-blue-500/20'
    borderColor = 'border-indigo-500/50'
    iconColor = 'text-indigo-500'
  } else if (cat.includes('Computers')) {
    icon = Server
    color = 'from-slate-500/20 to-zinc-500/20'
    borderColor = 'border-slate-500/50'
    iconColor = 'text-slate-500'
  } else if (cat.includes('Peripheral')) {
    icon = Keyboard
    color = 'from-slate-500/20 to-zinc-500/20'
    borderColor = 'border-slate-500/50'
    iconColor = 'text-slate-500'
  } else if (cat.includes('Storage')) {
    icon = Database
    color = 'from-amber-500/20 to-orange-500/20'
    borderColor = 'border-amber-500/50'
    iconColor = 'text-amber-500'
  } else if (cat.includes('Software') && cat.includes('Access')) {
    icon = Key
    color = 'from-yellow-500/20 to-amber-500/20'
    borderColor = 'border-yellow-500/50'
    iconColor = 'text-yellow-500'
  } else if (cat.includes('Hardware') && cat.includes('Access')) {
    icon = Shield
    color = 'from-yellow-500/20 to-amber-500/20'
    borderColor = 'border-yellow-500/50'
    iconColor = 'text-yellow-500'
  } else if (cat.includes('Data')) {
    icon = Database
    color = 'from-amber-500/20 to-orange-500/20'
    borderColor = 'border-amber-500/50'
    iconColor = 'text-amber-500'
  } else if (cat.includes('Enterprise')) {
    icon = ShieldAlert
    color = 'from-rose-500/20 to-red-500/20'
    borderColor = 'border-rose-500/50'
    iconColor = 'text-rose-500'
  }

  return {
    id: cat,
    label: cat,
    icon,
    description: `CISA designated category: ${cat}`,
    color,
    borderColor,
    activeColor,
    iconColor,
  }
})

const PqcProgressBar: React.FC<{ stats: PqcStats; compact?: boolean }> = ({
  stats,
  compact = false,
}) => {
  if (!stats || stats.total === 0) return null

  const estPct = (stats.established / stats.total) * 100
  const inProgPct = (stats.inProgress / stats.total) * 100
  const noCapPct = (stats.noCapabilities / stats.total) * 100

  return (
    <div className={`flex flex-col w-full ${compact ? 'max-w-[200px]' : ''}`}>
      {!compact && (
        <div className="flex justify-between text-xs text-muted-foreground mb-1.5 px-1">
          <span className="text-success font-medium">Established: {Math.round(estPct)}%</span>
          <span className="text-warning font-medium hidden sm:inline">
            In Progress: {Math.round(inProgPct)}%
          </span>
          <span className="text-muted-foreground font-medium">
            No Capability: {Math.round(noCapPct)}%
          </span>
        </div>
      )}
      <div
        className={`flex w-full overflow-hidden bg-muted/30 border border-border/30 ${compact ? 'h-1.5 rounded-full' : 'h-3 rounded-full shadow-inner'}`}
      >
        {estPct > 0 && (
          <div
            className="bg-success transition-all duration-500"
            style={{ width: `${estPct}%` }}
            title={`Established: ${stats.established}`}
          />
        )}
        {inProgPct > 0 && (
          <div
            className="bg-warning transition-all duration-500"
            style={{ width: `${inProgPct}%` }}
            title={`In Progress: ${stats.inProgress}`}
          />
        )}
        {noCapPct > 0 && (
          <div
            className="bg-muted-foreground/40 transition-all duration-500"
            style={{ width: `${noCapPct}%` }}
            title={`No Capability: ${stats.noCapabilities}`}
          />
        )}
      </div>
      {compact && (
        <div className="flex justify-between text-[10px] mt-1 opacity-70">
          <span className="text-success">{Math.round(estPct)}%</span>
          <span className="text-muted-foreground">{Math.round(noCapPct)}%</span>
        </div>
      )}
    </div>
  )
}

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
  layerSelectedCounts,
  hideEmptyLayers,
  layerPqcStats,
  totalPqcStats,
  partitions = LAYERS,
}) => {
  const handleSelect = (layerId: string) => {
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
        <p className="text-sm text-muted-foreground mb-6">
          Select a layer to view post-quantum cryptographic software options.
        </p>

        {totalPqcStats && totalPqcStats.total > 0 && (
          <div className="max-w-2xl mx-auto bg-card border border-border rounded-xl p-4 shadow-sm mb-2">
            <h4 className="text-sm font-bold mb-3 text-foreground/80">Overall PQC Readiness</h4>
            <PqcProgressBar stats={totalPqcStats} />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 p-6 bg-card border border-border rounded-2xl shadow-2xl relative">
        {/* Connection Line */}
        <div className="absolute left-1/2 top-10 bottom-10 w-px bg-gradient-to-b from-primary/20 via-primary/20 to-muted-foreground/20 -translate-x-1/2 z-0 hidden md:block" />

        {partitions.map((layer, index) => {
          const productCount = layerProductCounts?.[layer.id as InfrastructureLayerType] ?? 0
          const isEmptyAndHidden = hideEmptyLayers && productCount === 0
          const isActive = activeLayer === layer.id
          const isFaded = activeLayer !== 'All' && !isActive
          const IconInfo = layer.icon

          return (
            <div
              key={layer.id}
              style={{
                zIndex: isActive ? partitions.length + 10 : partitions.length - index,
              }}
              className={`transition-all duration-500 ease-in-out relative flex flex-col ${
                isEmptyAndHidden ? 'max-h-0 opacity-0 overflow-hidden !m-0' : 'max-h-[3000px] opacity-100'
              }`}
            >
              <button
                onClick={() => handleSelect(layer.id as InfrastructureLayerType)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape' && isActive) {
                    e.preventDefault()
                    onSelectLayer('All')
                  }
                }}
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
                  zIndex: isActive ? partitions.length + 10 : partitions.length - index,
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

                      {/* Layer PQC Stats - Desktop */}
                      {layerPqcStats && layerPqcStats[layer.id as InfrastructureLayerType] && (
                        <div className="mt-2 hidden md:block opacity-80 group-hover:opacity-100 transition-opacity">
                          <PqcProgressBar
                            stats={layerPqcStats[layer.id as InfrastructureLayerType]!}
                            compact
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Mobile description & stats */}
                  <div className="md:hidden w-full mt-3 flex flex-col items-center gap-2 text-center">
                    <p className="text-xs text-muted-foreground">{layer.description}</p>
                    {layerPqcStats && layerPqcStats[layer.id as InfrastructureLayerType] && (
                      <div className="w-full max-w-[200px] opacity-90 mx-auto">
                        <PqcProgressBar
                          stats={layerPqcStats[layer.id as InfrastructureLayerType]!}
                          compact
                        />
                      </div>
                    )}
                  </div>

                  {/* Product count + hidden badge + status */}
                  <div className="hidden md:flex items-center gap-2 flex-shrink-0">
                    {layerProductCounts !== undefined && (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-background/50 text-muted-foreground border border-border/40 tabular-nums">
                        {layerProductCounts[layer.id as InfrastructureLayerType] ?? 0} products
                      </span>
                    )}
                    {(layerSelectedCounts?.[layer.id as InfrastructureLayerType] ?? 0) > 0 && (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/30 tabular-nums">
                        {layerSelectedCounts?.[layer.id as InfrastructureLayerType]} selected
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
                    <button
                      type="button"
                      aria-label="Collapse expanded infrastructure layer"
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectLayer('All')
                      }}
                      className="mt-3 w-full py-2 text-xs text-muted-foreground hover:text-foreground border border-border/40 rounded-lg hover:bg-background/50 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <ChevronUp size={14} />
                      Collapse layer
                    </button>
                  </div>
                )}
              </button>
            </div>
          )
        })}
      </div>

      {/* Desktop Stack Minimap Navigation Rail */}
      <div className="hidden xl:flex flex-col gap-2 absolute right-[-40px] top-1/2 -translate-y-1/2 py-4 px-2 bg-card/80 backdrop-blur border border-border rounded-full shadow-lg z-20">
        {partitions.map((layer) => {
          const productCount = layerProductCounts?.[layer.id as InfrastructureLayerType] ?? 0
          const isEmptyAndHidden = hideEmptyLayers && productCount === 0
          if (isEmptyAndHidden) return null

          const isActive = activeLayer === layer.id
          
          return (
            <button
              key={`minimap-${layer.id}`}
              onClick={(e) => {
                e.preventDefault()
                // Find element and scroll to it smoothly
                // We use handleSelect to expand it if not expanded
                handleSelect(layer.id as InfrastructureLayerType)
              }}
              title={layer.label}
              aria-label={`Jump to ${layer.label}`}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                isActive 
                  ? 'bg-primary scale-125 ring-2 ring-primary/30 ring-offset-1 ring-offset-background' 
                  : 'bg-muted-foreground/30 hover:bg-primary/60 hover:scale-110'
              }`}
            />
          )
        })}
      </div>
    </div>
  )
}
