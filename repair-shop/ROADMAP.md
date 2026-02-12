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
P4.1 — ReflectiveProjection ✓ ЗАВЕРШЁН
   │
   │  Мета-линза для рефлексии: 53 теста
   │  analyzeDensity, findIsolatedNodes, findHighCentralityNodes
   │  detectOwnershipCycles, mapProjectionCoverage
   │  findConnectedComponents, checkConnectivity, findBridges
   │
   ▼
P4.2a — Canonical Schema Definition ✓ ЗАВЕРШЁН
   │
   │  NODE_TYPES (9), EDGE_TYPES (7)
   │  SchemaValidator, SCHEMA_VERSION 1.0.0
   │  62 теста
   │
   ▼
P4.2b — Structural Invariants ✓ ЗАВЕРШЁН
   │
   │  16 инвариантов: Graph, Identity, Edge, Connectivity, Hierarchy
   │  InvariantChecker, STRICTNESS
   │  57 тестов
   │
   ▼
P4.2c — Versioned Snapshots ✓ ЗАВЕРШЁН
   │
   │  GraphSnapshot, SnapshotHistory
   │  diffSnapshots, CHANGE_TYPE
   │  62 теста
   │
   ▼
P4.2d — Performance Audit ✓ ЗАВЕРШЁН
   │
   │  SyntheticGraphGenerator, PerformanceAuditor
   │  benchmark, analyzeScalability
   │  42 теста
   │
   ▼
P4.2e — Change Protocol ✓ ЗАВЕРШЁН
   │
   │  ChangeProtocol, ProposalValidator
   │  propose → validate → simulate → apply
   │  48 тестов
   │
   ▼
P4.2f — Ontology Alignment
   │
   │  Mapping к внешним онтологиям
   │  OWL reasoning
   │
   ▼
P4.3 — NarrativeLayer (отложен)
   │
   │  author-mind (read-only)
   │  Генерация нарратива из GraphRAG + Reflective
   │  Требует: структурная самодостаточность,
   │  инвариантная защита, версионирование
   │
   ▼
P4.4 — LLMReflectionEngine
   │
   │  Внешний потребитель toLLMContext()
   │  Q&A, self-reflection, анализ архитектуры
```

### Текущий статус

```
P5.0 Separation ЗАВЕРШЁН.
MeaningEngine = абстрактная платформа.
VovaIPetrova = первый плагин (мир владеет типами).
Граница Engine ↔ World реальна, не декларативна.

