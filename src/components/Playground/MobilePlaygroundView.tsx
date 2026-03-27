// SPDX-License-Identifier: GPL-3.0-only
import {
  FlaskConical,
  Key,
  Lock,
  FileSignature,
  Hash,
  Database,
  Cpu,
  Monitor,
  Activity,
  ShieldCheck,
} from 'lucide-react'

const FEATURES = [
  {
    icon: Key,
    title: 'ML-KEM Key Encapsulation',
    description:
      'Generate ML-KEM keypairs, encapsulate shared secrets, and decapsulate with FIPS 203.',
  },
  {
    icon: FileSignature,
    title: 'ML-DSA Digital Signatures',
    description: 'Sign and verify messages using FIPS 204 post-quantum signatures.',
  },
  {
    icon: Lock,
    title: 'AES Symmetric Encryption',
    description: 'Encrypt and decrypt data with AES-GCM and AES-CBC modes.',
  },
  {
    icon: Hash,
    title: 'Hashing & HMAC',
    description: 'Compute SHA-2, SHA-3, and SHAKE digests plus HMAC authentication.',
  },
  {
    icon: Database,
    title: 'Key Store',
    description: 'Manage generated keys, export public keys, and track cryptographic artifacts.',
  },
  {
    icon: Activity,
    title: 'Operation Logs',
    description: 'Inspect detailed logs of every cryptographic operation performed.',
  },
  {
    icon: Cpu,
    title: 'HSM Emulation',
    description:
      'PKCS#11 v3.2 hardware security module with C++ and Rust dual-engine parity testing.',
  },
  {
    icon: ShieldCheck,
    title: 'ACVP Testing',
    description: 'Run NIST ACVP Known Answer Test vectors against the WASM crypto backends.',
  },
]

export const MobilePlaygroundView = () => {
  return (
    <div className="px-4 py-6 space-y-6">
      {/* Hero */}
      <div className="glass-panel p-6 text-center space-y-3">
        <div className="inline-flex items-center justify-center p-3 rounded-xl bg-secondary/10 border border-secondary/20">
          <FlaskConical size={28} className="text-secondary" />
        </div>
        <h3 className="text-xl font-bold text-foreground">Interactive Playground</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The Playground runs real post-quantum cryptographic operations in your browser using
          WebAssembly. It requires a desktop-sized screen for the full interactive experience.
        </p>
        <div className="flex items-center justify-center gap-2 pt-2">
          <Monitor size={16} className="text-primary" />
          <span className="text-xs font-medium text-primary">
            Open on desktop for the full experience
          </span>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-1">
          Available Operations
        </h4>
        <div className="grid grid-cols-1 gap-3">
          {FEATURES.map((feature) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.title}
                className="glass-panel p-4 flex items-start gap-3 active:scale-[0.98] transition-transform"
              >
                <div className="p-2 rounded-lg bg-muted/50 border border-border/30 shrink-0">
                  <Icon size={18} className="text-primary" />
                </div>
                <div className="min-w-0">
                  <h5 className="text-sm font-semibold text-foreground">{feature.title}</h5>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Tech Stack Note */}
      <div className="glass-panel p-4 space-y-2">
        <h4 className="text-sm font-semibold text-foreground">Powered By</h4>
        <div className="flex flex-wrap gap-2">
          {['OpenSSL 3.6.0 WASM', 'liboqs', 'PKCS#11 v3.2', 'Web Crypto API'].map((tech) => (
            <span
              key={tech}
              className="px-2.5 py-1 rounded-full bg-muted/50 border border-border text-xs text-muted-foreground"
            >
              {tech}
            </span>
          ))}
        </div>
        <p className="text-xs text-muted-foreground italic">
          All cryptographic operations are for educational purposes only.
        </p>
      </div>
    </div>
  )
}
