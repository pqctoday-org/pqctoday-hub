// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import { MessageSquare, ChevronDown, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DISCUSSIONS_BASE, DISCUSSIONS } from '../aboutData'

export function CommunitySection() {
  const [isShowAllDiscussions, setIsShowAllDiscussions] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="glass-panel p-4 md:p-6"
    >
      <div className="flex items-center gap-3 mb-2">
        <MessageSquare className="text-primary shrink-0" size={24} />
        <div>
          <h2 className="text-xl font-semibold">Community</h2>
          <p className="text-xs text-muted-foreground">
            Join the conversation on GitHub Discussions
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
        {DISCUSSIONS.slice(0, 2).map(({ number, icon: Icon, label, description, url }) => (
          <a
            key={number}
            href={url ?? `${DISCUSSIONS_BASE}${number}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30 hover:border-primary/40 hover:bg-muted/60 focus-visible:border-primary/40 focus-visible:bg-muted/60 focus-visible:outline-none transition-colors group"
          >
            <Icon className="text-primary shrink-0 mt-0.5" size={18} />
            <div>
              <p className="text-sm font-medium group-hover:text-primary group-focus-visible:text-primary transition-colors">
                {label}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            </div>
          </a>
        ))}
        <AnimatePresence>
          {isShowAllDiscussions && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden contents-wrapper col-span-full"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {DISCUSSIONS.slice(2).map(({ number, icon: Icon, label, description, url }) => (
                  <a
                    key={number}
                    href={url ?? `${DISCUSSIONS_BASE}${number}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30 hover:border-primary/40 hover:bg-muted/60 focus-visible:border-primary/40 focus-visible:bg-muted/60 focus-visible:outline-none transition-colors group"
                  >
                    <Icon className="text-primary shrink-0 mt-0.5" size={18} />
                    <div>
                      <p className="text-sm font-medium group-hover:text-primary group-focus-visible:text-primary transition-colors">
                        {label}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                    </div>
                  </a>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="mt-4 pt-4 border-t border-border/50 flex flex-wrap gap-3">
        <a
          href="https://github.com/pqctoday-org/pqctoday-hub/graphs/contributors"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors"
          title="View all contributors on GitHub"
        >
          <Users size={13} aria-hidden="true" />
          Contributors
        </a>
        <a
          href="https://github.com/pqctoday-org/pqctoday-hub"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors"
          title="View source on GitHub"
        >
          <MessageSquare size={13} aria-hidden="true" />
          Source on GitHub
        </a>
      </div>

      <Button
        variant="ghost"
        onClick={() => setIsShowAllDiscussions(!isShowAllDiscussions)}
        className="mt-3 text-xs text-muted-foreground hover:text-primary"
      >
        {isShowAllDiscussions ? 'Show less' : `Show all ${DISCUSSIONS.length - 2} more`}
        <ChevronDown
          size={14}
          className={clsx(
            'ml-1 transition-transform duration-200',
            isShowAllDiscussions && 'rotate-180'
          )}
        />
      </Button>
    </motion.div>
  )
}
