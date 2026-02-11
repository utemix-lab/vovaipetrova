/**
 * @fileoverview Онтологические сущности
 * 
 * Типизированные определения для каждого типа узла онтологии.
 * Расширяют базовый OntologyNode специфичными метаданными.
 * 
 * @ArchProto(
 *   futureLayer: "ONTOLOGY_LAYER",
 *   patterns: ["Entity specialization", "Discriminated unions"]
 * )
 */

import type { OntologyNode, NodeId } from "./core";

// ═══════════════════════════════════════════════════════════════════════════
// ROOT — Корневые узлы
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Корневой узел системы.
 * 
 * - Universe — пользовательская часть, визуал + логика
 * - Cryptocosm — рефлексивная часть (будущее)
 */
export interface RootNode extends OntologyNode {
  type: "root";
}

/** Известные корневые узлы */
export const ROOT_NODE_IDS = ["universe", "cryptocosm"] as const;
export type RootNodeId = typeof ROOT_NODE_IDS[number];

// ═══════════════════════════════════════════════════════════════════════════
// HUB — Хабы-контейнеры
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Хаб — контейнер для группы узлов одного типа.
 * 
 * - Characters — хаб персонажей
 * - Domains — хаб доменов
 */
export interface HubNode extends OntologyNode {
  type: "hub";
}

/** Известные хабы */
export const HUB_NODE_IDS = ["characters", "domains"] as const;
export type HubNodeId = typeof HUB_NODE_IDS[number];

// ═══════════════════════════════════════════════════════════════════════════
// CHARACTER — Персонажи
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Персонаж — агент или пользователь системы.
 * 
 * Персонажи связаны с доменами (интересы) и воркбенчами (владение).
 */
export interface CharacterNode extends OntologyNode {
  type: "character";
}

/** Известные персонажи (core) */
export const CORE_CHARACTER_IDS = [
  "character-vova",
  "character-petrova",
] as const;

/** Все персонажи */
export const CHARACTER_NODE_IDS = [
  ...CORE_CHARACTER_IDS,
  "character-ai",
  "character-runa",
  "character-hinto",
  "character-ancy",
  "character-ney",
  "character-dizi",
  "character-cadrik",
  "character-geymych",
  "character-author",
  "character-vasya",
] as const;

export type CharacterNodeId = typeof CHARACTER_NODE_IDS[number];

// ═══════════════════════════════════════════════════════════════════════════
// DOMAIN — Домены
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Домен — тематическая область знаний/деятельности.
 * 
 * Домены связывают персонажей и воркбенчи по интересам.
 */
export interface DomainNode extends OntologyNode {
  type: "domain";
}

/** Известные домены */
export const DOMAIN_NODE_IDS = [
  "domain-ai",
  "domain-music",
  "domain-visual",
  "domain-knowledge",
  "domain-dev",
  "domain-design",
  "domain-physical",
  "domain-interactive",
] as const;

export type DomainNodeId = typeof DOMAIN_NODE_IDS[number];

// ═══════════════════════════════════════════════════════════════════════════
// WORKBENCH — Воркбенчи
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Воркбенч — рабочее пространство персонажа.
 * 
 * Принадлежит одному персонажу, связан с доменами.
 */
export interface WorkbenchNode extends OntologyNode {
  type: "workbench";
}

// ═══════════════════════════════════════════════════════════════════════════
// COLLAB — Коллабы
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Коллаб — совместный проект нескольких персонажей.
 * 
 * Связан с несколькими персонажами и воркбенчами.
 */
export interface CollabNode extends OntologyNode {
  type: "collab";
}

/** Известные коллабы */
export const COLLAB_NODE_IDS = [
  "workbench-as-if",  // Исторически с префиксом workbench
  "collab-circus-technologies",
  "collab-minds-lorgnette",
  "collab-dream-graph",
  "collab-om",
  "collab-lykeion",
] as const;

export type CollabNodeId = typeof COLLAB_NODE_IDS[number];

// ═══════════════════════════════════════════════════════════════════════════
// DISCRIMINATED UNION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Объединение всех типов узлов онтологии.
 * Используется для type-safe обработки узлов.
 */
export type AnyOntologyNode =
  | RootNode
  | HubNode
  | CharacterNode
  | DomainNode
  | WorkbenchNode
  | CollabNode;

// ═══════════════════════════════════════════════════════════════════════════
// TYPE GUARDS
// ═══════════════════════════════════════════════════════════════════════════

export function isRootNode(node: OntologyNode): node is RootNode {
  return node.type === "root";
}

export function isHubNode(node: OntologyNode): node is HubNode {
  return node.type === "hub";
}

export function isCharacterNode(node: OntologyNode): node is CharacterNode {
  return node.type === "character";
}

export function isDomainNode(node: OntologyNode): node is DomainNode {
  return node.type === "domain";
}

export function isWorkbenchNode(node: OntologyNode): node is WorkbenchNode {
  return node.type === "workbench";
}

export function isCollabNode(node: OntologyNode): node is CollabNode {
  return node.type === "collab";
}
