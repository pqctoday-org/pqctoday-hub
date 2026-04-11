// SPDX-License-Identifier: GPL-3.0-only
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

interface CareerJourneyModalProps {
  isOpen: boolean
  onClose: () => void
}

const PANELS = [
  {
    src: '/journey/panel1.png',
    title: 'The Foundation (Marseille)',
    caption: 'Where it all began... Marseille: Physics.',
  },
  {
    src: '/journey/panel2.png',
    title: "The Master's Journey (Birmingham & Paris)",
    caption: 'Birmingham & Paris: Master in Software Engineering.',
  },
  {
    src: '/journey/panel3.png',
    title: 'Building the Vaults (Paris/Montrouge)',
    caption: 'Paris: Architecting the world’s digital vaults.',
  },
  {
    src: '/journey/panel4.png',
    title: 'The Atlantic Leap (Philadelphia & Atlanta)',
    caption: 'Crossing the Pond: Leading the EMV revolution & Digital Banking.',
  },
  {
    src: '/journey/panel5.png',
    title: 'The High-Tech Frontier (Austin)',
    caption: 'Austin: Protecting the Future (5G, PQC, and the Cloud).',
  },
  {
    src: '/journey/panel6.png',
    title: 'The Grand Finale (Panama City Beach)',
    caption: 'Work hard, Tri harder. Eric Amador: An Ironman Root of Trust!',
  },
]

export function CareerJourneyModal({ isOpen, onClose }: CareerJourneyModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [wasOpen, setWasOpen] = useState(false)

  // React-recommended render-time state reset (avoids setState in effect)
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen)
    if (isOpen) {
      setCurrentIndex(0)
    }
  }

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const next = () => setCurrentIndex((prev) => (prev + 1) % PANELS.length)
  const prev = () => setCurrentIndex((prev) => (prev - 1 + PANELS.length) % PANELS.length)

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative glass-panel w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 md:p-4 border-b border-border">
              <h2 className="text-lg md:text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                My Career Journey
              </h2>
              <Button
                variant="ghost"
                onClick={onClose}
                className="p-1.5 hover:bg-muted/20 rounded-full transition-colors"
                aria-label="Close modal"
              >
                <X size={18} className="md:w-5 md:h-5" />
              </Button>
            </div>

            {/* Content Area */}
            <div className="relative flex-1 bg-muted/40 overflow-hidden flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="w-full h-full flex flex-col items-center justify-center p-4 md:p-6 lg:p-8"
                >
                  <div className="relative w-full max-w-lg aspect-square mb-4 md:mb-6 overflow-hidden rounded-lg shadow-2xl border border-border bg-muted/20">
                    <img
                      src={PANELS[currentIndex].src}
                      alt={PANELS[currentIndex].title}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="text-center max-w-2xl px-2">
                    <h3 className="text-base md:text-lg font-bold text-foreground mb-1 md:mb-2 leading-tight">
                      {PANELS[currentIndex].title}
                    </h3>
                    <p className="text-xs md:text-sm text-muted-foreground italic leading-relaxed">
                      {PANELS[currentIndex].caption}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Navigation Controls */}
              <Button
                variant="ghost"
                onClick={prev}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 md:p-3 bg-muted/80 hover:bg-muted text-foreground rounded-full transition-all border border-border"
                aria-label="Previous panel"
              >
                <ChevronLeft size={20} className="md:w-6 md:h-6" />
              </Button>
              <Button
                variant="ghost"
                onClick={next}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 md:p-3 bg-muted/80 hover:bg-muted text-foreground rounded-full transition-all border border-border"
                aria-label="Next panel"
              >
                <ChevronRight size={20} className="md:w-6 md:h-6" />
              </Button>
            </div>

            {/* Footer / Progress */}
            <div className="p-4 border-t border-border flex items-center justify-between">
              <div className="flex gap-2">
                {PANELS.map((_, i) => (
                  <Button
                    variant="ghost"
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={`h-1.5 rounded-full transition-all ${
                      i === currentIndex
                        ? 'w-8 bg-primary'
                        : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                    }`}
                    aria-label={`Go to panel ${i + 1}`}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground font-mono">
                {currentIndex + 1} / {PANELS.length}
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
