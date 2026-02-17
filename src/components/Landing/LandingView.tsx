import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Globe,
  Shield,
  FlaskConical,
  Activity,
  BookOpen,
  GraduationCap,
  AlertTriangle,
  ShieldCheck,
  Users,
  ArrowRightLeft,
  ArrowRight,
  ClipboardCheck,
} from 'lucide-react'
import { Button } from '../ui/button'
import { timelineData } from '@/data/timelineData'
import { libraryData } from '@/data/libraryData'
import { softwareData } from '@/data/migrateData'
import { leadersData } from '@/data/leadersData'
import { loadPQCAlgorithmsData } from '@/data/pqcAlgorithmsData'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 },
  },
}

// Compute counts once at module level (sync data — stable, never changes)
const timelineEventCount = timelineData.flatMap((c) => c.bodies.flatMap((b) => b.events)).length
const libraryCount = libraryData.length
const softwareCount = softwareData.length
const leadersCount = leadersData.length

const features = [
  {
    icon: Globe,
    title: 'Migration Timeline',
    description: `${timelineEventCount}+ events tracking global PQC standardization from NIST, ETSI, IETF, and more`,
    path: '/timeline',
    color: 'text-primary',
  },
  {
    icon: Shield,
    title: 'Algorithm Explorer',
    description: '40+ algorithms compared — ML-KEM, ML-DSA, SLH-DSA, FrodoKEM, and beyond',
    path: '/algorithms',
    color: 'text-secondary',
  },
  {
    icon: FlaskConical,
    title: 'Crypto Playground',
    description: 'Real key generation, encapsulation, and signing with ML-KEM & ML-DSA in-browser',
    path: '/playground',
    color: 'text-accent',
  },
  {
    icon: Activity,
    title: 'OpenSSL Studio',
    description:
      'Full OpenSSL v3.6.0 running in WASM — generate keys, sign certs, test TLS configs',
    path: '/openssl',
    color: 'text-primary',
  },
  {
    icon: GraduationCap,
    title: 'Learning Modules',
    description: '6 hands-on courses: PKI, X.509, 5G security, digital assets, eIDAS 2.0',
    path: '/learn',
    color: 'text-secondary',
  },
  {
    icon: ShieldCheck,
    title: 'Compliance Tracker',
    description: 'FIPS 140-3, ACVP, and Common Criteria certifications with PQC readiness status',
    path: '/compliance',
    color: 'text-accent',
  },
  {
    icon: ClipboardCheck,
    title: 'Risk Assessment',
    description: '5-question wizard for personalized quantum risk score and migration roadmap',
    path: '/assess',
    color: 'text-primary',
  },
]

const secondaryFeatures = [
  {
    icon: AlertTriangle,
    title: 'Threat Dashboard',
    description: 'Quantum risk by industry',
    path: '/threats',
  },
  {
    icon: BookOpen,
    title: 'Standards Library',
    description: `${libraryCount} PQC standards & drafts`,
    path: '/library',
  },
  {
    icon: ArrowRightLeft,
    title: 'Migration Guide',
    description: `${softwareCount} verified PQC software tools`,
    path: '/migrate',
  },
  {
    icon: Users,
    title: 'Industry Leaders',
    description: `${leadersCount} organizations tracked`,
    path: '/leaders',
  },
]

