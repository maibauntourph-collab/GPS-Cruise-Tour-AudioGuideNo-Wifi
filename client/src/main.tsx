import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./styles/leaflet-custom.css";

// [적요: 앱의 진입점(Entry Point)]
// createRoot는 React 18의 새로운 렌더링 API로,
// Concurrent Mode를 활성화하여 더 나은 사용자 경험을 제공합니다.
const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
