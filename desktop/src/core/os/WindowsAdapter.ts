import { Logger } from "../logger";
import { OSAdapter } from "./OSAdapter";

export class WindowsAdapter implements OSAdapter {
  constructor(private readonly logger: Logger) {}

  async pressHotkey(keys: string[]): Promise<void> {
    this.logger.info(`Hotkey: ${keys.join(" + ")}`);
  }

  async typeText(text: string): Promise<void> {
    this.logger.info(`Type: ${text}`);
  }
}
