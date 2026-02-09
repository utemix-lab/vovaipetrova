import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./architecture/dna.ts";
import { bootstrapVisitorScene } from "./bootstrap.js";
import { StoryPanel } from "./ui/story-panel.jsx";
import { SystemPanel } from "./ui/system-panel.jsx";
import { ServicePanel } from "./ui/service-panel.jsx";
import { AnimatePresence } from "framer-motion";

function App() {
  const [currentStep, setCurrentStep] = useState(null);
  const [currentRoute, setCurrentRoute] = useState(null);
  const [storyWidgets, setStoryWidgets] = useState([]);
  const [activeLeverId, setActiveLeverId] = useState(null);
  const [preactivePreview, setPreactivePreview] = useState(null);
  const [selectedPreviewId, setSelectedPreviewId] = useState(null);
  const [queryMode, setQueryMode] = useState({ active: false });

  useEffect(() => {
    bootstrapVisitorScene();
  }, []);

  useEffect(() => {
    const handler = (event) => {
      setCurrentStep(event?.detail?.step ?? null);
      setCurrentRoute(event?.detail?.route ?? null);
      setStoryWidgets(event?.detail?.storyWidgets ?? []);
      setSelectedPreviewId(null);
    };
    window.addEventListener("graph-step-changed", handler);
    return () => window.removeEventListener("graph-step-changed", handler);
  }, []);

  useEffect(() => {
    const handler = (event) => {
      const nodeId = event?.detail?.nodeId ?? null;
      const active = Boolean(event?.detail?.active);
      setActiveLeverId(active ? nodeId : null);
      if (!active) {
        setSelectedPreviewId(null);
      }
    };
    window.addEventListener("graph-lever-changed", handler);
    return () => window.removeEventListener("graph-lever-changed", handler);
  }, []);

  useEffect(() => {
    const handler = (event) => {
      setPreactivePreview(event?.detail?.preview ?? null);
    };
    window.addEventListener("graph-preview-changed", handler);
    return () => window.removeEventListener("graph-preview-changed", handler);
  }, []);

  useEffect(() => {
    const handler = (event) => {
      const item = event?.detail?.item ?? null;
      setSelectedPreviewId(item?.id || null);
    };
    window.addEventListener("graph-preview-selected", handler);
    return () => window.removeEventListener("graph-preview-selected", handler);
  }, []);

  useEffect(() => {
    const handler = (event) => {
      setQueryMode(event?.detail ?? { active: false });
    };
    window.addEventListener("graph-query-mode-changed", handler);
    return () => window.removeEventListener("graph-query-mode-changed", handler);
  }, []);

  // React panels disabled - using legacy panels only
  // React components are kept in codebase for future use
  return (
    <div id="react-shell" data-react="true">
      {/* Legacy panels render in visitor.js */}
    </div>
  );
}

const container = document.getElementById("app");
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
