# Workshop Relay verification

Checked 23 November 2026. Public application: https://dcontessa.github.io/workshop-relay/

## Result

The planner, real browser inference and public cross-origin composition were exercised successfully. 28 automated tests, TypeScript checking and the production build passed. No paid inference service or API key was needed.

## Automated coverage

`npm test` covers integer-price calculations and fees; exact budget boundaries; capacity, topic, location, date and facility constraints; catalogue expiry and malformed data; duplicate IDs; stale-brief/source approval; altered prices and invented model selections; planning receipts and supersession; network validation; peer allowlists; router preservation; private context; cycles; depth; call budget; deadlines; exact network names.

These tests do not constitute independent certification of the specification or a full security audit.

## Browser evidence

| Check | Observed result |
| --- | --- |
| Public route and first screen | Correct title and meaningful planner UI; no framework overlay |
| Actual inference | 9 real WebLLM responses on the public deployment |
| Cross-origin graph | Trainer and venue networks fetched from raw.githubusercontent.com and executed in the caller browser; both completed |
| Baseline plan | T1 + V1, RM4,300 after the live run |
| Source review | Public source URLs, catalogue versions and real-call trace visible; evidence exported |
| Save | Catalogues re-fetched, reviewed receipt saved on-device; no booking action |
| Availability change | Version 2 makes V1 unavailable; T1 + V2 costs RM4,700, +RM400 |
| Impossible budget | RM4,500 produces an exact RM200 shortfall |
| Stale receipt | Existing receipt visibly requires review after brief/provider changes |
| Persistence | A saved receipt survives reload; its facts are revalidated before use |
| Invalid input | Clearing the budget gives a validation message without crashing |
| Mobile | 390×844 layout, 390px content width, no horizontal overflow; review/save remains usable |
| Keyboard dialog | Enter opens Model settings; Escape closes the native dialog |
| Network failure | Offline provider fetch reports a failure and preserves the RM4,300 manual result |
| Cancellation | Cancel run stops worker setup/execution and preserves the current manual result |

The public inference run took 31.5 seconds after initialization on the tested machine; that is one observation, not a speed guarantee. Full model initialization downloads roughly 1 GB and varies by device and connection. The exported trace is [browser-run.json](docs/evidence/browser-run.json). It contains synthetic brief/catalogue data and no credentials or prompt bodies.

Desktop screenshots are [initial plan](docs/screenshots/desktop.png), [cancellation recovery](docs/screenshots/recovery.png) and [no match](docs/screenshots/no-match.png).

## Environment and limits

Initial UI and real WebGPU inference checks used the in-app browser. After that browser-control tool was removed from the session, public planner checks continued in an isolated Playwright Chromium session. No existing personal browser profile or authentication data was imported. The fallback initially reported only a missing favicon; the release adds a project-scoped SVG favicon.

Desktop checks used 1536×1024; mobile checks used 390×844. Other browsers and hardware remain untested. Custom paid model endpoints were not exercised. The local Ollama path was independently verified with qwen2.5:7b before public deployment (8 real model responses and two peer calls).

## Publication scan

No high-confidence credential pattern was found in tracked files. The generic assignment matches were inspected: redaction markers, environment-variable aliases and demonstration placeholders in unchanged pinned upstream files. No user credential or private key was published.

## Submission state

Devpost overview, story, technology tags, public app/repository links and additional information were saved. On 27 November 2026, six Project Media images were uploaded, captioned and ordered: working plan, user journey, cancellation recovery, budget safeguard, browser execution evidence and product roadmap. Reopening Project details verified all six persisted captions and their order; the project preview displayed a six-image carousel. The required Additional info screenshot and Project overview thumbnail were also verified. Sources and captions are in `docs/submission-media/README.md`.

The challenge entry still shows DRAFT, 3/5 steps done, and the preview labels it INCOMPLETE SUBMISSION. The video field remains empty and the terms checkbox was left unchecked. There is no YouTube upload. `ffprobe` confirms the local supporting walkthrough is 71.8 seconds with a video stream only and no audio.

A silent recorded walkthrough and a cue sheet are prepared locally. The entrant must supply their own explanation and a public video URL. No claim of a completed Devpost submission is made.
