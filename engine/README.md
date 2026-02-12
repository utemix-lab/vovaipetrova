# MeaningEngine

Универсальный механизм для работы с семантическими графами.

## Принцип

Engine не знает:
- Философии мира
- Конкретных типов узлов
- UI

Engine обеспечивает:
- Целостность (инварианты)
- Управляемую эволюцию (ChangeProtocol)
- Рефлексию (ReflectiveProjection)
- Снапшоты (GraphSnapshot)
- Валидацию (SchemaValidator)
- LLM-оркестрацию (LLMReflectionEngine)

## Архитектура

```
MeaningEngine        ← универсальный механизм
   ↑
WorldAdapter         ← интерфейс подключения
   ↑
YourWorld            ← конкретный мир (пользователь Engine)
   ↑
UI                   ← часть мира
```

## Использование

```javascript
import { MeaningEngine } from "meaning-engine";
import { VovaIPetrovaWorld } from "./worlds/vovaipetrova";

const engine = new MeaningEngine(VovaIPetrovaWorld);
```

## Статус

**P5.0 Separation** — в процессе разделения Engine и World.
