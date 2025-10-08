
# Project snapshot — quick start

Purpose

This file is a focused handoff for picking up work on the HumanAI Convention workspace (Explorer / Research / Flows / Tiles). Put this in the repo root so an engineer or an assistant can resume without digging through the entire codebase.

High-level architecture

- Explorer (dashboard/flow-selector): UI that lists "flows" and loads "tiles" (tile.json + logic.js). It orchestrates flow execution and integrates a central StateAwareController.
- Flows: small modules that implement reasoning patterns (context anchoring, causal reasoning, ethics, planning, interpretability, creativity). Each flow returns a `flowResult` and `stateSignals` which the controller ingests.
- StateAwareController: central AMIE-inspired controller that tracks phases, knowledge, uncertainties, observations, and artifact/evidence requests. It exposes: `integrateObservation(flow, bundle)`, `processPendingArtifacts()` (sync/async), and `getSnapshot()`.
- Research simulator: two options
  - JS fallback bridge: `consciousness-explorer/modules/research/simulatorBridge.js` — deterministic local scoring used by tests and local runs.
  - Python shim: `python/sim_shim.py` — lightweight HTTP shim exposing `/simulate` for production/dev use. The bridge will call this shim if `SIM_SHIM_URL` is set.

Important files & locations

- Flow selector (UI orchestration): `consciousness-explorer/dashboard/flow-selector.js`
  - Key: options.simulateSync (default true) controls whether artifact simulation is awaited synchronously.
  - API: returns `setSimulateSync(value)`, `getController()`, `getControllerSnapshot()`.

- State controller: `consciousness-explorer/modules/flows/stateController.js`
  - Key methods: `integrateObservation(flow, bundle)`, `processPendingArtifacts()`, `getSnapshot()`.

- Flow modules:
  - `consciousness-explorer/modules/flows/contextAnchoringFlow.js`
  - `.../causalReasoningFlow.js`
  - `.../ethicalDeliberationFlow.js`
  - `.../longHorizonPlanningFlow.js`
  - `.../interpretabilityProvenanceFlow.js`
  - `.../playfulCreativityFlow.js`
  - Each now accepts { intent, perspective, research, userAnchors, phase, stateSnapshot } and may return a `stateSignals` envelope.

- Research simulator:
  - JS bridge (fallback): `consciousness-explorer/modules/research/simulatorBridge.js`
  - Python shim: `python/sim_shim.py` (HTTP server, POST /simulate)
  - Optional helper to spawn shim: `consciousness-explorer/modules/research/pythonShimManager.js`

- Tests and test helpers:
  - Web tests (Vitest): `web/tests/*` and `web/src/__tests__` etc.
  - Key tests added: `web/tests/state.controller.test.ts`, `web/tests/contextAnchoringFlow.unit.test.ts`, `web/tests/research.simulator.integration.test.ts`.

Quick dev commands

- Install & lint/test (from repo root):

```pwsh
npm install
npm run lint
npm run test
```

- Run web dev server (workspace task available):

```pwsh
npm run dev
# or use the workspace "web: dev" task in VSCode
```

- Run the Python shim locally (dev) and point the JS bridge at it:

```pwsh
# start the shim in a terminal
python python/sim_shim.py
# set env for Node or the browser environment: SIM_SHIM_URL=http://127.0.0.1:8765
# For local Node scripts, you can export it or set in call:
$env:SIM_SHIM_URL = 'http://127.0.0.1:8765'
# then run the app/tests which rely on fetch to call the shim
```

