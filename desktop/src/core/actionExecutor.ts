declare const require: any;

import { ActionExecutionError } from "./errors";
import { Logger } from "./logger";
import { OSAdapter } from "./os/OSAdapter";
import { Action } from "./types";

const { exec } = require("child_process");

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class ActionExecutor {
  constructor(
    private readonly osAdapter: OSAdapter,
    private readonly logger: Logger,
  ) {}

  async runAction(action: Action): Promise<void> {
    try {
      switch (action.type) {
        case "hotkey":
          await this.osAdapter.pressHotkey(action.keys);
          return;
        case "delay":
          await delay(action.ms);
          return;
        case "type":
          await this.osAdapter.typeText(action.text);
          return;
        case "command":
          await this.runCommand(action.command);
          return;
      }
    } catch (error) {
      throw new ActionExecutionError(
        `Failed executing action: ${action.type}`,
        error,
      );
    }
  }

  private runCommand(command: string): Promise<void> {
    return new Promise((resolve, reject) => {
      exec(command, (error: any, stdout: string, stderr: string) => {
        if (error) {
          reject(error);
          return;
        }

        if (stdout.trim()) this.logger.info(stdout.trim());
        if (stderr.trim()) this.logger.error(stderr.trim());

        resolve();
      });
    });
  }
}
