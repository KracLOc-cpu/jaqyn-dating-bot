import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Telegram Mini App (фронт). Бэкенд — FastAPI (см. API_FOR_FRONTEND.md).
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5180,
    strictPort: true,
  },
});
