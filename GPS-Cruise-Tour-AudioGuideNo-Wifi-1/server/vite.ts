import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";
import { ogService } from "./services/ogService";

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

export async function setupVite(app: Express, server: Server) {
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

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      let page = await vite.transformIndexHtml(url, template);

      /**
       * [마케터 쏭의 핵심 기술: 동적 메타 데이터 주입]
       * 학생 여러분, 여기가 바로 우리 앱의 첫인상을 결정하는 마법의 장소예요!
       * `vite.transformIndexHtml`이 HTML을 기본적으로 변환해주면, 
       * 우리가 만든 `ogService`가 그 속에 접속한 주소에 맞는(명소/도시) 태그를 심어준답니다.
       * 이렇게 하면 SNS에 공유했을 때 흰 화면이 아니라 멋진 명소 사진이 뜨게 되는 거죠!
       */
      page = await ogService.injectMetaTags(page, url);

      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "..", "dist");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", async (req, res) => {
    const url = req.originalUrl;
    const indexPath = path.resolve(distPath, "index.html");

    try {
      let html = await fs.promises.readFile(indexPath, "utf-8");
      // [마케터 쏭] 운영 환경에서도 SNS 공유는 소중하니까요! OG 태그를 주입해서 보냅니다.
      html = await ogService.injectMetaTags(html, url);
      res.status(200).set({ "Content-Type": "text/html" }).send(html);
    } catch (e) {
      console.error("Failed to serve index.html with OG tags:", e);
      res.sendFile(indexPath);
    }
  });
}
