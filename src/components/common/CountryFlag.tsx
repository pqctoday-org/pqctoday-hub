import clsx from 'clsx'
import { useState } from 'react'

interface CountryFlagProps {
  code: string
  className?: string
  alt?: string
}

export const CountryFlag = ({ code, className, alt }: CountryFlagProps) => {
  const [error, setError] = useState(false)

  // Handle special cases
  if (!code) return null

  // Map special codes if needed, though we named files to match
  const lowerCode = code.toLowerCase()
  const flagPath = `/flags/${lowerCode}.svg`

  if (error) {
    // Fallback to text code if image fails
    return <span className={clsx('font-mono font-bold text-xs', className)}>{code}</span>
  }

  return (
    <img
      src={flagPath}
      alt={alt || `${code} flag`}
      className={clsx('object-contain inline-block', className)}
      style={{ maxWidth: '100%', maxHeight: '100%' }}
      onError={() => setError(true)}
    />
  )
}
