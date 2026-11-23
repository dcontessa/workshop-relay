# Third-party notices

## Cognizant agentic-web reference runtime

`public/runtime/` was copied from the official [cognizant-ai-labs/agentic-web](https://github.com/cognizant-ai-labs/agentic-web) repository at commit `e34299792cb85f6eb27fed896fdedf65880b458b` on 23 November 2026. Apache-2.0 license and upstream notices are retained in that directory. This is a modified copy, not an assertion of organizer certification.

Workshop Relay changes:

- `llm.js` and `engine.js`: explicit anonymous routing for the user-selected local/browser inference adapter, propagated to peer networks. Custom provider keys remain caller-owned.
- `engine.js`: reject a manifest whose declared front man disagrees with the resolved network root.
- `kernel.js`: reject duplicate agent names.
- `runner.js`: support explicit `presentation.mode: none` for a structured-result planner with its own UI.

The separate worker boundary, WebLLM adapter, deterministic planner, provider fixtures and React interface are Workshop Relay code. The wrapper enforces consent, allowed fetch paths, no foreign executable actions, cancellation and limits; it does not claim the upstream runtime implements all those controls by itself.

## Dependencies and model

Dependencies and exact versions are recorded in `package-lock.json`. React is MIT; Vite and TypeScript are MIT/Apache-2.0 respectively; Lucide icons are ISC; Zod is MIT; WebLLM is Apache-2.0. Refer to the packages' retained license files for full terms.

The default [Qwen2.5-1.5B-Instruct MLC model](https://huggingface.co/mlc-ai/Qwen2.5-1.5B-Instruct-q4f16_1-MLC) is downloaded directly by WebLLM. Model weights are not redistributed in this repository. [WebLLM API documentation](https://webllm.mlc.ai/docs/user/api_reference.html) describes its JSON-schema response format and browser inference interface.

The interface uses Google Fonts (DM Sans and Libre Caslon Display) with system-font fallbacks. No generated concept image is used as an application screen or production background.
