import React from 'react'
import { Link } from 'react-router-dom'
import { ShieldAlert, ExternalLink } from 'lucide-react'
import { InfoTooltip } from './InfoTooltip'

export const PQCThreatSummary: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Intro */}
      <div className="flex items-start gap-3">
        <ShieldAlert className="text-destructive mt-1 shrink-0" size={24} />
        <div>
          <h3 className="text-lg font-bold text-foreground mb-2">
            Why This Matters: Quantum Threats to Blockchain
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Every cryptographic algorithm you used in this module — secp256k1 (ECDSA), Ed25519
            (EdDSA), and the elliptic curves underlying HD wallets — is vulnerable to{' '}
            <InfoTooltip term="shors" />. A sufficiently powerful quantum computer (
            <InfoTooltip term="qday" />) could derive private keys from public keys, breaking the
            security of all three blockchains.
          </p>
        </div>
      </div>

      {/* Vulnerability Table */}
      <div className="glass-panel p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left p-3 font-semibold text-foreground">Chain</th>
              <th className="text-left p-3 font-semibold text-foreground">Algorithm</th>
              <th className="text-left p-3 font-semibold text-foreground">Quantum Threat</th>
              <th className="text-left p-3 font-semibold text-foreground">Migration Status</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            <tr className="border-b border-border/50">
              <td className="p-3 font-medium text-foreground">Bitcoin</td>
              <td className="p-3 font-mono text-xs">secp256k1 ECDSA</td>
              <td className="p-3">
                Shor's algorithm breaks ECDLP. ~$718B in vulnerable P2PK addresses with exposed
                public keys.
              </td>
              <td className="p-3">
                <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-warning/20 text-warning">
                  P2QRH BIP proposed
                </span>
              </td>
            </tr>
            <tr className="border-b border-border/50">
              <td className="p-3 font-medium text-foreground">Ethereum</td>
              <td className="p-3 font-mono text-xs">secp256k1 ECDSA + BLS12-381</td>
              <td className="p-3">
                All accounts that have transacted expose public keys. Validator BLS signatures also
                vulnerable.
              </td>
              <td className="p-3">
                <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-accent/20 text-accent">
                  EIP-4337 + PQC team funded
                </span>
              </td>
            </tr>
            <tr>
              <td className="p-3 font-medium text-foreground">Solana</td>
              <td className="p-3 font-mono text-xs">Ed25519 EdDSA</td>
              <td className="p-3">
                Shor's algorithm breaks Ed25519. All account public keys are the address itself
                (always exposed).
              </td>
              <td className="p-3">
                <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                  No announced plan
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* HNDL Callout */}
      <div className="glass-panel p-4 border-l-4 border-l-destructive">
        <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
          <InfoTooltip term="hndl" /> Risk for Blockchains
        </h4>
        <p className="text-sm text-muted-foreground leading-relaxed">
          On-chain data is <strong className="text-foreground">immutable</strong> — unlike
          traditional systems where you can rotate keys, blockchain transaction history is
          permanent. Public keys exposed in past transactions remain harvestable indefinitely. When
          cryptographically relevant quantum computers arrive, every previously exposed public key
          becomes a target. This makes the HNDL threat particularly severe for blockchains: there is
          no retroactive fix for exposed keys.
        </p>
        <p className="text-xs text-muted-foreground mt-2 italic">
          Source: Federal Reserve Board FEDS Paper, September 2025
        </p>
      </div>

      {/* Explore Further */}
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          to="/threats"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted/50 text-sm font-medium text-foreground transition-colors"
        >
          <ExternalLink size={16} />
          Explore Full Quantum Threat Dashboard
        </Link>
        <Link
          to="/learn/quantum-threats"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted/50 text-sm font-medium text-foreground transition-colors"
        >
          <ExternalLink size={16} />
          Quantum Threats Module — understand how quantum computers break cryptography
        </Link>
      </div>
    </div>
  )
}
