// SPDX-License-Identifier: GPL-3.0-only
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'

import { logPageView } from './utils/analytics'
import { useEffect } from 'react'
import { Suspense } from 'react'
import { MainLayout } from './components/Layout/MainLayout'
import { ErrorBoundary } from './components/ErrorBoundary'
import { useModuleStore } from './store/useModuleStore'
import { seedHistoryFromStores } from './services/history/seedHistory'
import { useAchievementChecker } from './hooks/useAchievementChecker'
import { AchievementSectionTracker } from './components/AchievementSectionTracker'
import { lazyWithRetry } from './utils/lazyWithRetry'
import { PageMeta } from './seo/PageMeta'
import { EmbedLayout } from './components/Layout/EmbedLayout'
import { EmbedRouteGuard } from './embed/EmbedRouteGuard'
import { EmbedNavigationGuard } from './embed/EmbedNavigationGuard'

// Lazy load route components with automatic retry on chunk fetch failures
const TimelineView = lazyWithRetry(() =>
  import('./components/Timeline/TimelineView').then((module) => ({ default: module.TimelineView }))
)
const ThreatsDashboard = lazyWithRetry(() =>
  import('./components/Threats/ThreatsDashboard').then((module) => ({
    default: module.ThreatsDashboard,
  }))
)
const LeadersGrid = lazyWithRetry(() =>
  import('./components/Leaders/LeadersGrid').then((module) => ({ default: module.LeadersGrid }))
)
const AlgorithmsView = lazyWithRetry(() =>
  import('./components/Algorithms/AlgorithmsView').then((module) => ({
    default: module.AlgorithmsView,
  }))
)
const PlaygroundShell = lazyWithRetry(() =>
  import('./components/Playground/PlaygroundShell').then((module) => ({
    default: module.PlaygroundShell,
  }))
)
const PlaygroundWorkshop = lazyWithRetry(() =>
  import('./components/Playground/PlaygroundWorkshop').then((module) => ({
    default: module.PlaygroundWorkshop,
  }))
)
const PlaygroundView = lazyWithRetry(() =>
  import('./components/Playground/PlaygroundView').then((module) => ({
    default: module.PlaygroundView,
  }))
)
const HsmPlayground = lazyWithRetry(() =>
  import('./components/Playground/HsmPlayground').then((module) => ({
    default: module.HsmPlayground,
  }))
)
const PlaygroundToolRoute = lazyWithRetry(() =>
  import('./components/Playground/PlaygroundToolRoute').then((module) => ({
    default: module.PlaygroundToolRoute,
  }))
)
const OpenSSLStudioView = lazyWithRetry(() =>
  import('./components/OpenSSLStudio/OpenSSLStudioView').then((module) => ({
    default: module.OpenSSLStudioView,
  }))
)
const LibraryView = lazyWithRetry(() =>
  import('./components/Library/LibraryView').then((module) => ({ default: module.LibraryView }))
)
const MigrateView = lazyWithRetry(() =>
  import('./components/Migrate/MigrateView').then((module) => ({
    default: module.MigrateView,
  }))
)
const AboutView = lazyWithRetry(() =>
  import('./components/About/AboutView').then((module) => ({ default: module.AboutView }))
)
const PKILearningView = lazyWithRetry(() =>
  import('./components/PKILearning/PKILearningView').then((module) => ({
    default: module.PKILearningView,
  }))
)
const ComplianceView = lazyWithRetry(() =>
  import('./components/Compliance/ComplianceView').then((module) => ({
    default: module.ComplianceView,
  }))
)
const ChangelogView = lazyWithRetry(() =>
  import('./components/Changelog/ChangelogView').then((module) => ({
    default: module.ChangelogView,
  }))
)
const LandingView = lazyWithRetry(() =>
  import('./components/Landing/LandingView').then((module) => ({
    default: module.LandingView,
  }))
)
const AssessView = lazyWithRetry(() =>
  import('./components/Assess/AssessView').then((module) => ({ default: module.AssessView }))
)
const ReportView = lazyWithRetry(() =>
  import('./components/Report/ReportView').then((module) => ({ default: module.ReportView }))
)
const BusinessCenterShell = lazyWithRetry(() =>
  import('./components/BusinessCenter/BusinessCenterShell').then((module) => ({
    default: module.BusinessCenterShell,
  }))
)
const BusinessCenterView = lazyWithRetry(() =>
  import('./components/BusinessCenter/BusinessCenterView').then((module) => ({
    default: module.BusinessCenterView,
  }))
)
const BusinessToolsGrid = lazyWithRetry(() =>
  import('./components/BusinessCenter/BusinessToolsGrid').then((module) => ({
    default: module.BusinessToolsGrid,
  }))
)
const BusinessToolRoute = lazyWithRetry(() =>
  import('./components/BusinessCenter/BusinessToolRoute').then((module) => ({
    default: module.BusinessToolRoute,
  }))
)
const FAQPage = lazyWithRetry(() =>
  import('./components/FAQ/FAQPage').then((module) => ({
    default: module.FAQPage,
  }))
)
const TermsView = lazyWithRetry(() =>
  import('./components/Terms/TermsView').then((module) => ({
    default: module.TermsView,
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

function AchievementChecker() {
  useAchievementChecker()
  return null
}

function DailyVisitTracker() {
  const trackDailyVisit = useModuleStore((s) => s.trackDailyVisit)
  useEffect(() => {
    trackDailyVisit()
  }, [trackDailyVisit])
  return null
}

function HistorySeeder() {
  useEffect(() => {
    seedHistoryFromStores()
  }, [])
  return null
}

function App() {
  const commonRoutes = (
    <>
      <Route
        path="timeline"
        element={
          <ErrorBoundary>
            <TimelineView />
          </ErrorBoundary>
        }
      />
      <Route
        path="algorithms"
        element={
          <ErrorBoundary>
            <AlgorithmsView />
          </ErrorBoundary>
        }
      />
      <Route
        path="library"
        element={
          <ErrorBoundary>
            <LibraryView />
          </ErrorBoundary>
        }
      />
      <Route
        path="learn/*"
        element={
          <ErrorBoundary>
            <PKILearningView />
          </ErrorBoundary>
        }
      />
      <Route
        path="playground"
        element={
          <ErrorBoundary>
            <PlaygroundShell />
          </ErrorBoundary>
        }
      >
        <Route index element={<PlaygroundWorkshop />} />
        <Route path="interactive" element={<PlaygroundView />} />
        <Route path="hsm" element={<HsmPlayground />} />
        <Route path=":toolId" element={<PlaygroundToolRoute />} />
      </Route>
      <Route
        path="openssl"
        element={
          <ErrorBoundary>
            <OpenSSLStudioView />
          </ErrorBoundary>
        }
      />
      <Route
        path="threats"
        element={
          <ErrorBoundary>
            <ThreatsDashboard />
          </ErrorBoundary>
        }
      />
      <Route
        path="leaders"
        element={
          <ErrorBoundary>
            <LeadersGrid />
          </ErrorBoundary>
        }
      />
      <Route
        path="compliance"
        element={
          <ErrorBoundary>
            <ComplianceView />
          </ErrorBoundary>
        }
      />
      <Route
        path="changelog"
        element={
          <ErrorBoundary>
            <ChangelogView />
          </ErrorBoundary>
        }
      />
      <Route
        path="migrate"
        element={
          <ErrorBoundary>
            <MigrateView />
          </ErrorBoundary>
        }
      />
      <Route
        path="about"
        element={
          <ErrorBoundary>
            <AboutView />
          </ErrorBoundary>
        }
      />
      <Route
        path="assess"
        element={
          <ErrorBoundary>
            <AssessView />
          </ErrorBoundary>
        }
      />
      <Route
        path="report"
        element={
          <ErrorBoundary>
            <ReportView />
          </ErrorBoundary>
        }
      />
      <Route
        path="business"
        element={
          <ErrorBoundary>
            <BusinessCenterShell />
          </ErrorBoundary>
        }
      >
        <Route index element={<BusinessCenterView />} />
        <Route path="tools" element={<BusinessToolsGrid />} />
        <Route path="tools/:toolId" element={<BusinessToolRoute />} />
      </Route>
      <Route
        path="faq"
        element={
          <ErrorBoundary>
            <FAQPage />
          </ErrorBoundary>
        }
      />
      <Route
        path="terms"
        element={
          <ErrorBoundary>
            <TermsView />
          </ErrorBoundary>
        }
      />
    </>
  )

  return (
    <BrowserRouter>
      <ScrollToTop />
      <AnalyticsTracker />
      <EmbedNavigationGuard />
      <AchievementChecker />
      <AchievementSectionTracker />
      <DailyVisitTracker />
      <HistorySeeder />
      <PageMeta />
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
          <Route
            path="/embed"
            element={
              <EmbedRouteGuard>
                <EmbedLayout />
              </EmbedRouteGuard>
            }
          >
            <Route index element={<Navigate to="learn" replace />} />
            {commonRoutes}
            <Route path="*" element={<Navigate to="/embed" replace />} />
          </Route>

          <Route element={<MainLayout />}>
            <Route
              path="/"
              element={
                <ErrorBoundary>
                  <LandingView />
                </ErrorBoundary>
              }
            />
            {commonRoutes}
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
