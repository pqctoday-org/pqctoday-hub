import { cn } from '@/lib/utils'

type BadgeCategory =
  | 'americas'
  | 'emea'
  | 'apac'
  | 'global'
  | 'beginner'
  | 'intermediate'
  | 'advanced'

interface CategoryBadgeProps {
  category: BadgeCategory
  label?: string
  className?: string
}

const categoryClasses: Record<BadgeCategory, string> = {
  americas: 'bg-primary/10 text-primary border-primary/30',
  emea: 'bg-accent/10 text-accent border-accent/30',
  apac: 'bg-secondary/10 text-secondary border-secondary/30',
  global: 'bg-muted text-muted-foreground border-border',
  beginner: 'bg-status-success text-status-success',
  intermediate: 'bg-status-info text-status-info',
  advanced: 'bg-secondary/10 text-secondary border-secondary/30',
}

const defaultLabels: Record<BadgeCategory, string> = {
  americas: 'Americas',
  emea: 'EMEA',
  apac: 'APAC',
  global: 'Global',
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}

export function CategoryBadge({ category, label, className }: CategoryBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        categoryClasses[category],
        className
      )}
    >
      {label ?? defaultLabels[category]}
    </span>
  )
}
