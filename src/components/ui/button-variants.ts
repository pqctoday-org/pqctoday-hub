// SPDX-License-Identifier: GPL-3.0-only
import { cva } from 'class-variance-authority'

export const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-border bg-transparent hover:bg-muted/20 hover:text-foreground',
        secondary: 'bg-secondary text-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-muted/20 hover:text-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        gradient:
          'bg-gradient-to-r from-secondary to-primary text-primary-foreground font-bold hover:opacity-90 hover:-translate-y-0.5 transition-all duration-200',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-10 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-11 w-11 touch-manipulation',
        tile: 'h-auto min-h-[88px] w-full px-4 py-3 flex-col items-start justify-start text-left whitespace-normal gap-1 rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)
