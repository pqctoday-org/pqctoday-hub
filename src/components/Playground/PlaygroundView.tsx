// SPDX-License-Identifier: GPL-3.0-only
import { InteractivePlayground } from './InteractivePlayground'
import { FlaskConical } from 'lucide-react'
import { PageHeader } from '../common/PageHeader'

export const PlaygroundView = () => {
  return (
    <div>
      <PageHeader
        icon={FlaskConical}
        title="Interactive Playground"
        description="Test ML-KEM and ML-DSA post-quantum cryptographic algorithms in real-time using WebAssembly."
        shareTitle="PQC Playground — Test ML-KEM & ML-DSA in Your Browser"
        shareText="Run real post-quantum cryptographic operations in your browser — key generation, encapsulation, signing with ML-KEM and ML-DSA via WASM."
      />
      <InteractivePlayground />
    </div>
  )
}
