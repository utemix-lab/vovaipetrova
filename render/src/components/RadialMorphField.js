/**
 * RadialMorphField — Radial Facet Field visualization for VST graph
 * Track 6: Expressive Stacks
 * 
 * Geometry: Concentric rings of dimensions around a central node
 * - Center: Selected plugin
 * - Ring 1: Mechanism
 * - Ring 2: Articulation
 * - Ring 3: Genre
 * - Ring 4: Character
 * - Ring 5: Mood
 */

export class RadialMorphField {
  constructor(container, options = {}) {
    this.container = container;
    this.canvas = null;
    this.ctx = null;
    this.data = null;
    this.selectedPluginId = null;
    this.hoveredNode = null;
    this.animationId = null;
    
    // Ring configuration
    this.rings = [
      { id: 'mechanisms', label: 'Механизмы', color: '#34d399', radius: 80 },
      { id: 'articulations', label: 'Артикуляции', color: '#60a5fa', radius: 140 },
      { id: 'genres', label: 'Жанры', color: '#a78bfa', radius: 200 },
      { id: 'characters', label: 'Характеры', color: '#f472b6', radius: 260 },
      { id: 'moods', label: 'Настроения', color: '#c084fc', radius: 320 }
    ];
    
    // Visual settings
    this.centerColor = '#fbbf24'; // Amber for plugin
    this.dimColor = 'rgba(100, 100, 100, 0.3)';
    this.linkColor = 'rgba(255, 255, 255, 0.2)';
    this.highlightLinkColor = 'rgba(251, 191, 36, 0.6)';
    
    // Callbacks
    this.onPluginSelect = options.onPluginSelect || null;
    this.onNodeHover = options.onNodeHover || null;
    
    this.init();
  }
  
  init() {
    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.container.appendChild(this.canvas);
    
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    
    // Event listeners
    window.addEventListener('resize', () => this.resize());
    this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.canvas.addEventListener('click', (e) => this.onClick(e));
    
    // Start animation loop
    this.animate();
  }
  
  resize() {
    const rect = this.container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.width = rect.width;
    this.height = rect.height;
    this.centerX = this.width / 2;
    this.centerY = this.height / 2;
  }
  
  async loadData() {
    try {
      const basePath = import.meta.env.BASE_URL || '/';
      const nodesPath = `${basePath}graph/catalogs/nodes/`;
      
      const [
        pluginsRes, mechanismsRes, articulationsRes, genresRes,
        charactersRes, moodsRes
      ] = await Promise.all([
        fetch(`${nodesPath}vst-plugins.json`),
        fetch(`${nodesPath}sound-production-mechanisms.json`),
        fetch(`${nodesPath}articulations.json`),
        fetch(`${nodesPath}genres.json`),
        fetch(`${nodesPath}characters.json`),
        fetch(`${nodesPath}moods.json`)
      ]);
      
      this.data = {
        plugins: (await pluginsRes.json()).entries,
        mechanisms: (await mechanismsRes.json()).entries,
        articulations: (await articulationsRes.json()).entries,
        genres: (await genresRes.json()).entries,
        characters: (await charactersRes.json()).entries,
        moods: (await moodsRes.json()).entries
      };
      
      // Build lookup maps
      this.buildMaps();
      
      // Select first plugin by default
      if (this.data.plugins.length > 0) {
        this.selectPlugin(this.data.plugins[0].id);
      }
      
      console.log('[RadialMorphField] Data loaded:', {
        plugins: this.data.plugins.length,
        mechanisms: this.data.mechanisms.length,
        articulations: this.data.articulations.length,
        genres: this.data.genres.length,
        characters: this.data.characters.length,
        moods: this.data.moods.length
      });
    } catch (err) {
      console.error('[RadialMorphField] Failed to load data:', err);
    }
  }
  
