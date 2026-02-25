import React from 'react'
import { motion } from 'framer-motion'
import { MessageCircle } from 'lucide-react'
import { Button } from '../ui/button'
import { useChatStore } from '@/store/useChatStore'

export const ChatFAB: React.FC = () => {
  const { isOpen, toggleOpen } = useChatStore()

  if (isOpen) return null

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', damping: 15, stiffness: 300, delay: 0.5 }}
      className="fixed bottom-6 right-6 z-40 md:bottom-6 md:right-6 bottom-20 right-4 print:hidden"
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