Всего: 808 тестов (152 engine + 656 render).
```

---

## ЭТАП P4.2: Шлифовка кристалла — ПЛАН

**Принцип:** Phase 3 дала функциональность. P4.1 дал рефлексию. Теперь время шлифовки.

### P4.2a — Canonical Schema Definition ✓ ЗАВЕРШЁН

**Дата:** 12 февраля 2026

**Цель:** Зафиксировать контракт до больших расширений.

**Что сделано:**

1. **`CanonicalGraphSchema.js`:**
   - `NODE_TYPES` — 9 типов узлов (root, hub, character, domain, workbench, collab, subdomain, artifact, concept)
   - `NODE_TYPE_META` — метаданные типов (description, abstraction, role, allowedChildren, requiredFields)
   - `EDGE_TYPES` — 7 типов рёбер (structural, contains, relates, owns, depends, influences, collaborates)
   - `EDGE_TYPE_META` — метаданные рёбер (description, directed, allowedSourceTypes, allowedTargetTypes)
   - `VISIBILITY` — public, private, hidden
   - `STATUS` — core, expandable, draft, archived
   - `IDENTITY_REQUIRED_FIELDS` — id
   - `IDENTITY_RECOMMENDED_FIELDS` — label, canonicalName, aliases, slug
   - `SchemaValidator` — валидация узлов, рёбер, графа
   - `SCHEMA_VERSION` — 1.0.0

2. **`CanonicalGraphSchema.test.js` (62 теста):**
   - NODE_TYPES (4)
   - NODE_TYPE_META (5)
   - EDGE_TYPES (3)
   - EDGE_TYPE_META (4)
   - VISIBILITY (2)
   - STATUS (2)
   - IDENTITY_REQUIRED_FIELDS (2)
   - IDENTITY_RECOMMENDED_FIELDS (2)
   - SchemaValidator.validateNode (10)
   - SchemaValidator.validateEdge (10)
   - SchemaValidator.validateGraph (8)
   - SchemaValidator.getSchemaStats (3)
   - SchemaValidator.reset (1)
   - SCHEMA_VERSION (2)
   - SCHEMA_META (4)
   - Integration (2)

**Результат:** `CanonicalGraphSchema v1.0.0` — 393 теста (все прошли)

### P4.2b — Structural Invariants ✓ ЗАВЕРШЁН

**Дата:** 12 февраля 2026

**Цель:** Математика кристалла — гарантии структуры.

**Что сделано:**

1. **`StructuralInvariants.js`:**
   - **Graph Invariants (INV-G1 to INV-G4):**
     - `checkUniqueNodeIds` — уникальность ID узлов
     - `checkUniqueEdgeIds` — уникальность ID рёбер
     - `checkNoDanglingEdges` — нет висящих рёбер
     - `checkNoSelfLoops` — нет петель
   - **Identity Invariants (INV-I1 to INV-I4):**
     - `checkAllNodesHaveId` — все узлы имеют ID
     - `checkAllNodesHaveType` — все узлы имеют тип
     - `checkKnownNodeTypes` — типы известны схеме
     - `checkAllNodesHaveLabel` — все узлы имеют label
   - **Edge Invariants (INV-E1 to INV-E3):**
     - `checkAllEdgesHaveType` — все рёбра имеют тип
     - `checkKnownEdgeTypes` — типы известны схеме
     - `checkNoDuplicateEdges` — нет дубликатов
   - **Connectivity Invariants (INV-C1 to INV-C3):**
     - `checkGraphConnected` — граф связен
     - `checkNoIsolatedNodes` — нет изолированных узлов
     - `checkHasRootNode` — есть корневой узел
   - **Hierarchy Invariants (INV-H1 to INV-H2):**
     - `checkNoContainsCycles` — нет циклов в contains
     - `checkSingleParent` — один родитель в contains
   - **InvariantChecker:**
     - `checkAll(graphData, strictness)` — проверка всех
     - `checkOne(invariantName, graphData)` — проверка одного
     - `listInvariants()` — список всех инвариантов
   - **STRICTNESS:** MINIMAL (5), STANDARD (8), STRICT (16)

2. **`StructuralInvariants.test.js` (57 тестов):**
   - INV-G1 to INV-G4 (12)
   - INV-I1 to INV-I4 (10)
   - INV-E1 to INV-E3 (8)
   - INV-C1 to INV-C3 (8)
   - INV-H1 to INV-H2 (6)
   - InvariantChecker (11)
   - Integration (2)

**Результат:** `InvariantChecker v1` — 450 тестов (все прошли)

### P4.2c — Versioned Snapshots ✓ ЗАВЕРШЁН

**Дата:** 12 февраля 2026

**Цель:** Версионирование графа — рефлексия во времени.

**Что сделано:**

1. **`GraphSnapshot.js`:**
   - **GraphSnapshot** — неизменяемый снимок состояния графа:
     - `getNodeById(id)`, `getEdgeById(id)` — доступ к данным
     - `getNodeIds()`, `getEdgeIds()` — множества ID
     - `hasNode(id)`, `hasEdge(id)` — проверка наличия
     - `getStats()` — статистика снапшота
     - `toJSON()`, `fromJSON()` — сериализация
   - **diffSnapshots(before, after)** — сравнение снапшотов:
     - `nodes.added`, `nodes.removed`, `nodes.modified`
     - `edges.added`, `edges.removed`, `edges.modified`
     - `summary` — итоговая статистика изменений
   - **SnapshotHistory** — история снапшотов:
     - `add(snapshot)` — добавить снапшот
     - `getById(id)`, `getLatest()`, `getFirst()` — доступ
     - `diff(beforeId, afterId)` — сравнение по ID
     - `diffRange(from, to)` — последовательные diff'ы
     - `getFullEvolution()` — от первого до последнего
     - `toJSON()`, `fromJSON()` — сериализация
   - **CHANGE_TYPE:** ADDED, REMOVED, MODIFIED
   - **SNAPSHOT_VERSION:** 1.0.0

2. **`GraphSnapshot.test.js` (62 теста):**
   - SNAPSHOT_VERSION (2)
   - CHANGE_TYPE (2)
   - GraphSnapshot.constructor (12)
   - GraphSnapshot.accessors (8)
   - GraphSnapshot.getStats (4)
   - GraphSnapshot.serialization (3)
   - diffSnapshots.no_changes (1)
   - diffSnapshots.added/removed/modified nodes (3)
   - diffSnapshots.added/removed/modified edges (3)
   - diffSnapshots.summary (2)
   - diffSnapshots.deep_comparison (2)
   - SnapshotHistory (18)
   - Integration (2)

**Результат:** `GraphSnapshot v1.0.0` — 512 тестов (все прошли)

### P4.2d — Performance Audit ✓ ЗАВЕРШЁН

**Дата:** 12 февраля 2026

**Цель:** Предсказуемость роста — инструменты для нагрузочного тестирования.

**Что сделано:**

1. **`PerformanceAudit.js`:**
   - **SyntheticGraphGenerator** — генератор синтетических графов:
     - Детерминированная генерация (seed)
     - Настраиваемые параметры: nodeCount, edgeDensity
     - Автоматическая иерархия (root → hubs → nodes)
     - `generate()`, `generateSeries(sizes)`
   - **benchmark(fn, iterations)** — измерение времени выполнения
   - **benchmarkAsync(fn, iterations)** — для async функций
   - **PerformanceAuditor** — аудитор производительности:
     - `run(operation, size, fn)` — запуск бенчмарка
     - `setThreshold(key, ms)` — установка порогов
     - `getReport()`, `getTextReport()` — отчёты
   - **analyzeScalability(dataPoints)** — анализ сложности O(n), O(n²)
   - **formatTime(ms)**, **formatSize(bytes)** — форматирование

2. **`PerformanceAudit.test.js` (42 теста):**
   - SyntheticGraphGenerator (16)
   - benchmark / benchmarkAsync (3)
   - formatTime / formatSize (6)
   - PerformanceAuditor (8)
   - analyzeScalability (3)
   - Integration: Real benchmarks (4)
   - Stress test: Medium graphs (2)

**Результат:** `PerformanceAudit v1` — 554 теста (все прошли)

### P4.2e — Change Protocol ✓ ЗАВЕРШЁН

**Дата:** 12 февраля 2026

**Цель:** Управляемая эволюция — изменение как протокол, а не операция.

**Что сделано:**

1. **`ChangeProtocol.js`:**
   - **MUTATION_TYPE:** ADD_NODE, REMOVE_NODE, UPDATE_NODE, ADD_EDGE, REMOVE_EDGE, UPDATE_EDGE, BATCH
   - **AUTHOR_TYPE:** HUMAN, LLM, SYSTEM
   - **PROPOSAL_STATUS:** PENDING, VALIDATED, REJECTED, APPLIED, SIMULATED
   - **createProposal(options)** — создание предложения мутации
   - **ProposalValidator:**
     - `validate(proposal, graph)` — валидация против схемы и инвариантов
     - Симуляция применения перед валидацией
   - **ChangeProtocol:**
     - `proposeAddNode`, `proposeRemoveNode`, `proposeUpdateNode` — хелперы
     - `proposeAddEdge`, `proposeRemoveEdge`, `proposeBatch`
     - `validate(proposal)` — валидация с обновлением статуса
     - `simulate(proposal)` — dry-run без изменения состояния
     - `apply(proposal)` — применение с созданием snapshot и diff
     - `getHistory()`, `getSnapshots()`, `getStats()`, `exportHistory()`

2. **`ChangeProtocol.test.js` (48 тестов):**
   - MUTATION_TYPE, AUTHOR_TYPE, PROPOSAL_STATUS (4)
   - createProposal (6)
   - ProposalValidator (13)
   - ChangeProtocol (23)
   - Integration: LLM workflow (2)

**Результат:** `ChangeProtocol v1` — 602 теста (все прошли)

**Ключевой workflow:**
```javascript
LLM создаёт proposal → simulate (dry-run) → человек видит diff → apply
```

### P4.2f — Ontology Alignment

**Цель:** Усиление интеллектуальной части без LLM.

**Содержание:**
- Mapping к внешним онтологиям
- Проверка логической непротиворечивости
- OWL reasoning через стандартные reasoner'ы

**Результат:** Интеграция с OWL reasoner

### P4.4 — LLMReflectionEngine ✓ ЗАВЕРШЁН

**Дата:** 12 февраля 2026

**Цель:** Внешний оркестратор архитектурного мышления — замкнутый цикл рефлексии.

**Принцип:**
- LLMReflectionEngine — внешний слой, НЕ часть Core
- Читает Core через проекции
- Генерирует контекст для LLM
- Преобразует ответы LLM в proposals
- Передаёт proposals в ChangeProtocol (simulate only)
- **Никогда не применяет изменения автоматически**

**Что сделано:**

1. **`LLMReflectionEngine.js`:**
   - **ENGINE_MODE:** ANALYSIS, SUGGESTION, REVIEW
   - **PROMPT_TYPE:** analyzeStructure, detectWeaknesses, suggestImprovements, reviewProposal
   - **ContextAssembler:**
     - `assemble()` — полный контекст (structure, metrics, invariants, schema)
     - `assembleMinimal()` — минимальный контекст
   - **PromptBuilder:**
     - Типизированные промпты для каждого режима
     - Строгий JSON формат ответов
   - **SuggestionParser:**
     - `parseSuggestions()` — валидация и нормализация
     - `parseAnalysis()`, `parseReview()`
     - Отклонение невалидных ответов
   - **LLMReflectionEngine (Orchestrator):**
     - `analyzeStructure()` — MODE 1: Analysis Only
     - `suggestImprovements()` — MODE 2: Suggestion Mode
     - `reviewProposal()` — MODE 3: Proposal Review
     - `getContext()`, `getStats()`, `getHistory()`

2. **`LLMReflectionEngine.test.js` (54 теста):**
   - ENGINE_MODE, PROMPT_TYPE (3)
   - ContextAssembler (7)
   - PromptBuilder (6)
   - SuggestionParser (13)
   - LLMReflectionEngine (18)
   - Boundary: No mutation without apply (6)
   - Integration: Full workflow (1)

**Ключевой workflow:**
```javascript
// 1. LLM анализирует структуру
const analysis = await engine.analyzeStructure();

