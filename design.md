# Disney Family Trip Planner - Style Reference
> Whimsical Park Sticker Bomb

**Theme:** light

The Disney Family Trip Planner design system adapts the playful "sticker bomb"
reference into a family-trip planning interface. It should feel like a cheerful
park map covered in ticket stubs, route labels, fireworks bursts, and planning
notes, while still helping parents make practical decisions about booking,
spending, waits, and energy.

This is not an official Disney brand system. Avoid official character art,
logos, proprietary lockups, and lookalike iconography unless licensed. The
visual language should be "theme-park planning notebook", not brand imitation.

## Design Thesis

Make Disney planning feel less like homework.

The interface should:

- make hard decisions feel approachable
- show confidence without sounding corporate
- use playful surfaces for proof, samples, and prompts
- keep forms legible and trustworthy
- reserve the highest visual energy for actions that move a family toward a
  custom plan

## Tokens - Colors

| Name | Value | Token | Role |
|------|-------|-------|------|
| Magic Map Cream | `#fff0d4` | `--color-magic-map-cream` | Main page background, warm park-map canvas |
| Ticket White | `#ffffff` | `--color-ticket-white` | Cards, speech bubbles, form surfaces |
| Ink Black | `#101010` | `--color-ink-black` | Primary text and strong outlines |
| Castle Indigo | `#3327a8` | `--color-castle-indigo` | High-contrast headings, route strokes, night-show accents |
| Firework Red | `#ff4f3e` | `--color-firework-red` | Urgent tags, validation pilot labels, emotional accents |
| Churro Gold | `#ffd43b` | `--color-churro-gold` | Highlight cards, hover states, sunny callouts |
| Parade Green | `#28b84a` | `--color-parade-green` | Success states, kid-energy stickers, fresh accent cards |
| Lagoon Teal | `#16b7c8` | `--color-lagoon-teal` | Secondary cards, links, transportation/route accents |
| Dole Whip Purple | `#8a53ff` | `--color-dole-whip-purple` | Feature sections and sticker accents |
| Monorail Gray | `#666666` | `--color-monorail-gray` | Secondary text |
| Queue Rail Gray | `#dddddd` | `--color-queue-rail-gray` | Subtle borders, muted buttons |
| Form Ink | `#101010` | `--color-form-ink` | Input text and borders |

## Tokens - Typography

### Primary Typeface

Use one expressive, rounded display-friendly family across the site. If a
custom font is unavailable, use the existing Google font stack with a playful
fallback.

```css
--font-park: "Lato", "Comic Sans MS", "Trebuchet MS", ui-sans-serif, system-ui, sans-serif;
```

Use one font family, but vary weight, size, casing, and sticker-like placement.
The tone should feel handwritten enough to be friendly, but not so childish
that parents distrust the planning advice.

### Type Scale

| Role | Size | Line Height | Token |
|------|------|-------------|-------|
| body-sm | 16px | 1.65 | `--text-body-sm` |
| body | 20px | 1.45 | `--text-body` |
| subheading | 28px | 1.25 | `--text-subheading` |
| heading-sm | 36px | 1.15 | `--text-heading-sm` |
| heading | 48px | 1.08 | `--text-heading` |
| heading-lg | 72px | 1.00 | `--text-heading-lg` |
| display | 112px | 0.92 | `--text-display` |

Do not use viewport-width font sizing. On mobile, step down to fixed smaller
tokens rather than scaling continuously.

## Tokens - Spacing and Shapes

**Base unit:** 6px

| Name | Value | Token |
|------|-------|-------|
| 12 | 12px | `--spacing-12` |
| 24 | 24px | `--spacing-24` |
| 30 | 30px | `--spacing-30` |
| 60 | 60px | `--spacing-60` |
| 108 | 108px | `--spacing-108` |

### Border Radius

| Element | Value |
|---------|-------|
| cards | 15px |
| buttons | 6px |
| sticker pills | 999px |
| speech bubbles | 144px |
| circular stickers | 100% |

### Shadows and Outlines

Avoid conventional drop shadows. Define surfaces with color, borders, slight
rotation, and bold outlines.

| Name | Value | Token |
|------|-------|-------|
| sticker-outline | `#101010 0 0 0 2px` | `--shadow-sticker-outline` |
| gold-pop | `#ffd43b 0 0 0 3px` | `--shadow-gold-pop` |
| white-pop | `#ffffff 0 0 0 4px` | `--shadow-white-pop` |

## Components

### Map Canvas

Warm full-page background using Magic Map Cream. Add subtle flat motifs only
when they do not reduce readability:

- dashed route lines
- small starbursts
- ticket perforation dots
- abstract castle pennants
- map label blocks

Avoid photographic backgrounds and complex scenery for the main UI.

### Sticker Hero

Role: first impression and offer framing.

Use an oversized, black, compact headline on the cream canvas. Surround it with
2-4 sticker elements:

- pilot slot sticker
- "wait less" route label
- "spend smarter" ticket stub
- "protect kid energy" speech bubble

The primary CTA should be a high-contrast ticket-style button, not a generic
blue button.

### Ticket Button

Role: primary action.

Use Ticket White or Churro Gold background, Ink Black text, 2px Ink Black
outline, 6px radius, and a small pressed transform. Optional perforation dots
can appear as pseudo-elements on wider buttons.

### Ghost Button

Role: secondary navigation.

