# UI Standards — Стандарты интерфейса

**Track 4: Projection/UI**  
**Статус:** stable  
**Связанные документы:** `windows.md`, `ARCHITECTURE_TRACKS.md`

---

## Рабочий процесс Track 4

```
Детали → Паттерны → Стандарты → Рефакторинг → Код
```

| Этап | Описание |
|------|----------|
| **Детали** | Работа с конкретными элементами UI |
| **Паттерны** | Выявление повторяющихся решений |
| **Стандарты** | Фиксация в этом документе |
| **Рефакторинг** | Унификация кода под стандарты |
| **Код** | Применение CSS-переменных |

### Комплекс задач

| Область | Описание |
|---------|----------|
| **Стандарты** | Унификация цветов, шрифтов, отступов, анимаций |
| **Шаблоны страниц** | Character, Workbench, Domain, Collab |
| **Компоненты** | Виджеты, мини-окна, точки, панели |
| **Механики** | Hover, bounce, glow, состояния |

---

## Цветовая палитра

### Основные цвета

| Переменная | Значение | Назначение |
|------------|----------|------------|
| `--accent-cyan` | `#22d3ee` | Основной акцент (semi-active, hover, borders) |
| `--accent-yellow` | `#fbbf24` | Активный акцент (active, selected) |
| `--panel-bg` | `rgba(8, 12, 20, 0.88)` | Фон панелей |
| `--panel-border` | `rgba(34, 211, 238, 0.35)` | Границы панелей |
| `--panel-border-thick` | `rgba(34, 211, 238, 0.6)` | Толстые границы (hover) |
| `--panel-glow` | `rgba(34, 211, 238, 0.12)` | Свечение панелей |

### Текстовые цвета

| Переменная | Значение | Назначение |
|------------|----------|------------|
| `--text-primary` | `#e0e8f0` | Основной текст |
| `--text-secondary` | `#8899aa` | Вторичный текст |
| `--text-muted` | `#556677` | Приглушённый текст |

### Семантические цвета (UI states)

| Переменная | Значение | Назначение |
|------------|----------|------------|
| `--color-semi-active` | `#22d3ee` | Полуактивное состояние (hover) |
| `--color-semi-active-soft` | `rgba(34, 211, 238, 0.15)` | Мягкий фон semi-active |
| `--color-active` | `#fbbf24` | Активное состояние (selected) |
| `--color-active-soft` | `rgba(251, 191, 36, 0.2)` | Мягкий фон active |
| `--color-active-glow` | `rgba(251, 191, 36, 0.25)` | Свечение active |

### Фоны

| Контекст | Значение |
|----------|----------|
| Body background | `#050608` |
| Graph background | Transparent (3D scene) |

---

## Типографика

### Шрифты

| Переменная | Значение | Назначение |
|------------|----------|------------|
| `--font-tech` | `'Orbitron', monospace` | Заголовки, labels, технический текст |
| `--font-body` | `'Rajdhani', sans-serif` | Основной текст, описания |

### Размеры шрифтов

| Элемент | Размер | Шрифт |
|---------|--------|-------|
| Body | `15px` | `--font-body` |
| Panel header | `11px` | `--font-tech` |
| Section title | `11px` | `--font-tech` |
| Node info | `12px` | `--font-body` |
| Narrative title | `12px` | `--font-tech` |
| Narrative detail | `13px` | `--font-body` |

### Стили текста

| Элемент | Стиль |
|---------|-------|
| Panel header | `uppercase`, `letter-spacing: 0.15em` |
| Section title | `uppercase`, `letter-spacing: 0.1em` |
| Body text | `letter-spacing: 0.02em` |

---

## Система отступов

### !CRITICAL: Единые переменные

```css
:root {
  --panel-inset: 16px;        /* Края большого окна, вертикальные отступы, между группами виджетов */
  --panel-inset-inner: 12px;  /* Края мини-окна, виджет→текст */
  --panel-inset-dots: 6px;    /* Расстояние между точками */
  --panel-inset-widgets: 4px; /* Расстояние между виджетами в группе */
}
```

