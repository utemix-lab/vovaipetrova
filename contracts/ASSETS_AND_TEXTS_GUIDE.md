# Руководство по размещению ассетов и текстов

Это руководство описывает, куда класть файлы в `contracts/public/`.

## 1. Классы элементов → Папки

| Класс элемента | Описание | Папка для ассетов |
|----------------|----------|-------------------|
| **Scene / Presentation** | Граф-шоу, фоны, рамки | `assets/ui/backgrounds/`, `assets/ui/frames/`, `assets/video/` |
| **Containers** | Панели Story/System/Service | `assets/ui/frames/` |
| **Navigation Indicators** | Точки, маркеры навигации | `assets/icons/navigation/` |
| **Action Affordances** | Иконки возможностей | `assets/icons/actions/` |
| **Actors** | Аватары персонажей | `assets/avatars/characters/` |
| **External References** | Логотипы, флаги | `assets/logos/brands/`, `assets/logos/software/`, `assets/flags/` |
| **Semantic Labels** | Теги как UI-стили | `assets/icons/system/`, `assets/ui/typography/` |
| **Semantic Pointers** | Pointer-теги | `exports/pointer_tags_registry.json`, `assets/icons/system/` |
| **Inline References** | Термины/ссылки в markdown | `texts/story\|system\|service/` |
| **Content Blocks** | Текст и картинки | `texts/...`, `assets/images/story\|system\|service/` |
| **System Metadata** | Машинотеги | `exports/` или метаданные графа |

## 2. Форматы ассетов

### Рекомендации

| Тип | Формат | Примечание |
|-----|--------|------------|
| **Иконки** | SVG (предпочтительно), PNG @2x | Векторные масштабируются лучше |
| **Аватары** | WEBP | Хорошее сжатие, прозрачность |
| **Большие иллюстрации** | WEBP, JPG | WEBP для прозрачности, JPG для фото |
| **Видео** | MP4 (H.264), WebM | MP4 для совместимости |
| **Аудио** | MP3, OGG | OGG для веба |

### Размеры

- **Иконки:** 24x24, 32x32, 48x48 px (SVG — любой)
- **Аватары:** 128x128, 256x256 px
- **Фоны:** 1920x1080 px (desktop), 1080x1920 px (mobile)
- **Frames:** по размеру панели

## 3. Правила именования

### Общие правила

- **kebab-case** — `action-export.svg`, не `actionExport.svg`
- **Без пробелов** — `my-icon.svg`, не `my icon.svg`
- **Без кириллицы** — `actor-anya.webp`, не `актер-аня.webp`
- **Описательные имена** — `arrow-right.svg`, не `icon1.svg`

### Группы файлов

```
# Actors
actor-anya.webp
actor-vova.webp
actor-narrator.webp

# Actions
action-navigate.svg
action-export.svg
action-generate.svg
action-compare.svg

# Navigation
arrow-left.svg
arrow-right.svg
dot-active.svg
dot-inactive.svg

# Flags
flag-ru.svg
flag-en.svg
flag-jp.svg

# Logos
logo-github.svg
logo-notion.svg
logo-godot.svg
```

## 4. Структура папок assets/

```
assets/
├── ui/
│   ├── frames/              # Рамки панелей
│   │   ├── panel-story.svg
│   │   ├── panel-system.svg
│   │   └── panel-service.svg
│   ├── backgrounds/         # Фоны
│   │   ├── panel-default.webp
│   │   └── scene-intro.webp
│   └── typography/          # Шрифты, стили текста
│       └── fonts.css
│
├── icons/
│   ├── actions/             # Иконки действий
│   │   ├── navigate.svg
│   │   ├── export.svg
│   │   └── generate.svg
│   ├── navigation/          # Навигация
│   │   ├── arrow-left.svg
│   │   ├── arrow-right.svg
│   │   └── dot-active.svg
│   └── system/              # Системные иконки
│       ├── placeholder.svg
│       ├── architecture.svg
│       └── concept.svg
│
├── avatars/
│   └── characters/          # Аватары персонажей
│       ├── actor-anya.webp
│       └── actor-narrator.webp
│
├── logos/
│   ├── brands/              # Бренды
│   │   └── logo-utemix.svg
│   └── software/            # Софт
│       ├── logo-github.svg
│       └── logo-godot.svg
│
├── flags/                   # Флаги стран
│   ├── flag-ru.svg
│   └── flag-en.svg
│
├── images/
│   ├── story/               # Иллюстрации для Story
│   ├── system/              # Схемы для System
│   └── service/             # Скриншоты для Service
│
├── audio/                   # Звуки
│   └── click.mp3
│
└── video/                   # Видео
    └── intro.mp4
```

## 5. Структура папок texts/

```
texts/
├── story/                   # Нарративный контент
│   ├── intro.md
│   └── chapter-1.md
│
├── system/                  # Техническое описание
│   ├── architecture.md
│   └── missing-content.md   # Заглушка
│
└── service/                 # Действия, инструкции
    ├── action-navigate.md
    ├── action-export.md
    └── action-generate.md
```

## 6. Манифест ассетов

После добавления ассетов обновите `manifests/assets.manifest.json`:

```json
{
  "assets": {
    "icons": {
      "actions": [
        { "id": "action-navigate", "path": "icons/actions/navigate.svg", "format": "svg" }
      ]
    }
  }
}
```

### Автоматизация (будущее)

В будущем можно автоматизировать генерацию манифеста:

```bash
# Скрипт сканирует папки и генерирует manifest
node scripts/generate-manifest.js
```

## 7. Проверка

### Чеклист перед коммитом

- [ ] Файл в правильной папке
- [ ] Имя в kebab-case, без пробелов и кириллицы
- [ ] Формат соответствует рекомендации
- [ ] Манифест обновлён (если нужно)
- [ ] JSON файлы валидны

### Валидация JSON

```bash
# Проверка всех JSON
find contracts/public -name "*.json" -exec jsonlint {} \;
```

## 8. Примеры использования

### В Godot

```gdscript
var icon_path = WORKSPACE + "/assets/icons/actions/navigate.svg"
var texture = load(icon_path)
button.icon = texture
```

### В Web

```html
<img src="/contracts/public/assets/icons/actions/navigate.svg" alt="Navigate">
```

### В контрактах

```json
{
  "elementId": "btn-navigate",
  "assets": {
    "icon": "assets/icons/actions/navigate.svg"
  }
}
```
