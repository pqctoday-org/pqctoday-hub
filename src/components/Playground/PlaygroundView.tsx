import { InteractivePlayground } from './InteractivePlayground'
import { MobilePlaygroundView } from './MobilePlaygroundView'
import { FlaskConical } from 'lucide-react'
import { ShareButton } from '../ui/ShareButton'

export const PlaygroundView = () => {
  return (
    <div>
      {/* Mobile View */}
      <div className="md:hidden">
        <MobilePlaygroundView />
      </div>

      {/* Desktop View */}
      <div className="hidden md:block">
        <div className="mb-2 md:mb-8">
          <h2 className="text-xl md:text-3xl font-bold text-gradient mb-1 md:mb-2 flex items-center gap-2 md:gap-3">
            <FlaskConical className="text-secondary w-5 h-5 md:w-8 md:h-8" aria-hidden="true" />
            Interactive Playground
          </h2>
          <div className="hidden md:flex items-center gap-2">
            <p className="text-muted-foreground">
              Test ML-KEM and ML-DSA post-quantum cryptographic algorithms in real-time using
              WebAssembly
            </p>
            <ShareButton
              title="PQC Playground — Test ML-KEM & ML-DSA in Your Browser"
              text="Run real post-quantum cryptographic operations in your browser — key generation, encapsulation, signing with ML-KEM and ML-DSA via WASM."
            />
          </div>
        </div>
        <InteractivePlayground />
      </div>
    </div>
  )
}
