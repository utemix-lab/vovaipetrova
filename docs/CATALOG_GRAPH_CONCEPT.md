# Catalog Graph — Концепция графа каталогов

**Дата:** 16 февраля 2026  
**Статус:** Концепт утверждён

## Два типа графов в системе

### Ontology Graph (universe.json)

```
Размер:        ~30-50 узлов
Рост:          Медленный, ручная курация
Назначение:    Структура мира (домены, персонажи, хабы)
Визуализация:  3D-force-graph
GraphRAG:      Не требуется (слишком мал)
```

**Это карта территории.**

### Catalog Graph (knowledge base)

```
Размер:        10,000+ узлов (и растёт)
Рост:          Быстрый, автоматическая индексация
Назначение:    Единицы знаний (плагины, компании, категории, теги)
Визуализация:  Таблицы, фильтры, поиск
GraphRAG:      Критически важен
```

**Это сама территория.**

## Связь между графами

```
Ontology Graph                    Catalog Graph
     │                                  │
     │  domain-music ◄────────────────► VST plugins (thousands)
     │  domain-ai ◄───────────────────► AI tools, models
     │  domain-visual ◄───────────────► Visual assets
     │  domain-knowledge ◄────────────► Articles, references
     │                                  │
     └──────────── PROJECTION ──────────┘
                      │
              Render показывает
              срез каталога через
              линзу онтологии
```

## Структура Catalog Graph

### Типы узлов

| Тип | Пример | Количество |
|-----|--------|------------|
| `plugin` | Serum, Massive X | 1000+ |
| `company` | Native Instruments, Xfer | 100+ |
| `category` | Synthesizer/Wavetable | 50+ |
| `tag` | analog, vintage, free | 200+ |
| `country` | DE, US, JP | 200+ |
| `format` | VST3, AU, AAX | 10+ |
| `feature` | wavetable, FM, granular | 100+ |

### Типы рёбер

| Связь | Пример |
|-------|--------|
| `plugin → hasCompany → company` | Serum → Xfer Records |
| `plugin → hasCategory → category` | Serum → Synthesizer/Wavetable |
| `plugin → hasTag → tag` | Serum → wavetable, modern |
| `company → locatedIn → country` | Xfer Records → US |
| `plugin → hasFormat → format` | Serum → VST3, AU |
| `plugin → hasFeature → feature` | Serum → wavetable synthesis |
| `category → parentOf → category` | Synthesizer → Wavetable |

## GraphRAG — зачем нужен

### Проблема

Онтология из 30 узлов не требует GraphRAG — всё помещается в контекст LLM.

Но каталог из 10,000+ единиц:
- Не помещается в контекст
- Требует семантического поиска
- Нуждается в навигации по связям

### Решение

```
Пользователь: "Какие бесплатные синтезаторы 
              с wavetable от немецких компаний?"

GraphRAG:
1. Найти узлы: country[DE] 
2. Пройти: DE ← locatedIn ← company[*]
3. Пройти: company[*] ← hasCompany ← plugin[*]
4. Фильтр: plugin.pricing = "free"
5. Фильтр: plugin → hasFeature → feature[wavetable]
6. Вернуть: список плагинов с контекстом
```

## Платформа следит за качеством графа

### Типы проблем

| Проблема | Пример | Действие |
|----------|--------|----------|
| **Обрыв** | Plugin без company | Найти и связать |
| **Тупик** | Category без plugins | Удалить или заполнить |
| **Пробел** | Plugin без description | LLM-обогащение |
| **Дубликат** | "NI" и "Native Instruments" | Объединить |
| **Конфликт** | Разные данные о том же | Разрешить |
| **Устаревание** | Discontinued plugin | Пометить статус |

### Автоматические проверки

```javascript
// Примеры валидаций
const validations = [
  { rule: "plugin must have company", severity: "error" },
  { rule: "plugin must have category", severity: "error" },
  { rule: "plugin should have description", severity: "warning" },
  { rule: "plugin should have tags", severity: "info" },
  { rule: "company should have country", severity: "warning" },
  { rule: "category should have plugins", severity: "info" }
];
```

## Хранение

### Текущее (MVP)

```
worlds/vovaipetrova/catalogs/
├── vst-plugins.json      ← плагины
├── companies.json        ← компании
├── vst-categories.json   ← категории
└── countries.json        ← страны
```

JSON-файлы, связи через ID.

### Будущее (масштабирование)

```
┌─────────────────────────────────────────┐
│  Vector DB (embeddings)                 │
│  + Graph DB (relationships)             │
│  + LLM (enrichment, queries)            │
│  = GraphRAG                             │
└─────────────────────────────────────────┘
```

Варианты:
- **Neo4j + pgvector** — классика
- **Weaviate** — vector + graph в одном
- **LlamaIndex** — GraphRAG из коробки

## Пример: VST-плагин как узел

```json
{
  "id": "serum",
  "type": "plugin",
  "name": "Serum",
  "company": "xfer-records",
  "categories": ["synthesizer-wavetable"],
  "tags": ["wavetable", "modern", "popular"],
  "formats": ["vst3", "au", "aax"],
  "features": ["wavetable", "fm", "filter-types"],
  "pricing": "paid",
  "price_usd": 189,
  "website": "https://xferrecords.com/products/serum",
  "description": "Advanced wavetable synthesizer...",
  "embedding": [0.123, -0.456, ...],  // для семантического поиска
  "meta": {
    "added": "2026-02-16",
    "source": "manual",
    "quality_score": 0.95
  }
}
```

## Интеграция с Render

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   Ontology Graph          Catalog Graph                         │
│   (universe.json)         (catalogs/*.json)                     │
│        │                        │                               │
│        │                        │                               │
│        ▼                        ▼                               │
│   ┌─────────┐              ┌─────────┐                          │
│   │ 3D View │              │ Tables  │                          │
│   │ Nodes   │◄────────────►│ Filters │                          │
│   │ Links   │   projection │ Search  │                          │
│   └─────────┘              └─────────┘                          │
│        │                        │                               │
│        └────────────┬───────────┘                               │
│                     │                                           │
│                     ▼                                           │
│              ┌─────────────┐                                    │
│              │ Story Panel │                                    │
│              │ (unified)   │                                    │
│              └─────────────┘                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Ключевые принципы

1. **Ontology = карта, Catalog = территория**
2. **GraphRAG нужен для каталога, не для онтологии**
3. **Платформа следит за качеством графа каталогов**
4. **Render показывает срез каталога через линзу онтологии**
5. **Каталог растёт автоматически, онтология — вручную**

## Следующие шаги

1. [ ] Заполнить `vst-plugins.json` реальными данными
2. [ ] Добавить валидации качества графа
3. [ ] Интегрировать LLM-обогащение (descriptions, tags)
4. [ ] Прототип GraphRAG-запросов
5. [ ] UI для просмотра каталога (таблицы, фильтры)
