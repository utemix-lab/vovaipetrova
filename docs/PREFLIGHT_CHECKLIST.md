# Preflight Checklist — Проверочный лист перед загрузкой данных

**Дата:** 18 февраля 2026  
**Статус:** Активный  
**Фаза:** 2 — Эпистемическая плотность  

---

## Стратегия постепенного заполнения

### Партии по 10 инструментов

| Партия | Категория | Цель проверки |
|--------|-----------|---------------|
| **Batch 1** | Оркестровые (strings) | Базовая связность, артикуляции |
| **Batch 2** | Оркестровые (brass/winds) | Расширение механизмов |
| **Batch 3** | Синтезаторы (wavetable) | Синтетический домен |
| **Batch 4** | Синтезаторы (FM/additive) | Разнообразие методов |
| **Batch 5** | Гибридные | Множественные механизмы |
| **Batch 6** | Экспериментальные | Граничные случаи |

### Правило

> **Не заливать более 20 инструментов без проверки.**

---

## Чеклист после каждой партии

### 1. Валидация

```bash
cd worlds/vovaipetrova/catalogs
node validator.cjs --verbose
```

- [ ] Ошибок: 0
- [ ] Предупреждений: 0 или объяснимы

### 2. Распределение механизмов

```bash
node -e "
const fs = require('fs');
const plugins = JSON.parse(fs.readFileSync('nodes/vst-plugins.json', 'utf-8'));
const counts = {};
plugins.entries.forEach(p => {
  (p.mechanisms || []).forEach(m => {
    counts[m] = (counts[m] || 0) + 1;
  });
});
console.log('Mechanism distribution:');
Object.entries(counts).sort((a,b) => b[1]-a[1]).forEach(([k,v]) => {
  const pct = (v / plugins.entries.length * 100).toFixed(1);
  console.log('  ' + k + ': ' + v + ' (' + pct + '%)');
});
"
```

**Ожидание:**
- `sample-playback` ≤ 60% (допустимо для оркестровых)
- Минимум 3 разных механизма представлены

### 3. Распределение жанров

```bash
node -e "
const fs = require('fs');
const plugins = JSON.parse(fs.readFileSync('nodes/vst-plugins.json', 'utf-8'));
const counts = {};
plugins.entries.forEach(p => {
  (p.typical_for_genre || []).forEach(g => {
    counts[g] = (counts[g] || 0) + 1;
  });
});
console.log('Genre distribution:');
Object.entries(counts).sort((a,b) => b[1]-a[1]).slice(0,10).forEach(([k,v]) => {
  console.log('  ' + k + ': ' + v);
});
"
```

### 4. Плотность связей

```bash
node -e "
const fs = require('fs');
const plugins = JSON.parse(fs.readFileSync('nodes/vst-plugins.json', 'utf-8'));
let totalEdges = 0;
plugins.entries.forEach(p => {
  totalEdges += (p.mechanisms || []).length;
  totalEdges += (p.typical_for_genre || []).length;
  totalEdges += (p.produces_character || []).length;
  totalEdges += (p.evokes_mood || []).length;
});
const avg = (totalEdges / plugins.entries.length).toFixed(1);
console.log('Total plugins: ' + plugins.entries.length);
console.log('Total edges: ' + totalEdges);
console.log('Avg edges per plugin: ' + avg);
"
```

**Ожидание:**
- Среднее ≥ 8 связей на инструмент
- Ни один инструмент не имеет < 4 связей

---

## Эпистемический контроль (каждые 50 инструментов)

### Вопросы для рефлексии

#### 1. Типы узлов

- [ ] Не появился ли новый `node_type`, который не в реестре?
- [ ] Не используется ли тип не по назначению?

#### 2. Definitions

- [ ] Определения остаются точными?
- [ ] Нет ли "размытых" определений типа "универсальный инструмент"?

#### 3. Эстетика

- [ ] Не перегружен ли какой-то `character`?
- [ ] Не стал ли `warm` или `cinematic` мусорным тегом?

#### 4. Механизмы

- [ ] Все артикуляции валидны для указанных механизмов?
- [ ] Нет ли инструментов с несовместимыми артикуляциями?

