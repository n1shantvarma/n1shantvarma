export interface OSAdapter {
  pressHotkey(keys: string[]): Promise<void>;
  typeText(text: string): Promise<void>;
}
