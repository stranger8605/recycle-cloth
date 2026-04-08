import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      '/api/callmebot': {
        target: 'https://api.callmebot.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/callmebot/, ''),
        secure: true,
      },
      '/api/twilio': {
        target: 'https://api.twilio.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/twilio/, ''),
        secure: true,
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
