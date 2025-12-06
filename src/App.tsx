import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity,
  Shield,
  Globe,
  Users,
  FlaskConical,
  BookOpen,
  AlertTriangle,
  Info,
  GraduationCap,
} from 'lucide-react'
import './styles/App.css'
import pqcLogo from './assets/PQCT_Logo_V01.png'
import { logPageView } from './utils/analytics'
import { Button } from './components/ui/button'
import { ModeToggle } from './components/mode-toggle'

import { TimelineView } from './components/Timeline/TimelineView'
import { ThreatsDashboard } from './components/Threats/ThreatsDashboard'
import { LeadersGrid } from './components/Leaders/LeadersGrid'
import { AlgorithmsView } from './components/Algorithms/AlgorithmsView'
import { PlaygroundView } from './components/Playground/PlaygroundView'
import { OpenSSLStudioView } from './components/OpenSSLStudio/OpenSSLStudioView'
import { LibraryView } from './components/Library/LibraryView'
import { AboutView } from './components/About/AboutView'
import { PKILearningView } from './components/PKILearning/PKILearningView'

type View =
  | 'timeline'
  | 'algorithms'
  | 'library'
  | 'learn'
  | 'playground'
  | 'openssl'
  | 'threats'
  | 'leaders'
  | 'about'

function App() {
  const [currentView, setCurrentView] = useState<View>('timeline')

  useEffect(() => {
    logPageView(`/${currentView}`)
  }, [currentView])

  // Build timestamp - set at compile time
  const buildTime = __BUILD_TIMESTAMP__

  const navItems = [
    { id: 'timeline', label: 'Timeline', icon: Globe },
    { id: 'algorithms', label: 'Algorithms', icon: Shield },
    { id: 'library', label: 'Library', icon: BookOpen },
    { id: 'learn', label: 'Learn', icon: GraduationCap },
    { id: 'playground', label: 'Playground', icon: FlaskConical },
    { id: 'openssl', label: 'OpenSSL Studio', icon: Activity },
    { id: 'threats', label: 'Threats', icon: AlertTriangle },
    { id: 'leaders', label: 'Leaders', icon: Users },
    { id: 'about', label: 'About', icon: Info },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="m-4 sticky top-4 z-50 transition-all duration-300" role="banner">
        <div className="glass-panel p-4 flex w-full justify-between items-center">
          <div className="flex flex-row items-baseline gap-4">
            <img src={pqcLogo} alt="PQC Today Logo" className="object-contain mr-4 h-8 w-auto" />
            <div>
              <h1 className="text-2xl font-bold text-gradient">PQC Today</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest opacity-60">
                Last Updated: {buildTime}
              </p>
            </div>
          </div>
          <nav className="flex gap-2" role="navigation" aria-label="Main navigation">
            {navItems.map((item) => (
              <Button
                key={item.id}
                onClick={() => setCurrentView(item.id as View)}
                variant="ghost"
                size="sm"
                aria-label={`${item.label} view`}
                aria-current={currentView === item.id ? 'page' : undefined}
                className={
                  currentView === item.id
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:text-foreground'
                }
              >
                <item.icon size={18} aria-hidden="true" className="mr-2" />
                <span className="hidden md:inline">{item.label}</span>
              </Button>
            ))}
            <div className="ml-2 border-l border-border pl-2">
              <ModeToggle />
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow container py-8" role="main">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {currentView === 'timeline' && <TimelineView />}
            {currentView === 'algorithms' && <AlgorithmsView />}
            {currentView === 'library' && <LibraryView />}
            {currentView === 'learn' && <PKILearningView />}
            {currentView === 'playground' && <PlaygroundView />}
            {currentView === 'openssl' && <OpenSSLStudioView />}
            {currentView === 'threats' && <ThreatsDashboard />}
            {currentView === 'leaders' && <LeadersGrid />}
            {currentView === 'about' && <AboutView />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12 py-8 text-center text-muted-foreground text-sm">
        <p>© 2025 PQC Today. Data sourced from the public internet resources.</p>
      </footer>
    </div>
  )
}

export default App
