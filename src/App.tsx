import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'

import { logPageView } from './utils/analytics'
import { useEffect } from 'react'
import { MainLayout } from './components/Layout/MainLayout'

import { TimelineView } from './components/Timeline/TimelineView'
import { ThreatsDashboard } from './components/Threats/ThreatsDashboard'
import { LeadersGrid } from './components/Leaders/LeadersGrid'
import { AlgorithmsView } from './components/Algorithms/AlgorithmsView'
import { PlaygroundView } from './components/Playground/PlaygroundView'
import { OpenSSLStudioView } from './components/OpenSSLStudio/OpenSSLStudioView'
import { LibraryView } from './components/Library/LibraryView'
import { AboutView } from './components/About/AboutView'
import { PKILearningView } from './components/PKILearning/PKILearningView'

// Helper component to log page views on route change
function AnalyticsTracker() {
  const location = useLocation()

  useEffect(() => {
    logPageView(location.pathname)
  }, [location])

  return null
}

function App() {
  return (
    <BrowserRouter>
      <AnalyticsTracker />
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<TimelineView />} />
          <Route path="/algorithms" element={<AlgorithmsView />} />
          <Route path="/library" element={<LibraryView />} />
          <Route path="/learn" element={<PKILearningView />} />
          <Route path="/playground" element={<PlaygroundView />} />
          <Route path="/openssl" element={<OpenSSLStudioView />} />
          <Route path="/threats" element={<ThreatsDashboard />} />
          <Route path="/leaders" element={<LeadersGrid />} />
          <Route path="/about" element={<AboutView />} />
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
