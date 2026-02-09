# Agent Recovery Guide

Использовать при сбое, смене сессии, передаче задач другому агенту.

## Якоря текущего состояния

- Архитектурные якоря: `render/src/architecture/dna.ts`
- Контекст агента: `.agent/context.yml`
- Шаблон задач: `docs/AGENT_TASK_TEMPLATE.md`
- План рефакторинга: `docs/REFACTOR_PLAN.md`
- План исполнения: `docs/REFACTOR_EXECUTION_PLAN.md`
- Архитектурный контекст: `render/src/architecture-context.ts`
- Агентский краткий контекст: `.agent-context.md`

## Проверки перед продолжением

1. Запусти `npm run arch-lint`.
2. Запусти `npm run check:fast`.
3. Убедись, что `ARCHITECTURE.CURRENT_FOCUS` не изменился.

## Следующий шаг

Ориентируйся на `docs/REFACTOR_EXECUTION_PLAN.md`.
Если шаги выполнены частично — зафиксируй статус в чате по формату:

```text
Этап: <номер/название>
Сейчас: <кратко, что делаю>
Сделано: <2-4 пункта>
Далее: <следующий шаг и критерий готовности>
```
