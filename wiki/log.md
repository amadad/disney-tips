# Wiki Log

> Append-only record of wiki activity. Every ingest, query, and lint pass gets
> an entry. Entries start with a consistent header so they are greppable:
>
>     ## [YYYY-MM-DD] ingest|query|lint | short title
>
> Example: `grep "^## \[" log.md | tail -5` shows the last 5 events.

---

## [2026-04-11] bootstrap | wiki substrate created

Created `wiki/CLAUDE.md` (charter), `wiki/index.md` (empty catalog), and this
log. Raw source layer was backfilled from `data/pipeline/videos.json` into
`raw/<channel>/<YYYY-MM-DD>-<slug>.md` — 832 files across 13 channels.
No wiki pages exist yet. Next step: emergent ingest of the first several raw
sources to let structure develop.

## [2026-04-11] ingest | AllEars 7 New Must Know Tips For Disney World

Ingested `raw/AllEars.net/2026-04-10-7-new-must-know-tips-for-disney-world.md`
(AllEars.net, 2026-04-10). First conversational ingest of the wiki.

Created 10 new pages:

- `animal-kingdom.md` (park entity)
- `lightning-lane-multi-pass.md` (concept; also uses DFBGuide 2025-12 tier details)
- `buzz-lightyear-space-ranger-spin.md` (attraction entity)
- `bluey-world.md` (upcoming attraction entity)
- `cool-kids-summer.md` (seasonal event)
- `strategy-rope-drop-magic-kingdom.md` (strategy — first of this shape)
- `strategy-animal-kingdom-half-day.md` (strategy)
- `2026-disney-changes.md` (yearly synthesis page — first of this shape)
- `resort-perk-free-water-park.md` (concept/perk)
- `sources/2026-04-10-allears-7-tips.md` (source summary — first of this shape)

Plus `index.md` populated with the new catalog.

Four conventions added to `wiki/CLAUDE.md` based on decisions forced during
this ingest session:

1. Strategy content lives on `strategy-` prefixed pages, not buried inside
   entity pages.
2. Supersession of claims is handled inline in prose with parenthetical
   notes (e.g., `(firmed up from DFBGuide 2025-12)`). No separate history
   sections.
3. Time-bounded claims carry inline date annotations on entity pages, plus
   a single yearly synthesis page (`2026-disney-changes.md`).
4. Cross-source corroboration is not tracked explicitly in page bodies
   yet — citation count at page bottom is the only signal; lint may
   address later.

Notable partial use of `raw/DFBGuide/2025-12-03-the-ultimate-guide-to-magic-kingdom-in-2026.md`
— DFBGuide information was referenced on 3 pages (Lightning Lane tier
details, 2026 event calendar, Buzz closure corroboration) but DFBGuide
has not been formally ingested as its own primary source. Flagged in
`index.md` under "Pending full ingest" and in
`sources/2026-04-10-allears-7-tips.md` under "Referenced but not fully
ingested." The next ingest session should treat DFBGuide as the primary
source and refine these pages from its full content.

Open questions raised (for future ingests or lint):

- Exact reopening dates for Big Thunder Mountain Railroad and Buzz
  Lightyear.
- Hold-trigger vs. rapid-fire for rebuilt Buzz gameplay — contested
  within the source itself, single-source overall.
