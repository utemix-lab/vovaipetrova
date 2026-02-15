# Epistemic Operators API

> Track 3 — Как действует система

## Обзор

Операторы — это способы работы со знанием, а не само знание. Они не создают узлы графа, а порождают временные взгляды на данные.

```
┌─────────────────────────────────────────────────────────────────────┐
│                         GRAPH (Track 1)                             │
│                    Узлы, связи, онтология                           │
└─────────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   OPERATORS     │ │   PROJECTIONS   │ │   CATALOGS      │
│   (Track 3)     │ │   (Track 4)     │ │   (World data)  │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

## Быстрый старт

```javascript
import { MeaningEngine, WorldAdapter } from "meaning-engine";

// Мир с каталогами
const world = {
  getSchema: () => schema,
  getGraph: () => graph,
  getCatalogs: () => ({
    tools: {
      id: "tools",
      entries: [
        { id: "vscode", name: "VS Code", tags: ["editor", "free"] },
        { id: "cursor", name: "Cursor", tags: ["editor", "ai"] },
      ],
    },
  }),
};

const engine = new MeaningEngine(world);

// Проецировать каталог через узел
const entries = engine.project("musician", "tools");

// Фильтровать результаты
const filtered = engine.filter(entries, { tags: "ai" });

// Или за один вызов
const result = engine.projectAndFilter("musician", "tools", { tags: "ai" });
```

---

## Классы

### MeaningEngine (расширение)

#### Методы каталогов

| Метод | Описание |
|-------|----------|
| `hasCatalogs()` | Проверяет, есть ли каталоги в мире |
| `getCatalogs()` | Возвращает `CatalogRegistry` или `null` |
| `hasOperators()` | Проверяет, доступны ли операторы |
| `getOperators()` | Возвращает `OperatorEngine` или `null` |

#### Shortcut-методы

| Метод | Описание |
|-------|----------|
| `project(nodeId, catalogId, options?)` | Проецирует каталог через узел |
| `filter(entries, predicate)` | Фильтрует записи |
| `projectAndFilter(nodeId, catalogId, predicate, options?)` | Композиция project + filter |

---

### CatalogRegistry

Реестр каталогов с индексацией записей.

```javascript
import { CatalogRegistry } from "meaning-engine";

const registry = new CatalogRegistry({
  tools: { id: "tools", entries: [...] },
});
```

#### Методы

| Метод | Описание |
|-------|----------|
| `load(catalogId, catalog)` | Загружает один каталог |
| `loadAll(catalogs)` | Загружает все каталоги |
| `has(catalogId)` | Проверяет существование каталога |
| `get(catalogId)` | Возвращает каталог или `null` |
| `getEntries(catalogId)` | Возвращает все записи каталога |
| `getEntry(catalogId, entryId)` | Возвращает запись или `null` |
| `getEntriesByIds(catalogId, entryIds)` | Возвращает записи по списку ID |
| `filter(catalogId, predicate)` | Фильтрует записи по функции |
| `filterByAttrs(catalogId, attrs)` | Фильтрует по атрибутам |
| `filterByTags(catalogId, tags, mode?)` | Фильтрует по тегам |
| `getCatalogIds()` | Возвращает список ID каталогов |
| `size` | Количество каталогов |
| `getStats()` | Статистика реестра |
| `clear()` | Очищает реестр |

---

### OperatorEngine

Движок эпистемических операторов.

```javascript
import { OperatorEngine, CatalogRegistry } from "meaning-engine";

const registry = new CatalogRegistry(catalogs);
const engine = new OperatorEngine(graph, registry);
```

#### Операторы

##### PROJECT

Проецирует каталог через узел графа.

```javascript
const entries = engine.project("nodeId", "catalogId", {
  useRefs: true,   // использовать catalogRefs (default: true)
  useTags: true,   // использовать теги узла (default: true)
  tagMode: "any",  // "any" или "all" (default: "any")
});
```

Источники данных:
- `catalogRefs` — явные ссылки на записи
- `tags` — теги узла
- `pointerTags` — pointer-tags (`cap:X` → `X`)

##### FILTER

Фильтрует записи по предикату.

```javascript
// Функция-предикат
const filtered = engine.filter(entries, e => e.year >= 2020);

