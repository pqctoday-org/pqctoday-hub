// SPDX-License-Identifier: AGPL-3.0-only
import {
  Plane,
  Landmark,
  Zap,
  Radio,
  Stethoscope,
  Shield,
  Car,
  Cpu,
  Server,
  Globe,
  Bitcoin,
  Code,
  ShieldCheck,
  Wifi,
  Scale,
  Film,
  CreditCard,
  Train,
  ShoppingCart,
  Truck,
  Droplets,
  Layers,
} from 'lucide-react'

export const getIndustryIcon = (industry: string, size: number = 16, className?: string) => {
  const lower = industry.toLowerCase()
  if (lower.includes('aerospace') || lower.includes('aviation'))
    return <Plane size={size} className={className} />
  if (lower.includes('automotive')) return <Car size={size} className={className} />
  if (lower.includes('cloud') || lower.includes('data center'))
    return <Server size={size} className={className} />
  if (lower.includes('cross-industry') || lower.includes('cross industry'))
    return <Globe size={size} className={className} />
  if (lower.includes('crypto') || lower.includes('blockchain'))
    return <Bitcoin size={size} className={className} />
  if (lower.includes('energy') || lower.includes('utilities') || lower.includes('infrastructure'))
    return <Zap size={size} className={className} />
  if (lower.includes('finance') || lower.includes('banking') || lower.includes('financial'))
    return <Landmark size={size} className={className} />
  if (lower.includes('government') || lower.includes('defense'))
    return <Shield size={size} className={className} />
  if (lower.includes('healthcare') || lower.includes('pharma'))
    return <Stethoscope size={size} className={className} />
  if (lower.includes('insurance')) return <ShieldCheck size={size} className={className} />
  if (lower.includes('iot') || lower.includes('internet of things'))
    return <Wifi size={size} className={className} />
  if (lower.includes('it industry') || lower.includes('software'))
    return <Code size={size} className={className} />
  if (lower.includes('legal') || lower.includes('notary') || lower.includes('esignature'))
    return <Scale size={size} className={className} />
  if (lower.includes('media') || lower.includes('entertainment') || lower.includes('drm'))
    return <Film size={size} className={className} />
  if (lower.includes('payment')) return <CreditCard size={size} className={className} />
  if (lower.includes('rail') || lower.includes('transit'))
    return <Train size={size} className={className} />
  if (lower.includes('retail') || lower.includes('e-commerce') || lower.includes('ecommerce'))
    return <ShoppingCart size={size} className={className} />
  if (lower.includes('supply chain') || lower.includes('logistics'))
    return <Truck size={size} className={className} />
  if (lower.includes('telecom')) return <Radio size={size} className={className} />
  if (lower.includes('technology')) return <Cpu size={size} className={className} />
  if (lower.includes('water') || lower.includes('wastewater'))
    return <Droplets size={size} className={className} />
  return <Layers size={size} className={className} />
}

/** Longest comma segment that still reads as a token ("Cloud KMS key wrapping"). */
const MAX_TOKEN_CHARS = 40
const MAX_TOKEN_WORDS = 6

/**
 * Whether a crypto field is a short comma-separated list of tokens
 * ("RSA-2048, ECDSA P-256, TLS 1.3 key exchange") rather than prose. Since the
 * September 2026 source-fidelity pass most rows hold full sentences quoted from
 * their source, and splitting those on commas chopped clauses — and phrases
 * inside parentheses and quotation marks — into code-styled pills. A field is
 * a list only when every segment is short, its brackets balance, and the text
 * has no sentence punctuation or quotation marks.
 */
export function isCryptoTokenList(text: string): boolean {
  const trimmed = text.trim()
  if (!trimmed) return false
  if (/[;!?“”"]|\.(?:\s|$)/.test(trimmed)) return false
  return trimmed
    .split(',')
    .map((c) => c.trim())
    .every((seg) => {
      if (!seg) return false
      if (seg.length > MAX_TOKEN_CHARS) return false
      if (seg.split(/\s+/).length > MAX_TOKEN_WORDS) return false
      const open = (seg.match(/[([]/g) ?? []).length
      const close = (seg.match(/[)\]]/g) ?? []).length
      return open === close
    })
}

export type CryptoFieldDisplay =
  | { kind: 'empty' }
  | { kind: 'chips'; visible: string[]; hiddenCount: number }
  | { kind: 'prose'; text: string }

/**
 * How to show a crypto field inline: a token list becomes chips, capped at
 * `max` with a count of the hidden ones (the uncapped table forced 1035px of
 * horizontal scroll, Threats #6); prose stays one piece of text for the caller
 * to clamp. The full text is always in the detail dialog.
 */
export function cryptoFieldDisplay(text: string, max = 3): CryptoFieldDisplay {
  const trimmed = text.trim()
  if (!trimmed) return { kind: 'empty' }
  if (!isCryptoTokenList(trimmed)) return { kind: 'prose', text: trimmed }
  const items = trimmed
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean)
  return {
    kind: 'chips',
    visible: items.slice(0, max),
    hiddenCount: Math.max(0, items.length - max),
  }
}

/** "1 threat" / "5 threats" — never "1 threats" (UX-19). */
export function threatCountLabel(n: number): string {
  return `${n} threat${n === 1 ? '' : 's'}`
}