- Lightning Lane Multi Pass tier lists for EPCOT, Hollywood Studios,
  Animal Kingdom (only Magic Kingdom's is captured so far).
- Post-Bluey's World state of the Wildlife Express train.

## [2026-04-11] ingest | DFBGuide Ultimate Guide to Magic Kingdom in 2026

Ingested `raw/DFBGuide/2025-12-03-the-ultimate-guide-to-magic-kingdom-in-2026.md`
(DFBGuide, 2025-12-03). This was the second conversational ingest and
clears the partial-ingest debt from the AllEars session (DFBGuide had
been used as a corroborating source without being formally ingested).

Created 19 new pages:

- `magic-kingdom.md` (park hub — full MK overview, finally created)
- `tron-lightcycle-run.md`
- `seven-dwarfs-mine-train.md`
- `haunted-mansion.md`
- `tianas-bayou-adventure.md`
- `peter-pans-flight.md`
- `jungle-cruise.md`
- `pirates-of-the-caribbean.md`
- `cinderellas-royal-table.md`
- `be-our-guest.md`
- `crystal-palace.md`
- `skipper-canteen.md`
- `liberty-tree-tavern.md`
- `beacon-barrel.md`
- `happily-ever-after.md`
- `festival-of-fantasy.md`
- `disney-after-hours.md`
- `fireworks-dessert-parties.md`
- `sources/2025-12-03-dfbguide-ultimate-mk-guide.md`

Updated 3 existing pages:

- `lightning-lane-multi-pass.md` — expanded Single Pass section with
  Tron-over-Seven-Dwarfs strategic recommendation and post-sunset
  return-time guidance. Removed "not yet fully ingested" disclaimer
  from DFBGuide citation.
- `2026-disney-changes.md` — added Mickey's Not-So-Scary Halloween
  Party and Mickey's Very Merry Christmas Party seasonal entries.
  Castle repaint and Carousel of Progress entries already present.
- `buzz-lightyear-space-ranger-spin.md` — removed "not yet fully
  ingested" disclaimer from DFBGuide citation.

Plus `index.md` rewritten with the new catalog organized by category
(Parks, Attractions by park, Dining, Concepts and services,
Entertainment, Events, Strategy pages, Synthesis pages, Sources).

Chose the aggressive-page-count approach (option "a" in the ingest
discussion): 19 pages rather than 8–12, because DFBGuide is a
comprehensive park overview and the gist's 10–15-pages-per-source
guidance applies on the high side for dense sources. Many single-
source pages will thicken when future sources (e.g., AllEars park
videos, Tim Tracker news) corroborate.

DFBGuide's opinionated voice is preserved inline on dining pages
(be-our-guest "paying for atmosphere, not food") and is referenced
throughout the MK hub page as a named voice (e.g., "per DFBGuide,
Skipper Canteen is the pick for adventurous eaters"). Opinions are
attributed, not flattened.

Open questions raised (for future ingests or lint):

- Exact 2026 Disney After Hours event dates within the Jan 12 –
  Jul 27 window
- Pricing for 2026 Disney After Hours, Bibbidi Bobbidi Boutique,
  and the fireworks dessert parties
- Lightning Lane Premier Pass — mentioned by DFBGuide but content
  deferred to her external guide; needs another source to capture
- Tier lists for EPCOT, Hollywood Studios, Animal Kingdom Multi
  Pass (still MK-only)
- Cinderella Castle repaint schedule and Carousel of Progress Walt
  animatronic install date (still announced-but-undated)

## [2026-04-11] ingest | MickeyViews Hollywood Studios construction site 2026

Ingested `raw/MickeyViews/2026-04-09-disneys-hollywood-studios-is-a-construction-site-in-2026-wal.md`
(MickeyViews, 2026-04-09). Third conversational ingest of the wiki.
This source **opens Hollywood Studios as a new park in the wiki**
(previously unrepresented) and introduces **MickeyViews as a third
creator voice** — the Disney-news angle.

Created 5 new pages:

- `hollywood-studios.md` (park hub — new park opened)
- `rock-n-roller-coaster.md` (attraction under overlay)
- `walt-disney-studios-lot.md` (new area replacing Animation
  Courtyard)
- `millennium-falcon-smugglers-run.md` (attraction with May 22
  mission update)
- `monstropolis.md` (future 2027-2028 land)
- `sources/2026-04-09-mickeyviews-hs-construction.md` (source
  summary)

Updated `2026-disney-changes.md` with four new entries:

- Apr 29 2026 (Disneyland only) — Galaxy's Edge timeline expansion
  (noted WDW equivalent not announced)
- May 22 2026 — Millennium Falcon new mission
- Summer 2026 — Rock 'n' Roller Coaster Muppets overlay reopening
- Later 2026 — Walt Disney Studios lot opening
- Undated future — Monstropolis 2027-2028 entry

Plus `index.md` updated with the new Hollywood Studios section.

**No new conventions added to CLAUDE.md** — this ingest did not force
any pattern-level decisions. Ingested cleanly using the existing
conventions (strategy vs. entity split, inline supersession, time-bounded
claims on entity pages + synthesis page, citation-count corroboration).

**Page-count discipline**: 5 new pages vs. 19 for DFBGuide. Appropriate
because this source is a narrower news report, not a comprehensive
park overview. Several entities mentioned only in passing (Tower of
Terror, Slinky Dog Dash, Star Tours, Jedi Training Academy) were left
as mentions on the hollywood-studios.md hub page without spawning
their own files — waiting for a future source to corroborate before
promotion.

**Creator diversity**: MickeyViews brings a distinctly different angle
from DFBGuide and AllEars. Noted in the source summary under "Creator
note" but no `creators.md` page was created — deferred per canonical
charter's "defer infrastructure" principle. If a fourth creator with
yet another editorial angle lands, revisit.

Open questions raised:

- Firm opening dates for Walt Disney Studios lot and Rock 'n' Roller
  Coaster Muppets overlay
- Extent of Rock 'n' Roller Coaster interior scene changes
- Whether engineers will choose destinations in the new Millennium
  Falcon mission (rumored)
- Specific Monstropolis 2027 vs. 2028 target
- Whether WDW's Galaxy's Edge will eventually get Disneyland's
  timeline expansion and John Williams music
- Format of the Glob Theater (show? simulator? interactive?)

## [2026-04-11] ingest | PagingMrMorrow Port Orleans Resort 2026 full tour

Ingested `raw/PagingMrMorrow/2026-03-30-disney-s-port-orleans-resort-2026-full-tour-new-rooms-is-it.md`
(PagingMrMorrow, 2026-03-30). Fourth conversational ingest of the
wiki. This source **opens the Hotels category** — previously zero
resort coverage — and introduces **PagingMrMorrow as the fourth
creator voice** (hotel-and-resort specialist, first-person
experiential tone).

Created 2 new pages:

- `port-orleans-resort.md` (first hotel entity page)
- `sources/2026-03-30-pagingmrmorrow-port-orleans.md` (source
  summary)

Updated `index.md` with a new Hotels category section and Port
Orleans entry.

**First hotel page shape**: structured sections emerged naturally —
tier/price/location, sub-sections (Riverside/French Quarter), rooms,
amenities, dining, transportation, worth-it-for / not-worth-it-for.
Sets a soft template for future hotel pages without being formalized
in CLAUDE.md as a convention yet. If the next hotel ingest follows
the same shape, it becomes a pattern worth documenting.

**Page-count discipline**: 2 pages from one source. Narrower than
DFBGuide's 19 and MickeyViews's 5. Appropriate because this source
covers one specific resort in depth rather than a broad park area.
Resisted the urge to spawn Boatwright's and Riverside Mill as their
own dining pages — kept them as sections on the Port Orleans page
until a second source corroborates.

**No new conventions added to CLAUDE.md.** The four creators so far
have distinct angles (dining, tips, news, hotels) but the canonical
charter's defer-infrastructure rule still applies — attribution in
prose is sufficient without a creators.md page.

Open questions raised:

- Which other Port Orleans buildings are next for the Tiana room
  refresh, and on what timeline
- Current state of the "Royal princess" room category
- Comparative positioning against other moderate resorts (Coronado
  Springs, Caribbean Beach, Saratoga Springs) — no comparison
  available from this single source
- Port Orleans pricing variability by season — $270 is a single data
  point

## [2026-04-11] ingest | ProvostParkPass Animal Kingdom Is Ridiculous

Ingested `raw/ProvostParkPass/2026-04-08-animal-kingdom-is-ridiculous.md`
(ProvostParkPass, 2026-04-08). Fifth conversational ingest. First real
**corroboration of existing content** (Animal Kingdom coverage was
previously single-source from AllEars). Introduces **ProvostParkPass
as the fifth creator voice** (family-vlog / honest-review angle,
with a Getaway Today affiliate relationship noted in the source
summary for bias awareness).

Created 5 new pages:

- `zootopia-better-zoogether.md` — new Tree of Life show, soft-title
  pending corroboration, replaces "It's Tough to Be a Bug"
- `kilimanjaro-safaris.md` — AK headliner attraction with biology-
  narration format
- `satuli-canteen.md` — Pandora quick-service build-your-own bowl,
  creator's strong recommendation for beef over chicken
- `festival-of-the-lion-king.md` — stage show with explicit
  do-not-use-Lightning-Lane advice
- `pandora-world-of-avatar.md` — themed land with night experience
  note (winter months specifically)
- `sources/2026-04-08-provostparkpass-animal-kingdom.md` (source
  summary)

Updated `animal-kingdom.md` substantially — operating rides list
gained links to new entity pages, added Shows section, added Lands
section, added Dining section, added ProvostParkPass as second
source. Added `2026-disney-changes.md` entry for the Zootopia ↔
It's Tough to Be a Bug replacement. Updated `index.md` with four
new AK-category entries, one dining entry (Satu'li), and one
entertainment entry (Festival of the Lion King).

**New strategic pattern captured across pages**: **do not use
Lightning Lane Multi Pass on theater shows**. This pattern appeared
twice in this source (Festival of the Lion King and Zootopia show)
and is now documented on both pages. Could be promoted to its own
strategy page if a third source corroborates. For now, it lives as
guidance embedded in the two individual show pages.

**Corroboration worked cleanly**: AllEars's 5-ride framing of AK
held up — ProvostParkPass neither corrected nor extended the list,
but his family chose to treat AK as a full park day using LL Multi
Pass for two rides (Safaris + Everest) plus shows and dining. This
is compatible with AllEars's "AK is a half-day park" framing; the
difference is that ProvostParkPass's family had reduced expectations
going in and planned around them, whereas AllEars's critique was
aimed at guests who don't adjust expectations and end up frustrated.
Both views are compatible and both are now captured on the AK page.

**Soft title handling**: The Zootopia show's exact title is unclear
from the transcript ("the Zootopia show," "Better Zoot[ogether]",
"zoo zoo together day" phrasing). Page was filed as
`zootopia-better-zoogether.md` with a note in the body that the
title is soft and pending corroboration. If a future source uses a
different official title, the file will be renamed and links
updated. This is the first instance of soft-title-pending-
corroboration handling — could become a convention pattern but
hasn't been forced into CLAUDE.md yet.

Open questions raised:

- Exact official title of the Zootopia show
- Specific opening date of Zootopia and closing date of It's Tough
  to Be a Bug
- Nighttime Kilimanjaro Safari operating status in 2026
- Avatar expansion status at Disney California Adventure (delayed
  and "being rethought")
- Festival of the Lion King typical showtimes and seasonal variation

## [2026-04-11] ingest | TheTimTracker Magic Kingdom Update Day April 2026

Ingested `raw/TheTimTracker/2026-04-09-disneys-magic-kingdom-update-day-construction-progress-new-m.md`
(TheTimTracker, 2026-04-09). Sixth conversational ingest. First
**three-source supersession chain** completes: Big Thunder Mountain
Railroad's reopening date traveled from DFBGuide 2025-12 "sometime in
2026, no date" → AllEars 2026-04 "about to reopen" → TheTimTracker
2026-04-09 announcing the firm date **May 3, 2026** live during
filming. Introduces TheTimTracker as sixth creator voice.

Created 1 new page:

- `big-thunder-mountain-railroad.md` — promoted from mention-only to
  full entity page now that the attraction has a firm date and
  three-source coverage
- `sources/2026-04-09-timtracker-mk-update.md` — source summary

Updated 5 existing pages with corroborating and firming content:

- `buzz-lightyear-space-ranger-spin.md` — reframed as operational
  (previously "reopening in 2026"); **resolved the hold-trigger vs
  rapid-fire disagreement** using TheTimTracker's audio-cue
  refinement: hold the trigger AND time aim to the blaster's firing
  sound, two-handed stabilization, tunnel scene as high-scoring zone.
  This is the first time a genuine creator-level disagreement was
  resolved in the wiki by adding a third perspective.
- `2026-disney-changes.md` — Big Thunder May 3 firm date, Buzz
  officially reopened entry, Cinderella Castle repaint marked as
  actively in progress
- `magic-kingdom.md` — Buzz moved to "recently reopened" category,
  Big Thunder date firmed, Pinocchio Village House added to
  quick-service sleeper picks, travel-time-from-parking note added
- `strategy-rope-drop-magic-kingdom.md` — Big Thunder section updated
  with firm date
- `index.md` — Big Thunder added, Buzz entry reframed, TheTimTracker
  source added

**Notable discrepancy surfaced**: DFBGuide 2025-12 claimed the
Cinderella Castle repaint target color was "original blue-and-white,"
but TheTimTracker 2026-04 describes the repainted side as gray,
"back to before the 50th celebration." Flagged on the
2026-disney-changes page as a discrepancy needing a third source.
This is the first real factual contradiction between sources in the
wiki. It's small (a color description), but the supersession
convention handled it cleanly — inline note mentions both framings
and flags the open question.

**No new conventions added to CLAUDE.md.** Everything handled by
existing conventions (supersession in prose, inline dates, citation
count).

Open questions raised:

- Castle repaint target color (blue-and-white per DFBGuide vs gray
  per TheTimTracker)
- Whether Big Thunder will actually be Tier 1 on reopening (expected)
- Whether Big Thunder adds the Disneyland dynamite scene
- Why Monsters Inc Laugh Floor had unusually long lines 2026-04-08
- Exact Pinocchio Village House pricing (transcript had a clear typo)

## [2026-04-11] ingest | DisneyInDetail Top 10 Magic Kingdom Rides

Ingested `raw/DisneyInDetail/2026-04-06-top-10-magic-kingdom-rides-attractions-experiences-walt-disn.md`
(DisneyInDetail, 2026-04-06). Seventh conversational ingest. Short
source (~8K chars). Primarily a **corroboration ingest** that
stress-tested 7 existing MK attraction pages under a third creator
voice — all held up cleanly with no contradictions. Introduces
DisneyInDetail as the seventh creator voice.

No new pages created. Updated 9 existing pages with dated factoids
and practical observations:

- `big-thunder-mountain-railroad.md` — added corroborating citation
- `jungle-cruise.md` — opening day attraction factoid, skipper
  variability note
- `pirates-of-the-caribbean.md` — films-based-on-ride, Captain Jack
  2006 addition
- `haunted-mansion.md` — opening day attraction, family-friendly
  framing, repeat-ride detail
- `tianas-bayou-adventure.md` — 2024 opening, Splash Mountain
  heritage, cold-day 5-min wait observation, big-drop framing
- `tron-lightcycle-run.md` — 2023 opening, lockering requirement,
  accessible seats, no inversions
- `seven-dwarfs-mine-train.md` — 2014 opening, 38" height req,
  end-of-night alternative timing
- `festival-of-fantasy.md` — 3 PM typical showtime, Disney Starlight
  parade showtime and seasonal reduction details
- `happily-ever-after.md` — Contemporary / Bay Lake Tower bridge
  viewing spot, party-night fireworks suppression

Plus source summary at
`sources/2026-04-06-disneyindetail-top10-mk.md` and index.md update.

**Key observation**: this was the first ingest where almost nothing
forced a page-creation decision. The source added depth to existing
pages and brought dated factoids (opening years, historical notes)
but did not cover any new entities in enough depth to warrant
promotion. This is evidence that the wiki is starting to benefit
from **corroboration dividend** — sources after the first 5 are
increasingly useful for thickening existing pages rather than
expanding the entity count. Expected pattern as the wiki matures.

**No new conventions added to CLAUDE.md.** All updates used
existing conventions (inline attribution in prose, citation count
for corroboration, no frontmatter, no structural changes).

Open questions raised:

- Exact Space Mountain Christmas overlay dates (MVMCP-only per
  DisneyInDetail, but party-night schedules vary year to year)
- Specific 2024 Tiana's opening date / Splash Mountain final
  operation date
- Seven Dwarfs Mine Train ride duration

## [2026-04-11] ingest | DFBGuide Answering ALL Your Questions About EPCOT

Ingested `raw/DFBGuide/2026-02-11-answering-all-your-questions-about-epcot.md`
(DFBGuide, 2026-02-11). Eighth conversational ingest. This source
**opens EPCOT as a full park in the wiki** and clears one of the oldest
open questions from the earliest sessions: the **EPCOT Lightning Lane
Multi Pass tier list**.

Created 10 new pages:

- `epcot.md` (park hub)
- `guardians-of-the-galaxy-cosmic-rewind.md`
- `mission-space.md`
- `frozen-ever-after.md`
- `remys-ratatouille-adventure.md`
- `test-track.md`
- `akershus-royal-banquet-hall.md`
- `garden-grill.md`
- `space-220.md`
- `sources/2026-02-11-dfbguide-epcot-questions.md`

Updated 3 existing pages:

- `lightning-lane-multi-pass.md` — added EPCOT Tier 1 list (Frozen,
  Remy, Test Track), Cosmic Rewind Single Pass coverage, and the
  judgment that Multi Pass is often less necessary at EPCOT than at MK
  / HS
- `2026-disney-changes.md` — added Frozen's expected February reopen
  note, Memorial Day Soarin' Across America temporary swap, corrected
  Springtime Surprise date range to Apr 16–20, and refreshed the
  source list
- `index.md` — added EPCOT to Parks, five EPCOT attractions, three
  EPCOT dining pages, and the new source summary

**Page-count discipline**: broad but not maximal. This source was rich
enough to justify opening the park hub plus the core ride / dining pages,
but not rich enough to warrant separate pages yet for things like
Festivals, International Gateway, Kidcot, DuckTales, Regal Eagle,
Connections, or Le Cellier. Those stay embedded until a later source
corroborates or deepens them.

**Strategic pattern reinforced**: EPCOT is structurally different from the
other parks because the **front-entrance vs International Gateway choice**
changes the best opening move more than usual. Front entrance favors
Cosmic Rewind / Test Track; back entrance favors Remy and the France / UK
side of World Showcase. Captured on `epcot.md`, but **not yet promoted to
its own strategy page**.

**No new conventions added to CLAUDE.md.** Existing conventions handled
this ingest cleanly: time-bounded claims stayed inline, strategy content
remained embedded where not yet page-worthy, and source opinions stayed
attributed.

Open questions raised:

- Exact 2026 reopening date for Frozen Ever After after the animatronic
  face-upgrade closure
- Exact start / end dates and any closure window for Soarin' Across
  America in 2026
- Whether Test Track and Remy single-rider queues remain consistently
  worthwhile across all 2026 crowd conditions
- Current pricing specifics for EPCOT fireworks dining packages
  (Rose & Crown, Spice Road Table, GEO-82)
- Whether EPCOT's festivals deserve dedicated pages now, or should wait
  until the later DFBGuide all-festivals source is ingested

## [2026-04-11] ingest | DFBGuide Ultimate Guide to Disney Springs in 2026

Ingested `raw/DFBGuide/2025-12-11-the-ultimate-guide-to-disney-springs-in-2026.md`
(DFBGuide, 2025-12-11). Ninth conversational ingest. This source
**opens Disney Springs as a major non-park planning area in the wiki**
and expands the corpus beyond park-only planning into shopping-district,
non-park-day, rainy-day, and food-first strategy.

Created 10 new pages:

- `disney-springs.md` (district hub)
- `raglan-road.md`
- `homecomin.md`
- `morimoto-asia.md`
- `wine-bar-george.md`
- `jaleo.md`
- `gideons-bakehouse.md`
- `drawn-to-life.md`
- `aerophile.md`
- `sources/2025-12-11-dfbguide-disney-springs-guide.md`

Updated 2 existing pages:

- `2026-disney-changes.md` — added Lime Garage Jan 12–Mar 13 closure /
  Feb 11–17 partial reopening and Level 99's 2026 opening note
- `index.md` — added a new Districts / non-park area section,
  Disney Springs attraction and entertainment entries, five dining
  pages, and the new source summary

**Page-count discipline**: moderate-to-aggressive. This source was broad
and dense enough to justify a full Disney Springs hub plus the district's
most load-bearing dining / snack / entertainment pages, but not so broad
that every store or every trend deserved its own file. Many things remain
embedded in `disney-springs.md` until corroborated by future sources (Jock
Lindsay's Hangar Bar, Summer House on the Lake, Splitsville, Amorette's,
Basin, Co-op / Disney Drop Shop, etc.).

**Important structural result**: this ingest confirms that the wiki needs
coverage for **non-park destinations** because the trip-planning problem is
not only "which park / ride should I do?" Disney Springs can anchor an
arrival day, a budget day, a rainy-day recovery plan, or a full food-first
itinerary. That logic now lives on `disney-springs.md` without needing a
new convention in `CLAUDE.md`.

**No new conventions added to CLAUDE.md.** Existing patterns handled the
source well: entity pages for high-value destinations, time-bounded claims
on the 2026 synthesis page, and embedded strategy where a dedicated
strategy page is not yet earned.

Open questions raised:

- Exact 2026 opening date for Level 99
- Whether Jock Lindsay's Halloween overlay is now a true annual
  tradition or still effectively provisional after one run
- Which Disney Springs restaurants will participate in 2026 Orlando
  Magical Dining
- Whether Disney Drop Shop stays permanent or rotates away
- Which 2026 Flavors of Florida dishes will matter enough to promote
  into their own pages

## [2026-04-11] ingest | DFBGuide Answering ALL Your Questions About Disney's Animal Kingdom

Ingested `raw/DFBGuide/2026-03-17-answering-all-your-questions-about-disneys-animal-kingdom.md`
(DFBGuide, 2026-03-17). Tenth conversational ingest. This source deepens
Animal Kingdom by clarifying that the park's 2026 problem is **not simply
"there are only five rides"**; it is that AK has split into two very
different products — a weak rides-first full day and a still-viable
slower day built around animals, shows, characters, and dining.

Created 4 new pages:

- `tropical-americas.md`
- `tusker-house.md`
- `nomad-lounge.md`
- `sources/2026-03-17-dfbguide-animal-kingdom-questions.md`

Updated 8 existing pages:

- `animal-kingdom.md` — added construction-era nuance, transportation,
  park-specific rules, and stronger dining anchors
- `strategy-animal-kingdom-half-day.md` — clarified that the half-day
  strategy is for rides-first itineraries
- `pandora-world-of-avatar.md` — added seasonal / extended-evening-hours
  night strategy and Pandora snack corroboration
- `satuli-canteen.md` — added Disney Dining Plan value guidance
- `zootopia-better-zoogether.md` — added scare-factor specifics and
  second source on the title
- `bluey-world.md` — added Rafiki's Planet Watch uncertainty and
  Affection Section return note
- `2026-disney-changes.md` — added 2026-02-02 DinoLand final closure
  and expanded the Bluey-area shutdown entry
- `index.md` — added Tropical Americas, Tusker House, Nomad Lounge, and
  the new source summary

**Page-count discipline**: moderate. This source had enough density to
earn one future-land page and two dining pages, but not enough to justify
spinouts for Wilderness Explorers, Devine, Maharajah Jungle Trek,
Gorilla Falls, Finding Nemo, Yak & Yeti, Balloon Daycare, or Pandora
snack micro-pages.

**Strategic correction**: "Animal Kingdom is a half-day park" is now a
qualified claim, not an absolute one. It is accurate for rides-first
itineraries. It is less accurate for parties who actually want the park's
animal trails, live shows, rare characters, and slow-food / slow-pace
texture. That nuance is now captured both on the park hub and on the
existing AK half-day strategy page.

**No new conventions added to CLAUDE.md.** Existing conventions handled
this ingest cleanly: future-state land got a dedicated entity page, time-
bounded closures stayed on `2026-disney-changes.md`, and the strategy /
entity split remained intact.

Open questions raised:

- Exact official spelling of the Tropical Americas central village name
  ("Pueblo Espironza" in DFB transcription)
- Final guest-facing title of the Bluey area and future of Rafiki's
  Planet Watch overall
- Fate of the Wildlife Express train after Bluey's World opens
- Exact later-2027 opening timing for Tropical Americas
- Whether Tusker House and Nomad Lounge will gain enough future
  corroboration to justify deeper menu / booking-strategy detail

## [2026-04-11] ingest | DFBGuide EVERY Disney World Hotel in 2026

Ingested `raw/DFBGuide/2026-04-01-every-disney-world-hotel-in-2026.md`
(DFBGuide, 2026-04-01). Eleventh conversational ingest. This source
opens the wiki's **hotel layer** in a serious way and confirms that
hotel choice is one of the product's highest-value planning axes — not
just a lodging footnote.

Created 20 new pages:

- `disney-world-hotels.md`
- `all-star-resorts.md`
- `animal-kingdom-lodge.md`
- `art-of-animation-resort.md`
- `beach-club-resort.md`
- `boardwalk-inn.md`
- `caribbean-beach-resort.md`
- `contemporary-resort.md`
- `coronado-springs-resort.md`
- `grand-floridian-resort.md`
- `old-key-west-resort.md`
- `polynesian-village-resort.md`
- `pop-century-resort.md`
- `saratoga-springs-resort.md`
- `wilderness-lodge.md`
- `yacht-club-resort.md`
- `riviera-resort.md`
- `fort-wilderness-resort.md`
- `lakeshore-lodge.md`
- `sources/2026-04-01-dfbguide-every-disney-world-hotel.md`

Updated 3 existing pages:

- `port-orleans-resort.md` — added pool-hopping / fifth-sleeper
  corroboration and the hotel-guide source
- `index.md` — turned Hotels from a single-page category into a real
  hotel catalog with tier groupings and a future-hotel slot
- `2026-disney-changes.md` — added Yachtsman Steakhouse's May–August
  2026 closure window and Saratoga treehouse renovation timing

**Page-count discipline**: aggressive but justified. This source was too
broad and too central to product value to collapse into one giant hotel
summary. The hotel layer now has a proper hub plus entity pages for the
most load-bearing resorts. We still held the line against micro-pages for
restaurant venues, pool complexes, DVC sub-buildings, club level, and
other embedded hotel concepts.

**Structural result**: the wiki now treats hotels as a first-class
planning substrate alongside parks, attractions, dining, and services.
That is important because hotel choice determines transportation,
proximity, room fit, resort-day quality, and budget tradeoffs before the
first park reservation even matters.

**Deliberate grouping choice**: grouped the three All-Stars into one page
instead of forcing three thin source-summary pages. The distinctions that
mattered from this source were comparative (Music's family suites,
Movies's lockers, Sports's bus-loop advantage), so the grouped page was
higher-signal than three tiny hotel stubs.

**No new conventions added to CLAUDE.md.** Existing conventions handled
this ingest well: one hotel hub for the category, entity pages where the
source had enough specific planning value, and dated closures moved onto
`2026-disney-changes.md`.

Open questions raised:

- Whether the International Gateway hotel cluster eventually needs a
  synthesis page separate from the individual Beach / BoardWalk / Yacht
  pages
- Whether Gran Destino Tower deserves separation from Coronado Springs if
  future sources keep treating it as a quasi-separate hotel
- Which hotel dining venues should be promoted into their own pages first
  as resort-food sources accumulate
- How much detail Lakeshore Lodge deserves before Disney publishes a
  firmer opening timeline and room mix
- Whether hotel-comparison answers should become a formal `answers/`
  layer once enough user-query patterns repeat

## [2026-04-11] ingest | DFBGuide Biggest Hotel Changes Coming to Disney World in 2026

Ingested `raw/DFBGuide/2026-03-05-biggest-hotel-changes-coming-to-disney-world-in-2026.md`
(DFBGuide, 2026-03-05). Twelfth conversational ingest. This source did
**not** open many new entities; instead it tightened the hotel layer's
**operational state**: policy changes, construction windows, pool
closures, Cool Kids Summer hotel character meets, and the real trip
impact of ongoing refurbishments.

Created 1 new page:

- `sources/2026-03-05-dfbguide-hotel-changes.md`

Updated 15 existing pages:

- `disney-world-hotels.md` — added room-only cancellation timing,
  value-resort Southwest baggage flow, and moderate room-category shift
- `resort-perk-free-water-park.md` — added 2026 seasonal window and
  both-water-parks-open note
- `cool-kids-summer.md` — added resort-hotel character meets and
  early-entry character-meet value
- `grand-floridian-resort.md` — added tea-room reopening date and
  current 1900 Park Fair character lineup
- `polynesian-village-resort.md` — added 2026 construction warning,
  'Ohana fireworks-view obstruction, and operating changes for key bars /
  restaurants
- `all-star-resorts.md` — added All-Star Sports pool closure,
  pool-hopping exception, and value-resort baggage note
- `animal-kingdom-lodge.md` — added Kidani / Jambo refurbishment windows
- `boardwalk-inn.md` — added Jellyrolls / Big River closure context and
  2027 watchouts
- `fort-wilderness-resort.md` — added campsite occupancy reduction and
  Meadow pool-upgrade note
- `contemporary-resort.md` — added Bay Cove pool-area closure timing
- `port-orleans-resort.md` — added Riverside room-construction window
  through August 2027
- `yacht-club-resort.md` — added exterior-maintenance note shared with
  Beach Club
- `beach-club-resort.md` — added exterior-maintenance note through 2027
- `2026-disney-changes.md` — added Grand Floridian Tea Room reopening and
  the 2026 water-park-perk event window
- `index.md` — added the new source summary and kept the source list in
  chronological order

**Page-count discipline**: intentionally tight. This was a state-change
source, not an entity-opening source. The right move was mostly to update
existing pages and let the hotel layer compound rather than explode into
new micro-pages for policies, lounge moves, pool closures, and baggage
services.

**Structural result**: the wiki now has a meaningful distinction between
**hotel entities** and **hotel state**. A resort page tells you what the
hotel is. This kind of source tells you whether the hotel is currently
under construction, whether a pool is closed, whether a fireworks view is
obstructed, whether a perk is seasonal, and whether a cancellation rule
changed. Both layers matter to the trip-planner product.

**No new conventions added to CLAUDE.md.** Existing conventions handled
this cleanly: dated hotel changes landed either on the specific hotel page
or `2026-disney-changes.md`, while broader policy / perk changes landed on
existing concept pages.

Open questions raised:

- Whether room-only cancellation policy deserves a standalone concept
  page if more hotel-booking sources keep reinforcing it
- Whether the Southwest value-resort baggage flow should become a real
  service page instead of staying embedded in the hotel hub
- Which hotel construction items materially affect guest experience vs
  just create daytime visual noise
- Whether BoardWalk's 2027 warning signs justify starting a future-year
  synthesis layer once more 2027 state accumulates
- Whether Disney will keep the 2026 seasonal limit on the free water
  park perk or widen it again later

## [2026-04-11] ingest | DFBGuide 50 Disney World Lightning Lane Tips

Ingested `raw/DFBGuide/2026-04-06-50-disney-world-lightning-lane-tips.md`
(DFBGuide, 2026-04-06). Thirteenth conversational ingest. This source
shifts the Lightning Lane layer from mostly **reference** into genuine
**operating doctrine**: not just what the products are, but how to make
real-time tradeoffs under park pressure.

Created 6 new pages:

- `lightning-lane-premier-pass.md`
- `avatar-flight-of-passage.md`
- `star-wars-rise-of-the-resistance.md`
- `slinky-dog-dash.md`
- `strategy-lightning-lane-park-hop-epcot-hollywood-studios.md`
- `sources/2026-04-06-dfbguide-lightning-lane-tips.md`

Updated 5 existing pages:

- `lightning-lane-multi-pass.md` — expanded Single Pass to all four
  parks, added booking prep, park-hop logic, grace-period behavior,
  outage handling, and international-guest note
- `pandora-world-of-avatar.md` — corrected Flight of Passage into the
  Single Pass lane and linked the new attraction page
- `animal-kingdom.md` — linked Flight of Passage directly and refined AK's
  one-purchase paid-line-skip judgment
- `hollywood-studios.md` — linked Rise and Slinky and added the key
  judgment that broad Multi Pass coverage often beats a Rise-only
  Single Pass buy
- `index.md` — added the new attractions, concept page, strategy page,
  and source summary

**Page-count discipline**: moderate. This source earned one new concept
page, one strategy page, and several missing headliner attraction pages.
It did **not** earn separate pages for every Tier 2 ride, every stage-show
queue trick, app battery management, screenshots, Apple Watch scanning,
or every one-off overlap caution.

**Structural result**: the wiki's Lightning Lane layer now has three
useful retrieval shapes:

1. **concept** — `lightning-lane-multi-pass.md`,
   `lightning-lane-premier-pass.md`
2. **entity** — individual ride pages where the product tradeoff matters
3. **strategy** — a direct park-hop playbook for EPCOT + Hollywood
   Studios

That is closer to the actual product need: a trip planner does not just
need a definition of Multi Pass; it needs reusable tactics.

**Important correction**: prior wiki language on Pandora loosely implied
Flight of Passage belonged in the Multi Pass lane. This ingest corrected
that. Flight of Passage now lives as the park's most important
**Single Pass** call, while Na'vi River Journey remains the more natural
Multi Pass play.

**No new conventions added to CLAUDE.md.** Existing conventions handled
this ingest cleanly: product-reference mechanics stayed on concept pages,
park-specific tradeoffs opened attraction pages where useful, and the new
strategy content earned its own `strategy-` file.

Open questions raised:

- Whether Single Pass now deserves its own standalone concept page
- Whether Hollywood Studios has enough accumulated Lightning Lane signal
  to justify a dedicated strategy page beyond the EPCOT / HS park-hop move
- Which app-behavior quirks are real stable rules vs temporary current-
  system behavior Disney could silently change
- Whether international-guest Lightning Lane restrictions should evolve
  into their own travel-logistics page later
- Whether experience-redemption-pass behavior needs a second source
  before being treated as hard canon everywhere

## [2026-04-11] ingest | DFBGuide Disney World Is PACKED -- Here's What To Do

Ingested `raw/DFBGuide/2026-02-23-disney-world-is-packed-heres-what-to-do.md`
(DFBGuide, 2026-02-23). Fourteenth conversational ingest. This source is
important because it directly addresses one of the core product pain
points: **how to keep a Disney trip from feeling overwhelming when the
crowds are heavy**.

Created 3 new pages:

- `strategy-disney-world-crowd-avoidance.md`
- `fireworks-cruises.md`
- `sources/2026-02-23-dfbguide-packed-what-to-do.md`

Updated 6 existing pages:

- `epcot.md` — sharpened International Gateway as the less-crowded
  entrance and added calmer pre-11 World Showcase context
- `disney-world-hotels.md` — added a crowd-averse / serenity-seeking
  hotel bucket
- `resort-perk-free-water-park.md` — added rope-drop / night-before-
  arrival guidance for getting real value from the perk on packed dates
- `hollywood-studios.md` — added Galaxy's Edge crowd-shift timing and
  the BoardWalk walking-path escape after Fantasmic
- `fireworks-dessert-parties.md` — linked fireworks cruises as the more
  private premium alternative
- `index.md` — added the new strategy page, premium fireworks page, and
  source summary

**Page-count discipline**: moderate. This source was broad enough to earn
one cross-park strategy page and one discrete premium-experience page,
but not broad enough to justify micro-pages for quiet bathrooms, escape-
pod benches, Starbucks workarounds, or every individual side quest.

**Structural result**: the wiki now has a better answer to the question
"what do I do if Disney feels like too much?" That answer is no longer
just ride selection and Lightning Lanes. It now includes quieter hotel
choices, better entrances, crowd-pressure redirection, calmer backup
activities, and a genuinely lower-crowd fireworks splurge.

**No new conventions added to CLAUDE.md.** Existing conventions handled
this ingest cleanly: reusable tactics landed on a strategy page, the
fireworks experience got its own entity page, and park / hotel-specific
crowd facts were folded into existing hub pages.

Open questions raised:

- Whether the wiki eventually needs a dedicated comparison page for the
  quietest Disney hotels / least stressful stays
- Whether the "escape pod" pattern deserves a future synthesis page by
  park if more sources keep citing the same low-pressure spaces
- Whether fireworks cruises need a second source before expanding into
  pricing, booking timing, and marina-by-marina detail
- Which crowd-avoidance patterns will survive the opening of Tropical
  Americas, Level 99, and the Walt Disney Studios lot
- Whether crowd tolerance should become a first-class user input in the
  product instead of an inferred preference

## [2026-04-11] ingest | DFBGuide Things I Wish I Knew Before Booking My 2026 Disney World Trip

Ingested `raw/DFBGuide/2026-01-13-things-i-wish-i-knew-before-booking-my-2026-disney-world-tri.md`
(DFBGuide, 2026-01-13). Fifteenth conversational ingest. This source is
valuable because it moves the wiki **upstream**: not just how to operate
inside Disney, but how to choose the right trip before money is spent.

Created 3 new pages:

- `advanced-dining-reservations.md`
- `strategy-booking-a-disney-world-trip.md`
- `sources/2026-01-13-dfbguide-before-booking-2026-trip.md`

Updated 12 existing pages:

- `lightning-lane-multi-pass.md` — added app-update, ride-location, and
  refresh tactics
- `disney-world-hotels.md` — added hotel-perk-fit logic and peak-date
  booking pressure
- `resort-perk-free-water-park.md` — added the first-half-2026 seasonal-
  pass alternative
- `epcot.md` — added 2026 festival windows and opening-weekend crowd
  warning
- `rock-n-roller-coaster.md` — captured the Mar 1 end of the Aerosmith
  version
- `magic-kingdom.md` — corrected the RunDisney weekend list with exact
  Springtime Surprise and Wine & Dine dates
- `cinderellas-royal-table.md` — reinforced its property-wide ADR status
  and linked the new concept page
- `beacon-barrel.md` — elevated it from MK-only hot reservation to one
  of the harder ADRs property-wide
- `polynesian-village-resort.md` — named Wailulu explicitly and marked
  it as a hard current ADR
- `grand-floridian-resort.md` — added Tea Room reservation urgency after
  reopening
- `2026-disney-changes.md` — added dated festival windows, the Mar 1
  Rock 'n' Roller cutoff, and exact Wine & Dine dates
- `index.md` — added the new concept page, strategy page, and source
  summary

**Page-count discipline**: moderate. This source earned one reusable
concept page and one broad strategy page. It did **not** earn a page for
Disney discounts broadly, a page for every hard-to-get restaurant, a
Water Park Seasonal Pass page, or separate event pages for every crowd-
spike weekend.

**Structural result**: the wiki can now answer more of the questions that
actually drive booking decisions:

- what kind of Disney trip am I buying into?
- which dates are cheaper vs more crowded?
- when is a pricier hotel actually worth it?
- how do dining reservations really work?
- what do I need to lock in before arrival?

That is a meaningful product-direction improvement because the pain does
not start at rope drop. It starts at booking.

**No new conventions added to CLAUDE.md.** Existing conventions handled
this ingest cleanly: ADR mechanics earned a concept page, broader pre-
purchase decision logic earned a strategy page, and dated event windows
were folded into the yearly synthesis page instead of spawning micro-
pages.

Open questions raised:

- Whether ticket-pricing / ticket-buying now deserves its own concept
  page
- Whether Early Theme Park Entry has enough repeated signal to earn a
  standalone page
- Whether Extended Evening Hours should become its own concept page or
  stay distributed across hotel and event pages
- Whether Wailulu or Geo-82 should get entity pages once more sources
  pile up
- Whether the product should explicitly ask users whether they prefer
  cheapest dates, calmest dates, or the fullest version of the parks

## [2026-04-11] ingest | DFBGuide What First-Time Disney World Visitors Always Get Wrong

Ingested `raw/DFBGuide/2026-03-18-what-first-time-disney-world-visitors-always-get-wrong.md`
(DFBGuide, 2026-03-18). Sixteenth conversational ingest. This source is
important because it is about **operational mistakes**, not attraction
identity: the small wrong assumptions that quietly waste time, money,
and energy once a trip is already in motion.

Created 3 new pages:

- `early-theme-park-entry.md`
- `disney-transportation.md`
- `sources/2026-03-18-dfbguide-first-time-mistakes.md`

Updated 8 existing pages:

- `disney-world-hotels.md` — linked hotel-value logic to the new early-
  entry / transportation concept pages
- `disney-springs.md` — added resort-hopping rules and positioned
  Springs as a cleaner non-park-day transfer base
- `magic-kingdom.md` — sharpened the warning that driving to MK can burn
  much of Early Theme Park Entry
- `mission-space.md` — expanded motion-sickness survival guidance
- `guardians-of-the-galaxy-cosmic-rewind.md` — added eat-first / don't-
  stack-the-spinners caution
- `strategy-booking-a-disney-world-trip.md` — added hidden-cost buffer
  planning
- `index.md` — added the new concept pages and source summary
- `log.md` — appended ingest record

**Page-count discipline**: moderate. This source earned two concept pages
because both concepts had already accumulated repeated signal across the
corpus. It did **not** earn standalone pages for Mobile Order, shoes,
portable chargers, FuelRod, or hidden costs yet.

**Structural result**: one important open question from the prior ingest
is now answered. **Early Theme Park Entry has enough repeated signal to
be its own concept page.** Transportation also turned out to deserve a
standalone page because so many trip-planning mistakes come from guests
not understanding when Disney transport starts, stops, and changes modes.

That improves retrieval in a very product-relevant way. The wiki can now
answer:

- how early is "early enough" for Early Theme Park Entry?
- when does Disney transportation stop running?
- how should I handle resort hopping without getting turned away?
- when does Magic Kingdom driving actively work against me?
- what small operational mistakes can quietly wreck a good plan?

**No new conventions added to CLAUDE.md.** Existing conventions handled
this ingest cleanly: repeated cross-cutting behavior earned concept
pages, while ride-specific nausea and park-specific arrival penalties
were folded into existing entity pages.

Open questions raised:

- Whether Mobile Order has now accumulated enough recurring signal to
  earn its own concept page later
- Whether Extended Evening Hours should become its own standalone page
  now that hotel-value logic and transportation timing both keep
  pointing back to it
- Whether non-park-day / resort-hop planning should eventually become a
  dedicated strategy page rather than staying split across Springs,
  transportation, and hotel pages
- Whether hidden costs deserve a dedicated budgeting page once more
  sources pile up around value anxiety
- Whether motion-sickness risk should become a more explicit retrieval
  layer across attractions instead of living ride by ride

## [2026-04-11] ingest | AllEars The Confusing Things No One Explains About Disney World

Ingested `raw/AllEars.net/2026-03-22-the-confusing-things-no-one-explains-about-disney-world.md`
(AllEars.net, 2026-03-22). Seventeenth conversational ingest. This source
is useful because it converts several vague Disney planning ideas into
clear **system explanations**: what a ticket actually is, what the gate
can scan, which hotel layers really get which perks, and why "booking"
often means much more than dining.

Created 2 new pages:

- `disney-world-tickets-and-entry.md`
- `sources/2026-03-22-allears-confusing-things.md`

Updated 7 existing pages:

- `advanced-dining-reservations.md` — added off-property day-by-day
  booking and app / website / phone workflow guidance
- `lightning-lane-multi-pass.md` — tightened the 7-day eligibility rule
  and added a second source on the Lightning Lane loophole
- `early-theme-park-entry.md` — clarified which hotel layers actually
  receive the perk
- `disney-world-hotels.md` — added the Disney-owned vs Swan / Dolphin vs
  partner-hotel vs nearby-independent breakdown
- `strategy-booking-a-disney-world-trip.md` — added ticket setup / entry
  logic and broadened the reservation load beyond restaurants
- `index.md` — added the new ticket-entry concept page and source
  summary
- `log.md` — appended ingest record

**Page-count discipline**: light-to-moderate. This source earned one new
concept page because ticket-entry confusion is durable and likely to
recur. It did **not** earn pages for every Enchanting Extra, every ride
explainer, MagicBand itself, or a separate hotel-layers page.

**Structural result**: this ingest partially answers a prior open
question. The wiki still does **not** have a full ticket-pricing page,
but it now has a solid **ticket entry / setup** concept page. That means
"I bought tickets" and "we are actually ready to tap into the park" are
no longer treated like the same thing.

The ingest also sharpens the hotel's perk matrix in a way that matters to
real trip planning:

- Disney-owned hotels are not the same as all "on-property" hotels
- Early Theme Park Entry and 7-day Lightning Lane windows do not travel
  together across every hotel layer
- Swan / Dolphin / Swan Reserve sit in a genuine middle tier rather than
  being simply on-site or off-site

**No new conventions added to CLAUDE.md.** Existing conventions handled
this ingest cleanly: a durable cross-cutting confusion point earned one
concept page, while hotel-layer nuance and reservation-system nuance were
folded into existing hub / strategy / concept pages.

Open questions raised:

- Whether ticket **pricing / buying** still deserves its own standalone
  page apart from ticket **entry / setup**
- Whether Disney reservations beyond dining should eventually earn their
  own concept page
- Whether hotel-perk layers should stay inside the hotel hub or split out
  later
- Whether MagicMobile / MagicBand / ticket-card tradeoffs need deeper
  family-logistics coverage later
- Whether "first-timer confusion" should become a more explicit retrieval
  layer in the product

## [2026-04-11] ingest | DFBGuide The Most OUTRAGEOUS Disney World Rip-offs

Ingested `raw/DFBGuide/2026-03-12-the-most-outrageous-disney-world-rip-offs.md`
(DFBGuide, 2026-03-12). Eighteenth conversational ingest. This source is
important because it maps directly to the product's **value-anxiety**
pain point: the moments where Disney does not feel magical, it feels like
you paid premium prices for a version of the trip that underdelivers.

Created 3 new pages:

- `park-hopper-tickets.md`
- `strategy-disney-world-ripoff-avoidance.md`
- `sources/2026-03-12-dfbguide-ripoffs.md`

Updated 8 existing pages:

- `disney-world-hotels.md` — added the unequal-room warning and room-
  request logic at the hub level
- `disney-world-tickets-and-entry.md` — clarified that MagicBand+ is
  optional, not required
- `lightning-lane-multi-pass.md` — added the buy-early-or-don't-buy-it
  value warning
- `be-our-guest.md` — added the West Wing sensory-table caution
- `magic-kingdom.md` — clarified regular-admission early cutoff on party
  nights
- `hollywood-studios.md` — added the Jollywood-season shortened-day
  caution for regular guests
- `index.md` — added the new concept page, strategy page, and source
  summary
- `log.md` — appended ingest record

**Page-count discipline**: moderate. This source earned one reusable
concept page and one broad strategy page. It did **not** earn pages for
ponchos, MagicBand itself, holiday-party rain checks as a standalone
concept, Tony's table strategy, or individual emergency-shopping
services.

**Structural result**: the wiki now has a much clearer answer to the
question "what Disney purchases are likely to feel bad in hindsight?"
That answer is no longer scattered only across individual restaurant /
hotel pages. It now includes:

- hotel-room mismatch and room-request logic
- construction-hidden premium experiences
- shortened full-price park days
- weather-damaged party nights
- MagicBand and Park Hopper Plus upsell skepticism
- buying Lightning Lane too late to get real value

This is important because users often do not describe these as
"rip-offs" in intake. They describe them as feeling burned, cheated,
wasteful, or not worth it. The wiki can now retrieve for that emotional
shape more directly.

**No new conventions added to CLAUDE.md.** Existing conventions handled
this ingest cleanly: the durable product/add-on concept earned its own
page, while cross-cutting value-protection advice landed on a strategy
page and entity-specific cautions stayed on the affected pages.

Open questions raised:

- Whether value anxiety now deserves a deeper budgeting / bad-value hub
  rather than staying distributed across strategy + entity pages
- Whether Park Hopper and Park Hopper Plus will accumulate enough future
  signal to split apart into separate pages
- Whether Disney's seasonal-party weather / refund logic needs a more
  explicit page if more sources pile up
- Whether restaurant table-location advice should ever become a more
  formal retrieval layer
- Whether the product should explicitly ask users what kinds of bad value
  they hate most: money waste, time waste, walking waste, or stress

## [2026-04-11] ingest | AllEars Solving 4 MAJOR Disney World Problems

Ingested `raw/AllEars.net/2026-03-19-solving-4-major-disney-world-problems.md`
(AllEars.net, 2026-03-19). Nineteenth conversational ingest. This source
is useful because it turns abstract Disney advice into **worked park-day
pivots**: how to ride headliners without Lightning Lane, how to recover a
hot / hungry / cranky group, how to salvage a stormy hour, and how to get
value from a day that suddenly closes early.

Created 2 new pages:

- `mobile-order.md`
- `sources/2026-03-19-allears-solving-4-problems.md`

Updated 5 existing pages:

- `strategy-rope-drop-magic-kingdom.md` — added the first-two-hours
  no-Lightning-Lane framing and standby-downtime time-box guidance
- `strategy-disney-world-crowd-avoidance.md` — added water / snack /
  AC reset logic, indoor-show shelter use, and monorail-resort midday
  break guidance
- `magic-kingdom.md` — added Pecos Bill as an AC + mobile-order +
  free-water reset play and strengthened indoor-show shelter framing
- `index.md` — added the new Mobile Order concept page and source
  summary
- `log.md` — appended ingest record

**Page-count discipline**: light-to-moderate. This source earned one new
concept page because **Mobile Order now has enough repeated signal**
across the corpus to justify a standalone page. It did **not** earn
separate pages for free cups of water, kids meals, thunderstorms, or
midday monorail-resort breaks.

**Structural result**: one open question from the earlier first-timer
mistakes ingest is now answered. **Mobile Order has enough recurring
signal to be its own concept page.**

The wiki also now has a better answer to the question "what do I do when
my park day is going sideways right now?" The answer is no longer just
"buy Lightning Lane" or "go back to the hotel." It now includes:

- use the first two hours well if you skipped paid line-skipping
- time-box broken rides instead of drifting in dead queues
- fix hunger / thirst / heat before rewriting the whole itinerary
- use indoor shows as storm and overstimulation shelters
- leave and return later if midday is the real problem

**No new conventions added to CLAUDE.md.** Existing conventions handled
this ingest cleanly: the repeated app behavior earned a concept page,
while mood / weather / timing pivots were folded into existing strategy
and park hub pages.

Open questions raised:

- Whether energy-management / meltdown-prevention now deserves its own
  standalone strategy page
- Whether rainy-day / storm-day strategy should become a more explicit
  retrieval layer
- Whether experience redemption passes deserve their own page if more
  sources explain them
- Whether "best indoor reset spots" should become a cross-park synthesis
  page later
- Whether Mobile Order should eventually widen into a broader quick-
  service strategy page

## [2026-04-11] ingest | DFBGuide The Smart Way to Do Disney World

Ingested `raw/DFBGuide/2026-04-09-the-smart-way-to-do-disney-world.md`
(DFBGuide, 2026-04-09). Twentieth conversational ingest. This source is
broad, but the durable value is not random advice — it is that Disney
planning changes materially depending on **who is in the group**:
low-patience adults, stroller families, penny pinchers, foodies,
sensory-sensitive travelers, older adults, guests with special diets,
completionists, and people who hate being on their phones all day.

Created 2 new pages:

- `strategy-disney-world-travel-party-fit.md`
- `sources/2026-04-09-dfbguide-smart-way-to-do-disney-world.md`

Updated 5 existing pages:

- `strategy-booking-a-disney-world-trip.md` — added group-constraint
  planning and linked the new party-fit strategy page
- `advanced-dining-reservations.md` — added baby / toddler
  unpredictability as a real ADR-cancellation risk
- `disney-transportation.md` — added the Magic Kingdom ride-share vs
  Minnie Van TTC distinction
- `index.md` — added the new strategy page and source summary
- `log.md` — appended ingest record

**Page-count discipline**: light-to-moderate. This source earned one new
strategy page because **party-specific planning now has enough repeated
signal** to be directly retrievable from the wiki. It did **not** earn
separate pages yet for Baby Care Centers, stroller strategy, ECV rental,
Special Diets, or My Disney Experience as a standalone concept page.

**Structural result**: one of the product-layer pain points now has a
real wiki artifact. "Plan for your exact group" is no longer only a
product memo or an interpretation layer above the wiki — it now exists
as a dedicated strategy page the trip planner can read directly.

The wiki also now has a better answer to questions like:

- how should the trip change for low-patience adults?
- what should baby / toddler trips do differently?
- what is the smarter shape for mixed-budget groups?
- how should food-first or sensory-sensitive travelers change the plan?
- what should older adults, app-averse travelers, or completionists do
  differently?

**No new conventions added to CLAUDE.md.** Existing conventions handled
this ingest cleanly: the repeated cross-cutting behavior earned one
strategy page, while restaurant, hotel, ADR, and transport details stayed
on their existing concept / entity pages.

Open questions raised:

- Whether special diets / food allergies now deserve their own standalone
  concept page
- Whether My Disney Experience should become its own concept page as more
  app-friction guidance accumulates
- Whether Baby Care Centers or stroller-family logistics deserve a more
  dedicated family-planning page later
- Whether the wiki needs a stronger retrieval layer for sensory-intensity
  warnings across attractions and restaurants
- Whether older-adult / mobility planning should stay folded into party-
  fit strategy or split out later if more evidence accumulates

## [2026-04-11] ingest | AllEars How To Actually Make Disney World CHEAP

Ingested `raw/AllEars.net/2026-03-29-how-to-actually-make-disney-world-cheap.md`
(AllEars.net, 2026-03-29). Twenty-first conversational ingest. This
source is useful because it turns "cheap Disney" from generic advice into
an actual **trip-structure strategy**: low-demand weeks, the right ticket
product, the right hotel lane, food-cost control, and fewer surprise
transportation costs.

Created 2 new pages:

- `strategy-disney-world-budget-trip.md`
- `sources/2026-03-29-allears-make-disney-world-cheap.md`

Updated 6 existing pages:

- `strategy-booking-a-disney-world-trip.md` — added concrete 2026 lower-
  demand windows, midweek travel-day logic, and the seasonal 4-Park
  Magic ticket as a budget-ticket example
- `disney-world-hotels.md` — added the official-hotel budget lane and
  the Drury-style included-food tradeoff
- `art-of-animation-resort.md` — added a stronger warning that family
  suites often stop being true budget value
- `strategy-disney-world-travel-party-fit.md` — linked mixed-budget
  groups to the new lower-cost trip strategy page
- `index.md` — added the new strategy page and source summary
- `log.md` — appended ingest record

**Page-count discipline**: light-to-moderate. This source earned one new
strategy page because the wiki had answers for booking, ripoff
avoidance, crowd avoidance, and party fit, but it did **not** yet have a
direct answer to the question: **how do I make the whole trip cheaper?**

It did **not** earn standalone pages yet for the 4-Park Magic Ticket,
Drury Plaza Hotel, annual-passholder discount arbitrage, or midweek
flight strategy.

**Structural result**: the wiki now has a clearer answer to the product-
layer pain point **spend smarter**. It can answer not only "what is a bad
value trap?" but also "what trip shape is structurally cheaper before I
ever get there?"

The wiki also now has better direct answers to questions like:

- which 2026 trip windows are structurally cheaper?
- when is the 4-Park Magic ticket the right cheap move?
- when should I pick All-Stars vs Pop vs Art of Animation?
- when can an official non-Disney hotel beat a Disney-owned value resort?
- how do food and transportation quietly break a Disney budget?

**No new conventions added to CLAUDE.md.** Existing conventions handled
this ingest cleanly: the repeated cost-control behavior earned one
strategy page, while hotel-tier specifics stayed on the hotel hub and
Art of Animation page.

Open questions raised:

- Whether the 4-Park Magic Ticket deserves its own time-bounded page if
  more sources discuss it
- Whether official Walt Disney World hotels like Drury Plaza now have
  enough signal for a dedicated comparison page
- Whether promotion math deserves a more explicit comparison artifact
  once more 2026 offer sources are ingested
- Whether flight-day strategy belongs permanently in the booking page or
  should eventually live in a travel-logistics page
- Whether cheap-trip strategy should eventually split into Disney-owned
  vs official-hotel playbooks