  buildMaps() {
    // Create ID -> node maps for quick lookup
    this.mechanismsMap = new Map(this.data.mechanisms.map(n => [n.id, n]));
    this.articulationsMap = new Map(this.data.articulations.map(n => [n.id, n]));
    this.genresMap = new Map(this.data.genres.map(n => [n.id, n]));
    this.charactersMap = new Map(this.data.characters.map(n => [n.id, n]));
    this.moodsMap = new Map(this.data.moods.map(n => [n.id, n]));
    this.pluginsMap = new Map(this.data.plugins.map(n => [n.id, n]));
    
    // Position nodes on rings
    this.positionRingNodes();
  }
  
  positionRingNodes() {
    // Position each dimension's nodes evenly around their ring
    const positionOnRing = (nodes, ringRadius) => {
      const angleStep = (2 * Math.PI) / nodes.length;
      nodes.forEach((node, i) => {
        const angle = i * angleStep - Math.PI / 2; // Start from top
        node._x = this.centerX + Math.cos(angle) * ringRadius;
        node._y = this.centerY + Math.sin(angle) * ringRadius;
        node._angle = angle;
      });
    };
    
    positionOnRing(this.data.mechanisms, this.rings[0].radius);
    positionOnRing(this.data.articulations, this.rings[1].radius);
    positionOnRing(this.data.genres, this.rings[2].radius);
    positionOnRing(this.data.characters, this.rings[3].radius);
    positionOnRing(this.data.moods, this.rings[4].radius);
  }
  
  selectPlugin(pluginId) {
    this.selectedPluginId = pluginId;
    const plugin = this.pluginsMap.get(pluginId);
    
    if (plugin) {
      // Get connected nodes
      this.connectedMechanisms = new Set(plugin.mechanisms || []);
      this.connectedArticulations = new Set(plugin.supports_articulation || []);
      this.connectedGenres = new Set(plugin.typical_for_genre || []);
      this.connectedCharacters = new Set(plugin.produces_character || []);
      this.connectedMoods = new Set(plugin.evokes_mood || []);
      
      if (this.onPluginSelect) {
        this.onPluginSelect(plugin);
      }
    }
  }
  
  selectNextPlugin() {
    if (!this.data || !this.data.plugins.length) return;
    const currentIndex = this.data.plugins.findIndex(p => p.id === this.selectedPluginId);
    const nextIndex = (currentIndex + 1) % this.data.plugins.length;
    this.selectPlugin(this.data.plugins[nextIndex].id);
  }
  
  selectPrevPlugin() {
    if (!this.data || !this.data.plugins.length) return;
    const currentIndex = this.data.plugins.findIndex(p => p.id === this.selectedPluginId);
    const prevIndex = (currentIndex - 1 + this.data.plugins.length) % this.data.plugins.length;
    this.selectPlugin(this.data.plugins[prevIndex].id);
  }
  
  animate() {
    this.draw();
    this.animationId = requestAnimationFrame(() => this.animate());
  }
  
  draw() {
    if (!this.ctx || !this.data) return;
    
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);
    
    // Draw rings (background circles)
    this.drawRings();
    
    // Draw connections from center to connected nodes
    this.drawConnections();
    
    // Draw nodes on rings
    this.drawRingNodes();
    
    // Draw center (selected plugin)
    this.drawCenter();
    