### Команда полной проверки

```bash
node validator.cjs --verbose && echo "=== EPISTEMIC CHECK ===" && node -e "
const fs = require('fs');
const plugins = JSON.parse(fs.readFileSync('nodes/vst-plugins.json', 'utf-8'));
const chars = JSON.parse(fs.readFileSync('nodes/characters.json', 'utf-8'));
const moods = JSON.parse(fs.readFileSync('nodes/moods.json', 'utf-8'));

// Character usage
const charUsage = {};
chars.entries.forEach(c => charUsage[c.id] = 0);
plugins.entries.forEach(p => {
  (p.produces_character || []).forEach(c => {
    charUsage[c] = (charUsage[c] || 0) + 1;
  });
});

console.log('\nCharacter usage (top 5):');
Object.entries(charUsage).sort((a,b) => b[1]-a[1]).slice(0,5).forEach(([k,v]) => {
  const pct = (v / plugins.entries.length * 100).toFixed(1);
  console.log('  ' + k + ': ' + v + ' (' + pct + '%)');
});

// Unused characters
const unused = Object.entries(charUsage).filter(([k,v]) => v === 0).map(([k]) => k);
if (unused.length > 0) {
  console.log('\nUnused characters: ' + unused.join(', '));
}

// Mood usage
const moodUsage = {};
moods.entries.forEach(m => moodUsage[m.id] = 0);
plugins.entries.forEach(p => {
  (p.evokes_mood || []).forEach(m => {
    moodUsage[m] = (moodUsage[m] || 0) + 1;
  });
});

console.log('\nMood usage (top 5):');
Object.entries(moodUsage).sort((a,b) => b[1]-a[1]).slice(0,5).forEach(([k,v]) => {
  const pct = (v / plugins.entries.length * 100).toFixed(1);
  console.log('  ' + k + ': ' + v + ' (' + pct + '%)');
});
"
```

---

## Красные флаги

### Остановить загрузку, если:

| Флаг | Порог | Действие |
|------|-------|----------|
| Один механизм > 70% | `sample-playback > 70%` | Добавить синтезаторы |
| Один character > 50% | `warm > 50%` | Пересмотреть определения |
| Средние связи < 6 | `avg edges < 6` | Обогатить существующие |
| Валидация падает | `errors > 0` | Исправить перед продолжением |
| Появился новый тип | `unknown node_type` | Обсудить расширение |

---

## Шаблон записи инструмента

```json
{
  "id": "instrument-name",
  "node_type": "VSTPlugin",
  "name": "Instrument Name",
  "developer": "Developer Name",
  "domain": "synthetic",
  "definition": "Краткое описание инструмента и его назначения",
  "mechanisms": ["sample-playback"],
  "synthesis_method": "sample-based",
  "typical_for_genre": ["orchestral", "cinematic"],
  "produces_character": ["warm", "rich"],
  "evokes_mood": ["epic", "dramatic"],
  "supports_articulation": ["legato", "staccato"],
  "classification": {
    "hornbostel-sachs": "chordophone",
    "functional": "melody"
  }
}
```

---

## Прогресс заполнения

| Дата | Партия | Инструментов | Валидация | Примечания |
|------|--------|--------------|-----------|------------|
| — | Batch 1 | 0/10 | — | Ожидает |
| — | Batch 2 | 0/10 | — | — |
| — | Batch 3 | 0/10 | — | — |
| — | Batch 4 | 0/10 | — | — |
| — | Batch 5 | 0/10 | — | — |
| — | Batch 6 | 0/10 | — | — |

**Всего:** 0 инструментов  
**Эпистемических проверок:** 0/1

---

## Связанные документы

| Документ | Назначение |
|----------|------------|
| `VST_ENRICHMENT_PROMPT.md` | Промпт для LLM |
| `EXTENSION_POLICY.md` | Политика расширения |
| `validator.cjs` | Автоматическая валидация |
| `node-types.json` | Реестр типов |
| `relation-types.json` | Реестр связей |

---

*Этот документ обновляется после каждой партии.*
