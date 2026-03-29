// SPDX-License-Identifier: GPL-3.0-only
import { motion } from 'framer-motion'
import clsx from 'clsx'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/hooks/useTheme'

export function AppearanceSection() {
  const { theme, setTheme } = useTheme()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="glass-panel p-4 md:p-6 flex flex-col items-center justify-center gap-4"
    >
      <h3 className="text-lg font-semibold">Appearance</h3>
      <p className="text-sm text-muted-foreground text-center max-w-md">
        Choose your preferred color scheme.
      </p>
      <div className="flex items-center gap-2 bg-muted/20 p-1 rounded-lg border border-border">
        {(['light', 'dark'] as const).map((t) => (
          <Button
            key={t}
            variant="ghost"
            size="icon"
            onClick={() => setTheme(t)}
            className={clsx(
              'px-4 py-2 min-h-[44px] rounded-md text-sm font-medium capitalize flex items-center gap-2',
              theme === t
                ? 'bg-primary/20 text-primary border border-primary/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/10'
            )}
          >
            {t === 'light' && '☀️'}
            {t === 'dark' && '🌙'}
            {t}
          </Button>
        ))}
      </div>
    </motion.div>
  )
}
