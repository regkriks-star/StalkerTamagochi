import { spawnSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";

const output = ".tmp-tests";
const compiler = "node_modules/typescript/lib/tsc.js";
const config = "tsconfig.test.json";

if (!existsSync(compiler)) {
  console.error(
    "Не найден TypeScript. Выполни `npm ci` и повтори `npm test`.",
  );
  process.exit(1);
}

rmSync(output, { recursive: true, force: true });

const compile = spawnSync(
  process.execPath,
  [compiler, "-p", config],
  { stdio: "inherit" },
);
if (compile.status !== 0) {
  rmSync(output, { recursive: true, force: true });
  process.exit(compile.status ?? 1);
}

const test = spawnSync(
  process.execPath,
  ["--test", `${output}/game.test.js`],
  { stdio: "inherit" },
);

rmSync(output, { recursive: true, force: true });
process.exit(test.status ?? 1);
