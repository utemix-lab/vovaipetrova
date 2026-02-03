import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  base: "/",
  build: {
    target: "esnext",
    rollupOptions: {
      input: {
        visitor: resolve(__dirname, "public/visitor.html"),
        lab: resolve(__dirname, "public/lab.html")
      }
    }
  },
  server: {
    // Проксировать data из соседней папки
    proxy: {
      "/data": {
        target: "http://localhost:5173",
        rewrite: (path) => path.replace(/^\/data/, "/../data")
      }
    },
    fs: {
      // Разрешить доступ к data
      allow: [".", "../data"]
    }
  }
});
