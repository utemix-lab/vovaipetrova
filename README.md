# Vovaipetrova

Интерактивная 3D-визуализация онтологического графа с pointer-tags навигацией.

**Live Demo:** <https://utemix-lab.github.io/vovaipetrova/>

---

## Architecture v0.5.0

```
┌─────────────────────────────────────────────────────────────┐
│                    MeaningEngine                            │
│                   (универсальная платформа)                 │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Schema    │  │ WorldAdapter│  │   MeaningEngine     │  │
│  │  (abstract) │  │  (adapter)  │  │   (main class)      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↑
                    WorldInterface (контракт)
                            ↑
┌─────────────────────────────────────────────────────────────┐
│                 worlds/vovaipetrova                         │
│                   (первый плагин)                           │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ schema.json │  │  seed.json  │  │     world.md        │  │
│  │ (типы)      │  │  (данные)   │  │   (философия)       │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↑
┌─────────────────────────────────────────────────────────────┐
│                        render                               │
│                   (3D визуализация)                         │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │    Core     │  │ Projections │  │       UI            │  │
│  │ (GraphModel)│  │ (OWL, RAG)  │  │   (Three.js)        │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Ключевой принцип:** Engine не знает конкретных типов. Мир инжектируется через адаптер.

См. [ARCHITECTURE.md](ARCHITECTURE.md) для полного описания.

---

## Vision

Система **графоцентрична**: онтологический граф — единственный источник истины.

**Текущая фаза:** Platform-first — MeaningEngine как универсальная платформа, VovaIPetrova как первый плагин.

> **Мост к будущей сложности — это контракты и адаптеры, НЕ хардкод типов.**

См. [docs/ARCHITECTURE_PRINCIPLES.md](docs/ARCHITECTURE_PRINCIPLES.md) для полного описания.

## Quick Start

```bash
npm install && cd render && npm install
npm run dev
```

Открыть: <http://localhost:5173/vovaipetrova/>

## Build & Deploy

```bash
npm run build          # Сборка в render/dist/
git push origin main   # Автодеплой на GitHub Pages
```

## Testing

```bash
# Engine tests (152)
cd engine && npm test

# Render tests (656)
cd render && npm test

# All tests (808)
npm test
```

## Документация

| Документ | Описание |
|----------|----------|
| [docs/INDEX.md](docs/INDEX.md) | **Карта документов** — начни здесь |
| [docs/ARCHITECTURE_PRINCIPLES.md](docs/ARCHITECTURE_PRINCIPLES.md) | Ключевой акцент, фазы |
| [.agent/context.yml](.agent/context.yml) | Правила для агента |

## Структура

```
vovaipetrova/
├── engine/              # MeaningEngine — универсальная платформа
│   ├── src/
│   │   ├── WorldInterface.js   # Контракт Engine ↔ World
│   │   ├── Schema.js           # Абстрактная схема
│   │   ├── WorldAdapter.js     # Адаптер мира
│   │   └── index.js            # MeaningEngine
│   └── WORLD_CONTRACT.md       # Формальный контракт
│
├── worlds/              # Миры (плагины)
│   └── vovaipetrova/    # Первый плагин
│       ├── schema.json  # Типы узлов и рёбер
│       ├── seed.json    # Начальные данные
│       └── world.md     # Философия мира
│
├── render/              # 3D визуализация
│   ├── public/          # Статика (graph, assets)
│   └── src/
│       ├── core/        # Core (GraphModel, Projections)
│       ├── scenes/      # visitor.js — основная логика
│       └── ui/          # React-компоненты
│
├── docs/                # Документация
├── repair-shop/         # Архитектурная мастерская
└── scripts/             # Утилиты
```

## Ключевые концепции

- **Pointer-tags** — теги для навигации (`cap:lipsync`, `method:rag`)
- **Routes** — маршруты для guided-навигации
- **Exports** — реестры (AI, практики, сигналы)
