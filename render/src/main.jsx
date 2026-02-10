import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./architecture/dna.ts";
import { bootstrapVisitorScene } from "./bootstrap.js";

function App() {
  useEffect(() => {
    bootstrapVisitorScene();
  }, []);

  return null;
}

const container = document.getElementById("app");
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
