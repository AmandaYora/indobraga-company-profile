// Container entrypoint for the single-container Indobraga image (Elcodelabs convention:
// 1 monorepo = 1 app = 1 container = 1 domain).
//
//   node entrypoint.mjs serve    run API + web behind one public port (default)
//   node entrypoint.mjs migrate  prisma migrate deploy, then exit
//   node entrypoint.mjs seed     compiled prisma seed, then exit
//
// `serve` supervises two children (NestJS API on 127.0.0.1:API_PORT, Nitro web server on
// 127.0.0.1:WEB_PORT) and a small reverse proxy on APP_PORT that mirrors the nginx routing
// of the previous bare-metal setup: /api/*, /robots.txt and /sitemap.xml go to the API,
// everything else goes to the web server. If either child dies the container exits so
// Docker (`restart: unless-stopped`) restarts the whole app - never half an app.
//
// The proxy forwards the request headers untouched. In particular it does NOT append to
// X-Forwarded-For: the API trusts exactly one proxy hop (the host nginx), so adding a hop
// here would make the throttler/audit log see the wrong client IP.

import { spawn } from "node:child_process";
import http from "node:http";

const mode = process.argv[2] ?? "serve";

const APP_ROOT = process.env.APP_ROOT ?? "/app";
const API_DIR = `${APP_ROOT}/apps/api`;
const WEB_ENTRY = `${APP_ROOT}/apps/web/.output/server/index.mjs`;

const APP_PORT = Number(process.env.APP_PORT ?? 8087);
const API_PORT = Number(process.env.INTERNAL_API_PORT ?? 3001);
const WEB_PORT = Number(process.env.INTERNAL_WEB_PORT ?? 3000);
const API_HEAP_MB = Number(process.env.API_HEAP_MB ?? 192);
const WEB_HEAP_MB = Number(process.env.WEB_HEAP_MB ?? 128);

function log(message) {
  process.stdout.write(`[entrypoint] ${message}\n`);
}

function runOnce(command, args, cwd) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd, env: process.env, stdio: "inherit" });
    child.on("error", (error) => {
      log(`failed to start ${command}: ${error.message}`);
      resolve(1);
    });
    child.on("exit", (code, signal) => resolve(code ?? (signal ? 1 : 0)));
  });
}

function isApiPath(url = "/") {
  const path = url.split("?", 1)[0];
  return (
    path === "/api" ||
    path.startsWith("/api/") ||
    path === "/robots.txt" ||
    path === "/sitemap.xml"
  );
}

function serve() {
  let shuttingDown = false;
  const children = new Map();

  const apiEnv = {
    ...process.env,
    API_HOST: "127.0.0.1",
    API_PORT: String(API_PORT),
  };
  const webEnv = {
    ...process.env,
    HOST: "127.0.0.1",
    PORT: String(WEB_PORT),
    API_INTERNAL_BASE_URL: `http://127.0.0.1:${API_PORT}`,
  };

  function start(name, args, cwd, env) {
    const child = spawn(process.execPath, args, { cwd, env, stdio: "inherit" });
    children.set(name, child);
    child.on("error", (error) => {
      log(`${name} failed to start: ${error.message}`);
      shutdown(1);
    });
    child.on("exit", (code, signal) => {
      children.delete(name);
      if (!shuttingDown) {
        log(`${name} exited unexpectedly (code=${code} signal=${signal}); stopping the container`);
        shutdown(1);
      }
    });
  }

  const agent = new http.Agent({ keepAlive: true, maxSockets: 128 });

  const proxy = http.createServer((req, res) => {
    const targetPort = isApiPath(req.url) ? API_PORT : WEB_PORT;
    const headers = { ...req.headers };
    delete headers.connection;

    const upstream = http.request(
      { host: "127.0.0.1", port: targetPort, method: req.method, path: req.url, headers, agent },
      (upstreamResponse) => {
        res.writeHead(
          upstreamResponse.statusCode ?? 502,
          upstreamResponse.statusMessage,
          upstreamResponse.headers,
        );
        upstreamResponse.pipe(res);
      },
    );

    upstream.on("error", () => {
      if (!res.headersSent) {
        res.writeHead(502, { "content-type": "text/plain; charset=utf-8" });
      }
      res.end("Bad gateway");
    });
    // Client went away (closed tab, SSE stream ended): release the upstream socket.
    res.on("close", () => upstream.destroy());

    req.pipe(upstream);
  });

  // Uploads (video up to UPLOAD_VIDEO_MAX_MB) and SSE streams must not be cut by Node defaults.
  proxy.requestTimeout = 0;
  proxy.headersTimeout = 65_000;
  proxy.keepAliveTimeout = 65_000;

  function shutdown(code) {
    if (shuttingDown) return;
    shuttingDown = true;
    log("shutting down");
    proxy.close();
    for (const child of children.values()) child.kill("SIGTERM");
    const timer = setTimeout(() => {
      for (const child of children.values()) child.kill("SIGKILL");
      process.exit(code);
    }, 10_000);
    timer.unref();
    const waitForChildren = setInterval(() => {
      if (children.size === 0) {
        clearInterval(waitForChildren);
        process.exit(code);
      }
    }, 100);
  }

  process.on("SIGTERM", () => shutdown(0));
  process.on("SIGINT", () => shutdown(0));

  start("api", [`--max-old-space-size=${API_HEAP_MB}`, "dist/src/main.js"], API_DIR, apiEnv);
  start("web", [`--max-old-space-size=${WEB_HEAP_MB}`, WEB_ENTRY], APP_ROOT, webEnv);

  proxy.listen(APP_PORT, "0.0.0.0", () => {
    log(`listening on :${APP_PORT} (api -> :${API_PORT}, web -> :${WEB_PORT})`);
  });
}

switch (mode) {
  case "serve":
    serve();
    break;
  case "migrate":
    process.exit(
      await runOnce(
        process.execPath,
        [`${APP_ROOT}/node_modules/prisma/build/index.js`, "migrate", "deploy"],
        API_DIR,
      ),
    );
    break;
  case "seed":
    process.exit(await runOnce(process.execPath, ["dist/prisma/seed.js"], API_DIR));
    break;
  default:
    log(`unknown mode "${mode}" (expected: serve | migrate | seed)`);
    process.exit(2);
}
