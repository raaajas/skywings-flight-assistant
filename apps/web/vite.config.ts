import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, "");
  const projectId = env.VITE_FIREBASE_PROJECT_ID ?? "skywings-flight-assistant";

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: "http://127.0.0.1:5001",
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api/, `/${projectId}/us-central1/api`),
        },
      },
    },
  };
});
