/**
 * ⚠️ АРХИТЕКТУРНЫЙ ДНК ПРОЕКТА ⚠️
 *
 * Этот файл импортируется во все ключевые модули.
 * Изменения здесь требуют пересмотра всей архитектуры.
 *
 * ЗАМЫСЕЛ: Графоцентричная система — онтологический граф как единственный источник истины
 * 
 * ТЕКУЩАЯ ФАЗА: Визуал-first (Фаза 1)
 * - Строим простой интерфейс для путешествия по графу
 * - Никакой "магии" — классический веб с паттерном "клик → реакция"
 * - React — мост для будущей сложности, не самоцель
 *
 * КЛЮЧЕВОЙ АКЦЕНТ:
 * Мост к будущей сложности (RAG, LLM, рефлексия) — это НЕ поведение пользователя.
 * Мост — это онтология узлов, инструменты (pointer-tags) и режимы (query mode, routes).
 * Пользователь ходит по графу, а граф — основа саморефлексивной системы.
 * Но система НЕ реагирует на действия пользователя как "сознательная" сущность.
 *
 * ПОДХОД: Идём от визуала к архитектуре, не наоборот.
 */

export const ARCHITECTURE = {
  STACK_LAYERS: [
    "CODE_LAYER",
    "AST_LAYER",
    "ONTOLOGY_LAYER",
    "BRIDGE_LAYER",
    "AGENT_LAYER",
    "REFLECTION_LAYER"
  ] as const,
  
  // Текущая фаза: Визуал-first
  CURRENT_FOCUS: {
    phase: "VISUAL_FIRST_INTERFACE_BUILDING",
    goal: "Простой интерфейс для путешествия по графу",
    bridge: "Онтология узлов, pointer-tags, режимы (НЕ клики пользователя)",
    noMagic: true
  },
  
  // Фазы развития
  PHASES: {
    CURRENT: "visual_first",      // Фаза 1: Визуальный каркас
    NEXT: "ontology_layer",       // Фаза 2: Онтологический слой
    FUTURE: "reflection"          // Фаза 3: RAG, LLM, рефлексия
  },
  
  CONSTRAINTS: {
    THREEJS_ROLE: "RENDERER_ONLY",
    GRAPH_ROLE: "SINGLE_SOURCE_OF_TRUTH",
    REACT_ROLE: "BRIDGE_FOR_FUTURE_COMPLEXITY",
    USER_CLICKS: "CLASSIC_WEB_PATTERN_NOT_SEMANTIC_EVENTS"
  },
  SUCCESS_METRICS: {
    REACT_INTEGRATION: [
      "Анимации стали существенно проще",
      "Стейт синхронизирован между 3D и UI",
      "Появился GraphEngine абстрактный слой",
      "Код стал декларативнее"
    ],
    ARCHITECTURE_PROGRESS: [
      "Компоненты помечены архитектурным назначением",
      "Система событий имитирует будущий агентный API",
      "Типы данных готовы к расширению на AST/OWL"
    ]
  }
} as const;

export type StackLayer = typeof ARCHITECTURE.STACK_LAYERS[number];

export interface ArchAnnotatedModule {
  currentPurpose: string;
  futureLayer: StackLayer;
  prototypePatterns: string[];
}

export function ArchProto(
  futureLayer: StackLayer,
  patterns: string[]
): ClassDecorator & MethodDecorator {
  return (target: any) => {
    target._archMetadata = { futureLayer, patterns };
    return target;
  };
}

export function validateAgainstArchitecture(module: any): string[] {
  const violations: string[] = [];

  if (!module?._archMetadata) {
    violations.push("Модуль не помечен @ArchProto - агент не поймёт его роль");
  }

  const currentFocus = ARCHITECTURE.CURRENT_FOCUS.phase;
  if (currentFocus.includes("VISUAL") && module?.name && !module.name.includes("Visual")) {
    violations.push("Модуль не соответствует текущему фокусу на визуальном прототипе");
  }

  return violations;
}
