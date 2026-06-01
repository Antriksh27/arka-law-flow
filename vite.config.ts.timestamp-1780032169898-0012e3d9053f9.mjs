// vite.config.ts
import { defineConfig } from "file:///C:/Users/antri/OneDrive/Desktop/MAIN/arka-law-flow-main/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/antri/OneDrive/Desktop/MAIN/arka-law-flow-main/node_modules/@vitejs/plugin-react-swc/index.mjs";
import { sentryVitePlugin } from "file:///C:/Users/antri/OneDrive/Desktop/MAIN/arka-law-flow-main/node_modules/@sentry/vite-plugin/dist/esm/index.mjs";
import path from "path";
import { componentTagger } from "file:///C:/Users/antri/OneDrive/Desktop/MAIN/arka-law-flow-main/node_modules/lovable-tagger/dist/index.js";
var __vite_injected_original_dirname = "C:\\Users\\antri\\OneDrive\\Desktop\\MAIN\\arka-law-flow-main";
var vite_config_default = defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080
  },
  build: {
    sourcemap: "hidden"
    // Recommended for Sentry
  },
  plugins: [
    react(),
    sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN
    }),
    mode === "development" && componentTagger()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    },
    dedupe: ["react", "react-dom", "react-router", "react-router-dom"]
  },
  optimizeDeps: {
    exclude: [],
    include: ["@knocklabs/react", "react", "react-dom"]
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxhbnRyaVxcXFxPbmVEcml2ZVxcXFxEZXNrdG9wXFxcXE1BSU5cXFxcYXJrYS1sYXctZmxvdy1tYWluXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxhbnRyaVxcXFxPbmVEcml2ZVxcXFxEZXNrdG9wXFxcXE1BSU5cXFxcYXJrYS1sYXctZmxvdy1tYWluXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9hbnRyaS9PbmVEcml2ZS9EZXNrdG9wL01BSU4vYXJrYS1sYXctZmxvdy1tYWluL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcbmltcG9ydCByZWFjdCBmcm9tIFwiQHZpdGVqcy9wbHVnaW4tcmVhY3Qtc3djXCI7XG5pbXBvcnQgeyBzZW50cnlWaXRlUGx1Z2luIH0gZnJvbSBcIkBzZW50cnkvdml0ZS1wbHVnaW5cIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyBjb21wb25lbnRUYWdnZXIgfSBmcm9tIFwibG92YWJsZS10YWdnZXJcIjtcblxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+ICh7XG4gIHNlcnZlcjoge1xuICAgIGhvc3Q6IFwiOjpcIixcbiAgICBwb3J0OiA4MDgwLFxuICB9LFxuICBidWlsZDoge1xuICAgIHNvdXJjZW1hcDogXCJoaWRkZW5cIiwgLy8gUmVjb21tZW5kZWQgZm9yIFNlbnRyeVxuICB9LFxuICBwbHVnaW5zOiBbXG4gICAgcmVhY3QoKSxcbiAgICBzZW50cnlWaXRlUGx1Z2luKHtcbiAgICAgIG9yZzogcHJvY2Vzcy5lbnYuU0VOVFJZX09SRyxcbiAgICAgIHByb2plY3Q6IHByb2Nlc3MuZW52LlNFTlRSWV9QUk9KRUNULFxuICAgICAgYXV0aFRva2VuOiBwcm9jZXNzLmVudi5TRU5UUllfQVVUSF9UT0tFTixcbiAgICB9KSxcbiAgICBtb2RlID09PSAnZGV2ZWxvcG1lbnQnICYmXG4gICAgY29tcG9uZW50VGFnZ2VyKCksXG4gIF0uZmlsdGVyKEJvb2xlYW4pLFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjXCIpLFxuICAgIH0sXG4gICAgZGVkdXBlOiBbXCJyZWFjdFwiLCBcInJlYWN0LWRvbVwiLCBcInJlYWN0LXJvdXRlclwiLCBcInJlYWN0LXJvdXRlci1kb21cIl0sXG4gIH0sXG4gIG9wdGltaXplRGVwczoge1xuICAgIGV4Y2x1ZGU6IFtdLFxuICAgIGluY2x1ZGU6IFsnQGtub2NrbGFicy9yZWFjdCcsICdyZWFjdCcsICdyZWFjdC1kb20nXSxcbiAgfSxcbn0pKTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBcVcsU0FBUyxvQkFBb0I7QUFDbFksT0FBTyxXQUFXO0FBQ2xCLFNBQVMsd0JBQXdCO0FBQ2pDLE9BQU8sVUFBVTtBQUNqQixTQUFTLHVCQUF1QjtBQUpoQyxJQUFNLG1DQUFtQztBQU96QyxJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLEtBQUssT0FBTztBQUFBLEVBQ3pDLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxFQUNSO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDTCxXQUFXO0FBQUE7QUFBQSxFQUNiO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUEsSUFDTixpQkFBaUI7QUFBQSxNQUNmLEtBQUssUUFBUSxJQUFJO0FBQUEsTUFDakIsU0FBUyxRQUFRLElBQUk7QUFBQSxNQUNyQixXQUFXLFFBQVEsSUFBSTtBQUFBLElBQ3pCLENBQUM7QUFBQSxJQUNELFNBQVMsaUJBQ1QsZ0JBQWdCO0FBQUEsRUFDbEIsRUFBRSxPQUFPLE9BQU87QUFBQSxFQUNoQixTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsSUFDdEM7QUFBQSxJQUNBLFFBQVEsQ0FBQyxTQUFTLGFBQWEsZ0JBQWdCLGtCQUFrQjtBQUFBLEVBQ25FO0FBQUEsRUFDQSxjQUFjO0FBQUEsSUFDWixTQUFTLENBQUM7QUFBQSxJQUNWLFNBQVMsQ0FBQyxvQkFBb0IsU0FBUyxXQUFXO0FBQUEsRUFDcEQ7QUFDRixFQUFFOyIsCiAgIm5hbWVzIjogW10KfQo=
