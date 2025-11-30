import { Copy, Terminal } from 'lucide-react'
import { useOpenSSLStore } from './store'

export const CommandPreview = () => {
  const { command } = useOpenSSLStore()

  return (
    <div className="mb-6 glass-panel overflow-hidden shrink-0">
      <div className="p-4 border-b border-white/10 bg-white/5">
        <h3 className="font-bold text-white flex items-center gap-2">
          <Terminal size={16} />
          Command Preview
        </h3>
      </div>
      <div className="p-4 bg-black/20 flex items-center gap-2 group">
        <code className="text-green-400 flex-1 break-all font-mono text-sm">$ {command}</code>
        <button
          onClick={() => navigator.clipboard.writeText(command)}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted hover:text-white"
          title="Copy to clipboard"
        >
          <Copy size={14} />
        </button>
      </div>
    </div>
  )
}
