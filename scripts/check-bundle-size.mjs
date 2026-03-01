import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

const DIST_ASSETS_DIR = process.env.BUNDLE_ASSETS_DIR || path.resolve("dist/assets");
const DIST_INDEX_HTML = process.env.BUNDLE_INDEX_HTML || path.resolve("dist/index.html");
// Defaults aligned with the current route-split production build.
// Still overrideable in CI via env vars.
const MAX_MAIN_JS_BYTES = Number(process.env.BUNDLE_MAX_MAIN_JS_BYTES || 700000);
const MAX_INITIAL_JS_BYTES = Number(
  process.env.BUNDLE_MAX_INITIAL_JS_BYTES || process.env.BUNDLE_MAX_TOTAL_JS_BYTES || 550000
);
const MAX_CSS_BYTES = Number(process.env.BUNDLE_MAX_CSS_BYTES || 130000);

const formatKb = (value) => `${(value / 1024).toFixed(1)} KiB`;

const fail = (message) => {
  console.error(message);
  process.exit(1);
};

const listAssetSizes = async (extension) => {
  const files = await readdir(DIST_ASSETS_DIR);
  const targetFiles = files.filter((file) => file.endsWith(extension));
  const entries = await Promise.all(
    targetFiles.map(async (file) => {
      const filePath = path.join(DIST_ASSETS_DIR, file);
      const fileStat = await stat(filePath);
      return { file, size: fileStat.size };
    })
  );
  return entries.sort((a, b) => b.size - a.size);
};

const getTagMatches = (markup, tagName) => markup.match(new RegExp(`<${tagName}\\b[^>]*>`, "g")) || [];

const getTagAttribute = (tag, attribute) => {
  const match = tag.match(new RegExp(`\\b${attribute}="([^"]+)"`));
  return match?.[1] || null;
};

const getInitialAssetFiles = async () => {
  const markup = await readFile(DIST_INDEX_HTML, "utf8");
  const scriptTags = getTagMatches(markup, "script");
  const linkTags = getTagMatches(markup, "link");

  const entryScriptFiles = scriptTags
    .filter((tag) => /\btype="module"/.test(tag))
    .map((tag) => getTagAttribute(tag, "src"))
    .filter(Boolean)
    .map((assetPath) => path.basename(assetPath));

  const modulePreloadFiles = linkTags
    .filter((tag) => /\brel="modulepreload"/.test(tag))
    .map((tag) => getTagAttribute(tag, "href"))
    .filter(Boolean)
    .map((assetPath) => path.basename(assetPath));

  return [...new Set([...entryScriptFiles, ...modulePreloadFiles])];
};

const run = async () => {
  const jsAssets = await listAssetSizes(".js");
  const cssAssets = await listAssetSizes(".css");

  if (jsAssets.length === 0) {
    fail(`No JavaScript assets found in ${DIST_ASSETS_DIR}. Run the build before bundle checks.`);
  }

  const mainJs = jsAssets.find((asset) => /^index-.*\.js$/.test(asset.file)) || jsAssets[0];
  const jsAssetByFile = new Map(jsAssets.map((asset) => [asset.file, asset]));
  const initialJsFiles = await getInitialAssetFiles();
  const initialJsAssets = initialJsFiles.map((file) => {
    const asset = jsAssetByFile.get(file);
    if (!asset) {
      fail(`Initial HTML references missing JavaScript asset: ${file}`);
    }
    return asset;
  });
  const initialJsSize = initialJsAssets.reduce((sum, asset) => sum + asset.size, 0);
  const largestCss = cssAssets[0] || { file: "(none)", size: 0 };

  console.log(`Main JS chunk: ${mainJs.file} (${formatKb(mainJs.size)})`);
  console.log(`Initial JS payload: ${formatKb(initialJsSize)} across ${initialJsAssets.length} file(s)`);
  console.log(`Largest CSS chunk: ${largestCss.file} (${formatKb(largestCss.size)})`);

  if (mainJs.size > MAX_MAIN_JS_BYTES) {
    fail(
      `Main JS chunk exceeded limit: ${mainJs.file} is ${formatKb(mainJs.size)} (limit ${formatKb(MAX_MAIN_JS_BYTES)}).`
    );
  }
  if (initialJsSize > MAX_INITIAL_JS_BYTES) {
    fail(
      `Initial JS payload exceeded limit: ${formatKb(initialJsSize)} (limit ${formatKb(MAX_INITIAL_JS_BYTES)}).`
    );
  }
  if (largestCss.size > MAX_CSS_BYTES) {
    fail(
      `Largest CSS chunk exceeded limit: ${largestCss.file} is ${formatKb(largestCss.size)} (limit ${formatKb(MAX_CSS_BYTES)}).`
    );
  }

  console.log("Bundle size checks passed.");
};

run().catch((error) => fail(error?.message || "Bundle size check failed unexpectedly."));
