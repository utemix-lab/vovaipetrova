/**
 * ⚠️ АРХИТЕКТУРНЫЙ ДНК ПРОЕКТА ⚠️
 *
 * Этот файл импортируется во все ключевые модули.
 * Изменения здесь требуют пересмотра всей архитектуры.
 *
 * ЗАМЫСЕЛ: Рефлексивная система с когнитивным гомеостазом
 * Текущая фаза: Визуальный прототип как архитектурный тренинг
 *
 * 🔄 ПРИНЦИП РАБОТЫ С АГЕНТОМ:
 * 1. Каждая фича — не просто код, а прообраз будущего слоя системы
 * 2. Каждый компонент должен думать о двух уровнях: UI сейчас + мета-система потом
 * 3. Агент должен на каждом PR/коммите задавать вопрос: "Как это соотносится с замыслом?"
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
  CURRENT_FOCUS: {
    phase: "VISUAL_PROTOTYPE_AS_ARCH_TRAINING",
    goal: "Каждая анимация UI → прообраз состояния мета-системы",
    nextStep: "React для сложных анимаций + абстракция GraphEngine"
  },
  CONSTRAINTS: {
    THREEJS_ROLE: "RENDERER_ONLY",
    STATE_MANAGEMENT: "SINGLE_SOURCE_OF_TRUTH",
    MODULE_REQUIREMENT: "DUAL_PURPOSE_CURRENT_AND_FUTURE",
    REACT_PURPOSE: "PATTERN_PROTOTYPING_AND_COMPLEX_ANIMATIONS"
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
