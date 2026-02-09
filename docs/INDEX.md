# Документация проекта

Карта документов с приоритетами для навигации.

## Обязательно прочитать

| Документ | Описание |
|----------|----------|
| [ARCHITECTURE_PRINCIPLES.md](ARCHITECTURE_PRINCIPLES.md) | **Ключевой акцент** — графоцентричность, фазы, что делаем/не делаем |
| [../.agent/context.yml](../.agent/context.yml) | Правила для агента, golden_rule, примеры якорей |

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

1. **README.md** (корень) — быстрый старт
2. **docs/ARCHITECTURE_PRINCIPLES.md** — понять философию
3. **.agent/context.yml** — понять правила
4. Код: `render/src/scenes/visitor.js` — основная логика
