# UI Rules (mechanics-only)

This file is the single source of UI mechanics for the renderer.

## Scope
- Visitor mode UI contracts live in `render/public/ui/`.
- Runtime implementation lives in `render/src/`.

## Terms
- Story = scene (narrative / images / backgrounds / allegory).
- System = map (where I am and what is connected).
- Service = action (Query Mode, generation, save).
- Terminal visual = logo/cover/poster shown only in a terminal point.

## Visual Guardrails
- No visual catalogs: do not use logo/cover grids as primary navigation.
- Terminal visual only: show visuals only at selected card/terminal point.
- Anchor visuals only: persistent anchors only at top level (Domains, Characters, Countries, core Practices).
- Assets via manifest: load visuals from `assets/...` through manifest.
- Emblem swap: group -> author on hover only; root widget uses author by default.
- Temporary fallback: `assets/avatars/author-plug.png` for author emblem.

## Widget Types (rules)
- root: emblem=author, hoverSwap=false, clickable=false, filter=none.
- lever: emblem=group, hoverSwap=true, clickable=true, filter=grayscale.
- static: emblem=group, hoverSwap=false, clickable=false, filter=grayscale.

## Projection Coherence
- Graph node: `--color-active` (yellow).
- Graph links: `--color-active` (yellow).
- Panel widget: yellow border + color icon.

## State Colors
- Hover: `--color-semi-active` (#22d3ee).
- Active: `--color-active` (#fbbf24).
- Inactive: grayscale.

## Widget Rendering Details
- Inner highlight only (no box-shadow).
- Icons: grayscale -> color on hover.
- Offset: `translateY(-2px)`.

## Color System
- Graph is the only colored element (nodes by type).
- UI is monochrome (grays).
- State gradient: cyan (hover) -> yellow (active).
- CSS variables:
```css
--color-semi-active: #22d3ee;
--color-semi-active-soft: rgba(34, 211, 238, 0.15);
--color-active: #fbbf24;
--color-active-soft: rgba(251, 191, 36, 0.2);
--color-active-glow: rgba(251, 191, 36, 0.25);
```

## Scenography: Composition Anchors
- Widget block is anchored to the bottom edge of the panel.
- Bottom spacing equals the side padding of the panel.
- The figure is centered if the text allows it.
- If the text is long, the figure shifts downward and keeps equal spacing between the text and the widget block.

## Scenography: Shape Construction
- Size is driven by overall bounding volume, not by edge length.
- Connect vertices minimally: only canonical edges of the shape, no internal or all-to-all connections.
- For non-compact shapes, start with a visual estimate and refine after inspection.

## Widget Scope Highlight (Vova)
- Hover on the character's main (top) widget triggers scope highlight.
- During scope highlight:
  - Main widget: cyan highlight.
  - Related widgets: border-only highlight (no fill).
  - Related graph nodes/links: highlighted.
- Hover on any individual widget keeps default behavior (border + fill).

## Scene Language: States
- Hover = "смотреть": soft border highlight + local graph response.
- Click = "идти": web navigation to target node/page.
- Root widget = "перспектива": coverage highlight (not object), different color/intensity.
- Root state can be applied to a root group (e.g., workbench + related characters).

## Scene Language: Expressive Axes
- Intensity: none / partial / full.
- Depth: visual / contextual / response.
- Spatial: static / emphasized / shifted / locked.
- Graph Relation: local / partial / global / none.
- Intent: watch / go / hold / evoke.

## Behavior Patterns (not gestures)
- Focus (watch): hover highlight + local graph response.
- Perspective (coverage): non-local response, owner color, scope-aware.
- Commit (go): click navigation to target node.
- Hold (stage lock): state persists after hover; context/response stays.
- Stage (scene mode): same layout, different behavior rules.

## Widget Shift (state marker)
- Shift is a state marker, not a layout default.
- Applied to Hold or Stage states to show fixation.
- Shift is minimal and consistent (direction + magnitude fixed per scene).
- Visual form: duplicated square frame slightly above, creating a small rectangular track.
  The duplicate frame does not participate in highlight.
- In the "up" position the widget becomes a scene lever (no web navigation).
- Trigger: hold + drag up (long press, then lift).

## Naming Guardrail
- Internal identifiers: English.
- Narrative/branding names: multi-lingual (RU/EN/JP/mixed).
- Canon stays in English; theatre/showcase can vary.

## Expressive Coverage Principle
- Different characters demonstrate different expressive and technical capabilities of the medium.
- 2D / 3D / Animator / LoRA / UI are coverage axes, not taste.

## Implementation Map
- Widget rules: `render/src/visual/widget-rules.js`
- Visual config: `render/src/visual/config.js`
