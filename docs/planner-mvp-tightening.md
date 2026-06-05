# Disney decision desk MVP tightening brief

> Diátaxis: explanation

## Thesis

The site should not present as a tips archive with a small paid form attached. It should present as an Ask-first Disney decision desk for families who are overwhelmed by booking windows, Lightning Lane, dining, budget traps, transportation, heat, naps, and backup plans.

The tips corpus remains valuable, but it should be framed as the research engine behind the sourced preview and paid decision plan, not the product users are buying.

## URL/domain

The current `disney.bound.tips` URL is acceptable for validation but not ideal for trust.

What matters for the first 5-10 pilots:

- warm trust from the referrer matters more than domain polish
- a clear deliverable matters more than a perfect brand
- a working reply/payment loop matters more than the URL

What the URL hurts:

- `bound.tips` sounds like a tips database, not a planning service
- subdomain structure feels experimental
- buyers may not understand who is behind it

Recommendation:

- Keep `disney.bound.tips` for the immediate pilot if outreach is warm and personal.
- If doing public posts or ads, move to a stronger name/domain before scale.
- Possible positioning names: `Mouse Day Plan`, `Park Day Plan`, `Disney Decision Plan`, `Family Park Plan`, `Magic Trip Plan`.

## Value proposition

Current promise: know what to book, buy, and skip.

This is directionally right but not yet emotionally sharp enough. The compelling pain is not lack of tips. It is the fear of making expensive, irreversible, energy-destroying mistakes.

Sharper promise:

> Ask a Disney planning decision, see sourced research immediately, then get a short custom decision plan when the choice matters.

Supporting pains:

- avoid wasting money on the wrong add-ons
- avoid rope-dropping the wrong thing
- avoid overplanning a day kids cannot survive
- know what actually needs reserving
- get a backup plan for heat, rain, crowds, and meltdowns

## Offer shape

The MVP should sell a concrete deliverable, not access to advice.

### Launch offer

- Price: $39, framed as about the price of one Disney bubble wand
- Deliverable: one custom Disney decision plan
- Turnaround: first response within 24 hours
- Revision: one included revision or clarification pass
- Scope: planning recommendations only; no booking, no travel-agent services
- Validation cap: first 5 paid/validated families

### What the buyer receives

1. Trip snapshot
   - dates, destination, hotel, party, budget style, must-dos, constraints
2. Booking decisions
   - what to reserve and when
   - what is optional
   - what to skip
3. Park rhythm
   - morning / midday / evening plan
   - rest breaks and transit reality
4. Lightning Lane / paid add-on recommendation
   - buy, skip, or conditional recommendation
5. Dining recommendation
   - one or two high-fit options, plus what not to overpay for
6. Backup plan
   - heat, rain, ride closure, tired kids, overstimulation
7. Final checklist
   - actions to take this week

## How the plan is made

The site should explain the process in plain language:

1. You send trip basics.
2. We review your dates, party, hotel, budget, must-dos, and worries.
3. We cross-check against the Disney tips/research library and current planning rules.
4. You get a practical decision plan, not a generic itinerary.
5. You get one revision/clarification pass if something important changed.

Avoid claiming full automation until it exists. Say `human-reviewed` or `manually prepared during the pilot`.

## Email/delivery loop

A compelling MVP needs the operational loop to feel real:

- intake confirmation email to customer
- operator notification email to Ali
- payment link path
- plan delivery email
- revision/clarification email
- ledger event tracking

Cloudflare Email can be evaluated, but the current repo already uses Resend. Since Resend is already wired for this codebase, default to Resend for the MVP unless there is a specific deliverability/cost/admin reason to switch.

Required email templates:

1. Intake received / next step
2. Payment request / reserve plan
3. Plan delivery
4. One-revision prompt
5. Feedback / validation ask

## Page structure

The current single scroll feels flat because it has only one level of drama: hero, sample, form, tips. It needs a product narrative.

Recommended page flow:

1. Landing page: one clear bubble-wand value proposition, one paid-plan CTA, one tips-link escape hatch.
2. Landing proof: three short coverage points only - park order, spend choices, breaks/backups.
3. Plan page: concrete sample email-plan artifact, then intake form and scope.
4. Tips page: searchable research archive for people who want to dig deeper.
5. Keep FAQ, process, and caveats off the landing page unless a buyer needs them before checkout.

## Design direction

Avoid generic SaaS cards and avoid a long flat list.

Use a `planning desk` concept:

- itinerary sheet / field notes / park map / sticky notes
- ticket-stub CTA modules
- timeline blocks
- decision stamps: BOOK / SKIP / MAYBE / BACKUP
- sample plan as a mock delivered artifact, not four tiny cards

The site should feel like a competent human planner sat down with your family constraints and produced a usable field plan.

## Build priorities

### Must ship before outreach

- Configure notification recipient and sender.
- Confirm intake is captured and operator is notified.
- Make sample plan deeper.
- Add explanation of how plan is made.
- Add one included revision.
- Add FAQ and scope boundaries.

### Should ship before public posting

- Payment link in success flow.
- Customer confirmation email.
- Stronger domain/name decision.
- Plan template command or doc generator.
- Better page design with artifact-centered layout.

### Do not build yet

- full AI itinerary generator
- user accounts
- saved dashboards
- complex checkout system
- mobile app
- automated multi-revision chat

## Validation question

The core validation is not whether people like Disney tips. It is:

> Will a real Disney traveler pay $39 to have a competent human make the hard Disney decisions for their exact family?

Everything in the MVP should support answering that question quickly.
