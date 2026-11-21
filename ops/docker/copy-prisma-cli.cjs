// Build-time helper (builder stage): copy the Prisma CLI and its full dependency closure from
// the builder's node_modules into <out>/node_modules, keeping the hoisted layout.
//
// Why: `prisma migrate deploy` must run from the production image, but `prisma` is a
// devDependency of the API (so it is not part of `npm ci --omit=dev`). Installing it again
// with `npm install` inside a workspace is fragile, so we copy the exact versions that the
// lockfile already resolved - same bytes the tests and the build used.
//
//   node copy-prisma-cli.cjs /prisma-cli
const fs = require("node:fs");
const path = require("node:path");

const sourceRoot = "/app/node_modules";
const outRoot = process.argv[2];
if (!outRoot) {
  console.error("usage: node copy-prisma-cli.cjs <out-dir>");
  process.exit(2);
}

function findPackageDir(name, fromDir) {
  let dir = fromDir;
  for (;;) {
    const candidate = path.join(dir, "node_modules", name);
    if (fs.existsSync(path.join(candidate, "package.json"))) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

const seen = new Set();

function visit(name, fromDir) {
  const dir = findPackageDir(name, fromDir);
  if (!dir || seen.has(dir)) return;
  seen.add(dir);
  const pkg = JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8"));
  const deps = { ...pkg.dependencies, ...pkg.optionalDependencies };
  for (const dep of Object.keys(deps)) visit(dep, dir);
}

visit("prisma", "/app");

// Copy shallow directories first so nested node_modules end up on top of their parents.
const dirs = [...seen].sort((a, b) => a.length - b.length);
for (const dir of dirs) {
  const relative = path.relative(sourceRoot, dir);
  fs.cpSync(dir, path.join(outRoot, "node_modules", relative), { recursive: true });
}
console.log(`copied ${dirs.length} packages for the Prisma CLI`);
