// Serves a built frontend the way the production host does: clean URLs (a path, then path.html, then path/index.html),
// a real 404 page for anything else (the repo has no SPA catch-all), hashed assets cached for a year, and compressed
// text. The API's answers are fixed (stubs/), so every browser pointed at it, and both builds under comparison, see
// one site. No dependencies.
// usage: node serve.mjs <built folder> <port>
import { createServer } from "node:http";
import { readdirSync, readFileSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { brotliCompressSync, constants, gzipSync } from "node:zlib";

const root = resolve(process.argv[2] || "dist");
const port = Number(process.argv[3] || 4180);

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".yaml": "text/yaml; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
};
const TEXT = new Set([".html", ".js", ".mjs", ".css", ".json", ".yaml", ".xml", ".txt", ".svg"]);

/* Every file of the build by its URL path, text already compressed, so a request never pays for compression. */
const files = new Map();
function walk(dir, prefix) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    const url = `${prefix}/${entry.name}`;
    if (entry.isDirectory()) {
      walk(path, url);
      continue;
    }
    const ext = extname(entry.name).toLowerCase();
    const plain = readFileSync(path);
    const text = TEXT.has(ext);
    files.set(url, {
      type: TYPES[ext] || "application/octet-stream",
      plain,
      br: text
        ? brotliCompressSync(plain, { params: { [constants.BROTLI_PARAM_QUALITY]: 11, [constants.BROTLI_PARAM_SIZE_HINT]: plain.length } })
        : null,
      gz: text ? gzipSync(plain, { level: 9 }) : null,
    });
  }
}
walk(root, "");

/* The API's fixed answers. The README is kept as text and sent in the proxy's base64 shape. */
const stub = (name) => JSON.parse(readFileSync(new URL(`./stubs/${name}.json`, import.meta.url), "utf8"));
const features = JSON.stringify(stub("features"));
const repo = JSON.stringify(stub("repo"));
const readme = stub("readme");
const readmeReply = JSON.stringify({
  content: Buffer.from(readme.markdown.join("\n")).toString("base64"),
  encoding: "base64",
  sha: readme.sha,
  html_url: readme.html_url,
  download_url: readme.download_url,
});

/* Every other /api/* is a 404 with a JSON body, /api/limits included: the page carries on without it. */
function api(pathname) {
  if (pathname === "/api/features") return [200, features];
  if (pathname.startsWith("/api/v1/github/repo/")) return [200, repo];
  if (pathname.startsWith("/api/v1/github/readme/")) return [200, readmeReply];
  return [404, JSON.stringify({ error: "not found" })];
}

const server = createServer((req, res) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  } catch {
    res.writeHead(400).end();
    return;
  }
  const head = req.method === "HEAD";

  if (pathname.startsWith("/api/")) {
    const [status, body] = api(pathname);
    res.writeHead(status, {
      "content-type": "application/json; charset=utf-8",
      "content-length": Buffer.byteLength(body),
      "cache-control": "no-store",
    });
    res.end(head ? undefined : body);
    return;
  }

  const clean = pathname.replace(/\/+$/, "") || "/";
  const found = clean === "/" ? files.get("/index.html") : files.get(clean) ?? files.get(`${clean}.html`) ?? files.get(`${clean}/index.html`);
  const entry = found ?? files.get("/404.html");
  if (!entry) {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" }).end(head ? undefined : "not found");
    return;
  }

  const accept = String(req.headers["accept-encoding"] || "");
  let body = entry.plain;
  let encoding = null;
  if (entry.br && /\bbr\b/.test(accept)) {
    body = entry.br;
    encoding = "br";
  } else if (entry.gz && /\bgzip\b/.test(accept)) {
    body = entry.gz;
    encoding = "gzip";
  }
  const headers = {
    "content-type": entry.type,
    "content-length": body.length,
    vary: "accept-encoding",
    "cache-control": !found
      ? "no-store"
      : pathname.startsWith("/assets/")
        ? "public, max-age=31536000, immutable"
        : "public, max-age=0, must-revalidate",
  };
  if (encoding) headers["content-encoding"] = encoding;
  res.writeHead(found ? 200 : 404, headers);
  res.end(head ? undefined : body);
});

server.on("error", (error) => {
  console.error(`serve: ${error.message}`);
  process.exit(1);
});
server.listen(port, () => console.log(`serving ${root} (${files.size} files) on port ${port}`));