// 2. LLM предлагает улучшения
const suggestions = await engine.suggestImprovements();

// 3. Каждое предложение симулируется
suggestions.forEach(s => console.log(s.simulation.diff));

// 4. Человек видит diff и принимает решение
// apply() вызывается только человеком
```

**Результат:** `LLMReflectionEngine v1` — 656 тестов (все прошли)

**Архитектурный результат:**
```
Система → анализирует себя → формулирует гипотезы → 
предлагает изменения → симулирует последствия → ждёт решения
```

### P4.3 — NarrativeLayer (отложен)

**Причина отложения:** Хороший нарратив должен описывать устойчивую структуру.

**Требования до реализации:**
- Структурная самодостаточность (P4.2a) ✓
- Инвариантная защита (P4.2b) ✓
- Версионирование (P4.2c) ✓
- Управляемая эволюция (P4.2e) ✓
- LLM-рефлексия (P4.4) ✓

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
| `render/src/core/CanonicalGraphSchema.js` | Каноническая схема графа v1 |
| `render/src/core/__tests__/CanonicalGraphSchema.test.js` | Тесты схемы (62) |
| `render/src/core/StructuralInvariants.js` | Инварианты структуры графа |
| `render/src/core/__tests__/StructuralInvariants.test.js` | Тесты инвариантов (57) |
| `render/src/core/GraphSnapshot.js` | Версионирование графа |
| `render/src/core/__tests__/GraphSnapshot.test.js` | Тесты снапшотов (62) |
| `render/src/core/PerformanceAudit.js` | Нагрузочное тестирование |
| `render/src/core/__tests__/PerformanceAudit.test.js` | Тесты бенчмарков (42) |
| `render/src/core/ChangeProtocol.js` | Управляемая эволюция графа |
| `render/src/core/__tests__/ChangeProtocol.test.js` | Тесты протокола (48) |
| `render/src/core/LLMReflectionEngine.js` | Внешний оркестратор LLM-рефлексии |
| `render/src/core/__tests__/LLMReflectionEngine.test.js` | Тесты LLM-рефлексии (54) |
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

---

## ЭТАП P5.0: Separation — MeaningEngine vs SemanticWorld ✓ ЗАВЕРШЁН

**Дата:** 13 февраля 2026
**Branch:** `p5-separation`
**Tag до:** `v0.4.4-before-separation`

### Суть изменения

```
До P5.0:
  Core владел онтологией (NODE_TYPES захардкожены)
  Мир = встроенная реальность

