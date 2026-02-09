import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { ArchProto } from "../architecture/dna.ts";

function notifyRefClick(ref) {
  if (!ref) return;
  window.dispatchEvent(new CustomEvent("graph-ref-clicked", { detail: { ref } }));
}

function notifyPreviewClick(item) {
  if (!item) return;
  window.dispatchEvent(new CustomEvent("graph-preview-item-clicked", { detail: { item } }));
  window.dispatchEvent(new CustomEvent("graph-preview-selected", { detail: { item } }));
}

function notifyPreviewHover(item, active) {
  if (!item) return;
  window.dispatchEvent(
    new CustomEvent("graph-preview-hovered", {
      detail: { item, active: Boolean(active) }
    })
  );
}

function notifyQueryTagSelected(tag) {
  if (!tag) return;
  window.dispatchEvent(new CustomEvent("graph-query-tag-selected", { detail: { tag } }));
}

function ensureHost() {
  const panel = document.getElementById("system-panel");
  if (!panel) return null;
  let host = panel.querySelector(".react-system-host");
  if (!host) {
    host = document.createElement("div");
    host.className = "react-system-host";
    panel.appendChild(host);
  }
  return host;
}

export function SystemPanel({
  step,
  route,
  preview = null,
  selectedPreviewId = null,
  queryMode = { active: false }
}) {
  const [host, setHost] = useState(null);

  useEffect(() => {
    setHost(ensureHost());
  }, []);

  const payload = useMemo(() => {
    if (!step) {
      return {
        title: "System",
        subtitle: "No active step",
        detail: "",
        body: "",
        refs: []
      };
    }
    const system = step.system || {};
    const refs = Array.isArray(system.refs) ? system.refs : [];
    return {
      title: system.title || system.label || "System",
      subtitle: system.detail || step.id,
      detail: route?.title || "",
      body: system.text || "",
      refs
    };
  }, [step, route]);

  if (!host) return null;

  const availableTags = queryMode?.availableTags || [];

  return createPortal(
    <motion.div
      className="react-system-panel"
      data-arch-layer="REFLECTION_LAYER"
      data-arch-pattern="system-panel-declarative"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <div className="react-system-panel__label">System (React)</div>
      <div className="react-system-panel__title">{payload.title}</div>
      <div className="react-system-panel__subtitle">{payload.subtitle}</div>
      {payload.detail && <div className="react-system-panel__meta">{payload.detail}</div>}
      {queryMode?.active ? (
        <>
          <div className="query-tags-block">
            {availableTags.map((tag) => (
              <span
                key={tag}
                className={`pointer-tag${tag === queryMode.tag ? " active" : ""}`}
                data-tag={tag}
                role="button"
                tabIndex={0}
                onClick={() => notifyQueryTagSelected(tag)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    notifyQueryTagSelected(tag);
                  }
                }}
              >
                {tag}
              </span>
            ))}
          </div>
          {queryMode.status && <div className="query-status">{queryMode.status}</div>}
          {queryMode.hint && <div className="query-hint">{queryMode.hint}</div>}
        </>
      ) : preview ? (
        <div className="react-panel-preview">
          <div className="preview-header">Preview — {preview.type || "Info"}</div>
          {preview.groups && preview.groups.length > 0 && (
            <div className="preview-groups">
              {preview.groups.slice(0, 3).map((group) => (
                <span key={group} className="preview-group">
                  {group}
                </span>
              ))}
            </div>
          )}
          {preview.previewItems && preview.previewItems.length > 0 ? (
            <ul className="preview-items">
              {preview.previewItems.slice(0, 3).map((item) => (
                <li
                  key={item.id}
                  className={`preview-item${
                    selectedPreviewId === item.id ? " preview-item--active" : ""
                  }`}
                  data-item-id={item.id}
                  title={item.label || item.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => notifyPreviewClick(item)}
                  onMouseEnter={() => notifyPreviewHover(item, true)}
                  onMouseLeave={() => notifyPreviewHover(item, false)}
                  onFocus={() => notifyPreviewHover(item, true)}
                  onBlur={() => notifyPreviewHover(item, false)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      notifyPreviewClick(item);
                    }
                  }}
                >
                  {item.label || item.id}
                </li>
              ))}
            </ul>
          ) : (
            <div className="preview-skeleton">
              <div className="skel skel-line"></div>
              <div className="skel skel-line short"></div>
            </div>
          )}
        </div>
      ) : (
        payload.body && <div className="react-system-panel__body">{payload.body}</div>
      )}
      {payload.refs.length > 0 && (
        <div className="react-system-panel__refs">
          {payload.refs.map((ref) => (
            <div
              key={`${ref.id || ref.label}-${ref.type || "ref"}`}
              className="react-system-panel__ref"
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
              <span className="react-system-panel__ref-type">{ref.type || "ref"}</span>
              <span className="react-system-panel__ref-label">{ref.label || ref.id}</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>,
    host
  );
}

ArchProto("REFLECTION_LAYER", [
  "Declarative system overlay",
  "System state projection for agent"
])(SystemPanel);
