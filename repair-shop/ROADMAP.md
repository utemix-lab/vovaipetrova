# Карта преобразований

**Дата создания:** 12 февраля 2026

---

## Типизация записей

```
ДИАГНОЗ → ЭТАП → ВАРИАНТЫ [A, B, C...] → ВЫБРАН [X] → РЕЗУЛЬТАТ → РАЗВИЛКА → ВАРИАНТЫ [X1, X2, X3...] → ...
```

| Тип | Описание |
|-----|----------|
| `ДИАГНОЗ` | Описание проблемы |
| `ЭТАП` | Номер этапа в цепочке |
| `ВАРИАНТЫ` | Возможные пути решения |
| `ВЫБРАН` | Принятое решение |
| `РЕЗУЛЬТАТ` | Что получилось |
| `РАЗВИЛКА` | Точка ветвления для следующего этапа |

---

## ЭТАП 0: Корневой диагноз

**ДИАГНОЗ:** Отсутствие формального слоя инвариантов. Смешение 5 слоёв (онтология, состояние, логика, представление, инфраструктура). Подсветка — событие + состояние + эффект + правило + визуализация одновременно.

**См.:** `2026-02-12_DIAGNOSIS.md`

---

## ЭТАП 1: Выбор стратегии

**ВАРИАНТЫ:**

| ID | Название | Описание |
|----|----------|----------|
| A | Продолжать | Строить фичи, фиксировать течи |
| B | Полный рефакторинг | Разделить слои, переписать всё |
| C | INVARIANTS.md | Документ с инвариантами |
| D | TypeScript | Типизация как инварианты |
| E | OWNERSHIP_GRAPH | Граф ответственности |
| F | Гибридный | C + E + постепенная типизация |
| **G** | **Вычислительная модель** | **Чистые функции для онтологии** |

**ВЫБРАН:** G — Формализация вычислительной модели

**ОБОСНОВАНИЕ:** Проблема не в структуре файлов, а в степени формализации онтологии. Нужна формальная точка причинности, а не разделение по папкам.

**См.:** `DECISIONS.md` → Решение #1

---

## ЭТАП 2: Реализация G (highlightModel)

**РЕЗУЛЬТАТ:**
- Создан `render/src/ontology/highlightModel.js`
- `computeHighlight(context, graph) → HighlightState`
- Интеграция в `visitor.js` через `updateHighlight()`
- Build успешен, подсветка работает

**Commit:** `5f8f4e0`

---

## РАЗВИЛКА после ЭТАПА 2

**ТЕКУЩЕЕ СОСТОЯНИЕ:**
- Есть формальная точка причинности для подсветки
- `visitor.js` по-прежнему 4500+ строк
- Другие аспекты (navigation, scope, templates) не формализованы

**ВАРИАНТЫ:**

| ID | Название | Описание | Сложность | Риск |
|----|----------|----------|-----------|------|
| G.1 | Тесты для highlightModel | Unit-тесты для computeHighlight() | Низкая | Низкий |
| G.2 | TypeScript для highlightModel | Типизировать модель | Низкая | Низкий |
| G.3 | navigationModel.js | Чистая модель навигации | Средняя | Низкий |
| G.4 | scopeModel.js | Чистая модель scope | Средняя | Низкий |
| G.5 | templateModel.js | Чистая модель шаблонов страниц | Средняя | Средний |
| G.6 | OWL-экспорт | Экспорт модели в OWL-формат | Высокая | Средний |
| C | INVARIANTS.md | Вернуться к документации инвариантов | Низкая | Низкий |
| E | OWNERSHIP_GRAPH | Построить граф ответственности | Низкая | Низкий |

**ОЖИДАНИЕ:** Выбор следующего шага

---

## Граф решений (ASCII)

```
                    ┌─────────────────┐
                    │  ДИАГНОЗ (0)    │
                    │  Смешение слоёв │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   ЭТАП 1        │
                    │   Выбор         │
                    │   стратегии     │
                    └────────┬────────┘
                             │
        ┌──────┬──────┬──────┼──────┬──────┬──────┐
        │      │      │      │      │      │      │
        A      B      C      D      E      F      G ◄── ВЫБРАН
        │      │      │      │      │      │      │
        ✗      ✗      ✗      ✗      ✗      ✗      ✓
                                                  │
                                         ┌────────▼────────┐
                                         │   ЭТАП 2        │
                                         │   highlightModel│
                                         │   ✓ ВЫПОЛНЕН    │
                                         └────────┬────────┘
                                                  │
                                         ┌────────▼────────┐
                                         │   РАЗВИЛКА      │
                                         │   после G       │
                                         └────────┬────────┘
                                                  │
        ┌──────┬──────┬──────┬──────┬──────┬──────┼──────┬──────┐
        │      │      │      │      │      │      │      │      │
       G.1    G.2    G.3    G.4    G.5    G.6     C      E      ?
      тесты  TS    navig  scope  templ  OWL   INVAR  OWNER   ...
        │      │      │      │      │      │      │      │
        ?      ?      ?      ?      ?      ?      ?      ?
```

