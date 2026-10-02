// SPDX-License-Identifier: GPL-3.0-only
import type { FC } from 'react'
import { ArrowRight, MessageSquareWarning, MessagesSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import { Introduction } from './components/Introduction'
import { ChoiceDrill } from './workshop/ChoiceDrill'
import { CLAIMS, QUESTIONS } from './data'
import manifest from './manifest'

const PARTS: WorkshopPart[] = [
  {
    id: 'claim-checker',
    title: 'Step 1: Claim Checker',
    description: 'Pick the most accurate version of six claims you will hear in pitches and press.',
    icon: MessageSquareWarning,
  },
  {
    id: 'question-practice',
    title: 'Step 2: Customer Questions',
    description: 'Pick the strongest answer to four questions customers and buyers ask.',
    icon: MessagesSquare,
  },
]

const EXERCISES: { prompt: string; step: number; cta: string }[] = [
  {
    prompt:
      'Find a quantum claim in a press release, product page or article. Rewrite it so it names the standard, the version and the evidence — and note anything you could not verify.',
    step: 0,
    cta: 'Compare with the Claim Checker',
  },
  {
    prompt:
      'A colleague wants to say “we are FIPS certified for PQC”. Write the three questions you would ask them before that sentence goes out.',
    step: 0,
    cta: 'Review the certificate claims',
  },
  {
    prompt:
      'Draft a five-sentence answer to “Are you quantum-safe?” for a product you know: what is protected today, what is planned and when, and the evidence for each.',
    step: 1,
    cta: 'Practise the customer questions',
  },
]

export const TalkingAboutPQCModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    description="What is true today, which dates are real, what a certificate proves, and which words to avoid — for anyone who has to talk about post-quantum cryptography at work."
    learn={(api) => <Introduction onNavigateToWorkshop={api.goToWorkshop} />}
    exercises={(api) => (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Apply each idea to real material. There is rarely one right wording — aim for a sentence
          someone else could check.
        </p>
        {EXERCISES.map((ex) => (
          <div key={ex.prompt} className="glass-panel p-4">
            <p className="text-sm text-foreground mb-3">{ex.prompt}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => api.goToWorkshop(ex.step)}
              className="gap-1.5 border-primary text-primary hover:bg-primary/10"
            >
              {ex.cta} <ArrowRight size={13} />
            </Button>
          </div>
        ))}
      </div>
    )}
    workshopParts={PARTS}
    renderWorkshopStep={(index, configKey) => {
      switch (index) {
        case 0:
          return (
            <ChoiceDrill
              key={`claims-${configKey}`}
              heading="Claim Checker"
              intro="For each claim, pick the version that is accurate and checkable. You will see why straight away."
              items={CLAIMS}
            />
          )
        case 1:
          return (
            <ChoiceDrill
              key={`questions-${configKey}`}
              heading="Customer Questions"
              intro="For each question, pick the answer that is honest, specific and backed by evidence."
              items={QUESTIONS}
            />
          )
        default:
          return null
      }
    }}
  />
)
