/**
 * VST Semantic Graph Validator v1.0
 * 
 * Автоматическая валидация графа согласно USG Standard и VST Ontology Profile.
 * 
 * Использование:
 *   node validator.js [--fix] [--verbose]
 * 
 * Флаги:
 *   --fix      Автоматически исправлять простые ошибки
 *   --verbose  Подробный вывод
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CATALOGS_DIR = __dirname;
const NODES_DIR = path.join(CATALOGS_DIR, 'nodes');

const FORBIDDEN_STRING_ARRAYS = [
  'articulations',
  'genres', 
  'characters',
  'moods',
  'synthesis_methods',
  'mechanisms'
];

// ============================================================================
// LOAD REGISTRIES
// ============================================================================

function loadJSON(filepath) {
  try {
    const content = fs.readFileSync(filepath, 'utf-8');
    return JSON.parse(content);
  } catch (e) {
    console.error(`❌ Cannot load ${filepath}: ${e.message}`);
    return null;
  }
}

function loadNodeTypes() {
  return loadJSON(path.join(CATALOGS_DIR, 'node-types.json'));
}

function loadRelationTypes() {
  return loadJSON(path.join(CATALOGS_DIR, 'relation-types.json'));
}

function loadAllCatalogs() {
  const catalogs = {};
  
  if (!fs.existsSync(NODES_DIR)) {
    console.error(`❌ Nodes directory not found: ${NODES_DIR}`);
    return catalogs;
  }
  
  const files = fs.readdirSync(NODES_DIR).filter(f => f.endsWith('.json'));
  
  for (const file of files) {
    const filepath = path.join(NODES_DIR, file);
    const data = loadJSON(filepath);
    if (data) {
      catalogs[file] = data;
    }
  }
  
  return catalogs;
}

// ============================================================================
// VALIDATORS
// ============================================================================

class ValidationResult {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.info = [];
  }
  
  error(message, context = {}) {
    this.errors.push({ message, ...context });
  }
  
  warn(message, context = {}) {
    this.warnings.push({ message, ...context });
  }
  
  log(message, context = {}) {
    this.info.push({ message, ...context });
  }
  
  get isValid() {
    return this.errors.length === 0;
  }
  
  summary() {
    return {
      valid: this.isValid,
      errors: this.errors.length,
      warnings: this.warnings.length,
      info: this.info.length
    };
  }
}

/**
 * Validate that all nodes have required node_type field
 */
function validateNodeTypes(catalogs, nodeTypesRegistry, result) {
  const registeredTypes = Object.keys(nodeTypesRegistry.types);
  
  for (const [filename, catalog] of Object.entries(catalogs)) {
    if (!catalog.entries) continue;
    
    for (const entry of catalog.entries) {
      // Check node_type exists
      if (!entry.node_type) {
        result.error(`Missing node_type`, { file: filename, node: entry.id });
        continue;
      }
      
      // Check node_type is registered
      if (!registeredTypes.includes(entry.node_type)) {
        result.error(`Unregistered node_type: ${entry.node_type}`, { 
          file: filename, 
          node: entry.id,
          registered: registeredTypes
        });
      }
    }
  }
}

/**
 * Validate that all nodes have required domain field (for concepts)
 */
function validateDomains(catalogs, nodeTypesRegistry, result) {
  const validDomains = Object.keys(nodeTypesRegistry.domains);
  
  for (const [filename, catalog] of Object.entries(catalogs)) {
    if (!catalog.entries) continue;
    
    for (const entry of catalog.entries) {
      if (!entry.node_type) continue;
      
      const typeSpec = nodeTypesRegistry.types[entry.node_type];
      if (!typeSpec) continue;
      
      // Check if domain is required for this type
      if (typeSpec.domain !== null) {
        if (!entry.domain) {
          result.error(`Missing domain for ${entry.node_type}`, { 
            file: filename, 
            node: entry.id,
            expected: typeSpec.domain
          });
        } else if (!validDomains.includes(entry.domain)) {
          result.error(`Invalid domain: ${entry.domain}`, { 
            file: filename, 
            node: entry.id,
            valid: validDomains
          });
        }
      }
    }
  }
}

/**
 * Validate that concepts have definitions
 */
function validateDefinitions(catalogs, nodeTypesRegistry, result) {
  for (const [filename, catalog] of Object.entries(catalogs)) {
    if (!catalog.entries) continue;
    
    for (const entry of catalog.entries) {
      if (!entry.node_type) continue;
      
      const typeSpec = nodeTypesRegistry.types[entry.node_type];
      if (!typeSpec) continue;
      
      // Check if definition is required
      if (typeSpec.required_fields && typeSpec.required_fields.includes('definition')) {
        if (!entry.definition) {
          result.error(`Missing definition`, { file: filename, node: entry.id });
        }
      }
    }
  }
}

/**
 * Validate that forbidden string arrays are not used
 */