Pick up checklist (what I'd do next)

1. Implement robust Python shim integration (in-progress)
   - Provide a child-process manager or a production HTTP endpoint wrapper.
   - Make sure the bridge falls back gracefully when the shim is down.
2. Add controller edge-case tests
   - concurrent artifacts, timeouts, simulator errors, knowledge conflict resolution, phase transitions.
3. UI surface for sim results
   - Show `bundle.flowResult.simResult` details in tiles when present (debug mode optional).
4. Add timeouts / perf fallback for synchronous `processPendingArtifacts()` so the UI doesn't hang.
5. Docs: add README sections and deployment notes describing simulator options and how to run the shim in production.

<!-- TODOS-START -->

## Tracked Todos

- [x] 1. Add sync/async toggle — completed
  - Add a configuration option to toggle synchronous vs asynchronous artifact processing in the Flow Selector; update `consciousness-explorer/dashboard/flow-selector.js`, add tests, and ensure default behavior is clear (keep current behavior as default). Acceptance: a runtime option `options.simulateSync` (or similar) controls whether `controller.processPendingArtifacts()` is awaited. Update or add unit tests to cover both modes.
- [ ] 2. Implement Python shim — in-progress
  - Provide a production-ready bridge to the Python simulator: create an HTTP shim or child-process wrapper that exposes `simulate_fragment` to Node, update `consciousness-explorer/modules/research/simulatorBridge.js` to call the shim when configured, add docs and tests. Files: `python/sim_shim.py`, `consciousness-explorer/modules/research/simulatorBridge.js`.
- [ ] 3. Add controller edge-case tests — not-started
  - Add Vitest tests for StateAwareController covering: multiple concurrent artifacts, simulator errors/timeouts, knowledge/uncertainty conflict resolution, and phase transitions triggered by research evidence. Files: `web/tests/state.controller.edge.test.ts` and updates to CI test calls.
- [ ] 4. Surface simResult in tile UI — not-started
  - Update tile rendering to display relevant `simResult` details when present on `bundle.flowResult.simResult`. Files: `consciousness-explorer/dashboard/tile-*.js` (or the tile component used by the project). Add small UI tests to assert presence when debug toggle enabled.
- [ ] 5. Document simulator options and behavior — not-started
  - Update README and `DEPLOY_AZURE.md` (or an appropriate docs page) to describe simulator modes (JS bridge vs Python shim), the sync/async toggle, and recommended deployment approach. Include example config snippets and troubleshooting notes.
- [ ] 6. Add perf fallback and timeout — not-started
  - Implement a fallback for long-running synchronous simulations: add a timeout and graceful degradation path (e.g., proceed with partial state, mark artifacts as timed out), and add tests for timeout behavior. Files: `stateController.js` and tests.

<!-- TODOS-END -->

Notes & gotchas

- The flow-selector currently defaults to synchronous simulation processing (deterministic behavior). You can toggle at runtime with `setSimulateSync(false)` returned from `initFlowSelector`.
- The JS simulator bridge will prefer the shim when `SIM_SHIM_URL` is present in the environment (or `globalThis.__SIM_SHIM_URL__` for browser tests). If the shim cannot be reached the bridge falls back to the deterministic JS scoring and annotates the result with `shimError`.
- Tests run in a Node/JSDOM environment. A few tests directly manipulate `document` or expect DOM presence; run them inside the web test runner (Vitest workspace) as usual.

Contacts / context

- Branch: current work is on branch `devcontainer/add`.
- CI: Vitest is used for unit/integration tests; keep an eye on unhandled async operations — tests failing with "something ran after teardown" are usually caused by uncancelled timeouts/promises.

Where to look first when resuming

1. `consciousness-explorer/dashboard/flow-selector.js` — orchestration, simulateSync toggle and tile-loading logic.
2. `consciousness-explorer/modules/flows/stateController.js` — controller logic and artifact processing.
3. `consciousness-explorer/modules/research/simulatorBridge.js` and `python/sim_shim.py` — simulator integration.
4. `web/tests/*` — tests added to validate the controller, flows, and simulator.

If you'd like me to continue

- Say which todo to pick up next (I left a small tracked todo list in the repo while I was working). If you want me to continue now I can:
  - finish the Python shim integration and add tests, or
  - add controller edge-case tests, or
  - implement the timeout/fallback for synchronous processing.

✦ File saved: start.md
