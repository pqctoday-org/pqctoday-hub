// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { motion } from 'framer-motion'
import { MessageCircle, Clock } from 'lucide-react'
import { Button } from '../ui/button'
import { useRightPanelStore } from '@/store/useRightPanelStore'

export const RightPanelFAB: React.FC = () => {
  const { isOpen, activeTab, toggle } = useRightPanelStore()

  if (isOpen) return null

  const Icon = activeTab === 'history' ? Clock : MessageCircle
  const label = activeTab === 'history' ? 'Open Journey History' : 'Open PQC Assistant'

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', damping: 15, stiffness: 300, delay: 0.5 }}
      className="fixed bottom-20 right-4 z-40 md:bottom-6 md:right-6 print:hidden"
    >
      <Button
        variant="gradient"
        onClick={() => toggle()}
        className="w-14 h-14 rounded-full shadow-lg shadow-primary/25 p-0"
        aria-label={label}
      >
        <Icon size={24} />
      </Button>
    </motion.div>
  )
}
