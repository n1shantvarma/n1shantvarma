import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { Key, keyboard } from '@nut-tree/nut-js';
import type { OSAdapter } from './OSAdapter';

const execAsync = promisify(exec);

export type WindowsAdapterErrorCode =
  | 'INVALID_INPUT'
  | 'UNSUPPORTED_KEY'
  | 'SHORTCUT_EXECUTION_FAILED'
  | 'TEXT_TYPING_FAILED'
  | 'COMMAND_EXECUTION_FAILED'
  | 'DELAY_FAILED';

export class WindowsAdapterError extends Error {
  public readonly code: WindowsAdapterErrorCode;
  public readonly operation: keyof OSAdapter;
  public readonly details?: unknown;

  public constructor(
    message: string,
    code: WindowsAdapterErrorCode,
    operation: keyof OSAdapter,
    details?: unknown,
  ) {
    super(message);
    this.name = 'WindowsAdapterError';
    this.code = code;
    this.operation = operation;
    this.details = details;
  }
}

const keyMap: Readonly<Record<string, Key>> = {
  alt: Key.LeftAlt,
  ctrl: Key.LeftControl,
  control: Key.LeftControl,
  shift: Key.LeftShift,
  enter: Key.Enter,
  return: Key.Enter,
  esc: Key.Escape,
  escape: Key.Escape,
  tab: Key.Tab,
  space: Key.Space,
  backspace: Key.Backspace,
  delete: Key.Delete,
  del: Key.Delete,
  insert: Key.Insert,
  home: Key.Home,
  end: Key.End,
  pageup: Key.PageUp,
  pagedown: Key.PageDown,
  up: Key.Up,
  down: Key.Down,
  left: Key.Left,
  right: Key.Right,
  win: Key.LeftSuper,
  windows: Key.LeftSuper,
  meta: Key.LeftSuper,
};

export class WindowsAdapter implements OSAdapter {
  public async executeShortcut(keys: string[]): Promise<void> {
    if (!Array.isArray(keys) || keys.length === 0) {
      throw new WindowsAdapterError(
        'Shortcut keys must be a non-empty string array.',
        'INVALID_INPUT',
        'executeShortcut',
        { keys },
      );
    }

    const mappedKeys = keys.map((rawKey) => this.mapKey(rawKey));

    try {
      await keyboard.pressKey(...mappedKeys);
      await keyboard.releaseKey(...mappedKeys.slice().reverse());
    } catch (error: unknown) {
      throw new WindowsAdapterError(
        'Failed to execute keyboard shortcut.',
        'SHORTCUT_EXECUTION_FAILED',
        'executeShortcut',
        { keys, cause: error },
      );
    }
  }

  public async typeText(text: string): Promise<void> {
    if (typeof text !== 'string') {
      throw new WindowsAdapterError(
        'Text must be a string.',
        'INVALID_INPUT',
        'typeText',
        { text },
      );
    }

    try {
      await keyboard.type(text);
    } catch (error: unknown) {
      throw new WindowsAdapterError(
        'Failed to type text.',
        'TEXT_TYPING_FAILED',
        'typeText',
        { text, cause: error },
      );
    }
  }

  public async runCommand(command: string): Promise<void> {
    if (typeof command !== 'string' || command.trim().length === 0) {
      throw new WindowsAdapterError(
        'Command must be a non-empty string.',
        'INVALID_INPUT',
        'runCommand',
        { command },
      );
    }

    try {
      await execAsync(command, {
        shell: 'cmd.exe',
        windowsHide: true,
      });
    } catch (error: unknown) {
      throw new WindowsAdapterError(
        'Failed to execute command.',
        'COMMAND_EXECUTION_FAILED',
        'runCommand',
        { command, cause: error },
      );
    }
  }

  public async delay(ms: number): Promise<void> {
    if (!Number.isFinite(ms) || ms < 0) {
      throw new WindowsAdapterError(
        'Delay duration must be a non-negative finite number.',
        'INVALID_INPUT',
        'delay',
        { ms },
      );
    }

    try {
      await new Promise<void>((resolve) => {
        setTimeout(resolve, ms);
      });
    } catch (error: unknown) {
      throw new WindowsAdapterError(
        'Failed during delay operation.',
        'DELAY_FAILED',
        'delay',
        { ms, cause: error },
      );
    }
  }

  private mapKey(rawKey: string): Key {
    if (typeof rawKey !== 'string' || rawKey.trim().length === 0) {
      throw new WindowsAdapterError(
        'Shortcut key must be a non-empty string.',
        'INVALID_INPUT',
        'executeShortcut',
        { key: rawKey },
      );
    }

    const normalizedKey = rawKey.trim().toLowerCase();

    if (/^f([1-9]|1[0-2])$/.test(normalizedKey)) {
      return Key[normalizedKey.toUpperCase() as keyof typeof Key];
    }

    if (/^[a-z]$/.test(normalizedKey)) {
      return Key[normalizedKey.toUpperCase() as keyof typeof Key];
    }

    if (/^[0-9]$/.test(normalizedKey)) {
      return Key[`Num${normalizedKey}` as keyof typeof Key];
    }

    const mappedKey = keyMap[normalizedKey];
    if (mappedKey) {
      return mappedKey;
    }

    throw new WindowsAdapterError(
      `Unsupported shortcut key: ${rawKey}`,
      'UNSUPPORTED_KEY',
      'executeShortcut',
      { key: rawKey },
    );
  }
}
