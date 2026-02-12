/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PROJECTION TYPES
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * P3.5: TypeScript для Core
 * 
 * Типы для системы проекций.
 * 
 * ПРИНЦИП:
 * - Projection получает данные из Core
 * - Projection не хранит идентичность — только отображает
 * - Core → Projection → Renderer (никогда наоборот)
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import type { IGraphModel } from "./graph";
import type { HighlightState } from "./highlight";

/**
 * Контекст рендеринга для проекции.
 */
export interface RenderContext {
  /** Модель графа */
  readonly graph: IGraphModel;
  /** Состояние подсветки */
  readonly highlight: HighlightState;
  /** Текущая локаль */
  readonly locale: string;
  /** Дополнительные данные */
  readonly [key: string]: unknown;
}

/**
 * Абстрактный интерфейс проекции.
 */
export interface IProjection {
  /** Уникальный идентификатор проекции */
  readonly id: string;
  /** Название проекции */
  readonly name: string;
  
  /** Инициализация проекции */
  initialize(context: RenderContext): void;
  
  /** Рендеринг */
  render(context: RenderContext): void;
  
  /** Обновление при изменении состояния */
  update(context: RenderContext): void;
  
  /** Очистка ресурсов */
  dispose(): void;
}

/**
 * Реестр проекций.
 */
export interface IProjectionRegistry {
  /** Зарегистрировать проекцию */
  register(projection: IProjection): void;
  
  /** Получить проекцию по ID */
  get(id: string): IProjection | undefined;
  
  /** Получить все проекции */
  getAll(): IProjection[];
  
  /** Удалить проекцию */
  unregister(id: string): boolean;
}

/**
 * Конструктор проекции.
 */
export interface ProjectionConstructor {
  new (id: string, name: string): IProjection;
}

/**
 * Базовый класс проекции.
 */
export declare abstract class Projection implements IProjection {
  readonly id: string;
  readonly name: string;
  
  constructor(id: string, name: string);
  
  abstract initialize(context: RenderContext): void;
  abstract render(context: RenderContext): void;
  abstract update(context: RenderContext): void;
  dispose(): void;
}

/**
 * Реестр проекций.
 */
export declare class ProjectionRegistry implements IProjectionRegistry {
  register(projection: IProjection): void;
  get(id: string): IProjection | undefined;
  getAll(): IProjection[];
  unregister(id: string): boolean;
}

/**
 * Глобальный реестр проекций.
 */
export declare const projectionRegistry: ProjectionRegistry;
