export enum ActionType {
  SHORTCUT = 'SHORTCUT',
  TEXT = 'TEXT',
  COMMAND = 'COMMAND',
  DELAY = 'DELAY',
}

export interface ShortcutPayload {
  keys: readonly string[];
}

export interface TextPayload {
  value: string;
  clearBeforeType?: boolean;
}

export interface CommandPayload {
  command: string;
  args?: readonly string[];
  cwd?: string;
  timeoutMs?: number;
}

export interface DelayPayload {
  durationMs: number;
}

export interface ActionStepBase<TType extends ActionType, TPayload> {
  type: TType;
  payload: TPayload;
}

export type ShortcutStep = ActionStepBase<ActionType.SHORTCUT, ShortcutPayload>;
export type TextStep = ActionStepBase<ActionType.TEXT, TextPayload>;
export type CommandStep = ActionStepBase<ActionType.COMMAND, CommandPayload>;
export type DelayStep = ActionStepBase<ActionType.DELAY, DelayPayload>;

export type ActionStep = ShortcutStep | TextStep | CommandStep | DelayStep;

export interface Action {
  id: string;
  steps: readonly ActionStep[];
}

export interface ExecutionResult {
  success: boolean;
  executionTime: number;
  error?: string;
}
