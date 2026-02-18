# VST Instrument — Запрос связей для семантического графа v2.1

## Критический принцип

> **Артикуляция — не свойство инструмента.**
> **Артикуляция — допустимая операция над механизмом звукоизвлечения.**

Это означает:
- Сначала определяем механизм инструмента (`HAS_MECHANISM`)
- Артикуляции валидны только если их `applicable_to_mechanisms` пересекается с механизмом инструмента

## Автономные каталоги концептов

| Каталог | Тип | Количество |
|---------|-----|------------|
| `sound-production-mechanisms.json` | SoundProductionMechanism | 11 |
| `articulations.json` | PerformanceArticulation | 18 |
| `synthesis-methods.json` | SynthesisMethod | 9 |
| `genres.json` | Genre | 15 |
| `characters.json` | Character | 15 |
| `moods.json` | Mood | 15 |
| `classification-systems.json` | ClassificationSystem | 4 |
| `relation-types.json` | Реестр связей | 16 типов |

---

## Промпт для LLM (копируй целиком)

```
Ты — эксперт по виртуальным музыкальным инструментам (VST/AU/AAX).

Для инструмента "[НАЗВАНИЕ]" от компании "[КОМПАНИЯ]" укажи СВЯЗИ с существующими концептами.

## Доступные концепты (выбирай только из этих списков):

### Механизмы звукоизвлечения (mechanisms) — ОБЯЗАТЕЛЬНО:
bowed, plucked, struck, air-driven, sample-playback, wavetable-oscillation,
subtractive-oscillation, fm-modulation, granular-resynthesis, physical-modeling,
additive-synthesis

### Артикуляции (articulations) — только если валидны для механизма:
legato, staccato, pizzicato, tremolo, spiccato, con-sordino, sul-ponticello, 
sul-tasto, harmonics, flutter-tongue, col-legno, vibrato, marcato, portamento, 
glissando, sustain, trill, arco

### Методы синтеза (synthesis) — только для synthetic domain:
sample-based, wavetable, subtractive, fm, granular, physical-modeling, 
additive, spectral, hybrid

### Жанры (genres):
cinematic, orchestral, edm, ambient, electronic, pop, rock, jazz, world, 
trailer, synthwave, dubstep, hip-hop, classical

### Характеры (characters):
warm, bright, dark, aggressive, ethereal, organic, synthetic, rich, clean, 
punchy, lush, metallic, vintage, modern, atmospheric

### Настроения (moods):
epic, dramatic, tense, calm, energetic, melancholic, mysterious, uplifting, 
nostalgic, aggressive, romantic, playful, dark, heroic, intimate

### Классификация Hornbostel-Sachs:
idiophone, membranophone, chordophone, aerophone, electrophone

### Функциональная роль:
rhythm, harmony, melody, texture, vocal

---

## Формат ответа — JSON:

{
  "instrument": {
    "id": "kebab-case-id",
    "name": "Полное название",
    "description": "1-2 предложения"
  },
  
  "manufacturer": {
    "id": "company-id",
    "name": "Название",
    "country": "ISO alpha-2 (us, de, gb...)"
  },
  
  "edges": {
    "HAS_MECHANISM": ["sample-playback"],
    "SUPPORTS": ["legato", "staccato", ...],
    "USES_SYNTHESIS": "sample-based",
    "BELONGS_TO_GENRE": ["cinematic", "orchestral"],
    "HAS_CHARACTER": ["warm", "rich"],
    "EVOKES_MOOD": ["epic", "dramatic"],
    "CLASSIFIED_AS": {
      "hornbostel-sachs": "chordophone",
      "functional": "melody"
    },
    "RUNS_ON": ["vst2", "vst3", "au", "aax"],
    "REQUIRES_ENGINE": "kontakt | native | play | uvi | other"
  },
  
  "notes": ["особенности", "рекомендации"]
}

ВАЖНО:
- HAS_MECHANISM — ОБЯЗАТЕЛЬНОЕ поле, определяет допустимые артикуляции
- SUPPORTS — указывай только артикуляции, валидные для механизма
- Для чистых синтезаторов (wavetable-oscillation, fm-modulation) SUPPORTS = ["sustain"]
- Для sample-playback артикуляции зависят от записанного контента
- Все id в kebab-case
```