---

## Метрики прогресса

| Метрика | До | После ЭТАПА 2 | После Phase 2 | Цель |
|---------|-----|---------------|---------------|------|
| Формализованные модели | 0 | 1 (highlight) | 5+ | 10+ |
| Точки мутации подсветки | 5+ | 1 | 0 | 0 |
| Чистые функции онтологии | 0 | 1 | 5+ | 10+ |
| Покрытие тестами моделей | 0% | 0% | 50%+ | 80%+ |
| TypeScript в моделях | 0% | 0% | 100% | 100% |
| Проекции (линзы) | 1 | 1 | 2+ | 5+ |

---

## ЭТАП 3: Phase 2 — Core → Multi-Projection

**ВЫБРАН:** Phase 2 (продолжение G)

**ЦЕЛЬ:** Создать формальный Core, который можно рендерить в разные линзы без переписывания логики.

### Шаги Phase 2

| Шаг | Название | Описание | Статус |
|-----|----------|----------|--------|
| 2.0 | Зафиксировать цель | Документация в ROADMAP.md | ✓ |
| 2.1 | Завершить D | Проверить чистоту computeHighlight(), убрать мутации | ✓ |
| 2.2 | GraphModel.js | Абстрактная модель графа с API | ✓ |
| 2.3 | Правила в Core | highlight, scope, selection в Core | ✓ |
| 2.4 | Projection | Абстракция адаптера рендеринга | ✓ |
| 2.5 | DevProjection | Прототип dev-линзы | ✓ |
| 2.6 | OwnershipGraph | Граф владения состоянием | ✓ |
| 2.7 | Проверка на кристалл | Тест: новая линза без копирования логики | ✓ |

### Критерий завершения D

```
✓ computeHighlight() — чистая функция
✓ нет мутаций global state
✓ visitor только потребляет HighlightState
✓ highlightedNodes больше не источник истины
✓ Core можно вызвать вне браузера
```

### Архитектура Core

```
┌─────────────────────────────────────────────────────────────────┐
│                           CORE                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ GraphModel  │  │ Highlight   │  │ Scope       │              │
│  │             │  │ Model       │  │ Model       │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
│         └────────────────┼────────────────┘                      │
│                          │                                       │
│                   ┌──────▼──────┐                                │
│                   │ Ownership   │                                │
│                   │ Graph       │                                │
│                   └─────────────┘                                │
└─────────────────────────────────────────────────────────────────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
    ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
    │ Visitor     │ │ Dev         │ │ Doc         │
    │ Projection  │ │ Projection  │ │ Projection  │
    │ (Three.js)  │ │ (2D/JSON)   │ │ (Markdown)  │
    └─────────────┘ └─────────────┘ └─────────────┘
```

### Будущие линзы

| Линза | Описание |
|-------|----------|
| **Visitor** | 3D-граф смысловых связей (текущий) |
| **Dev** | Граф вычислений, зависимостей, ownership, потоки состояния |
| **Doc** | Автогенерация документации, инварианты, спецификации |
| **Ontology** | Экспорт в OWL/RDF, GraphRAG-интеграция |
| **Debug** | Live-визуализация state transitions, дифф состояний |
| **Meta** | Граф эволюции архитектуры, анализ сложности |

### Главное правило

> Любая новая фича должна:
> 1. Добавляться в Core как правило или отношение
> 2. Автоматически становиться доступной всем проекциям
> 3. Не требовать логики в renderer
>
> **Если фича требует логики в renderer — она добавлена не туда.**

### Формула

```
Строим не второй режим.
Строим чистый Core + систему проекций.
```

---

## Граф решений (ASCII) — обновлённый

