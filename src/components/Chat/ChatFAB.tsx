import React from 'react'
import { motion } from 'framer-motion'
import { MessageCircle } from 'lucide-react'
import { Button } from '../ui/button'
import { useRightPanelStore } from '@/store/useRightPanelStore'

export const ChatFAB: React.FC = () => {
  const isOpen = useRightPanelStore((s) => s.isOpen)
  const toggle = useRightPanelStore((s) => s.toggle)
  const toggleOpen = () => toggle()

  if (isOpen) return null

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', damping: 15, stiffness: 300, delay: 0.5 }}
      className="fixed bottom-20 right-4 z-40 md:bottom-6 md:right-6 print:hidden"
    >
      <Button
        variant="gradient"
        onClick={toggleOpen}
        className="w-14 h-14 rounded-full shadow-lg shadow-primary/25 p-0"
        aria-label="Open PQC Assistant"
      >
        <MessageCircle size={24} />
      </Button>
    </motion.div>
  )
}
