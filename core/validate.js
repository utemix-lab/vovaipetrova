/**
 * Валидатор Universe Graph
 * Проверяет соответствие Node Contract v1
 */

import fs from 'fs';
import path from 'path';

const NODE_TYPES = [
  'root', 'hub', 'domain', 'concept', 'character', 
  'module', 'spec', 'process', 'policy', 'artifact',
  'practice', 'workbench', 'collab'
];

const VISIBILITY_TYPES = ['public', 'internal', 'hidden'];
const STATUS_TYPES = ['core', 'expandable', 'frozen', 'deprecated'];

/**
 * Валидирует структуру universe.json
 */
function validateUniverseGraph(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const universe = JSON.parse(content);
    
    const errors = [];
    
    // Проверяем базовую структуру
    if (!universe.meta) {
      errors.push('Missing meta section');
    }
    
    if (!Array.isArray(universe.nodes)) {
      errors.push('nodes must be an array');
    }
    
    if (!Array.isArray(universe.edges)) {
      errors.push('edges must be an array');
    }
    
    // Валидируем узлы
    if (universe.nodes) {
      universe.nodes.forEach((node, index) => {
        const nodeErrors = validateNode(node, index);
        errors.push(...nodeErrors);
      });
    }
    
    // Валидируем связи
    if (universe.edges) {
      universe.edges.forEach((edge, index) => {
        const edgeErrors = validateEdge(edge, index, universe.nodes);
        errors.push(...edgeErrors);
      });
    }
    
    return {
      valid: errors.length === 0,
      errors,
      summary: {
        nodes: universe.nodes?.length || 0,
        edges: universe.edges?.length || 0
      }
    };
    
  } catch (error) {
    return {
      valid: false,
      errors: [`Failed to read or parse JSON: ${error.message}`],
      summary: { nodes: 0, edges: 0 }
    };
  }
}

/**
 * Валидирует отдельный узел
 */
function validateNode(node, index) {
  const errors = [];
  const prefix = `Node[${index}]`;
  
  if (!node.id) {
    errors.push(`${prefix}: Missing required field 'id'`);
  }
  
  if (!node.label) {
    errors.push(`${prefix}: Missing required field 'label'`);
  }
  
  if (node.type && !NODE_TYPES.includes(node.type)) {
    errors.push(`${prefix}: Invalid type '${node.type}'. Allowed: ${NODE_TYPES.join(', ')}`);
  }
  
  if (node.visibility && !VISIBILITY_TYPES.includes(node.visibility)) {
    errors.push(`${prefix}: Invalid visibility '${node.visibility}'. Allowed: ${VISIBILITY_TYPES.join(', ')}`);
  }
  
  if (node.status && !STATUS_TYPES.includes(node.status)) {
    errors.push(`${prefix}: Invalid status '${node.status}'. Allowed: ${STATUS_TYPES.join(', ')}`);
  }
  
  return errors;
}

/**
 * Валидирует отдельную связь
 */
function validateEdge(edge, index, nodes) {
  const errors = [];
  const prefix = `Edge[${index}]`;
  
  if (!edge.source) {
    errors.push(`${prefix}: Missing required field 'source'`);
  }
  
  if (!edge.target) {
    errors.push(`${prefix}: Missing required field 'target'`);
  }
  
  // Проверяем существование узлов
  if (nodes && edge.source && edge.target) {
    const sourceId = typeof edge.source === 'object' ? edge.source.id : edge.source;
    const targetId = typeof edge.target === 'object' ? edge.target.id : edge.target;
    
    const sourceExists = nodes.some(n => n.id === sourceId);
    const targetExists = nodes.some(n => n.id === targetId);
    
    if (!sourceExists) {
      errors.push(`${prefix}: Source node '${sourceId}' not found`);
    }
    
    if (!targetExists) {
      errors.push(`${prefix}: Target node '${targetId}' not found`);
    }
  }
  
  return errors;
}

// CLI интерфейс
if (import.meta.url === `file://${process.argv[1]}`) {
  const graphPath = path.join(process.cwd(), 'render', 'public', 'graph', 'universe.json');
  const result = validateUniverseGraph(graphPath);
  
  if (result.valid) {
    console.log('✅ Universe Graph is valid');
    console.log(`📊 Summary: ${result.summary.nodes} nodes, ${result.summary.edges} edges`);
  } else {
    console.log('❌ Universe Graph validation failed:');
    result.errors.forEach(error => console.log(`  - ${error}`));
    process.exit(1);
  }
}

export { validateUniverseGraph };
