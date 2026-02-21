
import { serve, getRequestListener } from "@hono/node-server";
import { setupVite, log } from "./vite";
import { createServer } from "http";
import app from "./app";

// Note: setupAuthRoutes and registerRoutes are now handled in server/app.ts


// [적요: @hono/node-server의 serve()는 내부적으로 listen을 자동 호출]
// port 옵션을 serve()에 직접 전달. 중복 listen 금지!
const PORT = Number(process.env.PORT) || 5000;

// [Fix: Race Condition] 
// Create server manually to setup Vite BEFORE listening
const server = createServer();

// We MUST await Vite setup to ensure routes are added before any request matches
setupVite(app as any, server).then((vite) => {
  const requestListener = getRequestListener(app.fetch);

  server.on("request", (req, res) => {
    vite.middlewares(req, res, () => {
      requestListener(req, res);
    });
  });

  server.listen(PORT, "0.0.0.0", () => {
    log(`Server started on port ${PORT}`, "server");
  });
});

// Removed duplicate setupVite call

// For Vercel Serverless
export default app.fetch;
