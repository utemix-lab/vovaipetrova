#!/usr/bin/env node
/**
 * Canonical Protocol Validator
 * 
 * Проверяет соответствие кода и документации Canonical Protocol.
 * 
 * @status: provisional
 * @track: 0
 * @since: 2026-02-21
 * @docs: docs/CANONICAL_PROTOCOL.md
 * 
 * Использование:
 *   node scripts/validate-protocol.cjs [--verbose] [--fix]
 */

const fs = require('fs');
const path = require('path');

// === CONFIGURATION ===
const CONFIG = {
  rootDir: path.resolve(__dirname, '..'),
  codeExtensions: ['.js', '.jsx', '.ts', '.tsx', '.cjs', '.mjs'],
  docExtensions: ['.md'],
  ignoreDirs: ['node_modules', '.git', 'dist', 'build', '.next'],
  
  // Valid status values
  validStatuses: ['canonical', 'provisional', 'experimental', 'deprecated'],
  
  // Valid track values
  validTracks: ['0', '1', '1.5', '2', '3', '4', '5', '6'],
  
  // Max age for experimental (days)
  experimentalMaxAge: 30,
  
  // Max age for deprecated (days)
  deprecatedMaxAge: 60
};

// === PATTERNS ===
const PATTERNS = {
  status: /@status:\s*(canonical|provisional|experimental|deprecated)/gi,
  track: /@track:\s*([0-6](?:\.5)?)/gi,
  since: /@since:\s*(\d{4}-\d{2}-\d{2})/gi,
  docs: /@docs:\s*([^\s]+)/gi,
  expires: /@expires:\s*(\d{4}-\d{2}-\d{2})/gi,
  implements: /@implements:\s*([^\s]+)/gi,
  reason: /@reason:\s*(.+)/gi
};

// === STATE ===
const stats = {
  filesScanned: 0,
  markersFound: 0,
  errors: [],
  warnings: [],
  byStatus: {
    canonical: 0,
    provisional: 0,
    experimental: 0,
    deprecated: 0
  },
  byTrack: {}
};

// === HELPERS ===
function getAllFiles(dir, extensions) {
  const files = [];
  
  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        if (!CONFIG.ignoreDirs.includes(entry.name)) {
          walk(fullPath);
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }
  
  walk(dir);
  return files;
}

function parseMarkers(content, filePath) {
  const markers = [];
  const lines = content.split('\n');
  
  let currentMarker = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    
    // Check for status marker (starts a new marker block)
    const statusMatch = line.match(/@status:\s*(canonical|provisional|experimental|deprecated)/i);
    if (statusMatch) {
      if (currentMarker) {
        markers.push(currentMarker);
      }
      currentMarker = {
        status: statusMatch[1].toLowerCase(),
        line: lineNum,
        file: filePath
      };
    }
    
    if (currentMarker) {
      // Parse other markers in the same block
      const trackMatch = line.match(/@track:\s*([0-6](?:\.5)?)/i);
      if (trackMatch) currentMarker.track = trackMatch[1];
      
      const sinceMatch = line.match(/@since:\s*(\d{4}-\d{2}-\d{2})/i);
      if (sinceMatch) currentMarker.since = sinceMatch[1];
      
      const docsMatch = line.match(/@docs:\s*([^\s]+)/i);
      if (docsMatch) currentMarker.docs = docsMatch[1];
      
      const expiresMatch = line.match(/@expires:\s*(\d{4}-\d{2}-\d{2})/i);
      if (expiresMatch) currentMarker.expires = expiresMatch[1];
      
      const implementsMatch = line.match(/@implements:\s*([^\s]+)/i);
      if (implementsMatch) currentMarker.implements = implementsMatch[1];
      
      // End marker block on empty line or non-comment line
      if (line.trim() === '' || (!line.trim().startsWith('//') && !line.trim().startsWith('*') && !line.trim().startsWith('#'))) {
        if (currentMarker) {
          markers.push(currentMarker);
          currentMarker = null;
        }
      }
    }
  }
  
  if (currentMarker) {
    markers.push(currentMarker);
  }
  
  return markers;
}

