import { InteractivePlayground } from './InteractivePlayground'
import { FlaskConical } from 'lucide-react'

export const PlaygroundView = () => {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gradient mb-2 flex items-center gap-3">
          <FlaskConical className="text-secondary" aria-hidden="true" />
          Interactive Playground
        </h2>
        <p className="text-muted">
          Test ML-KEM and ML-DSA post-quantum cryptographic algorithms in real-time using
          WebAssembly
        </p>
      </div>
      <InteractivePlayground />
    </div>
  )
}
