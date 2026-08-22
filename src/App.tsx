// SPDX-License-Identifier: GPL-3.0-only
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router'

import { logPageView, logStreakMilestone } from './utils/analytics'
import { useEffect, useRef } from 'react'
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
import { LibraryViewSkeleton } from './components/Library/redesign/LibraryViewSkeleton'
import { MigrationWorkbenchSkeleton } from './components/Migrate/Workbench/MigrationWorkbenchSkeleton'

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
const SimulationView = lazyWithRetry(() =>
  import('./components/Simulation/SimulationView').then((module) => ({
    default: module.SimulationView,
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
const KmipPlaygroundView = lazyWithRetry(() =>
  import('./components/Playground/kmip/KmipPlaygroundView').then((module) => ({
    default: module.KmipPlaygroundView,
  }))
)
const DockerPlaygroundView = lazyWithRetry(() =>
  import('./components/Playground/DockerPlaygroundView').then((module) => ({
    default: module.DockerPlaygroundView,
  }))
)
const PlaygroundToolRoute = lazyWithRetry(() =>
  import('./components/Playground/PlaygroundToolRoute').then((module) => ({
    default: module.PlaygroundToolRoute,
  }))
)
const MigrationWorkbench = lazyWithRetry(() =>
  import('./components/Migrate/Workbench/MigrationWorkbench').then((module) => ({
    default: module.MigrationWorkbench,
  }))
)
const OpenSSLStudioView = lazyWithRetry(() =>
  import('./components/OpenSSLStudio/OpenSSLStudioView').then((module) => ({
    default: module.OpenSSLStudioView,
  }))
)
const LibraryViewRedesign = lazyWithRetry(() =>
  import('./components/Library/redesign/LibraryViewRedesign').then((module) => ({
    default: module.LibraryViewRedesign,
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
const AssessViewRedesign = lazyWithRetry(() =>
  import('./components/Assess/redesign/AssessViewRedesign').then((module) => ({
    default: module.AssessViewRedesign,
  }))
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
const EditorialIndependenceView = lazyWithRetry(() =>
  import('./components/Editorial/EditorialIndependenceView').then((module) => ({
    default: module.EditorialIndependenceView,
  }))
)
const SponsorView = lazyWithRetry(() =>
  import('./components/Sponsor/SponsorView').then((module) => ({
    default: module.SponsorView,
  }))
)
const ExploreView = lazyWithRetry(() =>
  import('./components/Explore/ExploreView').then((module) => ({
    default: module.ExploreView,
  }))
)
const PatentsViewRedesign = lazyWithRetry(() =>
  import('./components/Patents/redesign/PatentsViewRedesign').then((module) => ({
    default: module.PatentsViewRedesign,
  }))
)
const RevisionsView = lazyWithRetry(() =>
  import('./components/Revisions/RevisionsView').then((module) => ({
    default: module.RevisionsView,
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
import { SpecDrawerHost } from './components/Library/SpecDrawerHost'
import { TryToolModalHost } from './components/Playground/TryToolModalHost'
import { useTheme } from './hooks/useTheme'
import { useUrlPersonaOverride } from './hooks/useUrlPersonaOverride'

function ThemeApplier() {
  useTheme()
  return null
}

function UrlPersonaOverride() {
  useUrlPersonaOverride()
  return null
}

function AchievementChecker() {
  useAchievementChecker()
  return null
}

// Matches achievementCatalog.ts's streak-3/7/14/30 badges.
const STREAK_MILESTONES = new Set([3, 7, 14, 30])

function DailyVisitTracker() {
  const trackDailyVisit = useModuleStore((s) => s.trackDailyVisit)
  const currentStreak = useModuleStore((s) => s.sessionTracking?.currentStreak ?? 0)
  // Guards against re-firing on every reload when the streak already sat on
  // a milestone from a previous day — only a real change during this session
  // should log an event, the same change-detection ComplianceView already
  // uses for compliance_framework_selection.
  const prevStreakRef = useRef(currentStreak)

  useEffect(() => {
    trackDailyVisit()
  }, [trackDailyVisit])

  useEffect(() => {
    if (currentStreak !== prevStreakRef.current && STREAK_MILESTONES.has(currentStreak)) {
      logStreakMilestone(currentStreak)
    }
    prevStreakRef.current = currentStreak
  }, [currentStreak])

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
            {/* Route-local Suspense so the wait for the /library chunk paints a
                page-shaped skeleton instead of the app-wide splash. */}
            <Suspense fallback={<LibraryViewSkeleton />}>
              <LibraryViewRedesign />
            </Suspense>
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
        <Route path="cacp" element={<KmipPlaygroundView />} />
        <Route path="docker" element={<DockerPlaygroundView />} />
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
            {/* Route-local Suspense — same reasoning as /library above. */}
            <Suspense fallback={<MigrationWorkbenchSkeleton />}>
              <MigrationWorkbench />
            </Suspense>
          </ErrorBoundary>
        }
      />
      {/* /migrate and /migrate/workbench rendered the byte-identical component with
          no internal link ever pointing at /workbench — collapse the silent
          duplicate into a redirect rather than keep two routes for one page. */}
      <Route path="migrate/workbench" element={<Navigate to="/migrate" replace />} />
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
            <AssessViewRedesign />
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
      <Route
        path="editorial-independence"
        element={
          <ErrorBoundary>
            <EditorialIndependenceView />
          </ErrorBoundary>
        }
      />
      <Route
        path="sponsor"
        element={
          <ErrorBoundary>
            <SponsorView />
          </ErrorBoundary>
        }
      />
      <Route
        path="explore"
        element={
          <ErrorBoundary>
            <ExploreView />
          </ErrorBoundary>
        }
      />
      <Route
        path="patents"
        element={
          <ErrorBoundary>
            <PatentsViewRedesign />
          </ErrorBoundary>
        }
      />
      <Route
        path="revisions"
        element={
          <ErrorBoundary>
            <RevisionsView />
          </ErrorBoundary>
        }
      />
    </>
  )

  return (
    <BrowserRouter>
      <ScrollToTop />
      <AnalyticsTracker />
      <ThemeApplier />
      <UrlPersonaOverride />
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
            <Route index element={<Navigate to={`learn${window.location.search}`} replace />} />
            {commonRoutes}
            <Route path="*" element={<Navigate to={`/embed${window.location.search}`} replace />} />
          </Route>

          {/* Full-viewport console — rendered OUTSIDE MainLayout (no nav shell). */}
          <Route
            path="/simulation"
            element={
              <ErrorBoundary>
                <SimulationView />
              </ErrorBoundary>
            }
          />

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
      {/* After <Routes> on purpose: the drawer and the page header are both
          z-50, so DOM order decides which paints on top. */}
      <SpecDrawerHost />
      <TryToolModalHost />
    </BrowserRouter>
  )
}

export default App
