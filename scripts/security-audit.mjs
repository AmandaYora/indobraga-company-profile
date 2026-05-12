#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const npmCommand = process.env.npm_execpath
  ? { command: process.execPath, args: [process.env.npm_execpath] }
  : { command: process.platform === "win32" ? "npm.cmd" : "npm", args: [] };

const allowedAdvisoryId = "GHSA-rmmr-r34h-pfm5";
const allowedAdvisoryUrl = `https://github.com/advisories/${allowedAdvisoryId}`;
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
    (name) => !isAllowedTanStackAdvisory(name, vulnerabilities),
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
      `npm audit reported ${totalFindings} TanStack advisory finding(s), all traced to ${allowedAdvisoryId}.`,
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

function isAllowedTanStackAdvisory(name, vulnerabilities, seen = new Set()) {
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
      return isAllowedTanStackAdvisory(via, vulnerabilities, seen);
    }

    return (
      via?.name === "@tanstack/history" &&
      typeof via?.url === "string" &&
      via.url === allowedAdvisoryUrl
    );
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
