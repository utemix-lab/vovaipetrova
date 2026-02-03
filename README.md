# Vovaipetrova

Интерактивная 3D-визуализация онтологического графа с pointer-tags навигацией.

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
│   │   └── ui/             # UI-конфиги (widgets, bindings)
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

## Ключевые концепции

- **Pointer-tags** — теги для ситуативной навигации (`cap:lipsync`, `method:rag`)
- **Routes** — маршруты/сессии для guided-навигации
- **Exports** — реестры и каталоги (AI, практики, сигналы)

## TODO (заделы на будущее)

- [ ] Ситуативная выдача pointer-tags на основе контекста
- [ ] LLM/Agent интеграция для intent detection
- [ ] Session persistence между визитами
