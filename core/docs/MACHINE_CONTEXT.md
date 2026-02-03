# MACHINE_CONTEXT

> Контракт для LLM/IDE-агентов

**version:** 2.0  
**last_updated:** 2026-02-03

---

## 0. Как использовать этот документ

Этот файл — **контракт** для любого агента. Копируй целиком в начало сессии.

---

## 1. Фаза системы

Система в фазе **инженерной консолидации**.

- Архитектура определена и заморожена
- Цель — компактный инженерный код
- Нарратив сохранён в `data/narrative/`

---

## 2. Единственный источник истины

```
data/graph/universe.json
```

Определяет:
- узлы (nodes)
- связи (edges) 
- метаданные (Node Contract v1)

---

## 3. Структура репозитория

```
vovaipetrova/
├── core/           # Ядро и документация
├── data/           # Данные и нарратив
└── render/         # 3D визуализация
```

---

## 4. Node Contract v1

Каждый узел обязан иметь:

| Поле | Значения | Дефолт |
|------|----------|--------|
| id | string (глобальный) | — |
| type | root, hub, domain, concept, character, module, spec, process, policy | concept |
| visibility | public, internal, hidden | public |
| status | core, expandable, frozen, deprecated | expandable |

---

## 5. Пути и URL

База путей определена в `render/src/compat/paths.js`:

```javascript
export const PATHS = {
  DATA_ROOT: "/vovaipetrova/data",
  GRAPH: "/vovaipetrova/data/graph/universe.json"
};
```

---

## 6. Что нельзя делать

❌ Создавать второй граф  
❌ Редактировать universe.json вне editor.html  
❌ Смешивать narратив с кодом  
❌ Хардкодить пути в коде

---

## 7. Инструкция агенту

1. Прочитать этот документ
2. Использовать `render/src/compat/paths.js` для путей
3. Проверять структуру через `npm run validate`
4. Сохранять narратив только в `data/narrative/`

---

## 8. Главная директива

> Минимум кода, максимум ясности.