```
                    ┌─────────────────┐
                    │  ДИАГНОЗ (0)    │
                    │  Смешение слоёв │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   ЭТАП 1        │
                    │   Выбор         │
                    │   стратегии     │
                    └────────┬────────┘
                             │
        ┌──────┬──────┬──────┼──────┬──────┬──────┐
        │      │      │      │      │      │      │
        A      B      C      D      E      F      G ◄── ВЫБРАН
        │      │      │      │      │      │      │
        ✗      ✗      ✗      ✗      ✗      ✗      ✓
                                                  │
                                         ┌────────▼────────┐
                                         │   ЭТАП 2        │
                                         │   highlightModel│
                                         │   ✓ ВЫПОЛНЕН    │
                                         └────────┬────────┘
                                                  │
                                         ┌────────▼────────┐
                                         │   ЭТАП 3        │
                                         │   Phase 2       │
                                         │   Core → Multi  │
                                         │   ⏳ В РАБОТЕ   │
                                         └────────┬────────┘
                                                  │
        ┌──────┬──────┬──────┬──────┬──────┬──────┼──────┐
        │      │      │      │      │      │      │      │
       2.1    2.2    2.3    2.4    2.5    2.6    2.7    ...
      завD   Graph  Rules  Proj   Dev   Owner  Crystal
        │      │      │      │      │      │      │
        ⏳     ⏳     ⏳     ⏳     ⏳     ⏳     ⏳
```

---

*Phase 2 ЗАВЕРШЕНА. Все шаги 2.0-2.7 выполнены.*

---

## Результат Phase 2: Crystal Test

```
═══════════════════════════════════════════════════════════════
                    CRYSTAL TEST: PASSED
═══════════════════════════════════════════════════════════════

Core можно использовать:
  ✓ Вне браузера (Node.js)
  ✓ Без DOM
  ✓ Без Three.js
  ✓ Для разных линз без переписывания логики

Это формальная архитектурная машина.
```

### Проверенные возможности

| Тест | Результат |
|------|-----------|
| GraphModel без DOM | ✓ 5 nodes, 5 edges |
| computeHighlight без Three.js | ✓ mode: selected |
| computeScope | ✓ characters → [characters, universe, vova] |
| Разные контексты → разные состояния | ✓ hover, scope, type |
| OwnershipGraph | ✓ 7 states, 3 computations |
| Экспорт в JSON | ✓ |
| Экспорт в Markdown | ✓ |

---

## РАЗВИЛКА после Phase 2

**ТЕКУЩЕЕ СОСТОЯНИЕ:**
- Core создан и работает
- Проекции определены (Visitor, Dev)
- OwnershipGraph документирует архитектуру
- Crystal Test пройден

**ВАРИАНТЫ:**

| ID | Название | Описание | Сложность | Риск |
|----|----------|----------|-----------|------|
| P3.1 | Интеграция Core в visitor.js | Заменить прямое использование на GraphModel | Средняя | ⚠️ Утянуть Core в procedural-хаос |
| P3.2 | VisitorProjection | Обернуть Three.js рендер в Projection | Высокая | ⚠️ Преждевременно |
| P3.3 | DevProjection UI | Добавить переключатель линз в UI | Средняя | ⚠️ Косметика без укрепления |
| **P3.4** | **Тесты для Core** | **Unit-тесты с Vitest** | **Низкая** | **✓ Стабилизация кристалла** |
| P3.5 | TypeScript для Core | Типизировать все модели | Средняя | ✓ Формализация границ |
| P3.6 | OWL-экспорт | Экспорт GraphModel в OWL/RDF | Высокая | ⚠️ Экспансия, рано |
| P3.7 | GraphRAG интеграция | Подготовка для LLM-анализа | Высокая | ⚠️ Экспансия, рано |

---

## Стратегическая перспектива

### Принцип выбора

> Следующий шаг должен:
> - **Укрепить кристалл**
> - А не усложнить его
> - И не затянуть в UI снова

### Правильный порядок

```
1️⃣ P3.4 — Тесты для Core
   │
   │  Почему первый?
   │  - Core сейчас чистый, но хрупкий
   │  - Тесты закрепят инварианты
   │  - Станут формальной спецификацией
   │  - Защитят от случайных изменений
   │
   ▼
2️⃣ P3.5 — TypeScript для Core
   │
   │  После тестов:
   │  - Формализация сущностей
   │  - Строгие контракты Projection
   │  - Защита от утечек UI-типов
   │  - Шаг к онтологии в коде
   │
   ▼
3️⃣ P3.1 — Интеграция Core в visitor
   │
   │  Только когда Core стабилен:
   │  - Не отлаживать архитектуру + UI + интеграцию одновременно
   │
   ▼
4️⃣ P3.2/P3.3 — Projections
   │
   ▼
5️⃣ P3.6/P3.7 — OWL / GraphRAG
   │
   │  Откроются почти автоматически
   │  после стабилизации Core
```

### Если перескочить

