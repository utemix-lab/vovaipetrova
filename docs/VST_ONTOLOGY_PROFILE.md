# VST Ontology Profile v1.0

**Дата:** 18 февраля 2026  
**Статус:** Спецификация  
**Track:** 1.5 (Epistemic Ontology)  
**Тип воркбенча:** VSTablishment  

---

## Формула

> **VST-граф = Typed Faceted Ontological Property Graph**

---

## I. Что это за граф?

VST-граф — это **фасетно-онтологический семантический граф**, сочетающий три модели:

### 1. Фасетная модель

Инструмент описывается через **независимые измерения** (фасеты):

| Фасет | Описание |
|-------|----------|
| Physical | Механизм звукообразования |
| Synthesis | Метод синтеза |
| Performance | Артикуляции |
| Aesthetic | Жанры, характер, настроение |
| Systemic | Система классификации |

Фасеты **независимы** и могут комбинироваться произвольно.

### 2. Онтологическая модель

Каждый фасет — это не просто фильтр, а:
- **типизированный узел**
- с **определением**
- с **допустимыми связями**
- с **доменной принадлежностью**

Это не "faceted search", а **структурированная онтология**.

### 3. Typed Property Graph

Property graph с:
- типизированными узлами
- типизированными связями
- ограничениями `from → to`
- валидируемыми правилами применимости

---

## II. Архитектурный уровень

| Характеристика | Значение |
|----------------|----------|
| Модель | Property Graph |
| Узлы | Типизированные |
| Связи | Строго регламентированные |
| Подграфы | Поддерживаются |
| Валидация | Обязательна |

---

## III. Типы узлов

### Layer 0: Core

| Тип | Описание | Domain | Level |
|-----|----------|--------|-------|
| **Instrument** | Конкретный VST-инструмент | — | 1 |

### Layer 1: Physical

| Тип | Описание | Domain | Level |
|-----|----------|--------|-------|
| **SoundProductionMechanism** | Как рождается звук | physical | 3 |

Примеры: `bowed`, `plucked`, `struck`, `air-driven`, `algorithmic`

### Layer 2: Synthesis

| Тип | Описание | Domain | Level |
|-----|----------|--------|-------|
| **SynthesisMethod** | Метод генерации/обработки звука | synthetic | 3 |

Примеры: `sample-based`, `wavetable`, `fm`, `granular`, `physical-modeling`

### Layer 3: Performance

| Тип | Описание | Domain | Level |
|-----|----------|--------|-------|
| **PerformanceArticulation** | Механика исполнения | physical | 2 |

Примеры: `legato`, `staccato`, `tremolo`, `pizzicato`, `spiccato`

**Критическое поле:**
```json
"applicable_to_mechanisms": ["bowed", "plucked", ...]
```

### Layer 4: Aesthetic

| Тип | Описание | Domain | Level |
|-----|----------|--------|-------|
| **Genre** | Музыкальный контекст | aesthetic | 4 |
| **Character** | Звуковая характеристика | aesthetic | 4 |
| **Mood** | Эмоциональная окраска | aesthetic | 4 |

### Layer 5: Systemic

| Тип | Описание | Domain | Level |
|-----|----------|--------|-------|
| **ClassificationSystem** | Система классификации | systemic | 5 |
| **SystemCategory** | Категория внутри системы | systemic | 4 |

Примеры систем: `hornbostel-sachs`, `general-midi`, `functional`

---

## IV. Доменные уровни

Каждый узел имеет обязательное поле:

```json
"domain": "physical" | "synthetic" | "performance" | "aesthetic" | "systemic"
```

| Domain | Описание |
|--------|----------|
| `physical` | Физические свойства звукоизвлечения |
| `synthetic` | Методы цифрового синтеза |
| `performance` | Техники исполнения |
| `aesthetic` | Субъективные характеристики |
| `systemic` | Мета-уровень классификации |

---

## V. Абстракционные уровни

```json
"abstraction_level": 1 | 2 | 3 | 4 | 5
```

