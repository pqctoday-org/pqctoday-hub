// SPDX-License-Identifier: GPL-3.0-only
import React, { Suspense } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { Dashboard } from './Dashboard'
import { ArrowLeft } from 'lucide-react'
import { GlossaryButton } from '../ui/GlossaryButton'
import { lazyWithRetry } from '@/utils/lazyWithRetry'
import { ModuleProgressSidebar } from './ModuleProgressSidebar'
import { ModuleProgressHeader } from './ModuleProgressHeader'

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
const KmsPqcModule = lazyWithRetry(() =>
  import('./modules/KmsPqc').then((module) => ({ default: module.KmsPqcModule }))
)
const HsmPqcModule = lazyWithRetry(() =>
  import('./modules/HsmPqc').then((module) => ({ default: module.HsmPqcModule }))
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
const CodeSigningModule = lazyWithRetry(() =>
  import('./modules/CodeSigning').then((module) => ({
    default: module.CodeSigningModule,
  }))
)
const APISecurityJWTModule = lazyWithRetry(() =>
  import('./modules/APISecurityJWT').then((module) => ({
    default: module.APISecurityJWTModule,
  }))
)
const IoTOTModule = lazyWithRetry(() =>
  import('./modules/IoTOT').then((module) => ({
    default: module.IoTOTModule,
  }))
)
const PQCRiskManagementModule = lazyWithRetry(() =>
  import('./modules/PQCRiskManagement').then((module) => ({
    default: module.PQCRiskManagementModule,
  }))
)
const PQCBusinessCaseModule = lazyWithRetry(() =>
  import('./modules/PQCBusinessCase').then((module) => ({
    default: module.PQCBusinessCaseModule,
  }))
)
const PQCGovernanceModule = lazyWithRetry(() =>
  import('./modules/PQCGovernance').then((module) => ({
    default: module.PQCGovernanceModule,
  }))
)
const VendorRiskModule = lazyWithRetry(() =>
  import('./modules/VendorRisk').then((module) => ({
    default: module.VendorRiskModule,
  }))
)
const MigrationProgramModule = lazyWithRetry(() =>
  import('./modules/MigrationProgram').then((module) => ({
    default: module.MigrationProgramModule,
  }))
)
const ComplianceStrategyModule = lazyWithRetry(() =>
  import('./modules/ComplianceStrategy').then((module) => ({
    default: module.ComplianceStrategyModule,
  }))
)
const DataAssetSensitivityModule = lazyWithRetry(() =>
  import('./modules/DataAssetSensitivity').then((module) => ({
    default: module.DataAssetSensitivityModule,
  }))
)
const StandardsBodiesModule = lazyWithRetry(() =>
  import('./modules/StandardsBodies').then((module) => ({
    default: module.StandardsBodiesModule,
  }))
)
const ConfidentialComputingModule = lazyWithRetry(() =>
  import('./modules/ConfidentialComputing').then((module) => ({
    default: module.ConfidentialComputingModule,
  }))
)
const WebGatewayPQCModule = lazyWithRetry(() =>
  import('./modules/WebGatewayPQC').then((module) => ({
    default: module.WebGatewayPQCModule,
  }))
)

export const PKILearningView: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const isDashboard = location.pathname === '/learn' || location.pathname === '/learn/'

  // Derive moduleId from URL path (e.g. '/learn/pqc-101' → 'pqc-101')
  const moduleId = location.pathname.replace(/^\/learn\/?/, '')
  // Show progress sidebar for module pages (not dashboard, not quiz)
  const showSidebar = !isDashboard && moduleId !== 'quiz' && moduleId !== ''

  return (
    <div className="animate-fade-in">
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

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 items-start">
        {/* Progress sidebar — mobile accordion (order-first) then desktop aside (order-last) */}
        {showSidebar && (
          <div className="order-first lg:order-last w-full lg:w-auto shrink-0">
            <ModuleProgressSidebar moduleId={moduleId} />
          </div>
        )}

        {/* Main module content */}
        <div className="flex-1 min-w-0 order-last lg:order-first">
          {/* Dual progress header bar — above all module tabs */}
          {showSidebar && <ModuleProgressHeader moduleId={moduleId} />}
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
              <Route path="kms-pqc" element={<KmsPqcModule />} />
              <Route path="hsm-pqc" element={<HsmPqcModule />} />
              <Route path="qkd" element={<QKDModule />} />
              <Route path="entropy-randomness" element={<EntropyModule />} />
              <Route path="merkle-tree-certs" element={<MerkleTreeCertsModule />} />
              <Route path="code-signing" element={<CodeSigningModule />} />
              <Route path="api-security-jwt" element={<APISecurityJWTModule />} />
              <Route path="iot-ot-pqc" element={<IoTOTModule />} />
              <Route path="pqc-risk-management" element={<PQCRiskManagementModule />} />
              <Route path="pqc-business-case" element={<PQCBusinessCaseModule />} />
              <Route path="pqc-governance" element={<PQCGovernanceModule />} />
              <Route path="vendor-risk" element={<VendorRiskModule />} />
              <Route path="migration-program" element={<MigrationProgramModule />} />
              <Route path="compliance-strategy" element={<ComplianceStrategyModule />} />
              <Route path="data-asset-sensitivity" element={<DataAssetSensitivityModule />} />
              <Route path="standards-bodies" element={<StandardsBodiesModule />} />
              <Route path="confidential-computing" element={<ConfidentialComputingModule />} />
              <Route path="web-gateway-pqc" element={<WebGatewayPQCModule />} />
            </Routes>
          </Suspense>
        </div>
      </div>
    </div>
  )
}
