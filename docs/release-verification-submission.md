# Submission release verification

## Delivered

- Revised public README with v2.6 identity, complete architecture/setup, model boundaries, shared-access behavior, and submission links.
- `NASA_SUBMISSION_ANSWERS.md`: exactly 150 words in the high-level pitch; the four requested portal sections, five judging headings, all 15 catalogue groups, DOIs/publication references, requested NASA report identifiers, and AI/tool disclosure.
- `PITCH_DECK_7_SLIDES.md` and `pitch-deck-content.json`: seven-slide narrative, presenter notes, and source links.
- `public/pyrozero-pitch-deck.html`: seven 16:9 slides, keyboard navigation, mobile reading layout, source notes, print action, and PDF download.
- `public/pyrozero-pitch-deck.pdf`: seven tagged pages, approximately 1200 × 675 points, no extra notes or blank pages. All seven rendered pages visually inspected; diagram and spinoff visuals refined.
- Original PyroZero logo, self-hosted fonts, and real product captures reused.

## Shared-access policy

`src/data/shared-access.json` defines one fixed seven-day window: 15 November 2026 17:55:26 UTC to 22 November 2026 17:55:26 UTC (10:55:26 pm Pakistan time at the deadline).

`GET /api/copilot` publishes only availability and expiry metadata, with `Cache-Control: no-store`. A configured server key is required before the interface claims shared access. The server applies the same deadline to new DeepSeek calls. Visitor keys take precedence and continue working after expiry. The browser refreshes status, automatically restores AI settings while open, and exposes recovery sooner after a failed request. No cookies, external scheduler, or client clock governs server authorization. The app does not delete the Vercel secret or revoke it at DeepSeek; the owner remains responsible for provider revocation.

## Passed checks

- **145 Vitest tests / 13 files**, including seven shared-access checks and the existing **4,608-state** parameter sweep. Provider fixtures use an explicit test clock so they remain reproducible after the demo deadline.
- Native Next.js production build and TypeScript pass; ESLint passes.
- Existing **32** browser checks: all four tabs, desktop/mobile, Light/Dark, navigation, controls, scope, telemetry, evidence/reference rendering, graph containment, and natural scrolling.
- Advisor lifecycle: persistence, skeletons, duplicate-send prevention, retry, cancellation, incomplete streams, response scrolling, and real no-key reference endpoint.
- `submission-browser-results.json`: fit of all seven slides; mobile reading containment; shared-status/settings behavior at 1440 and 390 pixels in both themes; provider-failure key recovery; live return of the button after a server-supplied deadline; missing-key behavior.
- PDF export and PDF-to-PNG visual inspection; slide text remains readable without clipping or source-footer overlap.
- Credential-pattern scan of **603** tracked/unignored release files returned no matches. Runtime/browser profiles and local credentials remain ignored. This pattern scan is not an exhaustive security audit.
- SIBAL coefficient remains **0.3147**, with **2.030 mm/s** at 0g / 100 kPa / 21% O2 / 20 cm/s.

## Scientific and portal scope

`SUBMISSION_SOURCE_NOTES.md` documents corrections to the supplied pitch claims. The archive-size claim, experiment grouping/status, partial-gravity evidence gap, one-point calibration, DeepSeek failure behavior, and ECLSS study scope are qualified. Unretrieved report contents are not presented as verified. No customer, NASA endorsement, physical qualification, universal zero-hallucination guarantee, or certified terrestrial product is claimed.

No NASA portal submission was sent. The files are ready for the owner to review and paste; additional authenticated portal fields were not invented.
