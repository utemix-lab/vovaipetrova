# Vovaipetrova

> Единая система знаний на основе онтологического графа

**Статус:** В разработке  
**Версия:** 1.0.0-alpha

---

## Быстрый старт

```bash
npm install
npm run dev
```

- Редактор графа: http://localhost:8080/editor.html
- 3D визуализация: http://localhost:5173/visitor.html

---

## Архитектура

```
vovaipetrova/
├── core/           # Ядро системы и документация
├── data/           # Данные графа и нарратив
└── render/         # 3D визуализация
```

**Единый источник истины:** `data/graph/universe.json`

---

## Разработка

```bash
npm run dev:render    # Запустить 3D визуализацию
npm run dev:editor    # Запустить редактор графа
npm test              # Запустить тесты
npm run validate      # Проверить структуру графа
```

---

## Деплой

```bash
npm run build         # Собрать render
npm run deploy        # Деплой на GitHub Pages
```

---

## Лицензия

MIT © utemix-lab
