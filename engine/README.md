# MeaningEngine v0.5.0

Универсальный механизм для работы с семантическими графами.

---

## Принцип

**Engine не знает:**
- Философии мира
- Конкретных типов узлов (character, domain, hub...)
- UI

**Engine обеспечивает:**
- Валидацию схемы (Schema)
- Контракт с миром (WorldInterface)
- Адаптер подключения (WorldAdapter)

---

## Архитектура

```
┌─────────────────────────────────────────┐
│            MeaningEngine                │
│                                         │
│  ┌───────────┐  ┌───────────────────┐   │
│  │  Schema   │  │   WorldAdapter    │   │
│  │ (abstract)│  │    (adapter)      │   │
│  └───────────┘  └───────────────────┘   │
│                         │               │
│                         ▼               │
│              ┌─────────────────┐        │
│              │  MeaningEngine  │        │
│              │   (main class)  │        │
│              └─────────────────┘        │
└─────────────────────────────────────────┘
                    ↑
            WorldInterface (контракт)
                    ↑
┌─────────────────────────────────────────┐
│           worlds/your-world             │
│                                         │
│  schema.json  seed.json  world.md       │
└─────────────────────────────────────────┘
```

---

## Использование

```javascript
import { MeaningEngine, WorldAdapter } from "./engine/src/index.js";

// Создать мир из JSON
const world = WorldAdapter.fromJSON({
  name: "my-world",
  version: "1.0.0",
  nodeTypes: [
    { id: "item", label: "Item" },
  ],
  edgeTypes: [
    { id: "link", label: "Link" },
  ],
}, {
  nodes: [{ id: "item-1", type: "item", label: "First Item" }],
  edges: [],
});

// Создать Engine
const engine = new MeaningEngine(world);

// Использовать
engine.getWorldName();           // "my-world"
engine.isValidNodeType("item");  // true
engine.getNodeCount();           // 1
```

---

## API

### MeaningEngine

```javascript
// Конструктор
new MeaningEngine(world: WorldInterface)

// Getters
getVersion(): string
getWorldName(): string
getWorldVersion(): string
getSchema(): Schema
getGraph(): GraphInterface
getWorld(): WorldInterface

// Schema operations
isValidNodeType(type: string): boolean
isValidEdgeType(type: string): boolean
validateNode(node: object): ValidationResult
validateEdge(edge: object): ValidationResult

// Graph operations
getNodeCount(): number
getEdgeCount(): number
getNodeById(id: string): Node | null
getNeighbors(nodeId: string): Node[]

// Stats
getStats(): EngineStats
```

### WorldAdapter

```javascript
// Конструктор
new WorldAdapter({ schemaData, seedData?, config? })

// Factory methods
WorldAdapter.fromJSON(schemaData, seedData?, config?): WorldAdapter
WorldAdapter.empty(name?): WorldAdapter
WorldAdapter.minimal(name?): WorldAdapter

// WorldInterface implementation
getSchema(): Schema
getGraph(): GraphInterface
getSeed(): object | null
getConfig(): object | null

// Additional
getName(): string
getVersion(): string
validate(): ValidationResult
```

### Schema

```javascript
// Конструктор
new Schema(config)

// Getters
name: string
version: string
nodeTypes: NodeType[]
edgeTypes: EdgeType[]

// Methods
isValidNodeType(type: string): boolean
isValidEdgeType(type: string): boolean
getNodeTypeIds(): string[]
getEdgeTypeIds(): string[]
validateNode(node: object): ValidationResult
validateEdge(edge: object, getNodeType?): ValidationResult
toJSON(): object
```

---

## Тесты

```bash
npm test
```

| Файл | Тестов |
|------|--------|
| WorldInterface.test.js | 35 |
| Schema.test.js | 58 |
| WorldAdapter.test.js | 31 |
| MeaningEngine.test.js | 28 |
| **Всего** | **152** |

---

## Контракт

См. [WORLD_CONTRACT.md](WORLD_CONTRACT.md) для полного описания контракта Engine ↔ World.

---

## Статус

**v0.5.0-separation** — Engine и World разделены. Граница реальна.
