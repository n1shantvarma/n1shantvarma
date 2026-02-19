import type { OSAdapter } from './os/OSAdapter';
import {
  ActionType,
  type Action,
  type ActionStep,
  type CommandStep,
  type DelayStep,
  type ExecutionResult,
  type ShortcutStep,
  type TextStep,
} from './types';

export type ActionExecutionErrorCode =
  | 'INVALID_ACTION'
  | 'INVALID_STEP_PAYLOAD'
  | 'STEP_EXECUTION_FAILED'
  | 'UNSUPPORTED_STEP_TYPE';

class ActionExecutionError extends Error {
  public readonly code: ActionExecutionErrorCode;
  public readonly stepIndex?: number;
  public readonly stepType?: ActionType;
  public readonly details?: unknown;

  public constructor(
    message: string,
    code: ActionExecutionErrorCode,
    stepIndex?: number,
    stepType?: ActionType,
    details?: unknown,
  ) {
    super(message);
    this.name = 'ActionExecutionError';
    this.code = code;
    this.stepIndex = stepIndex;
    this.stepType = stepType;
    this.details = details;
  }
}

export class ActionExecutor {
  private readonly osAdapter: OSAdapter;

  public constructor(osAdapter: OSAdapter) {
    this.osAdapter = osAdapter;
  }

  public async execute(action: Action): Promise<ExecutionResult> {
    const startTime = Date.now();

    try {
      this.validateAction(action);

      for (const [stepIndex, step] of action.steps.entries()) {
        await this.executeStep(step, stepIndex);
      }

      return {
        success: true,
        executionTime: Date.now() - startTime,
      };
    } catch (error: unknown) {
      return {
        success: false,
        executionTime: Date.now() - startTime,
        error: this.serializeError(error),
      };
    }
  }

  private async executeStep(step: ActionStep, stepIndex: number): Promise<void> {
    try {
      switch (step.type) {
        case ActionType.SHORTCUT:
          await this.executeShortcutStep(step, stepIndex);
          return;
        case ActionType.TEXT:
          await this.executeTextStep(step, stepIndex);
          return;
        case ActionType.COMMAND:
          await this.executeCommandStep(step, stepIndex);
          return;
        case ActionType.DELAY:
          await this.executeDelayStep(step, stepIndex);
          return;
        default:
          throw new ActionExecutionError(
            'Unsupported action step type.',
            'UNSUPPORTED_STEP_TYPE',
            stepIndex,
            step.type,
            step,
          );
      }
    } catch (error: unknown) {
      if (error instanceof ActionExecutionError) {
        throw error;
      }

      throw new ActionExecutionError(
        'Action step execution failed.',
        'STEP_EXECUTION_FAILED',
        stepIndex,
        step.type,
        { cause: this.serializeUnknownError(error) },
      );
    }
  }

  private async executeShortcutStep(step: ShortcutStep, stepIndex: number): Promise<void> {
    if (!Array.isArray(step.payload.keys) || step.payload.keys.length === 0) {
      throw new ActionExecutionError(
        'Shortcut step payload must include non-empty keys array.',
        'INVALID_STEP_PAYLOAD',
        stepIndex,
        step.type,
        step.payload,
      );
    }

    await this.osAdapter.executeShortcut([...step.payload.keys]);
  }

  private async executeTextStep(step: TextStep, stepIndex: number): Promise<void> {
    if (typeof step.payload.value !== 'string') {
      throw new ActionExecutionError(
        'Text step payload must include a string value.',
        'INVALID_STEP_PAYLOAD',
        stepIndex,
        step.type,
        step.payload,
      );
    }

    if (step.payload.clearBeforeType) {
      await this.osAdapter.executeShortcut(['ctrl', 'a']);
      await this.osAdapter.executeShortcut(['delete']);
    }

    await this.osAdapter.typeText(step.payload.value);
  }

  private async executeCommandStep(step: CommandStep, stepIndex: number): Promise<void> {
    if (typeof step.payload.command !== 'string' || step.payload.command.trim().length === 0) {
      throw new ActionExecutionError(
        'Command step payload must include a non-empty command string.',
        'INVALID_STEP_PAYLOAD',
        stepIndex,
        step.type,
        step.payload,
      );
    }

    const builtCommand = this.buildCommand(step.payload.command, step.payload.args);
    await this.osAdapter.runCommand(builtCommand);
  }

  private async executeDelayStep(step: DelayStep, stepIndex: number): Promise<void> {
    if (!Number.isFinite(step.payload.durationMs) || step.payload.durationMs < 0) {
      throw new ActionExecutionError(
        'Delay step payload must include a non-negative finite durationMs.',
        'INVALID_STEP_PAYLOAD',
        stepIndex,
        step.type,
        step.payload,
      );
    }

    await this.osAdapter.delay(step.payload.durationMs);
  }

  private buildCommand(command: string, args?: readonly string[]): string {
    if (!args || args.length === 0) {
      return command;
    }

    const escapedArgs = args.map((arg) => {
      const escaped = arg.split('"').join('\\"');
      return `"${escaped}"`;
    });

    return `${command} ${escapedArgs.join(' ')}`;
  }

  private validateAction(action: Action): void {
    if (!action || typeof action.id !== 'string' || !Array.isArray(action.steps)) {
      throw new ActionExecutionError('Action payload is invalid.', 'INVALID_ACTION', undefined, undefined, action);
    }
  }

  private serializeError(error: unknown): string {
    if (error instanceof ActionExecutionError) {
      return JSON.stringify({
        name: error.name,
        message: error.message,
        code: error.code,
        stepIndex: error.stepIndex,
        stepType: error.stepType,
        details: error.details,
      });
    }

    return JSON.stringify(this.serializeUnknownError(error));
  }

  private serializeUnknownError(error: unknown): Record<string, unknown> {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
      };
    }

    return { message: 'Unknown error', error };
  }
}