```
⚠️ Начнутся микро-течи
⚠️ Core мутирует при первом прикосновении к visitor
⚠️ Отладка архитектуры + UI + интеграции одновременно
```

---

## ВЫБРАН: P3.4 — Тесты для Core

**Цель:** Сделать Core неизменяемым ядром, к которому нельзя прикоснуться случайно.

### Что покрыть тестами

| Модуль | Тесты |
|--------|-------|
| `computeHighlight()` | Все режимы: none, selected, hover, scope, type |
| `GraphModel` | API: getNodes, getEdges, getNodeById, getNeighbors |
| `GraphModel` | computeHighlight, computeScope |
| `OwnershipGraph` | registerState, registerComputation, getDataFlowGraph |
| Инварианты | Чистота функций, отсутствие side effects |

### Критерий успеха

```
✓ Все тесты проходят
✓ Покрытие Core > 80%
✓ Любое изменение Core ломает тест, если нарушает инвариант
```

### Результат P3.4

```
 Test Files  5 passed (5)
      Tests  89 passed (89)
```

| Файл теста | Тестов |
|------------|--------|
| `highlightModel.test.js` | 31 |
| `GraphModel.test.js` | 23 |
| `OwnershipGraph.test.js` | 23 |
| Существующие UI тесты | 12 |

**Core теперь защищён тестами.**

---

## ЭТАП P3.4: Тесты для Core — ЗАВЕРШЁН

**Дата:** 12 февраля 2026  
**Commit:** `4d38626`

### Что сделано

1. **Созданы тесты для `highlightModel.js` (31 тест):**
   - Все режимы: `none`, `selected`, `hover`, `scope`, `type`
   - Приоритет режимов: scope > hover > type > selected > none
   - Интенсивности: FULL, HALF, DIM для узлов и рёбер
   - Тесты на чистоту (purity): не мутирует входные данные

2. **Созданы тесты для `GraphModel.js` (23 теста):**
   - API: `getNodes`, `getEdges`, `getNodeById`, `getNeighbors`
   - Вычисления: `computeHighlight`, `computeScope`
   - Сериализация: `toJSON`, `fromJSON`
   - Индексация по типам

3. **Созданы тесты для `OwnershipGraph.js` (23 теста):**
   - Регистрация: `registerState`, `registerProducer`, `registerConsumer`
   - Вычисления: `registerComputation`, `getDependencies`
   - Экспорт: `getDataFlowGraph`, `toJSON`, `toMarkdown`, `toASCII`

4. **Обновлена конфигурация Vitest:**
   - `vitest.config.js`: расширен `include` pattern
   - Тесты Core теперь запускаются автоматически

### Результат

```
 Test Files  5 passed (5)
      Tests  89 passed (89)
```

### Значение

- Core защищён от случайных изменений
- Инварианты зафиксированы как исполняемая спецификация
- Любое нарушение контракта ломает тест

---

## ЭТАП P3.5a: Identity & Naming — ЗАВЕРШЁН

**Дата:** 12 февраля 2026

### Что сделано

1. **Создан `core/Identity.js`:**
   - `createIdentity(id, canonicalName, options)` — создание идентичности
   - `getDisplayName(identity, locale)` — локализованное имя
   - `generateSlug(identity)` — URL-friendly версия
   - `validateIdImmutability(identity, newId)` — проверка неизменности id
   - `updateCanonicalName(identity, newName)` — обновление имени (id сохраняется)
   - `addAlias(identity, alias)` — добавление альтернативного имени
   - `matchesName(identity, name)` — поиск по любому имени
   - `extractIdentityFromNode(nodeData)` — извлечение из universe.json
   - `serializeIdentity(identity)` — сериализация для JSON

2. **Созданы тесты для Identity (33 теста):**
   - createIdentity: валидация, aliases, meta
   - getDisplayName: локализация, fallback
   - generateSlug: нормализация
   - Инварианты: id immutability, slug derivation

### Результат

```
 Test Files  6 passed (6)
      Tests  122 passed (122)
```

### Инварианты зафиксированы

```
✓ id остаётся неизменным при смене canonicalName
✓ slug — производное от canonicalName, не идентичность
✓ Projection может менять displayName без изменения identity
✓ Локализация через aliases (формат: "ru:Вова")
```

---

## АРХИТЕКТУРНАЯ ЗРЕЛОСТЬ: Что достигнуто

### Три критических достижения

**1. Инварианты стали исполняемыми**

Purity-тесты — это критично. Core теперь **детерминирован**.

```javascript
it("does not mutate input context")
it("does not mutate input graph")
it("same input produces same output")
```

