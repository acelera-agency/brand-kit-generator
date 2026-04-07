import { WaitlistForm } from "./waitlist-form";

const STAGES = [
  {
    n: "00",
    name: "Context & contradiction",
    body: "Find what the brand was before it became this. The contradiction is the fuel.",
    gate: "A 3-sentence 'before vs after' that sounds like the founder, not a press release.",
  },
  {
    n: "01",
    name: "The enemy",
    body: "Name the enemy. Not a competitor — a practice the brand opposes.",
    gate: "Founder names the enemy in one sentence; another team member would recognize it.",
  },
  {
    n: "02",
    name: "Three-layer stack",
    body: "Character, Promise, Method as three distinct things — each with a working phrase under 10 words.",
    gate: "Three working phrases, each distinguishable from the others.",
  },
  {
    n: "03",
    name: "Anti-positioning",
    body: "At least 5 things the brand is NOT — each one costing real money.",
    gate: "Every line costs the brand something concrete.",
  },
  {
    n: "04",
    name: "ICP by signals",
    body: "Behavioral signals, not job titles. What's on this person's desk that signals fit?",
    gate: "4-6 signals observable in the first 10 minutes of a sales call.",
  },
  {
    n: "05",
    name: "Voice as constraints",
    body: "A do/don't list with REAL phrases, not adjectives. Plus writing rules.",
    gate: "A new hire could write a tweet in-brand from this section alone.",
  },
  {
    n: "06",
    name: "Application templates",
    body: "Hero copy, cold email, social bios, first-meeting script, signature — each pasteable into a real surface.",
    gate: "Every template usable the same day on a real surface.",
  },
  {
    n: "07",
    name: "Visual direction",
    body: "Force a choice: refined consultancy or maximalist editorial. Hybrid is forbidden.",
    gate: "A designer could mock up a homepage that's recognizably this brand on the first try.",
  },
];

const FAQ = [
  {
    q: "Why not just use ChatGPT with a prompt of my own?",
    a: "You can. The methodology in prompt.md is open source. The product runs the interview for you with structure, pushback rules, and a database of calibration examples — but if you want to DIY, the source is right there on GitHub.",
  },
  {
    q: "How is this different from other AI brand kit generators?",
    a: "Other generators ask 5 questions and produce a deck. This one asks 80+ questions across 8 stages, refuses to advance until each stage passes a gate, and produces a kit you can actually use to refuse projects, write outreach, and grade new pieces. The difference is the gates.",
  },
  {
    q: "Can I use this for free?",
    a: "Yes — the prompt and methodology are MIT-licensed on GitHub. The hosted version is for founders who want a structured 60-90 minute experience with the interview UI, real-time pushback, and exports to PDF / Markdown / Notion.",
  },
  {
    q: "What if my brand is too early for an 8-stage interview?",
    a: "You'll find out in Stage 0. If the contradiction isn't real yet, the generator will tell you to come back when it is — instead of producing a kit you'll throw away in 6 months.",
  },
  {
    q: "Who built this?",
    a: "Acelera, an agency that helps companies adopt AI in the processes where it actually changes the result of the business. The methodology was reverse-engineered from our own brand kit.",
  },
];

