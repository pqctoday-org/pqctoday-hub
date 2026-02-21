import React from 'react'
import { Server, Monitor, Database, Laptop, Cloud } from 'lucide-react'
import { logMigrateAction } from '../../utils/analytics'

export type InfrastructureLayerType =
  | 'All'
  | 'Hardware'
  | 'OS'
  | 'Database'
  | 'Application'
  | 'Cloud/Network'

interface InfrastructureStackProps {
  activeLayer: InfrastructureLayerType
  onSelectLayer: (layer: InfrastructureLayerType) => void
}

const LAYERS = [
  {
    id: 'Cloud/Network',
    label: 'Cloud & Network',
    icon: Cloud,
    description: 'Cloud Gateways, KMS, Network Security, PKI',
    color: 'from-blue-500/20 to-cyan-500/20',
    borderColor: 'border-blue-500/50',
    activeColor: 'bg-blue-500/30 border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)]',
    iconColor: 'text-blue-400',
  },
  {
    id: 'Application',
    label: 'Application Servers & Software',
    icon: Laptop,
    description: 'TLS, Web Servers, Messaging, Code Signing',
    color: 'from-purple-500/20 to-pink-500/20',
    borderColor: 'border-purple-500/50',
    activeColor: 'bg-purple-500/30 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.5)]',
    iconColor: 'text-purple-400',
  },
  {
    id: 'Database',
    label: 'Database',
    icon: Database,
    description: 'Database Encryption Software',
    color: 'from-emerald-500/20 to-teal-500/20',
    borderColor: 'border-emerald-500/50',
    activeColor: 'bg-emerald-500/30 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]',
    iconColor: 'text-emerald-400',
  },
  {
    id: 'OS',
    label: 'Operating System',
    icon: Monitor,
    description: 'Windows, Linux, macOS, iOS, Android',
    color: 'from-orange-500/20 to-amber-500/20',
    borderColor: 'border-orange-500/50',
    activeColor: 'bg-orange-500/30 border-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.5)]',
    iconColor: 'text-orange-400',
  },
  {
    id: 'Hardware',
    label: 'Hardware & Secure Elements',
    icon: Server,
    description: 'HSMs, Secure Boot, Semiconductors',
    color: 'from-slate-500/20 to-gray-400/20',
    borderColor: 'border-slate-500/50',
    activeColor: 'bg-slate-500/30 border-slate-400 shadow-[0_0_15px_rgba(100,116,139,0.5)]',
    iconColor: 'text-slate-300',
  },
]

export const InfrastructureStack: React.FC<InfrastructureStackProps> = ({
  activeLayer,
  onSelectLayer,
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
    <div className="w-full max-w-4xl mx-auto mb-10">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Enterprise Infrastructure Stack
        </h3>
        <p className="text-sm text-muted-foreground">
          Select a layer to view post-quantum cryptographic software options.
        </p>
      </div>

      <div className="flex flex-col gap-3 p-6 bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl shadow-2xl relative">
        {/* Connection Line */}
        <div className="absolute left-1/2 top-10 bottom-10 w-px bg-gradient-to-b from-blue-500/20 via-primary/20 to-slate-500/20 -translate-x-1/2 z-0 hidden md:block" />

        {LAYERS.map((layer, index) => {
          const isActive = activeLayer === layer.id
          const isFaded = activeLayer !== 'All' && !isActive
          const IconInfo = layer.icon

          return (
            <button
              key={layer.id}
              onClick={() => handleSelect(layer.id as InfrastructureLayerType)}
              className={`
                group relative z-10 w-full flex flex-col md:flex-row items-center justify-between p-4 md:px-8 rounded-xl
                transition-all duration-300 ease-in-out cursor-pointer overflow-hidden
                ${
                  isActive
                    ? layer.activeColor + ' scale-[1.02] md:scale-105'
                    : `bg-gradient-to-r ${layer.color} border ${layer.borderColor} hover:scale-[1.01] hover:brightness-110`
                }
                ${isFaded ? 'opacity-40 grayscale-[0.5]' : 'opacity-100'}
              `}
              style={{
                // perspective effect to make it look like a stack
                transformOrigin: 'center',
                zIndex: LAYERS.length - index,
              }}
            >
              {/* Shine effect on hover */}
              <div className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/5 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />

              <div className="flex items-center gap-4 w-full md:w-auto">
                <div
                  className={`p-3 rounded-lg bg-background/50 backdrop-blur border border-white/5 shadow-inner transition-colors ${
                    isActive ? layer.iconColor : 'text-muted-foreground group-hover:text-foreground'
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

              {/* Status Indicator */}
              <div
                className={`hidden md:flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full border transition-colors ${
                  isActive
                    ? 'bg-background/80 text-foreground border-white/20'
                    : 'bg-background/40 text-muted-foreground border-transparent group-hover:border-white/10 group-hover:text-foreground/80'
                }`}
              >
                {isActive ? 'Filtered' : 'Click to filter'}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
