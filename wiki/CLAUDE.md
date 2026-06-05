# Disney Trip-Planning Wiki — Charter

> **This charter is the canonical reference for how we maintain this wiki.**
> It is a synthesis of two source documents: the Karpathy "LLM Knowledge
> Bases" short text and the longer LLM Wiki gist. Both describe the same
> pattern at different levels of detail. On any infrastructure or process
> question, check this file first. If you are about to add a file, field,
> convention, or layer that is not grounded here or earned through a real
> ingest session, **stop**.

## Domain and goal

Domain: Walt Disney World and Disneyland trip decision support.

Goal: feed the Disney decision desk. A user asks a natural-language planning
decision, gets sourced research from the curated corpus, and can request a
human-reviewed paid decision plan. The wiki's job is to keep deeper strategy,
entity, and synthesis knowledge grounded and current so future decision
previews and manual plan fulfillment improve as more sources are ingested and
more queries are run.

## The thesis (why this pattern)

Most LLM + document setups are RAG: the LLM re-derives understanding on
every query, nothing accumulates. This pattern inverts that. The LLM
incrementally compiles a persistent wiki between you and the raw sources.
Cross-references are already there. Contradictions have already been
flagged. Synthesis already reflects every source. The wiki compounds.

The tedious part of maintaining a knowledge base is not the reading or
the thinking — it is the bookkeeping. Humans abandon wikis because
maintenance grows faster than value. LLMs don't get bored, don't forget
cross-references, and can touch 15 files in one pass. The wiki stays
maintained because the maintenance cost approaches zero.

**Human's job**: curate sources, direct analysis, ask good questions,
think about what it all means. **LLM's job**: everything else — reading,
summarizing, cross-referencing, filing, bookkeeping, and writing the
pages. The operator rarely (or never) edits files directly.

## Three layers

### 1. Raw sources (`../raw/`)

Immutable YouTube transcripts organized by channel:
`../raw/<channel>/<YYYY-MM-DD>-<slug>.md`. Each file has YAML frontmatter
(`video_id`, `channel`, `title`, `published`, `url`) followed by the full
transcript body. The LLM **reads** raw files but never modifies them.
This is the ground truth. New sources arrive via the existing YouTube
fetch pipeline, which mirrors each new transcript into `raw/` at fetch
time.

### 2. The wiki (`./`)

LLM-owned directory of markdown files. Contains the kinds of pages Karpathy
and the gist both describe:

- **Summaries of raw sources** (`./sources/`) — one per ingested source,
  brief, with links to the wiki pages it touched. These are provenance /
  ingest notes, not the primary reader-facing decision-support pages.
- **Entity pages** — what a specific thing is (an attraction, restaurant,
  hotel, event, service).
- **Concept pages** — cross-cutting ideas (Lightning Lane, resort perks).
- **Strategy pages** (`strategy-` filename prefix) — how to use things
  well. Separated from entities so the decision desk can retrieve them
  directly. See Conventions below.
- **Synthesis pages** — compiled views across sources
  (e.g., `2026-disney-changes.md`).
- **Answers** (`./answers/`) — outputs from queries, filed back into the
  wiki so explorations compound alongside ingests.
- **Backlinks / cross-references** — when an entity appears on multiple
  pages, each page links to the entity page, and the entity page's
  `## Referenced by` section lists the pages that link in. Keep this
  light; update on ingest.

The LLM creates pages, updates them on every ingest, maintains cross
references, and keeps things consistent. **You read it; the LLM writes
it.**

### 3. The schema (this file)

This charter. Co-evolves with the wiki. Grows only when a real ingest
session forces a decision worth recording for future sessions. **Do not
add to the Conventions section preemptively.**

## Four operations

### Ingest

Read one raw source at a time. Preferred flow:

1. Read the source.
2. **Discuss key takeaways with the operator.** Surface the pattern-level
   decisions the source forces — the ones that will recur on future
   ingests. Decide small things yourself; surface structural choices.
3. Write a brief summary of the source under `sources/`.
4. Create or update the wiki pages (entity, concept, strategy, synthesis)
   that this source touches. A single source may touch 5–15 pages.
5. Update `index.md` if new pages were created or categories changed.
6. Add backlinks: pages that reference a new or updated entity should
   show up in its `Referenced by` section.
7. Append an entry to `log.md`.

Stay conversational. The operator's job is to guide what to emphasize,
not to write. The LLM's job is the grunt work — summarizing,
cross-referencing, filing, bookkeeping — without needing help on the
small stuff.

### Query

The wiki's primary consumer is an agent or operator working on decision
support: sourced previews, manual decision-plan fulfillment, and deeper
answers to planning questions.

Retrieval model: **read `index.md` first** to find relevant pages, then
drill into the pages that look promising, then synthesize an answer with
citations. At this scale (~hundreds of pages or fewer, per Karpathy's
measured experience at ~100 articles / ~400K words), **the index alone
is sufficient retrieval infrastructure**. No embeddings, no manifest
files, no structured metadata layers. Trust the LLM.

