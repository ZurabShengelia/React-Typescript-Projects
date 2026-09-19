import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DifficultyBadge } from "@/components/common/DifficultyBadge";
import { SampleTestPreview } from "@/components/marketing/SampleTestPreview";

const categories = [
  { name: "Web Security", description: "XSS, injection, and browser-side attack surfaces." },
  { name: "Authentication", description: "Session handling, password storage, identity verification." },
  { name: "Cryptography", description: "Hashing, encryption, and key management mistakes." },
  { name: "Secure Coding", description: "Writing code that resists whole classes of bugs by design." },
  { name: "Network Security", description: "Protocols, firewalls, and traffic-level defenses." },
  { name: "Linux & Systems", description: "Permissions, hardening, and operational security." },
  { name: "APIs & Databases", description: "Query construction and data access patterns." },
  { name: "DevSecOps", description: "Security in build pipelines, dependencies, deployment." },
];

const flow = [
  "Choose a security domain",
  "Work through real scenarios",
  "Review your security gaps",
];

export default function Landing() {
  return (
    <div>
      <section className="border-b border-base-border">
        <div className="mx-auto grid max-w-[1240px] gap-14 px-6 py-16 lg:grid-cols-[1.05fr,0.95fr] lg:items-center lg:py-20">
          <div>
            <h1 className="text-2xl font-semibold leading-[1.15] text-ink lg:text-3xl">
              Measure what your team actually knows about security.
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink-muted">
              Script Kiddie is a structured assessment engine for cybersecurity and secure-coding
              knowledge — real questions, scored attempts, and a dashboard that tracks progress
              over time.
            </p>
            <div className="mt-8 flex items-center gap-3">
              <Button asChild size="lg">
                <Link to="/register">Create a free account</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link to="/login">Log in</Link>
              </Button>
            </div>
          </div>

          <SampleTestPreview />
        </div>
      </section>

      <section className="border-b border-base-border">
        <div className="mx-auto max-w-[1240px] px-6 py-16">
          <h2 className="text-xl font-semibold text-ink">The assessment experience</h2>
          <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-4">
            {flow.map((step, i) => (
              <div key={step} className="flex items-center gap-3">
                <span className="rounded-md border border-base-border bg-base-panel px-4 py-2.5 text-base font-medium text-ink">
                  {step}
                </span>
                {i < flow.length - 1 && <ArrowRight className="h-4 w-4 shrink-0 text-ink-faint" />}
              </div>
            ))}
          </div>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-ink-muted">
            Pick a category and difficulty tier, work through scenario-based questions one at a time with
            nothing scored until you submit, then review exactly which questions you missed and why —
            every explanation is written against the real vulnerability, not a generic hint.
          </p>
        </div>
      </section>

      <section className="border-b border-base-border">
        <div className="mx-auto max-w-[1240px] px-6 py-16">
          <h2 className="text-xl font-semibold text-ink">Difficulty levels</h2>
          <p className="mt-2 max-w-xl text-base text-ink-muted">
            Every test is written for one of three tiers, so you can gauge whether the content
            matches your current experience level before you start.
          </p>
          <div className="mt-8 divide-y divide-base-border rounded-md border border-base-border bg-base-panel">
            <div className="grid gap-2 p-5 sm:grid-cols-[180px,1fr] sm:items-center sm:gap-6">
              <DifficultyBadge difficulty="easy" />
              <p className="text-base text-ink-muted">
                Easy cybersecurity challenges for beginners getting oriented with core concepts.
              </p>
            </div>
            <div className="grid gap-2 p-5 sm:grid-cols-[180px,1fr] sm:items-center sm:gap-6">
              <DifficultyBadge difficulty="medium" />
              <p className="text-base text-ink-muted">
                Intermediate challenges for developers with practical programming experience.
              </p>
            </div>
            <div className="grid gap-2 p-5 sm:grid-cols-[180px,1fr] sm:items-center sm:gap-6">
              <DifficultyBadge difficulty="hard" />
              <p className="text-base text-ink-muted">
                Advanced cybersecurity and engineering challenges requiring deeper technical knowledge.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-base-border">
        <div className="mx-auto max-w-[1240px] px-6 py-16">
          <h2 className="text-xl font-semibold text-ink">Categories</h2>
          <div className="mt-8 grid gap-x-8 gap-y-5 sm:grid-cols-2">
            {categories.map((c) => (
              <div key={c.name} className="border-l-2 border-base-border pl-4">
                <p className="text-base font-medium text-ink">{c.name}</p>
                <p className="mt-1 text-sm text-ink-muted">{c.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-[1240px] px-6 py-16">
          <div className="rounded-md border border-base-border bg-base-panel p-10 text-center">
            <h2 className="text-xl font-semibold text-ink">Start your first assessment</h2>
            <p className="mt-2 text-base text-ink-muted">Free to create an account. No credit card required.</p>
            <Button asChild size="lg" className="mt-6">
              <Link to="/register">Create a free account</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
