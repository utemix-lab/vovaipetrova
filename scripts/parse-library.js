/**
 * Парсер библиотеки M:\ для генерации vst-plugins.json
 * Запуск: node scripts/parse-library.js
 */

import fs from 'fs';
import path from 'path';

// Маппинг папок на категории
const CATEGORY_MAP = {
  'BASS': 'bass',
  'BRASS': 'brass',
  'DRONES & SFX': 'fx',
  'DRUM': 'drum',
  'GLASS': 'glass',
  'GUITAR': 'guitar',
  'MALLET & HAND': 'mallet-hand',
  'ORCHESTRA': 'orchestra',
  'OTHER STRINGS': 'other-strings',
  'PERCUSSION': 'percussion',
  'PIANO AND KEY': 'piano-key',
  'REVERSE & BOWED': 'sound-design',
  'STRANGE': 'strange',
  'SYNTH': 'synth',
  'TOY': 'toy',
  'VOICE': 'voice',
  '# ENGINE': 'engine',
  '# PROCESSING': 'effect',
  '# SOFT MUSIC': 'daw',
  '~ LIBRARY FACTORY AND COLLECTION': 'library-collection'
};

// Маппинг компаний (паттерны в названиях папок)
const COMPANY_PATTERNS = [
  { pattern: /^8dio/i, id: '8dio' },
  { pattern: /^8DIO/i, id: '8dio' },
  { pattern: /Ableton/i, id: 'ableton' },
  { pattern: /Ample Sound/i, id: 'ample-sound' },
  { pattern: /Antonov/i, id: 'antonov-samples' },
  { pattern: /Applied Acoustics/i, id: 'applied-acoustics-systems' },
  { pattern: /Audio Imperia/i, id: 'audio-imperia' },
  { pattern: /Audio Modeling/i, id: 'audio-modeling' },
  { pattern: /Audiofier/i, id: 'audiofier' },
  { pattern: /Best Service/i, id: 'best-service' },
  { pattern: /Big Fish/i, id: 'big-fish-audio' },
  { pattern: /Camel Audio/i, id: 'camel-audio' },
  { pattern: /Chris Hein/i, id: 'best-service' },
  { pattern: /Cinematique/i, id: 'cinematique-instruments' },
  { pattern: /Credland/i, id: 'credland-audio' },
  { pattern: /Decent Samples/i, id: 'decent-samples' },
  { pattern: /Dream Audio/i, id: 'dream-audio-tools' },
  { pattern: /e-instruments/i, id: 'e-instruments' },
  { pattern: /Edu Prado/i, id: 'edu-prado-sounds' },
  { pattern: /Electronik Sound Lab/i, id: 'electronik-sound-lab' },
  { pattern: /Embertone/i, id: 'embertone' },
  { pattern: /Evolution Series/i, id: 'evolution-series' },
  { pattern: /Garritan/i, id: 'garritan' },
  { pattern: /Global Audio/i, id: 'global-audio-tools' },
  { pattern: /H\.?E\.? Audio/i, id: 'he-audio' },
  { pattern: /Heavyocity/i, id: 'heavyocity' },
  { pattern: /Hephaestus/i, id: 'hephaestus-sounds' },
  { pattern: /IK Multimedia/i, id: 'ik-multimedia' },
  { pattern: /Ilya Efimov/i, id: 'ilya-efimov' },
  { pattern: /Impact Soundworks/i, id: 'impact-soundworks' },
  { pattern: /In Session Audio/i, id: 'in-session-audio' },
  { pattern: /Indiginus/i, id: 'indiginus' },
  { pattern: /Insanity Samples/i, id: 'insanity-samples' },
  { pattern: /iZotope/i, id: 'izotope' },
  { pattern: /Jam Origin/i, id: 'jam-origin' },
  { pattern: /Keepforest/i, id: 'keepforest' },
  { pattern: /Luftrum/i, id: 'luftrum' },
  { pattern: /MG Instruments/i, id: 'mg-instruments' },
  { pattern: /Microhammer/i, id: 'microhammer' },
  { pattern: /ModWheel/i, id: 'modwheel' },
  { pattern: /Music Lab/i, id: 'musiclab' },
  { pattern: /Musical Sampling/i, id: 'musical-sampling' },
  { pattern: /Native Instruments/i, id: 'native-instruments' },
  { pattern: /^NI /i, id: 'native-instruments' },
  { pattern: /Noisefirm/i, id: 'noisefirm' },
  { pattern: /Orange Tree/i, id: 'orange-tree-samples' },
  { pattern: /Output/i, id: 'output' },
  { pattern: /Past to Future/i, id: 'past-to-future' },
  { pattern: /PettinHouse/i, id: 'pettinhouse' },
  { pattern: /PluginGuru/i, id: 'pluginguru' },
  { pattern: /Precisionsound/i, id: 'precisionsound' },
  { pattern: /ProjectSAM/i, id: 'projectsam' },
  { pattern: /Project SAM/i, id: 'projectsam' },
  { pattern: /Prominy/i, id: 'prominy' },
  { pattern: /reFX/i, id: 'refx' },
  { pattern: /Replika Sound/i, id: 'replika-sound' },
  { pattern: /Rob Papen/i, id: 'rob-papen' },
  { pattern: /Roland/i, id: 'roland' },
  { pattern: /Sample Logic/i, id: 'sample-logic' },
  { pattern: /SampleHero/i, id: 'samplehero' },
  { pattern: /Sampleism/i, id: 'sampleism' },
  { pattern: /Sampletekk/i, id: 'sampletekk' },
  { pattern: /Sick Noise/i, id: 'sick-noise' },
  { pattern: /Simple Samples/i, id: 'simple-samples' },
  { pattern: /Sketch Samples/i, id: 'sketch-samples' },
  { pattern: /Slate Digital/i, id: 'slate-digital' },
  { pattern: /Sonic Reality/i, id: 'sonic-reality' },
  { pattern: /Soniccouture/i, id: 'soniccouture' },
  { pattern: /SonicCouture/i, id: 'soniccouture' },
  { pattern: /Sonokinetic/i, id: 'sonokinetic' },
  { pattern: /Sonora Cinematic/i, id: 'sonora-cinematic' },
  { pattern: /Sonuscore/i, id: 'sonuscore' },
  { pattern: /SONiVOX/i, id: 'sonivox' },
  { pattern: /Soundiron/i, id: 'soundiron' },
  { pattern: /Spectrasonics/i, id: 'spectrasonics' },
  { pattern: /Spitfire/i, id: 'spitfire-audio' },
  { pattern: /Splash Sound/i, id: 'splash-sound' },
  { pattern: /Sugar Bytes/i, id: 'sugar-bytes' },
  { pattern: /TapSpace/i, id: 'tapspace' },
  { pattern: /Tonehammer/i, id: 'tonehammer' },
  { pattern: /Toontrack/i, id: 'toontrack' },
  { pattern: /Triple Spiral/i, id: 'triple-spiral-audio' },
  { pattern: /UJAM/i, id: 'ujam' },
  { pattern: /UVI/i, id: 'uvi' },
  { pattern: /Versilian/i, id: 'versilian-studios' },
  { pattern: /Vienna Symphonic/i, id: 'vsl' },
  { pattern: /VSL/i, id: 'vsl' },
  { pattern: /Vir2/i, id: 'vir2' },
  { pattern: /Wavelore/i, id: 'wavelore' },
  { pattern: /Wavesfactory/i, id: 'wavesfactory' },
  { pattern: /Waves/i, id: 'waves' },
  { pattern: /Xsample/i, id: 'xsample' },
  { pattern: /Zero-G/i, id: 'zero-g' },
  { pattern: /ZapZorn/i, id: 'zapzorn' },
  { pattern: /Bolder Sounds/i, id: 'bolder-sounds' },
  { pattern: /Dargalon/i, id: 'dargalon' },
  { pattern: /EarthMoments/i, id: 'earthmoments' },
  { pattern: /Gnomehammer/i, id: 'gnomehammer' },
  { pattern: /AudioThing/i, id: 'audiothing' },
  { pattern: /Rhythmic Robot/i, id: 'rhythmic-robot' },
  { pattern: /Analogue Drums/i, id: 'analogue-drums' },
  { pattern: /Drumasonic/i, id: 'drumasonic' },
  { pattern: /Mixosaurus/i, id: 'mixosaurus' },
  { pattern: /Cymbalistic/i, id: 'cymbalistic' },
  { pattern: /Ensemblia/i, id: 'ensemblia' },
  { pattern: /Pragmabeat/i, id: 'pragmabeat' },
  { pattern: /Balinese/i, id: 'balinese-gamelan' },
  { pattern: /Morpheus/i, id: 'morpheus' },
  { pattern: /Carillion/i, id: 'carillion' },
  { pattern: /Tibetan/i, id: 'tibetan' },
  { pattern: /Toll\b/i, id: 'toll' },
  { pattern: /Spieluhr/i, id: 'spieluhr' },
  { pattern: /Tingklik/i, id: 'tingklik' },
  { pattern: /Bigga Giggas/i, id: 'bigga-giggas' },
  { pattern: /Ocarina/i, id: 'ocarina' },
  { pattern: /Spirit Flute/i, id: 'spirit-flute' },
  { pattern: /Bagpipes/i, id: 'bagpipes' },
  { pattern: /Didgeridoo/i, id: 'didgeridoo' },
  { pattern: /Ney\b/i, id: 'ney' },
  { pattern: /Nordic/i, id: 'nordic' },
  { pattern: /Kantele/i, id: 'kantele' },
  { pattern: /Lyra\b/i, id: 'lyra' },
  { pattern: /Nevel\b/i, id: 'nevel' },
  { pattern: /Autoharp/i, id: 'autoharp' },
  { pattern: /Psaltery/i, id: 'psaltery' },
  { pattern: /Zither/i, id: 'zither' },
  { pattern: /Plectra Series/i, id: 'impact-soundworks' },
  { pattern: /Hyperion/i, id: 'soundiron' },
  { pattern: /Cremona/i, id: 'cremona' },
  { pattern: /Emotional/i, id: 'soundiron' },
  { pattern: /Lumina/i, id: 'soundiron' },
  { pattern: /Morphestra/i, id: 'sample-logic' },
  { pattern: /Symphobia/i, id: 'projectsam' },
  { pattern: /LASS/i, id: 'audiobro' },
  { pattern: /Sable/i, id: 'spitfire-audio' },
  { pattern: /Emotive Strings/i, id: 'emotive-strings' },
  { pattern: /Tension\b/i, id: 'tension' },
  { pattern: /Action Strikes/i, id: 'native-instruments' },
  { pattern: /Damage\b/i, id: 'heavyocity' },
  { pattern: /Rumble\b/i, id: 'sample-logic' },
  { pattern: /Apocalypse/i, id: 'soundiron' },
  { pattern: /True Strike/i, id: 'projectsam' },
  { pattern: /World Impact/i, id: 'vir2' },
  { pattern: /Elite Orchestral/i, id: 'vir2' },
  { pattern: /Hans Zimmer/i, id: 'spitfire-audio' },
  { pattern: /HZ01/i, id: 'spitfire-audio' },
  { pattern: /Sultan/i, id: 'sonokinetic' },
  { pattern: /Shahrazad/i, id: 'sonokinetic' },
  { pattern: /Carousel/i, id: 'sonokinetic' },
  { pattern: /Kemence/i, id: 'sonokinetic' },
  { pattern: /Arpeggio\b/i, id: 'sonokinetic' },
  { pattern: /H\.I\.P\.P/i, id: 'sonokinetic' },
  { pattern: /Guzheng/i, id: 'soniccouture' },
  { pattern: /Kim\b/i, id: 'soniccouture' },
  { pattern: /Samulnori/i, id: 'soniccouture' },
  { pattern: /Thunder Drum/i, id: 'soniccouture' },
  { pattern: /Tube Drum/i, id: 'soniccouture' },
  { pattern: /Pan Drums/i, id: 'soniccouture' },
  { pattern: /Hang Drum/i, id: 'soniccouture' },
  { pattern: /Skiddaw/i, id: 'soniccouture' },
  { pattern: /Giant Bass Tongue/i, id: 'soniccouture' },
  { pattern: /Concert Kazoos/i, id: 'soniccouture' },
  { pattern: /Devilfish/i, id: 'soniccouture' },
  { pattern: /Abstrakt Bass/i, id: 'soniccouture' },
  { pattern: /Konkrete/i, id: 'soniccouture' },
  { pattern: /Bowed Piano/i, id: 'soniccouture' },
  { pattern: /EP73/i, id: 'soniccouture' },
  { pattern: /Xtended Piano/i, id: 'soniccouture' },
  { pattern: /Box of Tricks/i, id: 'soniccouture' },
  { pattern: /Conservatoire/i, id: 'soniccouture' },
  { pattern: /Variable Ambience/i, id: 'soniccouture' }
];

