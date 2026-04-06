import { defineConfig, loadEnv } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import path from "path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, "");
  const apiBaseUrl = env.VITE_API_BASE_URL;

  return {
    plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      proxy: apiBaseUrl
        ? {
            "/api": {
              target: apiBaseUrl,
              changeOrigin: true,
              secure: false,
            },
          }
        : undefined,
    },
  };
});
