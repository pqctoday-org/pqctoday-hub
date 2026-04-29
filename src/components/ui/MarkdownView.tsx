// SPDX-License-Identifier: GPL-3.0-only
/**
 * Shared markdown viewer.
 *
 * Renders Markdown with full GFM support (tables, strikethrough, task lists,
 * autolinks). All elements use semantic Tailwind tokens, so the same component
 * renders correctly in both light and dark mode and in print.
 *
 * Component map ported from pqctoday-admin's RequirementsDashboard so that the
 * Command Center artifact viewer matches the admin tool's polished render.
 *
 * Use this anywhere markdown needs to be displayed — never roll a hand-line
 * renderer; tables and lists will be mangled.
 */
import type { HTMLAttributes } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'

const MD_COMPONENTS: Components = {
  h1: ({ children }) => (
    <h1 className="text-xl font-bold text-foreground mt-6 mb-3 first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-lg font-semibold text-primary mt-6 mb-2 pb-1 border-b border-border">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-base font-semibold text-foreground mt-5 mb-2">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-sm font-semibold text-foreground/90 mt-4 mb-1.5 uppercase tracking-wide">
      {children}
    </h4>
  ),
  p: ({ children }) => (
    <p className="text-sm leading-relaxed text-foreground/90 mb-3">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="list-disc pl-5 space-y-1 text-sm text-foreground/90 mb-3 marker:text-muted-foreground">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-5 space-y-1 text-sm text-foreground/90 mb-3 marker:text-muted-foreground">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="text-sm leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  em: ({ children }) => <em className="italic text-foreground/90">{children}</em>,
  a: ({ href, children }) => {
    const external = !!href && /^https?:\/\//.test(href)
    return (
      <a
        href={href}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        className="text-primary underline underline-offset-2 hover:text-primary/80"
      >
        {children}
      </a>
    )
  },
  table: ({ children }) => (
    <div className="overflow-x-auto my-4 rounded-md border border-border">
      <table className="w-full text-xs border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-muted">{children}</thead>,
  tbody: ({ children }) => (
    <tbody className="divide-y divide-border [&>tr:nth-child(even)]:bg-muted/30">{children}</tbody>
  ),
  tr: ({ children }) => <tr>{children}</tr>,
  th: ({ children }) => (
    <th className="px-3 py-2 text-left font-semibold text-foreground whitespace-nowrap">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-3 py-2 text-foreground/85 align-top leading-relaxed">{children}</td>
  ),
  hr: () => <hr className="border-border my-6" />,
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-primary pl-3 my-3 text-sm text-muted-foreground italic">
      {children}
    </blockquote>
  ),
  code: (props: HTMLAttributes<HTMLElement> & { inline?: boolean }) => {
    const { inline, className, children, ...rest } = props
    if (inline) {
      return (
        <code
          className="bg-muted px-1 py-0.5 rounded text-[0.85em] font-mono text-foreground"
          {...rest}
        >
          {children}
        </code>
      )
    }
    return (
      <code className={cn('font-mono text-xs text-foreground/90', className)} {...rest}>
        {children}
      </code>
    )
  },
  pre: ({ children }) => (
    <pre className="bg-muted/60 border border-border rounded-md p-3 my-3 text-xs font-mono overflow-x-auto">
      {children}
    </pre>
  ),
}

export interface MarkdownViewProps {
  content: string
  className?: string
}

export function MarkdownView({ content, className }: MarkdownViewProps) {
  return (
    <div className={cn('max-w-none', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>
        {content}
      </ReactMarkdown>
    </div>
  )
}
