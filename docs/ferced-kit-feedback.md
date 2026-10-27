# Feedback: Generator output for ferced

Source: end-to-end guided run of the brand-kit-generator against ferced.com (existing software studio, "already operating" mode), 2026-04-16.

Kit URL: `https://web-app-frxn.vercel.app/kit/9e0d9933-be91-4df9-960e-879604e43637`
Exported markdown: `C:\Users\franc\OneDrive\Documentos\dev\ferced\ferced-brand-kit.md`

This file has two layers:
1. **Direct opinion on the ferced kit itself** — what's strong, what's weak, what to change in this specific kit.
2. **Inferred improvements for the generator** — gaps in the kit that point to gaps in the generator's flow.

---

## Part 1 — Direct opinion on the ferced kit

### What works very well in this kit

- **Enemy + anti-positioning combo is sharp.** "Software como commodity de hora-hombre" is operational — tells you which leads to reject and why. Most kits stop at "we compete on quality"; this one commits.
- **First-minute opener** is the best single piece. It's a real disqualification script the founder can read literal in a discovery call. Protects the ticket and filters junk in the first 60s.
- **5 reglas por superficie are enforceable for real.** Any senior dev can review a proposal or case and check yes/no in under 5 minutes. Rare in brand kits.
- **Voice + before/after pairs** lower the abstraction to rewriteable phrases. Anyone new can write a mail tomorrow without asking around.

### What's weak and should be fixed in this kit

1. **Auto-generated "Context" (line 3 of export) betrays the brand voice.** Reads "Ferced surge como un studio senior que integra arquitectura técnica seria, IA on-premise, proximidad founder-to-founder…" — that's exactly the corporate-speak the Voice rules forbid. Rewrite by hand in ferced voice (60-80 words).
2. **Money rules with no numbers.** "Sin descuento por volumen" but no price floor. "No cotización sin discovery pago" but discovery pago is never defined (price, duration, deliverable). When cash pressure hits, these rules break. Add a Pricing & engagement model section: floor ticket, discovery pricing, billing cadence.
3. **Bad-fit signals from M5 didn't land in the final export.** Only Primary signals are in the kit. Selling depends as much on disqualifying as qualifying. Add anti-signals back in.
4. **"USA" appears in bios and signature, but no entry strategy.** Stating geography without evidence inflates the brand. Either pull USA from public copy until there are 1-2 real deals, or add an internal note ("USA = referrals only por ahora").
5. **Cases rule ("métrica antes/después o queda fuera") would exclude the current portfolio.** Suma, Precedu, CourtBook, Da Vinci show no metrics today. Either soften the rule or commit to rewriting the cases with data — but the kit doesn't surface this transition.
6. **Voseo argentino doesn't scale to USA.** The voice rules are tightly Argentine-coded. The kit doesn't resolve how ferced sounds in English. Decide: USA-only-via-Spanish-speaking-founders, or build an EN voice variant.
7. **Don't-list mixes severity tiers.** "Sinergias / aliado estratégico" (truly forbidden) at the same level as "Soluciones a medida" (banal but neutral) and "Boutique tecnológica" (debatable). Split into "never" vs "avoid unless qualified".
8. **Cold outreach body (~110 words) violates own writing rules.** Several sentences exceed the 18-word limit set in M6. Tighten 30%, and the SmartDiagnosis paragraph should only appear when the prospect is in healthcare/regulated.
9. **Bios are inconsistent on capitalization style** without a documented rule. LinkedIn = sentence case. X = lowercase. Instagram = lowercase + middots. Fine if intentional, but should be written down so it doesn't drift.

### Strategic-level risk for ferced

The kit commits to ICP B (regulated/serious software with on-premise IA) as primary, with ICP A (operational PyMEs) as secondary. **The current portfolio is ~80% ICP A.** Only SmartDiagnosis and DocuMind anchor ICP B.

