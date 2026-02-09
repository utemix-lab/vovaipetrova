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
  window.dispatchEvent(new CustomEvent("graph-preview-action", { detail: { item } }));
}

function notifyPreviewHover(item, active) {
  if (!item) return;
  window.dispatchEvent(
    new CustomEvent("graph-preview-hovered", {
      detail: { item, active: Boolean(active) }
    })
  );
}

function notifyQueryClear() {
  window.dispatchEvent(new CustomEvent("graph-query-clear"));
}

function notifyQueryTagSelected(tag) {
  if (!tag) return;
  window.dispatchEvent(new CustomEvent("graph-query-tag-selected", { detail: { tag } }));
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

export function ServicePanel({
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
        title: "Service",
        subtitle: "No active step",
        detail: "",
        body: "",
        refs: []
      };
    }
    const service = step.service || {};
    const refs = Array.isArray(service.refs) ? service.refs : [];
    const actions = Array.isArray(service.actions) ? service.actions : [];
    return {
      title: service.title || service.label || "Service",
      subtitle: service.detail || step.id,
      detail: route?.title || "",
      body: service.text || "",
      refs,
      actions
    };
  }, [step, route]);

  if (!host) return null;

  const grouped = queryMode?.grouped || { service: [], model: [], method: [], other: [] };
  const externalLinks = queryMode?.externalLinks || {};
  const handleQueryItemClick = (event, item) => {
    if (event?.target?.closest("a")) return;
    if (item.kind !== "service") return;
    notifyPreviewClick({ id: item.id, label: item.title });
  };
  const renderSection = (title, items) =>
    items && items.length > 0 ? (
      <div className="query-section">
        <div className="query-section-title">{title}</div>
        {items.map((item) => (
          <div
            key={`${item.kind}-${item.id || item.title}`}
            className="query-item"
            data-item-id={item.id}
            data-item-kind={item.kind}
            role={item.kind === "service" ? "button" : undefined}
            tabIndex={item.kind === "service" ? 0 : undefined}
            onClick={(event) => handleQueryItemClick(event, item)}
            onKeyDown={(event) => {
              if (item.kind !== "service") return;
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                handleQueryItemClick(event, item);
              }
            }}
          >
            <div className="query-item-title">{item.title}</div>
            <div className="query-item-meta">
              <span>{item.kind || "item"}</span>
              <span>{item.source || "unknown"}</span>
              {item.participationLabel && (
                <span className="query-badge">
                  participates: {item.participationLabel}
                </span>
              )}
              {item.link && (
                <a
                  className="query-link"
                  href={item.link}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    ) : null;

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
      {queryMode?.active ? (
        <div className="query-mode">
          <div className="query-header">
            <span className="query-label">Query Mode</span>
            {queryMode.tag && (
              <span
                className="pointer-tag active"
                data-tag={queryMode.tag}
                role="button"
                tabIndex={0}
                onClick={() => notifyQueryTagSelected(queryMode.tag)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    notifyQueryTagSelected(queryMode.tag);
                  }
                }}
              >
                {queryMode.tag}
              </span>
            )}
            <button className="query-reset" type="button" onClick={notifyQueryClear}>
              ×
            </button>
          </div>
          <div className="query-status">{queryMode.status}</div>
          {queryMode.hint && <div className="query-hint">{queryMode.hint}</div>}
          {renderSection("Services", grouped.service)}
          {renderSection("Models", grouped.model)}
          {renderSection("Methods", grouped.method)}
          {renderSection("Other", grouped.other)}
          {(externalLinks.huggingface || externalLinks.paperswithcode) && (
            <div className="query-links">
              {externalLinks.huggingface && (
                <a
                  className="query-external"
                  href={externalLinks.huggingface}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open in Hugging Face
                </a>
              )}
              {externalLinks.paperswithcode && (
                <a
                  className="query-external"
                  href={externalLinks.paperswithcode}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open in Papers with Code
                </a>
              )}
            </div>
          )}
          {queryMode.selectedServiceItem && (
            <div className="opportunities">
              <div className="opportunities-title">You can do now</div>
              <div className="opportunity-item">
                Сделать обзор сервиса ({
                  queryMode.selectedServiceItem.name || queryMode.selectedServiceItem.id
                }) — Нэй — soon
              </div>
              <div className="opportunity-item">Собрать туториал пайплайна — Руна — soon</div>
            </div>
          )}
          {queryMode.isEmpty && <div className="query-empty">No results for this tag.</div>}
        </div>
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
            <div className="preview-list">
              {preview.previewItems.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className={`preview-service-item${
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
      {!queryMode?.active && payload.actions.length > 0 && (
        <div className="react-service-panel__actions">
          {payload.actions.map((action) => (
            <button
              key={`${action.type}-${action.id || action.label}`}
              type="button"
              className="react-service-panel__action"
              data-action-type={action.type}
              data-action-id={action.id || ""}
              onClick={() =>
                window.dispatchEvent(
                  new CustomEvent("graph-service-action", { detail: { action } })
                )
              }
            >
              {action.label || action.id || action.type}
            </button>
          ))}
        </div>
      )}
      {!queryMode?.active && payload.refs.length > 0 && (
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
