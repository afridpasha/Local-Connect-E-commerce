import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          [
            "@locator/babel-jsx/dist",
            {
              env: "development",
            },
          ],
        ],
      },
    }),
  ],

  // Add this section to allow all hosts on preview
  preview: {
    host: true,          // listens on 0.0.0.0
    allowedHosts: "all", // allows any hostname, including your Render URL
    port: 4173           // optional: default Vite preview port
  },
});