| Уровень | Описание | Примеры |
|---------|----------|---------|
| 1 | Конкретный элемент | Instrument, нота, сэмпл |
| 2 | Техника исполнения | legato, staccato |
| 3 | Метод/механизм | wavetable, bowed |
| 4 | Категория | genre, character, mood |
| 5 | Система | ClassificationSystem |

---

## VI. Типы связей

### Реестр: `catalogs/relation-types.json`

#### Инструментальные связи

| Связь | From | To | Описание |
|-------|------|-----|----------|
| `HAS_MECHANISM` | Instrument | SoundProductionMechanism | Механизм звукоизвлечения |
| `USES_SYNTHESIS` | Instrument | SynthesisMethod | Метод синтеза |
| `SUPPORTS` | Instrument | PerformanceArticulation | Поддерживаемые артикуляции |
| `BELONGS_TO_CATEGORY` | Instrument | SystemCategory | Категория в системе |
| `PRODUCED_BY` | Instrument | Manufacturer | Производитель |

#### Межконцептуальные связи

| Связь | From | To | Описание |
|-------|------|-----|----------|
| `RELATED_TO` | Any | Any | Семантическая связь |
| `INFLUENCES` | Any | Any | Влияние концепта |
| `TYPICAL_FOR_GENRE` | SynthesisMethod | Genre | Типичен для жанра |
| `PRODUCES_CHARACTER` | SynthesisMethod | Character | Производит характер |
| `COMMON_IN` | PerformanceArticulation | Genre | Распространён в жанре |
| `EVOKES` | Character | Mood | Вызывает настроение |

---

## VII. Фасетная структура

Инструмент описывается через независимые фасеты:

```
Instrument
 ├── Physical Facet
 │    └── HAS_MECHANISM → SoundProductionMechanism
 │
 ├── Synthesis Facet
 │    └── USES_SYNTHESIS → SynthesisMethod
 │
 ├── Performance Facet
 │    └── SUPPORTS → PerformanceArticulation
 │
 ├── Aesthetic Facet
 │    ├── BELONGS_TO_GENRE → Genre
 │    ├── HAS_CHARACTER → Character
 │    └── EVOKES_MOOD → Mood
 │
 └── System Facet
      └── BELONGS_TO_CATEGORY → SystemCategory
```

- Каждый фасет — группа допустимых связей
- UI может отображать фасеты как фильтры
- Фасеты не зависят друг от друга

---

## VIII. Правила валидации

### Обязательные

1. **Все узлы имеют `node_type`**
2. **Все связи зарегистрированы** в `relation-types.json`
3. **`from → to` соответствуют реестру**
4. **Нет строковых тегов вместо узлов**

### Критическое правило артикуляций

```
SUPPORTS валидна ⟺ 
  articulation.applicable_to_mechanisms ∩ instrument.mechanisms ≠ ∅
```

Артикуляция `pizzicato` (applicable: `plucked`) **не может** быть связана с инструментом, у которого механизм `air-driven`.

### Структурные

- Нет циклических системных категорий
- Instrument не содержит вложенных данных концептов
- Концепты существуют независимо от инструментов

---

## IX. Уровневая модель

```
┌─────────────────────────────────┐
│      [Systemic Layer]           │  ClassificationSystem, SystemCategory
│         abstraction: 5          │
├─────────────────────────────────┤
│      [Aesthetic Layer]          │  Genre, Character, Mood
│         abstraction: 4          │
├─────────────────────────────────┤
│     [Performance Layer]         │  PerformanceArticulation
│         abstraction: 2          │
├─────────────────────────────────┤
│      [Synthesis Layer]          │  SynthesisMethod
│         abstraction: 3          │
├─────────────────────────────────┤
│      [Physical Layer]           │  SoundProductionMechanism
│         abstraction: 3          │
├─────────────────────────────────┤
│        [Instrument]             │  Конкретный VST
│         abstraction: 1          │
└─────────────────────────────────┘
```

Каждый слой связан с соседними, но **не смешивается**.

---

## X. Семантические возможности

Граф позволяет:

| Возможность | Описание |
|-------------|----------|
| **Подграфы** | Строить подграфы по любому фасету |
| **Сравнение** | Сравнивать методы синтеза, артикуляции |
| **Альтернативы** | Показывать альтернативные классификации |
| **Обучение** | Строить обучающие маршруты |
| **Объяснение** | Объяснять любой термин через граф |
| **Фильтрация** | Переключать фасеты в UI |
| **Контекст** | Контекстная фильтрация по связям |

