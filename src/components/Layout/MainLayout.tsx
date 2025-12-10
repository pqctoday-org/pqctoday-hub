import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
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
  ShieldCheck,
} from 'lucide-react'
import { Button } from '../ui/button'

export const MainLayout = () => {
  const location = useLocation()

  // Build timestamp - set at compile time
  const buildTime = __BUILD_TIMESTAMP__

  const navItems = [
    { path: '/', label: 'Timeline', icon: Globe },
    { path: '/algorithms', label: 'Algorithms', icon: Shield },
    { path: '/library', label: 'Library', icon: BookOpen },
    { path: '/learn', label: 'Learn', icon: GraduationCap },
    { path: '/playground', label: 'Playground', icon: FlaskConical, hiddenOnMobile: true },
    { path: '/openssl', label: 'OpenSSL Studio', icon: Activity, hiddenOnMobile: true },
    { path: '/threats', label: 'Threats', icon: AlertTriangle },
    { path: '/compliance', label: 'Compliance', icon: ShieldCheck },
    { path: '/leaders', label: 'Leaders', icon: Users },
    { path: '/about', label: 'About', icon: Info },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="m-4 sticky top-4 z-50 transition-all duration-300" role="banner">
        <div className="glass-panel p-2 lg:p-4 flex w-full justify-center lg:justify-between items-center relative">
          <div className="flex flex-row items-baseline gap-4">
            <div className="hidden lg:block">
              <h1 className="text-2xl font-bold text-gradient">PQC Today</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest hidden sm:block">
                Last Updated: {buildTime}
              </p>
            </div>
          </div>

          {/* Universal Navigation: Row of Icons on Mobile, Full Nav on Desktop */}
          <nav
            className="flex flex-row flex-nowrap items-center justify-between w-full lg:w-auto gap-1 lg:gap-2 overflow-x-auto no-scrollbar"
            role="navigation"
            aria-label="Main navigation"
          >
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={
                  item.hiddenOnMobile
                    ? 'hidden lg:block'
                    : 'flex-1 lg:flex-none flex justify-center'
                }
              >
                {({ isActive }) => (
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`${item.label} view`}
                    aria-current={isActive ? 'page' : undefined}
                    className={
                      isActive
                        ? 'bg-primary/10 text-primary border border-primary/20 px-2 lg:px-4'
                        : 'text-muted-foreground hover:text-foreground px-2 lg:px-4'
                    }
                  >
                    <item.icon size={20} aria-hidden="true" className="lg:mr-2" />
                    <span className="hidden lg:inline">{item.label}</span>
                  </Button>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow container py-4 px-2 md:py-8 md:px-8" role="main">
        {/* Removed AnimatePresence to fix blank screen navigation bug */}
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Outlet />
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12 py-8 text-center text-muted-foreground text-sm px-4">
        <p>© 2025 PQC Today. Data sourced from the public internet resources.</p>
      </footer>
    </div>
  )
}
