/**
 * @fileoverview Генератор конфигурации из правил онтологии
 * 
 * Генерирует VISUAL_CONFIG из архитектурных правил.
 * Это обеспечивает единый источник истины: онтология → правила → конфигурация.
 * 
 * @ArchProto(
 *   futureLayer: "ONTOLOGY_LAYER",
 *   patterns: ["Config generation", "Single source of truth"]
 * )
 */

import { NODE_TYPE_RULES, TOOL_CATEGORY_RULES } from "./architectural";
import type { OntologyNodeType } from "../schema";
import type { ToolCategory } from "../schema/tools";

// ═══════════════════════════════════════════════════════════════════════════
// ТИПЫ КОНФИГУРАЦИИ
// ═══════════════════════════════════════════════════════════════════════════

export interface NodeTypeConfig {
  size: number;
  pageTemplate: string;
  tooltip: string;
  tooltipById?: Record<string, string>;
}

export interface ToolConfig {
  icon: string;
  tooltip: string;
}

export interface GeneratedVisualConfig {
  nodeTypes: Record<OntologyNodeType, NodeTypeConfig>;
  tools: Record<ToolCategory, ToolConfig>;
}

// ═══════════════════════════════════════════════════════════════════════════
// ГЕНЕРАЦИЯ
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Генерирует конфигурацию nodeTypes из архитектурных правил.
 */
export function generateNodeTypesConfig(): Record<OntologyNodeType, NodeTypeConfig> {
  const config: Partial<Record<OntologyNodeType, NodeTypeConfig>> = {};
  
  for (const [type, rule] of Object.entries(NODE_TYPE_RULES)) {
    const nodeType = type as OntologyNodeType;
    
    config[nodeType] = {
      size: rule.sizeMultiplier,
      pageTemplate: rule.pageTemplate,
      tooltip: "{label}",
    };
    
    // Специальные tooltips для хабов
    if (nodeType === "hub") {
      config[nodeType]!.tooltipById = {
        characters: "Персонажи",
        domains: "Домены",
      };
    }
  }
  
  return config as Record<OntologyNodeType, NodeTypeConfig>;
}

/**
 * Генерирует конфигурацию tools из правил категорий.
 */
export function generateToolsConfig(): Record<ToolCategory, ToolConfig> {
  const config: Partial<Record<ToolCategory, ToolConfig>> = {};
  
  for (const [category, rule] of Object.entries(TOOL_CATEGORY_RULES)) {
    const toolCategory = category as ToolCategory;
    
    config[toolCategory] = {
      icon: rule.icon || toolCategory,
      tooltip: "{label}",
    };
  }
  
  return config as Record<ToolCategory, ToolConfig>;
}

/**
 * Генерирует полную визуальную конфигурацию из правил онтологии.
 */
export function generateVisualConfig(): GeneratedVisualConfig {
  return {
    nodeTypes: generateNodeTypesConfig(),
    tools: generateToolsConfig(),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// ВАЛИДАЦИЯ СООТВЕТСТВИЯ
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Проверяет, соответствует ли существующая конфигурация правилам.
 * Используется для обнаружения рассинхронизации.
 */
export function validateConfigAgainstRules(
  existingConfig: { nodeTypes: Record<string, { size: number; pageTemplate: string }> }
): { valid: boolean; mismatches: string[] } {
  const mismatches: string[] = [];
  
  for (const [type, rule] of Object.entries(NODE_TYPE_RULES)) {
    const config = existingConfig.nodeTypes[type];
    
    if (!config) {
      mismatches.push(`Тип ${type} отсутствует в конфигурации`);
      continue;
    }
    
    if (config.size !== rule.sizeMultiplier) {
      mismatches.push(
        `${type}.size: конфиг=${config.size}, правило=${rule.sizeMultiplier}`
      );
    }
    
    if (config.pageTemplate !== rule.pageTemplate) {
      mismatches.push(
        `${type}.pageTemplate: конфиг=${config.pageTemplate}, правило=${rule.pageTemplate}`
      );
    }
  }
  
  return {
    valid: mismatches.length === 0,
    mismatches,
  };
}