// Объект атрибутов
const filtered = engine.filter(entries, { year: 2020 });

// С операторами сравнения
const filtered = engine.filter(entries, { 
  year: { $gte: 2020 },
  tags: { $contains: "free" },
});
```

Операторы:
| Оператор | Описание |
|----------|----------|
| `$gt` | Больше |
| `$gte` | Больше или равно |
| `$lt` | Меньше |
| `$lte` | Меньше или равно |
| `$ne` | Не равно |
| `$in` | Входит в список |
| `$nin` | Не входит в список |
| `$contains` | Массив содержит значение |

##### EXPAND

Разворачивает связи узла на указанную глубину.

```javascript
const neighborIds = engine.expand("nodeId", 2); // глубина 2
```

##### INTERSECT

Пересечение двух наборов записей.

```javascript
const common = engine.intersect(entries1, entries2);
```

##### UNION

Объединение двух наборов записей (без дубликатов).

```javascript
const all = engine.union(entries1, entries2);
```

#### Композиция

```javascript
// Project + Filter
const entries = engine.projectAndFilter("nodeId", "catalogId", { tags: "ai" });

// Project через несколько узлов
const entries = engine.projectMultiple(["node1", "node2"], "catalogId");
```

---

### CatalogLoader

Загрузчик каталогов из файлов.

```javascript
import { CatalogLoader } from "meaning-engine";

// Из объекта реестра
const catalogs = CatalogLoader.load(registry, {
  loadFile: (path) => JSON.parse(fs.readFileSync(path)),
  basePath: "/world",
});

// Асинхронно
const catalogs = await CatalogLoader.loadAsync(registry, {
  loadFileAsync: async (path) => await fetch(path).then(r => r.json()),
  basePath: "/api",
});

// С валидацией
const catalogs = CatalogLoader.loadAndValidate(registry, options);
```

---

### CatalogValidator

Валидатор каталогов.

```javascript
import { CatalogValidator } from "meaning-engine";

// Валидация реестра
const result = CatalogValidator.validate(catalogs);
// { valid: boolean, errors: string[] }

// Валидация catalogRefs в графе
const result = CatalogValidator.validateCatalogRefs(graph, catalogs);
// { valid: boolean, errors: string[], warnings: string[] }

// Проверка существования
CatalogValidator.hasCatalog(catalogs, "tools"); // boolean
CatalogValidator.hasEntry(catalogs, "tools", "vscode"); // boolean
```

---

## Структура каталога

```json
{
  "id": "tools",
  "version": "1.0.0",
  "description": "Инструменты разработки",
  "schema": {
    "name": "string",
    "type": "string",
    "tags": "string[]"
  },
  "entries": [
    { "id": "vscode", "name": "VS Code", "type": "ide", "tags": ["editor", "free"] },
    { "id": "cursor", "name": "Cursor", "type": "ide", "tags": ["editor", "ai"] }
  ]
}
```

## Структура catalogs.json

```json
{
  "version": "1.0.0",
  "description": "Каталоги мира",
  "catalogs": {
    "tools": "./catalogs/tools.json",
    "ai": {
      "id": "ai",
      "entries": [...]
    }
  }
}
```

---

## Ключевые принципы

1. **Операторы не создают узлы** — результат ≠ новый узел графа
2. **Каталоги вне графа** — изменение каталога не меняет структуру графа
3. **Pointer-tags как ключи** — `cap:X` → фильтр по тегу X
4. **Граф остаётся маленьким** — только мета-сущности

---

## TypeScript

```typescript
import type { 
  Catalog, 
  CatalogEntry, 
  CatalogRefs,
  ProjectOptions,
  FilterPredicate,
  FilterOperators,
} from "meaning-engine/types";
```

---

## См. также

- `docs/OPERATORS_CONCEPT.md` — концепция операторов
- `docs/ARCHITECTURE_TRACKS.md` — архитектурные треки
- `STATUS.md` — текущий статус проекта
