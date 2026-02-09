import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { ArchProto } from "../architecture/dna.ts";

function notifyRefClick(ref) {
  if (!ref) return;
  window.dispatchEvent(new CustomEvent("graph-ref-clicked", { detail: { ref } }));
}

function ensureHost() {
  const panel = document.getElementById("service-panel");
  if (!panel) return null;
  let host = panel.querySelector(".react-service-host");
  if (!host) {
    host = document.createElement("div");
    host.className = "react-service-host";
    panel.appendChild(host);
  }
  return host;
}

export function ServicePanel({ step, route, preview = null }) {
  const [host, setHost] = useState(null);

  useEffect(() => {
    setHost(ensureHost());
  }, []);

  const payload = useMemo(() => {
    if (!step) {
      return {
        title: "Service",
        subtitle: "No active step",
        detail: "",
        body: "",
        refs: []
      };
    }
    const service = step.service || {};
    const refs = Array.isArray(service.refs) ? service.refs : [];
    return {
      title: service.title || service.label || "Service",
      subtitle: service.detail || step.id,
      detail: route?.title || "",
      body: service.text || "",
      refs
    };
  }, [step, route]);

  if (!host) return null;

  return createPortal(
    <motion.div
      className="react-service-panel"
      data-arch-layer="REFLECTION_LAYER"
      data-arch-pattern="service-panel-declarative"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <div className="react-service-panel__label">Service (React)</div>
      <div className="react-service-panel__title">{payload.title}</div>
      <div className="react-service-panel__subtitle">{payload.subtitle}</div>
      {payload.detail && <div className="react-service-panel__meta">{payload.detail}</div>}
      {preview ? (
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
            <div className="preview-list">
              {preview.previewItems.slice(0, 3).map((item) => (
                <div key={item.id} className="preview-service-item" data-item-id={item.id}>
                  {item.label || item.id}
                </div>
              ))}
            </div>
          ) : (
            <div className="preview-skeleton">
              <div className="skel skel-line"></div>
              <div className="skel skel-line short"></div>
            </div>
          )}
        </div>
      ) : (
        payload.body && <div className="react-service-panel__body">{payload.body}</div>
      )}
      {payload.refs.length > 0 && (
        <div className="react-service-panel__refs">
          {payload.refs.map((ref) => (
            <div
              key={`${ref.id || ref.label}-${ref.type || "ref"}`}
              className="react-service-panel__ref"
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
              <span className="react-service-panel__ref-type">{ref.type || "ref"}</span>
              <span className="react-service-panel__ref-label">{ref.label || ref.id}</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>,
    host
  );
}

ArchProto("REFLECTION_LAYER", [
  "Declarative service overlay",
  "Service state projection for agent"
])(ServicePanel);
