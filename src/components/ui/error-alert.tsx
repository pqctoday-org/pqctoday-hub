// SPDX-License-Identifier: GPL-3.0-only
import { Button } from './button'

interface ErrorAlertProps {
  message: string
  onRetry?: () => void
}

export function ErrorAlert({ message, onRetry }: ErrorAlertProps) {
  return (
    <div className="glass-panel border-l-4 border-l-destructive p-4">
      <p className="text-sm text-status-error">{message}</p>
      {onRetry && (
        <Button variant="ghost" size="sm" className="mt-2" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  )
}
