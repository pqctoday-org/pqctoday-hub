import React from 'react'

interface FiveGDiagramProps {
  step: number
  profile?: 'A' | 'B' | 'C'
}

export const FiveGDiagram: React.FC<FiveGDiagramProps> = ({ step, profile }) => {
  return (
    <div className="relative w-full h-[300px] bg-black/20 rounded-lg p-4 flex items-center justify-between overflow-hidden">
      {/* USIM Node */}
      <div
        className={`
        relative z-10 w-32 h-32 rounded-xl flex flex-col items-center justify-center border-2 transition-all duration-500
        ${step >= 0 ? 'border-primary bg-primary/10 shadow-[0_0_20px_rgba(0,255,157,0.2)]' : 'border-white/10 bg-black/40'}
      `}
      >
        <div className="text-4xl mb-2">📱</div>
        <div className="font-bold text-center">USIM</div>
        <div className="text-xs text-muted-foreground mt-1">UE Side</div>
      </div>

      {/* Connection Lines & Data Flow */}
      <div className="flex-1 relative h-full flex flex-col items-center justify-center mx-4">
        {/* Connection Line */}
        <div className="absolute top-1/2 left-0 w-full h-1 bg-white/10 -translate-y-1/2"></div>

        {/* Animated Data Packet */}
        {step >= 3 && step < 6 && (
          <div className="absolute top-1/2 left-1/4 w-3 h-3 bg-secondary rounded-full animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite] -translate-y-1/2"></div>
        )}

        {/* Labels based on Step */}
        <div className="absolute top-1/3 w-full text-center">
          {step === 0 && (
            <span className="text-xs text-primary animate-pulse">Reading EF File...</span>
          )}
          {step === 1 && (
            <span className="text-xs text-primary animate-pulse">Generating Keys...</span>
          )}
          {step === 2 && (
            <span className="text-xs text-secondary animate-pulse">
              Key Agreement (diffie-hellman)
            </span>
          )}
          {step === 3 && (
            <span className="text-xs text-secondary animate-pulse">Key Derivation</span>
          )}
          {step === 4 && (
            <span className="text-xs text-red-400 animate-pulse">
              Encryption {profile === 'C' ? '(AES-256)' : '(AES-128)'}
            </span>
          )}
          {step >= 6 && <span className="text-xs text-primary font-bold">SUCI TRANSMISSION</span>}
        </div>
      </div>

      {/* Home Network Node */}
      <div
        className={`
        relative z-10 w-32 h-32 rounded-xl flex flex-col items-center justify-center border-2 transition-all duration-500
        ${step >= 2 ? 'border-secondary bg-secondary/10 shadow-[0_0_20px_rgba(255,0,255,0.2)]' : 'border-white/10 bg-black/40'}
      `}
      >
        <div className="text-4xl mb-2">☁️</div>
        <div className="font-bold text-center">Home Network</div>
        <div className="text-xs text-muted-foreground mt-1">UDM / SIDF</div>
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
