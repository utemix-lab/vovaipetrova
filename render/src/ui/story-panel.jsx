import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { ArchProto } from "../architecture/dna.ts";

function notifyRefClick(ref) {
  if (!ref) return;
  window.dispatchEvent(new CustomEvent("graph-ref-clicked", { detail: { ref } }));
}

function notifyWidgetHover(item, active) {
  if (!item) return;
  window.dispatchEvent(
    new CustomEvent("graph-widget-hovered", {
      detail: { nodeId: item.id, active: Boolean(active) }
    })
  );
}

function notifyWidgetLever(item) {
  if (!item) return;
  window.dispatchEvent(
    new CustomEvent("graph-widget-lever", {
      detail: { nodeId: item.id }
    })
  );
}

function ensureHost() {
  const panel = document.getElementById("story-panel");
  if (!panel) return null;
  let host = panel.querySelector(".react-story-host");
  if (!host) {
    host = document.createElement("div");
    host.className = "react-story-host";
    panel.appendChild(host);
  }
  return host;
}

export function StoryPanel({ step, widgets = [], activeLeverId = null }) {
  const [host, setHost] = useState(null);
  const miniShapeRef = useRef(null);

  useEffect(() => {
    setHost(ensureHost());
  }, []);

  const payload = useMemo(() => {
    if (!step) {
      return {
        title: "Story",
        subtitle: "No active step",
        body: "",
        refsCount: 0,
        refs: []
      };
    }
    const story = step.story || {};
    const body = story.text || step.detail || step.description || "";
    const refs = Array.isArray(story.refs) ? story.refs : [];
    const refsCount = refs.length;
    return {
      title: step.title || step.label || "Story",
      subtitle: step.detail || step.description || step.id,
      body,
      refsCount,
      refs
    };
  }, [step]);

  const miniShape = useMemo(() => {
    if (!widgets.length) return null;
    const target = widgets.find((section) =>
      ["domain", "practice", "character"].includes(section.type)
    );
    if (!target) return null;
    const shapeMap = {
      domain: { type: "cube", hubId: "domains" },
      practice: { type: "icosa", hubId: "practices" },
      character: { type: "icosa", hubId: "characters" }
    };
    const meta = shapeMap[target.type] || { type: "cube", hubId: "story" };
    return {
      type: meta.type,
      hubId: meta.hubId,
      nodeIds: target.items.map((item) => item.id)
    };
  }, [widgets]);

  useEffect(() => {
    if (!miniShapeRef.current) return;
    if (!miniShape || !miniShape.nodeIds.length) {
      window.dispatchEvent(new CustomEvent("graph-mini-shape-host", { detail: { container: null } }));
      return;
    }
    window.dispatchEvent(
      new CustomEvent("graph-mini-shape-host", {
        detail: {
          container: miniShapeRef.current,
          type: miniShape.type,
          hubId: miniShape.hubId,
          nodeIds: miniShape.nodeIds
        }
      })
    );
    return () => {
      window.dispatchEvent(new CustomEvent("graph-mini-shape-host", { detail: { container: null } }));
    };
  }, [miniShape]);

  if (!host) return null;

  return createPortal(
    <motion.div
      className="react-story-panel"
      data-arch-layer="REFLECTION_LAYER"
      data-arch-pattern="story-panel-declarative"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <div className="react-story-panel__label">Story (React)</div>
      <div className="react-story-panel__title">{payload.title}</div>
      <div className="react-story-panel__subtitle">{payload.subtitle}</div>
      {payload.body && <div className="react-story-panel__body">{payload.body}</div>}
      {miniShape && (
        <div
          className="react-story-panel__mini-shape"
          ref={miniShapeRef}
          aria-hidden="true"
        />
      )}
      {widgets.length > 0 && (
        <div className="react-story-panel__widgets">
          {widgets.map((section) => (
            <div
              key={`${section.type}-${section.title}`}
              className="react-story-panel__widget-section"
            >
              <div className="react-story-panel__widget-title">{section.title}</div>
              <div className="react-story-panel__widget-items">
                {section.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`react-story-panel__widget${
                      activeLeverId === item.id ? " react-story-panel__widget--active" : ""
                    }`}
                    data-widget-type={section.type}
                    onClick={(event) => {
                      if (event.altKey || event.shiftKey) {
                        event.preventDefault();
                        notifyWidgetLever(item);
                        return;
                      }
                      notifyRefClick(item);
                    }}
                    onMouseEnter={() => notifyWidgetHover(item, true)}
                    onMouseLeave={() => notifyWidgetHover(item, false)}
                    onFocus={() => notifyWidgetHover(item, true)}
                    onBlur={() => notifyWidgetHover(item, false)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      {payload.refsCount > 0 && (
        <div className="react-story-panel__meta">Refs: {payload.refsCount}</div>
      )}
      {payload.refsCount > 0 && (
        <div className="react-story-panel__refs">
          {payload.refs.map((ref) => (
            <div
              key={`${ref.id || ref.label}-${ref.type || "ref"}`}
              className="react-story-panel__ref"
              data-ref-type={ref.type || "ref"}
              role="button"
              tabIndex={0}
              onClick={() => notifyRefClick(ref)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  notifyRefClick(ref);
                }
              }}
            >
              <span className="react-story-panel__ref-type">{ref.type || "ref"}</span>
              <span className="react-story-panel__ref-label">{ref.label || ref.id}</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>,
    host
  );
}

ArchProto("REFLECTION_LAYER", [
  "Declarative panel overlay",
  "Story state projection for agent"
])(StoryPanel);
