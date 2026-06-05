> Diátaxis: explanation

# Disney product pain points to shape the repo around

This document explains the current best read on what Disney trip-planning
users are actually struggling with right now, and how that should shape the
product.

It is **not** a content taxonomy for the wiki itself and **not** a page-level
implementation spec. It is the higher-level product framing that should sit
above the wiki and guide how the homepage, navigation, search, and future
trip-planner outputs are organized.

## Executive thesis

The repo should not be shaped around **"tips"** as the primary product idea.

"Tips" is the **format** users consume.
The real product job is:

- help users avoid wasted time
- help users avoid wasted money
- help users avoid wasted energy
- reduce Disney-system confusion
- adapt advice to the exact travel party

A sharper product thesis is:

> Make Disney less confusing, less expensive, and less exhausting.

Or, more operationally:

> Help people know what to book, what to skip, and how to avoid the biggest
> Disney mistakes before the day falls apart.

## Research basis

This synthesis comes from two layers:

1. **Recent-signal research attempt via `last30days`**
   - The tool was partially degraded this cycle:
     - Reddit timed out repeatedly
     - X/Twitter was unavailable
     - YouTube search was bot-gated
   - So it did **not** produce a clean enough cross-platform signal set to be
     treated as the sole source of truth.

2. **Recent Disney corpus already in this repo**
   - I used the repo's own raw transcript layer as the stronger fallback.
   - I scanned the recent corpus from roughly the last 30 days and found
     **171 recent Disney-related source files** across channels like:
     - DFBGuide
     - AllEars.net
     - TheTimTracker
     - ResortTV1
     - FreshBaked
     - ProvostParkPass
     - PagingMrMorrow
     - MickeyViews
     - PixieDustedMom
   - I also read several representative recent transcripts directly,
     especially those explicitly focused on planning mistakes, confusion,
     rip-offs, and problem-solving.

That means the conclusions below are grounded primarily in the repo's own
recent source material, not generic assumptions about Disney.

## The key insight

People are usually **not** looking for more Disney facts.

They are looking for help with decisions like:

- What do I need to reserve, and when?
- Why is this system so confusing?
- How do I not waste half my day in bad lines?
- Which expensive thing is actually worth it?
- What changes if I'm traveling with kids / seniors / first-timers / low-patience adults?
- How do I keep the day from collapsing when it gets hot, crowded, wet, or chaotic?

That is the actual product territory.

## The five real pain points

## 1. Operational confusion

This is the strongest structural pain.

Users are confused by the Disney system itself:

- tickets vs linked admission vs scannable entry media
- who still needs park reservations and when
- what opens at 60 days and what does not
- app vs website vs phone booking flows
- hotel-perk differences
- what "on property" really means
- the difference between Multi Pass, Single Pass, and Premier Pass
- what counts as a reservation-worthy experience outside dining

This is not niche confusion. It is one of the central trip-planning problems.

### Representative recent signals

- `raw/AllEars.net/2026-03-22-the-confusing-things-no-one-explains-about-disney-world.md`
- `raw/DFBGuide/2026-03-18-what-first-time-disney-world-visitors-always-get-wrong.md`
- `raw/DFBGuide/2026-04-09-the-smart-way-to-do-disney-world.md`

### Product implication

The product should act like an **operational interpreter**, not just a tip
publisher.

Users need:

- what to do
- what to link
- what to book
- what window matters
- what applies to them specifically

### What this means in practice

The product should surface clear answer types like:

- "You still need X"
- "You do **not** need Y"
- "This only applies if you're staying at Z"
- "Book this 60 days out"
- "Use the website for this, not the app"

This is a major reason the wiki is still valuable: the wiki is the fact base
that makes these operational answers possible.

## 2. Time waste: lines, sequencing, and bad park-day decisions

This is the loudest emotional pain after confusion.

People hate discovering too late that they:

- rope-dropped the wrong thing
- arrived too late for Early Entry to matter
- got burned by Magic Kingdom transport friction
- followed crowds into bad standby choices
- failed to pivot when a ride went down
- used mobile order or Lightning Lane badly
- wasted their best low-wait window on filler

### Representative recent signals

- `raw/AllEars.net/2026-03-19-solving-4-major-disney-world-problems.md`
- `raw/AllEars.net/2026-03-20-the-best-way-to-start-your-day-in-magic-kingdom-early-entry.md`
- `raw/AllEars.net/2026-03-22-magic-kingdom-early-entry-experiment.md`
- `raw/DFBGuide/2026-04-06-50-disney-world-lightning-lane-tips.md`
- `raw/DFBGuide/2026-04-09-the-smart-way-to-do-disney-world.md`

