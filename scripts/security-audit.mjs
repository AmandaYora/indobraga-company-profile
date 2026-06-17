#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const npmCommand = process.env.npm_execpath
  ? { command: process.execPath, args: [process.env.npm_execpath] }
  : { command: process.platform === "win32" ? "npm.cmd" : "npm", args: [] };

// Advisories permitted to pass the gate. The TanStack history advisory is a
// long-standing, tracked finding. The vite/esbuild advisories are build-time
// only (dev-server / install-time) and are not reachable in the production
// runtime (Nitro + NestJS). The hono advisories enter only through Prisma's
// CLI/dev tooling (@prisma/client -> prisma -> @prisma/dev -> hono); they
// concern running hono AS a web server (serve-static, AWS Lambda/Edge adapters,
// CORS/body-limit middleware). This app serves via NestJS + Nitro and never
// runs a hono server, so the vulnerable code paths are unreachable in
// production. TODO: drop the vite/esbuild entries once we upgrade to vite 8 /
// patched esbuild, and the hono entries once Prisma ships @prisma/dev with
// hono > 4.12.24.
const allowedAdvisoryIds = [
  "GHSA-rmmr-r34h-pfm5", // @tanstack/history
  "GHSA-gv7w-rqvm-qjhr", // esbuild: Deno NPM_CONFIG_REGISTRY integrity (build-time)
  "GHSA-g7r4-m6w7-qqqr", // esbuild: dev-server arbitrary file read on Windows
  "GHSA-v6wh-96g9-6wx3", // vite: dev-server file serving
  "GHSA-fx2h-pf6j-xcff", // vite: dev-server file serving
  "GHSA-wwfh-h76j-fc44", // hono (Prisma tooling): serve-static path traversal on Windows
  "GHSA-j6c9-x7qj-28xf", // hono (Prisma tooling): AWS Lambda Set-Cookie merge
  "GHSA-88fw-hqm2-52qc", // hono (Prisma tooling): CORS wildcard reflects Origin with credentials
  "GHSA-rv63-4mwf-qqc2", // hono (Prisma tooling): AWS Lambda body-limit bypass
  "GHSA-wgpf-jwqj-8h8p", // hono (Prisma tooling): Lambda@Edge repeated-header drop
];
const allowedAdvisoryUrls = new Set(
  allowedAdvisoryIds.map((id) => `https://github.com/advisories/${id}`),
);
const maliciousHistoryVersions = new Set(["1.161.9", "1.161.12"]);
const tanstackIocs = [
  { label: "malicious postinstall helper", value: "router_init.js" },
  { label: "malicious setup package", value: "@tanstack/setup" },
  { label: "known exfiltration domain", value: "getsession.org" },
  { label: "known exfiltration host", value: "filev2.getsession.org" },
  { label: "known exfiltration host", value: "seed1.getsession.org" },
];

main();

function main() {
  const auditReport = runNpmAudit();
  const vulnerabilities = auditReport.vulnerabilities ?? {};
  const vulnerabilityNames = Object.keys(vulnerabilities);
  const disallowed = vulnerabilityNames.filter(
    (name) => !isAllowedAdvisory(name, vulnerabilities),
  );

  const historyVersions = findTanStackHistoryVersions();
  const maliciousVersions = [...historyVersions].filter((version) =>
    maliciousHistoryVersions.has(version),
  );
  const iocMatches = scanTanStackIocs();

  if (disallowed.length > 0 || maliciousVersions.length > 0 || iocMatches.length > 0) {
    console.error("Security audit failed.");

    if (disallowed.length > 0) {
      console.error(`Unexpected npm audit findings: ${disallowed.join(", ")}`);
    }

    if (maliciousVersions.length > 0) {
      console.error(`Blocked @tanstack/history version(s): ${maliciousVersions.join(", ")}`);
    }

    if (iocMatches.length > 0) {
      console.error("TanStack IOC matches:");
      for (const match of iocMatches) {
        console.error(`- ${match.label}: ${match.file}`);
      }
    }

    process.exit(1);
  }

  const totalFindings = auditReport.metadata?.vulnerabilities?.total ?? vulnerabilityNames.length;

  if (totalFindings > 0) {
    console.log(
      `npm audit reported ${totalFindings} finding(s), all in the allowlist (${allowedAdvisoryIds.join(", ")}).`,
    );
  } else {
    console.log("npm audit reported 0 production vulnerabilities.");
  }

  if (historyVersions.size > 0) {
    console.log(`@tanstack/history version(s) checked: ${[...historyVersions].join(", ")}.`);
  }

  console.log("TanStack IOC scan clean.");
}

