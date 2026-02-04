# MACHINE_CONTEXT

Purpose: interactive 3D renderer for an ontology graph with pointer-tag navigation.
Mode: Visitor read-only UI.

## Quick Start (mental model)
- UI contracts live in `render/public/ui/` (layout, bindings, interaction, widgets).
- UI mechanics live in `render/public/ui/UI_RULES.md`.
- Runtime implementation lives in `render/src/`.
- Entry point: `render/src/main.js` -> `render/src/scenes/visitor.js`.

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

Don't:
- Add new UI rules outside `UI_RULES.md`.
- Add visual catalogs or turn Query Mode into a standalone page.
