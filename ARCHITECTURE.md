# Architecture v0.5.0

**Дата:** 13 февраля 2026
**Tag:** `v0.5.0-separation`

---

## Ключевой принцип

```
Engine не знает конкретных типов.
Мир инжектируется через адаптер.
Граница реальна, не декларативна.
```

---

## Архитектурная диаграмма

```
┌─────────────────────────────────────────────────────────────────────┐
│                         MeaningEngine                               │
│                    (универсальная платформа)                        │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                        engine/src/                            │  │
│  │                                                               │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌───────────────┐  │  │
│  │  │ WorldInterface  │  │     Schema      │  │  WorldAdapter │  │  │
│  │  │   (контракт)    │  │   (абстракт)    │  │   (адаптер)   │  │  │
│  │  │                 │  │                 │  │               │  │  │
│  │  │ - getSchema()   │  │ - nodeTypes     │  │ - fromJSON()  │  │  │
│  │  │ - getGraph()    │  │ - edgeTypes     │  │ - empty()     │  │  │
│  │  │                 │  │ - validate()    │  │ - minimal()   │  │  │
│  │  └─────────────────┘  └─────────────────┘  └───────────────┘  │  │
│  │                              │                                │  │
│  │                              ▼                                │  │
│  │                    ┌─────────────────┐                        │  │
│  │                    │  MeaningEngine  │                        │  │
│  │                    │                 │                        │  │
│  │                    │ - getSchema()   │                        │  │
│  │                    │ - getGraph()    │                        │  │
│  │                    │ - validateNode()│                        │  │
│  │                    │ - getStats()    │                        │  │
│  │                    └─────────────────┘                        │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  Tests: 152                                                         │
└─────────────────────────────────────────────────────────────────────┘
                                 ↑
                         WorldInterface
                           (контракт)
                                 ↑
┌─────────────────────────────────────────────────────────────────────┐
│                      worlds/vovaipetrova                            │
│                        (первый плагин)                              │
│                                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐  │
│  │   schema.json   │  │    seed.json    │  │      world.md       │  │
│  │                 │  │                 │  │                     │  │
│  │ nodeTypes:      │  │ nodes: []       │  │ Философия мира      │  │
│  │ - root          │  │ edges: []       │  │ VovaIPetrova        │  │
│  │ - hub           │  │                 │  │                     │  │
│  │ - character     │  │                 │  │                     │  │
│  │ - domain        │  │                 │  │                     │  │
│  │ - workbench     │  │                 │  │                     │  │
│  │ - collab        │  │                 │  │                     │  │
│  │ - subdomain     │  │                 │  │                     │  │
│  │ - artifact      │  │                 │  │                     │  │
│  │ - concept       │  │                 │  │                     │  │
│  │                 │  │                 │  │                     │  │
│  │ edgeTypes:      │  │                 │  │                     │  │
│  │ - structural    │  │                 │  │                     │  │
│  │ - contains      │  │                 │  │                     │  │
│  │ - relates       │  │                 │  │                     │  │
│  │ - owns          │  │                 │  │                     │  │
│  │ - depends       │  │                 │  │                     │  │
│  │ - influences    │  │                 │  │                     │  │
│  │ - collaborates  │  │                 │  │                     │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                 ↑
                         WorldSchemaLoader
                          (thin-wrapper)
                                 ↑
┌─────────────────────────────────────────────────────────────────────┐
│                            render                                   │
│                      (3D визуализация)                              │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                      render/src/core/                         │  │
│  │                                                               │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌───────────────┐  │  │
│  │  │   GraphModel    │  │   Projections   │  │  Invariants   │  │  │
│  │  │                 │  │                 │  │               │  │  │
│  │  │ - getNodes()    │  │ - Visitor       │  │ - checkAll()  │  │  │
│  │  │ - getEdges()    │  │ - Dev           │  │ - STRICTNESS  │  │  │
│  │  │ - getNeighbors()│  │ - OWL           │  │               │  │  │
│  │  │                 │  │ - GraphRAG      │  │               │  │  │
│  │  │                 │  │ - Reflective    │  │               │  │  │
│  │  └─────────────────┘  └─────────────────┘  └───────────────┘  │  │
│  │                                                               │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌───────────────┐  │  │
│  │  │  GraphSnapshot  │  │ ChangeProtocol  │  │LLMReflection  │  │  │
│  │  │                 │  │                 │  │   Engine      │  │  │
│  │  │ - diff()        │  │ - propose()     │  │               │  │  │
│  │  │ - history       │  │ - simulate()    │  │ - analyze()   │  │  │
│  │  │                 │  │ - apply()       │  │ - suggest()   │  │  │
│  │  └─────────────────┘  └─────────────────┘  └───────────────┘  │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  Tests: 656                                                         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Граница ответственности

| Компонент | Знает | Не знает |
|-----------|-------|----------|
| **MeaningEngine** | Контракт WorldInterface | Конкретные типы (character, domain) |
| **WorldAdapter** | Как загрузить schema.json | Как рендерить граф |
| **Schema** | Структура типов | Семантика типов |
| **World (vovaipetrova)** | Свои типы и философию | Как Engine их обрабатывает |
| **render/Core** | GraphModel API | Детали Engine |

---

## Контракт Engine ↔ World

```typescript
interface WorldInterface {
  getSchema(): Schema;
  getGraph(): GraphInterface;
}

