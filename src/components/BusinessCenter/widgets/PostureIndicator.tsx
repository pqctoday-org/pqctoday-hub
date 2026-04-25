// SPDX-License-Identifier: GPL-3.0-only

export interface PostureIndicatorProps {
  label: string
  value: string
}

export function PostureIndicator({ label, value }: PostureIndicatorProps) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground capitalize">{value.replace(/-/g, ' ')}</span>
    </div>
  )
}
