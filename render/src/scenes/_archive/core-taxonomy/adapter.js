/**
 * Core Taxonomy Adapter
 *
 * Трансформирует данные vovaipetrova-core (routes.json, kb_glossary_lite.jsonl,
 * stories_digests.jsonl) в формат cosmos-map для визуализации в dream-graph.
 */

import {
  NODE_TYPES,
  EDGE_KINDS,
  getRouteSection,
  getParentPath
} from "./schema.js";

/**
 * Построить граф Core Taxonomy из исходных данных
 * @param {Object} sources
 * @param {Object} sources.routes — содержимое routes.json
 * @param {Array} sources.glossary — массив объектов из kb_glossary_lite.jsonl
 * @param {Array} sources.digests — массив объектов из stories_digests.jsonl
 * @returns {{ nodes: Array, links: Array, schema: string }}
 */
export function buildCoreTaxonomyGraph(sources) {
  const { routes = {}, glossary = [], digests = [] } = sources;
  const nodes = [];
  const links = [];
  const nodeIds = new Set();

  // --- Routes ---
  const routeList = routes.routes || [];
  const routeByPath = new Map();

  routeList.forEach((route) => {
    const id = `route:${route.path}`;
    if (nodeIds.has(id)) return;
    nodeIds.add(id);

    const section = getRouteSection(route.path);
    nodes.push({
      id,
      label: route.title || route.path,
      type: NODE_TYPES.ROUTE,
      status: route.in_sitemap ? "active" : "draft",
      props: {
        path: route.path,
        in_sitemap: route.in_sitemap,
        og_title: route.og?.title || null,
        og_description: route.og?.description || null,
        section
      }
    });

    routeByPath.set(route.path, id);
  });

  // ROUTE_CHILD_OF edges
  routeList.forEach((route) => {
    const parentPath = getParentPath(route.path);
    if (parentPath && routeByPath.has(parentPath)) {
      links.push({
        source: `route:${route.path}`,
        target: routeByPath.get(parentPath),
        kind: EDGE_KINDS.ROUTE_CHILD_OF,
        directed: true,
        weight: 1
      });
    }
  });

  // --- Glossary Terms ---
  const termBySlug = new Map();

  glossary.forEach((term) => {
    const id = `term:${term.slug}`;
    if (nodeIds.has(id)) return;
    nodeIds.add(id);

    nodes.push({
      id,
      label: term.title || term.slug,
      type: NODE_TYPES.TERM,
      status: "active",
      props: {
        slug: term.slug,
        lite_summary: term.lite_summary || "",
        link: term.link || null
      }
    });

    termBySlug.set(term.slug, id);

    // TERM_LINKS_ROUTE edge (if term.link points to kb/...)
    if (term.link) {
      const linkPath = parseTermLink(term.link);
      if (linkPath && routeByPath.has(linkPath)) {
        links.push({
          source: id,
          target: routeByPath.get(linkPath),
          kind: EDGE_KINDS.TERM_LINKS_ROUTE,
          directed: true,
          weight: 2
        });
      }
    }
  });

  // ROUTE_MENTIONS_TERM edges (heuristic: route path contains /kb/<slug>)
  routeList.forEach((route) => {
    if (!route.path.startsWith("/kb/")) return;
    const slug = route.path.replace("/kb/", "").replace(/\/$/, "");
    if (termBySlug.has(slug)) {
      links.push({
        source: `route:${route.path}`,
        target: termBySlug.get(slug),
        kind: EDGE_KINDS.ROUTE_MENTIONS_TERM,
        directed: true,
        weight: 3
      });
    }
  });

  // --- Stories Digests ---
  digests.forEach((digest) => {
    const digestId = `digest:${digest.slug}`;
    if (nodeIds.has(digestId)) return;
    nodeIds.add(digestId);

    nodes.push({
      id: digestId,
      label: digest.title || digest.slug,
      type: NODE_TYPES.DIGEST,
      status: "active",
      props: {
        slug: digest.slug,
        summary: digest.summary || "",
        generated_at: digest.generated_at || null
      }
    });

    // Episodes
    const episodes = digest.episodes || [];
    episodes.forEach((ep, idx) => {
      const epSlug = ep.link
        ? ep.link.replace(/\.md$/, "")
        : `${digest.slug}-ep-${idx}`;
      const epId = `episode:${epSlug}`;
      if (!nodeIds.has(epId)) {
        nodeIds.add(epId);
        nodes.push({
          id: epId,
          label: ep.title || epSlug,
          type: NODE_TYPES.EPISODE,
          status: "active",
          props: {
            slug: epSlug,
            date: ep.date || null,
            description: ep.description || "",
            pr_links: ep.pr_links || []
          }
        });
      }

      links.push({
        source: digestId,
        target: epId,
        kind: EDGE_KINDS.DIGEST_HAS_EPISODE,
        directed: true,
        weight: 2
      });
    });
  });

  return {
    schema: "cosmos-map.v0.1",
    nodes,
    links
  };
}

/**
 * Парсинг ссылки из term.link (kb/xxx.md → /kb/xxx)
 * @param {string} link
 * @returns {string|null}
 */
function parseTermLink(link) {
  if (!link) return null;
  // "kb/aliases.md" → "/kb/aliases"
  const match = link.match(/^kb\/([^.]+)\.md$/);
  if (match) {
    return `/kb/${match[1]}`;
  }
  return null;
}

/**
 * Загрузить данные из URL и построить граф
 * @param {Object} urls
 * @param {string} urls.routes
 * @param {string} urls.glossary
 * @param {string} urls.digests
 * @returns {Promise<{ nodes: Array, links: Array, schema: string }>}
 */
export async function loadCoreTaxonomyFromUrls(urls) {
  const [routesRes, glossaryRes, digestsRes] = await Promise.all([
    fetch(urls.routes).then((r) => r.json()),
    fetch(urls.glossary).then((r) => r.text()),
    fetch(urls.digests).then((r) => r.text())
  ]);

  const glossary = parseJsonl(glossaryRes);
  const digests = parseJsonl(digestsRes);

  return buildCoreTaxonomyGraph({
    routes: routesRes,
    glossary,
    digests
  });
}

/**
 * Парсинг JSONL
 * @param {string} text
 * @returns {Array}
 */
function parseJsonl(text) {
  return text
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}
