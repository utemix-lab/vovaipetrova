/**
 * VSTGraph2D — 2D-граф VST-каталога для System panel
 * Использует force-graph (Canvas 2D)
 * 
 * Полная структура по VST_GRAPH_CONCEPT.md:
 * - 12 типов узлов (слоёв)
 * - 12 типов связей
 * - Переключение слоёв через UI
 */

import ForceGraph from 'force-graph';

// Цвета для типов узлов (новая онтология)
const NODE_COLORS = {
  root: '#22d3ee',           // Cyan — корень
  VSTPlugin: '#fbbf24',      // Amber — плагины
  Mechanism: '#34d399',      // Green — механизмы
  SynthesisMethod: '#10b981',// Emerald — методы синтеза
  Genre: '#a78bfa',          // Purple — жанры
  Character: '#f472b6',      // Pink — характеры
  Mood: '#c084fc',           // Violet — настроения
  Articulation: '#60a5fa',   // Blue — артикуляции
  ClassificationSystem: '#f87171', // Red — системы классификации
  Company: '#22d3ee',        // Cyan — производители
  country: '#2dd4bf',        // Teal — страны
  platform: '#9ca3af'        // Gray — платформы
};

const NODE_SIZES = {
  root: 10,
  VSTPlugin: 4,
  Mechanism: 5,
  SynthesisMethod: 5,
  Genre: 4,
  Character: 3,
  Mood: 3,
  Articulation: 4,
  ClassificationSystem: 6,
  Company: 5,
  country: 6,
  platform: 3
};

// Слои графа (для фильтрации) — новая онтология
export const GRAPH_LAYERS = {
  plugins: { label: 'Плагины', types: ['VSTPlugin'], icon: '🎹' },
  mechanisms: { label: 'Механизмы', types: ['Mechanism', 'SynthesisMethod'], icon: '⚙️' },
  genres: { label: 'Жанры', types: ['Genre'], icon: '🎵' },
  aesthetics: { label: 'Эстетика', types: ['Character', 'Mood'], icon: '✨' },
  articulations: { label: 'Артикуляции', types: ['Articulation'], icon: '🎻' },
  companies: { label: 'Производители', types: ['Company', 'country'], icon: '🏭' }
};

export class VSTGraph2D {
  constructor(container, options = {}) {
    this.container = container;
    this.graph = null;
    this.data = { nodes: [], links: [] };
    this.fullData = { nodes: [], links: [] }; // Полные данные для фильтрации
    
    // Опции
    this.maxInstruments = options.maxInstruments ?? 100;
    this.activeLayers = new Set(['plugins', 'mechanisms', 'genres']);
    
    // Callback для внешнего UI
    this.onLayerChange = options.onLayerChange || null;
    
    this.init();
  }
  
  init() {
    this.graph = ForceGraph()(this.container)
      .backgroundColor('transparent')
      .nodeColor(node => NODE_COLORS[node.type] || '#666')
      .nodeVal(node => NODE_SIZES[node.type] || 2)
      .nodeLabel(node => node.label || node.id)
      .linkColor(link => {
        // Цвет связи по типу
        const colors = {
          'belongs_to_category': 'rgba(167, 139, 250, 0.3)',
          'produced_by': 'rgba(34, 211, 238, 0.3)',
          'made_in': 'rgba(45, 212, 191, 0.3)',
          'has_articulation': 'rgba(96, 165, 250, 0.3)',
          'categorized_by': 'rgba(248, 113, 113, 0.3)'
        };
        return colors[link.relation] || 'rgba(255, 255, 255, 0.15)';
      })
      .linkWidth(0.5)
      .cooldownTicks(100)
      .onNodeClick(node => this.onNodeClick(node))
      .onNodeHover(node => this.onNodeHover(node));
    
    // Настройки силовой симуляции
    this.graph.d3Force('charge').strength(-40);
    this.graph.d3Force('link').distance(link => {
      // Расстояния по типу связи
      if (link.relation === 'categorized_by') return 60;
      if (link.relation === 'made_in') return 40;
      if (link.relation === 'produced_by') return 35;
      if (link.relation === 'belongs_to_category') return 25;
      return 30;
    });
  }
  