export const LandingView = () => {
  const [algorithmCount, setAlgorithmCount] = useState<number | null>(null)

  useEffect(() => {
    loadPQCAlgorithmsData().then((data) => setAlgorithmCount(data.length))
  }, [])

  return (
    <div className="max-w-6xl mx-auto space-y-16 md:space-y-24">
      {/* Hero Section */}
      <section className="text-center pt-8 md:pt-16">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
          <p className="text-sm font-mono uppercase tracking-widest text-primary mb-4">
            Post-Quantum Cryptography
          </p>
        </motion.div>

        <motion.h1
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={1}
          className="text-3xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6"
        >
          The quantum threat is <span className="text-gradient">not theoretical.</span>
          <br />
          <span className="text-muted-foreground text-2xl md:text-3xl lg:text-4xl font-normal mt-2 block">
            Your migration plan should not be either.
          </span>
        </motion.h1>

        <motion.p
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={2}
          className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8"
        >
          Explore interactive timelines, test real PQC algorithms in your browser, and track
          compliance — all from a single open-source platform.
        </motion.p>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={3}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link to="/timeline">
            <Button variant="gradient" size="lg" className="w-full sm:w-auto text-base">
              Explore the Timeline
              <ArrowRight className="ml-2" size={18} />
            </Button>
          </Link>
          <Link to="/playground">
            <Button variant="outline" size="lg" className="w-full sm:w-auto text-base">
              Try the Playground
            </Button>
          </Link>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={4}
          className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto"
        >
          {[
            {
              value: algorithmCount !== null ? String(algorithmCount) : '...',
              label: 'Algorithms',
            },
            { value: String(timelineEventCount), label: 'Timeline Events' },
            { value: String(libraryCount), label: 'Standards Tracked' },
            { value: '6', label: 'Learning Modules' },
          ].map((stat) => (
            <div key={stat.label} className="glass-panel p-4">
              <div className="text-2xl md:text-3xl font-bold text-gradient">{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Primary Features Grid */}
      <section>
        <motion.div
          initial="hidden"
          animate="visible"
          className="text-center mb-10"
          variants={{ visible: { transition: { delayChildren: 0.3, staggerChildren: 0.1 } } }}
        >
          <motion.h2 variants={fadeUp} className="text-2xl md:text-3xl font-bold mb-3">
            Everything you need for <span className="text-gradient">PQC readiness</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground max-w-xl mx-auto">
            Real cryptographic operations powered by OpenSSL WASM and liboqs — not simulations.
          </motion.p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { delayChildren: 0.5, staggerChildren: 0.08 } } }}
        >
          {features.map((feature) => (
            <motion.div key={feature.path} variants={fadeUp}>
              <Link to={feature.path} className="block h-full">
                <div className="glass-panel p-6 h-full hover:border-primary/30 transition-colors group">
                  <feature.icon className={`${feature.color} mb-3`} size={28} />
                  <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Secondary Features */}
      <section>
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { delayChildren: 0.7, staggerChildren: 0.08 } } }}
        >
          {secondaryFeatures.map((feature) => (
            <motion.div key={feature.path} variants={fadeUp}>
              <Link to={feature.path} className="block">
                <div className="glass-panel p-4 hover:border-primary/30 transition-colors text-center group">
                  <feature.icon
                    className="text-muted-foreground group-hover:text-primary transition-colors mx-auto mb-2"
                    size={22}
                  />
                  <h3 className="text-sm font-semibold group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">{feature.description}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* CTA */}
      <section className="text-center pb-8">
        <motion.div
          initial="hidden"
          animate="visible"
          className="glass-panel p-8 md:p-12"
          variants={{ visible: { transition: { delayChildren: 0.9, staggerChildren: 0.1 } } }}
        >
          <motion.h2 variants={fadeUp} custom={0} className="text-2xl md:text-3xl font-bold mb-4">
            Open source. <span className="text-gradient">Free forever.</span>
          </motion.h2>
          <motion.p
            variants={fadeUp}
            custom={1}
            className="text-muted-foreground max-w-lg mx-auto mb-6"
          >
            PQC Today is GPL-3.0 licensed. Contribute on GitHub, report issues, or just start
            learning.
          </motion.p>
          <motion.div
            variants={fadeUp}
            custom={2}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to="/learn">
              <Button variant="gradient" size="lg" className="w-full sm:w-auto">
                Start Learning
                <GraduationCap className="ml-2" size={18} />
              </Button>
            </Link>
            <a
              href="https://github.com/pqctoday/pqc-timeline-app"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                View on GitHub
              </Button>
            </a>
          </motion.div>
        </motion.div>
      </section>
    </div>
  )
}