**2. Приоритеты режимов зафиксированы формально**

Это уже не «логика в голове». Это формализованный порядок причинности.

```
scope > hover > type > selected > none
```

**3. Идентичность отделена от представления**

Это самое важное:

| Слой | Что хранит |
|------|------------|
| `id` | Атом (неизменяемый) |
| `canonicalName` | Свойство сущности |
| `slug` | Производное |
| `displayName` | Проекция |

### Текущий уровень зрелости

```
✓ Детерминированная вычислительная модель
✓ Формальная идентичность
✓ Приоритетная система
✓ Исполняемая спецификация (122 теста)
✓ Ownership-граф
```

Это уровень архитектуры, пригодной для:
- OWL-экспорта
- GraphRAG
- Dev-проекции
- Автоматической документации

**Но только если не сломать границы.**

---

## ЭТАП P3.5: TypeScript для Core — ЗАВЕРШЁН

**Дата:** 12 февраля 2026

### Что сделано

1. **Создан `tsconfig.json`:**
   - `strict: true` — строгая типизация
   - `noEmit: true` — только проверка типов
   - Paths alias: `@core/*` → `src/core/*`

2. **Созданы типы для Core:**

| Файл | Типы |
|------|------|
| `types/identity.d.ts` | `EntityIdentity`, `IdentityMeta`, `LocalizedName`, `CreateIdentityOptions` |
| `types/graph.d.ts` | `NodeData`, `EdgeData`, `GraphData`, `ScopeResult`, `IGraphModel` |
| `types/highlight.d.ts` | `HighlightMode`, `HighlightContext`, `HighlightState`, `NodeIntensity`, `EdgeIntensity`, `INTENSITY` |
| `types/projection.d.ts` | `RenderContext`, `IProjection`, `IProjectionRegistry`, `Projection`, `ProjectionRegistry` |
| `types/index.d.ts` | Центральный экспорт всех типов |

### Ключевые инварианты в типах

```typescript
// Identity — id readonly
interface EntityIdentity {
  readonly id: string;  // Неизменяемый
  canonicalName: string;
}

// Highlight — context readonly
interface HighlightContext {
  readonly mode: HighlightMode;
  readonly selectedNodeId: string | null;
  readonly scopeNodeIds: ReadonlySet<string>;
}

// HighlightState — immutable result
interface HighlightState {
  readonly nodes: ReadonlyMap<string, NodeIntensity>;
  readonly edges: ReadonlyMap<string, EdgeIntensity>;
}
```

### Результат

```
npx tsc --noEmit  ✓ (0 ошибок)
npx vitest run    ✓ (122 теста)
```

### Значение

- **Формализация границ кристалла**
- Невозможность утечки DOM-типа в Core
- Невозможность случайной мутации state
- Невозможность передачи неправильного типа в Projection

---

## ЭТАП P3.5b: Boundary Freeze — ЗАВЕРШЁН

**Дата:** 12 февраля 2026

### Что сделано

1. **Создан архитектурный тест `boundary.test.js` (8 тестов):**
   - Core не импортирует visitor modules
   - Core не импортирует Three.js
   - Core не импортирует React
   - Core не использует DOM globals (document, window)
   - Односторонняя зависимость Core → Projection → Visitor
   - ontology является частью Core (разрешённые импорты)
   - Crystal integrity (все модули существуют)

2. **Исправлена утечка DOM в `DevProjection.js`:**
   - Удалено использование `document.createElement`
   - DevProjection теперь возвращает данные (текст/JSON)
   - Рендеринг в DOM делает UI-адаптер (вне Core)

### Результат

```
 Test Files  7 passed (7)
      Tests  130 passed (130)
```

### Гарантии Boundary Freeze

```
✓ Core не импортирует visitor
✓ Core не импортирует Three.js
✓ Core не импортирует React
✓ Core не использует DOM (document, window)
✓ Односторонняя зависимость: Core → Projection → Renderer
✓ Если удалить visitor — Core компилируется и тесты проходят
```

### Архитектурная гравитация

```
Core → Projection → Visitor/UI

Никогда наоборот.
```

---

## ЭТАП P3.1: Интеграция Core в visitor — ЗАВЕРШЁН

**Дата:** 12 февраля 2026

### Что сделано

Интеграция уже была выполнена ранее (Маршрут G). Проверено:

1. **visitor.js импортирует из Core:**
   ```javascript
   import { computeHighlight, createContextFromState, INTENSITY } from "../ontology/highlightModel.js";
   ```