  async loadData() {
    try {
      const basePath = import.meta.env.BASE_URL || '/';
      const nodesPath = `${basePath}graph/catalogs/nodes/`;
      
      // Загружаем все каталоги новой онтологии
      const [
        pluginsRes, mechanismsRes, synthesisRes, genresRes,
        charactersRes, moodsRes, articulationsRes, companiesRes
      ] = await Promise.all([
        fetch(`${nodesPath}vst-plugins.json`),
        fetch(`${nodesPath}sound-production-mechanisms.json`),
        fetch(`${nodesPath}synthesis-methods.json`),
        fetch(`${nodesPath}genres.json`),
        fetch(`${nodesPath}characters.json`),
        fetch(`${nodesPath}moods.json`),
        fetch(`${nodesPath}articulations.json`),
        fetch(`${basePath}graph/catalogs/companies.json`)
      ]);
      
      const plugins = (await pluginsRes.json()).entries;
      const mechanisms = (await mechanismsRes.json()).entries;
      const synthesis = (await synthesisRes.json()).entries;
      const genres = (await genresRes.json()).entries;
      const characters = (await charactersRes.json()).entries;
      const moods = (await moodsRes.json()).entries;
      const articulations = (await articulationsRes.json()).entries;
      const companies = (await companiesRes.json()).entries;
      
      this.buildFullGraph({
        plugins, mechanisms, synthesis, genres,
        characters, moods, articulations, companies
      });
    } catch (err) {
      console.error('[VSTGraph2D] Failed to load data:', err);
      this.data = {
        nodes: [{ id: 'error', label: 'Ошибка загрузки', type: 'root' }],
        links: []
      };
      this.graph.graphData(this.data);
    }
  }
  
  buildFullGraph(data) {
    const { plugins, mechanisms, synthesis, genres, characters, moods, articulations, companies } = data;
    const nodes = [];
    const links = [];
    const nodeIds = new Set();
    
    // === ROOT ===
    nodes.push({ id: 'vst-root', label: 'VST Каталог', type: 'root' });
    nodeIds.add('vst-root');
    
    // === MECHANISMS ===
    for (const mech of mechanisms) {
      nodes.push({ id: mech.id, label: mech.name, type: 'Mechanism', data: mech });
      nodeIds.add(mech.id);
      links.push({ source: 'vst-root', target: mech.id, relation: 'has_mechanism' });
    }
    
    // === SYNTHESIS METHODS ===
    for (const syn of synthesis) {
      nodes.push({ id: syn.id, label: syn.name, type: 'SynthesisMethod', data: syn });
      nodeIds.add(syn.id);
    }
    
    // === GENRES ===
    for (const genre of genres) {
      nodes.push({ id: genre.id, label: genre.name, type: 'Genre', data: genre });
      nodeIds.add(genre.id);
    }
    
    // === CHARACTERS ===
    for (const char of characters) {
      nodes.push({ id: char.id, label: char.name, type: 'Character', data: char });
      nodeIds.add(char.id);
    }
    
    // === MOODS ===
    for (const mood of moods) {
      nodes.push({ id: mood.id, label: mood.name, type: 'Mood', data: mood });
      nodeIds.add(mood.id);
    }
    
    // === ARTICULATIONS ===
    for (const art of articulations) {
      nodes.push({ id: art.id, label: art.name, type: 'Articulation', data: art });
      nodeIds.add(art.id);
    }
    
    // === COMPANIES ===
    const countrySet = new Set();
    for (const company of companies) {
      nodes.push({ id: company.id, label: company.name, type: 'Company', data: company });
      nodeIds.add(company.id);
      if (company.country) countrySet.add(company.country);
    }
    
    // === COUNTRIES ===
    const countryNames = {
      'us': '🇺🇸 США', 'de': '🇩🇪 Германия', 'gb': '🇬🇧 Великобритания',
      'fr': '🇫🇷 Франция', 'it': '🇮🇹 Италия', 'nl': '🇳🇱 Нидерланды',
      'se': '🇸🇪 Швеция', 'ca': '🇨🇦 Канада', 'au': '🇦🇺 Австралия',
      'cn': '🇨🇳 Китай', 'jp': '🇯🇵 Япония', 'ru': '🇷🇺 Россия',
      'ua': '🇺🇦 Украина', 'pl': '🇵🇱 Польша', 'es': '🇪🇸 Испания',
      'br': '🇧🇷 Бразилия', 'gr': '🇬🇷 Греция', 'dk': '🇩🇰 Дания'
    };
    for (const countryId of countrySet) {
      const cid = `country-${countryId}`;
      nodes.push({ id: cid, label: countryNames[countryId] || countryId.toUpperCase(), type: 'country' });
      nodeIds.add(cid);
    }
    
    // Company → Country links
    for (const company of companies) {
      if (company.country && nodeIds.has(`country-${company.country}`)) {
        links.push({ source: company.id, target: `country-${company.country}`, relation: 'made_in' });
      }
    }
    
    // === VST PLUGINS ===
    const limitedPlugins = plugins.slice(0, this.maxInstruments);
    for (const plugin of limitedPlugins) {
      nodes.push({ id: plugin.id, label: plugin.name, type: 'VSTPlugin', data: plugin });
      nodeIds.add(plugin.id);
      
      // Plugin → Mechanisms
      for (const mechId of plugin.mechanisms || []) {
        if (nodeIds.has(mechId)) {
          links.push({ source: plugin.id, target: mechId, relation: 'has_mechanism' });
        }
      }
      
      // Plugin → Genres
      for (const genreId of plugin.typical_for_genre || []) {
        if (nodeIds.has(genreId)) {
          links.push({ source: plugin.id, target: genreId, relation: 'typical_for' });
        }
      }
      
      // Plugin → Characters
      for (const charId of plugin.produces_character || []) {
        if (nodeIds.has(charId)) {
          links.push({ source: plugin.id, target: charId, relation: 'produces' });
        }
      }
      
      // Plugin → Moods
      for (const moodId of plugin.evokes_mood || []) {
        if (nodeIds.has(moodId)) {
          links.push({ source: plugin.id, target: moodId, relation: 'evokes' });
        }
      }
      
      // Plugin → Articulations
      for (const artId of plugin.supports_articulation || []) {
        if (nodeIds.has(artId)) {
          links.push({ source: plugin.id, target: artId, relation: 'supports' });
        }
      }
      
      // Plugin → Company (developer)
      if (plugin.developer && nodeIds.has(plugin.developer)) {
        links.push({ source: plugin.id, target: plugin.developer, relation: 'developed_by' });
      }
    }
    
    // Фильтруем связи
    const validLinks = links.filter(link => nodeIds.has(link.source) && nodeIds.has(link.target));
    
    this.fullData = { nodes, links: validLinks };
    console.log(`[VSTGraph2D] Built full graph: ${nodes.length} nodes, ${validLinks.length} links`);
    
    // Применяем фильтр по активным слоям
    this.applyLayerFilter();
  }
  
