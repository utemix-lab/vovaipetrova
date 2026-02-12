/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MEANING ENGINE — Универсальный механизм для семантических графов
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Phase 5.0: Separation
 * 
 * Engine не знает:
 * - Философии мира
 * - Конкретных типов узлов
 * - UI
 * 
 * Engine обеспечивает:
 * - Целостность (инварианты)
 * - Управляемую эволюцию (ChangeProtocol)
 * - Рефлексию (ReflectiveProjection)
 * - Снапшоты (GraphSnapshot)
 * - Валидацию (SchemaValidator)
 * - LLM-оркестрацию (LLMReflectionEngine)
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

// P5.0a.1 — World Interface Contract
export {
  WorldInterface,
  SchemaValidator,
  GraphValidator,
  WorldValidator,
} from "./WorldInterface.js";

export const ENGINE_VERSION = "0.1.0";

/**
 * Placeholder для MeaningEngine.
 * Будет реализован в P5.0d.
 */
export class MeaningEngine {
  constructor(world) {
    this.world = world;
    this.version = ENGINE_VERSION;
  }
  
  getVersion() {
    return this.version;
  }
}

export default MeaningEngine;
