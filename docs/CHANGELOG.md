# Changelog

> История развития системы для понимания эволюции проекта.
> Проект не статичен и не завершён — это живая система.

---

## [11 февраля 2026] Формальная модель онтологии (Digital Twin)

### Изменения
- **Схема онтологии** (`render/src/ontology/schema/`)
  - `core.ts` — базовые типы: NodeId, OntologyNodeType, EdgeType, BaseNode, Edge, Graph
  - `entities.ts` — сущности: RootNode, HubNode, CharacterNode, DomainNode, WorkbenchNode, CollabNode
  - `tools.ts` — инструменты: Practice, Mode, Filter, Lens + ToolCatalog
  - `relations.ts` — семантика связей + правила валидации

- **Registry** (`render/src/ontology/registry/`)
  - Типизированный доступ к данным графа
  - Валидация при загрузке
  - Проверка инвариантов онтологии

- **Архитектурные правила** (`render/src/ontology/rules/`)
  - `architectural.ts` — правила отображения узлов и связей в UI
  - `constraints.ts` — иерархия и инварианты
  - `config-generator.ts` — генерация конфигурации из правил

- **Загрузчик инструментов** (`render/src/ontology/tools/`)
  - `ToolCatalogLoader.ts` — типизированная загрузка практик
  - Функции: `getPracticeById`, `getPracticesByTag`, `getPracticesByDomain`

- **Очистка данных**
  - Удалены practice-узлы из `universe.json` (48 узлов, 82 связи)
  - Создан каталог `tools/practices.json` (14 практик)

### Консоль при загрузке
```
[Ontology] Граф валиден ✓
[Ontology] Registry: 48 узлов, 82 связей
[Ontology] Инварианты соблюдены ✓
[Tools] Загружено практик: 14
```

### Commits
- `06bc316` — Формальная модель онтологии
- `91553fe` — Архитектурные правила
- `88422e2` — Проверка инвариантов
- `f781aae` — Загрузчик каталога инструментов

---

## [Февраль 2026] Унификация типов и разделение онтологии

### Изменения
- **Разделение онтологии и инструментов**
  - `practice` удалён из `nodeTypes`
  - Создан `VISUAL_CONFIG.tools` для инструментов
  - Практики — первый тип инструментов, будут режимы, модусы, фильтры

- **Унификация шаблонов страниц**
  - Принцип: 1 тип узла = 1 шаблон
  - Добавлены: `updateStoryWithCollab`, `updateStoryWithHub`, `updateStoryWithRoot`
  - Документация в visitor.js обновлена

- **UX-улучшения**
  - Унифицирована подсветка рамки корневых виджетов при hover
  - Начальный масштаб камеры — средний (340)

- **Инфраструктура автора**
  - Создана папка `author/` для оператора
  - `ontology-map.md` — человекочитаемая карта графа

### Файлы
- `render/src/visual/config.js` — nodeTypes + tools
- `render/src/scenes/visitor.js` — шаблоны и подсветка
- `render/src/graph/three-graph-engine.js` — начальный масштаб
- `author/ontology-map.md` — новый файл

---

## [Январь 2026] React-интеграция (30 шагов)

### Изменения
- **React-обёртка графа**
  - Точка входа: App + GraphScene
  - Совместимость с Vite сборкой
  - Минимальный стейт (selectedNode)

- **Абстракция GraphEngine**
  - Интерфейс `IGraphEngine`
  - `ThreeGraphEngine` — реализация на Three.js
  - Базовые события и управление фокусом

- **Декларативный UI-слой**
  - Панели Story/System/Service в React
  - Framer Motion анимации
  - Lever-режим, preview, query-mode

- **Query Mode**
  - Каталоги практик с pointer-тегами
  - Внутренняя навигация по категориям

### Файлы
- `render/src/graph/three-graph-engine.js` — новый модуль
- `render/src/architecture/dna.ts` — @ArchProto аннотации
- Панели React в `render/src/components/`

### Документация
- `docs/archive/REFACTOR_EXECUTION_PLAN.md` — выполненный план (30 шагов ✅)
- `docs/archive/REFACTOR_PLAN.md` — исходный замысел

---

## [До React] Базовый граф

### Состояние
- Three.js визуализация (3d-force-graph)
- Монолитный `visitor.js` (~4000 строк)
- Императивное управление DOM
- JSON-маршруты для навигации

### Архитектура
- Узлы: root, hub, character, domain, practice, workbench, collab
- Связи: structural, contains, relates
- Панели: Story, System, Service

---

## Принципы ведения Changelog

1. **Хронология** — от нового к старому
2. **Контекст** — зачем, не только что
3. **Файлы** — какие модули затронуты
4. **Связи** — ссылки на документацию
