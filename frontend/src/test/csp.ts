import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * The deployed Content-Security-Policy's frame-src: the origins a page may
 * frame. Read from vercel.json on disk, since Vite won't serve a file from
 * outside frontend/. Throws if the policy or the directive is missing, so a
 * reshaped vercel.json can't make a check pass on an empty list.
 */
export function frameSrc(): string[] {
  const vercelJson = readFileSync(resolve(__dirname, "../../../vercel.json"), "utf8");
  const policy = (
    JSON.parse(vercelJson) as {
      headers: { headers: { key: string; value: string }[] }[];
    }
  ).headers
    .flatMap((rule) => rule.headers)
    .find((header) => header.key === "Content-Security-Policy")?.value;
  if (!policy) throw new Error("no Content-Security-Policy in vercel.json");
  const sources = policy
    .split(";")
    .map((directive) => directive.trim().split(/\s+/))
    .find(([name]) => name === "frame-src")
    ?.slice(1);
  if (!sources?.length) throw new Error("no frame-src in the CSP");
  return sources;
}