function validateNoStringArrays(catalogs, result) {
  for (const [filename, catalog] of Object.entries(catalogs)) {
    if (!catalog.entries) continue;
    
    for (const entry of catalog.entries) {
      for (const forbidden of FORBIDDEN_STRING_ARRAYS) {
        if (entry[forbidden] && Array.isArray(entry[forbidden])) {
          // Check if it's a string array (not edge references)
          const firstItem = entry[forbidden][0];
          if (typeof firstItem === 'string' && !firstItem.startsWith('edge:')) {
            result.warn(`String array '${forbidden}' should be edges`, { 
              file: filename, 
              node: entry.id,
              value: entry[forbidden]
            });
          }
        }
      }
    }
  }
}

/**
 * Validate articulation applicable_to_mechanisms
 */
function validateArticulationApplicability(catalogs, result) {
  const articulationsFile = 'articulations.json';
  const mechanismsFile = 'sound-production-mechanisms.json';
  
  const articulations = catalogs[articulationsFile];
  const mechanisms = catalogs[mechanismsFile];
  
  if (!articulations || !mechanisms) {
    result.log('Skipping articulation applicability check (missing catalogs)');
    return;
  }
  
  const validMechanisms = mechanisms.entries.map(m => m.id);
  
  for (const art of articulations.entries) {
    if (!art.applicable_to_mechanisms) {
      result.error(`Missing applicable_to_mechanisms`, { 
        file: articulationsFile, 
        node: art.id 
      });
      continue;
    }
    
    for (const mech of art.applicable_to_mechanisms) {
      if (!validMechanisms.includes(mech)) {
        result.error(`Invalid mechanism reference: ${mech}`, { 
          file: articulationsFile, 
          node: art.id,
          valid: validMechanisms
        });
      }
    }
  }
}

/**
 * Validate relation types are registered
 */
function validateRelationTypes(catalogs, relationTypesRegistry, result) {
  const registeredRelations = Object.keys(relationTypesRegistry.relations);
  
  for (const [filename, catalog] of Object.entries(catalogs)) {
    if (!catalog.entries) continue;
    
    for (const entry of catalog.entries) {
      if (!entry.edges) continue;
      
      for (const relationType of Object.keys(entry.edges)) {
        if (!registeredRelations.includes(relationType)) {
          result.error(`Unregistered relation type: ${relationType}`, { 
            file: filename, 
            node: entry.id,
            registered: registeredRelations
          });
        }
      }
    }
  }
}

/**
 * Validate relation from → to constraints
 */
function validateRelationConstraints(catalogs, relationTypesRegistry, nodeTypesRegistry, result) {
  for (const [filename, catalog] of Object.entries(catalogs)) {
    if (!catalog.entries) continue;
    
    for (const entry of catalog.entries) {
      if (!entry.edges || !entry.node_type) continue;
      
      for (const [relationType, targets] of Object.entries(entry.edges)) {
        const relationSpec = relationTypesRegistry.relations[relationType];
        if (!relationSpec) continue;
        
        // Check 'from' constraint
        if (relationSpec.from && !relationSpec.from.includes('Any')) {
          if (!relationSpec.from.includes(entry.node_type)) {
            result.error(`Invalid 'from' for ${relationType}: ${entry.node_type}`, { 
              file: filename, 
              node: entry.id,
              allowed: relationSpec.from
            });
          }
        }
        
        // Note: 'to' validation requires resolving target node types
        // This is a simplified check
      }
    }
  }
}

/**
 * Check for duplicate node IDs across catalogs
 */
function validateNoDuplicateIds(catalogs, result) {
  const allIds = new Map();
  
  for (const [filename, catalog] of Object.entries(catalogs)) {
    if (!catalog.entries) continue;
    
    for (const entry of catalog.entries) {
      if (allIds.has(entry.id)) {
        result.error(`Duplicate node ID: ${entry.id}`, { 
          file: filename, 
          existingFile: allIds.get(entry.id)
        });
      } else {
        allIds.set(entry.id, filename);
      }
    }
  }
  
  result.log(`Total unique nodes: ${allIds.size}`);
}

// ============================================================================
// SEMANTIC QUERIES (test graph capabilities)
// ============================================================================

/**
 * Test: "Show all synthesis methods typical for ambient"
 */
function testQuerySynthesisForGenre(catalogs, genreId = 'ambient') {
  const synthMethods = catalogs['synthesis-methods.json'];
  if (!synthMethods) return null;
  
  const results = synthMethods.entries.filter(method => 
    method.typical_for_genre && method.typical_for_genre.includes(genreId)
  );
  
  return results.map(r => r.id);
}

/**
 * Test: "What articulations are possible for bowed mechanism?"
 */
function testQueryArticulationsForMechanism(catalogs, mechanismId = 'bowed') {
  const articulations = catalogs['articulations.json'];
  if (!articulations) return null;
  
  const results = articulations.entries.filter(art => 
    art.applicable_to_mechanisms && art.applicable_to_mechanisms.includes(mechanismId)
  );
  
  return results.map(r => r.id);
}

/**
 * Test: "How does wavetable differ from sample-based?"
 */
