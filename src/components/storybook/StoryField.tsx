// SPDX-License-Identifier: AGPL-3.0-only
import * as React from 'react'
import { cn } from '../../lib/utils'
import { storyInputClass, storyTextareaClass } from './variants'

/** Single-line input: pill with an ink outline. Pass `aria-invalid` to mark an error. */
export const StoryInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type = 'text', ...props }, ref) => (
  <input ref={ref} type={type} className={cn(storyInputClass, className)} {...props} />
))
StoryInput.displayName = 'StoryInput'

/** Multi-line input: 16px corners and an ink outline. */
export const StoryTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(storyTextareaClass, className)} {...props} />
))
StoryTextarea.displayName = 'StoryTextarea'
