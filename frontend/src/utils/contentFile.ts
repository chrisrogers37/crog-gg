import yaml from "js-yaml";
import type { Check } from "../config/check";
import { parseContent } from "../config/contentSchema";

/**
 * A content file's text, from /content/<file>. An error status names the
 * file, so a failed section can say which one.
 */
export async function fetchContent(file: string): Promise<string> {
  const response = await fetch(`/content/${file}`);
  if (!response.ok) {
    throw new Error(`content/${file} didn't load (${response.status})`);
  }
  return response.text();
}

/**
 * A content file's text, parsed and held to `shape` (#190 M22): a syntax
 * error or a field that doesn't fit throws, naming `file`.
 */
export const parseYaml = <T>(shape: Check<T>, text: string, file: string): T =>
  parseContent(shape, yaml.load(text, { filename: file }), file);

/** /content/<file>, fetched, parsed and held to `shape`. */
export const loadContentFile = async <T>(shape: Check<T>, file: string): Promise<T> =>
  parseYaml(shape, await fetchContent(file), `content/${file}`);