// Читаем скан
const scanFile = fs.readFileSync('r:/vovaipetrova/temp_scan.txt', 'utf-8');
const lines = scanFile.split('\n').map(l => l.trim().replace(/\r/g, '')).filter(l => l);

// Парсим библиотеку
const plugins = [];
const seenIds = new Set();

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 60);
}

function detectCompany(name) {
  for (const { pattern, id } of COMPANY_PATTERNS) {
    if (pattern.test(name)) {
      return id;
    }
  }
  return null;
}

function cleanName(folderName) {
  // Убираем технические суффиксы
  return folderName
    .replace(/\s*\(KONTAKT\)/gi, '')
    .replace(/\s*KONTAKT[-\s]*/gi, '')
    .replace(/[-_]MAGNETRiXX/gi, '')
    .replace(/[-_]SYNTHiC4TE/gi, '')
    .replace(/[-_]DECiBEL/gi, '')
    .replace(/[-_]DISCOVER/gi, '')
    .replace(/[-_]R2R/gi, '')
    .replace(/[-_]PiRAT/gi, '')
    .replace(/[-_]0TH3Rside/gi, '')
    .replace(/[-_]AudioP2P/gi, '')
    .replace(/[-_]AUDIOSTRiKE/gi, '')
    .replace(/[-_]AMPLiFY/gi, '')
    .replace(/[-_]SUNiSO/gi, '')
    .replace(/[-_]SPiRiT/gi, '')
    .replace(/\.v?\d+\.\d+(\.\d+)?/gi, '')
    .replace(/\s+v\d+(\.\d+)*/gi, '')
    .replace(/\s*\[.*?\]/g, '')
    .replace(/\s*\(.*?\)/g, '')
    .replace(/\s+$/, '')
    .trim();
}

