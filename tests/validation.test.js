import fs from 'fs';
import path from 'path';

describe('Project Structure', () => {
  test('core documentation should exist', () => {
    const docs = [
      '../core/docs/MACHINE_CONTEXT.md'
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
