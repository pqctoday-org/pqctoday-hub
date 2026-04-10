import React, { useMemo } from 'react'

let lastY = 0

if (typeof window !== 'undefined') {
  window.addEventListener(
    'pointerdown',
    (e) => {
      lastY = e.pageY
    },
    true
  )
}

export function useModalPosition(isEmbedded: boolean): React.CSSProperties {
  return useMemo(() => {
    if (isEmbedded) {
      // In embed mode, the iframe can be very tall and 'fixed' centers it in the whole iframe.
      // We want to center it near where the user clicked instead.
      const y = lastY || (typeof window !== 'undefined' ? window.innerHeight / 2 : 300)
      return {
        position: 'absolute',
        top: `${Math.max(150, y)}px`, // Avoid getting clipped at the very top
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }
    }
    // Normal fixed center for standalone
    return {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    }
  }, [isEmbedded])
}
