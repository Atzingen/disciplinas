import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";

const DISPLAY_EXTENSIONS = new Set([".css", ".html", ".js"]);
const COMBINING_VECTOR_ARROW = "\u20d7";
const SITE_ROOT = new URL("../", import.meta.url);

async function displayedFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const resource = new URL(entry.name + (entry.isDirectory() ? "/" : ""), directory);
    if (entry.isDirectory()) {
      files.push(...(await displayedFiles(resource)));
      continue;
    }

    const extension = entry.name.slice(entry.name.lastIndexOf("."));
    if (DISPLAY_EXTENSIONS.has(extension)) {
      files.push(resource);
    }
  }

  return files;
}

test("artefatos exibidos não dependem do acento vetorial sem suporte", async () => {
  const offenders = [];

  for (const file of await displayedFiles(SITE_ROOT)) {
    const contents = await readFile(file, "utf8");
    if (contents.includes(COMBINING_VECTOR_ARROW)) {
      offenders.push(file.pathname.replace(SITE_ROOT.pathname, ""));
    }
  }

  assert.deepEqual(offenders, []);
});

test("resoluções Halliday não simulam vetores com decoração CSS", async () => {
  const exerciseDirectories = [
    "halliday-21-13",
    "halliday-21-18",
    "halliday-21-34",
    "halliday-21-42",
  ];
  const offenders = [];

  for (const slug of exerciseDirectories) {
    const page = new URL("exercicios/" + slug + "/index.html", SITE_ROOT);
    const contents = await readFile(page, "utf8");
    if (contents.includes('class="vector-symbol"')) {
      offenders.push(slug);
    }
  }

  assert.deepEqual(offenders, []);
});
