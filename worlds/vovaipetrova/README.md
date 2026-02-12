# VovaIPetrova World

Первый живой пользователь MeaningEngine.

## Принцип

Этот мир — не образец инструмента, а полноценный клиент MeaningEngine.

## Содержимое

```
worlds/vovaipetrova/
├── schema.json      ← типы узлов и рёбер
├── seed.json        ← начальные данные графа
├── world.md         ← описание мира
└── README.md        ← этот файл
```

## Типы узлов

- `root` — корневой узел (Universe)
- `hub` — хаб (Characters, Domains)
- `character` — персонаж
- `domain` — домен
- `tool` — инструмент
- `cryptocosm` — рефлексивная часть

## Использование

```javascript
import { MeaningEngine } from "meaning-engine";
import { VovaIPetrovaWorld } from "./worlds/vovaipetrova";

const engine = new MeaningEngine(VovaIPetrovaWorld);
```

## Статус

**world-v1** — законсервированная версия мира.
