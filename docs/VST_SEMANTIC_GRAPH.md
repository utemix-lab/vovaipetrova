# VST Semantic Graph — Спецификация v2.1

**Дата:** 18 февраля 2026
**Статус:** Проектирование
**Track:** 1.5 (Epistemic Ontology)

---

## Критический принцип v2.1

> **Артикуляция — не свойство инструмента.**
> **Артикуляция — допустимая операция над механизмом звукоизвлечения.**

Это означает:
- Инструмент имеет механизм (`HAS_MECHANISM`)
- Артикуляция применима к механизмам (`applicable_to_mechanisms`)
- Связь `SUPPORTS` валидна только если механизмы пересекаются

---

## Ключевой принцип

> **Значения → Узлы**
> 
> Каждый концепт — автономный узел с собственным определением, связями и контекстом.
> Инструмент — не центр графа, а один из типов узлов.

---

## Проблема v1.0

```json
// БЫЛО: инструмент-центричная модель
{
  "id": "spitfire-bbc",
  "articulations": ["Legato", "Staccato"],  // строки
  "synthesis": "Sample-based",               // строка
  "terms": { "genre": ["Cinematic"] }        // строка
}
```

Оператор не может:
- Объяснить, что такое "Legato" вне инструмента
- Сравнить Legato у разных производителей
- Построить подграф жанра "Cinematic"
- Показать связь между synthesis и character

---

## Решение v2.0: Автономные узлы

### Структура каталогов

```
catalogs/
├── nodes/
│   ├── instruments.json       # Instrument
│   ├── articulations.json     # Articulation
│   ├── synthesis-methods.json # SynthesisMethod
│   ├── genres.json            # Genre
│   ├── moods.json             # Mood
│   ├── characters.json        # Character
│   ├── systems.json           # ClassificationSystem
│   ├── categories.json        # Category
│   ├── platforms.json         # Platform
│   ├── engines.json           # Engine
│   └── manufacturers.json     # Manufacturer
│
└── edges/
    └── relations.json         # Типизированные связи
```

---

## Типы узлов (автономные)

### 1. PerformanceArticulation

```json
{
  "id": "legato",
  "node_type": "PerformanceArticulation",
  "name": "Legato",
  "name_ru": "Легато",
  "definition": "Плавный переход между нотами без разрыва звука",
  "domain": "physical",
  "family": "bowed-transition",
  "applicable_to_mechanisms": ["bowed", "air-driven", "sample-playback", "physical-modeling"],
  "related": ["portamento", "glissando"],
  "opposite": ["staccato", "spiccato"],
  "notation": "slur line",
  "difficulty": "intermediate"
}
```

### 2. SoundProductionMechanism

```json
{
  "id": "bowed",
  "node_type": "SoundProductionMechanism",
  "name": "Bowed",
  "name_ru": "Смычковый",
  "definition": "Звук извлекается трением смычка о струну",
  "domain": "physical",
  "instrument_families": ["strings"],
  "examples": ["violin", "cello", "viola"]
}
```

### 3. SynthesisMethod

```json
{
  "id": "wavetable",
  "node_type": "SynthesisMethod",
  "name": "Wavetable Synthesis",
  "name_ru": "Волновой синтез",
  "definition": "Метод синтеза, использующий морфинг между волновыми таблицами",
  "invented": 1979,
  "inventor": "Wolfgang Palm",
  "characteristics": ["bright", "modern", "morphable"],
  "typical_genres": ["edm", "dubstep", "future-bass"],
  "related": ["additive", "granular"],
  "examples": ["Serum", "Vital", "Massive X"]
}
```

### 3. Genre

```json
{
  "id": "cinematic",
  "type": "Genre",
  "name": "Cinematic",
  "name_ru": "Кинематографический",
  "definition": "Музыка для кино, трейлеров и медиа-продукции",
  "parent": "orchestral",
  "subgenres": ["trailer", "epic", "ambient-cinematic"],
  "typical_synthesis": ["sample-based"],
  "typical_articulations": ["legato", "staccato", "tremolo"],
  "typical_moods": ["epic", "dramatic", "emotional"],
  "era": "1980s-present"
}
```

### 4. ClassificationSystem

```json
{
  "id": "hornbostel-sachs",
  "type": "ClassificationSystem",
  "name": "Hornbostel-Sachs",
  "name_ru": "Хорнбостель-Закс",
  "definition": "Научная система классификации музыкальных инструментов по способу звукоизвлечения",
  "created": 1914,
  "creators": ["Erich von Hornbostel", "Curt Sachs"],
  "top_categories": ["idiophone", "membranophone", "chordophone", "aerophone", "electrophone"],
  "used_by": ["ethnomusicology", "organology"],
  "alternative_systems": ["general-midi", "functional"]
}
```