The brand is ahead of the evidence. In the next 6 months, if 1-2 ICP B cases don't enter the portfolio, the promise reads as aspirational vs. actual. The kit should be treated as a pipeline commitment: each quarter, X% of new pipeline must be ICP B, or the brand drifts away from what ferced actually does day-to-day.

### Top 3 changes to this kit, ranked

1. Rewrite Context by hand in ferced voice (60-80 words, no corporate-speak).
2. Add a "Pricing & engagement model" section with real numbers (discovery = $X, ticket floor = $Y).
3. Add bad-fit signals to ICP, plus an honest USA note (or remove USA from public copy).

---

## Part 2 — Inferred improvements for the generator

These are the same gaps as Part 1, but reframed as upgrades to the generator's prompt/flow so future kits don't need the same manual cleanup.

### What the generator does well

1. **Enemy + anti-positioning are the strongest milestones.** The structured-blocks pattern (statement + cost) forced a real commitment instead of platitudes. "Most painful refusal" in particular pushed concreteness.
2. **First-minute opener template is genuinely usable.** The output is a script the founder can read literal in a discovery call. This is the rarest thing brand kits get right.
3. **Per-surface enforceable rules (M9)** with a "rule + reason" pair are reviewable in <5 minutes by a third party. That converts the kit from a deck into an internal QA tool.
4. **Forced before/after pairs in voice (M6)** beat any abstract tone definition. The pairs immediately surface bad copy on the live site.
5. **Visual brief asked for forbidden visuals + characteristic components together.** Defining the negative space made the visual direction much sharper than just listing colors and fonts.

## What the output reveals as gaps in the generator

### 1. Auto-generated "Context" summary betrays the brand voice it just defined

The Context section (line 3 of the export) reads like a corporate paragraph: "Ferced surge como un studio senior que integra arquitectura técnica seria, IA on-premise, proximidad founder-to-founder…"

This is exactly the kind of language the Voice rules in the SAME kit explicitly forbid. The summarizer that builds Context is not consuming the Voice constraints from later milestones.

**Fix idea:** either (a) re-summarize Context after M6 with the voice rules injected as constraints, or (b) skip auto-Context entirely and let the founder paste the M1 narrative.

### 2. Bad-fit signals get dropped from final export

In M5, the founder fills both "Primary fit signals" and "Bad-fit signals". The exported markdown only includes Primary. Selling depends on disqualifying as much as qualifying — losing this in export is a real downgrade.

**Fix:** include a `### Anti-signals` block in the ICP export.

### 3. No price/engagement model in the kit

Multiple rules reference money without anchoring numbers:
- "Sin descuento por volumen ni tarifa amigo" (Proposals)
- "Si pide cotización en frío sin discovery pago, decimos que no" (Sales meeting)

But "discovery pago" is never defined (price, duration, deliverable). Without numbers, the rule can't be enforced when the founder is under cash pressure.

**Fix idea:** add a milestone or sub-prompt for "Engagement model": floor ticket, discovery pricing, billing cadence, what disqualifies from a fixed-fee.

### 4. Geography claims aren't pressure-tested

The kit lists "AR · LATAM · USA" in bios, signature, and visual rules — but the generator never asked for evidence per geo. For ferced specifically, USA is aspirational (no documented USA cases). The brand inflates without realizing it.

**Fix idea:** when a market list is entered, prompt for one piece of evidence per market (a customer, a referral channel, a distribution path). If no evidence, suggest dropping it from public-facing copy and keeping it internal as a target.

### 5. Voice locale isn't separated from voice character

The voice section locked in voseo argentino as a writing rule. That's correct for AR/LATAM but blocks the same kit from being usable for the USA market it claims. The generator never asked "do you need an English variant?".

**Fix idea:** if the kit declares more than one geographic market, prompt for whether voice rules apply across all markets or need a per-locale variant.

### 6. Cases rule conflicts with current portfolio without flagging it

