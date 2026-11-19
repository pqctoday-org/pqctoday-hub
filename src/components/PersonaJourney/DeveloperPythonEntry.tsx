// SPDX-License-Identifier: AGPL-3.0-only
import { Code2 } from 'lucide-react'
import { Link } from 'react-router'
import { PYTHON_SIGNATURE_EXERCISE_PATH } from '@/data/pythonWorkbench'

export function DeveloperPythonEntry() {
  return (
    <div className="mt-4 rounded-lg border border-border bg-muted/30 p-3">
      <Link
        to={PYTHON_SIGNATURE_EXERCISE_PATH}
        className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary underline underline-offset-2"
      >
        <Code2 size={16} aria-hidden="true" />
        Run Python in your browser
      </Link>
      <p className="text-xs text-muted-foreground">
        Sign a sample message with ML-DSA-65 in the software token. Edit the Python verification
        call and see which bytes the signature authenticates.
      </p>
    </div>
  )
}
