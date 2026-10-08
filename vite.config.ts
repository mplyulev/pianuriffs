import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const midiHeaders = {
  "Permissions-Policy": "midi=*, usb=*",
  "Feature-Policy": "midi *",
};

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "127.0.0.1",
    port: 3000,
    headers: midiHeaders,
  },
  preview: {
    host: "127.0.0.1",
    port: 3001,
    headers: midiHeaders,
  },
});