---

## Пример: Spitfire Audio - BBC Symphony Orchestra

```json
{
  "instrument": {
    "id": "spitfire-bbc-symphony",
    "name": "BBC Symphony Orchestra",
    "description": "Полный симфонический оркестр, записанный в Maida Vale Studios."
  },
  
  "manufacturer": {
    "id": "spitfire-audio",
    "name": "Spitfire Audio",
    "country": "gb"
  },
  
  "edges": {
    "HAS_MECHANISM": ["sample-playback"],
    "SUPPORTS": [
      "legato", "staccato", "pizzicato", "tremolo", "spiccato",
      "con-sordino", "sul-tasto", "sul-ponticello", "harmonics",
      "col-legno", "vibrato", "marcato", "trill", "arco"
    ],
    "USES_SYNTHESIS": "sample-based",
    "BELONGS_TO_GENRE": ["cinematic", "orchestral", "classical"],
    "HAS_CHARACTER": ["warm", "rich", "lush", "organic"],
    "EVOKES_MOOD": ["epic", "dramatic", "romantic", "heroic"],
    "CLASSIFIED_AS": {
      "hornbostel-sachs": "chordophone",
      "functional": "melody"
    },
    "RUNS_ON": ["vst2", "vst3", "au", "aax", "standalone"],
    "REQUIRES_ENGINE": "native"
  },
  
  "notes": [
    "Требует много RAM (16GB+)",
    "Версии: Discover, Core, Professional"
  ]
}
```

**Почему артикуляции валидны:** `sample-playback` поддерживает все перечисленные артикуляции, т.к. они записаны в сэмплах.

---

## Пример: Xfer Records - Serum

```json
{
  "instrument": {
    "id": "xfer-serum",
    "name": "Serum",
    "description": "Wavetable-синтезатор с визуальным редактированием волновых таблиц."
  },
  
  "manufacturer": {
    "id": "xfer-records",
    "name": "Xfer Records",
    "country": "us"
  },
  
  "edges": {
    "HAS_MECHANISM": ["wavetable-oscillation"],
    "SUPPORTS": ["sustain"],
    "USES_SYNTHESIS": "wavetable",
    "BELONGS_TO_GENRE": ["edm", "dubstep", "pop", "electronic"],
    "HAS_CHARACTER": ["bright", "clean", "modern", "aggressive"],
    "EVOKES_MOOD": ["energetic", "aggressive", "uplifting"],
    "CLASSIFIED_AS": {
      "hornbostel-sachs": "electrophone",
      "functional": "melody"
    },
    "RUNS_ON": ["vst2", "vst3", "au", "aax"],
    "REQUIRES_ENGINE": "native"
  },
  
  "notes": [
    "Индустриальный стандарт для EDM",
    "Импорт своих wavetables"
  ]
}
```

**Почему артикуляции ограничены:** `wavetable-oscillation` — алгоритмический механизм, физические артикуляции (legato, staccato) не применимы. Только `sustain` универсален.

---

## Пример: 8Dio - Bazantar

