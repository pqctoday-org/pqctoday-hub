import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Shield, Globe, Users, FlaskConical } from 'lucide-react';
import clsx from 'clsx';
import './styles/App.css';

import { TimelineView } from './components/Timeline/TimelineView';
import { ImpactDashboard } from './components/Impacts/ImpactDashboard';
import { LeadersGrid } from './components/Leaders/LeadersGrid';
import { AlgorithmsView } from './components/Algorithms/AlgorithmsView';
import { PlaygroundView } from './components/Playground/PlaygroundView';
import { OpenSSLStudioView } from './components/OpenSSLStudio/OpenSSLStudioView';

type View = 'timeline' | 'algorithms' | 'playground' | 'openssl' | 'impacts' | 'leaders';

function App() {
  const [currentView, setCurrentView] = useState<View>('timeline');

  // Build timestamp - set at compile time
  const buildTime = new Date().toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  const navItems = [
    { id: 'timeline', label: 'Timeline', icon: Globe },
    { id: 'algorithms', label: 'Algorithms', icon: Shield },
    { id: 'playground', label: 'Playground', icon: FlaskConical },
    { id: 'openssl', label: 'OpenSSL Studio', icon: Activity },
    { id: 'impacts', label: 'Impacts', icon: Activity },
    { id: 'leaders', label: 'Leaders', icon: Users },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header / Navigation */}
      <header className="glass-panel m-4 p-4 sticky top-4 z-50" role="banner">
        <div className="container flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gradient">PQC Timeline</h1>
            <p className="text-[10px] text-muted uppercase tracking-widest opacity-60">Last Updated: {buildTime}</p>
          </div>
          <nav className="flex gap-4" role="navigation" aria-label="Main navigation">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id as View)}
                aria-label={`${item.label} view`}
                aria-current={currentView === item.id ? 'page' : undefined}
                className={clsx(
                  "flex items-center gap-2 px-4 py-2 rounded-lg transition-all",
                  currentView === item.id
                    ? "bg-white/10 text-primary border border-primary/50"
                    : "hover:bg-white/5 text-muted"
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
            {currentView === 'playground' && <PlaygroundView />}
            {currentView === 'openssl' && <OpenSSLStudioView />}
            {currentView === 'impacts' && <ImpactDashboard />}
            {currentView === 'leaders' && <LeadersGrid />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-muted text-sm" role="contentinfo">
        <p>© 2025 Post-Quantum Cryptography Tracker. Data sourced from global regulatory bodies.</p>
      </footer>
    </div>
  );
}

export default App;
