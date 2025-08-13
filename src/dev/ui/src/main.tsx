import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

/** Application entry point - renders the React app into the DOM */
const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");
ReactDOM.createRoot(rootElement).render(
	<React.StrictMode>
		<App />
	</React.StrictMode>,
);
