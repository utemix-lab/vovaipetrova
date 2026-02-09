import React from "react";
import { motion } from "framer-motion";
import { ArchProto } from "../architecture/dna.ts";

export function StepStatus({ step, route }) {
  if (!step) return null;

  return (
    <motion.div
      className="react-step-status"
      data-arch-layer="REFLECTION_LAYER"
      data-arch-pattern="state-visibility"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <div className="react-step-status__label">Current Step</div>
      <div className="react-step-status__value">{step.label || step.id}</div>
      {route?.title && <div className="react-step-status__meta">{route.title}</div>}
    </motion.div>
  );
}

ArchProto("REFLECTION_LAYER", [
  "State visibility for agent context",
  "User-visible step focus",
  "Reaction surface for future homeostasis"
])(StepStatus);
