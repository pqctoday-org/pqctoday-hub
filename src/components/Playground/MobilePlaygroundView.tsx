import { motion } from 'framer-motion'
import { FlaskConical, Cpu } from 'lucide-react'

export const MobilePlaygroundView = () => {
  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="inline-flex p-3 rounded-full bg-secondary/10 text-secondary mb-3">
          <FlaskConical size={24} />
        </div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent mb-2">
          PQC Playground
        </h1>
        <p className="text-sm text-muted-foreground">
          Explore Post-Quantum algorithms (ML-KEM, ML-DSA).
        </p>
      </motion.div>

      {/* Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-panel p-4"
      >
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <Cpu size={18} className="text-primary" />
          What is this?
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          The Playground allows you to run actual WASM implementations of new NIST standards right
          in your browser.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-muted/20 rounded-lg border border-white/5">
            <div className="text-xs font-bold text-foreground mb-1">ML-KEM</div>
            <div className="text-[10px] text-muted-foreground">Key Encapsulation (Kyber)</div>
          </div>
          <div className="p-3 bg-muted/20 rounded-lg border border-white/5">
            <div className="text-xs font-bold text-foreground mb-1">ML-DSA</div>
            <div className="text-[10px] text-muted-foreground">Digital Signatures (Dilithium)</div>
          </div>
        </div>
      </motion.div>

      {/* Call to Action */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-panel p-4 border-l-4 border-l-secondary"
      >
        <h3 className="font-bold text-foreground mb-2">Desktop Required</h3>
        <p className="text-sm text-muted-foreground">
          The interactive playground requires complex parameter configuration and keyboard input.
          Please visit on a desktop computer to run the algorithms.
        </p>
      </motion.div>
    </div>
  )
}
