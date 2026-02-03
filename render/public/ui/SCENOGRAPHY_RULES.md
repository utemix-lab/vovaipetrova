## Scenography Rules (v1)

### Composition Anchors
- Widget block is always anchored to the bottom edge of the panel.
- Bottom spacing equals the side padding of the panel.
- The figure is centered if the text allows it.
- If the text is long, the figure shifts downward and keeps equal spacing
  between the text and the widget block.

### Shape Construction
- Size is driven by overall bounding volume, not by edge length.
- Connect vertices minimally: only canonical edges of the shape, no
  internal or all-to-all connections.
- For non-compact shapes, start with a visual estimate and refine after
  inspection.

### Widget Scope Highlight (Vova)
- Hover on the character's main (top) widget triggers "scope highlight."
- During scope highlight:
  - The main widget gets cyan highlight.
  - All related widgets show **border-only** highlight (no fill).
  - All related graph nodes/links are highlighted.
- Hover on any individual widget keeps default behavior (border + fill).

### Scene Language: States (v1.1)
- **Hover = "смотреть"**: мягкая подсветка рамки + локальный отклик графа.
- **Click = "идти"**: веб-навигация, переход на узел/страницу.
- **Root widget = "перспектива"**: подсветка охвата (не объекта), другой цвет/интенсивность.
- Root state can be applied to a root group (e.g., workbench + related characters).

### Scene Language: Expressive Axes
- **Intensity**: none / partial / full.
- **Depth**: visual / contextual / response.
- **Spatial**: static / emphasized / shifted / locked.
- **Graph Relation**: local / partial / global / none.
- **Intent**: watch / go / hold / evoke.

### Behavior Patterns (not gestures)
- **Focus** (watch): hover highlight + local graph response.
- **Perspective** (coverage): non-local response, owner color, scope-aware.
- **Commit** (go): click navigation to target node.
- **Hold** (stage lock): state persists after hover; context/response stays.
- **Stage** (scene mode): same layout, different behavior rules.

### Widget Shift (concept)
- Shift is a state marker, not a layout default.
- Applied to "Hold" or "Stage" states to show fixation.
- Shift is minimal and consistent (direction + magnitude fixed per scene).
- Visual form: duplicated square frame slightly above, creating a small
  rectangular track. The duplicate frame does not participate in highlight.
- In the "up" position the widget becomes a scene lever (no web navigation).
- Trigger: hold + drag up (long press, then lift).

### Emblem Swap (concept)
- Generic widget emblem can be replaced by local emblem/avatar.
- Swap is stateful (hover only, for now).
- Swap must not turn the UI into a visual catalog.
- Temporary fallback: hover-swap to `assets/avatars/author-plug.png`.
- Root widget uses the local emblem by default (no swap on hover).

### Scene Language Reference
- Use the working language “Actors / Instruments / Matter” as a guiding map for UI decisions.
- Reference: `extended-mind/docs/system/SYSTEM_LANGUAGE_ACTORS_INSTRUMENTS_MATTER.md`
 - Related: `extended-mind/docs/system/CODEX_MEMO_CORE_ARCHITECTURE.md`
