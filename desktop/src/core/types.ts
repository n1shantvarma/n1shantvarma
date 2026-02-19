export type HotkeyAction = { type: "hotkey"; keys: string[] };
export type DelayAction = { type: "delay"; ms: number };
export type TypeTextAction = { type: "type"; text: string };
export type CommandAction = { type: "command"; command: string };

export type Action = HotkeyAction | DelayAction | TypeTextAction | CommandAction;
