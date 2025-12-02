import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, Shield, Globe, Users, FlaskConical, BookOpen, AlertTriangle } from 'lucide-react'
import clsx from 'clsx'
import './styles/App.css'
import pqcLogo from './assets/PQCT_Logo_V01.png'
import { logPageView } from './utils/analytics'

import { TimelineView } from './components/Timeline/TimelineView'
import { ThreatsDashboard } from './components/Threats/ThreatsDashboard'
import { LeadersGrid } from './components/Leaders/LeadersGrid'
import { AlgorithmsView } from './components/Algorithms/AlgorithmsView'
import { PlaygroundView } from './components/Playground/PlaygroundView'
import { OpenSSLStudioView } from './components/OpenSSLStudio/OpenSSLStudioView'
import { LibraryView } from './components/Library/LibraryView'

type View = 'timeline' | 'algorithms' | 'playground' | 'openssl' | 'threats' | 'leaders' | 'library'

function App() {
  const [currentView, setCurrentView] = useState<View>('timeline')

  useEffect(() => {
    logPageView(`/${currentView}`)
  }, [currentView])

  // Build timestamp - set at compile time
  // Build timestamp - set at compile time
  const buildTime = __BUILD_TIMESTAMP__

  const navItems = [
    { id: 'timeline', label: 'Timeline', icon: Globe },
    { id: 'algorithms', label: 'Algorithms', icon: Shield },
    { id: 'library', label: 'Library', icon: BookOpen },
    { id: 'playground', label: 'Playground', icon: FlaskConical },
    { id: 'openssl', label: 'OpenSSL Studio', icon: Activity },
    { id: 'threats', label: 'Threats', icon: AlertTriangle },
    { id: 'leaders', label: 'Leaders', icon: Users },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <header className="glass-panel m-4 p-4 sticky top-4 z-50" role="banner">
        <div className="w-full flex justify-between items-center">
          <div
            className="flex flex-row items-baseline gap-4"
            style={{ display: 'flex', flexDirection: 'row', alignItems: 'baseline' }}
          >
            <img
              src={pqcLogo}
              alt="PQC Today Logo"
              className="object-contain mr-4"
              style={{ height: '32px', width: 'auto' }}
            />
            <div>
              <h1 className="text-2xl font-bold text-gradient">PQC Today</h1>
              <p className="text-[10px] text-muted uppercase tracking-widest opacity-60">
                Last Updated: {buildTime}
              </p>
            </div>
          </div>
          <nav className="flex gap-4" role="navigation" aria-label="Main navigation">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id as View)}
                aria-label={`${item.label} view`}
                aria-current={currentView === item.id ? 'page' : undefined}
                className={clsx(
                  'flex items-center gap-2 px-4 py-2 rounded-lg transition-all',
                  currentView === item.id
                    ? 'bg-white/10 text-primary border border-primary/50'
                    : 'hover:bg-white/5 text-muted'
                )}
              >
                <item.icon size={18} aria-hidden="true" />
                <span className="hidden md:inline">{item.label}</span>
              </button>
            ))}
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
            {currentView === 'playground' && <PlaygroundView />}
            {currentView === 'openssl' && <OpenSSLStudioView />}
            {currentView === 'threats' && <ThreatsDashboard />}
            {currentView === 'leaders' && <LeadersGrid />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-12 py-8 text-center text-muted text-sm">
        <p>© 2025 PQC Today. Data sourced from the public internet resources.</p>
      </footer>
    </div>
  )
}

export default App