### Product implication

The product should explicitly optimize for **time saved**, not just knowledge
acquired.

The homepage and top-level IA should say things like:

- wait less
- skip the wrong lines
- don’t waste rope drop
- know when to pivot
- get the right attraction at the right time

### What this means in practice

The most valuable artifacts here are:

- rope-drop strategies
- line-skip strategy explainers
- low-wait sequencing logic
- "if X breaks down, do Y" backup guidance
- park-specific opening / midday / evening patterns

## 3. Value anxiety and rip-off avoidance

Users are highly sensitive to bad spend.

This shows up in multiple forms:

- overpriced rooms with bad location or weak value
- overhyped restaurants
- expensive add-ons with weak ROI
- bad table placement or paid dining disappointment
- short park days / party-night gotchas
- weather ruining premium experiences
- emergency in-bubble purchases at huge markup
- premium convenience products that are not actually necessary

### Representative recent signals

- `raw/DFBGuide/2026-03-12-the-most-outrageous-disney-world-rip-offs.md`
- `raw/AllEars.net/2026-03-29-how-to-actually-make-disney-world-cheap.md`
- `raw/AllEars.net/2026-04-02-the-most-overhyped-disney-world-restaurants.md`
- `raw/ProvostParkPass/2026-04-02-breaking-news-disney-creates-shocking-new-ticket-offer.md`
- `raw/FreshBaked/2026-04-08-disney-likes-the-price-but-wants-more-value-state-of-disneyl.md`

### Product implication

A first-class **worth it / not worth it** layer is necessary.

The product should not only answer:

- what exists

It should also answer:

- should I pay for this?
- when is this worth it?
- when is this a trap?
- what is overhyped for the price?
- what is the smarter cheaper substitute?

### What this means in practice

The content model should support judgments like:

- worth it for
- not worth it for
- best value if
- only worth booking when
- skip unless
- overpriced compared with

That is much closer to how users actually think about Disney spending.

## 4. Energy management and meltdown prevention

This is one of the most important pains and one of the least respected by
classic travel content.

A Disney day often fails because of:

- heat
- humidity
- overstimulation
- crankiness from poor timing
- bad shoe choices
- dead phone batteries
- rain pivots
- too much walking
- bad stroller / nap / snack management
- trying to push through instead of stopping

This applies to adults just as much as kids.

### Representative recent signals

- `raw/DFBGuide/2026-03-18-what-first-time-disney-world-visitors-always-get-wrong.md`
- `raw/DFBGuide/2026-04-09-the-smart-way-to-do-disney-world.md`
- `raw/AllEars.net/2026-03-19-solving-4-major-disney-world-problems.md`
- `raw/PixieDustedMom/2026-03-16-tips-for-your-disney-world-resort-room-and-packing.md`
- `raw/AllEars.net/2026-03-30-i-must-go-wherever-the-bus-takes-me-in-disney-world-bus-chal.md`

### Product implication

The product should treat **energy** as a planning variable.

Not just:
- which rides are good

But also:
- when to stop
- when to leave the park
- how to recover a bad day
- how to prevent the midday crash
- how to plan for weather / feet / battery / stimulation / transportation fatigue

### What this means in practice

This suggests high-value guide types like:

- midday reset plans
- rain plans
- late-arrival / tired-group plans
- "don't force the fun" recovery strategies
- packing and battery essentials
- cool-down and indoor fallback routes

## 5. Party-specific planning

Generic advice is weaker than group-shaped advice.

Recent source framing repeatedly centers around:

- first-timers
- babies / toddlers
- kids with routines
- seniors and mobility limits
- low-patience travelers
- penny pinchers
- foodies
- sensory-sensitive travelers
- adults-only groups

### Representative recent signals

- `raw/DFBGuide/2026-04-09-the-smart-way-to-do-disney-world.md`
- `raw/DFBGuide/2026-03-18-what-first-time-disney-world-visitors-always-get-wrong.md`
- `raw/PagingMrMorrow/2026-03-30-disney-s-port-orleans-resort-2026-full-tour-new-rooms-is-it.md`
- `raw/PixieDustedMom/...` spring-break, packing, stroller/family prep coverage

### Product implication

The product should not only be organized by:

- parks
- dining
- hotels
- transportation

It should also support:

- planning for this kind of group

### What this means in practice

The system should be able to answer questions like:

- What is the smart way to do Disney with a stroller family?
- What should first-timers avoid overcomplicating?
- What should low-patience adults buy vs skip?
- What is the best setup for seniors or mobility-limited travelers?
- Which restaurants are safest bets for picky groups or food-first groups?

