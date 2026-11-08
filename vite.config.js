import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

const fromRoot = (path) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  plugins: [tailwindcss()],
  server: { port: 5173, open: true },
  build: {
    rollupOptions: {
      input: { site: fromRoot("./index.html"), admin: fromRoot("./admin.html") },
    },
  },
});
