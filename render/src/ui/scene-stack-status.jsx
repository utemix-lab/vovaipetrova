import React from "react";
import { motion } from "framer-motion";
import { ArchProto } from "../architecture/dna.ts";

export function SceneStackStatus({ stack, index }) {
  if (!stack?.length) return null;
  const total = stack.length;
  const current = Math.min(index + 1, total);

  return (
    <motion.div
      className="react-stack-status"
      data-arch-layer="REFLECTION_LAYER"
      data-arch-pattern="navigation-history"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <div className="react-stack-status__label">Scene Stack</div>
      <div className="react-stack-status__value">
        {current} / {total}
      </div>
    </motion.div>
  );
}

ArchProto("REFLECTION_LAYER", [
  "Navigation history snapshot",
  "Agent-visible navigation context"
])(SceneStackStatus);
