# Quick Start

> Быстрый старт для работы с системой

---

## 1. Установка

```bash
git clone git@github.com:utemix-lab/vovaipetrova.git
cd vovaipetrova
npm install
```

---

## 2. Запуск

```bash
npm run dev
```

Откроются два интерфейса:
- **Редактор графа:** http://localhost:8080/editor.html
- **3D визуализация:** http://localhost:5173/visitor.html

---

## 3. Базовая работа

### Редактирование графа
1. Открыть http://localhost:8080/editor.html
2. Добавить узлы через интерфейс Cytoscape
3. Сохранить в `data/graph/universe.json`

### Просмотр в 3D
1. Открыть http://localhost:5173/visitor.html
2. Граф автоматически загрузится из `data/graph/universe.json`
3. Использовать мышь для навигации

---

## 4. Структура данных

**Единый источник истины:** `data/graph/universe.json`

```json
{
  "meta": {
    "version": "1.0"
  },
  "nodes": [...],
  "edges": [...]
}
```

---

## 5. Валидация

```bash
npm run validate
```

Проверяет структуру universe.json на соответствие Node Contract v1.

---

## 6. Деплой

```bash
npm run build
npm run deploy
```

Размещает 3D визуализацию на GitHub Pages.

---

## 7. Полезные команды

```bash
npm test              # Запустить тесты
npm run dev:render    # Только 3D визуализация
npm run dev:editor    # Только редактор графа
npm run clean         # Очистить node_modules
```

---

## 8. Структура проекта

```
vovaipetrova/
├── core/docs/        # Документация системы
├── data/            # Данные графа и нарратив
└── render/          # 3D визуализация
```

---

## Поддержка

- Документация: `core/docs/ARCHITECTURE.md`
- Контракт для агентов: `core/docs/MACHINE_CONTEXT.md`
- Нарратив: `data/narrative/`
