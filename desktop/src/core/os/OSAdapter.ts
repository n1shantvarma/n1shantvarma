export interface OSAdapter {
  executeShortcut(keys: string[]): Promise<void>;
  typeText(text: string): Promise<void>;
  runCommand(command: string): Promise<void>;
  delay(ms: number): Promise<void>;
}
