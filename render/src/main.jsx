import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./architecture/dna.ts";
import { bootstrapVisitorScene } from "./bootstrap.js";
import { NodeInspector } from "./ui/node-inspector.jsx";
import { AnimatePresence } from "framer-motion";

function App() {
  const [selectedNode, setSelectedNode] = useState(null);

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

  return (
    <div id="react-shell" data-react="true">
      <AnimatePresence mode="wait">
        {selectedNode && <NodeInspector key={selectedNode.id} node={selectedNode} />}
      </AnimatePresence>
    </div>
  );
}

const container = document.getElementById("app");
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