### 5. Category (внутри системы)

```json
{
  "id": "chordophone",
  "type": "Category",
  "name": "Chordophone",
  "name_ru": "Хордофон",
  "definition": "Инструменты, в которых звук производится вибрацией натянутых струн",
  "system": "hornbostel-sachs",
  "parent": null,
  "children": ["lute", "zither", "harp", "musical-bow"],
  "examples": ["guitar", "violin", "piano", "harp"],
  "sound_production": "string vibration"
}
```

### 6. Mood

```json
{
  "id": "epic",
  "type": "Mood",
  "name": "Epic",
  "name_ru": "Эпический",
  "definition": "Грандиозный, величественный характер звучания",
  "intensity": "high",
  "energy": "high",
  "valence": "positive",
  "typical_genres": ["cinematic", "trailer", "orchestral"],
  "typical_articulations": ["staccato", "marcato"],
  "opposite": ["intimate", "minimal"],
  "related": ["dramatic", "heroic", "majestic"]
}
```

### 7. Character

```json
{
  "id": "warm",
  "type": "Character",
  "name": "Warm",
  "name_ru": "Тёплый",
  "definition": "Мягкий, насыщенный тембр с преобладанием низких и средних частот",
  "frequency_profile": "low-mid emphasis",
  "typical_synthesis": ["sample-based", "analog"],
  "opposite": ["bright", "cold"],
  "related": ["rich", "full", "smooth"]
}
```

### 8. Instrument (теперь со ссылками на узлы)

```json
{
  "id": "spitfire-bbc-symphony",
  "type": "Instrument",
  "name": "BBC Symphony Orchestra",
  "manufacturer": "spitfire-audio",
  "description": "Полный симфонический оркестр, записанный в Maida Vale Studios"
}
```

---

## Типизированные связи (edges)

### Формат связи

```json
{
  "source": "node-id",
  "target": "node-id",
  "relation": "RELATION_TYPE",
  "properties": {}
}
```

### Типы связей

| Тип связи | Из | В | Описание |
|-----------|-----|-----|----------|
| `SUPPORTS` | Instrument | Articulation | Инструмент поддерживает артикуляцию |
| `USES_SYNTHESIS` | Instrument | SynthesisMethod | Метод синтеза |
| `BELONGS_TO_GENRE` | Instrument | Genre | Типичный жанр |
| `HAS_CHARACTER` | Instrument | Character | Характер звучания |
| `EVOKES_MOOD` | Instrument | Mood | Вызываемое настроение |
| `CLASSIFIED_AS` | Instrument | Category | Категория в системе |
| `MADE_BY` | Instrument | Manufacturer | Производитель |
| `RUNS_ON` | Instrument | Platform | Платформа |
| `REQUIRES_ENGINE` | Instrument | Engine | Движок |
| `PART_OF_SYSTEM` | Category | ClassificationSystem | Система классификации |
| `PARENT_OF` | Category | Category | Иерархия категорий |
| `TYPICAL_FOR` | Articulation | Genre | Типичная артикуляция для жанра |
| `PRODUCES` | SynthesisMethod | Character | Синтез → характер |
| `ASSOCIATED_WITH` | Mood | Genre | Настроение ↔ жанр |
| `OPPOSITE_OF` | * | * | Противоположность |
| `RELATED_TO` | * | * | Связанные концепты |

### Пример связей

```json
[
  {
    "source": "spitfire-bbc-symphony",
    "target": "legato",
    "relation": "SUPPORTS",
    "properties": { "quality": "excellent", "variations": 3 }
  },
  {
    "source": "spitfire-bbc-symphony",
    "target": "cinematic",
    "relation": "BELONGS_TO_GENRE",
    "properties": { "primary": true }
  },
  {
    "source": "legato",
    "target": "strings",
    "relation": "TYPICAL_FOR",
    "properties": {}
  },
  {
    "source": "wavetable",
    "target": "bright",
    "relation": "PRODUCES",
    "properties": { "typical": true }
  },
  {
    "source": "legato",
    "target": "staccato",
    "relation": "OPPOSITE_OF",
    "properties": {}
  }
]
```

---

## Что это даёт операторам

### 1. Объяснение термина

```
Запрос: "Что такое Legato?"
```

