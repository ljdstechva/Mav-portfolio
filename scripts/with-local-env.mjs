#!/usr/bin/env node
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const envFileNames = [".env", ".env.local"];

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) return {};

  return readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .reduce((values, line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return values;

      const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (!match) return values;

      const [, key, rawValue] = match;
      let value = rawValue.trim();
      if (
        (value.startsWith("\"") && value.endsWith("\"")) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      values[key] = value;
      return values;
    }, {});
}

const command = process.argv[2];
const args = process.argv.slice(3);

if (!command) {
  console.error("Usage: node scripts/with-local-env.mjs <command> [...args]");
  process.exit(1);
}

const localEnv = envFileNames.reduce(
  (values, fileName) => ({
    ...values,
    ...parseEnvFile(resolve(process.cwd(), fileName)),
  }),
  {}
);

function resolveCommand(rawCommand, rawArgs) {
  if (rawCommand === "next") {
    return {
      command: process.execPath,
      args: [resolve(process.cwd(), "node_modules", "next", "dist", "bin", "next"), ...rawArgs],
    };
  }

  const localBin = resolve(process.cwd(), "node_modules", ".bin", rawCommand);
  if (existsSync(localBin)) {
    return { command: localBin, args: rawArgs };
  }

  return { command: rawCommand, args: rawArgs };
}

const resolvedCommand = resolveCommand(command, args);

const child = spawn(resolvedCommand.command, resolvedCommand.args, {
  env: {
    ...process.env,
    ...localEnv,
  },
  stdio: "inherit",
});

child.on("exit", (code) => {
  process.exit(code ?? 1);
});

child.on("error", (error) => {
  console.error(error.message);
  process.exit(1);
});