2. **Единственная точка входа `updateHighlight()`:**
   ```javascript
   function updateHighlight() {
     const context = createContextFromState({...});
     cachedHighlightState = computeHighlight(context, graphData);
     renderHighlight(cachedHighlightState);
   }
   ```

3. **`renderHighlight()` применяет state к визуалу:**
   - `highlightNodes`, `highlightLinks`, `halfHighlightLinks` — производные
   - Заполняются из `state.nodeIntensities` и `state.edgeIntensities`

4. **Нет прямых мутаций Sets:**
   - `.add()` вызовы только внутри `renderHighlight()`
   - Все изменения проходят через `updateHighlight()`

### Результат

```
 Test Files  7 passed (7)
      Tests  130 passed (130)
```

### Архитектура интеграции

```
visitor.js
    │
    ├── import { computeHighlight } from "../ontology/highlightModel.js"
    │
    ├── updateHighlight()
    │       │
    │       ├── createContextFromState(state)
    │       │
    │       ├── computeHighlight(context, graph)  ← Core
    │       │
    │       └── renderHighlight(state)
    │               │
    │               ├── highlightNodes.clear()
    │               ├── highlightLinks.clear()
    │               └── fill from state.*Intensities
    │
    └── graph.refresh()
```

### Значение

- **visitor — клиент Core**
- `computeHighlight()` — единственный источник истины
- `highlightNodes/Links` — производные от Core state
- Логика подсветки не дублируется

---

## ЭТАП P3.2/P3.3: Projections — ЗАВЕРШЁН

**Дата:** 12 февраля 2026

### Что сделано

1. **Создан `VisitorProjection.js`:**
   - Адаптер между Core и Three.js 3D-графом
   - `applyHighlight(state)` — применяет highlightState к визуалу
   - `setGraph(graph, nodesById)` — устанавливает ссылку на граф
   - `getHighlightSets()` — совместимость с существующим кодом
   - Не содержит бизнес-логики подсветки

2. **Доработан `DevProjection.js`:**
   - `renderText()` — текстовый вывод состояния
   - `exportJSON()` — JSON экспорт
   - `exportMarkdown()` — Markdown экспорт
   - Не использует DOM (Boundary Freeze)

3. **Создан `Projection.test.js` (40 тестов):**
   - Projection base class (3)
   - ProjectionRegistry (5)
   - DevProjection (14)
   - VisitorProjection (16)
   - Projection purity (2)

### Результат

```
 Test Files  8 passed (8)
      Tests  170 passed (170)
```

### Архитектура Projections

```
Core (highlightState)
    │
    ├── VisitorProjection
    │       │
    │       ├── applyHighlight(state)
    │       ├── highlightNodes/Links Sets
    │       └── graph.refresh()
    │
    └── DevProjection
            │
            ├── renderText(graphModel, context)
            ├── exportJSON(graphModel, context)
            └── exportMarkdown(graphModel, context)
```

### Значение

- **Любая новая линза берёт данные из Core**
- Visitor и Dev проекции используют один источник истины
- Архитектурная кристаллическая решётка остаётся неизменной

---

## ЭТАП P3.6: OWL-экспорт — ЗАВЕРШЁН

**Дата:** 12 февраля 2026

### Что сделано

1. **Создан `OWLProjection.js`:**
   - Адаптер между Core и OWL/RDF
   - Сериализация GraphModel → OWL-онтология
   - Identity, canonicalName, типы → OWL-классы и свойства
   - OwnershipGraph → OWL-отношения (states + computations)

2. **Реализована сериализация:**
   - `serialize("turtle")` — Turtle формат
   - `serialize("jsonld")` — JSON-LD формат
   - `serialize("ntriples")` — N-Triples формат
   - Nodes → owl:NamedIndividual
   - Edges → owl:ObjectPropertyAssertion
   - Identity → rdfs:label, skos:prefLabel, skos:altLabel

3. **Создан `OWLProjection.test.js` (57 тестов):**
   - constructor (5)
   - exportNodes/Edges/Identity/Ownership/Classes (17)
   - serialize turtle/jsonld/ntriples (16)
   - toJsonLd (3)
   - getStats (6)
   - destroy (1)
   - purity (2)
   - edge cases (4)
   - NAMESPACES (2)

### Результат

```
 Test Files  9 passed (9)
      Tests  227 passed (227)
```

### Перспективы после P3.6

- Автоматическая документация из OWL
- Интеграция с внешними онтологиями
- Экспорт для LLM-reasoning

---

## ЭТАП P3.7: GraphRAG интеграция — ЗАВЕРШЁН

**Дата:** 12 февраля 2026