Оператор:
1. Находит узел `articulation:legato`
2. Читает `definition`
3. Находит связи `TYPICAL_FOR` → показывает применимость
4. Находит связи `OPPOSITE_OF` → показывает контраст
5. Находит связи `RELATED_TO` → показывает контекст

### 2. Построение контекста

```
Запрос: "Покажи контекст Serum"
```

Оператор строит подграф:
```
Serum → USES_SYNTHESIS → Wavetable → PRODUCES → Bright
      → BELONGS_TO_GENRE → EDM → ASSOCIATED_WITH → Energetic
      → SUPPORTS → Arpeggio
```

### 3. Сравнение систем

```
Запрос: "Сравни Hornbostel-Sachs и General MIDI"
```

Оператор:
1. Находит оба узла типа `ClassificationSystem`
2. Сравнивает `top_categories`
3. Находит инструменты, классифицированные в обеих системах
4. Показывает пересечения и различия

### 4. Построение курса

```
Запрос: "Курс по оркестровым артикуляциям"
```

Оператор:
1. Находит узлы `Articulation` где `applicable_to` содержит "strings", "winds", "brass"
2. Группирует по `family`
3. Сортирует по `difficulty`
4. Для каждой артикуляции находит `examples` через связи `SUPPORTS`

---

## Миграция данных

### Шаг 1: Создать каталоги концептов

Начать с базовых:
- `articulations.json` — 20-30 основных артикуляций
- `synthesis-methods.json` — 10 методов синтеза
- `genres.json` — 20-30 жанров
- `systems.json` — 3-5 систем классификации

### Шаг 2: Обновить шаблон запроса LLM

Запрашивать не JSON инструмента, а **связи**:

```
Для инструмента X укажи:
- Какие артикуляции поддерживает? (из списка: legato, staccato, ...)
- Какой метод синтеза? (из списка: sample-based, wavetable, ...)
- Какие жанры типичны? (из списка: cinematic, edm, ...)
```

### Шаг 3: Обновить VSTGraph2D

Загружать не один JSON, а граф из нескольких каталогов.

---

## Связь с архитектурой

- **Track 1** — онтология: типы узлов
- **Track 1.5** — эпистемология: типы связей, возможность подграфов
- **Track 2** — схема: JSON-структуры каталогов
- **Track 3** — операторы: работа с подграфами
- **Track 4** — UI: визуализация подграфов

---

## v2.1 — Онтологически защищённый граф

### Новые поля

| Поле | Описание | Обязательно |
|------|----------|-------------|
| `node_type` | Тип узла из реестра | ✅ |
| `domain` | physical / synthetic / aesthetic / functional / systemic | ✅ |
| `abstraction_level` | 1-5 (от конкретного к системному) | ✅ |

### Уровни абстракции

| Уровень | Описание | Примеры |
|---------|----------|---------|
| 1 | Конкретный элемент | нота, сэмпл |
| 2 | Техника исполнения | legato, staccato |
| 3 | Метод/механизм | wavetable, bowed |
| 4 | Категория | genre, character, mood |
| 5 | Система | ClassificationSystem |

### Концепт-концепт связи

```
SynthesisMethod → PRODUCES_CHARACTER → Character
SynthesisMethod → TYPICAL_FOR_GENRE → Genre
PerformanceArticulation → COMMON_IN → Genre
Character → EVOKES → Mood
```

### Валидация связей

```javascript
// Реестр relation-types.json
{
  "SUPPORTS": {
    "from": ["Instrument"],
    "to": ["PerformanceArticulation"],
    "validation": "articulation.applicable_to_mechanisms ∩ instrument.mechanisms ≠ ∅"
  }
}
```

Агент **не может** создать связь, которой нет в реестре.

---

## Статус реализации v2.1

- [x] `relation-types.json` — 21 тип связей с валидацией
- [x] `sound-production-mechanisms.json` — 11 механизмов
- [x] `articulations.json` — 18 артикуляций с `applicable_to_mechanisms`
- [x] `synthesis-methods.json` — 9 методов с `produces_character`, `typical_for_genre`
- [x] `genres.json` — 15 жанров с `evokes_mood`
- [x] `characters.json` — 15 характеров
- [x] `moods.json` — 15 настроений
- [x] `classification-systems.json` — 4 системы
- [x] `VST_ENRICHMENT_PROMPT.md` — обновлён для v2.1

---

## Связь с архитектурой

- **Track 1** — онтология: типы узлов
- **Track 1.5** — эпистемология: типы связей, возможность подграфов
- **Track 2** — схема: JSON-структуры каталогов
- **Track 3** — операторы: работа с подграфами
- **Track 4** — UI: визуализация подграфов
