# Vovaipetrova

Интерактивная 3D-визуализация онтологического графа с pointer-tags навигацией.

## Важно: облегчённый рендер
Этот репозиторий — облегчённая и пересобранная версия рендера из:
- r:\dream-graph (рендер и визуальный стиль)
- r:\contracts (UI-контракты + правила UI)
- r:\extended-mind (архитектурные и нарративные основания)
Если чего-то не хватает для работы или понимания — сначала смотрим в эти репозитории.
Важное переносим в этот репо и поддерживаем инженерный порядок.

## Live Demo
https://utemix-lab.github.io/vovaipetrova/

## Development
```bash
npm install
cd render && npm install
npm run dev:render
```
Открыть: http://localhost:5173/vovaipetrova/

## Build & Deploy
```bash
npm run build      # Сборка в render/dist/
git push origin main  # Автодеплой на GitHub Pages
```

## Структура репо

```
vovaipetrova/
├── core/                   # Валидация схем (невебовая логика)
│   └── validate.js
│
├── render/                 # Vite-приложение
│   ├── public/             # Статика (коммитится в git)
│   │   ├── assets/         # Иконки, фоны, аватары
│   │   ├── graph/          # universe.json — данные графа
│   │   ├── exports/        # Реестры (pointer_tags, ai_catalog)
│   │   ├── routes/         # Маршруты сессий
│   │   └── ui/             # UI-контракты и правила (единый канон механики)
│   ├── src/
│   │   ├── scenes/         # Сцены визуализации
│   │   │   ├── visitor.js  # Основная сцена
│   │   │   ├── system.js   # Системный граф
│   │   │   └── _archive/   # Legacy-код (резерв)
│   │   ├── compat/         # Совместимость путей
│   │   └── visual/         # Визуальные конфиги
│   └── vite.config.js
│
└── tests/                  # Тесты валидации
```

## Машинный ориентир (быстрое понимание)
- `render/public/ui/UI_RULES.md` — единый канон механики UI.
- `render/public/ui/**` — контрактные данные UI (layout/bindings/interaction/widgets).
- `render/src/**` — реализация рендера и визуальных правил.
- `MACHINE_CONTEXT.md` — краткий машинный контекст репозитория.

## Ключевые концепции

- **Pointer-tags** — теги для ситуативной навигации (`cap:lipsync`, `method:rag`)
- **Routes** — маршруты/сессии для guided-навигации
- **Exports** — реестры и каталоги (AI, практики, сигналы)

## TODO (заделы на будущее)

- [ ] Ситуативная выдача pointer-tags на основе контекста
- [ ] LLM/Agent интеграция для intent detection
- [ ] Session persistence между визитами
