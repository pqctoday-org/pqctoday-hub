import React, { Suspense } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { Dashboard } from './Dashboard'
import { ArrowLeft } from 'lucide-react'
import { GlossaryButton } from '../ui/GlossaryButton'
import { lazyWithRetry } from '@/utils/lazyWithRetry'

const PKIWorkshop = lazyWithRetry(() =>
  import('./modules/PKIWorkshop').then((module) => ({ default: module.PKIWorkshop }))
)
const DigitalAssetsModule = lazyWithRetry(() =>
  import('./modules/DigitalAssets').then((module) => ({ default: module.DigitalAssetsModule }))
)
const FiveGModule = lazyWithRetry(() =>
  import('./modules/FiveG').then((module) => ({ default: module.FiveGModule }))
)
const DigitalIDModule = lazyWithRetry(() =>
  import('./modules/DigitalID').then((module) => ({ default: module.DigitalIDModule }))
)
const TLSBasicsModule = lazyWithRetry(() =>
  import('./modules/TLSBasics').then((module) => ({ default: module.TLSBasicsModule }))
)
const PQC101Module = lazyWithRetry(() =>
  import('./modules/Module1-Introduction').then((module) => ({
    default: module.Module1,
  }))
)
const QuizModule = lazyWithRetry(() =>
  import('./modules/Quiz').then((module) => ({ default: module.QuizModule }))
)
const QuantumThreatsModule = lazyWithRetry(() =>
  import('./modules/QuantumThreats').then((module) => ({ default: module.QuantumThreatsModule }))
)
const HybridCryptoModule = lazyWithRetry(() =>
  import('./modules/HybridCrypto').then((module) => ({ default: module.HybridCryptoModule }))
)
const CryptoAgilityModule = lazyWithRetry(() =>
  import('./modules/CryptoAgility').then((module) => ({ default: module.CryptoAgilityModule }))
)
const StatefulSignaturesModule = lazyWithRetry(() =>
  import('./modules/StatefulSignatures').then((module) => ({
    default: module.StatefulSignaturesModule,
  }))
)
const EmailSigningModule = lazyWithRetry(() =>
  import('./modules/EmailSigning').then((module) => ({
    default: module.EmailSigningModule,
  }))
)
const VPNSSHModule = lazyWithRetry(() =>
  import('./modules/VPNSSHModule').then((module) => ({ default: module.VPNSSHModule }))
)
const KeyManagementModule = lazyWithRetry(() =>
  import('./modules/KeyManagement').then((module) => ({ default: module.KeyManagementModule }))
)
const QKDModule = lazyWithRetry(() =>
  import('./modules/QKD').then((module) => ({ default: module.QKDModule }))
)
const EntropyModule = lazyWithRetry(() =>
  import('./modules/Entropy').then((module) => ({ default: module.EntropyModule }))
)
const MerkleTreeCertsModule = lazyWithRetry(() =>
  import('./modules/MerkleTreeCerts').then((module) => ({
    default: module.MerkleTreeCertsModule,
  }))
)

export const PKILearningView: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const isDashboard = location.pathname === '/learn' || location.pathname === '/learn/'

  return (
    <div className="container mx-auto p-4 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        {!isDashboard ? (
          <button
            onClick={() => navigate('/learn')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Dashboard
          </button>
        ) : (
          <div />
        )}
        <GlossaryButton />
      </div>

      <Suspense
        fallback={
          <div className="flex h-64 w-full items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-muted-foreground animate-pulse">Loading Module...</p>
            </div>
          </div>
        }
      >
        <Routes>
          <Route index element={<Dashboard />} />
          <Route path="pki-workshop" element={<PKIWorkshop />} />
          <Route path="digital-assets" element={<DigitalAssetsModule />} />
          <Route path="5g-security" element={<FiveGModule />} />
          <Route path="digital-id" element={<DigitalIDModule />} />
          <Route path="tls-basics" element={<TLSBasicsModule />} />
          <Route path="pqc-101" element={<PQC101Module />} />
          <Route path="quiz" element={<QuizModule />} />
          <Route path="quantum-threats" element={<QuantumThreatsModule />} />
          <Route path="hybrid-crypto" element={<HybridCryptoModule />} />
          <Route path="crypto-agility" element={<CryptoAgilityModule />} />
          <Route path="stateful-signatures" element={<StatefulSignaturesModule />} />
          <Route path="email-signing" element={<EmailSigningModule />} />
          <Route path="vpn-ssh-pqc" element={<VPNSSHModule />} />
          <Route path="key-management" element={<KeyManagementModule />} />
          <Route path="qkd" element={<QKDModule />} />
          <Route path="entropy-randomness" element={<EntropyModule />} />
          <Route path="merkle-tree-certs" element={<MerkleTreeCertsModule />} />
        </Routes>
      </Suspense>
    </div>
  )
}
