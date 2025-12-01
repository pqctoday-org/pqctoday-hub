import clsx from 'clsx'
import { useState } from 'react'

interface CountryFlagProps {
  code: string
  className?: string
  style?: React.CSSProperties
  alt?: string
  width?: number | string
  height?: number | string
}

export const CountryFlag = ({ code, className, style, alt, width, height }: CountryFlagProps) => {
  const [error, setError] = useState(false)

  // Handle special cases
  if (!code) return null

  // Map special codes if needed, though we named files to match
  const lowerCode = code.toLowerCase()
  const flagPath = `/flags/${lowerCode}.svg`

  if (error) {
    // Fallback to text code if image fails
    return <span className={clsx('font-mono font-bold text-xs', className)} style={style}>{code}</span>
  }

  return (
    <img
      src={flagPath}
      alt={alt || `${code} flag`}
      className={clsx('inline-block', className)}
      style={{ ...style }}
      width={width}
      height={height}
      onError={() => setError(true)}
    />
  )
}