  // Переключение слоя
  toggleLayer(layerId) {
    if (this.activeLayers.has(layerId)) {
      this.activeLayers.delete(layerId);
    } else {
      this.activeLayers.add(layerId);
    }
    this.applyLayerFilter();
    
    if (this.onLayerChange) {
      this.onLayerChange(Array.from(this.activeLayers));
    }
  }
  
  // Установить активные слои
  setActiveLayers(layerIds) {
    this.activeLayers = new Set(layerIds);
    this.applyLayerFilter();
  }
  
  // Применить фильтр по слоям
  applyLayerFilter() {
    // Собираем типы узлов для активных слоёв
    const activeTypes = new Set(['root']); // root всегда виден
    
    for (const layerId of this.activeLayers) {
      const layer = GRAPH_LAYERS[layerId];
      if (layer) {
        for (const type of layer.types) {
          activeTypes.add(type);
        }
      }
    }
    
    // Фильтруем узлы
    const filteredNodes = this.fullData.nodes.filter(node => 
      activeTypes.has(node.type)
    );
    const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
    
    // Фильтруем связи
    const filteredLinks = this.fullData.links.filter(link => 
      filteredNodeIds.has(link.source) && filteredNodeIds.has(link.target)
    );
    
    this.data = { nodes: filteredNodes, links: filteredLinks };
    
    console.log(`[VSTGraph2D] Filtered: ${filteredNodes.length} nodes, ${filteredLinks.length} links`);
    
    this.graph.graphData(this.data);
    requestAnimationFrame(() => this.resize());
  }
  
  // Подсветка узлов по типу
  highlightByType(type) {
    this.graph
      .nodeColor(node => {
        if (node.type === type) return NODE_COLORS[type];
        return 'rgba(100, 100, 100, 0.3)';
      })
      .linkColor(link => {
        const sourceType = typeof link.source === 'object' ? link.source.type : null;
        const targetType = typeof link.target === 'object' ? link.target.type : null;
        if (sourceType === type || targetType === type) {
          return 'rgba(255, 255, 255, 0.4)';
        }
        return 'rgba(255, 255, 255, 0.05)';
      });
  }
  
  // Сброс подсветки
  clearHighlight() {
    this.graph
      .nodeColor(node => NODE_COLORS[node.type] || '#666')
      .linkColor(link => {
        const colors = {
          'belongs_to_category': 'rgba(167, 139, 250, 0.3)',
          'produced_by': 'rgba(34, 211, 238, 0.3)',
          'made_in': 'rgba(45, 212, 191, 0.3)'
        };
        return colors[link.relation] || 'rgba(255, 255, 255, 0.15)';
      });
  }
  
  onNodeClick(node) {
    if (!node) return;
    console.log('[VSTGraph2D] Click:', node.id, node.label);
    // TODO: интеграция с основным UI
  }
  
  onNodeHover(node) {
    this.container.style.cursor = node ? 'pointer' : 'default';
  }
  
  resize() {
    if (!this.graph || !this.container) return;
    const rect = this.container.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      this.graph.width(rect.width).height(rect.height);
    }
  }
  
  destroy() {
    if (this.graph) {
      this.graph._destructor && this.graph._destructor();
      this.graph = null;
    }
    this.container.innerHTML = '';
  }
}
