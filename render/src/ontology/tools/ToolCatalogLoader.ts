/**
 * @fileoverview Загрузчик каталогов инструментов
 * 
 * Загружает и типизирует каталоги инструментов (практики, режимы, фильтры).
 * Инструменты НЕ являются узлами онтологии, но взаимодействуют с ней.
 * 
 * @ArchProto(
 *   futureLayer: "ONTOLOGY_LAYER",
 *   patterns: ["Catalog loader", "Type-safe tools"]
 * )
 */

import type { Practice, ToolCatalog, ToolCategory } from "../schema/tools";
import { TOOL_CATEGORY_RULES } from "../rules/architectural";

// ═══════════════════════════════════════════════════════════════════════════
// ТИПЫ
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Сырые данные каталога практик из JSON.
 */
interface RawPracticesCatalog {
  meta: {
    version: string;
    description: string;
    category: string;
  };
  practices: Array<{
    id: string;
    label: string;
    tags: string[];
    description?: string;
    relatedDomains?: string[];
  }>;
}

/**
 * Результат загрузки каталога.
 */
export interface CatalogLoadResult<T> {
  success: boolean;
  data?: T[];
  error?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// ЗАГРУЗЧИК
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Загружает каталог практик.
 */
export async function loadPracticesCatalog(
  basePath: string = ""
): Promise<CatalogLoadResult<Practice>> {
  const rule = TOOL_CATEGORY_RULES.practice;
  const url = `${basePath}/${rule.catalogPath}/${rule.catalogFile}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const raw: RawPracticesCatalog = await response.json();
    
    // Преобразуем в типизированные Practice
    const practices: Practice[] = raw.practices.map((p) => ({
      id: p.id,
      label: p.label,
      category: "practice" as const,
      tags: p.tags,
      description: p.description,
      relatedDomains: p.relatedDomains,
    }));
    
    console.log(`[Tools] Загружено практик: ${practices.length}`);
    
    return { success: true, data: practices };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[Tools] Не удалось загрузить практики: ${message}`);
    return { success: false, error: message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ГЛОБАЛЬНЫЙ КАТАЛОГ
// ═══════════════════════════════════════════════════════════════════════════

let globalToolCatalog: ToolCatalog | null = null;

/**
 * Инициализирует глобальный каталог инструментов.
 */
export async function initToolCatalog(basePath: string = ""): Promise<ToolCatalog> {
  const practicesResult = await loadPracticesCatalog(basePath);
  
  globalToolCatalog = {
    practices: practicesResult.data || [],
    modes: [],
    filters: [],
    lenses: [],
  };
  
  return globalToolCatalog;
}

/**
 * Получить глобальный каталог инструментов.
 */
export function getToolCatalog(): ToolCatalog | null {
  return globalToolCatalog;
}

/**
 * Получить практику по ID.
 */
export function getPracticeById(id: string): Practice | undefined {
  return globalToolCatalog?.practices.find((p) => p.id === id);
}

/**
 * Получить практики по тегу.
 */
export function getPracticesByTag(tag: string): Practice[] {
  return globalToolCatalog?.practices.filter((p) => p.tags.includes(tag)) || [];
}

/**
 * Получить практики, связанные с доменом.
 */
export function getPracticesByDomain(domainId: string): Practice[] {
  return globalToolCatalog?.practices.filter(
    (p) => p.relatedDomains?.includes(domainId)
  ) || [];
}