## The repo should be shaped around these pain points

## What the product should say

Instead of leading only with:

- Disney tips

The product should foreground outcomes like:

- wait less
- avoid expensive mistakes
- know what to book
- plan for your exact group
- recover when the day goes sideways
- know what changed before your trip

## What the product is really offering

Not generic inspiration.

It is offering:

- operational clarity
- decision support
- value filtering
- group-aware planning
- failure avoidance

That is a much stronger and more defensible product shape.

## Why the wiki is still correct

Yes — the wiki is still the right substrate.

The wiki is currently doing the right job:

- entity pages
- concept pages
- strategy pages
- synthesis pages
- source provenance

That is the **knowledge layer**.

This new pain-point framing is the **product layer** that sits above it.

In other words:

- the wiki should keep becoming a richer, more accurate Disney knowledge base
- the product should decide how to package and retrieve that knowledge around
  the real pains users have

So the answer is:

> the wiki is still correct;
> the product positioning above the wiki should get sharper.

We should not contort the wiki into homepage marketing language. We should use
its knowledge to power a better homepage and better retrieval paths.

## Recommended product architecture

## Top-level pain-point buckets

If the product needs clearer top-level navigation, the best current buckets are:

1. **Wait less**
   - Lightning Lane
   - rope drop
   - early entry
   - crowd timing
   - downtime pivots

2. **Book the right things**
   - 60-day windows
   - reservations beyond dining
   - hotel perk differences
   - app vs website workflows

3. **Spend smarter**
   - worth it / not worth it
   - overhyped vs reliable
   - hotel and dining value
   - hidden costs and traps

4. **Keep the day from falling apart**
   - heat
   - rain
   - batteries
   - feet
   - breaks
   - naps
   - overstimulation

5. **Plan for your group**
   - first-timers
   - families with kids
   - budget travelers
   - seniors
   - food-first travelers
   - low-patience adults

These buckets are much more aligned with user pain than a flat category set
like parks / dining / hotels / transportation alone.

## Recommended content model additions

The current tip schema is useful but can become significantly more valuable if
future extraction and retrieval also support pain-oriented fields.

### Suggested additional fields

- `painPoint`
  - `confusion`
  - `wait-time`
  - `budget`
  - `food-value`
  - `transport`
  - `energy`
  - `party-fit`

- `tripPhase`
  - `before-booking`
  - `60-days-out`
  - `arrival-day`
  - `park-open`
  - `midday`
  - `after-dark`
  - `bad-weather`

- `partyType`
  - `first-timer`
  - `budget`
  - `with-baby`
  - `with-kids`
  - `seniors`
  - `sensory`
  - `adults-only`
  - `foodie`
  - `low-patience`

- `decisionType`
  - `must-book`
  - `skip`
  - `worth-it`
  - `rope-drop`
  - `backup-plan`
  - `splurge`
  - `save-money`

These fields are not mandatory to add immediately, but they describe the
shape the system should probably grow toward if the goal is to answer real trip
planning pain rather than just browse "tips."

## What not to over-index on

The recent corpus strongly suggests that the product should **not** primarily
organize itself around:

- Disney trivia
- generic attraction facts with no planning consequence
- news-for-news sake
- vague inspiration content
- flat undifferentiated tip streams

Those things can still exist, but they should be subordinate to the main user
jobs.

## What to change now vs later

## Current homepage

The live homepage now starts with one natural-language Disney decision prompt.
The free preview pulls sourced snippets from the curated tips corpus, then asks
whether the user wants a $39 human-reviewed decision plan. Keep that shape
unless validation evidence says the paid form should move back in front of the
Ask experience.

## Keep doing

- keep homepage positioning away from generic "tips"
- present pain-oriented entry points prominently
- treat the tips corpus as the source layer behind decision previews
- ensure the top-value guides answer:
  - what to book
  - what to skip
  - how to save time
  - how to save money
  - how to recover a bad day
- keep the wiki growing as the content substrate

## Do later

- add pain-point-aware extraction/tagging
- personalize the experience by party type and trip phase
- generate tailored trip guidance that sounds like:
  - "for your group, skip this"
  - "for your dates, book this"
  - "for your energy level, do this instead"

## Working product statement

If one sentence needs to anchor the next stage of the repo, use this:

> This product helps Disney travelers avoid wasted time, wasted money, and
> wasted energy by turning confusing trip planning into clear decisions.

That statement is compatible with the current wiki, stronger than a generic
"tips" thesis, and broad enough to shape homepage copy, retrieval logic,
and future decision-plan outputs.
