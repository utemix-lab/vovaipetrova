import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  base: "/vovaipetrova/",
  build: {
    target: "esnext",
    rollupOptions: {
      input: {
        index: resolve(__dirname, "index.html")
      }
    }
  }
});
