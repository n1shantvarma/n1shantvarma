declare const process: any;

import { ActionExecutor } from "./core/actionExecutor";
import { ConsoleLogger } from "./core/logger";
import { WindowsAdapter } from "./core/os/WindowsAdapter";
import { Action } from "./core/types";

const TEST_ACTIONS: Action[] = [
  { type: "hotkey", keys: ["Ctrl", "Shift", "S"] },
  { type: "delay", ms: 500 },
  { type: "type", text: "Hello" },
  { type: "command", command: "echo done" },
];

async function main() {
  const logger = new ConsoleLogger();
  const osAdapter = new WindowsAdapter(logger);
  const executor = new ActionExecutor(osAdapter, logger);

  const runs = 50;

  for (let i = 1; i <= runs; i += 1) {
    logger.info(`\nRun ${i}/${runs}`);

    for (const action of TEST_ACTIONS) {
      await executor.runAction(action);
    }
  }

  logger.info("\nEngine stable ✅");
}

main().catch((error) => {
  console.error("Engine unstable ❌", error);
  process.exit(1);
});
