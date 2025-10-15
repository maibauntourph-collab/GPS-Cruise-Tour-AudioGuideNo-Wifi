import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./styles/leaflet-custom.css";

// Fix HMR React instance issues by ensuring single React instance globally
if (typeof window !== 'undefined') {
  (window as any).React = React;
  (window as any).ReactDOM = ReactDOM;
}

createRoot(document.getElementById("root")!).render(<App />);
