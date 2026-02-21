console.log("[DEBUG] server/vite.ts loading...");
import { Hono } from "hono";
import fs from "node:fs";
import path from "node:path";
import { createServer as createViteServer, createLogger, ViteDevServer } from "vite";
import { type Server } from "node:http";
import viteConfig from "../vite.config.ts";
import { nanoid } from "nanoid";
import { ogService } from "./services/ogService";
import { fileURLToPath } from "node:url";
import { serveStatic as honoServeStatic } from "@hono/node-server/serve-static";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Hono<any>, server: Server): Promise<ViteDevServer> {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  // Hono does not support Connect middleware directly in a way that works seamlessly with Vite's internals
  // without a wrapper AND access to raw req/res. 
  // We will return the 'vite' instance so index.ts can attach it to the raw Node server.

  app.get("*", async (c, next) => {
    const url = c.req.url;
    const { pathname } = new URL(url);

    if (pathname.startsWith("/api")) {
      return next();
    }

    try {
      const clientTemplate = path.join(__dirname, "..", "client", "index.html");
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );

      // Vite transformation
      // We use the vite instance created in this scope
      const page = await vite.transformIndexHtml(url, template);

      // OG metatags
      const finalHtml = await ogService.injectMetaTags(page, url);

      return c.html(finalHtml);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      return next();
    }
  });

  return vite;
}

export function serveStatic(app: Hono) {
  const distPath = path.resolve(__dirname, "..", "dist");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Serve static files from /assets (Vite build output)
  app.use("/assets/*", honoServeStatic({
    root: path.relative(process.cwd(), "dist")
  }));

  // Serve other root files if needed, or specific static folders
  // Note: Hono's serveStatic is relative to CWD usually.

  app.get("*", async (c, next) => {
    if (c.req.path.startsWith("/api")) {
      return next();
    }

    const indexPath = path.join(distPath, "index.html");
    try {
      let html = await fs.promises.readFile(indexPath, "utf-8");
      html = await ogService.injectMetaTags(html, c.req.url);
      return c.html(html);
    } catch (e) {
      console.error("Failed to serve index.html:", e);
      return c.text("Internal Server Error", 500);
    }
  });
}