    // Draw labels
    this.drawLabels();
  }
  
  drawRings() {
    const ctx = this.ctx;
    
    for (const ring of this.rings) {
      ctx.beginPath();
      ctx.arc(this.centerX, this.centerY, ring.radius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
  
  drawConnections() {
    if (!this.selectedPluginId) return;
    
    const ctx = this.ctx;
    const plugin = this.pluginsMap.get(this.selectedPluginId);
    if (!plugin) return;
    
    // Draw lines to connected nodes
    const drawLinesToConnected = (nodes, connectedSet, ringColor) => {
      for (const node of nodes) {
        if (connectedSet.has(node.id)) {
          ctx.beginPath();
          ctx.moveTo(this.centerX, this.centerY);
          ctx.lineTo(node._x, node._y);
          ctx.strokeStyle = this.highlightLinkColor;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }
    };
    
    drawLinesToConnected(this.data.mechanisms, this.connectedMechanisms, this.rings[0].color);
    drawLinesToConnected(this.data.articulations, this.connectedArticulations, this.rings[1].color);
    drawLinesToConnected(this.data.genres, this.connectedGenres, this.rings[2].color);
    drawLinesToConnected(this.data.characters, this.connectedCharacters, this.rings[3].color);
    drawLinesToConnected(this.data.moods, this.connectedMoods, this.rings[4].color);
  }
  
  drawRingNodes() {
    const ctx = this.ctx;
    
    const drawNodes = (nodes, connectedSet, ringColor, ringIndex) => {
      for (const node of nodes) {
        const isConnected = connectedSet.has(node.id);
        const isHovered = this.hoveredNode === node;
        
        const radius = isHovered ? 8 : (isConnected ? 6 : 4);
        const color = isConnected ? ringColor : this.dimColor;
        
        ctx.beginPath();
        ctx.arc(node._x, node._y, radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        
        if (isHovered || isConnected) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        
        // Draw label for hovered or connected nodes
        if (isHovered) {
          ctx.font = '12px Inter, sans-serif';
          ctx.fillStyle = '#fff';
          ctx.textAlign = 'center';
          ctx.fillText(node.name, node._x, node._y - 12);
        }
      }
    };
    
    drawNodes(this.data.mechanisms, this.connectedMechanisms, this.rings[0].color, 0);
    drawNodes(this.data.articulations, this.connectedArticulations, this.rings[1].color, 1);
    drawNodes(this.data.genres, this.connectedGenres, this.rings[2].color, 2);
    drawNodes(this.data.characters, this.connectedCharacters, this.rings[3].color, 3);
    drawNodes(this.data.moods, this.connectedMoods, this.rings[4].color, 4);
  }
  
  drawCenter() {
    if (!this.selectedPluginId) return;
    
    const ctx = this.ctx;
    const plugin = this.pluginsMap.get(this.selectedPluginId);
    if (!plugin) return;
    
    // Glow effect
    const gradient = ctx.createRadialGradient(
      this.centerX, this.centerY, 0,
      this.centerX, this.centerY, 40
    );
    gradient.addColorStop(0, 'rgba(251, 191, 36, 0.3)');
    gradient.addColorStop(1, 'rgba(251, 191, 36, 0)');
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, 40, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Center node
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, 16, 0, Math.PI * 2);
    ctx.fillStyle = this.centerColor;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Plugin name
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(plugin.name, this.centerX, this.centerY + 40);
  }
  
  drawLabels() {
    const ctx = this.ctx;
    ctx.font = '11px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    
    // Ring labels at top
    for (let i = 0; i < this.rings.length; i++) {
      const ring = this.rings[i];
      ctx.fillStyle = ring.color;
      ctx.textAlign = 'center';
      ctx.fillText(ring.label, this.centerX, this.centerY - ring.radius - 8);
    }
  }
  
  onMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if hovering over any node
    this.hoveredNode = null;
    
    const checkNodes = (nodes) => {
      for (const node of nodes) {
        const dx = x - node._x;
        const dy = y - node._y;
        if (dx * dx + dy * dy < 100) { // 10px radius
          this.hoveredNode = node;
          this.canvas.style.cursor = 'pointer';
          return true;
        }
      }
      return false;
    };
    
    if (!checkNodes(this.data.mechanisms) &&
        !checkNodes(this.data.articulations) &&
        !checkNodes(this.data.genres) &&
        !checkNodes(this.data.characters) &&
        !checkNodes(this.data.moods)) {
      this.canvas.style.cursor = 'default';
    }
    
    if (this.hoveredNode && this.onNodeHover) {
      this.onNodeHover(this.hoveredNode);
    }
  }
  
  onClick(e) {
    // Currently just logs clicked node
    if (this.hoveredNode) {
      console.log('[RadialMorphField] Clicked:', this.hoveredNode.id, this.hoveredNode.name);
    }
  }
  
  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    window.removeEventListener('resize', this.resize);
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  }
}
