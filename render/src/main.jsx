import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./architecture/dna.ts";
import { bootstrapVisitorScene } from "./bootstrap.js";
import { NodeInspector } from "./ui/node-inspector.jsx";
import { StepStatus } from "./ui/step-status.jsx";
import { FocusIndicator } from "./ui/focus-indicator.jsx";
import { SceneStackStatus } from "./ui/scene-stack-status.jsx";
import { StoryPanel } from "./ui/story-panel.jsx";
import { SystemPanel } from "./ui/system-panel.jsx";
import { ServicePanel } from "./ui/service-panel.jsx";
import { AnimatePresence } from "framer-motion";

function App() {
  const [selectedNode, setSelectedNode] = useState(null);
  const [currentStep, setCurrentStep] = useState(null);
  const [currentRoute, setCurrentRoute] = useState(null);
  const [storyWidgets, setStoryWidgets] = useState([]);
  const [activeLeverId, setActiveLeverId] = useState(null);
  const [preactivePreview, setPreactivePreview] = useState(null);
  const [focusPanel, setFocusPanel] = useState(null);
  const [sceneStack, setSceneStack] = useState([]);
  const [sceneStackIndex, setSceneStackIndex] = useState(0);

  useEffect(() => {
    bootstrapVisitorScene();
  }, []);

  useEffect(() => {
    const handler = (event) => {
      setSelectedNode(event?.detail?.node ?? null);
    };
    window.addEventListener("graph-node-selected", handler);
    return () => window.removeEventListener("graph-node-selected", handler);
  }, []);

  useEffect(() => {
    const handler = (event) => {
      setCurrentStep(event?.detail?.step ?? null);
      setCurrentRoute(event?.detail?.route ?? null);
      setStoryWidgets(event?.detail?.storyWidgets ?? []);
    };
    window.addEventListener("graph-step-changed", handler);
    return () => window.removeEventListener("graph-step-changed", handler);
  }, []);

  useEffect(() => {
    const handler = (event) => {
      setFocusPanel(event?.detail?.panelId ?? null);
    };
    window.addEventListener("graph-focus-changed", handler);
    return () => window.removeEventListener("graph-focus-changed", handler);
  }, []);

  useEffect(() => {
    const handler = (event) => {
      setSceneStack(event?.detail?.stack ?? []);
      setSceneStackIndex(event?.detail?.index ?? 0);
    };
    window.addEventListener("graph-stack-changed", handler);
    return () => window.removeEventListener("graph-stack-changed", handler);
  }, []);

  useEffect(() => {
    const handler = (event) => {
      const nodeId = event?.detail?.nodeId ?? null;
      const active = Boolean(event?.detail?.active);
      setActiveLeverId(active ? nodeId : null);
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

  return (
    <div id="react-shell" data-react="true">
      <AnimatePresence mode="wait">
        {selectedNode && <NodeInspector key={selectedNode.id} node={selectedNode} />}
      </AnimatePresence>
      <AnimatePresence mode="wait">
        {currentStep && (
          <StepStatus key={currentStep.id} step={currentStep} route={currentRoute} />
        )}
      </AnimatePresence>
      <AnimatePresence mode="wait">
        {focusPanel && <FocusIndicator key={focusPanel} focus={focusPanel} />}
      </AnimatePresence>
      <AnimatePresence mode="wait">
        {!!sceneStack.length && (
          <SceneStackStatus
            key={`${sceneStackIndex}-${sceneStack.length}`}
            stack={sceneStack}
            index={sceneStackIndex}
          />
        )}
      </AnimatePresence>
      <AnimatePresence mode="wait">
        <StoryPanel
          key={currentStep?.id || "story-panel"}
          step={currentStep}
          widgets={storyWidgets}
          activeLeverId={activeLeverId}
        />
      </AnimatePresence>
      <AnimatePresence mode="wait">
        <SystemPanel
          key={`${currentStep?.id || "system"}-${currentRoute?.title || "route"}`}
          step={currentStep}
          route={currentRoute}
          preview={preactivePreview}
        />
      </AnimatePresence>
      <AnimatePresence mode="wait">
        <ServicePanel
          key={`${currentStep?.id || "service"}-${currentRoute?.title || "route"}`}
          step={currentStep}
          route={currentRoute}
          preview={preactivePreview}
        />
      </AnimatePresence>
    </div>
  );
}

const container = document.getElementById("app");
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
