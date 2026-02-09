# Vovaipetrova

Интерактивная 3D-визуализация онтологического графа с pointer-tags навигацией.

**Live Demo:** <https://utemix-lab.github.io/vovaipetrova/>

## Vision

Система **графоцентрична**: онтологический граф — единственный источник истины.

**Текущая фаза:** Визуал-first — простой интерфейс для путешествия по графу. Никакой "магии".

> **Мост к будущей сложности — это онтология узлов, pointer-tags и режимы, НЕ клики пользователя.**

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
cd render && npm run test
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
├── .agent/              # Контекст для агента
├── docs/                # Документация (см. docs/INDEX.md)
├── render/              # Vite-приложение
│   ├── public/          # Статика (graph, assets, exports)
│   └── src/
│       ├── architecture/  # DNA — архитектурные якоря
│       ├── scenes/        # visitor.js — основная логика
│       ├── ui/            # React-компоненты (заготовки)
│       └── graph/         # GraphEngine абстракция
└── scripts/             # Утилиты (arch-linter, checks)
```

## Ключевые концепции

- **Pointer-tags** — теги для навигации (`cap:lipsync`, `method:rag`)
- **Routes** — маршруты для guided-навигации
- **Exports** — реестры (AI, практики, сигналы)