---

## XI. Принцип масштабируемости

| Действие | Безопасность |
|----------|--------------|
| Добавление инструмента | ✅ Безопасно |
| Добавление артикуляции | ✅ Безопасно |
| Добавление метода синтеза | ✅ Безопасно |
| Добавление нового домена | ⚠️ Допускается |
| Добавление типа узла | ⚠️ Через реестр |

**Структура Instrument не изменяется** при расширении онтологии.

---

## XII. Чем этот граф НЕ является

| ❌ Не является | Почему |
|---------------|--------|
| Просто каталог | Есть типизация и связи |
| Faceted search | Фасеты — узлы с определениями |
| Теговая система | Теги заменены на узлы |
| RDF без ограничений | Есть строгий реестр связей |
| Свободный knowledge graph | Домены и уровни ограничены |

**Это строгая доменно-ограниченная онтология.**

---

## XIII. Связь с архитектурой проекта

### Track 1.5 — Графовые эпистемологии

Согласно `docs/WORKBENCH_GRAPH_TYPES.md`:

| Тип графа | Воркбенч |
|-----------|----------|
| **A. Фасетная онтология** | **VSTablishment** ← этот граф |
| B. Граф влияний | Music General |
| C. Концептуальный гиперграф | Zucken-Drücken |

VST-граф — это **Тип A** в классификации графовых эпистемологий.

### Track 1 — Ontology

- Типы узлов определены в `catalogs/nodes/`
- Связи определены в `catalogs/relation-types.json`
- Валидация через реестр

### Track 2 — Schema/Engine

- JSON-структуры каталогов
- WorldAdapter загружает каталоги
- MeaningEngine валидирует связи

### Track 3 — Operators

- Эпистемические операторы работают с подграфами
- `explain()` — объясняет термин через граф
- `compare()` — сравнивает концепты
- `build_context()` — строит контекст

### Track 4 — Projection/UI

- VSTGraph2D визуализирует граф
- Фасеты отображаются как фильтры
- Layer widgets переключают слои

---

## XIV. Файловая структура

```
catalogs/
├── relation-types.json           # Реестр связей
│
├── nodes/
│   ├── sound-production-mechanisms.json  # Physical Layer
│   ├── synthesis-methods.json            # Synthesis Layer
│   ├── articulations.json                # Performance Layer
│   ├── genres.json                       # Aesthetic Layer
│   ├── characters.json                   # Aesthetic Layer
│   ├── moods.json                        # Aesthetic Layer
│   └── classification-systems.json       # Systemic Layer
│
└── edges/
    └── (будущее: материализованные связи)
```

---

## XV. Связанные документы

| Документ | Описание |
|----------|----------|
| `docs/UNIVERSAL_SEMANTIC_GRAPH_STANDARD.md` | **USG v1.0** — базовый стандарт (этот профиль — реализация) |
| `docs/ARCHITECTURE_TRACKS.md` | 5 треков архитектуры |
| `docs/WORKBENCH_GRAPH_TYPES.md` | Типы графов воркбенчей |
| `docs/VST_SEMANTIC_GRAPH.md` | Техническая спецификация v2.1 |
| `docs/VST_ENRICHMENT_PROMPT.md` | Промпт для LLM-обогащения |
| `docs/VST_GRAPH_CONCEPT.md` | Концепция визуализации |

---

## XVI. Итог

VST-граф — это:

| Свойство | Статус |
|----------|--------|
| Фасетно-онтологический | ✅ |
| Типизированный | ✅ |
| Валидируемый | ✅ |
| Расширяемый | ✅ |
| Пригодный для операторов | ✅ |
| UI-дружественный | ✅ |
| Не инструмент-центричный | ✅ |

---

## XVII. Версионирование

| Версия | Дата | Изменения |
|--------|------|-----------|
| v1.0 | 2026-02-18 | Первая спецификация |

---

*Этот документ является частью Track 1.5 (Epistemic Ontology) проекта vovaipetrova.*
