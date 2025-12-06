import React from 'react'
import { BookOpen, CheckCircle, Circle, Clock, Layers } from 'lucide-react'
import { useModuleStore } from '../../store/useModuleStore'
// import { SaveRestorePanel } from './SaveRestorePanel';

interface ModuleItem {
  id: string
  title: string
  description: string
  duration: string
  disabled?: boolean
  comingSoon?: boolean
}

interface DashboardProps {
  onSelectModule: (moduleId: string) => void
}

// Helper to chunk array into pairs
const chunkArray = <T,>(arr: T[], size: number): T[][] => {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  )
}

const ModuleCardContent = ({
  module,
  onSelectModule,
}: {
  module: ModuleItem
  onSelectModule: (moduleId: string) => void
}) => {
  const { modules } = useModuleStore()
  const status = modules[module.id]?.status || 'not-started'
  const timeSpent = modules[module.id]?.timeSpent || 0

  // Format duration string - REMOVED redundant "Not started" text
  let durationDisplay = module.duration
  if (!module.comingSoon) {
    if (status === 'not-started') {
      durationDisplay = `${module.duration}`
    } else {
      durationDisplay = `${module.duration} / ${timeSpent} min`
    }
  }

  return (
    <button
      className={`w-full text-left p-6 rounded-xl border border-white/10 bg-white/5 transition-all flex flex-col h-full
        ${module.disabled ? 'opacity-60 cursor-not-allowed' : 'hover:bg-white/10 cursor-pointer'}
      `}
      onClick={() => !module.disabled && onSelectModule(module.id)}
      disabled={module.disabled}
    >
      <div className="flex justify-between items-start w-full mb-4">
        <h3 className="text-xl font-bold text-foreground break-words">{module.title}</h3>
        <div>
          {module.comingSoon ? (
            <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded whitespace-nowrap">
              Coming Soon
            </span>
          ) : status === 'completed' ? (
            <CheckCircle className="text-green-400 shrink-0" size={20} />
          ) : (
            <Circle className="text-muted-foreground shrink-0" size={20} />
          )}
        </div>
      </div>

      <p
        className="text-muted-foreground mb-6 flex-grow text-sm break-words line-clamp-3 min-h-[4.5em]"
        style={{ paddingLeft: '1rem', paddingRight: '1rem' }}
      >
        {module.description}
      </p>

      {!module.comingSoon && (
        <div className="flex items-center justify-between mt-auto w-full pt-4 border-t border-white/5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock size={14} />
            {durationDisplay}
          </div>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all
              ${
                status === 'completed'
                  ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                  : status === 'in-progress'
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    : 'bg-primary/10 text-primary border border-primary/20'
              }
            `}
          >
            {status === 'completed' ? 'Done' : status === 'in-progress' ? 'Resume' : 'Start'}
          </span>
        </div>
      )}
    </button>
  )
}

const ModuleTable = ({
  items,
  title,
  icon: Icon,
  onSelectModule,
}: {
  items: ModuleItem[]
  title: string
  icon: React.ElementType
  onSelectModule: (moduleId: string) => void
}) => {
  const rows = chunkArray(items, 2)

  return (
    <div className="glass-panel overflow-hidden">
      <div className="p-6 border-b border-white/10">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Icon className={title === 'Learning Workshops' ? 'text-primary' : 'text-secondary'} />
          {title}
        </h2>
      </div>
      <div className="p-6 overflow-x-auto">
        <table className="border-collapse" style={{ tableLayout: 'fixed', width: '80vw' }}>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((module) => (
                  <td key={module.id} className="p-3 align-top h-full" style={{ width: '40vw' }}>
                    <div className="h-full">
                      <ModuleCardContent module={module} onSelectModule={onSelectModule} />
                    </div>
                  </td>
                ))}
                {/* If row has only 1 item, add empty cell to maintain layout */}
                {row.length === 1 && <td className="p-3" style={{ width: '40vw' }}></td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export const Dashboard: React.FC<DashboardProps> = ({ onSelectModule }) => {
  const activeModules: ModuleItem[] = [
    {
      id: 'pki-workshop',
      title: 'PKI',
      description: 'Complete hands-on workshop: CSRs, Root CAs, Signing, and Parsing.',
      duration: '45 min',
    },
    {
      id: 'digital-assets',
      title: 'Digital Assets',
      description:
        'Learn cryptographic foundations of Bitcoin, Ethereum, and Solana using OpenSSL.',
      duration: '60 min',
    },
  ]

  const upcomingModules: ModuleItem[] = [
    {
      id: '5g-security',
      title: '5G Security',
      description: 'Explore the security architecture of 5G networks and SIM authentication.',
      duration: 'Coming Soon',
      comingSoon: true,
      disabled: true,
    },
    {
      id: 'digital-id',
      title: 'Digital ID',
      description: 'Understand decentralized identity, verifiable credentials, and mDL.',
      duration: 'Coming Soon',
      comingSoon: true,
      disabled: true,
    },
    {
      id: 'tls',
      title: 'TLS',
      description: 'Deep dive into TLS 1.3 handshakes, certificates, and cipher suites.',
      duration: 'Coming Soon',
      comingSoon: true,
      disabled: true,
    },
    {
      id: 'vpn',
      title: 'VPN',
      description: 'Configure and secure VPN tunnels using WireGuard and OpenVPN protocols.',
      duration: 'Coming Soon',
      comingSoon: true,
      disabled: true,
    },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-8">
        <ModuleTable
          items={activeModules}
          title="Learning Workshops"
          icon={BookOpen}
          onSelectModule={onSelectModule}
        />
        <ModuleTable
          items={upcomingModules}
          title="Upcoming Tracks"
          icon={Layers}
          onSelectModule={onSelectModule}
        />
      </div>

      <div className="lg:col-span-1">
        {/* SaveRestorePanel is temporarily commented out in previous steps, re-enabling it now to test if it still crashes. 
                    If it crashes, we will fix it in the next step.
                */}
        {/* <SaveRestorePanel /> */}
        <div className="text-foreground">Save/Restore Placeholder</div>
      </div>
    </div>
  )
}