function runNpmAudit() {
  const result = spawnSync(
    npmCommand.command,
    [...npmCommand.args, "audit", "--omit=dev", "--json"],
    {
      cwd: repoRoot,
      encoding: "utf8",
    },
  );

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  const payload = result.stdout.trim();

  if (!payload) {
    if (result.status === 0) {
      return { vulnerabilities: {}, metadata: { vulnerabilities: { total: 0 } } };
    }

    console.error(result.stderr.trim() || "npm audit failed without JSON output.");
    process.exit(1);
  }

  try {
    return JSON.parse(payload);
  } catch (error) {
    console.error("Unable to parse npm audit JSON output.");
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

function isAllowedAdvisory(name, vulnerabilities, seen = new Set()) {
  if (seen.has(name)) {
    return true;
  }

  const vulnerability = vulnerabilities[name];

  if (!vulnerability) {
    return false;
  }

  seen.add(name);

  if (!Array.isArray(vulnerability.via) || vulnerability.via.length === 0) {
    return false;
  }

  return vulnerability.via.every((via) => {
    if (typeof via === "string") {
      return isAllowedAdvisory(via, vulnerabilities, seen);
    }

    return typeof via?.url === "string" && allowedAdvisoryUrls.has(via.url);
  });
}

function findTanStackHistoryVersions() {
  const versions = new Set();
  const packageJsonPaths = [
    path.join(repoRoot, "apps/web/node_modules/@tanstack/history/package.json"),
    path.join(repoRoot, "node_modules/@tanstack/history/package.json"),
  ];

  for (const packageJsonPath of packageJsonPaths) {
    if (!existsSync(packageJsonPath)) {
      continue;
    }

    const packageJson = readJson(packageJsonPath);

    if (typeof packageJson?.version === "string") {
      versions.add(packageJson.version);
    }
  }

  const packageLockPath = path.join(repoRoot, "package-lock.json");

  if (existsSync(packageLockPath)) {
    const packageLock = readJson(packageLockPath);
    const packages = packageLock?.packages ?? {};

    for (const [packagePath, packageInfo] of Object.entries(packages)) {
      if (
        packagePath.endsWith("node_modules/@tanstack/history") &&
        typeof packageInfo?.version === "string"
      ) {
        versions.add(packageInfo.version);
      }
    }
  }

  return versions;
}

function scanTanStackIocs() {
  const roots = [
    path.join(repoRoot, "package-lock.json"),
    path.join(repoRoot, "apps/web/package.json"),
    path.join(repoRoot, "apps/web/node_modules/@tanstack"),
    path.join(repoRoot, "node_modules/@tanstack"),
  ];
  const matches = [];

  for (const root of roots) {
    scanPath(root, matches);
  }

  return matches;
}

function scanPath(targetPath, matches) {
  if (!existsSync(targetPath)) {
    return;
  }

  const stats = statSync(targetPath);

  if (stats.isDirectory()) {
    for (const entry of readdirSync(targetPath)) {
      if (entry === ".git" || entry === "node_modules") {
        continue;
      }

      scanPath(path.join(targetPath, entry), matches);
    }

    return;
  }

  if (!stats.isFile() || stats.size > 5_000_000) {
    return;
  }

  let content;

  try {
    content = readFileSync(targetPath, "utf8");
  } catch {
    return;
  }

  for (const ioc of tanstackIocs) {
    if (content.includes(ioc.value)) {
      matches.push({
        label: ioc.label,
        file: path.relative(repoRoot, targetPath),
      });
    }
  }
}

function readJson(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}
