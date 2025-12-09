import React from 'react'
import { Server, Smartphone } from 'lucide-react'

interface AuthDiagramProps {
  step: number
}

export const AuthDiagram: React.FC<AuthDiagramProps> = ({ step }) => {
  return (
    <div className="relative w-full h-[300px] bg-black/20 rounded-lg p-4 flex items-center justify-between overflow-hidden">
      {/* Home Network (UDM) Node - Left side for flow start (vector gen) */}
      <div
        className={`
        relative z-10 w-28 h-28 rounded-xl flex flex-col items-center justify-center border-2 transition-all duration-500
        ${
          step <= 1
            ? 'border-primary bg-primary/10 shadow-[0_0_20px_rgba(0,255,157,0.2)]'
            : step === 4
              ? 'border-primary bg-primary/10'
              : 'border-white/10 bg-black/40'
        }
      `}
      >
        <Server className="w-8 h-8 mb-2" />
        <div className="font-bold text-center text-sm">Home Network</div>
        <div className="text-xs text-muted-foreground mt-1">UDM / ARPF</div>
      </div>

      {/* Connection Area */}
      <div className="flex-1 relative h-full flex flex-col items-center justify-center mx-4">
        {/* Connection Line */}
        <div className="absolute top-1/2 left-0 w-full h-1 bg-white/10 -translate-y-1/2"></div>

        {/* Animated Data Packets */}
        {/* Step 1: Internal UDM processing (static) */}

        {/* Step 2: RAND Generation (Pulse at UDM) */}

        {/* Step 3: MILENAGE (Computing vectors) - Pulse/Orbit */}

        {/* Step 4: Sending AV (or RAND+AUTN to UE - technically via SEAF but simplified here) */}
        {step >= 3 && step < 4 && (
          <div className="absolute top-1/2 left-1/4 w-3 h-3 bg-primary rounded-full animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite] -translate-y-1/2"></div>
        )}

        {/* Labels */}
        <div className="absolute top-1/3 w-full text-center">
          {step === 0 && (
            <span className="text-xs text-primary animate-pulse">
              Reading Subscriber Profile...
            </span>
          )}
          {step === 1 && (
            <span className="text-xs text-secondary animate-pulse">Generating RAND...</span>
          )}
          {step === 2 && (
            <span className="text-xs text-secondary font-bold animate-pulse">
              Computing MILENAGE (f1-f5)
            </span>
          )}
          {step === 3 && <span className="text-xs text-white">Sending RAND + AUTN</span>}
          {step === 4 && (
            <span className="text-xs text-success animate-pulse">Deriving 5G Keys (KAUSF)</span>
          )}
        </div>
      </div>

      {/* USIM Node - Right side */}
      <div
        className={`
        relative z-10 w-28 h-28 rounded-xl flex flex-col items-center justify-center border-2 transition-all duration-500
        ${step >= 3 ? 'border-secondary bg-secondary/10 shadow-[0_0_20px_rgba(255,0,255,0.2)]' : 'border-white/10 bg-black/40'}
      `}
      >
        <Smartphone className="w-8 h-8 mb-2" />
        <div className="font-bold text-center text-sm">USIM</div>
        <div className="text-xs text-muted-foreground mt-1">User Equipment</div>
      </div>

      {/* Background Matrix/Grid Effect */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      ></div>
    </div>
  )
}
