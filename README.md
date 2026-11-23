# Workshop Relay

Browser agents consult published trainer and venue networks to plan a workshop, then repair the plan when availability changes. Every accepted choice passes exact catalogue checks. Saving creates a reviewed planning receipt, not a booking.

Built for the [Open Agentic Web Challenge](https://cognizant-agenticweb.devpost.com/). All provider names, availability and prices are fictional fixtures.

## Try it

[Open the planner](https://dcontessa.github.io/workshop-relay/). No account or payment is required.

1. The initial brief is 30 people, Practical AI at work, Kuala Lumpur, 17 December 2026, budget RM6,000, step-free access and a projector. The checked plan costs RM4,300.
2. Select **Consult agents**, review the exact sources and model, then **Allow & consult**. Browser AI downloads approximately 1 GB once and performs real Qwen inference on your GPU. A current WebGPU-capable desktop Chrome/Edge browser and approximately 2 GB free GPU memory are needed. First load can take several minutes. Cancellation terminates the worker. The manual planner remains usable without a GPU.
3. **Activity & evidence** shows model calls and the trainer and venue networks executing in this browser. Export the evidence JSON to inspect catalogue snapshots and validated combinations.
4. **Review & save plan** re-fetches the catalogues before saving locally.
5. **Simulate venue cancellation** loads published version 2. Studio One becomes unavailable and the plan switches to The Garden Room: RM4,700, an increase of RM400. Any earlier receipt is marked for review.
6. Set the budget to RM4,500. The planner reports a RM200 shortfall; it does not silently relax accessibility, capacity or budget.

## Run locally

Use Node 22 or later.

```sh
npm ci
node scripts/generate-sites.mjs
node scripts/bundle-browser-model.mjs
npm run dev
```

Open `http://127.0.0.1:5190/`. The trainer and venue are served at `http://localhost:5191/` and `http://localhost:5192/`. Local mode uses an optional Ollama installation at port 11434 with `qwen2.5:7b`. Choose **Browser AI** in Model settings to run without Ollama. Custom OpenAI-compatible endpoints must support browser CORS and streaming tool calls; their usual charges apply. Keys remain in memory for the current page session.

```sh
npm test
npm run check
npm run build
```

See [verification and screenshots](QA_REPORT.md) for the real public-browser run and tested failure paths.

## How it works

The public `agent-manifest.json` resolves the `workshop_relay` network. Its coordinator delegates to a local constraints reviewer and two exact remote network URLs. The browser fetches each peer manifest and network, checks consent and executes the graph locally with the caller's inference router. There is no remote agent-execution endpoint.

On the public deployment, provider JSON is independently addressed under `raw.githubusercontent.com/dcontessa/workshop-relay/main/public/providers/`; the UI is served from `dcontessa.github.io`. Provider web pages are linked in the app. These are separately published demonstration catalogues in one repository, not real commercial partners.

The reference runtime is pinned to Cognizant's agentic-web commit `e34299792cb85f6eb27fed896fdedf65880b458b`. See [third-party notices](THIRD_PARTY_NOTICES.md) for licenses and our changes. The default browser inference adapter uses WebLLM's JSON schema output to enforce required consultations. The LLM chooses among pending providers and reviews the final offer IDs within the lowest-cost feasible set. Deterministic code performs the optimization, validates the pair and calculates prices in integer minor units. Raw model prose and invented prices are never accepted as a plan.

The `__browser-inference/v1` URL is a **worker-local adapter identifier**, not a hosted API. WebLLM supplies actual model responses locally. Model weights come from Hugging Face; the model's WebAssembly library comes from MLC's GitHub distribution. The user approves these downloads before a run.

## Boundaries and limitations

- Only the reviewed brief and public catalogue data reach the chosen model. Provider requests are anonymous JSON reads, with cookies omitted. Peer sites never receive model credentials.
- The worker permits only the selected inference endpoint and declared JSON paths. Foreign executable actions, redirects and undeclared origins are rejected. Runs have request/depth budgets and a 90-second execution deadline after model initialization.
- These controls constrain this application; they are not a general sandbox for arbitrary hostile JavaScript. The vendored runtime and app code are trusted, pinned code.
- Catalogues are synthetic and expire on 1 February 2027. There are no reservations, payments, emails, real calendars or background jobs.
- Stored briefs and receipts live on the device. A restored receipt is conservatively marked for review if its source snapshot differs from the current plan. Reloading does not assert old availability remains current.
- Browser models are small and can fail or reach the deadline. Invalid/incomplete proposals are rejected; the deterministic manual result remains available. No customer adoption or measured time-saving claim is made.

## Publishing

The compiled site is deployed to GitHub Pages from the `gh-pages` branch. Run `npm run build` followed by `node scripts/deploy-pages.mjs` to update it. `scripts/generate-sites.mjs` accepts `TRAINER_SITE`, `VENUE_SITE` and `PLANNER_SITE` to produce the deployment's exact public URLs. Do not put credentials in static files. Generate public artifacts with those variables before building. The build bundles WebLLM from the lockfile.

## License

New Workshop Relay code is MIT licensed. The vendored agent runtime remains under its Apache-2.0 license and retained upstream notices. Model assets have their own licenses and are downloaded directly, not bundled into this repository.
