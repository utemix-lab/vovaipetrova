import React from "react";
import { motion } from "framer-motion";
import { ArchProto } from "../architecture/dna.ts";

export function NodeInspector({ node }) {
  if (!node) return null;

  return (
    <motion.aside
      className="react-inspector"
      data-arch-layer="AGENT_LAYER"
      data-arch-pattern="agent-ui-interaction"
      initial={{ opacity: 0, y: -10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.98 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
    >
      <motion.div
        className="react-inspector__pulse"
        aria-hidden="true"
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 0.35, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      />
      <div className="react-inspector__title">Node Inspector</div>
      <div className="react-inspector__row">{node.label || node.id}</div>
      <div className="react-inspector__meta">{node.id}</div>
    </motion.aside>
  );
}

ArchProto("AGENT_LAYER", [
  "Agent-friendly UI components",
  "Context-aware inspection",
  "Attention-style animation"
])(NodeInspector);
