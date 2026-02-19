/**
 * ConstellationField — Instrument-centric visualization for VST graph
 * Track 6: Expressive Stacks
 * 
 * Geometry: Star field where all plugins are visible
 * - Plugins as bright stars (★)
 * - Concepts as dim stars (✦)
 * - Connections as constellation lines
 * - Hover highlights the constellation
 */

export class ConstellationField {
  constructor(container, options = {}) {
    this.container = container;
    this.canvas = null;
    this.ctx = null;
    this.data = null;
    this.selectedPluginId = null;
    this.hoveredPlugin = null;
    this.animationId = null;
    this.stars = []; // All positioned stars (plugins)
    
    // Visual settings
    this.pluginColor = '#fbbf24'; // Amber for plugins
    this.pluginHoverColor = '#fef3c7';
    this.conceptColor = 'rgba(100, 100, 100, 0.4)';
    this.linkColor = 'rgba(255, 255, 255, 0.1)';
    this.highlightLinkColor = 'rgba(251, 191, 36, 0.5)';
    
    // Callbacks
    this.onPluginSelect = options.onPluginSelect || null;
    this.onPluginHover = options.onPluginHover || null;
    
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
    
    // Reposition stars on resize
    if (this.data) {
      this.positionStars();
    }
  }
  
  async loadData() {
    try {
      const basePath = import.meta.env.BASE_URL || '/';
      const nodesPath = `${basePath}graph/catalogs/nodes/`;
      
      const pluginsRes = await fetch(`${nodesPath}vst-plugins.json`);
      this.data = {
        plugins: (await pluginsRes.json()).entries
      };
      
      // Position all plugins as stars
      this.positionStars();
      
      console.log('[ConstellationField] Data loaded:', {
        plugins: this.data.plugins.length
      });
    } catch (err) {
      console.error('[ConstellationField] Failed to load data:', err);
    }
  }
  
  positionStars() {
    if (!this.data || !this.data.plugins) return;
    
    const plugins = this.data.plugins;
    const count = plugins.length;
    
    // Calculate grid layout
    const cols = Math.ceil(Math.sqrt(count * (this.width / this.height)));
    const rows = Math.ceil(count / cols);
    
    const marginX = 80;
    const marginY = 80;
    const cellWidth = (this.width - marginX * 2) / cols;
    const cellHeight = (this.height - marginY * 2) / rows;
    
    this.stars = plugins.map((plugin, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      
      // Add some randomness for organic feel
      const jitterX = (Math.random() - 0.5) * cellWidth * 0.3;
      const jitterY = (Math.random() - 0.5) * cellHeight * 0.3;
      
      return {
        id: plugin.id,
        name: plugin.name,
        plugin: plugin,
        x: marginX + col * cellWidth + cellWidth / 2 + jitterX,
        y: marginY + row * cellHeight + cellHeight / 2 + jitterY,
        radius: 6,
        twinkle: Math.random() * Math.PI * 2 // Phase for twinkling
      };
    });
  }
  
  animate() {
    this.draw();
    this.animationId = requestAnimationFrame(() => this.animate());
  }
  
  draw() {
    if (!this.ctx || !this.data) return;
    
    const ctx = this.ctx;
    const time = Date.now() / 1000;
    
    ctx.clearRect(0, 0, this.width, this.height);
    
    // Draw connections for hovered plugin
    if (this.hoveredPlugin) {
      this.drawConnections(this.hoveredPlugin);
    }
    
    // Draw all stars (plugins)
    for (const star of this.stars) {
      const isHovered = this.hoveredPlugin === star;
      const isSelected = this.selectedPluginId === star.id;
      
      // Twinkling effect
      const twinkle = Math.sin(time * 2 + star.twinkle) * 0.3 + 0.7;
      const radius = star.radius * (isHovered ? 1.5 : 1) * twinkle;
      
      // Glow for hovered/selected
      if (isHovered || isSelected) {
        const gradient = ctx.createRadialGradient(
          star.x, star.y, 0,
          star.x, star.y, radius * 4
        );
        gradient.addColorStop(0, 'rgba(251, 191, 36, 0.4)');
        gradient.addColorStop(1, 'rgba(251, 191, 36, 0)');
        ctx.beginPath();
        ctx.arc(star.x, star.y, radius * 4, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      }
      
      // Star core
      ctx.beginPath();
      ctx.arc(star.x, star.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = isHovered ? this.pluginHoverColor : this.pluginColor;
      ctx.fill();
      
      // Label for hovered
      if (isHovered) {
        ctx.font = 'bold 13px Inter, sans-serif';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText(star.name, star.x, star.y - radius - 10);
        
        // Company name
        if (star.plugin.company) {
          ctx.font = '11px Inter, sans-serif';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.fillText(star.plugin.company, star.x, star.y - radius - 24);
        }
      }
    }
    
    // Draw title
    this.drawTitle();
  }
  
  drawConnections(star) {
    const ctx = this.ctx;
    const plugin = star.plugin;
    
    // Find similar plugins (same mechanism or genre)
    const similarStars = this.stars.filter(s => {
      if (s.id === star.id) return false;
      const otherPlugin = s.plugin;
      
      // Check mechanism overlap
      const mechOverlap = (plugin.mechanisms || []).some(m => 
        (otherPlugin.mechanisms || []).includes(m)
      );
      
      // Check genre overlap
      const genreOverlap = (plugin.typical_for_genre || []).some(g => 
        (otherPlugin.typical_for_genre || []).includes(g)
      );
      
      return mechOverlap || genreOverlap;
    });
    
    // Draw lines to similar plugins
    for (const similar of similarStars) {
      ctx.beginPath();
      ctx.moveTo(star.x, star.y);
      ctx.lineTo(similar.x, similar.y);
      ctx.strokeStyle = this.highlightLinkColor;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
  
  drawTitle() {
    const ctx = this.ctx;
    
    ctx.font = '12px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.textAlign = 'left';
    ctx.fillText(`${this.stars.length} инструментов`, 20, 30);
    
    if (this.hoveredPlugin) {
      ctx.textAlign = 'right';
      ctx.fillStyle = 'rgba(251, 191, 36, 0.8)';
      ctx.fillText('Наведите для связей', this.width - 20, 30);
    }
  }
  
  onMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if hovering over any star
    this.hoveredPlugin = null;
    
    for (const star of this.stars) {
      const dx = x - star.x;
      const dy = y - star.y;
      if (dx * dx + dy * dy < 225) { // 15px radius
        this.hoveredPlugin = star;
        this.canvas.style.cursor = 'pointer';
        
        if (this.onPluginHover) {
          this.onPluginHover(star.plugin);
        }
        return;
      }
    }
    
    this.canvas.style.cursor = 'default';
  }
  
  onClick(e) {
    if (this.hoveredPlugin) {
      this.selectedPluginId = this.hoveredPlugin.id;
      console.log('[ConstellationField] Selected:', this.hoveredPlugin.name);
      
      if (this.onPluginSelect) {
        this.onPluginSelect(this.hoveredPlugin.plugin);
      }
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
