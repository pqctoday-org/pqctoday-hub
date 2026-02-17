import type { ReactNode, HTMLAttributes, ImgHTMLAttributes } from 'react'

type MotionProps = Record<string, unknown> & { children?: ReactNode }

const motionPropKeys = [
  'initial',
  'animate',
  'transition',
  'whileHover',
  'whileTap',
  'whileInView',
  'exit',
  'variants',
  'layout',
  'layoutId',
  'drag',
  'dragConstraints',
  'onAnimationComplete',
]

function stripMotionProps(props: Record<string, unknown>) {
  const clean: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(props)) {
    if (!motionPropKeys.includes(key)) {
      clean[key] = value
    }
  }
  return clean
}

export const framerMotionMock = {
  motion: {
    div: ({ children, ...props }: MotionProps) => (
      <div {...(stripMotionProps(props) as HTMLAttributes<HTMLDivElement>)}>{children}</div>
    ),
    span: ({ children, ...props }: MotionProps) => (
      <span {...(stripMotionProps(props) as HTMLAttributes<HTMLSpanElement>)}>{children}</span>
    ),
    img: ({ children, ...props }: MotionProps) => (
      <img
        {...(stripMotionProps(props) as ImgHTMLAttributes<HTMLImageElement>)}
        alt={(props.alt as string) || ''}
      >
        {children}
      </img>
    ),
    article: ({ children, ...props }: MotionProps) => (
      <article {...(stripMotionProps(props) as HTMLAttributes<HTMLElement>)}>{children}</article>
    ),
    section: ({ children, ...props }: MotionProps) => (
      <section {...(stripMotionProps(props) as HTMLAttributes<HTMLElement>)}>{children}</section>
    ),
    button: ({ children, ...props }: MotionProps) => (
      <button {...(stripMotionProps(props) as HTMLAttributes<HTMLButtonElement>)}>
        {children}
      </button>
    ),
    p: ({ children, ...props }: MotionProps) => (
      <p {...(stripMotionProps(props) as HTMLAttributes<HTMLParagraphElement>)}>{children}</p>
    ),
    tr: ({ children, ...props }: MotionProps) => (
      <tr {...(stripMotionProps(props) as HTMLAttributes<HTMLTableRowElement>)}>{children}</tr>
    ),
  },
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
}