// Обрабатываем только папки глубины 2 (категория/компания/продукт или категория/продукт)
for (const line of lines) {
  const parts = line.replace('M:\\', '').split('\\');
  
  // Пропускаем системные папки
  if (parts[0].startsWith('$') || parts[0] === 'System Volume Information' || parts[0] === 'Win') {
    continue;
  }
  
  // Пропускаем папки с ~ в начале (архивные/устаревшие)
  if (parts.some(p => p.startsWith('~'))) {
    continue;
  }
  
  // Пропускаем подпапки (Samples, Instruments, Documentation и т.д.)
  const subfolders = ['Samples', 'Instruments', 'Documentation', 'Resources', 'Data', 'Multis', 'Snapshots', 'Config', 'Layers', 'IR Samples', 'Impulses', 'Scripts', 'Content', 'Keys', 'Image Files', 'Component Files', 'WAV', 'Kontakt programs', 'Demo', 'Documents', 'Info', 'Artwork', 'User Data', 'Additionals', 'Base', 'FX default presets'];
  if (parts.length > 2 && subfolders.some(sf => parts[parts.length - 1].includes(sf) || parts[parts.length - 1] === sf)) {
    continue;
  }
  
  // Нужны папки глубины 2 (категория/продукт)
  if (parts.length !== 2) {
    continue;
  }
  
  const categoryFolder = parts[0];
  const productFolder = parts[1];
  
  // Определяем категорию
  const category = CATEGORY_MAP[categoryFolder] || 'instrument';
  
  // Определяем компанию
  const company = detectCompany(productFolder);
  
  // Чистим название
  const name = cleanName(productFolder);
  
  // Генерируем ID
  let id = slugify(name);
  if (seenIds.has(id)) {
    id = `${id}-${category}`;
  }
  if (seenIds.has(id)) {
    continue; // Пропускаем дубликаты
  }
  seenIds.add(id);
  
  // Определяем теги
  const tags = [];
  if (productFolder.toLowerCase().includes('kontakt')) tags.push('kontakt');
  if (productFolder.toLowerCase().includes('free')) tags.push('free');
  if (productFolder.toLowerCase().includes('cinematic')) tags.push('cinematic');
  if (productFolder.toLowerCase().includes('ethnic')) tags.push('ethnic');
  if (productFolder.toLowerCase().includes('vintage')) tags.push('vintage');
  if (productFolder.toLowerCase().includes('solo')) tags.push('solo');
  if (productFolder.toLowerCase().includes('ensemble')) tags.push('ensemble');
  
  plugins.push({
    id,
    name,
    company,
    categories: [category],
    tags,
    path: line,
    format: 'kontakt'
  });
}

