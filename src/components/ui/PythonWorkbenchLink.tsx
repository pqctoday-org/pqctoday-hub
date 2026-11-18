// SPDX-License-Identifier: AGPL-3.0-only
import { Link } from 'react-router'
import { PYTHON_WORKBENCH_PATH } from '@/data/pythonWorkbench'

export function PythonWorkbenchLink() {
  return (
    <Link
      to={PYTHON_WORKBENCH_PATH}
      className="inline-flex items-center py-2 font-semibold text-primary underline"
    >
      Edit and run Python crypto code in your browser
    </Link>
  )
}
