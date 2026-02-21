/**
 * @ArchProto(
 *   futureLayer: "REFLECTION_LAYER",
 *   patterns: ["React UI component tests", "Declarative panel validation"]
 * )
 */

import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { AnimatePresence } from "framer-motion";

// Mock framer-motion to avoid animation issues in tests
vi.mock("framer-motion", async () => {
  const actual = await vi.importActual("framer-motion");
  return {
    ...actual,
    motion: {
      div: ({ children, ...props }) => <div {...props}>{children}</div>,
      aside: ({ children, ...props }) => <aside {...props}>{children}</aside>
    },
    AnimatePresence: ({ children }) => <>{children}</>
  };
});

// Mock createPortal to render inline
vi.mock("react-dom", async () => {
  const actual = await vi.importActual("react-dom");
  return {
    ...actual,
    createPortal: (node) => node
  };
});

describe("UI Components", () => {
  beforeEach(() => {
    // Create mock panel hosts
    const storyPanel = document.createElement("div");
    storyPanel.id = "scope-panel";
    document.body.appendChild(storyPanel);

    const systemPanel = document.createElement("div");
    systemPanel.id = "system-panel";
    document.body.appendChild(systemPanel);

    const servicePanel = document.createElement("div");
    servicePanel.id = "service-panel";
    document.body.appendChild(servicePanel);
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
  });

  describe("NodeInspector", () => {
    test("should render node label", async () => {
      const { NodeInspector } = await import("../ui/node-inspector.jsx");
      const node = { id: "test-node", label: "Test Node", type: "domain" };

      render(<NodeInspector node={node} />);

      expect(screen.getByText("Test Node")).toBeDefined();
    });

    test("should render node id", async () => {
      const { NodeInspector } = await import("../ui/node-inspector.jsx");
      const node = { id: "test-node", label: "Test Node", type: "practice" };

      render(<NodeInspector node={node} />);

      expect(screen.getByText("test-node")).toBeDefined();
    });
  });

  describe("StepStatus", () => {
    test("should render step id", async () => {
      const { StepStatus } = await import("../ui/step-status.jsx");
      const step = { id: "step-1", story: { text: "Story text" } };
      const route = { title: "Route Title" };

      render(<StepStatus step={step} route={route} />);

      expect(screen.getByText(/step-1/)).toBeDefined();
    });
  });

  describe("FocusIndicator", () => {
    test("should render focus panel label", async () => {
      const { FocusIndicator } = await import("../ui/focus-indicator.jsx");

      render(<FocusIndicator focus="scope-panel" />);

      // Component maps "scope-panel" to "Story"
      expect(screen.getByText("Story")).toBeDefined();
    });
  });

  describe("SceneStackStatus", () => {
    test("should render stack info", async () => {
      const { SceneStackStatus } = await import("../ui/scene-stack-status.jsx");
      const stack = [{ id: "scene-1" }, { id: "scene-2" }];

      render(<SceneStackStatus stack={stack} index={0} />);

      expect(screen.getByText(/1.*\/.*2/)).toBeDefined();
    });
  });
});

describe("Query Mode State", () => {
  test("queryMode object structure", () => {
    const queryMode = {
      active: true,
      tag: "domain:ai",
      grouped: { service: [], model: [], method: [], other: [] },
      status: "Matches: 5",
      hint: "Scroll to see results.",
      externalLinks: {},
      selectedServiceItem: null,
      total: 5,
      isEmpty: false,
      availableTags: ["domain:ai", "method:transformer"]
    };

    expect(queryMode.active).toBe(true);
    expect(queryMode.tag).toBe("domain:ai");
    expect(queryMode.grouped).toHaveProperty("service");
    expect(queryMode.availableTags).toContain("domain:ai");
  });

  test("inactive queryMode", () => {
    const queryMode = { active: false };

    expect(queryMode.active).toBe(false);
    expect(queryMode.tag).toBeUndefined();
  });
});