function testQueryCompare(catalogs, id1 = 'wavetable', id2 = 'sample-based') {
  const synthMethods = catalogs['synthesis-methods.json'];
  if (!synthMethods) return null;
  
  const method1 = synthMethods.entries.find(m => m.id === id1);
  const method2 = synthMethods.entries.find(m => m.id === id2);
  
  if (!method1 || !method2) return null;
  
  return {
    [id1]: {
      definition: method1.definition,
      produces_character: method1.produces_character,
      typical_for_genre: method1.typical_for_genre
    },
    [id2]: {
      definition: method2.definition,
      produces_character: method2.produces_character,
      typical_for_genre: method2.typical_for_genre
    }
  };
}

// ============================================================================
// MAIN
// ============================================================================

function runValidation(options = {}) {
  const { verbose = false, fix = false } = options;
  
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  VST Semantic Graph Validator v1.0');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  // Load registries
  const nodeTypesRegistry = loadNodeTypes();
  const relationTypesRegistry = loadRelationTypes();
  
  if (!nodeTypesRegistry || !relationTypesRegistry) {
    console.error('❌ Cannot load registries. Aborting.');
    process.exit(1);
  }
  
  console.log(`✓ Loaded node-types.json (${Object.keys(nodeTypesRegistry.types).length} types)`);
  console.log(`✓ Loaded relation-types.json (${Object.keys(relationTypesRegistry.relations).length} relations)\n`);
  
  // Load catalogs
  const catalogs = loadAllCatalogs();
  const catalogCount = Object.keys(catalogs).length;
  console.log(`✓ Loaded ${catalogCount} catalogs\n`);
  
  // Run validations
  const result = new ValidationResult();
  
  console.log('Running validations...\n');
  
  validateNodeTypes(catalogs, nodeTypesRegistry, result);
  validateDomains(catalogs, nodeTypesRegistry, result);
  validateDefinitions(catalogs, nodeTypesRegistry, result);
  validateNoStringArrays(catalogs, result);
  validateArticulationApplicability(catalogs, result);
  validateNoDuplicateIds(catalogs, result);
  
  if (relationTypesRegistry.relations) {
    validateRelationTypes(catalogs, relationTypesRegistry, result);
    validateRelationConstraints(catalogs, relationTypesRegistry, nodeTypesRegistry, result);
  }
  
  // Output results
  console.log('───────────────────────────────────────────────────────────────');
  console.log('  VALIDATION RESULTS');
  console.log('───────────────────────────────────────────────────────────────\n');
  
  if (result.errors.length > 0) {
    console.log(`❌ ERRORS (${result.errors.length}):\n`);
    for (const err of result.errors) {
      console.log(`  • ${err.message}`);
      if (err.file) console.log(`    File: ${err.file}`);
      if (err.node) console.log(`    Node: ${err.node}`);
      if (verbose && err.valid) console.log(`    Valid: ${err.valid.join(', ')}`);
      console.log('');
    }
  }
  
  if (result.warnings.length > 0) {
    console.log(`⚠️  WARNINGS (${result.warnings.length}):\n`);
    for (const warn of result.warnings) {
      console.log(`  • ${warn.message}`);
      if (warn.file) console.log(`    File: ${warn.file}`);
      if (warn.node) console.log(`    Node: ${warn.node}`);
      console.log('');
    }
  }
  
  if (verbose && result.info.length > 0) {
    console.log(`ℹ️  INFO (${result.info.length}):\n`);
    for (const info of result.info) {
      console.log(`  • ${info.message}`);
    }
    console.log('');
  }
  
  // Semantic query tests
  console.log('───────────────────────────────────────────────────────────────');
  console.log('  SEMANTIC QUERY TESTS');
  console.log('───────────────────────────────────────────────────────────────\n');
  
  const test1 = testQuerySynthesisForGenre(catalogs, 'ambient');
  console.log(`Q: "Synthesis methods typical for ambient"`);
  console.log(`A: ${test1 ? test1.join(', ') : 'N/A'}\n`);
  
  const test2 = testQueryArticulationsForMechanism(catalogs, 'bowed');
  console.log(`Q: "Articulations possible for bowed mechanism"`);
  console.log(`A: ${test2 ? test2.join(', ') : 'N/A'}\n`);
  
  const test3 = testQueryCompare(catalogs, 'wavetable', 'sample-based');
  console.log(`Q: "How does wavetable differ from sample-based?"`);
  if (test3) {
    console.log(`A: wavetable - ${test3.wavetable.definition?.substring(0, 60)}...`);
    console.log(`   sample-based - ${test3['sample-based'].definition?.substring(0, 60)}...`);
  } else {
    console.log(`A: N/A`);
  }
  console.log('');
  
  // Summary
  console.log('═══════════════════════════════════════════════════════════════');
  const summary = result.summary();
  if (summary.valid) {
    console.log('  ✅ VALIDATION PASSED');
  } else {
    console.log('  ❌ VALIDATION FAILED');
  }
  console.log(`  Errors: ${summary.errors} | Warnings: ${summary.warnings}`);
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  return result;
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    verbose: args.includes('--verbose') || args.includes('-v'),
    fix: args.includes('--fix')
  };
  
  const result = runValidation(options);
  process.exit(result.isValid ? 0 : 1);
}

module.exports = { runValidation, loadNodeTypes, loadRelationTypes, loadAllCatalogs };
