import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  base: "/vovaipetrova/",
  build: {
    target: "esnext",
    rollupOptions: {
      input: {
        index: resolve(__dirname, "index.html"),
        visitor: resolve(__dirname, "visitor.html"),
        lab: resolve(__dirname, "lab.html"),
        system: resolve(__dirname, "system.html")
      }
    }
  }
});
