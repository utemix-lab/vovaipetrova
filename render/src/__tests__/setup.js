/**
 * Vitest setup file
 * Configures global test environment
 */

import { vi } from "vitest";

// Mock window.dispatchEvent for custom events
global.dispatchEvent = vi.fn();

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 16));
global.cancelAnimationFrame = vi.fn((id) => clearTimeout(id));
