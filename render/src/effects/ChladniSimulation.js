/**
 * Chladni Plate Simulation
 * Симуляция фигур Хладни на Canvas
 * 
 * Формула для квадратной пластины:
 * f(x,y) = cos(n*π*x/L) * cos(m*π*y/L) - cos(m*π*x/L) * cos(n*π*y/L)
 * 
 * Режимы:
 * - "idle" — плавное облако частиц без границ
 * - "pattern" — частицы стремятся к узловым линиям
 */

export class ChladniSimulation {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    
    // Параметры
    this.particleCount = options.particleCount || 3000;
    this.particleColor = options.particleColor || "#fbbf24";
    this.speed = options.speed || 0.5;
    this.friction = options.friction || 0.95;
    
    // Параметры паттерна (m, n определяют форму)
    this.m = options.m || 3;
    this.n = options.n || 5;
    
    // Частицы
    this.particles = [];
    this.gradientField = null;
    
    // Состояние
    this.isRunning = false;
    this.animationId = null;
    
    // Режим: "idle" (облако) или "pattern" (фигура Хладни)
    this.mode = "idle";
    this.patternTimer = null;
    this.patternDuration = options.patternDuration || 6000; // мс
    
    // Центр и радиус облака (для мягких границ)
    this.centerX = 0;
    this.centerY = 0;
    this.cloudRadius = 0;
    