### Применение отступов

| Контекст | Переменная | Значение |
|----------|------------|----------|
| Padding панели (header) | `--panel-inset` | 16px |
| Padding панели (content) | `0 --panel-inset --panel-inset` | 0 16px 16px |
| Gap между элементами content | `--panel-inset` | 16px |
| Края мини-окна (HUD) | `--panel-inset-inner` | 12px |
| Виджет → текст | `--panel-inset-inner` | 12px |
| Между группами виджетов | `--panel-inset` | 16px |
| Между виджетами в группе | `--panel-inset-widgets` | 4px |
| Между точками | `--panel-inset-dots` | 6px |

### Компенсация анимации

```css
.widget-group {
  gap: calc(var(--panel-inset) - 6px); /* 10px — компенсация подпрыгивания виджетов */
}
```

---

## Размеры элементов

### Виджеты

| Элемент | Размер |
|---------|--------|
| `.widget-frame` | `52px × 52px` |
| `.node-widget` padding | `2px` |
| Итого виджет | `56px × 56px` |
| `.node-toc` height | `56px` (фиксированная) |

### Точки (dots)

| Элемент | Размер |
|---------|--------|
| `.scene-dot` | `14px × 14px` |
| `.narrative-dot` | `14px × 14px` |

### Мини-окно (narrative-screen)

| Свойство | Значение |
|----------|----------|
| Aspect ratio | `16:9` (padding-top: 56.25%) |
| Border radius | `16px` |
| Border | `1px solid var(--panel-border)` |

---

## Механики интерфейса

### Hover-эффекты

| Элемент | Эффект |
|---------|--------|
| Панель | `opacity: 1`, другие панели `opacity: 0.5` |
| Виджет | `animation: widget-bounce 0.28s` (translateY -6px) |
| Мини-окно | `border-color: var(--accent-cyan)`, `box-shadow: 0 0 16px var(--panel-glow)` |
| Точка | `background: var(--accent-cyan)` |

### Анимации

```css
@keyframes widget-bounce {
  0%   { transform: translateY(0); }
  55%  { transform: translateY(-6px); }
  100% { transform: translateY(0); }
}
```

### Состояния виджетов

| Состояние | Визуал |
|-----------|--------|
| Default | Border: `rgba(34, 211, 238, 0.2)` |
| Hover | Border: `var(--accent-cyan)`, bounce animation |
| Semi-active | Border: `var(--color-semi-active)`, glow |
| Active | Border: `var(--color-active)`, yellow glow |

### Панели при hover

| Состояние | Активная панель | Неактивные панели |
|-----------|-----------------|-------------------|
| transform | `scale(1.02)` | `scale(1)` — НЕ УМЕНЬШАЮТСЯ |
| opacity | `1` | `0.5` |
| z-index | `12` | — |

---

## Шаблоны страниц

### Шаблон "Персонаж" (character)

Структура:
1. **Корневой виджет** + информация (3 строки)
2. **Мини-окно** (narrative-screen) с октаэдром
3. **Группы виджетов** (Домены, Воркбенчи, Коллабы)

Октаэдр:
- Количество шаров = количество виджетов на странице
- Максимум 6 шаров для октаэдра
- Вращается автоматически

### Шаблон "Воркбенч" (workbench)

Зависит от типа воркбенча:
- **VSTablishment**: Chladni-эффект + виджеты-флаги (6 шт.)
- **Другие**: narrative-screen + виджеты

---

## CSS файлы

| Файл | Назначение |
|------|------------|
| `render/src/scenes/visitor.css` | Основные стили Visitor Scene |
| `render/src/style.css` | Глобальные стили, точки |

### Критические правила

Помечены комментарием `/* !CRITICAL */` — не изменять без согласования.

---

## Связанные документы

- `docs/windows.md` — структура окон и мостов
- `docs/ARCHITECTURE_TRACKS.md` — Track 4: Projection/UI
- `docs/CHLADNI_CONCEPT.md` — Chladni-эффект для VSTablishment