Transparent background, Ink Black text, 2px Ink Black border, 6px radius. Use
sparingly for secondary links like sample plan or search library.

### Speech Bubble Card

Role: proof, tips, and plain-language explanation.

Ticket White background, Ink Black text, exaggerated 144px radius, generous
horizontal padding. Best for short copy, not dense forms.

### Colorful Sticker Card

Role: highlight one planning decision.

Use one vivid fill: Dole Whip Purple, Firework Red, Churro Gold, Parade Green,
or Lagoon Teal. Keep text high contrast. Slight rotation is allowed, but never
rotate form fields or dense text.

### Sample Plan Sheet

Role: show what the buyer receives.

Use a white ticket/paper surface with black outline and small colored section
labels:

- What to book
- What to buy or skip
- Park rhythm
- Backup plan

This section should feel playful, but the content must read as concrete and
practical.

### Planning Intake Form

Role: collect private trip details.

Keep the form calmer than the hero:

- Ticket White surface
- Ink Black labels
- 2px black or Form Ink borders
- Churro Gold focus outline
- clear success and error states

Do not make inputs irregular, tilted, or overly decorative.

### Validation Label

Role: communicate manual pilot status.

Use Firework Red background with Ticket White text, 15px radius, uppercase
compact label. Example: `Pilot: 5 custom family plans`.

## Layout

The page should feel sticker-bombed, but not chaotic.

- Hero: centered oversized headline with overlapping stickers.
- Sample plan: paper/ticket surface, full-width within content container.
- Intake: two-column desktop layout, single-column mobile.
- Search library: visually secondary to the planning offer.
- Footer: simple text links, no heavy decoration.

Use asymmetry in decorative elements, not in core reading paths.

## Imagery and Motifs

Use flat graphics and typographic motifs:

- ticket stubs
- route lines
- stars/fireworks
- castle silhouettes
- park map labels
- monorail-style stripes
- snack-inspired color names

Avoid:

- official character likenesses
- official park logos
- Mickey-head silhouettes as a brand mark
- dark, blurred, stock-like photos
- realistic castle photography as a background

## Do's and Don'ts

### Do

- Use Magic Map Cream as the primary page background.
- Use vivid sticker accents to make planning feel less intimidating.
- Keep the paid planning CTA visually obvious.
- Use black outlines instead of heavy shadows.
- Let sample outputs look like a useful paper plan.
- Keep forms calm, legible, and trustworthy.
- Use the five product pain points as visual/content anchors:
  - wait less
  - book the right things
  - spend smarter
  - protect energy
  - plan for your group

### Don't

- Do not imitate official Disney branding or characters.
- Do not make the site look like a generic SaaS landing page.
- Do not bury the paid planning offer below the search library.
- Do not use dark blue/slate as the dominant theme.
- Do not use one-note beige without saturated accents.
- Do not rotate or distort form fields.
- Do not add decorative motion to typing, searching, or submitting.
- Do not rely on compliments or newsletter signups as validation proof.

## Implementation Notes for This Repo

The current homepage already has the correct product order:

1. paid planning pilot
2. sample plan proof
3. intake form
4. searchable tips library

The Disney sticker-bomb skin should primarily update:

- `src/styles.css` color tokens and component surfaces
- `index.html` decorative labels or copy only where needed
- tests only when they assert visible contract changes

Homepage copy should stay terse. Use short labels and one-line explanations;
avoid long paragraphs, duplicate CTAs, or newsletter blocks above the paid
planning offer.

Do not change:

- `POST /api/planning-request`
- `data/private/` storage behavior
- pilot ledger commands
- validation definition of 5 paid or decision-solved families

## Quick Start CSS Tokens

```css
:root {
  --color-magic-map-cream: #fff0d4;
  --color-ticket-white: #ffffff;
  --color-ink-black: #101010;
  --color-castle-indigo: #3327a8;
  --color-firework-red: #ff4f3e;
  --color-churro-gold: #ffd43b;
  --color-parade-green: #28b84a;
  --color-lagoon-teal: #16b7c8;
  --color-dole-whip-purple: #8a53ff;
  --color-monorail-gray: #666666;
  --color-queue-rail-gray: #dddddd;
  --color-form-ink: #101010;

  --font-park: "Lato", "Comic Sans MS", "Trebuchet MS", ui-sans-serif, system-ui, sans-serif;

  --text-body-sm: 16px;
  --leading-body-sm: 1.65;
  --text-body: 20px;
  --leading-body: 1.45;
  --text-subheading: 28px;
  --leading-subheading: 1.25;
  --text-heading-sm: 36px;
  --leading-heading-sm: 1.15;
  --text-heading: 48px;
  --leading-heading: 1.08;
  --text-heading-lg: 72px;
  --leading-heading-lg: 1;
  --text-display: 112px;
  --leading-display: 0.92;

  --spacing-unit: 6px;
  --spacing-12: 12px;
  --spacing-24: 24px;
  --spacing-30: 30px;
  --spacing-60: 60px;
  --spacing-108: 108px;

  --radius-buttons: 6px;
  --radius-cards: 15px;
  --radius-speechbubbles: 144px;
  --radius-sticker-pill: 999px;

  --shadow-sticker-outline: #101010 0 0 0 2px;
  --shadow-gold-pop: #ffd43b 0 0 0 3px;
  --shadow-white-pop: #ffffff 0 0 0 4px;
}
```
