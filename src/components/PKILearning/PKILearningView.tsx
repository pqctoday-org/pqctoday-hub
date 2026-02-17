import React, { lazy, Suspense } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { Dashboard } from './Dashboard'
import { ArrowLeft } from 'lucide-react'

const PKIWorkshop = lazy(() =>
  import('./modules/PKIWorkshop').then((module) => ({ default: module.PKIWorkshop }))
)
const DigitalAssetsModule = lazy(() =>
  import('./modules/DigitalAssets').then((module) => ({ default: module.DigitalAssetsModule }))
)
const FiveGModule = lazy(() =>
  import('./modules/FiveG').then((module) => ({ default: module.FiveGModule }))
)
const DigitalIDModule = lazy(() =>
  import('./modules/DigitalID').then((module) => ({ default: module.DigitalIDModule }))
)
const TLSBasicsModule = lazy(() =>
  import('./modules/TLSBasics').then((module) => ({ default: module.TLSBasicsModule }))
)
const PQC101Module = lazy(() =>
  import('./modules/Module1-Introduction/PQC101Module').then((module) => ({
    default: module.PQC101Module,
  }))
)
const QuizModule = lazy(() =>
  import('./modules/Quiz').then((module) => ({ default: module.QuizModule }))
)

export const PKILearningView: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const isDashboard = location.pathname === '/learn' || location.pathname === '/learn/'

  return (
    <div className="container mx-auto p-4 animate-fade-in">
      {!isDashboard && (
        <button
          onClick={() => navigate('/learn')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>
      )}

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
        </Routes>
      </Suspense>
    </div>
  )
}