interface Schema {
  name: string;
  version: string;
  nodeTypes: NodeType[];
  edgeTypes: EdgeType[];
  
  isValidNodeType(type: string): boolean;
  isValidEdgeType(type: string): boolean;
  validateNode(node: object): ValidationResult;
  validateEdge(edge: object): ValidationResult;
}

interface GraphInterface {
  getNodes(): Node[];
  getEdges(): Edge[];
  getNodeById(id: string): Node | null;
  getNeighbors(nodeId: string): Node[];
}
```

См. [engine/WORLD_CONTRACT.md](engine/WORLD_CONTRACT.md) для полного описания.

---

## Критерий успеха

```javascript
// Любой мир может быть подключён
const spaceWorld = WorldAdapter.fromJSON({
  name: "space-world",
  version: "1.0.0",
  nodeTypes: [
    { id: "galaxy", label: "Galaxy" },
    { id: "star", label: "Star" },
    { id: "planet", label: "Planet" },
  ],
  edgeTypes: [
    { id: "orbits", label: "Orbits" },
  ],
}, spaceSeed);

const engine = new MeaningEngine(spaceWorld);

// Engine работает без знания о "galaxy" или "planet"
engine.isValidNodeType("galaxy");    // true
engine.isValidNodeType("character"); // false
engine.getWorldName();               // "space-world"
```

---

## Тесты

| Пакет | Тестов | Описание |
|-------|--------|----------|
| **engine** | 152 | WorldInterface, Schema, WorldAdapter, MeaningEngine |
| **render** | 656 | Core, Projections, Invariants, Snapshots, Protocol |
| **Всего** | **808** | |

---

## Эволюция архитектуры

```
v0.1.0 — v0.4.4:
  render/src/core/CanonicalGraphSchema.js
    → NODE_TYPES = { ROOT: "root", HUB: "hub", ... }  // ХАРДКОД
    → Мир = встроенная реальность

v0.5.0 (separation):
  worlds/vovaipetrova/schema.json
    → nodeTypes: [{ id: "root" }, { id: "hub" }, ...]  // ИСТОЧНИК ДАННЫХ
  
  engine/src/
    → MeaningEngine, WorldAdapter, Schema  // ПЛАТФОРМА
  
  render/src/core/CanonicalGraphSchema.js
    → import { NODE_TYPES } from "./WorldSchemaLoader.js"  // THIN-WRAPPER
```

---

## Следующие возможности

После v0.5.0 возможно:

- **Multi-world UI** — переключение между мирами
- **World versioning** — миграции схемы
- **Engine API стабилизация** — публичный API
- **Plugin loader** — динамическая загрузка миров
- **`npm install meaning-engine`** — публикация пакета

---

## Tags

| Tag | Описание |
|-----|----------|
| `v0.4.4-before-separation` | До P5.0 |
| `v0.5.0-separation` | После P5.0 (текущий) |
