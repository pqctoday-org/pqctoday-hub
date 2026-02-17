import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'

import { logPageView } from './utils/analytics'
import { useEffect } from 'react'
import { lazy, Suspense } from 'react'
import { MainLayout } from './components/Layout/MainLayout'

// Lazy load route components for code splitting
const TimelineView = lazy(() =>
  import('./components/Timeline/TimelineView').then((module) => ({ default: module.TimelineView }))
)
const ThreatsDashboard = lazy(() =>
  import('./components/Threats/ThreatsDashboard').then((module) => ({
    default: module.ThreatsDashboard,
  }))
)
const LeadersGrid = lazy(() =>
  import('./components/Leaders/LeadersGrid').then((module) => ({ default: module.LeadersGrid }))
)
const AlgorithmsView = lazy(() =>
  import('./components/Algorithms/AlgorithmsView').then((module) => ({
    default: module.AlgorithmsView,
  }))
)
const PlaygroundView = lazy(() =>
  import('./components/Playground/PlaygroundView').then((module) => ({
    default: module.PlaygroundView,
  }))
)
const OpenSSLStudioView = lazy(() =>
  import('./components/OpenSSLStudio/OpenSSLStudioView').then((module) => ({
    default: module.OpenSSLStudioView,
  }))
)
const LibraryView = lazy(() =>
  import('./components/Library/LibraryView').then((module) => ({ default: module.LibraryView }))
)
const MigrateView = lazy(() =>
  import('./components/Migrate/MigrateView').then((module) => ({
    default: module.MigrateView,
  }))
)
const AboutView = lazy(() =>
  import('./components/About/AboutView').then((module) => ({ default: module.AboutView }))
)
const PKILearningView = lazy(() =>
  import('./components/PKILearning/PKILearningView').then((module) => ({
    default: module.PKILearningView,
  }))
)
const ComplianceView = lazy(() =>
  import('./components/Compliance/ComplianceView').then((module) => ({
    default: module.ComplianceView,
  }))
)
const ChangelogView = lazy(() =>
  import('./components/Changelog/ChangelogView').then((module) => ({
    default: module.ChangelogView,
  }))
)
const LandingView = lazy(() =>
  import('./components/Landing/LandingView').then((module) => ({
    default: module.LandingView,
  }))
)
const AssessView = lazy(() => import('./components/Assess/AssessView'))
const ExecutiveView = lazy(() => import('./components/Executive/ExecutiveView'))

// Helper component to log page views on route change
function AnalyticsTracker() {
  const location = useLocation()

  useEffect(() => {
    logPageView(location.pathname)
  }, [location])

  return null
}

import { ScrollToTop } from './components/Router/ScrollToTop'

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AnalyticsTracker />
      <Suspense
        fallback={
          <div className="flex h-screen w-full items-center justify-center bg-black">
            <div className="text-xl font-bold text-gradient">
              Initializing Secure Environment...
            </div>
          </div>
        }
      >
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<LandingView />} />
            <Route path="/timeline" element={<TimelineView />} />
            <Route path="/algorithms" element={<AlgorithmsView />} />
            <Route path="/library" element={<LibraryView />} />
            <Route path="/learn/*" element={<PKILearningView />} />
            <Route path="/playground" element={<PlaygroundView />} />
            <Route path="/openssl" element={<OpenSSLStudioView />} />
            <Route path="/threats" element={<ThreatsDashboard />} />
            <Route path="/leaders" element={<LeadersGrid />} />
            <Route path="/compliance" element={<ComplianceView />} />
            <Route path="/changelog" element={<ChangelogView />} />
            <Route path="/migrate" element={<MigrateView />} />
            <Route path="/about" element={<AboutView />} />
            <Route path="/assess" element={<AssessView />} />
            <Route path="/executive" element={<ExecutiveView />} />
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