```json
{
  "instrument": {
    "id": "8dio-bazantar",
    "name": "Bazantar",
    "description": "Уникальный 5-струнный контрабас с 29 симпатическими струнами."
  },
  
  "manufacturer": {
    "id": "8dio",
    "name": "8Dio",
    "country": "us"
  },
  
  "edges": {
    "HAS_MECHANISM": ["sample-playback"],
    "SUPPORTS": [
      "sustain", "legato", "pizzicato", "harmonics", "tremolo", "col-legno"
    ],
    "USES_SYNTHESIS": "sample-based",
    "BELONGS_TO_GENRE": ["cinematic", "ambient", "world"],
    "HAS_CHARACTER": ["dark", "organic", "ethereal", "rich"],
    "EVOKES_MOOD": ["mysterious", "dark", "intimate", "melancholic"],
    "CLASSIFIED_AS": {
      "hornbostel-sachs": "chordophone",
      "functional": "texture"
    },
    "RUNS_ON": ["kontakt"],
    "REQUIRES_ENGINE": "kontakt"
  },
  
  "notes": [
    "Экспериментальный инструмент",
    "Отлично для ambient и cinematic"
  ]
}
```

**Почему артикуляции валидны:** `sample-playback` с записанными артикуляциями смычкового инструмента (bowed → sample-playback).

---

## Как использовать

1. Замени `[НАЗВАНИЕ]` и `[КОМПАНИЯ]` в промпте
2. Отправь в ChatGPT/Claude
3. Получи JSON со связями
4. Пришли мне — я интегрирую в граф

---

## Что это даёт

Теперь оператор может:

1. **Объяснить термин** — найти узел `legato`, прочитать `definition`, показать `related`
2. **Построить контекст** — найти все инструменты с `SUPPORTS: legato`
3. **Сравнить** — показать разницу между `wavetable` и `sample-based`
4. **Построить курс** — собрать все артикуляции для `strings`

---

## Композиция и зависимости (v2.2)

### Многоинструментальные продукты

Если один VST содержит несколько независимых инструментов:

```json
{
  "instrument": {
    "id": "native-instruments-komplete-kontrol",
    "node_type": "VSTPlugin",
    "name": "Komplete Kontrol"
  },
  "contains": [
    {
      "id": "kk-piano",
      "node_type": "ContentUnit",
      "name": "Piano",
      "typical_for_genre": ["classical", "jazz"],
      "produces_character": ["warm", "rich"]
    },
    {
      "id": "kk-strings",
      "node_type": "ContentUnit",
      "name": "Strings",
      "typical_for_genre": ["orchestral", "cinematic"]
    }
  ]
}
```

**Правила:**
- Создать 1 `VSTPlugin` + N `ContentUnit`
- `ContentUnit` НЕ имеет `mechanisms` (наследует от родителя)
- `ContentUnit` МОЖЕТ иметь свои `typical_for_genre`, `produces_character`, `evokes_mood`

### Библиотеки без engine

Если продукт требует другой VST для работы:

```json
{
  "library": {
    "id": "orchestral-tools-berlin-strings-exp-a",
    "node_type": "ContentLibrary",
    "name": "Berlin Strings EXP A",
    "requires": "sine-player",
    "extends": "orchestral-tools-berlin-strings"
  }
}
```

**Правила:**
- `ContentLibrary` ОБЯЗАТЕЛЬНО имеет `requires` → host VSTPlugin
- `ContentLibrary` НЕ имеет `mechanisms`
- `extends` — опционально, для expansion packs

### Запрещено

| Действие | Почему |
|----------|--------|
| `ContentUnit` → `mechanisms` | Механизм принадлежит только VSTPlugin |
| `ContentLibrary` → `mechanisms` | Механизм принадлежит host |
| Создавать `kontakt-library` тип | Онтологическая инфляция |
| `ContentUnit` для каждого пресета | Избыточная декомпозиция |

### Когда создавать ContentUnit?

✅ Создавать:
- Инструмент имеет самостоятельную идентичность
- Имеет отдельный тип/категорию
- Может быть описан независимо

❌ НЕ создавать:
- Для каждого пресета
- Для вариаций одного инструмента
- Если различия только в настройках

---

## Связь с архитектурой

- **Track 1.5** — типы узлов и связей (VST_SEMANTIC_GRAPH.md)
- **Track 2** — JSON-схемы каталогов
- **Track 3** — операторы работают с подграфами
- **Track 5** — автоматизация сбора данных
