import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

/** Vite configuration for development and production builds */
export default defineConfig(({ command, mode }) => {
	/** Check if running in development mode */
	const isDev = command === "serve" || mode === "development";

	return {
		plugins: [
			react({
				// Enable React DevTools and better debugging in development
				jsxImportSource: undefined,
				jsxRuntime: "automatic",
			}),
		],
		define: {
			// Enable React development mode
			"process.env.NODE_ENV": JSON.stringify(isDev ? "development" : "production"),
			__DEV__: isDev,
		},
		build: {
			// For development builds, don't minify and keep source maps
			minify: isDev ? false : "esbuild",
			sourcemap: isDev ? "inline" : false,
			// Keep original variable names in development
			rollupOptions: isDev
				? {
						output: {
							manualChunks: undefined,
						},
					}
				: undefined,
		},
		server: {
			port: 3000,
			proxy: {
				"/api": {
					target: "http://localhost:3001",
					changeOrigin: true,
				},
			},
		},
		optimizeDeps: {
			// Pre-bundle React for faster development
			include: ["react", "react-dom"],
		},
	};
});
