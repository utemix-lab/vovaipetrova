# Refactor Execution Plan (Agent-Mandatory)

Этот план должен выполняться последовательно и не может быть пропущен.

## Общие правила

1. Перед каждым шагом: прочитать `.agent/context.yml` и `docs/AGENT_TASK_TEMPLATE.md`.
2. Каждый шаг фиксируется в чате:
   - «Что делаю сейчас»
   - «Что сделал»
   - «Что будет следующим»
3. После каждого шага: запустить `npm run arch-lint` и `npm run check:fast`.
4. Любая правка в ключевых модулях требует импорт `architecture/dna` и `@ArchProto`.

## Шаги (выполнять по порядку)

### Шаг 0 — Подготовка безопасного старта ✅
- Убедиться, что ветка чистая и есть checkpoint‑коммит.
- Зафиксировать текущую фазу из `render/src/architecture/dna.ts`.

### Шаг 1 — Минимальная React‑обёртка графа ✅
- Создать React‑точку входа (App + GraphScene) без изменения логики графа.
- Обеспечить совместимость с текущей Vite сборкой.
- Зафиксировать минимальный стейт (selectedNode) и синхронизацию с 3D.

### Шаг 2 — Абстракция GraphEngine ✅
- Ввести интерфейс `IGraphEngine`.
- Вынести текущий Three.js код в `ThreeGraphEngine`.
- Включить базовые события и управление фокусом.

### Шаг 3 — Декларативный UI‑слой ✅
- Перевести один UI‑компонент (например, Inspector) на React.
- Связать его с общим стейтом графа.

### Шаг 4 — Анимации ✅
- Добавить Framer Motion для переходов (минимальный кейс).
- Проверить, что анимации отражают «агентное внимание».

### Шаг 5 — React overlay для System‑панели ✅

- Добавить React‑оверлей поверх `#system-panel`.
- Связать с `currentStep.system` и текущим маршрутом.

### Шаг 6 — React overlay для Service‑панели ✅

- Добавить React‑оверлей поверх `#service-panel`.
- Связать с `currentStep.service` и текущим маршрутом.

### Шаг 7 — Расширение Story‑панели (React) ✅

- Вывести текст `currentStep.story.text` в React‑оверлее.
- Добавить индикатор ссылок/референсов, если они есть.

### Шаг 8 — Story refs список (React) ✅

- Отрисовать список `currentStep.story.refs` (id, label, type).
- Добавить лёгкие визуальные бейджи типов.

### Шаг 9 — Расширение System/Service (React) ✅

- Вывести `currentStep.system.text` и `currentStep.service.text`.
- Отрисовать refs списки для System/Service, если они есть.

### Шаг 10 — Интерактив refs (React) ✅

- Добавить клики по refs в Story/System/Service.
- Эмитить событие `graph-ref-clicked` для связки с 3D сценой.

### Шаг 11 — Внешние refs (React) ✅

- Если ref содержит внешнюю ссылку (http/https), открывать её в новой вкладке.
- Для внутренних id оставлять переход по узлу графа.

### Шаг 12 — Story виджеты (React) ✅

- Передать в React данные для Story‑виджетов (домены/практики/персонажи/воркбенчи).
- Отрисовать секции виджетов и навигацию по узлам.

### Шаг 13 — Интерактив Story‑виджетов (React) ✅

- Добавить hover/preview состояния и визуальные акценты.
- Согласовать поведение с levers/подсветкой 3D графа.

### Шаг 14 — Story mini‑shape (React) ✅

- Добавить плейсхолдер mini‑shape (cube/icosa) в React‑Story.
- Подготовить события для подсветки мини‑shape от hover.

### Шаг 15 — Story widgets cleanup (React) ✅

- Согласовать состояние legacy‑виджетов и React‑виджетов (миграция без дублей).
- Уточнить поведение levers при кликах из React.

### Шаг 16 — Lever parity (React) ✅

- Добавить поддержку lever‑режима для кликов по React‑виджетам.
- Синхронизировать состояние активного lever с 3D сценой.

### Шаг 17 — Lever UI sync (React) ✅

- Подсветить активный lever в React‑виджете.
- Синхронизировать активный lever при изменении состояния сцены.

### Шаг 18 — Lever hover parity (React) ✅

- Добавить визуальные состояния hover для активного lever.
- Уточнить поведение отключения lever при уходе курсора.

### Шаг 19 — Lever preview sync (React) ✅

- Показать состояние preactive preview (если активен lever).
- Синхронизировать preview данные с React‑панелями.

### Шаг 20 — Lever preview polish (React) ✅

- Подтянуть группировку/лейблы в preview.
- Согласовать стили preview между System и Service.

### Шаг 21 — Lever preview interactions (React) ✅

- Добавить клик по preview элементам для перехода.
- Синхронизировать поведение preview с query‑mode.

### Шаг 22 — Preview hover sync (React) ✅

- Добавить hover‑подсветку preview элементов.
- Согласовать подсветку preview с 3D графом.

### Шаг 23 — Preview selection state (React) ✅

- Отметить выбранный preview элемент.
- Синхронизировать выбранный элемент с Service‑панелью.

### Шаг 24 — Preview selection persist (React) ✅

- Сбрасывать выбранный preview при смене шага.
- Добавить явный reset при выключении lever.

### Шаг 25 — Preview polish & telemetry (React) ✅

- Добавить лёгкий лог/телеметрию при выборе preview.
- Согласовать подсказки/тултипы preview.

### Шаг 26 — Preview action routing (React) ✅

- Подготовить события для перехода в Service action.
- Согласовать preview с Service actions UI.

### Шаг 27 — Service actions overlay (React) ✅

- Отрисовать actions UI в React Service‑панели.
- Согласовать клики actions с legacy обработчиками.

### Шаг 28 — Service actions cleanup (React) ✅

- Убрать legacy actions при активном React‑оверлее.
- Согласовать стили и hover состояния.

### Шаг 29 — Query mode React overlay ✅

- Добавить React‑версию query‑mode.
- Согласовать поведение с preview/actions.

### Шаг 30 — Query mode System overlay (React) ✅

- Отрисовать query‑tags и статус в React System‑панели.
- Скрыть legacy System контент во время query‑mode.

## Формат отчёта в чате (обязателен)

```text
Этап: <номер/название>
Сейчас: <кратко, что делаю>
Сделано: <2-4 пункта>
Далее: <следующий шаг и критерий готовности>
```
