// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import { Globe, BookOpen, ChevronDown, ExternalLink, BookMarked } from 'lucide-react'
import { CRYPTO_BUFF_SITES, CRYPTO_BUFF_BOOKS } from '../aboutData'
import { Button } from '@/components/ui/button'

export function CryptoBuffSection() {
  const [isCryptoBuffSitesOpen, setIsCryptoBuffSitesOpen] = useState(false)
  const [isCryptoBuffBooksOpen, setIsCryptoBuffBooksOpen] = useState(false)

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.44 }}
        className="glass-panel p-4 md:p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <BookOpen className="text-primary shrink-0" size={24} />
          <div>
            <h2 className="text-xl font-semibold">Cryptography Buff</h2>
            <p className="text-xs text-muted-foreground">Curated websites and essential reading</p>
          </div>
        </div>

        {/* Websites & Blogs subsection */}
        <Button
          variant="ghost"
          onClick={() => setIsCryptoBuffSitesOpen(!isCryptoBuffSitesOpen)}
          className="flex items-center gap-2 w-full text-left cursor-pointer"
        >
          <Globe className="text-primary shrink-0" size={16} />
          <span className="text-sm font-semibold flex-1">Websites &amp; Blogs</span>
          <span className="text-xs text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-full mr-2">
            {CRYPTO_BUFF_SITES.length}
          </span>
          <ChevronDown
            size={16}
            className={clsx(
              'text-muted-foreground transition-transform duration-200 shrink-0',
              isCryptoBuffSitesOpen && 'rotate-180'
            )}
          />
        </Button>
        <AnimatePresence>
          {isCryptoBuffSitesOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                {CRYPTO_BUFF_SITES.map((site) => (
                  <a
                    key={site.url}
                    href={site.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30 hover:border-primary/40 hover:bg-muted/60 transition-colors group"
                  >
                    <ExternalLink className="text-primary shrink-0 mt-0.5" size={16} />
                    <div>
                      <p className="text-sm font-medium group-hover:text-primary transition-colors">
                        {site.label}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{site.description}</p>
                    </div>
                  </a>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Essential Books subsection */}
        <Button
          variant="ghost"
          onClick={() => setIsCryptoBuffBooksOpen(!isCryptoBuffBooksOpen)}
          className="flex items-center gap-2 w-full text-left cursor-pointer mt-4 pt-4 border-t border-border"
        >
          <BookMarked className="text-primary shrink-0" size={16} />
          <span className="text-sm font-semibold flex-1">Essential Books</span>
          <span className="text-xs text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-full mr-2">
            {CRYPTO_BUFF_BOOKS.length}
          </span>
          <ChevronDown
            size={16}
            className={clsx(
              'text-muted-foreground transition-transform duration-200 shrink-0',
              isCryptoBuffBooksOpen && 'rotate-180'
            )}
          />
        </Button>
        <AnimatePresence>
          {isCryptoBuffBooksOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                {CRYPTO_BUFF_BOOKS.map((book) => (
                  <a
                    key={book.url}
                    href={book.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start justify-between gap-3 p-3 rounded-lg border border-border bg-muted/30 hover:border-primary/40 hover:bg-muted/60 transition-colors group"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold group-hover:text-primary transition-colors">
                        {book.title}
                      </p>
                      <p className="text-xs text-accent mt-0.5">by {book.author}</p>
                      <p className="text-xs text-muted-foreground mt-1">{book.description}</p>
                    </div>
                    <ExternalLink
                      className="text-muted-foreground shrink-0 mt-0.5 group-hover:text-primary transition-colors"
                      size={14}
                    />
                  </a>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* AI Acknowledgment */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.46 }}
        className="glass-panel p-4 md:p-6 text-center"
      >
        <h3 className="text-lg font-semibold mb-2">AI Technology Acknowledgment</h3>
        <p className="text-muted-foreground text-sm max-w-2xl mx-auto">
          This site is developed, documented, validated and deployed using advanced AI technologies
          including Google Antigravity, ChatGPT, Claude AI, Perplexity, and Gemini Pro. While the
          presented information has been manually curated, it may still contain inaccuracies.
        </p>
      </motion.div>
    </>
  )
}
