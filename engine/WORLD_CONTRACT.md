# World Interface Contract v1

**Дата:** 12 февраля 2026  
**Статус:** P5.0a.1 — Формализация границы Engine ↔ World

---

## Принцип

```
Engine адаптируется к миру.
Мир не упрощается ради Engine.
```

---

## World Interface

Engine ожидает от мира объект, реализующий следующий интерфейс:

```typescript
interface World {
  /** Возвращает схему мира */
  getSchema(): Schema;
  
  /** Возвращает граф мира */
  getGraph(): GraphInterface;
  
  /** Возвращает начальные данные (опционально) */
  getSeed?(): Seed;
  
  /** Возвращает конфигурацию мира (опционально) */
  getConfig?(): WorldConfig;
}
```

---

## Schema Interface

```typescript
interface Schema {
  /** Версия схемы */
  version: string;
  
  /** Имя мира */
  name: string;
  
  /** Допустимые типы узлов */
  nodeTypes: NodeTypeDefinition[];
  
  /** Допустимые типы рёбер */
  edgeTypes: EdgeTypeDefinition[];
  
  /** Ограничения (опционально) */
  constraints?: SchemaConstraints;
}

interface NodeTypeDefinition {
  id: string;
  label: string;
  description?: string;
  maxCount?: number;
  requiredFields?: string[];
}

interface EdgeTypeDefinition {
  id: string;
  label: string;
  description?: string;
  allowedSourceTypes?: string[];
  allowedTargetTypes?: string[];
}

interface SchemaConstraints {
  requireRootNode?: boolean;
  allowCycles?: boolean;
  maxDepth?: number;
}
```

---

## GraphInterface

```typescript
interface GraphInterface {
  /** Все узлы графа */
  getNodes(): Node[];
  
  /** Все рёбра графа */
  getEdges(): Edge[];
  
  /** Узел по ID */
  getNodeById(id: string): Node | null;
  
  /** Соседи узла */
  getNeighbors(nodeId: string): Node[];
}

interface Node {
  id: string;
  type: string;
  label?: string;
  data?: Record<string, unknown>;
}

interface Edge {
  id?: string;
  source: string;
  target: string;
  type: string;
  data?: Record<string, unknown>;
}
```

---

## Engine Guarantees

Engine гарантирует миру:

| Гарантия | Описание |
|----------|----------|
| **Целостность** | Инварианты проверяются перед применением изменений |
| **Эволюция** | Изменения проходят через ChangeProtocol |
| **Рефлексия** | Мир может анализировать себя через ReflectiveProjection |
| **Снапшоты** | История изменений сохраняется |
| **Валидация** | Схема мира валидируется при подключении |
| **LLM-оркестрация** | LLM может анализировать и предлагать изменения |

---

## Engine Prohibitions

**Engine НЕ ИМЕЕТ ПРАВА:**

| Запрет | Причина |
|--------|---------|
| ❌ Читать файлы мира напрямую | Нарушает абстракцию |
| ❌ Импортировать код мира | Создаёт зависимость |
| ❌ Знать конкретные типы узлов | `CHARACTER`, `DOMAIN` — это знание мира |
| ❌ Знать философию мира | Engine — механизм, не интерпретатор |
| ❌ Модифицировать UI мира | UI принадлежит миру |
| ❌ Хардкодить типы в валидаторах | Типы определяются схемой мира |

---

## World Responsibilities

**Мир ОБЯЗАН:**

| Обязанность | Описание |
|-------------|----------|
| ✓ Предоставить валидную схему | Соответствующую Schema Interface |
| ✓ Предоставить граф | Соответствующий GraphInterface |
| ✓ Определить свои типы | В schema.json |
| ✓ Управлять своим UI | Engine не знает UI |

**Мир МОЖЕТ:**

| Возможность | Описание |
|-------------|----------|
| ○ Расширять схему | Добавлять свои поля в NodeTypeDefinition |
| ○ Определять constraints | Свои правила валидации |
| ○ Иметь свой seed | Начальные данные |
| ○ Иметь свой config | Настройки поведения |

---

## Validation Rules

При подключении мира Engine проверяет:

1. **Schema exists** — `world.getSchema()` возвращает объект
2. **Schema valid** — схема соответствует Schema Interface
3. **Graph exists** — `world.getGraph()` возвращает объект
4. **Graph valid** — граф соответствует GraphInterface
5. **Types consistent** — типы узлов/рёбер в графе соответствуют схеме

---

## Anti-patterns

**Нарушение контракта:**

```javascript
// ❌ ЗАПРЕЩЕНО — Engine знает конкретный тип
if (node.type === "character") { ... }

// ✓ ПРАВИЛЬНО — Engine проверяет через схему
if (schema.isValidNodeType(node.type)) { ... }
```

```javascript
// ❌ ЗАПРЕЩЕНО — Engine импортирует из мира
import { NODE_TYPES } from "../../worlds/vovaipetrova/schema"

// ✓ ПРАВИЛЬНО — Engine получает типы от мира
const nodeTypes = world.getSchema().nodeTypes;
```

```javascript
// ❌ ЗАПРЕЩЕНО — Engine читает файл мира
const schema = JSON.parse(fs.readFileSync("worlds/vovaipetrova/schema.json"))

// ✓ ПРАВИЛЬНО — Engine получает схему через интерфейс
const schema = world.getSchema();
```

---

## Version History

| Версия | Дата | Изменения |
|--------|------|-----------|
| v1 | 12.02.2026 | Первая формализация контракта |

---

## Критерий успеха Separation

```
Когда VovaIPetrova перестанет быть «встроенным миром»
и станет «первым живым пользователем MeaningEngine» —
фаза завершена.
```
