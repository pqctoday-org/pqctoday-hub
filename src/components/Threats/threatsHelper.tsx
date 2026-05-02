// SPDX-License-Identifier: GPL-3.0-only
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
