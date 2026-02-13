# Документация проекта

Карта документов с приоритетами для навигации.

**Версия:** v0.5.0-separation

## Обязательно прочитать

| Документ | Описание |
|----------|----------|
| [ARCHITECTURE_TRACKS.md](ARCHITECTURE_TRACKS.md) | **Треки v3.0** — 5 ракурсов системы |
| [../ARCHITECTURE.md](../ARCHITECTURE.md) | **Архитектура v0.5.0** — диаграммы, контракты, границы |
| [../worlds/vovaipetrova/ONTOLOGY.md](../worlds/vovaipetrova/ONTOLOGY.md) | **Онтология v1.0** — Track 1 Universe |
| [ARCHITECTURE_PRINCIPLES.md](ARCHITECTURE_PRINCIPLES.md) | Графоцентричность, фазы, что делаем/не делаем |
| [../.agent/context.yml](../.agent/context.yml) | Правила для агента, golden_rule, примеры якорей |
| [../engine/WORLD_CONTRACT.md](../engine/WORLD_CONTRACT.md) | Контракт Engine ↔ World |

## Текущая работа

| Документ | Описание |
|----------|----------|
| [AST_OWL_PREPARATION_PLAN.md](AST_OWL_PREPARATION_PLAN.md) | План подготовки к AST/OWL слоям (Фаза 2) |
| [AGENT_TASK_TEMPLATE.md](AGENT_TASK_TEMPLATE.md) | Шаблон задач для агента |
| [AGENT_RECOVERY.md](AGENT_RECOVERY.md) | Восстановление контекста агента |

## Справочные материалы

| Документ | Описание |
|----------|----------|
| [bridges.md](bridges.md) | Мосты между слоями системы |
| [windows.md](windows.md) | Описание панелей UI |

## Архив (выполнено)

| Документ | Описание |
|----------|----------|
| [archive/REFACTOR_EXECUTION_PLAN.md](archive/REFACTOR_EXECUTION_PLAN.md) | 30 шагов рефакторинга — все выполнены |
| [archive/REFACTOR_PLAN.md](archive/REFACTOR_PLAN.md) | Высокоуровневый план рефакторинга |
| [archive/PR_LOG.md](archive/PR_LOG.md) | Лог PR |
| [archive/UNRESOLVED_ISSUES.md](archive/UNRESOLVED_ISSUES.md) | Решённые проблемы |
| [archive/visitor-scene.md](archive/visitor-scene.md) | Документация visitor scene |

---

## Порядок чтения для нового агента

1. **README.md** (корень) — быстрый старт и архитектурная диаграмма
2. **docs/ARCHITECTURE_TRACKS.md** — 5 треков системы (v3.0)
3. **ARCHITECTURE.md** — полная архитектура v0.5.0
4. **worlds/vovaipetrova/ONTOLOGY.md** — онтология v1.0
5. **engine/README.md** — API MeaningEngine
6. **engine/WORLD_CONTRACT.md** — контракт Engine ↔ World
7. **docs/ARCHITECTURE_PRINCIPLES.md** — понять философию
8. **.agent/context.yml** — понять правила
9. Код: `engine/src/index.js` — MeaningEngine
10. Код: `render/src/scenes/visitor.js` — основная логика UI
