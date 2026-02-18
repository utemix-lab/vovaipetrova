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

// Цвета для типов узлов (по спецификации)
const NODE_COLORS = {
  root: '#22d3ee',           // Cyan — корень
  instrument: '#fbbf24',     // Amber — инструменты
  attribute: '#34d399',      // Green — атрибуты
  category: '#a78bfa',       // Purple — категории
  system: '#f87171',         // Red — системы классификации
  method: '#fb923c',         // Orange — методики
  articulation: '#60a5fa',   // Blue — артикуляции
  term: '#c084fc',           // Violet — терминология
  manufacturer: '#22d3ee',   // Cyan — производители
  country: '#2dd4bf',        // Teal — страны
  platform: '#9ca3af',       // Gray — платформы
  note: '#f472b6',           // Pink — заметки
  dimension: '#818cf8'       // Indigo — кастомные измерения
};

const NODE_SIZES = {
  root: 10,
  instrument: 3,
  attribute: 2,
  category: 5,
  system: 6,
  method: 4,
  articulation: 4,
  term: 2,
  manufacturer: 5,
  country: 6,
  platform: 3,
  note: 2,
  dimension: 3
};

// Слои графа (для фильтрации)
export const GRAPH_LAYERS = {
  instruments: { label: 'Инструменты', types: ['instrument'], icon: '🎹' },
  categories: { label: 'Категории', types: ['category', 'system'], icon: '📂' },
  manufacturers: { label: 'Производители', types: ['manufacturer', 'country'], icon: '🏭' },
  articulations: { label: 'Артикуляции', types: ['articulation', 'method'], icon: '🎻' },
  platforms: { label: 'Платформы', types: ['platform'], icon: '💻' }
};

