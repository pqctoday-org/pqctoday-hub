import React from 'react'

interface FiveGDiagramProps {
  step: number
  profile?: 'A' | 'B' | 'C'
}

export const FiveGDiagram: React.FC<FiveGDiagramProps> = ({ step, profile }) => {
  // USIM is active during steps 2-9 (UE-side operations)
  const usimActive = step >= 2 && step <= 9
  // Home Network is active during steps 0-1 (key gen/provisioning) and step 10 (decryption)
  const hnActive = step <= 1 || step >= 10

  return (
    <div className="relative w-full h-[300px] bg-muted/50 rounded-lg p-4 flex items-center justify-between overflow-hidden">
      {/* USIM Node */}
      <div
        className={`
        relative z-10 w-32 h-32 rounded-xl flex flex-col items-center justify-center border-2 transition-all duration-500
        ${usimActive ? 'border-primary bg-primary/10 shadow-glow' : 'border-border bg-card/40'}
      `}
      >
        <div className="text-4xl mb-2">📱</div>
        <div className="font-bold text-center">USIM</div>
        <div className="text-xs text-muted-foreground mt-1">UE Side</div>
      </div>

      {/* Connection Lines & Data Flow */}
      <div className="flex-1 relative h-full flex flex-col items-center justify-center mx-4">
        {/* Connection Line */}
        <div className="absolute top-1/2 left-0 w-full h-1 bg-border/20 -translate-y-1/2"></div>

        {/* Animated Data Packet — active during crypto operations (ECDH, KDF, encrypt, MAC) */}
        {step >= 4 && step < 8 && (
          <div className="absolute top-1/2 left-1/4 w-3 h-3 bg-secondary rounded-full animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite] -translate-y-1/2"></div>
        )}

        {/* Labels based on Step — aligned with 11-step SUCI flow */}
        <div className="absolute top-1/3 w-full text-center">
          {step === 0 && (
            <span className="text-xs text-secondary animate-pulse">Generating HN Key Pair...</span>
          )}
          {step === 1 && (
            <span className="text-xs text-secondary animate-pulse">Provisioning USIM...</span>
          )}
          {step === 2 && (
            <span className="text-xs text-primary animate-pulse">Retrieving HN Public Key...</span>
          )}
          {step === 3 && (
            <span className="text-xs text-primary animate-pulse">Generating Ephemeral Keys...</span>
          )}
          {step === 4 && (
            <span className="text-xs text-secondary animate-pulse">
              Computing Shared Secret{profile === 'C' ? ' (Hybrid/KEM)' : ' (ECDH)'}
            </span>
          )}
          {step === 5 && (
            <span className="text-xs text-secondary animate-pulse">
              Deriving Encryption Keys...
            </span>
          )}
          {step === 6 && (
            <span className="text-xs text-destructive animate-pulse">
              Encrypting MSIN {profile === 'C' ? '(AES-256)' : '(AES-128)'}
            </span>
          )}
          {step === 7 && (
            <span className="text-xs text-destructive animate-pulse">Computing MAC Tag...</span>
          )}
          {step === 8 && (
            <span className="text-xs text-primary animate-pulse">Inspecting SUPI vs SUCI...</span>
          )}
          {step === 9 && (
            <span className="text-xs text-primary animate-pulse">Assembling SUCI...</span>
          )}
          {step === 10 && (
            <span className="text-xs text-primary font-bold">NETWORK DECRYPTION</span>
          )}
        </div>
      </div>

      {/* Home Network Node */}
      <div
        className={`
        relative z-10 w-32 h-32 rounded-xl flex flex-col items-center justify-center border-2 transition-all duration-500
        ${hnActive ? 'border-secondary bg-secondary/10 shadow-[0_0_20px_hsl(var(--secondary)/0.3)]' : 'border-border bg-card/40'}
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
          backgroundImage:
            'radial-gradient(circle at 2px 2px, hsl(var(--foreground)) 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      ></div>
    </div>
  )
}
