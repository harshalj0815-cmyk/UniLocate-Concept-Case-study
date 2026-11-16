# UniLocate — Build Log

**Project:** Indoor campus navigation for students who can't find their venue on a first visit
**Started:** 2026-11-04

## Where things stand

Bet:        Newcomers on an unfamiliar campus reach the right room in time without depending on whoever is free to ask
Evidence:   enough
Files:      SCOPE.md [x] · RESEARCH.md [x] · BRIEF.md [ ] · DESIGN_LANGUAGE.md [ ] · build [ ] · live [ ]
Rounds:     0
Open:       Ideate gaps closed. Ready for brief.
Next:       molades_brief

## Entries

<!-- newest at the bottom -->

- 2026-11-04 — Started. Found Scope Card, research plan, interview guide, atomic notes, and clustered themes under Research/. Routed to synthesise.
- 2026-11-04 — DECISION · molades-synthesise · Primary moment: newcomer (not event visitor as primary). Event / exam / timetable stay related; WhatsApp channel kept as personal experience only.
- 2026-11-04 — Drafted numbered note sort (n01–n92) in Research/SYNTHESIS_SORT.md. Awaiting critique/moves before clustering.
- 2026-11-06 — DECISION · molades-synthesise · Locked three JTBDs:
  1. When I’m new and don’t know the campus, I want to follow clear direction through the building (know where to turn / which way to go), so I can reach my classroom without getting lost.
  2. When I need a place in another wing/section, I want to tell which wing/section I’m in, so I can reach the right one without backtracking.
  3. When I have an exam/event somewhere that isn’t my usual class, I want to get there on time, so I don’t miss it or walk in late.
- 2026-11-07 — DECISION · molades-synthesise · Insight ranking: (1) primary — locate classroom / signs & maps; (2) secondary — wings/sections; (3) important — one-off exam/event places (kept, not rejected).
- 2026-11-08 — Problem statement drafted: freshman first day struggles to locate class/other places because lack of signboards/maps and indistinguishable wings → late or miss lecture/event. Which means: app so they don’t rely on signboards/static maps and can understand sections/wings in-app. Next skill: molades-ideate.
- 2026-11-08 — Corrected: Scope card hypothesis is UniLocate (skip sign-up, route in 3 taps), not game referral. Stale paste was only in Research/UniLocate- Scope Card.md; synced to match Harshal’s real card.
- 2026-11-08 — Ideate plan: Harshal drafts ideas first; then compare with assistant’s set. “Other places” includes exam (same bet as scope card).
- 2026-11-08 — DECISION · ideate mix locked:
  Keep (Harshal): search-first / account later; location + offline maps; wing filter; account after arrival + same-day profile nudge (hypothesis); Revenue mapping fee + teacher dashboard (case study).
  Keep (mix): QR you-are-here + location access; next-class one tap; send live pin.
  Drop: landmark-only directions; wings always-on colour layer.
- 2026-11-08 — Gaps closed: lift-priority setting (else stairs); location required; geofence “go inside”; unmapped college + Request college; next-class from dashboard weekly timetable (teacher updates); search empty = no room / check spelling.

- 2026-11-13 � Map visual language (Paper floors ? web maps):
  - `#D9DFE3` at 100% opacity = path / walkable corridor
  - `#9AABB2` = enterable space (classroom, lift shaft room, etc.)
  - Tissue icon = toilet
  - Lift icon = lift
  - Arrow icon = stairs
  - `#0043C8` = entry point into an enterable space (`#9AABB2`)
  - PFP pin (blue tip + circular photo) = user current location (`you are here`), not decoration

- 2026-11-13 � Map search + cross-floor navigation: type destination ? route along path hubs via lifts/stairs; PFP animates; floor pages switch mid-route (`map-nav.js`).
  - Navigation walks only on `#D9DFE3` (A* grid); goals snap to nearest `#0043C8` entry / closest path; search ranks closest route first
