# Disney family planning launch offer

> Diátaxis: how-to

This is the manual validation path for repositioning the site from passive
tips into a web-first planning assistant.

Use `docs/first-customer-outreach.md` for the sales script and weekly outreach
cadence once this offer is operationally ready.

## Offer

- **Product**: custom family Disney trip plan
- **Launch price**: $39
- **Promise**: review the party, dates, hotel, budget style, must-dos, and
  concerns; reply with what to book, buy, skip, and where to build in breaks
- **Goal**: fulfill 5-10 plans before building a native iOS app

## Intake

The form on `plan.html#planning-request` posts to `POST /api/planning-request`.

Requests are appended to:

```text
data/private/planning-requests.jsonl
```

`data/private/` is git-ignored because it contains family trip details and
email addresses.

The directory must be writable by the repo user for local pilot commands:

```bash
test -w data/private
```

If Docker created it as root through the bind mount, repair ownership from the
running container:

```bash
docker exec web-disney chown 1000:1000 /app/data/private
```

Set these env vars for notification and payment flow:

```bash
RESEND_API_KEY=
PLAN_REQUEST_RECIPIENT=
RESEND_FROM_EMAIL=
PLAN_PAYMENT_URL=
```

If notification env vars are missing, requests are still stored locally, but
do not start outreach until `RESEND_API_KEY` and `PLAN_REQUEST_RECIPIENT` are
configured.
If `PLAN_PAYMENT_URL` is set, the form response includes a payment link after
the request is captured. Without it, the response uses manual follow-up.

## Tracking

Use the private pilot ledger command:

```bash
npm run pilot -- readiness
npm run pilot -- summary
npm run pilot -- list
npm run pilot -- template <request-id>
npm run pilot -- event <request-id> payment-requested --note "Sent payment link"
npm run pilot -- event <request-id> paid --amount 39 --note "Paid via Stripe"
npm run pilot -- event <request-id> plan-sent --note "Sent first plan"
npm run pilot -- event <request-id> decision-solved --note "Parent said LL decision is clear"
npm run pilot -- event <request-id> declined --note "No longer traveling"
```

Events are appended to:

```text
data/private/planning-pilot-events.jsonl
```

## Outreach readiness

Before asking for real requests, run:

```bash
npm run pilot -- readiness
```

Treat `Ready for outreach: no` as a launch blocker. At minimum, the live server
needs `RESEND_API_KEY` and `PLAN_REQUEST_RECIPIENT` so new requests do not sit
unnoticed in `data/private/planning-requests.jsonl`.

`PLAN_PAYMENT_URL` is optional because the pilot can still collect payment by
manual follow-up, but it should be set before broader outreach if you want the
form success state to send buyers directly to checkout.

## Live configuration

The live `web-disney` container loads environment variables from:

```text
/home/deploy/repos/web-disney/.env.local
```

Before outreach, add real values:

```bash
PLAN_REQUEST_RECIPIENT=you@example.com
RESEND_FROM_EMAIL="Disney Plans <plans@disney.bound.tips>"
PLAN_PAYMENT_URL=https://buy.stripe.com/...
```

Then restart only the Disney container so Compose reloads the env file:

```bash
cd /home/deploy/traefik
docker compose up -d --force-recreate web-disney
```

Verify the container sees the vars without printing secret values:

```bash
docker exec web-disney sh -lc 'for v in RESEND_API_KEY PLAN_REQUEST_RECIPIENT RESEND_FROM_EMAIL PLAN_PAYMENT_URL; do if [ -n "$(printenv "$v")" ]; then echo "$v=set"; else echo "$v=missing"; fi; done'
```

Finally run:

```bash
cd /home/deploy/repos/web-disney
npm run pilot -- readiness
npm run verify-live
```

## Manual fulfillment

1. Read the newest JSONL row.
2. Search the local tip library and wiki for the family's constraints.
3. Produce a short plan with:
   - what to book and when
   - what to buy, skip, or delay
   - park order and break rhythm
   - Lightning Lane / Single Pass / Premier Pass recommendation
   - dining and hotel tradeoffs
   - bad-weather, heat, nap, or sensory fallback
4. Send the plan by email and collect feedback.
5. Track whether the parent paid, asked for revisions, or declined.

## Validation bar

The pilot is working only if at least 5 families either pay or explicitly say
the plan solved a real pre-trip decision. Free compliments are not enough.
