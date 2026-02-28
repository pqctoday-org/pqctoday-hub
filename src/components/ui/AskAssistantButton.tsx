import React from 'react'
import { Bot } from 'lucide-react'
import { Button } from './button'
import { useAskAssistant } from '@/hooks/useAskAssistant'

interface AskAssistantButtonProps {
  question: string
  variant?: 'icon' | 'text'
  label?: string
  className?: string
}

export const AskAssistantButton: React.FC<AskAssistantButtonProps> = ({
  question,
  variant = 'icon',
  label = 'Ask Assistant',
  className,
}) => {
  const askAssistant = useAskAssistant()

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    askAssistant(question)
  }

  if (variant === 'text') {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClick}
        className={`inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors ${className ?? ''}`}
        aria-label={label}
        title={label}
      >
        <Bot size={12} />
        {label}
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className={`p-1 h-auto min-h-0 text-muted-foreground hover:text-primary transition-colors ${className ?? ''}`}
      aria-label={label}
      title={label}
    >
      <Bot size={14} />
    </Button>
  )
}