Rule: "Cada caso publicado tiene métrica antes/después verificable o queda fuera." The current ferced.com portfolio has zero quantitative metrics on most projects. So the rule, as written, would exclude the existing portfolio.

The generator should detect this kind of conflict between a new rule and the live state, and surface it as a transition action item.

**Fix idea:** at the end of the run, generate a "Migration to-do" — what existing surfaces (site, decks, social) violate the new kit and need to be updated.

### 7. The do/don't voice list mixes severity tiers

Don't-list mixes:
- truly forbidden ("Sinergias / valor agregado / aliado estratégico")
- with neutral-but-overused ("Soluciones a medida")
- with debatable ("Boutique tecnológica" is fine for some studios)

Treating them at the same severity weakens the rule.

**Fix idea:** ask for "never" vs "avoid unless qualified" tiers in M6.

### 8. Templates not stress-tested against own writing rules

The cold outreach body in M7 is ~110 words and includes sentences that exceed the 18-word limit set in M6 writing rules. The generator didn't lint the templates against the rules it just produced.

**Fix idea:** after M7, run a self-check pass: each template scored against M6 writing rules; flag violations for the founder to fix.

### 9. Visual section doesn't define a "permitted" list, only forbidden

Forbidden visuals are exhaustive (12+ items). Permitted visuals are implicit. A new designer can guess wrong even with the negatives defined.

**Fix idea:** require both — the negative list AND a positive list (e.g. dashboards, terminal blocks, sparklines, schematic line art, hex maps).

### 10. No spacing/motion system

Visual brief covers palette, type, components, logo — but skips:
- spacing scale (8/16/24 etc.)
- motion philosophy (only one motion item: status dot pulse)
- component states (hover/focus/active/disabled)

**Fix idea:** add these three as required sub-fields in M8.

### 11. No project-detail-page guidance

The kit defines homepage hero, social bios, signature, etc. But for a studio whose main credibility surface is *case studies*, there's no template for what a case-study page looks like (sections, length, evidence pattern, screenshot rules).

**Fix idea:** add a sub-template in M7 for the brand's primary credibility surface (cases for a studio, demos for SaaS, talks for a consultant).

---

## Strategic-level observation about the generator's framing

The kit committed to ICP B (regulated/serious software with on-premise IA) as the lead, with ICP A (operational PyMEs) as secondary. This is correct positioning for ferced going forward — but the live portfolio is ~80% ICP A.

The generator never surfaced this gap between **stated ICP** and **portfolio evidence**. It would be a high-value addition: at the end of the run, the generator could ask "list your last N cases, classify each by ICP, and tell me what % of pipeline matches the new primary ICP." If the answer is <30%, flag it as a 6-month execution risk.

This kind of pipeline-vs-positioning check would convert the kit from a static document into a leading indicator.

---

## Top 3 fixes ranked by impact

1. **Self-lint pass** — score generator outputs (Context summary, templates) against the voice/writing rules they themselves produced. This single change would fix gaps #1 and #8.
2. **Engagement model milestone** — money rules without numbers don't survive contact with cash pressure. Adding a structured engagement-model section (floor, discovery, billing) closes gap #3.
3. **Migration to-do at the end of the run** — auto-detect where the current live surfaces violate the new kit. Closes #6 and turns the kit into an action plan, not just a definition.

---

## Notes for the next Claude session

- The kit itself is good and usable as-is for ferced. These are improvements to the generator, not the kit.
- The quality of the kit was much higher because we manually shaped each milestone with strong context (analyzed ferced.com first, debated ICP, picked anchors). A founder running the generator solo with no help would get a noticeably weaker output. Worth thinking about what minimum context the generator needs to extract from the founder before M1 to raise the floor.
- The "Already operating" mode worked well; "From scratch" probably needs a different flow since several milestones (anti-positioning costs, ICP signals, case-study rules) assume the founder already has lived examples.
