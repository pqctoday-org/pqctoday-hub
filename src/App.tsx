import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'

import { logPageView } from './utils/analytics'
import { useEffect } from 'react'
import { lazy } from 'react'
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
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<TimelineView />} />
          <Route path="/algorithms" element={<AlgorithmsView />} />
          <Route path="/library" element={<LibraryView />} />
          <Route path="/learn/*" element={<PKILearningView />} />
          <Route path="/playground" element={<PlaygroundView />} />
          <Route path="/openssl" element={<OpenSSLStudioView />} />
          <Route path="/threats" element={<ThreatsDashboard />} />
          <Route path="/leaders" element={<LeadersGrid />} />
          <Route path="/compliance" element={<ComplianceView />} />
          <Route path="/about" element={<AboutView />} />
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
