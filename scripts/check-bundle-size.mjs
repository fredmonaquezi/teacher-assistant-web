import { readdir, stat } from "node:fs/promises";
import path from "node:path";

const DIST_ASSETS_DIR = process.env.BUNDLE_ASSETS_DIR || path.resolve("dist/assets");
const MAX_MAIN_JS_BYTES = Number(process.env.BUNDLE_MAX_MAIN_JS_BYTES || 530000);
const MAX_TOTAL_JS_BYTES = Number(process.env.BUNDLE_MAX_TOTAL_JS_BYTES || 780000);
const MAX_CSS_BYTES = Number(process.env.BUNDLE_MAX_CSS_BYTES || 120000);

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

const run = async () => {
  const jsAssets = await listAssetSizes(".js");
  const cssAssets = await listAssetSizes(".css");

  if (jsAssets.length === 0) {
    fail(`No JavaScript assets found in ${DIST_ASSETS_DIR}. Run the build before bundle checks.`);
  }

  const mainJs = jsAssets.find((asset) => /^index-.*\.js$/.test(asset.file)) || jsAssets[0];
  const totalJsSize = jsAssets.reduce((sum, asset) => sum + asset.size, 0);
  const largestCss = cssAssets[0] || { file: "(none)", size: 0 };

  console.log(`Main JS chunk: ${mainJs.file} (${formatKb(mainJs.size)})`);
  console.log(`Total JS size: ${formatKb(totalJsSize)}`);
  console.log(`Largest CSS chunk: ${largestCss.file} (${formatKb(largestCss.size)})`);

  if (mainJs.size > MAX_MAIN_JS_BYTES) {
    fail(
      `Main JS chunk exceeded limit: ${mainJs.file} is ${formatKb(mainJs.size)} (limit ${formatKb(MAX_MAIN_JS_BYTES)}).`
    );
  }
  if (totalJsSize > MAX_TOTAL_JS_BYTES) {
    fail(
      `Total JS size exceeded limit: ${formatKb(totalJsSize)} (limit ${formatKb(MAX_TOTAL_JS_BYTES)}).`
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
