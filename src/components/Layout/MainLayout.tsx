import { Outlet, NavLink, useLocation } from 'react-router-dom'
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
import pqcLogo from '../../assets/PQCT_Logo_V01.png'
import { Button } from '../ui/button'
import { ModeToggle } from '../mode-toggle'

export const MainLayout = () => {
  const location = useLocation()

  // Build timestamp - set at compile time
  const buildTime = __BUILD_TIMESTAMP__

  const navItems = [
    { path: '/', label: 'Timeline', icon: Globe },
    { path: '/algorithms', label: 'Algorithms', icon: Shield },
    { path: '/library', label: 'Library', icon: BookOpen },
    { path: '/learn', label: 'Learn', icon: GraduationCap },
    { path: '/playground', label: 'Playground', icon: FlaskConical },
    { path: '/openssl', label: 'OpenSSL Studio', icon: Activity },
    { path: '/threats', label: 'Threats', icon: AlertTriangle },
    { path: '/leaders', label: 'Leaders', icon: Users },
    { path: '/about', label: 'About', icon: Info },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="m-4 sticky top-4 z-50 transition-all duration-300" role="banner">
        <div className="glass-panel p-4 flex w-full justify-between items-center">
          <div className="flex flex-row items-baseline gap-4">
            <img src={pqcLogo} alt="PQC Today Logo" className="object-contain mr-4 h-8 w-auto" />
            <div>
              <h1 className="text-2xl font-bold text-gradient">PQC Today</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                Last Updated: {buildTime}
              </p>
            </div>
          </div>
          <nav className="flex gap-2" role="navigation" aria-label="Main navigation">
            {navItems.map((item) => (
              <NavLink key={item.path} to={item.path}>
                {({ isActive }) => (
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`${item.label} view`}
                    aria-current={isActive ? 'page' : undefined}
                    className={
                      isActive
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'text-muted-foreground hover:text-foreground'
                    }
                  >
                    <item.icon size={18} aria-hidden="true" className="mr-2" />
                    <span className="hidden md:inline">{item.label}</span>
                  </Button>
                )}
              </NavLink>
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
          {/* We use location.pathname as the key to trigger animations on route change */}
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
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
