// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { ChevronDown, ChevronRight, Sparkles, TerminalSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useOpenSSLStore } from '../store'
import type { WorkbenchCategory } from './WorkbenchToolbar'

interface Preset {
  label: string
  cmd: string
  category: WorkbenchCategory
  /**
   * False for presets that use shell pipe syntax (`A | B`) or `echo` — the
   * Studio's command runner is a whitespace-splitting parser with no shell
   * semantics, so these can't actually run in-browser. They're kept as
   * reference commands to copy onto a real machine (OpenSSL 3.5+), not to
   * run here. Defaults to true when omitted.
   */
  runnable?: boolean
}

const PRESET_GROUPS: { group: string; presets: Preset[] }[] = [
  {
    group: 'PQC Keys',
    presets: [
      {
        label: 'Generate ML-DSA-65 key',
        cmd: 'openssl genpkey -algorithm ML-DSA-65 -out ml-dsa-65.key',
        category: 'genpkey',
      },
      {
        label: 'Generate ML-KEM-768 key',
        cmd: 'openssl genpkey -algorithm ML-KEM-768 -out ml-kem-768.key',
        category: 'genpkey',
      },
      {
        label: 'Generate SLH-DSA-SHA2-128s key',
        cmd: 'openssl genpkey -algorithm SLH-DSA-SHA2-128s -out slh-dsa.key',
        category: 'genpkey',
      },
    ],
  },
  {
    group: 'Classical Keys',
    presets: [
      {
        label: 'Generate RSA-4096 key',
        cmd: 'openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:4096 -out rsa4096.key',
        category: 'genpkey',
      },
      {
        label: 'Generate EC P-256 key',
        cmd: 'openssl genpkey -algorithm EC -pkeyopt ec_paramgen_curve:P-256 -out ec-p256.key',
        category: 'genpkey',
      },
    ],
  },
  {
    group: 'Certificates',
    presets: [
      {
        label: 'Self-signed cert (365 days)',
        cmd: 'openssl req -x509 -newkey rsa:2048 -keyout self-signed.key -out self-signed.crt -days 365 -nodes -subj "/CN=example.com/O=Test/C=US"',
        category: 'x509',
      },
      {
        label: 'Inspect a certificate',
        cmd: 'openssl x509 -in self-signed.crt -text -noout',
        category: 'x509',
      },
    ],
  },
  {
    group: 'Hashing & Signing',
    presets: [
      {
        label: 'SHA-256 digest (reference only — not runnable in-Studio)',
        cmd: 'echo "hello world" | openssl dgst -sha256',
        category: 'dgst',
        runnable: false,
      },
      {
        label: 'Verify FIPS-validated cert fingerprint',
        cmd: 'openssl x509 -in self-signed.crt -fingerprint -sha256 -noout',
        category: 'x509',
      },
    ],
  },
  {
    group: 'KEM',
    presets: [
      {
        label: 'ML-KEM-768 encapsulate',
        cmd: 'openssl pkeyutl -encap -inkey ml-kem-768.pub -pubin -out ciphertext.bin -secret secret.bin',
        category: 'kem',
      },
      {
        label: 'ML-KEM-768 decapsulate',
        // -out (not -secret) is the correct decap output flag — verified
        // against the bundled OpenSSL 3.6.2 binary's real `pkeyutl -decap`
        // behavior; -secret is documented for encapsulation only. See the
        // `pkeyutl -decap` KAT test for the regression guard.
        cmd: 'openssl pkeyutl -decap -inkey ml-kem-768.key -in ciphertext.bin -out recovered.bin',
        category: 'kem',
      },
    ],
  },
  {
    group: 'Info',
    presets: [
      {
        label: 'List PQC algorithms (reference only — not runnable in-Studio)',
        cmd: 'openssl list -signature-algorithms | grep -i "ml\\|slh\\|falcon\\|pqc"',
        category: 'version',
        runnable: false,
      },
      {
        label: 'Show OpenSSL version',
        cmd: 'openssl version -a',
        category: 'version',
      },
    ],
  },
]

interface WorkbenchPresetsProps {
  setCategory: (cat: WorkbenchCategory) => void
}

export const WorkbenchPresets: React.FC<WorkbenchPresetsProps> = ({ setCategory }) => {
  const { setCommand } = useOpenSSLStore()
  const [open, setOpen] = useState(false)

  const applyPreset = (preset: Preset) => {
    setCategory(preset.category)
    setCommand(preset.cmd)
  }

  return (
    <div>
      <Button
        variant="ghost"
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 w-full text-left h-auto p-0 hover:bg-transparent"
        aria-expanded={open}
      >
        <Sparkles size={14} className="text-primary shrink-0" aria-hidden="true" />
        <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex-1">
          Quick Start
        </span>
        {open ? (
          <ChevronDown size={14} className="text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight size={14} className="text-muted-foreground shrink-0" />
        )}
      </Button>

      {open && (
        <div className="mt-3 space-y-3">
          {PRESET_GROUPS.map((g) => (
            <div key={g.group}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                {g.group}
              </p>
              <div className="space-y-1">
                {g.presets.map((p) => (
                  <Button
                    key={p.label}
                    variant="ghost"
                    size="sm"
                    onClick={() => applyPreset(p)}
                    title={
                      p.runnable === false
                        ? 'Uses shell pipe syntax the Studio cannot execute — copy this command to run on your own machine with OpenSSL 3.5+ installed.'
                        : undefined
                    }
                    className="w-full justify-start gap-1.5 text-xs h-auto py-1.5 px-2 text-muted-foreground hover:text-foreground hover:bg-muted/80 font-normal"
                  >
                    {p.runnable === false && (
                      <TerminalSquare size={11} className="shrink-0 text-status-warning" />
                    )}
                    <span>{p.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
