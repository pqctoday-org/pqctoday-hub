import React from 'react'
import { CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import clsx from 'clsx'

interface FeedbackPanelProps {
  isCorrect: boolean
  explanation: string
  learnMorePath?: string
}

export const FeedbackPanel: React.FC<FeedbackPanelProps> = ({
  isCorrect,
  explanation,
  learnMorePath,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={clsx(
        'glass-panel p-4 border-l-4 mt-4',
        isCorrect ? 'border-l-success' : 'border-l-destructive'
      )}
    >
      <div className="flex items-start gap-3">
        {isCorrect ? (
          <CheckCircle className="text-success shrink-0 mt-0.5" size={20} />
        ) : (
          <AlertTriangle className="text-destructive shrink-0 mt-0.5" size={20} />
        )}
        <div className="flex-1 min-w-0">
          <p
            className={clsx(
              'text-sm font-bold mb-1',
              isCorrect ? 'text-success' : 'text-destructive'
            )}
          >
            {isCorrect ? 'Correct!' : 'Incorrect'}
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">{explanation}</p>
          {learnMorePath && (
            <Link
              to={learnMorePath}
              className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 mt-2 transition-colors"
            >
              <ExternalLink size={12} />
              Learn more
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  )
}
