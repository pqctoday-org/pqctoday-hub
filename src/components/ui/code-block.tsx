// SPDX-License-Identifier: GPL-3.0-only
import * as React from 'react'
import { cn } from '@/lib/utils'

interface CodeBlockProps extends React.HTMLAttributes<HTMLPreElement> {
  code: string
  language?: string
}

const CodeBlock = React.forwardRef<HTMLPreElement, CodeBlockProps>(
  ({ className, code, language, ...props }, ref) => {
    return (
      <pre
        ref={ref}
        aria-label={language ? `${language} code block` : 'Code block'}
        className={cn(
          'mb-4 mt-6 max-h-[650px] overflow-x-auto rounded-lg border bg-muted py-4',
          className
        )}
        {...props}
      >
        <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
          {code}
        </code>
      </pre>
    )
  }
)
CodeBlock.displayName = 'CodeBlock'

export { CodeBlock }
