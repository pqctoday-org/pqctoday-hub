// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { motion } from 'framer-motion'
import { MessageCircle, Clock } from 'lucide-react'
import { Button } from '../ui/button'
import { useRightPanelStore } from '@/store/useRightPanelStore'
import { logChatOpened } from '@/utils/analytics'
import { useEmbedState } from '@/embed/EmbedProvider'

export const RightPanelFAB: React.FC = () => {
  const { isOpen, activeTab, toggle } = useRightPanelStore()
  const embedConfig = useEmbedState()

  if (isOpen) return null

  if (embedConfig.isEmbedded && embedConfig.policy?.features?.assistantEnabled === false)
    return null

  const isChat = activeTab !== 'history'
  const Icon = isChat ? MessageCircle : Clock
  const label = isChat ? 'Open PQC Assistant' : 'Open Journey History'

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', damping: 15, stiffness: 300, delay: 0.5 }}
      className={`${embedConfig.isEmbedded ? 'absolute' : 'fixed'} bottom-20 right-4 z-40 md:bottom-6 md:right-6 print:hidden`}
    >
      <div className="relative flex items-center">
        {/* "Need Help?" speech bubble — slides in, fades out after 10 s */}
        {isChat && (
          <motion.div
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: [0, 1, 1, 0], x: [8, 0, 0, 0] }}
            transition={{ duration: 10, times: [0, 0.08, 0.88, 1], ease: 'easeInOut', delay: 0.8 }}
            className="absolute right-full mr-3 top-1/2 -translate-y-1/2 pointer-events-none"
          >
            <div className="relative bg-card border border-border rounded-lg px-3 py-1.5 shadow-md whitespace-nowrap">
              <span className="text-sm font-medium text-foreground">Need Help?</span>
              {/* Arrow pointing right toward the button */}
              <span className="absolute -right-[7px] top-1/2 -translate-y-1/2 w-3 h-3 bg-card border-r border-t border-border rotate-45" />
            </div>
          </motion.div>
        )}

        {/* Pulse ring — radiates outward on loop */}
        {isChat && (
          <motion.span
            className="absolute inset-0 rounded-full bg-primary/40 pointer-events-none"
            animate={{ scale: [1, 1.7], opacity: [0.5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
          />
        )}

        <Button
          variant="gradient"
          onClick={() => {
            toggle()
            if (isChat) logChatOpened()
          }}
          className="relative w-14 h-14 rounded-full shadow-lg shadow-primary/25 p-0"
          aria-label={label}
        >
          <Icon size={24} />
        </Button>
      </div>
    </motion.div>
  )
}