Answers can take any form: markdown, comparison tables, Marp slide
decks, matplotlib charts, or decision-plan notes. **Good answers get
filed back as wiki pages** (under `./answers/` or as new entity /
concept / synthesis pages) so the wiki compounds from queries, not just
from ingests.

### Lint

Periodic health check. Walk the wiki looking for:

- Contradictions between pages
- Stale claims a newer source has superseded
- Orphan pages with no inbound links
- Concepts mentioned in passing but lacking their own page
- Missing cross-references / broken backlinks
- Coverage gaps — entities the decision desk would want to retrieve but
  no page exists
- Data gaps that could be filled **with a web search** (the LLM should
  go find the answer, not just flag the hole)
- Interesting connections worth spinning into new article candidates
- New questions worth investigating against the corpus

Write findings to `log.md` as a `lint` entry and act on them in the next
ingest session (or immediately for small ones).

### Output

Queries produce answers. Answers render in whatever format best fits the
question — markdown, tables, slide decks, charts. When an answer is
valuable beyond the moment, file it back into the wiki under
`./answers/` or, if it fits, as a new concept / strategy / synthesis
page. This is the compounding loop: explorations always "add up" in the
knowledge base.

## Infrastructure — minimum required

- **`index.md`** — content catalog, updated on every ingest. One line per
  page (`[title](path.md) — one-line summary`), organized by category.
  Read first during queries.
- **`log.md`** — append-only chronological event log. Greppable format:
  `## [YYYY-MM-DD] ingest|query|lint | short title`.
- **A viewer** — whatever lets the operator read wiki pages quickly as
  the LLM writes them. We use an Express route at `/wiki` that renders
  markdown; Karpathy uses Obsidian. Both work. The viewer is the
  "IDE frontend" per the gist.

## Infrastructure — defer until a specific failure forces it

The canonical pattern deliberately **omits** the following until a real
query or lint pass demonstrably fails in a way that requires them. If
you feel the urge to add any of these, read the thesis above and check
whether the urge is earned by observed failure or imported from general
LLM-infrastructure priors. If it's imported, **don't**.

- Search engines, embeddings, vector databases (the index alone is
  enough at this scale — Karpathy reached for a simple hand-rolled
  naive search engine only at ~100 articles / ~400K words, and even
  then did not use fancy RAG)
- Frontmatter / manifest files / machine-readable metadata layers
- Structured JSON / canonical extract / database schema populated from
  the wiki
- Knowledge-graph compilation
- Claim-level structured data with separate provenance fields (claims
  live in prose with citations; distillation happens downstream if and
  when needed, not upstream)
- Volatility tags, `asOf` tags, explicit consensus+dissent conventions,
  creator authority weights
- TL;DR headers as a formal structural rule (brief opening paragraphs
  are fine; don't invent a convention for them)

Far future, per both sources: synthetic data generation + fine-tuning so
the LLM eventually "knows" the wiki in its weights instead of its context
window. Not a near-term concern.

## Conventions (earned through real ingest sessions)

Conventions below were added when a real instance during an ingest
session forced the decision. **Do not add to this section preemptively.**
Each records the date it was added and the source(s) that forced it.

### Strategy vs. entity content

Strategy content ("how to use X well") lives on pages with a `strategy-`
filename prefix. Entity pages describe what a thing is; they do not
embed tactical strategy. Entity pages link to relevant strategy pages
and vice versa. Rationale: the decision-plan workflow retrieves strategy
content directly — it is the load-bearing product output — so it must
be cheap to find and not buried inside long entity pages.

_Added 2026-04-11, from the AllEars "7 new tips" ingest + partial
DFBGuide "Ultimate MK Guide" reference._

### Supersession of claims across sources

When a newer source firms up, refines, or replaces a claim from an
older source, keep only the newest claim in the page body with an
inline parenthetical note: `(firmed up from DFBGuide 2025-12)` or
`(supersedes DFBGuide 2025-12: no date was known at that time)`. Older
claims are not preserved as a separate history section — git and
`log.md` hold the trail.

_Added 2026-04-11, from AllEars firming DFBGuide's Big Thunder
reopening claim._

### Time-bounded claims

Time-bounded claims on entity pages carry inline date annotations:
`Bluey's World — opens 2026-05-26 at Conservation Station`. A single
synthesis page per calendar year (e.g., `2026-disney-changes.md`)
collects all known time-bounded events in chronological order, so a
query about a specific trip window reads one page instead of many.

_Added 2026-04-11, from AllEars tips 6+7 and DFBGuide event calendar._

### Cross-source corroboration

Not tracked explicitly in page bodies. Multiple citations at the end
of a page are the only signal. Lint may later detect strongly
corroborated vs. single-source claims; until then, retrieval infers
authority from citation count.

_Added 2026-04-11, from AllEars + DFBGuide corroborating Big Thunder._

## Re-alignment note for future sessions

If you are reading this file at the start of a new session and feel the
pattern is under-engineered, read the gist and the Karpathy text again.
Both are deliberately minimalist. The pattern works at moderate scale
without the infrastructure you are about to propose. Defer.
