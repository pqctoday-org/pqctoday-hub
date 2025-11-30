import { AlgorithmComparison } from './AlgorithmComparison'
import { Binary } from 'lucide-react'

export const AlgorithmsView = () => {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gradient mb-2 flex items-center gap-3">
          <Binary className="text-primary" aria-hidden="true" />
          Algorithm Transition
        </h2>
        <p className="text-muted">
          Migration from classical to post-quantum cryptographic algorithms
        </p>
      </div>
      <AlgorithmComparison />
    </div>
  )
}