### Ключевой принцип

**GraphRAG — это ещё одна проекция, а не новый Core.**

```
Core
 ├── VisitorProjection
 ├── DevProjection
 ├── OWLProjection
 └── GraphRAGProjection   ← новый слой
```

### Что сделано

1. **Создан `GraphRAGProjection.js`:**
   - `buildIndex()` — идемпотентная индексация
   - `queryByNode(id)` — структурированная выборка
   - `queryByText(text)` — токенизация + textIndex
   - `expandContext(nodeIds, depth)` — BFS расширение
   - `toLLMContext()` — экспорт для LLM
   - `getNodesByType(type)` — фильтрация по типу
   - `getNodeTypes()` — список типов

2. **Внутреннее состояние:**
   - `nodeIndex: Map<id, NodeDocument>`
   - `adjacency: Map<id, Set<neighborIds>>`
   - `textIndex: Map<token, Set<id>>`

3. **Создан `GraphRAGProjection.test.js` (51 тест):**
   - constructor (5)
   - buildIndex (8)
   - queryByNode (5)
   - queryByText (7)
   - expandContext (8)
   - toLLMContext (5)
   - getStats (3)
   - getNodesByType/getNodeTypes (3)
   - destroy (1)
   - purity (2)
   - edge cases (4)

### Результат

```
 Test Files  10 passed (10)
      Tests  278 passed (278)
```

### Перспективы после P3.7

- Cryptocosm становится reasoning-ready
- Q&A сценарии
- Self-reflection сценарии
- Анализ архитектуры через LLM
- Внешние embeddings без риска для Core

### Стратегический эффект

Если OWLProjection сделал Core «экспортируемым»,
то GraphRAG сделает его «мыслящим».

Но мыслить он должен как клиент,
а не как сердце системы.

---

## СТРАТЕГИЧЕСКАЯ ПЕРСПЕКТИВА

```
P3.4 — Тесты для Core ✓ ЗАВЕРШЁН
   │
   ▼
P3.5a — Identity & Naming ✓ ЗАВЕРШЁН
   │
   ▼
P3.5 — TypeScript для Core ✓ ЗАВЕРШЁН
   │
   ▼
P3.5b — Boundary Freeze ✓ ЗАВЕРШЁН
   │
   ▼
P3.1 — Интеграция Core в visitor ✓ ЗАВЕРШЁН
   │
   ▼
P3.2/P3.3 — Projections ✓ ЗАВЕРШЁН
   │
   │  VisitorProjection: адаптер для 3D-графа
   │  DevProjection: текст/JSON/Markdown экспорт
   │  40 тестов
   │
   ▼
P3.6 — OWL-экспорт ✓ ЗАВЕРШЁН
   │
   │  OWLProjection.js: 57 тестов
   │  Turtle, JSON-LD, N-Triples
   │
   ▼
P3.7 — GraphRAG интеграция ✓ ЗАВЕРШЁН
   │
   │  GraphRAGProjection.js: 51 тест
   │  buildIndex, queryByNode/Text, expandContext
   │  toLLMContext — экспорт для LLM
   │
   ▼
P4.x — Cryptocosm / Рефлексия ⏳ СЛЕДУЮЩИЙ
```

### Текущий статус

```
Core стабилен, типизирован, протестирован (278 тестов).
Projections реализованы и используют единый источник истины.
OWL-экспорт готов (Turtle, JSON-LD, N-Triples).
GraphRAG готов (индексация, поиск, контекст для LLM).
Архитектура кристаллическая, границы зафиксированы.

Phase 3 ЗАВЕРШЕНА. Core готов к Phase 4 — Cryptocosm / Рефлексия.
```

---

## ЭТАП P4.1: ReflectiveProjection — ЗАВЕРШЁН

**Дата:** 12 февраля 2026

### Ключевой принцип

**Рефлексия = read-only. Изменение = только через осознанное действие.**

```
Core
 ├── VisitorProjection
 ├── DevProjection
 ├── OWLProjection
 ├── GraphRAGProjection
 └── ReflectiveProjection   ← P4.1 мета-линза
```

### Что сделано

1. **Создан `ReflectiveProjection.js`:**
   - `analyzeDensity()` — плотность графа
   - `findIsolatedNodes()` — изолированные узлы
   - `findHighCentralityNodes()` — центральные узлы (degree centrality)
   - `detectOwnershipCycles()` — циклы владения
   - `mapProjectionCoverage()` — покрытие проекций
   - `getTypeDistribution()` — распределение по типам
   - `getStructuralReport()` — полный отчёт
   - `findConnectedComponents()` — компоненты связности
   - `checkConnectivity()` — проверка связности
   - `findBridges()` — мосты (критические рёбра)