    this.init();
  }
  
  init() {
    this.resize();
    this.createParticles();
    this.computeGradientField();
  }
  
  resize() {
    const rect = this.canvas.getBoundingClientRect();
    // Fallback если элемент ещё не отрендерен
    const w = rect.width || 200;
    const h = rect.height || 200;
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.ctx.scale(dpr, dpr);
    this.width = w;
    this.height = h;
    this.L = Math.min(this.width, this.height);
    
    // Центр и радиус облака
    this.centerX = this.width / 2;
    this.centerY = this.height / 2;
    this.cloudRadius = Math.min(this.width, this.height) * 0.4;
  }
  
  // Функция Хладни
  chladni(x, y) {
    const { m, n, L } = this;
    const px = (x / this.width) * L;
    const py = (y / this.height) * L;
    const PI = Math.PI;
    
    return (
      Math.cos((n * PI * px) / L) * Math.cos((m * PI * py) / L) -
      Math.cos((m * PI * px) / L) * Math.cos((n * PI * py) / L)
    );
  }
  
  // Вычисляем градиентное поле для быстрого поиска направления
  computeGradientField() {
    const step = 4; // Разрешение сетки
    const cols = Math.ceil(this.width / step);
    const rows = Math.ceil(this.height / step);
    
    this.gradientField = {
      step,
      cols,
      rows,
      data: new Float32Array(cols * rows * 2) // dx, dy для каждой ячейки
    };
    
    const epsilon = 0.5;
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * step;
        const y = row * step;
        
        // Численный градиент
        const val = this.chladni(x, y);
        const dx = this.chladni(x + epsilon, y) - this.chladni(x - epsilon, y);
        const dy = this.chladni(x, y + epsilon) - this.chladni(x, y - epsilon);
        
        // Направление к узловой линии (против градиента * знак значения)
        const sign = val > 0 ? 1 : -1;
        const mag = Math.sqrt(dx * dx + dy * dy) || 1;
        
        const idx = (row * cols + col) * 2;
        this.gradientField.data[idx] = (-dx / mag) * sign;
        this.gradientField.data[idx + 1] = (-dy / mag) * sign;
      }
    }
  }
  
  createParticles() {
    this.particles = [];
    for (let i = 0; i < this.particleCount; i++) {
      // Распределяем в круглом облаке вокруг центра
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * this.cloudRadius;
      this.particles.push({
        x: this.centerX + Math.cos(angle) * radius,
        y: this.centerY + Math.sin(angle) * radius,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        alpha: 0.4 + Math.random() * 0.6
      });
    }
  }
  
  // Получить направление из градиентного поля
  getGradient(x, y) {
    const { step, cols, rows, data } = this.gradientField;
    const col = Math.floor(x / step);
    const row = Math.floor(y / step);
    
    if (col < 0 || col >= cols || row < 0 || row >= rows) {
      return { dx: 0, dy: 0 };
    }
    
    const idx = (row * cols + col) * 2;
    return {
      dx: data[idx],
      dy: data[idx + 1]
    };
  }
  
  update() {
    const { speed, friction, mode, centerX, centerY, cloudRadius } = this;
    
    for (const p of this.particles) {
      if (mode === "pattern") {
        // Режим паттерна: движение к узловым линиям
        const grad = this.getGradient(p.x, p.y);
        const noise = 0.2;
        p.vx += grad.dx * speed + (Math.random() - 0.5) * noise;
        p.vy += grad.dy * speed + (Math.random() - 0.5) * noise;
      } else {
        // Режим idle: плавное броуновское движение в облаке
        const noise = 0.15;
        p.vx += (Math.random() - 0.5) * noise;
        p.vy += (Math.random() - 0.5) * noise;
        
        // Мягкое притяжение к центру (чтобы не разлетались)
        const dx = centerX - p.x;
        const dy = centerY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > cloudRadius * 0.8) {
          // Мягкая сила возврата
          const force = (dist - cloudRadius * 0.8) * 0.002;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }
      }
      
      // Применяем трение
      p.vx *= friction;
      p.vy *= friction;
      
      // Ограничиваем скорость
      const maxSpeed = mode === "pattern" ? 3 : 1;
      const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (spd > maxSpeed) {
        p.vx = (p.vx / spd) * maxSpeed;
        p.vy = (p.vy / spd) * maxSpeed;
      }
      
      // Обновляем позицию
      p.x += p.vx;
      p.y += p.vy;
    }
  }
  
  draw() {
    const { ctx, width, height, particles, particleColor } = this;
    
    // Полностью очищаем для прозрачного фона
    ctx.clearRect(0, 0, width, height);
    
    // Рисуем частицы
    ctx.fillStyle = particleColor;
    
    for (const p of particles) {
      ctx.globalAlpha = p.alpha * 0.9;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.globalAlpha = 1;
  }
  
  animate() {
    if (!this.isRunning) return;
    
    this.update();
    this.draw();
    
    this.animationId = requestAnimationFrame(() => this.animate());
  }
  
  start() {
    if (this.isRunning) return;
    
    // Пересчитываем размеры перед стартом
    this.resize();
    this.createParticles();
    this.computeGradientField();
    
    // Начинаем в режиме idle (облако)
    this.mode = "idle";
    
    console.log("[Chladni] Starting simulation in idle mode", {
      width: this.width,
      height: this.height,
      particles: this.particles.length
    });
    
    this.isRunning = true;
    this.animate();
  }
  
  stop() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    if (this.patternTimer) {
      clearTimeout(this.patternTimer);
      this.patternTimer = null;
    }
  }
  
  // Сменить паттерн
  setPattern(m, n) {
    this.m = m;
    this.n = n;
    this.computeGradientField();
  }
  
  // Запустить формирование паттерна (по клику)
  triggerPattern() {
    // Выбираем случайный паттерн
    const patterns = [
      [2, 3], [2, 5], [3, 4], [3, 5], [3, 7],
      [4, 5], [4, 7], [5, 6], [5, 8], [6, 7],
      [2, 7], [3, 8], [4, 9], [5, 7], [6, 9]
    ];
    const [m, n] = patterns[Math.floor(Math.random() * patterns.length)];
    this.setPattern(m, n);
    
    // Переключаемся в режим паттерна
    this.mode = "pattern";
    console.log(`[Chladni] Pattern mode: m=${m}, n=${n}`);
    
    // Через время возвращаемся в idle
    if (this.patternTimer) clearTimeout(this.patternTimer);
    this.patternTimer = setTimeout(() => {
      this.mode = "idle";
      console.log("[Chladni] Back to idle mode");
    }, this.patternDuration);
  }
  
  // Для обратной совместимости
  randomPattern() {
    this.triggerPattern();
  }
  
  destroy() {
    this.stop();
    this.particles = [];
    this.gradientField = null;
  }
}