После P5.0:
  Мир владеет типами (worlds/vovaipetrova/schema.json)
  Engine = абстрактная платформа
  VovaIPetrova = первый плагин
```

### Архитектура

```
MeaningEngine (platform)
        ↑
   WorldAdapter
        ↑
   World Package
        ↑
       UI
```

### Шаги P5.0

| Шаг | Описание | Commit | Тестов |
|-----|----------|--------|--------|
| P5.0a | Структура `/engine` и `/worlds` | `c887f6a` | — |
| P5.0a.1 | Engine ↔ World Contract | `37a0b52` | 35 |
| P5.0b | Schema class | `885db45` | 58 |
| P5.0c.1 | Копия типов в world | `9286c31` | — |
| P5.0c.2 | Thin-wrapper | `d39b119` | — |
| P5.0d | WorldAdapter | `b2d3bff` | 31 |
| P5.0e | MeaningEngine | `a07370b` | 28 |

### Созданные файлы Engine

| Файл | Описание |
|------|----------|
| `engine/src/WorldInterface.js` | Контракт Engine ↔ World (35 тестов) |
| `engine/src/Schema.js` | Абстрактная схема (58 тестов) |
| `engine/src/WorldAdapter.js` | Адаптер мира (31 тест) |
| `engine/src/index.js` | MeaningEngine (28 тестов) |
| `engine/WORLD_CONTRACT.md` | Формальный контракт |
| `engine/README.md` | Документация Engine |

### Созданные файлы World

| Файл | Описание |
|------|----------|
| `worlds/vovaipetrova/schema.json` | Типы узлов и рёбер |
| `worlds/vovaipetrova/seed.json` | Начальные данные |
| `worlds/vovaipetrova/world.md` | Философия мира |
| `worlds/vovaipetrova/README.md` | Документация мира |

### Изменённые файлы render

| Файл | Изменение |
|------|-----------|
| `render/src/core/CanonicalGraphSchema.js` | Thin-wrapper (импорт из WorldSchemaLoader) |
| `render/src/core/WorldSchemaLoader.js` | Загрузчик world schema |

### Критерий успеха

```javascript
// Любой мир может быть подключён
const spaceWorld = WorldAdapter.fromJSON({
  name: "space-world",
  nodeTypes: [
    { id: "galaxy", label: "Galaxy" },
    { id: "star", label: "Star" },
  ],
  edgeTypes: [
    { id: "orbits", label: "Orbits" },
  ],
}, spaceSeed);

const engine = new MeaningEngine(spaceWorld);

// Engine работает без знания о "galaxy" или "star"
engine.isValidNodeType("galaxy");  // true
engine.isValidNodeType("character"); // false
```

### Архитектурный эффект

- **Multi-world архитектура возможна**
- **Engine не знает конкретных типов**
- **Мир инжектируется через адаптер**
- **Граница реальна, не декларативна**

### Тесты

| Пакет | Тестов |
|-------|--------|
| engine | 152 |
| render | 656 |
| **Всего** | **808** |

### Следующие возможности

- Multi-world UI
- World versioning
- Engine API стабилизация
- Plugin loader
- `npm install meaning-engine`