export class VSTGraph2D {
  constructor(container, options = {}) {
    this.container = container;
    this.graph = null;
    this.data = { nodes: [], links: [] };
    this.fullData = { nodes: [], links: [] }; // Полные данные для фильтрации
    
    // Опции
    this.maxInstruments = options.maxInstruments ?? 100;
    this.activeLayers = new Set(['instruments', 'categories', 'manufacturers']);
    
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
      
      // Загружаем все каталоги
      const [categoriesRes, pluginsRes, companiesRes] = await Promise.all([
        fetch(`${basePath}graph/catalogs/vst-categories.json`),
        fetch(`${basePath}graph/catalogs/vst-plugins.json`),
        fetch(`${basePath}graph/catalogs/companies.json`)
      ]);
      
      const categoriesData = await categoriesRes.json();
      const pluginsData = await pluginsRes.json();
      const companiesData = await companiesRes.json();
      
      this.buildFullGraph(
        categoriesData.entries,
        pluginsData.entries,
        companiesData.entries
      );
    } catch (err) {
      console.error('[VSTGraph2D] Failed to load data:', err);
      this.data = {
        nodes: [{ id: 'error', label: 'Ошибка загрузки', type: 'root' }],
        links: []
      };
      this.graph.graphData(this.data);
    }
  }
  
  buildFullGraph(categories, plugins, companies) {
    const nodes = [];
    const links = [];
    const nodeIds = new Set();
    
    // === ROOT ===
    nodes.push({
      id: 'vst-root',
      label: 'VST Каталог',
      type: 'root'
    });
    nodeIds.add('vst-root');
    
    // === SYSTEMS (системы классификации) ===
    const systems = [
      { id: 'system-internal', name: 'Internal', label: 'Внутренняя' },
      { id: 'system-hornbostel', name: 'Hornbostel-Sachs', label: 'Хорнбостель-Закс' },
      { id: 'system-functional', name: 'Functional', label: 'Функциональная' }
    ];
    
    for (const sys of systems) {
      nodes.push({
        id: sys.id,
        label: sys.label,
        type: 'system',
        data: sys
      });
      nodeIds.add(sys.id);
      links.push({
        source: 'vst-root',
        target: sys.id,
        relation: 'has_system'
      });
    }
    
    // === CATEGORIES ===
    const categoryMap = new Map();
    for (const cat of categories) {
      categoryMap.set(cat.id, cat);
      
      nodes.push({
        id: `cat-${cat.id}`,
        label: cat.name_ru || cat.name,
        type: 'category',
        data: cat
      });
      nodeIds.add(`cat-${cat.id}`);
      
      // Связь с родительской категорией или системой
      if (cat.parent && cat.parent !== 'instrument' && cat.parent !== 'effect') {
        links.push({
          source: `cat-${cat.parent}`,
          target: `cat-${cat.id}`,
          relation: 'has_subcategory'
        });
      } else {
        // Корневые категории связаны с Internal системой
        links.push({
          source: 'system-internal',
          target: `cat-${cat.id}`,
          relation: 'categorized_by'
        });
      }
    }
    
    // === COUNTRIES ===
    const countrySet = new Set();
    for (const company of companies) {
      if (company.country) countrySet.add(company.country);
    }
    
    const countryNames = {
      'us': '🇺🇸 США', 'de': '🇩🇪 Германия', 'gb': '🇬🇧 Великобритания',
      'fr': '🇫🇷 Франция', 'it': '🇮🇹 Италия', 'nl': '🇳🇱 Нидерланды',
      'se': '🇸🇪 Швеция', 'ca': '🇨🇦 Канада', 'au': '🇦🇺 Австралия',
      'cn': '🇨🇳 Китай', 'jp': '🇯🇵 Япония', 'ru': '🇷🇺 Россия',
      'ua': '🇺🇦 Украина', 'pl': '🇵🇱 Польша', 'es': '🇪🇸 Испания',
      'br': '🇧🇷 Бразилия', 'gr': '🇬🇷 Греция', 'dk': '🇩🇰 Дания'
    };
    
    for (const countryId of countrySet) {
      nodes.push({
        id: `country-${countryId}`,
        label: countryNames[countryId] || countryId.toUpperCase(),
        type: 'country',
        data: { id: countryId }
      });
      nodeIds.add(`country-${countryId}`);
    }
    
    // === MANUFACTURERS ===
    const companyMap = new Map();
    for (const company of companies) {
      companyMap.set(company.id, company);
      
      nodes.push({
        id: `mfr-${company.id}`,
        label: company.name,
        type: 'manufacturer',
        data: company
      });
      nodeIds.add(`mfr-${company.id}`);
      
      // Связь со страной
      if (company.country) {
        links.push({
          source: `mfr-${company.id}`,
          target: `country-${company.country}`,
          relation: 'made_in'
        });
      }
    }
    
    // === INSTRUMENTS (плагины) ===
    const limitedPlugins = plugins.slice(0, this.maxInstruments);
    
    for (const plugin of limitedPlugins) {
      const pluginId = `inst-${plugin.id}`;
      nodes.push({
        id: pluginId,
        label: plugin.name,
        type: 'instrument',
        data: plugin
      });
      nodeIds.add(pluginId);
      
      // Связь с категориями
      for (const catId of plugin.categories || []) {
        const catNodeId = `cat-${catId}`;
        if (nodeIds.has(catNodeId)) {
          links.push({
            source: pluginId,
            target: catNodeId,
            relation: 'belongs_to_category'
          });
        }
      }
      
      // Связь с производителем
      if (plugin.company && nodeIds.has(`mfr-${plugin.company}`)) {
        links.push({
          source: pluginId,
          target: `mfr-${plugin.company}`,
          relation: 'produced_by'
        });
      }
    }
    
    // === PLATFORMS ===
    const platforms = ['VST2', 'VST3', 'AU', 'AAX', 'Kontakt', 'Standalone'];
    for (const plat of platforms) {
      nodes.push({
        id: `plat-${plat.toLowerCase()}`,
        label: plat,
        type: 'platform',
        data: { id: plat }
      });
      nodeIds.add(`plat-${plat.toLowerCase()}`);
    }
    
    // Фильтруем связи
    const validLinks = links.filter(link => 
      nodeIds.has(link.source) && nodeIds.has(link.target)
    );
    
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
