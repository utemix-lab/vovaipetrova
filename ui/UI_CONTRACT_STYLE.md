# UI Contract Style

Purpose: deterministic, machine-friendly JSON contracts.

## Top-Level Order
1. `$schema` (optional)
2. `id`
3. `version`
4. `title`
5. `description`
6. `meta`
7. payload (layout/bindings/interaction/widgets/...)

## `meta` Shape
```json
{
  "mode": "visitor",
  "contract": "layout|bindings|interaction|widgets"
}
```

## Object Formatting
- No inline objects. Always expand to multiline.
- Keep arrays compact, but each object is multiline.
- 2-space indentation, trailing comma not allowed.

## Required Fields (for UI contracts)
- `id`, `version`, `title`, `description`, `meta`.

## Naming
- `id`: kebab-case, prefixed with mode.
- `version`: semantic string, e.g. `0.1.0`.
- `title`: human-readable, stable.

## Widgets Contract
- Top-level includes: `id`, `version`, `title`, `description`, `meta`.
- `config` and `widgets` are required.

## Checklist (before commit)
- Top-level order matches the style.
- No inline objects.
- `meta` is present and correct.
- No extra fields with null/empty placeholders.

## Pre-commit Note
- If a contract change touches structure, update `UI_INDEX.md` if a file was added/removed.
- Keep `UI_RULES.md` consistent when adding new behaviors or states.
