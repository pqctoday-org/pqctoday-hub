// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'

interface QubitIconProps {
  size?: number
  className?: string
  animated?: boolean
}

/**
 * Animated qubit chat icon — replaces the generic lucide Bot icon
 * with the custom ChatBotFlow.gif Bloch sphere animation.
 */
export const QubitIcon: React.FC<QubitIconProps> = ({
  size = 18,
  className = '',
  animated = true,
}) => (
  <img
    src="/ChatBotFlow.gif"
    alt="PQC Assistant"
    width={size}
    height={size}
    className={`rounded-full object-cover ${animated ? 'qubit-icon-pulse' : ''} ${className}`}
    draggable={false}
  />
)
