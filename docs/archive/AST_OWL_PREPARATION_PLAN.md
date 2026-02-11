# AST/OWL Layer Preparation Plan

## Текущий статус

Refactor Execution Plan (30 шагов) **полностью выполнен**:
- ✅ React-обёртка графа
- ✅ Абстракция `ThreeGraphEngine` (интерфейс `IGraphEngine`)
- ✅ Декларативный UI-слой (панели Story/System/Service)
- ✅ Framer Motion анимации
- ✅ Lever-режим, preview, query-mode
- ✅ Тесты для GraphEngine и UI-компонентов

## Оценка сложности: СРЕДНЯЯ

Подготовка к AST/OWL слоям — это **эволюционный процесс**, не революционный. Основа уже заложена:
- `ThreeGraphEngine` — абстрактный интерфейс, готовый к замене данных
- `@ArchProto` аннотации — каждый модуль помечен целевым слоем
- Event-система — имитирует будущий агентный API

## План подготовки (3 фазы)

### Фаза 1: Интерфейсы и типы (1-2 дня)

**Цель:** Формализовать контракты между слоями.

1. **Определить `IGraphEngine` интерфейс** (TypeScript)
   ```typescript
   interface IGraphEngine {
     initialize(): void;
     setData(nodes: GraphNode[], links: GraphLink[]): void;
     onNodeClick(callback: (node: GraphNode) => void): void;
     focusNode(node: GraphNode, duration?: number): void;
     getGraph(): unknown;
   }
   ```

2. **Определить `IGraphDataSource` интерфейс**
   ```typescript
   interface IGraphDataSource {
     type: 'universe' | 'ast' | 'owl';
     load(): Promise<{ nodes: GraphNode[], links: GraphLink[] }>;
     subscribe?(callback: (delta: GraphDelta) => void): void;
   }
   ```

3. **Типизировать `GraphNode` и `GraphLink`**
   - Добавить поля для AST-метаданных (`astType`, `sourceFile`, `lineRange`)
   - Добавить поля для OWL-метаданных (`owlClass`, `owlProperty`, `ontologyUri`)

### Фаза 2: Mock-реализации (2-3 дня)

**Цель:** Проверить, что архитектура работает с разными источниками данных.

1. **`AstGraphDataSource`** — mock-источник AST-данных
   - Парсит простой JS-файл через `@babel/parser`
   - Возвращает узлы: `FunctionDeclaration`, `VariableDeclaration`, `ImportDeclaration`
   - Связи: `calls`, `imports`, `defines`

2. **`OwlGraphDataSource`** — mock-источник OWL-данных
   - Загружает простую OWL-онтологию (JSON-LD или Turtle)
   - Возвращает узлы: `Class`, `Property`, `Individual`
   - Связи: `subClassOf`, `domain`, `range`

3. **Переключатель источников в UI**
   - Добавить dropdown: Universe / AST / OWL
   - При переключении — `engine.setData(source.load())`

### Фаза 3: Интеграция и рефлексия (3-5 дней)

**Цель:** Связать слои и добавить рефлексивные возможности.

1. **Bridge Layer**
   - Маппинг между AST-узлами и OWL-концептами
   - Пример: `FunctionDeclaration` → `owl:Function`

2. **Agent Layer (прототип)**
   - Event-система для агентных запросов
   - `graph-agent-query` → `graph-agent-response`
   - Пример: «Найди все функции, связанные с концептом X»

3. **Reflection Layer (прототип)**
   - Визуализация «внимания» агента
   - Подсветка узлов, на которые агент «смотрит»
   - Анимации переходов между фокусами

## Зависимости

| Фаза | Зависимости | Риски |
|------|-------------|-------|
| 1 | TypeScript strict mode | Низкий |
| 2 | `@babel/parser`, `rdflib` или `n3` | Средний (новые библиотеки) |
| 3 | Дизайн агентного API | Высокий (требует уточнения замысла) |

## Рекомендация

Начать с **Фазы 1** — она не требует новых библиотек и сразу улучшает типобезопасность. После её завершения можно параллельно работать над AST и OWL mock-источниками.

## Критерии готовности

- [ ] `IGraphEngine` и `IGraphDataSource` определены в TypeScript
- [ ] `ThreeGraphEngine` реализует `IGraphEngine`
- [ ] Хотя бы один mock-источник (AST или OWL) работает
- [ ] Переключение источников в UI без перезагрузки страницы
- [ ] Тесты для новых интерфейсов

## Связанные документы

- `docs/REFACTOR_PLAN.md` — общий замысел рефакторинга
- `docs/REFACTOR_EXECUTION_PLAN.md` — выполненный план
- `.agent/context.yml` — контекст для агента
- `render/src/architecture/dna.ts` — архитектурный DNA