function validateMarker(marker) {
  const errors = [];
  const warnings = [];
  const relativePath = path.relative(CONFIG.rootDir, marker.file);
  const location = `${relativePath}:${marker.line}`;
  
  // Validate status
  if (!CONFIG.validStatuses.includes(marker.status)) {
    errors.push(`[${location}] Invalid status: ${marker.status}`);
  }
  
  // Validate track
  if (marker.track && !CONFIG.validTracks.includes(marker.track)) {
    errors.push(`[${location}] Invalid track: ${marker.track}`);
  }
  
  // Canonical must have docs
  if (marker.status === 'canonical' && !marker.docs) {
    warnings.push(`[${location}] Canonical element missing @docs reference`);
  }
  
  // Experimental should have expires
  if (marker.status === 'experimental') {
    if (!marker.expires) {
      warnings.push(`[${location}] Experimental element missing @expires date`);
    } else {
      const expiresDate = new Date(marker.expires);
      const now = new Date();
      if (expiresDate < now) {
        errors.push(`[${location}] Experimental element expired on ${marker.expires}`);
      }
    }
    
    // Check age
    if (marker.since) {
      const sinceDate = new Date(marker.since);
      const now = new Date();
      const ageDays = Math.floor((now - sinceDate) / (1000 * 60 * 60 * 24));
      if (ageDays > CONFIG.experimentalMaxAge) {
        warnings.push(`[${location}] Experimental element is ${ageDays} days old (max: ${CONFIG.experimentalMaxAge})`);
      }
    }
  }
  
  // Deprecated should have reason
  if (marker.status === 'deprecated' && !marker.reason) {
    warnings.push(`[${location}] Deprecated element missing @reason`);
  }
  
  // Validate docs reference exists
  if (marker.docs) {
    const docsPath = path.resolve(CONFIG.rootDir, marker.docs.split('#')[0]);
    if (!fs.existsSync(docsPath)) {
      errors.push(`[${location}] @docs reference not found: ${marker.docs}`);
    }
  }
  
  return { errors, warnings };
}

function printReport(verbose) {
  console.log('\n=== CANONICAL PROTOCOL VALIDATION ===\n');
  
  console.log(`Files scanned: ${stats.filesScanned}`);
  console.log(`Markers found: ${stats.markersFound}`);
  
  console.log('\nBy status:');
  for (const [status, count] of Object.entries(stats.byStatus)) {
    if (count > 0) {
      console.log(`  ${status}: ${count}`);
    }
  }
  
  console.log('\nBy track:');
  for (const [track, count] of Object.entries(stats.byTrack)) {
    if (count > 0) {
      console.log(`  Track ${track}: ${count}`);
    }
  }
  
  if (stats.errors.length > 0) {
    console.log(`\n❌ ERRORS (${stats.errors.length}):`);
    for (const error of stats.errors) {
      console.log(`  ${error}`);
    }
  }
  
  if (stats.warnings.length > 0) {
    console.log(`\n⚠️  WARNINGS (${stats.warnings.length}):`);
    for (const warning of stats.warnings) {
      console.log(`  ${warning}`);
    }
  }
  
  if (stats.errors.length === 0 && stats.warnings.length === 0) {
    console.log('\n✅ All validations passed!');
  }
  
  console.log('');
}

// === MAIN ===
function main() {
  const args = process.argv.slice(2);
  const verbose = args.includes('--verbose') || args.includes('-v');
  
  console.log('Scanning code files...');
  
  const codeFiles = getAllFiles(CONFIG.rootDir, CONFIG.codeExtensions);
  
  for (const filePath of codeFiles) {
    stats.filesScanned++;
    
    const content = fs.readFileSync(filePath, 'utf-8');
    const markers = parseMarkers(content, filePath);
    
    for (const marker of markers) {
      stats.markersFound++;
      stats.byStatus[marker.status]++;
      
      if (marker.track) {
        stats.byTrack[marker.track] = (stats.byTrack[marker.track] || 0) + 1;
      }
      
      const { errors, warnings } = validateMarker(marker);
      stats.errors.push(...errors);
      stats.warnings.push(...warnings);
      
      if (verbose && markers.length > 0) {
        const relativePath = path.relative(CONFIG.rootDir, filePath);
        console.log(`  ${relativePath}: ${markers.length} marker(s)`);
      }
    }
  }
  
  printReport(verbose);
  
  // Exit with error code if there are errors
  process.exit(stats.errors.length > 0 ? 1 : 0);
}

main();