export default function Page() {
  return (
    <main>
      {/* ============ TOPBAR ============ */}
      <header className="sticky top-0 z-50 bg-paper border-b border-rule">
        <div className="container-brand flex items-center justify-between py-4 font-mono text-xs uppercase tracking-widest text-muted gap-4">
          <div className="flex items-center gap-3 text-ink font-medium">
            <span className="inline-block w-2 h-2 bg-accent" />
            Brand Kit Generator
          </div>
          <nav className="hidden sm:flex gap-6">
            <a
              href="https://github.com/acelera-agency/brand-kit-generator"
              className="hover:text-ink transition-colors"
            >
              GitHub
            </a>
            <a href="#methodology" className="hover:text-ink transition-colors">
              Methodology
            </a>
            <a href="#waitlist" className="hover:text-ink transition-colors">
              Waitlist
            </a>
          </nav>
        </div>
      </header>

      {/* ============ HERO ============ */}
      <section className="container-brand pt-24 pb-32">
        <p className="eyebrow mb-6 block">
          BRAND KIT GENERATOR · COMING SOON
        </p>
        <h1 className="font-display font-semibold text-ink leading-[0.95] tracking-tightest text-[clamp(2.75rem,7vw,6rem)] max-w-[18ch]">
          Brand kits that decide for you. Not decorate for you.
        </h1>
        <p className="font-display text-[clamp(1.25rem,2vw,1.75rem)] font-medium text-muted-strong leading-snug max-w-[42ch] mt-8">
          An opinionated 8-stage interview that produces a kit you can use to
          refuse projects, write outreach, and grade new copy. If your brand
          isn&apos;t ready for the interview, we&apos;ll tell you in the first
          5 minutes.
        </p>
        <div className="flex flex-wrap gap-3 mt-10">
          <a href="#waitlist" className="btn-primary">
            Join the waitlist →
          </a>
          <a
            href="https://github.com/acelera-agency/brand-kit-generator"
            className="btn-secondary"
            target="_blank"
            rel="noreferrer"
          >
            See the methodology
          </a>
        </div>
      </section>

      {/* ============ THE PROBLEM ============ */}
      <section className="border-t border-rule">
        <div className="container-brand py-24 grid grid-cols-1 lg:grid-cols-[88px_1fr] gap-8">
          <span className="section-num">01 / Problem</span>
          <div className="max-w-[55ch]">
            <p className="font-display font-semibold text-[clamp(1.75rem,3vw,2.5rem)] leading-tight tracking-tight text-ink">
              Most brand kits are decoration. They sit in Notion and never
              inform a single decision.
            </p>
            <p className="text-muted-strong text-lg leading-relaxed mt-6">
              You paid an agency, you got a 60-page deck with adjectives like
              &quot;bold&quot; and &quot;trustworthy,&quot; and six months
              later your team is still asking the founder how to write a cold
              email. The kit didn&apos;t fail because the strategist was bad.
              It failed because the format produces decoration, not a decision
              tool.
            </p>
            <p className="text-muted-strong text-lg leading-relaxed mt-4">
              This generator produces the opposite: a kit that names what the
              brand is NOT, gives you do/don&apos;t phrases a stranger could
              write a tweet from, and lays out non-negotiable rules per
              surface. You can grade any new piece against it in 60 seconds.
            </p>
          </div>
        </div>
      </section>

      {/* ============ METHODOLOGY ============ */}
      <section id="methodology" className="border-t border-rule">
        <div className="container-brand py-24">
          <div className="grid grid-cols-1 lg:grid-cols-[88px_1fr] gap-8 mb-16">
            <span className="section-num">02 / Methodology</span>
            <div>
              <p className="eyebrow mb-3 block">8 stages, 8 gates</p>
              <h2 className="font-display font-semibold text-[clamp(1.75rem,3vw,2.5rem)] leading-tight tracking-tight max-w-[24ch]">
                Each stage has a gate. The interview won&apos;t advance until
                you pass it.
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-rule border border-rule">
            {STAGES.map((s) => (
              <article
                key={s.n}
                className="bg-paper-pure p-6 flex flex-col gap-3"
              >
                <span className="font-mono text-xs text-accent tracking-widest">
                  STAGE {s.n}
                </span>
                <h3 className="font-display font-semibold text-lg text-ink leading-snug">
                  {s.name}
                </h3>
                <p className="text-sm text-muted-strong leading-relaxed flex-1">
                  {s.body}
                </p>
                <p className="text-xs text-muted border-t border-rule pt-3 mt-2 italic">
                  Gate: {s.gate}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CALIBRATION ============ */}
      <section className="border-t border-rule bg-paper-pure">
        <div className="container-brand py-24 grid grid-cols-1 lg:grid-cols-[88px_1fr] gap-8">
          <span className="section-num">03 / Calibration</span>
          <div>
            <p className="eyebrow mb-3 block">The standard</p>
            <h2 className="font-display font-semibold text-[clamp(1.75rem,3vw,2.5rem)] leading-tight tracking-tight max-w-[24ch] mb-12">
              This is the texture the generator holds you to.
            </h2>

            <div className="space-y-12 max-w-[60ch]">
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-muted mb-3">
                  Anti-positioning that costs money
                </p>
                <blockquote className="border-l-2 border-accent pl-5 font-display text-xl text-ink italic leading-snug">
                  &quot;We don&apos;t sell pilots without a path to
                  production.&quot;
                </blockquote>
                <p className="text-sm text-muted-strong mt-3 leading-relaxed">
                  Costs money because most prospects ask for a pilot first.
                  Saying no filters them out — and that&apos;s the point.
                </p>
              </div>

              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-muted mb-3">
                  Voice — do / don&apos;t pair
                </p>
                <ul className="font-display text-lg text-ink space-y-2">
                  <li className="flex gap-3">
                    <span className="text-accent font-mono">+</span>
                    <span>&quot;If it can&apos;t be measured, we don&apos;t do it.&quot;</span>
                  </li>
                  <li className="flex gap-3 line-through decoration-rule-strong text-muted-strong">
                    <span className="text-signal font-mono no-underline">−</span>
                    <span>&quot;Next-generation AI solutions.&quot;</span>
                  </li>
                </ul>
              </div>

              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-muted mb-3">
                  ICP signal — behavioral, not demographic
                </p>
                <blockquote className="border-l-2 border-accent pl-5 font-display text-xl text-ink italic leading-snug">
                  &quot;They have enough volume that AI moves the needle —
                  they&apos;re not an Excel case.&quot;
                </blockquote>
                <p className="text-sm text-muted-strong mt-3 leading-relaxed">
                  Not a job title. Not a company size. A behavioral threshold
                  the founder can verify in the first 10 minutes of a
                  discovery call.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ OPEN SOURCE BAND ============ */}
      <section className="border-t border-rule bg-ink text-paper">
        <div className="container-brand py-24 grid grid-cols-1 lg:grid-cols-[88px_1fr] gap-8">
          <span className="font-mono text-xs uppercase tracking-widest text-paper/50 border-t border-paper/20 pt-2 inline-block">
            04 / Open source
          </span>
          <div>
            <h2 className="font-display font-semibold text-[clamp(2rem,4vw,3.25rem)] leading-tight tracking-tight max-w-[18ch]">
              The methodology is open source. The product runs it for you.
            </h2>
            <p className="text-paper/75 text-lg leading-relaxed mt-6 max-w-[55ch]">
              The full system prompt, the 8 stages, the pushback rules and the
              calibration examples are all on GitHub under MIT. You can fork
              it, run it manually, paste it into Claude or ChatGPT, or
              translate it. The hosted version exists because most founders
              don&apos;t want to set up an LLM session at 10pm — they want a
              structured 90-minute interview with a tool that pushes back
              when they get vague.
            </p>
            <div className="flex flex-wrap gap-3 mt-10">
              <a
                href="https://github.com/acelera-agency/brand-kit-generator"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center bg-paper text-ink font-mono text-xs uppercase tracking-widest px-6 py-4 hover:bg-paper-pure transition-colors"
              >
                Read the prompt on GitHub →
              </a>
              <a
                href="https://github.com/acelera-agency/brand"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center text-paper font-mono text-xs uppercase tracking-widest px-6 py-4 border border-paper/30 hover:bg-paper/10 transition-colors"
              >
                See an example output
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ============ HOSTED PRODUCT ============ */}
      <section className="border-t border-rule">
        <div className="container-brand py-24 grid grid-cols-1 lg:grid-cols-[88px_1fr] gap-8">
          <span className="section-num">05 / Hosted product</span>
          <div>
            <p className="eyebrow mb-3 block">What the SaaS will do</p>
            <h2 className="font-display font-semibold text-[clamp(1.75rem,3vw,2.5rem)] leading-tight tracking-tight max-w-[24ch] mb-10">
              The same methodology. With a UI that pushes back in real time.
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-[55rem]">
              <div className="border-t border-rule-strong pt-4">
                <p className="font-mono text-xs uppercase tracking-widest text-accent mb-2">
                  01 — Interview UI
                </p>
                <h3 className="font-display font-semibold text-lg text-ink mb-2">
                  One question at a time
                </h3>
                <p className="text-sm text-muted-strong leading-relaxed">
                  No 50-question form. Multi-stage flow that pauses when
                  answers are vague and asks the sharper version.
                </p>
              </div>

              <div className="border-t border-rule-strong pt-4">
                <p className="font-mono text-xs uppercase tracking-widest text-accent mb-2">
                  02 — Real-time pushback
                </p>
                <h3 className="font-display font-semibold text-lg text-ink mb-2">
                  Forbidden words flagged live
                </h3>
                <p className="text-sm text-muted-strong leading-relaxed">
                  Type &quot;innovative&quot; or &quot;next-gen&quot; into a
                  voice example and the form will refuse it. Same gates the
                  prompt enforces.
                </p>
              </div>

              <div className="border-t border-rule-strong pt-4">
                <p className="font-mono text-xs uppercase tracking-widest text-accent mb-2">
                  03 — Multi-format export
                </p>
                <h3 className="font-display font-semibold text-lg text-ink mb-2">
                  Markdown, PDF, Notion
                </h3>
                <p className="text-sm text-muted-strong leading-relaxed">
                  Take the kit anywhere. The Markdown export is the source of
                  truth; PDF and Notion follow.
                </p>
              </div>

              <div className="border-t border-rule-strong pt-4">
                <p className="font-mono text-xs uppercase tracking-widest text-accent mb-2">
                  04 — Optional human session
                </p>
                <h3 className="font-display font-semibold text-lg text-ink mb-2">
                  Premium tier with the team
                </h3>
                <p className="text-sm text-muted-strong leading-relaxed">
                  Live 90-minute session with an Acelera strategist running
                  the methodology over Zoom, plus the delivered kit.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ PRICING TEASER ============ */}
      <section className="border-t border-rule bg-paper-pure">
        <div className="container-brand py-24 grid grid-cols-1 lg:grid-cols-[88px_1fr] gap-8">
          <span className="section-num">06 / Pricing</span>
          <div>
            <p className="font-display text-3xl text-ink leading-tight tracking-tight max-w-[28ch]">
              Pricing TBD. Waitlist members get early access and a discount on
              first launch.
            </p>
            <p className="text-sm text-muted-strong mt-4 max-w-[55ch]">
              We&apos;ll send one email when the hosted version is ready. No
              newsletter, no marketing sequence.
            </p>
          </div>
        </div>
      </section>

      {/* ============ WAITLIST ============ */}
      <section
        id="waitlist"
        className="border-t border-rule"
      >
        <div className="container-brand py-24 grid grid-cols-1 lg:grid-cols-[88px_1fr] gap-8">
          <span className="section-num">07 / Waitlist</span>
          <div className="max-w-[42rem]">
            <h2 className="font-display font-semibold text-[clamp(1.75rem,3vw,2.5rem)] leading-tight tracking-tight max-w-[20ch] mb-6">
              Get notified when the hosted version ships.
            </h2>
            <p className="text-muted-strong text-lg leading-relaxed mb-8 max-w-[50ch]">
              One email when it&apos;s live. That&apos;s it. In the meantime,
              the methodology is already on{" "}
              <a
                href="https://github.com/acelera-agency/brand-kit-generator"
                className="text-accent border-b border-accent hover:opacity-70"
              >
                GitHub
              </a>{" "}
              if you want to start now.
            </p>
            <WaitlistForm />
          </div>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section className="border-t border-rule bg-paper-pure">
        <div className="container-brand py-24 grid grid-cols-1 lg:grid-cols-[88px_1fr] gap-8">
          <span className="section-num">08 / FAQ</span>
          <div className="max-w-[60ch]">
            <h2 className="font-display font-semibold text-[clamp(1.75rem,3vw,2.5rem)] leading-tight tracking-tight mb-12">
              Questions you might have.
            </h2>
            <dl className="space-y-8">
              {FAQ.map((item) => (
                <div key={item.q} className="border-t border-rule pt-6">
                  <dt className="font-display font-semibold text-lg text-ink mb-3">
                    {item.q}
                  </dt>
                  <dd className="text-muted-strong leading-relaxed">
                    {item.a}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="bg-ink-deep text-paper">
        <div className="container-brand py-12 flex flex-wrap justify-between gap-6 font-mono text-xs uppercase tracking-widest text-paper/55">
          <span>Brand Kit Generator · v0 · Coming soon</span>
          <span>
            Built by{" "}
            <a
              href="https://acelera.agency"
              className="text-paper border-b border-paper/40 hover:opacity-70"
            >
              Acelera
            </a>
          </span>
          <span>
            <a
              href="https://github.com/acelera-agency/brand-kit-generator"
              className="text-paper border-b border-paper/40 hover:opacity-70"
            >
              GitHub
            </a>
          </span>
        </div>
      </footer>
    </main>
  );
}
