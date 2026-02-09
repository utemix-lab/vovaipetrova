# MACHINE_CONTEXT

Purpose: interactive 3D renderer for an ontology graph with pointer-tag navigation.
Mode: Visitor read-only UI.

## Quick Start (mental model)

- UI contracts live in `render/public/ui/` (layout, bindings, interaction, widgets).
- UI mechanics live in `render/public/ui/UI_RULES.md`.
- Runtime implementation lives in `render/src/`.
- Entry point: `render/src/main.js` -> `render/src/scenes/visitor.js`.
- Architecture context: `render/src/architecture-context.ts`.
- Agent summary: `.agent-context.md`.
- Architecture DNA: `render/src/architecture/dna.ts`.
- Agent YAML context: `.agent/context.yml`.

## Architecture Instruction (Meta‑React)

- Treat code as the DOM layer, AST/dependencies as Virtual DOM, ontology as State.
- Binding + agent engine plays the reconciliation role.
- LLM/RAG behaves like hooks/effects reacting to intent changes.
- Data flow is one-way: ontology → code.

## React Benefits (summary)

- Immediate: smoother UI and declarative transitions for people.
- Strategic: training ground for declarative patterns and homeostasis logic.

## React Risks (summary)

- Use React only where animation/complex UI justifies it.
- Keep focus on transferable patterns, not ecosystem breadth.
- Start with core hooks and component basics.

## Refactor Plan

- See `docs/REFACTOR_PLAN.md` for the structured React + GraphEngine plan.

## Refactor Execution

- See `docs/REFACTOR_EXECUTION_PLAN.md` for mandatory step-by-step execution.

## Agent Recovery

- See `docs/AGENT_RECOVERY.md` for crash/session recovery instructions.

## Data Flow (runtime)

- Graph data: `render/public/graph/universe.json`.
- UI contracts:
  - Layout: `render/public/ui/layout/visitor.layout.json`
  - Bindings: `render/public/ui/bindings/visitor.bindings.json`
  - Interaction: `render/public/ui/interaction/visitor.interaction.json`
  - Widgets: `render/public/ui/widgets/domains.json`
- Visual rules: `render/src/visual/*`

## What to Change (common)

- UI behavior: edit contracts in `render/public/ui/**`.
- Visual style: edit `render/src/visual/config.js`.
- Widget behavior rules: edit `render/src/visual/widget-rules.js`.
- Scene logic: edit `render/src/scenes/visitor.js`.

## Non-Goals (current)

- No new canonical entities or catalogs.
- No RAG/LLM integration.
- Query Mode is a reaction to context, not a separate page.

## Do / Don't (for agents)

Do:

- Read `render/public/ui/UI_RULES.md` before changing UI behavior.
- Keep UI contracts in `render/public/ui/**` aligned with `UI_CONTRACT_STYLE.md`.
- Use `npm run validate:ui` after editing UI contracts.
- Use `npm run pr:draft` to generate a PR summary from git changes.
- Use `npm run pr:create` to open a PR with an auto-generated description.
- For significant shifts, open a PR with the full 4-section narrative description.
- For minor fixes, direct commits are allowed.

Don't:

- Add new UI rules outside `UI_RULES.md`.
- Add visual catalogs or turn Query Mode into a standalone page.
- Auto-merge PRs. Always review before merge.