// Сортируем по имени
plugins.sort((a, b) => a.name.localeCompare(b.name));

// Формируем JSON
const catalog = {
  id: 'vst-plugins',
  version: '1.0.0',
  description: 'Каталог VST-инструментов и библиотек из M:\\',
  generated: new Date().toISOString(),
  count: plugins.length,
  schema: {
    id: 'string',
    name: 'string',
    company: 'string (→ companies.id) | null',
    categories: 'string[] (→ vst-categories.id)',
    tags: 'string[]',
    path: 'string',
    format: 'string'
  },
  entries: plugins
};

// Записываем
const outputPath = 'r:/vovaipetrova/worlds/vovaipetrova/catalogs/vst-plugins.json';
fs.writeFileSync(outputPath, JSON.stringify(catalog, null, 2), 'utf-8');

console.log(`✅ Сгенерировано ${plugins.length} плагинов`);
console.log(`📁 Сохранено в ${outputPath}`);

// Статистика по компаниям
const companyStats = {};
for (const p of plugins) {
  const c = p.company || 'unknown';
  companyStats[c] = (companyStats[c] || 0) + 1;
}
console.log('\n📊 Топ-10 компаний:');
Object.entries(companyStats)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .forEach(([c, n]) => console.log(`   ${c}: ${n}`));

// Статистика по категориям
const categoryStats = {};
for (const p of plugins) {
  for (const c of p.categories) {
    categoryStats[c] = (categoryStats[c] || 0) + 1;
  }
}
console.log('\n📊 По категориям:');
Object.entries(categoryStats)
  .sort((a, b) => b[1] - a[1])
  .forEach(([c, n]) => console.log(`   ${c}: ${n}`));
