export function loadCosmosMap(json) {
  if (!json || typeof json !== "object") {
    throw new Error("Cosmos Map JSON is missing or invalid");
  }

  if (!json.schema || typeof json.schema !== "string") {
    throw new Error("Missing schema: expected cosmos-map.v0.1");
  }

  if (json.schema !== "cosmos-map.v0.1") {
    throw new Error(`Unsupported schema: ${json.schema}`);
  }

  if (!Array.isArray(json.nodes) || !Array.isArray(json.links)) {
    throw new Error("Missing nodes or links arrays");
  }

  const nodes = json.nodes.map((node) => {
    if (!node || typeof node.id !== "string" || node.id.trim() === "") {
      throw new Error("Every node must have a non-empty string id");
    }
    return { ...node };
  });

  const links = json.links.map((link) => {
    const source = normalizeLinkEnd(link?.source);
    const target = normalizeLinkEnd(link?.target);

    if (!source || !target) {
      throw new Error("Every link must have source and target");
    }

    return { ...link, source, target };
  });

  return { nodes, links };
}

function normalizeLinkEnd(value) {
  if (typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object" && typeof value.id === "string") {
    return value.id;
  }

  return null;
}
