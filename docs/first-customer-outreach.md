# First customer outreach for the Disney planning offer

> Diátaxis: how-to

This is the manual sales path for getting the first 5 validated family decision plans.
Do not start broad outreach until `npm run pilot -- readiness` says the pilot
is ready, or new form submissions may sit unnoticed.

## Validation goal

Get 5 families to either:

- pay for the $39 custom plan, or
- explicitly say the plan solved a real pre-trip decision.

Compliments, social likes, newsletter signups, and "this is cool" replies do
not count.

## Best first customer

Start with parents or family trip organizers who are already planning a Disney
trip in the next 2-12 months and feel one of these pains:

- confused about what needs booking and when
- worried about wasting money on the wrong add-ons
- unsure whether Lightning Lane or dining reservations are worth it
- planning around kids, naps, heat, sensory limits, or low patience
- afraid the park day will fall apart because the group is tired or overwhelmed

Avoid people who are only casually dreaming about a trip. They are useful for
feedback, but weak for payment validation.

## One-week target

- Make a list of 25 specific people or warm-intro paths.
- Send 10 personal messages.
- Have 5 real conversations.
- Get 3 intake submissions.
- Fulfill at least 1 paid or decision-solving plan.

## Outreach tracker

Keep pre-intake sales notes outside git, for example in:

```text
data/private/planning-outreach.csv
```

Suggested columns:

```csv
date,name,relationship,channel,status,next_step,pain,trip_window,price_signal,notes
```

Use these status values:

- `candidate` - might know a family or be planning a trip
- `messaged` - first personal message sent
- `conversation` - replied with a real planning situation
- `intake-sent` - form link sent after qualifying pain
- `submitted` - intake form received
- `paid` - paid for the launch-price plan
- `decision-solved` - explicitly said a decision was solved
- `declined` - rejected, wrong timing, or no meaningful pain

Use these price signals:

- `yes-39` - would pay $39
- `maybe-39` - interested but hesitated on price
- `no-39` - would not pay $39
- `not-asked` - price was not tested yet

Pre-intake conversations do not count toward validation, but they do explain
why the offer is or is not converting.

## Where to find the first 25

Use concentric circles before public posting:

1. People you know who have kids and have mentioned Disney, Orlando, Anaheim,
   spring break, summer travel, or a big family trip.
2. Friends who are Disney adults but organize trips for relatives.
3. Parents in school, sports, daycare, church, neighborhood, or family chats.
4. Coworkers or alumni with young families.
5. Travel agents, photographers, or local parents who regularly hear Disney
   planning questions and may know one family to refer.

Public Disney groups can help later, but only post where selling or research
requests are allowed. The first goal is conversation quality, not reach.

## Message 1: warm parent

```text
Hey [name] — quick Disney question. I’m testing a small $39 custom Disney
decision plan for families who are trying to figure out what to book, what to
skip, and where not to waste money.

If you’re still thinking about [trip / Disney / Orlando], I’d like to make you
a decision plan and see if it actually helps with the hard choices.
It costs about one Disney bubble wand. Useful or not relevant right now?
```

## Message 2: friend who knows parents

```text
Hey [name] — I’m looking for 5 families planning Disney in the next year.
I’m testing a $39 custom decision plan that answers what to book, what to skip, what to
pay for, and how to keep the day from collapsing with kids.

Do you know one parent who is in planning mode and would give blunt feedback?
```

## Message 3: travel-adjacent contact

```text
Hey [name] — I’m piloting a tiny Disney planning service for families who are
overwhelmed by reservations, Lightning Lane, dining, and kid-energy tradeoffs.

I’m not trying to replace travel agents. The output is a short decision plan:
book this, skip that, pay for this only if, and here’s the backup plan.

If a family asks you Disney planning questions, could I help one of them at the
$39 launch price and share what I learn?
```

## Conversation script

Use this before sending the intake link. The goal is to learn if the pain is
real enough to pay for.

1. When are you thinking of going?
2. Who is traveling?
3. What part of planning feels most annoying or risky right now?
4. What have you already tried?
5. What decision would feel valuable to have solved this week?
6. If I made a decision plan for your exact group for $39, would you want it?

If the answer to question 6 is no, ask what would need to be different. Do not
argue.

## Send the intake

Only send the link after there is a real planning pain:

```text
This sounds like a fit for the pilot. Here’s the intake:
https://disney.bound.tips/plan.html#planning-request

The plan is $39 while I’m validating it. I’ll use your decision, dates, party,
budget style, must-dos, and concerns to send a practical plan with what to book,
what to buy or skip, park rhythm, and backup moves.
```

## Follow-up after intake

```text
Got it. I’ll review this and send the first plan within 24 hours.

Before I write it, the decision I’m optimizing for is: [repeat their pain in
their words]. Correct?
```

If `PLAN_PAYMENT_URL` is not configured, send the payment link manually before
or after confirming the scope.

Track it:

```bash
npm run pilot -- event <request-id> payment-requested --note "Sent payment link"
```

## Follow-up after plan

```text
I sent the first-pass plan. Two questions:

1. Which decision is clearer now?
2. What still feels risky or unresolved?
```

If they paid:

```bash
npm run pilot -- event <request-id> paid --amount 39 --note "Paid via Stripe"
npm run pilot -- event <request-id> plan-sent --note "Sent first plan"
```

If they did not pay but explicitly say a decision was solved:

```bash
npm run pilot -- event <request-id> decision-solved --note "Solved [specific decision]"
```

## Rejection log

Every rejection should produce one note:

- wrong timing: no active trip
- wrong buyer: not the planner
- weak pain: just browsing
- price resistance: would not pay $39
- trust gap: needs examples or proof
- scope mismatch: wanted full travel agent booking
- channel issue: did not want to use a website form

Use:

```bash
npm run pilot -- event <request-id> declined --note "Reason"
```

If there is no request ID because they never submitted the form, keep the note
in your outreach tracker rather than the pilot ledger.

## Weekly review

At the end of each week, run:

```bash
npm run pilot -- summary
```

Keep going if:

- at least 20% of warm conversations submit the intake
- at least 3 families pay or say a real decision was solved
- the same pain shows up repeatedly

Change the offer if:

- parents like the idea but will not pay $29
- they want one narrow answer instead of a full plan
- they ask for done-with-you booking support
- the painful decision is mostly hotel, tickets, or dining rather than whole-day
  park rhythm

Stop building more product until the first 5 validations are logged.
