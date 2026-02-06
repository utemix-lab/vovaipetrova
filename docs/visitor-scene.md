# Visitor Scene — краткая спецификация механики (компактно)

Цель: зафиксировать поведение сцены как театральной установки: рычаги, окна, точки и приглашение ответом.
Документ короткий, машинно‑читаемый и привязан к нотации W1/W2/W3 + слоев (UI/LOGIC/BRIDGE).

Notation quick reminder
- W1 = Story
- W2 = System
- W3 = Service
- Layers: UI | LOGIC | BRIDGE

0) Смысл механики (нарративно)

- Сцена — не только набор ссылок. Есть два способа получить ответ мира:
  - навигация (click → route) — веб‑ориентированный поток;
  - сценическая реакция (lever → preactive ответ в W2/W3) — невебовая логика.
- Акт: поднятый рычаг концентрирует внимание: интерфейс отступает визуально, фон/граф проявляется, окна 2 и 3 показывают превью/ответы до наведения курсора.

1) Термины и компоненты (кратко)

- W1.UI: Story содержит виджеты (Host / domain widgets / node widgets).
- Host widget: "хозяйский" — глобальный якорь перспективы.
- domain/widget (widget--lever): локальные маркеры с `data-node-id` — при обычном click ведут в узел.
- Dots (Scene Stack): 2–4 точки в заголовке Story — короткая память пребывания.

2) Состояния (глобально)

- A) Explore (веб‑ориентация)
  - hover → подсветка (рамка, граф)
  - click → переход (route)
- B) Lever Active (сценическая реакция)
  - один активный рычаг (activeLeverWidgetId)
  - в этой фазе: клики не выполняют переходы; сцена показывает preactive ответы в W2/W3; интерфейс «отступает».

3) Локальные состояния виджета

- idle | hovered | leverActive | disabledForNavigation
- При leverActive другие виджеты становятся `disabledForNavigation` (клик переключает активный рычаг)

4) Правило «рычаг vs дверь» (жёсткий UX контракт)

- Scope: W1.UI / W1.LOGIC
- Правило: клик выполняет навигацию (door) только когда нет активного рычага.
- Если рычаг активен: клик на виджете → переключить (или выключить) рычаг; навигация запрещена.

5) Hover‑правила

- W1.UI hover: рамка + подсветка соответствующей части графа; swap emblem → локальный аватар.
- Host hover: мягкая голубая рамка; другие виджеты — жёлтая (меньше интенсивности).

6) Отступ интерфейса / проявление графа

- Визуальный контракт (W1.UI + W2.UI + W3.UI): при activeLever
  - лёгкая прозрачность (class `panel-dimmed`), slight scale down для неактивных окон;
  - фон/граф чуть более заметен (opacity/blur tweak) — минимально, без мерцания.

7) Activation of W2/W3 as invitation

- При activeLever → W2/W3 переходят в `preactive`:
  - показывают группы (Services/Models/Methods), 1–3 preview items или skeleton;
  - бейдж Response type (Results/Info/Actions/Steps).
- При hover в W2/W3 → state = active (полная интерактивность).

8) Scene Stack (Dots)

- Максимум 3–4 точки; при возврате на предыдущую точку — справа от текущей точки элементы удаляются (схлопывание ветки).
- Это локальная память сцены, не история браузера.

9) Episode frame (16×9)
- Вложенный mini‑scene со своим sceneStack; переключение эпизодов не ломает внешнюю сцену.

10) Реализация (технически, минимально)
- Global state (Visitor scene):
  - `activeLeverWidgetId: string | null`
  - `hoveredWidgetId: string | null`
  - `hoveredWindow: 1|2|3|null`
  - `sceneStack: string[]`
  - `preactiveResponse: {type, groups, previewItems}|null`
- Rules:
  - Если `activeLeverWidgetId != null`: clicks => switch lever (no navigation).
  - Если `activeLeverWidgetId == null`: clicks => navigation (goToStepById).
  - `preactiveResponse` вычисляется на основе `activeLeverWidgetId` (light heuristic: related nodes).
  - `sceneStack` push при явной навигации (не при lever reaction).
- UI hooks: toggle CSS class `panel-dimmed` on `#story-panel`, `#system-panel`, `#service-panel` according to `hoveredWindow` and `activeLeverWidgetId`.

11) Нотации задач для агентов (пример)
- Scope: W1.UI
  - "Добавить Scene Stack dots в заголовок Story. Не трогать W1.LOGIC и BRIDGE."
- Scope: W2.LOGIC
  - "Прописать preactiveResponse: при activeLeverWidgetId брать до 3 related practices и рендерить превью."

---

Этот документ — компактная привязка к коду: состояние и простые правила. Для деталей — см. `docs/windows.md` (окна/слои) и `docs/bridges.md` (мосты).