2. **Создан `ReflectiveProjection.test.js` (53 теста):**
   - constructor (4)
   - analyzeDensity (7)
   - findIsolatedNodes (4)
   - findHighCentralityNodes (5)
   - detectOwnershipCycles (3)
   - mapProjectionCoverage (4)
   - getTypeDistribution (4)
   - getStructuralReport (2)
   - findConnectedComponents (4)
   - checkConnectivity (4)
   - findBridges (3)
   - getStats (2), invalidateCache (1), destroy (1)
   - purity (2), edge cases (3)

### Результат

```
 Test Files  11 passed (11)
      Tests  331 passed (331)
```

### Архитектурная схема Phase 4

```
Core
 ├── VisitorProjection
 ├── DevProjection
 ├── OWLProjection
 ├── GraphRAGProjection
 └── ReflectiveProjection      ← P4.1

NarrativeLayer                ← P4.2 (author-mind, read-only)
LLMReflectionEngine           ← P4.3 (внешний потребитель)
```

### Критическая граница

В Phase 4 появляется главный риск: смешать «анализ» и «изменение».

Если рефлексия начнёт менять Core автоматически — кристалл разрушится.

**Поэтому:**
- Рефлексия = read-only
- Изменение = только через осознанное действие

### Терминология

- **author-mind** — пульт управления для автора (абстракция)
- **extended-mind** — воркбенч Автора, архитектурно будет "кабиной" в Cryptocosm
- Пересечение смысловое, но реализация отдельная

---

## Созданные файлы Core

| Файл | Описание |
|------|----------|
| `render/src/core/GraphModel.js` | Абстрактная модель графа с API |
| `render/src/core/Projection.js` | Базовый класс проекции + реестр |
| `render/src/core/DevProjection.js` | Прототип dev-линзы |
| `render/src/core/OwnershipGraph.js` | Граф владения состоянием |
| `render/src/core/Identity.js` | Формализация идентичности сущностей |
| `render/src/core/index.js` | Экспорты Core |
| `render/src/core/test-crystal.js` | Crystal Test (Node.js) |
| `render/src/core/__tests__/highlightModel.test.js` | Тесты highlightModel (31) |
| `render/src/core/__tests__/GraphModel.test.js` | Тесты GraphModel (23) |
| `render/src/core/__tests__/OwnershipGraph.test.js` | Тесты OwnershipGraph (23) |
| `render/src/core/__tests__/Identity.test.js` | Тесты Identity (33) |
| `render/src/core/__tests__/boundary.test.js` | Тесты Boundary Freeze (8) |
| `render/src/core/types/identity.d.ts` | Типы Identity |
| `render/src/core/types/graph.d.ts` | Типы GraphModel |
| `render/src/core/types/highlight.d.ts` | Типы Highlight |
| `render/src/core/types/projection.d.ts` | Типы Projection |
| `render/src/core/types/index.d.ts` | Центральный экспорт типов |
| `render/src/core/VisitorProjection.js` | Адаптер для 3D-графа |
| `render/src/core/__tests__/Projection.test.js` | Тесты Projections (40) |
| `render/src/core/OWLProjection.js` | OWL/RDF экспорт |
| `render/src/core/__tests__/OWLProjection.test.js` | Тесты OWL-экспорта (57) |
| `render/src/core/GraphRAGProjection.js` | GraphRAG индексация и поиск |
| `render/src/core/__tests__/GraphRAGProjection.test.js` | Тесты GraphRAG (51) |
| `render/src/core/ReflectiveProjection.js` | Мета-линза для рефлексии |
| `render/src/core/__tests__/ReflectiveProjection.test.js` | Тесты ReflectiveProjection (53) |
| `render/src/ontology/highlightModel.js` | Чистая модель подсветки |
| `render/tsconfig.json` | Конфигурация TypeScript |

### GraphModel API

```javascript
// Доступ к данным
getNodes()
getEdges()
getNodeById(nodeId)
getNeighbors(nodeId)
getNodesByType(type)
getNodeTypes()

// Вычисления
computeHighlight(context)
computeScope(hubId)
getRelatedNodeIdsByType(nodeId, type)

// Сериализация
toJSON()
static fromJSON(json)
```

### DevProjection API

```javascript
// Рендеринг
init(container)
render(graphModel, context)
updateHighlight(highlightState)
destroy()

// Экспорт
exportJSON(graphModel, context)
exportMarkdown(graphModel, context)
```
