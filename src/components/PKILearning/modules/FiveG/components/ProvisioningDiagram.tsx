import React from 'react'
import { Factory, Truck, Server, CreditCard, Lock } from 'lucide-react'

interface ProvisioningDiagramProps {
  step: number
}

export const ProvisioningDiagram: React.FC<ProvisioningDiagramProps> = ({ step }) => {
  return (
    <div className="relative w-full h-[300px] bg-black/20 rounded-lg p-4 flex items-center justify-between overflow-hidden">
      {/* Node 1: IDEMIA / Thales (SIM Factory) */}
      <div
        className={`
        relative z-10 w-24 h-24 rounded-xl flex flex-col items-center justify-center border-2 transition-all duration-500
        ${step <= 3 ? 'border-primary bg-primary/10 shadow-[0_0_20px_rgba(0,255,157,0.2)]' : 'border-white/10 bg-black/40'}
      `}
      >
        <Factory className="w-8 h-8 mb-2" />
        <div className="font-bold text-center text-xs">SIM Factory</div>
        <div className="text-[10px] text-muted-foreground mt-0.5">HSM Secure Zone</div>
      </div>

      {/* Path 1: Factory to USIM (Personalization) */}
      <div className="absolute left-[15%] bottom-[20%] w-[35%] h-[40%] border-l-2 border-b-2 border-dashed border-white/10 rounded-bl-3xl pointer-events-none"></div>

      {/* Path 2: Factory to MNO (Transport) */}
      <div className="flex-1 relative h-full flex flex-col items-center justify-center mx-4">
        {/* Connection Line */}
        <div className="absolute top-1/2 left-0 w-full h-1 bg-white/10 -translate-y-1/2"></div>

        {/* Step 0/1: Ki/OPc Gen (Pulse at Factory) */}

        {/* Step 2: Personalizing USIM (Animation moving down-right) */}
        {/* Visualized by highlighting USIM node below */}

        {/* Step 3: Encrypt for Transport (Lock Icon appears on line) */}
        {step === 3 && (
          <div className="absolute top-1/2 left-1/4 -translate-y-1/2 bg-black/80 p-2 rounded-full border border-secondary animate-bounce">
            <Lock size={16} className="text-secondary" />
          </div>
        )}

        {/* Step 4: Transport / Import (Truck moving L -> R) */}
        {step >= 3 && step <= 4 && (
          <div
            className="absolute top-1/2 left-0 w-8 h-8 -translate-y-1/2 transition-all duration-[2000ms]"
            style={{ left: step === 4 ? '100%' : '20%', opacity: step === 4 ? 0 : 1 }}
          >
            <Truck className="text-white w-6 h-6" />
          </div>
        )}

        {/* Labels */}
        <div className="absolute top-1/3 w-full text-center">
          {step === 0 && (
            <span className="text-xs text-primary animate-pulse">Generating Ki (TRNG)...</span>
          )}
          {step === 1 && (
            <span className="text-xs text-secondary animate-pulse">Computing OPc...</span>
          )}
          {step === 2 && (
            <span className="text-xs text-primary font-bold">Personalizing USIM...</span>
          )}
          {step === 3 && <span className="text-xs text-white">Encrypting for Transport (eKi)</span>}
          {step === 4 && (
            <span className="text-xs text-success animate-pulse">Importing to UDM/HSM...</span>
          )}
        </div>
      </div>

      {/* Node 2: MNO Core (UDM) */}
      <div
        className={`
        relative z-10 w-24 h-24 rounded-xl flex flex-col items-center justify-center border-2 transition-all duration-500
        ${step === 4 ? 'border-success bg-green-500/10 shadow-[0_0_20px_rgba(0,255,0,0.2)]' : 'border-white/10 bg-black/40'}
      `}
      >
        <Server className="w-8 h-8 mb-2" />
        <div className="font-bold text-center text-xs">MNO Core</div>
        <div className="text-[10px] text-muted-foreground mt-0.5">UDM / HSM</div>
      </div>

      {/* Node 3: USIM (Physical Card) - Positioned absolutely bottom center */}
      <div
        className={`
        absolute bottom-4 left-1/2 -translate-x-1/2 z-10 w-20 h-20 rounded-xl flex flex-col items-center justify-center border-2 transition-all duration-500
        ${step === 2 ? 'border-primary bg-primary/10 shadow-[0_0_20px_rgba(0,255,157,0.2)]' : 'border-white/10 bg-black/40'}
      `}
      >
        <CreditCard className="w-6 h-6 mb-2 rotate-90" />
        <div className="font-bold text-center text-[10px]">USIM</div>
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
