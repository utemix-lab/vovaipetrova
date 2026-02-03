/**
 * Абстракция загрузки конфигурации графа
 * 
 * Поддерживает два режима:
 * - localDemo: текущие захардкоженные демо данные
 * - external: загрузка из extended-mind (пока заглушка)
 */

import { createDemoGraph } from "../demo/demoGraph.js";

/**
 * Режимы загрузки графа
 */
export const GraphSource = {
  LOCAL_DEMO: "localDemo",
  EXTERNAL: "external"
};

/**
 * Загружает конфигурацию графа из указанного источника
 * 
 * @param {string} source - Источник данных: "localDemo" или "external"
 * @param {object} options - Опции загрузки
 * @param {object} options.demoOptions - Опции для генерации демо-графа (nodeCount, linkFactor, seed)
 * @param {string} options.externalUrl - URL для загрузки внешнего графа (для режима external)
 * @returns {Promise<{nodes: Array, links: Array}>} Граф с узлами и связями
 */
const NODE_DEFAULTS = {
  type: "concept",
  visibility: "public",
  status: "expandable",
  semantics: {
    role: "content",
    abstraction: "medium"
  },
  rag: {
    index: true,
    priority: 0.5
  }
};

const VIEW_MAP = {
  knowledge: new Set(["domain", "concept", "character"]),
  system: new Set(["root", "hub", "module", "spec", "process", "policy"])
};

export async function loadGraphConfig(source = GraphSource.LOCAL_DEMO, options = {}) {
  switch (source) {
    case GraphSource.LOCAL_DEMO:
      return loadLocalDemo(options.demoOptions || {}, options.view || "all");
    
    case GraphSource.EXTERNAL:
      return loadExternal(options.externalUrl, options.view || "all");
    
    default:
      throw new Error(`Unknown graph source: ${source}`);
  }
}

/**
 * Загружает локальный демо-граф
 * 
 * @param {object} demoOptions - Опции для генерации демо-графа
 * @returns {Promise<{nodes: Array, links: Array}>} Демо-граф
 */
async function loadLocalDemo(demoOptions = {}, view) {
  // Используем текущий генератор демо-данных
  const graph = createDemoGraph(demoOptions);
  const filtered = applyViewFilter(graph.nodes, graph.links, view);
  return {
    nodes: filtered.nodes,
    links: filtered.links,
    meta: {
      source: GraphSource.LOCAL_DEMO,
      generated_at: new Date().toISOString()
    }
  };
}

/**
 * Загружает граф из внешнего источника (extended-mind)
 * 
 * @param {string} externalUrl - URL для загрузки графа
 * @returns {Promise<{nodes: Array, links: Array}>} Граф из extended-mind
 */
async function loadExternal(externalUrl, view) {
  const url = buildGraphUrl(externalUrl || "universe.json");
  const universe = await fetchJson(url);

  if (!universe || !Array.isArray(universe.nodes) || !Array.isArray(universe.edges)) {
    throw new Error("Invalid universe.json schema: expected { nodes: [], edges: [] }");
  }

  const normalizedNodes = universe.nodes.map((node) => normalizeNode(node));
  const normalizedEdges = universe.edges.map((edge) => ({
    ...edge,
    type: edge.type || "relates"
  }));

  const filtered = applyViewFilter(normalizedNodes, normalizedEdges, view);

  return {
    nodes: filtered.nodes,
    links: filtered.links,
    meta: {
      source: GraphSource.EXTERNAL,
      url
    }
  };
}

function normalizeNode(node) {
  const semantics = { ...NODE_DEFAULTS.semantics, ...(node.semantics || {}) };
  const rag = { ...NODE_DEFAULTS.rag, ...(node.rag || {}) };
  return {
    ...node,
    type: node.type || NODE_DEFAULTS.type,
    visibility: node.visibility || NODE_DEFAULTS.visibility,
    status: node.status || NODE_DEFAULTS.status,
    semantics,
    rag
  };
}

function applyViewFilter(nodes, links, view) {
  if (view === "all") {
    return {
      nodes,
      links
    };
  }

  const allowed = VIEW_MAP[view];
  if (!allowed) {
    return {
      nodes,
      links
    };
  }

  const allowedIds = new Set();
  const filteredNodes = nodes.filter((node) => {
    const type = node.type || NODE_DEFAULTS.type;
    const visible = type && allowed.has(type);
    if (visible) {
      allowedIds.add(node.id);
    }
    return visible;
  });

  const filteredLinks = links.filter((link) => {
    const sourceId = typeof link.source === "object" ? link.source.id : link.source;
    const targetId = typeof link.target === "object" ? link.target.id : link.target;
    return allowedIds.has(sourceId) && allowedIds.has(targetId);
  });

  return { nodes: filteredNodes, links: filteredLinks };
}

function buildGraphUrl(rawUrl) {
  try {
    return new URL(rawUrl, window.location.href).toString();
  } catch (error) {
    throw new Error(`Invalid graphUrl: ${rawUrl}`);
  }
}

async function fetchJson(url) {
  const response = await fetch(withCacheBust(url));
  if (!response.ok) {
    throw new Error(`Failed to load graph: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

function withCacheBust(url) {
  const next = new URL(url, window.location.href);
  next.searchParams.set("t", Date.now().toString());
  return next.toString();
}
