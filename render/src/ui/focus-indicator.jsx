import React from "react";
import { motion } from "framer-motion";
import { ArchProto } from "../architecture/dna.ts";

const LABELS = {
  "story-panel": "Story",
  "system-panel": "System",
  "service-panel": "Service"
};

export function FocusIndicator({ focus }) {
  if (!focus) return null;

  return (
    <motion.div
      className="react-focus-indicator"
      data-arch-layer="REFLECTION_LAYER"
      data-arch-pattern="focus-tracking"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <div className="react-focus-indicator__label">Focus</div>
      <div className="react-focus-indicator__value">{LABELS[focus] || focus}</div>
    </motion.div>
  );
}

ArchProto("REFLECTION_LAYER", [
  "Focus visibility for agent attention",
  "UI-to-agent focus mapping"
])(FocusIndicator);
