# Онтологическая карта графа

> Сгенерировано из `universe.json`
> Дата: 2026-02-11

---

## Системные узлы (root)

### Universe
- **Тип:** root
- **Связи:** Cryptocosm, Characters (хаб), Domains (хаб), Practices (хаб)

### Cryptocosm
- **Тип:** root
- **Связи:** Universe

---

## Персонажи (character)

### Вова
- **Домены:** AI & Computational Models, Music & Sound Culture
- **Воркбенчи:** Музыка в целом, VSTablishment, Zucken‑Drücken
- **Коллабы:** As if

### Петрова
- **Домены:** Visual & Media Arts, AI & Computational Models, Design & Aesthetic Systems
- **Воркбенчи:** Анимация +, Brand Direction
- **Коллабы:** Circus Technologies

### ИИ
- **Домены:** AI & Computational Models
- **Воркбенчи:** Iron Fairy Tales
- **Коллабы:** Circus Technologies, Mind's Lorgnette

### Руна
- **Домены:** AI & Computational Models, Software & Digital Tools
- **Воркбенчи:** Mojibake
- **Коллабы:** Mind's Lorgnette, Dream Graph

### Хинто
- **Домены:** AI & Computational Models, Software & Digital Tools
- **Воркбенчи:** Ji (ジ)
- **Коллабы:** —

### Ancy
- **Домены:** Knowledge Systems & Cognitive Architectures
- **Воркбенчи:** Narrative Dump, Evoquant
- **Коллабы:** Mind's Lorgnette, Lykeion

### Нэй
- **Домены:** AI & Computational Models, Visual & Media Arts
- **Воркбенчи:** Appearance Atelier
- **Коллабы:** —

### Дизи
- **Домены:** Design & Aesthetic Systems, Visual & Media Arts
- **Воркбенчи:** Homo Perceptivus, Киберантика
- **Коллабы:** Dream Graph

### CADрик
- **Домены:** Architecture & Physical Realization
- **Воркбенчи:** Solidol
- **Коллабы:** ОМ

### Геймыч
- **Домены:** Interactive Systems & Game Culture
- **Воркбенчи:** Playfield, Word Machine
- **Коллабы:** Lykeion

### Автор
- **Домены:** AI & Computational Models, Music & Sound Culture, Architecture & Physical Realization
- **Воркбенчи:** Моралите
- **Коллабы:** ОМ

### Вася
- **Домены:** Visual & Media Arts, Interactive Systems & Game Culture, Music & Sound Culture
- **Воркбенчи:** Frame Grinder
- **Коллабы:** As if

---

## Домены (domain)

### AI & Computational Models
- **Персонажи:** Вова, Петрова, ИИ, Руна, Хинто, Нэй, Автор

### Music & Sound Culture
- **Персонажи:** Вова, Автор, Вася

### Visual & Media Arts
- **Персонажи:** Петрова, Вася, Нэй, Дизи
- **Связи с доменами:** Design & Aesthetic Systems

### Knowledge Systems & Cognitive Architectures
- **Персонажи:** Ancy

### Software & Digital Tools
- **Персонажи:** Руна, Хинто
- **Связи с доменами:** Architecture & Physical Realization, Interactive Systems & Game Culture

### Design & Aesthetic Systems
- **Персонажи:** Петрова, Дизи
- **Связи с доменами:** Visual & Media Arts

### Architecture & Physical Realization
- **Персонажи:** CADрик, Автор
- **Связи с доменами:** Software & Digital Tools

### Interactive Systems & Game Culture
- **Персонажи:** Вася, Геймыч
- **Связи с доменами:** Software & Digital Tools

---

## Воркбенчи (workbench)

### Музыка в целом
- **Владелец:** Вова

### VSTablishment
- **Владелец:** Вова

### Zucken‑Drücken
- **Владелец:** Вова

### Анимация +
- **Владелец:** Петрова

### Brand Direction
- **Владелец:** Петрова

### Iron Fairy Tales
- **Владелец:** ИИ

### Frame Grinder
- **Владелец:** Вася

### Appearance Atelier
- **Владелец:** Нэй

### Solidol
- **Владелец:** CADрик

### Mojibake
- **Владелец:** Руна

### Ji (ジ)
- **Владелец:** Хинто

### Narrative Dump
- **Владелец:** Ancy

### Evoquant
- **Владелец:** Ancy
- **Связи:** Lykeion

### Playfield
- **Владелец:** Геймыч

### Word Machine
- **Владелец:** Геймыч
- **Связи:** Lykeion

### Homo Perceptivus
- **Владелец:** Дизи

### Киберантика
- **Владелец:** Дизи

### Моралите
- **Владелец:** Автор

---

## Коллабы (collab)

### As if
- **Участники:** Вова, Вася

### Circus Technologies
- **Участники:** Петрова, ИИ

### Mind's Lorgnette
- **Участники:** ИИ, Руна, Ancy

### Dream Graph
- **Участники:** Руна, Дизи

### ОМ
- **Участники:** CADрик, Автор

### Lykeion
- **Участники:** Ancy, Геймыч
- **Связи:** Word Machine, Evoquant

---

## Инструменты (tools) — не узлы онтологии

> Практики вынесены из онтологии в категорию инструментов.
> См. `VISUAL_CONFIG.tools` в `render/src/visual/config.js`

- Системное мышление
- Антитаксономическая навигация
- Исследовательское мышление
- Режиссура
- Дизайн систем
- Архитектурное проектирование
- Визуальное мышление
- Звуковое мышление
- Интерактивное мышление
- Брендинг
- Экосистемное мышление
- Кураторство и отбор
- Рефлексия и фиксация
- Навигация по возможностям
