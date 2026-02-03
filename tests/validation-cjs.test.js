const fs = require('fs');
const path = require('path');

// Простая валидация без ES modules
function validateUniverseGraph(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const universe = JSON.parse(content);
    
    const errors = [];
    
    if (!universe.meta) {
      errors.push('Missing meta section');
    }
    
    if (!Array.isArray(universe.nodes)) {
      errors.push('nodes must be an array');
    }
    
    if (!Array.isArray(universe.edges)) {
      errors.push('edges must be an array');
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

// Tests
describe('Universe Graph Validation', () => {
  const graphPath = path.join(__dirname, '../data/graph/universe.json');
  
  test('universe.json should exist', () => {
    expect(fs.existsSync(graphPath)).toBe(true);
  });
  
  test('universe.json should be valid JSON', () => {
    const content = fs.readFileSync(graphPath, 'utf8');
    expect(() => JSON.parse(content)).not.toThrow();
  });
  
  test('universe.json should pass validation', () => {
    const result = validateUniverseGraph(graphPath);
    expect(result.valid).toBe(true);
    if (!result.valid) {
      console.log('Validation errors:', result.errors);
    }
  });
  
  test('universe.json should have required structure', () => {
    const content = fs.readFileSync(graphPath, 'utf8');
    const universe = JSON.parse(content);
    
    expect(universe).toHaveProperty('meta');
    expect(universe).toHaveProperty('nodes');
    expect(universe).toHaveProperty('edges');
    expect(Array.isArray(universe.nodes)).toBe(true);
    expect(Array.isArray(universe.edges)).toBe(true);
  });
});

describe('Project Structure', () => {
  test('core documentation should exist', () => {
    const docs = [
      '../core/docs/MACHINE_CONTEXT.md',
      '../core/docs/ARCHITECTURE.md',
      '../core/docs/QUICK_START.md'
    ];
    
    docs.forEach(doc => {
      expect(fs.existsSync(path.join(__dirname, doc))).toBe(true);
    });
  });
  
  test('render compatibility layer should exist', () => {
    const compatPath = path.join(__dirname, '../render/src/compat/paths.js');
    expect(fs.existsSync(compatPath)).toBe(true);
  });
});
